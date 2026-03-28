import React, { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { sessionService } from "../../services/apiService";
import SessionDetailModal from "../SessionDetailModal";
import "./CalendarView.css";

const COLOR_PALETTE = [
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#4facfe",
  "#00f2fe",
  "#43e97b",
  "#fa709a",
  "#fee140",
  "#30b0fe",
  "#a8edea",
];

const CalendarView = () => {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [subjects, setSubjects] = useState({});

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sessionService.list();
      const sessionsList = Array.isArray(response.data)
        ? response.data
        : response.data.results;
      setSessions(sessionsList);

      // Build subject color map
      const subjectMap = {};
      sessionsList.forEach((session, idx) => {
        subjectMap[session.subject_id] = {
          name: session.subject_name,
          color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
        };
      });
      setSubjects(subjectMap);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    // Convert sessions to FullCalendar events
    const calendarEvents = sessions.map((session, idx) => {
      const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
      return {
        id: session.id,
        title: session.subject_name,
        start: session.start_time,
        end: new Date(
          new Date(session.start_time).getTime() +
            session.duration_minutes * 60000,
        ).toISOString(),
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          sessionId: session.id,
          status: session.status,
          duration: session.duration_minutes,
          notes: session.notes,
        },
      };
    });
    setEvents(calendarEvents);
  }, [sessions]);

  const handleEventClick = (info) => {
    const session = sessions.find((s) => s.id === info.event.id);
    setSelectedSession(session);
    setShowModal(true);
  };

  const handleEventDrop = async (info) => {
    try {
      const session = sessions.find((s) => s.id === info.event.id);
      const updatedData = {
        ...session,
        start_time: info.event.start.toISOString(),
      };

      await sessionService.update(session.id, updatedData);
      fetchSessions();
    } catch (err) {
      console.error("Error updating session:", err);
      info.revert(); // Revert the drag if it fails
    }
  };

  const handleEventResize = async (info) => {
    try {
      const session = sessions.find((s) => s.id === info.event.id);
      const newDuration = Math.round(
        (info.event.end - info.event.start) / (1000 * 60),
      );

      const updatedData = {
        ...session,
        duration_minutes: newDuration,
      };

      await sessionService.update(session.id, updatedData);
      fetchSessions();
    } catch (err) {
      console.error("Error updating session:", err);
      info.revert();
    }
  };

  const handleSessionUpdated = () => {
    fetchSessions();
    setShowModal(false);
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2>📅 Calendar View</h2>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="refresh-btn"
        >
          🔄 Refresh
        </button>
      </div>

      {loading && <div className="loading">Loading calendar...</div>}

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
          editable={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="auto"
          contentHeight="auto"
        />
      </div>

      <div className="calendar-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          {Object.entries(subjects).map(([id, subject]) => (
            <div key={id} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: subject.color }}
              />
              <span>{subject.name}</span>
            </div>
          ))}
        </div>
      </div>

      {showModal && selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setShowModal(false)}
          onUpdated={handleSessionUpdated}
        />
      )}
    </div>
  );
};

export default CalendarView;
