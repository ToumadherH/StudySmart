import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { AlertMessage, LoadingState } from "../components/ui/Feedback";
import "./Calendar.css";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError("");
      const [sessionsRes, subjectsRes] = await Promise.all([
        api.get("/sessions/").catch(() => ({ data: { results: [] } })),
        api.get("/subjects/").catch(() => ({ data: { results: [] } })),
      ]);

      const sessionsData = sessionsRes.data.results || sessionsRes.data || [];
      const subjectsData = subjectsRes.data.results || subjectsRes.data || [];

      // Convert sessions to FullCalendar events
      const sessionEvents = sessionsData.map((session) => {
        const subjectName = session.subject?.name || "Study Session";
        const isCompleted = session.status === "completed";
        return {
          id: `session-${session.id}`,
          title: subjectName,
          start: session.start_time,
          end: session.end_time,
          backgroundColor: isCompleted ? "#49b48f" : "#00a385",
          borderColor: isCompleted ? "#49b48f" : "#00a385",
          extendedProps: {
            type: "session",
            sessionId: session.id,
            subjectId: session.subject?.id,
            status: session.status,
          },
        };
      });

      // Add exam dates as events
      const examEvents = subjectsData.map((subject) => ({
        id: `exam-${subject.id}`,
        title: `${subject.name} Exam`,
        start: subject.exam_date,
        allDay: true,
        backgroundColor: "#d16666",
        borderColor: "#d16666",
        extendedProps: {
          type: "exam",
          subjectId: subject.id,
        },
      }));

      setEvents([...sessionEvents, ...examEvents]);
    } catch {
      setError("We could not load calendar data right now.");
    } finally {
      setLoading(false);
    }
  };

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

    try {
      const newStatus =
        selectedEvent.status === "completed" ? "planned" : "completed";
      await api.patch(`/sessions/${selectedEvent.sessionId}/`, {
        status: newStatus,
      });
      fetchCalendarData();
      setSelectedEvent(null);
    } catch (err) {
      console.error("Failed to update session:", err);
    }
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

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
              <h3>{selectedEvent.title}</h3>
              <button className="close-btn" onClick={closeModal} aria-label="Close event dialog">
                X
              </button>
            </div>
            <div className="event-modal-body">
              <p>
                <strong>Date:</strong>{" "}
                {selectedEvent.start?.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {selectedEvent.type === "session" && selectedEvent.end && (
                <p>
                  <strong>Time:</strong>{" "}
                  {selectedEvent.start?.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {selectedEvent.end?.toLocaleTimeString("en-US", {
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
            </div>
            {selectedEvent.type === "session" && (
              <div className="event-modal-footer">
                <Button
                  className={`toggle-btn ${selectedEvent.status === "completed" ? "mark-incomplete" : "mark-complete"}`}
                  onClick={handleToggleComplete}
                  variant={selectedEvent.status === "completed" ? "secondary" : "primary"}
                >
                  {selectedEvent.status === "completed"
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
