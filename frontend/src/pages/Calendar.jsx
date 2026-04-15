import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { AlertMessage, LoadingState } from "../components/ui/Feedback";
import { publishSessionProgressUpdated } from "../services/sessionSync";
import "./Calendar.css";

const normalizeToArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const toLocalDayStart = (value) => {
  const normalizedDate = normalizeDate(value);
  if (!normalizedDate) {
    return null;
  }

  return new Date(
    normalizedDate.getFullYear(),
    normalizedDate.getMonth(),
    normalizedDate.getDate(),
  );
};

const isFutureSessionDate = (value) => {
  const sessionLocalDate = toLocalDayStart(value);
  if (!sessionLocalDate) {
    return false;
  }

  const now = new Date();
  const todayLocalDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return sessionLocalDate > todayLocalDate;
};

const mapSessionToEvent = (session) => {
  if (!session?.id || !session?.start_time) {
    return null;
  }

  const subjectName = session.subject?.name || "Study Session";
  const isCompleted = session.completed === true || session.status === "completed";

  return {
    id: `session-${session.id}`,
    title: subjectName,
    start: session.start_time,
    end: session.end_time || undefined,
    classNames: [
      "session-event",
      isCompleted ? "session-event--completed" : "session-event--incomplete",
    ],
    extendedProps: {
      type: "session",
      sessionId: session.id,
      subjectId: session.subject_id ?? session.subject?.id,
      status: session.status,
    },
  };
};

const mapExamToEvent = (subject) => {
  if (!subject?.id || !subject?.exam_date) {
    return null;
  }

  return {
    id: `exam-${subject.id}`,
    title: `${subject.name || "Subject"} Exam`,
    start: subject.exam_date,
    allDay: true,
    classNames: ["session-event", "session-event--exam"],
    backgroundColor: "#d16666",
    borderColor: "#d16666",
    extendedProps: {
      type: "exam",
      subjectId: subject.id,
    },
  };
};

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [sessionsRes, subjectsRes] = await Promise.all([
        api.get("/sessions/").catch(() => ({ data: { results: [] } })),
        api.get("/subjects/").catch(() => ({ data: { results: [] } })),
      ]);

      const sessionsData = normalizeToArray(sessionsRes.data);
      const subjectsData = normalizeToArray(subjectsRes.data);

      const sessionEvents = sessionsData.map(mapSessionToEvent).filter(Boolean);
      const examEvents = subjectsData.map(mapExamToEvent).filter(Boolean);

      setEvents([...sessionEvents, ...examEvents]);
    } catch {
      setError("We could not load calendar data right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const handleEventClick = (clickInfo) => {
    const { extendedProps } = clickInfo.event;
    setSelectedEvent({
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      ...extendedProps,
    });
  };

  const handleToggleComplete = async () => {
    if (!selectedEvent || selectedEvent.type !== "session") return;

    const newStatus =
      selectedEvent.status === "completed" ? "planned" : "completed";

    if (newStatus === "completed" && isFutureSessionDate(selectedEvent.start)) {
      window.alert("You cannot complete a future session");
      return;
    }

    setStatusUpdating(true);
    setError("");

    try {
      const response = await api.patch(`/sessions/${selectedEvent.sessionId}/`, {
        status: newStatus,
      });

      const updatedSession = response.data || {};
      const updatedStatus = updatedSession.status || newStatus;

      publishSessionProgressUpdated({
        dashboard_stats: updatedSession.dashboard_stats,
        session_id: updatedSession.id || selectedEvent.sessionId,
        subject_id: updatedSession.subject_id || selectedEvent.subjectId,
        status: updatedStatus,
        completed: updatedStatus === "completed",
      });

      await fetchCalendarData();
      setSelectedEvent(null);
    } catch (err) {
      console.error("Failed to update session:", err);
      setError("Failed to update session status. Please try again.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  const selectedStart = normalizeDate(selectedEvent?.start);
  const selectedEnd = normalizeDate(selectedEvent?.end);
  const selectedSessionIsFuture =
    selectedEvent?.type === "session" && isFutureSessionDate(selectedEvent?.start);
  const completionBlocked = selectedSessionIsFuture && selectedEvent?.status !== "completed";

  if (loading) {
    return <LoadingState title="Loading calendar" description="Gathering sessions and exam events." />;
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">Review upcoming sessions and exam dates in one timeline.</p>
      </header>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}

      <Card elevated>
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-color session"></span>
            <span>Study Session</span>
          </div>
          <div className="legend-item">
            <span className="legend-color completed"></span>
            <span>Completed</span>
          </div>
          <div className="legend-item">
            <span className="legend-color exam"></span>
            <span>Exam Date</span>
          </div>
        </div>

        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            weekends={true}
            nowIndicator={true}
            dayMaxEvents={3}
          />
        </div>
      </Card>

      {selectedEvent && (
        <div className="event-modal-overlay" onClick={closeModal}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Event details">
            <div className="event-modal-header">
              <h3 className={selectedEvent.status === "completed" ? "event-title-completed" : ""}>
                {selectedEvent.status === "completed" ? "✓ " : ""}
                {selectedEvent.title}
              </h3>
              <button className="close-btn" onClick={closeModal} aria-label="Close event dialog">
                X
              </button>
            </div>
            <div className="event-modal-body">
              <p>
                <strong>Date:</strong>{" "}
                {selectedStart
                  ? selectedStart.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not available"}
              </p>
              {selectedEvent.type === "session" && selectedStart && selectedEnd && (
                <p>
                  <strong>Time:</strong>{" "}
                  {selectedStart.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {selectedEnd.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              {selectedEvent.type === "session" && (
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      selectedEvent.status === "completed"
                        ? "status-completed"
                        : selectedEvent.status === "in_progress"
                          ? "status-in-progress"
                        : "status-pending"
                    }
                  >
                    {selectedEvent.status === "completed"
                      ? "Completed"
                      : selectedEvent.status === "in_progress"
                        ? "In Progress"
                        : "Planned"}
                  </span>
                </p>
              )}
              {completionBlocked ? (
                <p className="future-session-hint" title="Available on session date">
                  Available on session date
                </p>
              ) : null}
            </div>
            {selectedEvent.type === "session" && (
              <div className="event-modal-footer">
                <Button
                  className={`toggle-btn ${selectedEvent.status === "completed" ? "mark-incomplete" : "mark-complete"} ${completionBlocked ? "toggle-btn--blocked" : ""}`}
                  onClick={handleToggleComplete}
                  variant={selectedEvent.status === "completed" ? "secondary" : "primary"}
                  disabled={statusUpdating || completionBlocked}
                  title={completionBlocked ? "Available on session date" : undefined}
                >
                  {statusUpdating
                    ? "Updating..."
                    : selectedEvent.status === "completed"
                      ? "Mark as Incomplete"
                      : "Mark as Complete"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
