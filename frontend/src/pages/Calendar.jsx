import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Calendar.css";

const Calendar = () => {
  const { logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, subjectsRes] = await Promise.all([
        api.get("/sessions/").catch(() => ({ data: { results: [] } })),
        api.get("/subjects/").catch(() => ({ data: { results: [] } })),
      ]);

      const sessionsData = sessionsRes.data.results || sessionsRes.data || [];
      const subjectsData = subjectsRes.data.results || subjectsRes.data || [];

      setSubjects(subjectsData);

      // Convert sessions to FullCalendar events
      const sessionEvents = sessionsData.map((session) => {
        const subject = subjectsData.find((s) => s.id === session.subject);
        const isCompleted = session.status === "completed";
        return {
          id: `session-${session.id}`,
          title: subject?.name || "Study Session",
          start: session.start_time,
          end: session.end_time,
          backgroundColor: isCompleted ? "#48bb78" : "#667eea",
          borderColor: isCompleted ? "#38a169" : "#5a67d8",
          extendedProps: {
            type: "session",
            sessionId: session.id,
            subjectId: session.subject,
            status: session.status,
          },
        };
      });

      // Add exam dates as events
      const examEvents = subjectsData.map((subject) => ({
        id: `exam-${subject.id}`,
        title: `📝 ${subject.name} Exam`,
        start: subject.exam_date,
        allDay: true,
        backgroundColor: "#e53e3e",
        borderColor: "#c53030",
        extendedProps: {
          type: "exam",
          subjectId: subject.id,
        },
      }));

      setEvents([...sessionEvents, ...examEvents]);
    } catch (err) {
      console.error("Failed to fetch calendar data:", err);
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

  const handleLogout = async () => {
    await logout();
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <div className="calendar-loading">
        <div className="spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <header className="calendar-header">
        <div className="header-left">
          <h1>Study Calendar</h1>
          <p>View and manage your study sessions</p>
        </div>
        <div className="header-right">
          <nav className="calendar-nav">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/planning" className="nav-link">
              Planning
            </Link>
            <Link to="/subjects" className="nav-link">
              Subjects
            </Link>
          </nav>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="calendar-content">
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
      </main>

      {selectedEvent && (
        <div className="event-modal-overlay" onClick={closeModal}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h3>{selectedEvent.title}</h3>
              <button className="close-btn" onClick={closeModal}>
                &times;
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
                <button
                  className={`toggle-btn ${selectedEvent.status === "completed" ? "mark-incomplete" : "mark-complete"}`}
                  onClick={handleToggleComplete}
                >
                  {selectedEvent.status === "completed"
                    ? "Mark as Incomplete"
                    : "Mark as Complete"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
