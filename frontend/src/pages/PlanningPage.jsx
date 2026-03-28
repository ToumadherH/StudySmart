import React, { useState, useEffect } from "react";
import {
  sessionService,
  planningService,
  subjectService,
} from "../services/apiService";
import CalendarView from "../components/Calendar/CalendarView";
import ErrorBanner from "../components/ErrorBanner";
import { formatApiError } from "../utils/formatApiError";
import "./PlanningPage.css";

const PlanningPage = () => {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterSubject, setFilterSubject] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'
  const [formData, setFormData] = useState({
    subject_id: "",
    start_time: "",
    duration_minutes: 60,
    notes: "",
  });

  // Fetch sessions and subjects on mount
  useEffect(() => {
    fetchSessions();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.list();
      const subjectsList = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setSubjects(subjectsList);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setSubjects([]);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionService.list();
      const sessionsList = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setSessions(sessionsList);
      setErrorInfo(null);
    } catch (err) {
      setErrorInfo(
        formatApiError(err, {
          fallbackMessage:
            "Could not load sessions. Check your connection and that the server is running, then use Refresh.",
        }),
      );
      console.error(err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlanning = async () => {
    try {
      setLoading(true);
      const response = await planningService.generate(2, 10);
      fetchSessions(); // Refresh the list
      alert(
        `Planning generated successfully! Created ${response.data.total_sessions_created} sessions`,
      );
    } catch (err) {
      setErrorInfo(
        formatApiError(err, {
          fallbackMessage:
            "Could not generate planning. Add at least one subject with an exam date, then try again.",
        }),
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await sessionService.create(formData);
      alert("Session created successfully!");
      setFormData({
        subject_id: "",
        start_time: "",
        duration_minutes: 60,
        notes: "",
      });
      setShowForm(false);
      fetchSessions();
    } catch (err) {
      setErrorInfo(
        formatApiError(err, {
          fallbackMessage:
            "Could not create this session. Select a subject, date, and duration, then try again.",
        }),
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (sessionId) => {
    try {
      setLoading(true);
      await sessionService.markComplete(sessionId);
      fetchSessions();
    } catch (err) {
      setErrorInfo(
        formatApiError(err, {
          fallbackMessage:
            "Could not update session status. Refresh the list and try again.",
        }),
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      try {
        await sessionService.delete(sessionId);
        fetchSessions();
      } catch (err) {
        setErrorInfo(
          formatApiError(err, {
            fallbackMessage:
              "Could not delete this session. It may already be removed; refresh the list.",
          }),
        );
        console.error(err);
      }
    }
  };

  const handleRefresh = () => {
    fetchSessions();
  };

  // Filter and sort sessions
  let filteredSessions = sessions;

  if (filterSubject) {
    filteredSessions = filteredSessions.filter(
      (s) => s.subject_id === parseInt(filterSubject),
    );
  }

  if (sortBy === "date") {
    filteredSessions = [...filteredSessions].sort(
      (a, b) => new Date(a.start_time) - new Date(b.start_time),
    );
  } else if (sortBy === "subject") {
    filteredSessions = [...filteredSessions].sort((a, b) =>
      a.subject_name.localeCompare(b.subject_name),
    );
  }

  return (
    <div className="planning-page">
      <header className="planning-header">
        <h1>📋 Planning & Sessions</h1>
        <div className="header-actions">
          <button
            onClick={handleGeneratePlanning}
            disabled={loading}
            className="btn btn-primary"
          >
            ✨ Generate Smart Planning
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn btn-secondary"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-secondary"
          >
            {showForm ? "✕ Cancel" : "➕ Add Session"}
          </button>
        </div>
      </header>

      {errorInfo && (
        <ErrorBanner
          kind={errorInfo.kind}
          summary={errorInfo.summary}
          message={errorInfo.message}
          className="planning-error-banner"
        />
      )}

      {showForm && (
        <div className="session-form-container">
          <form onSubmit={handleCreateSession} className="session-form">
            <h3>Create New Session</h3>
            <div className="form-group">
              <label>Subject *</label>
              <select
                value={formData.subject_id}
                onChange={(e) =>
                  setFormData({ ...formData, subject_id: e.target.value })
                }
                required
              >
                <option value="">Select a subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value),
                  })
                }
                min="15"
                step="15"
                required
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows="3"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              Create Session
            </button>
          </form>
        </div>
      )}

      <div className="view-controls">
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            📋 List View
          </button>
          <button
            className={`view-btn ${viewMode === "calendar" ? "active" : ""}`}
            onClick={() => setViewMode("calendar")}
          >
            📅 Calendar View
          </button>
        </div>

        {viewMode === "list" && (
          <div className="filters-section">
            <div className="filter-group">
              <label>Filter by Subject:</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Date</option>
                <option value="subject">Subject</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {loading && <div className="loading">Loading...</div>}

      {viewMode === "calendar" ? (
        <CalendarView />
      ) : (
        <>
          {!loading && filteredSessions.length === 0 ? (
            <div className="empty-state">
              <p>
                📝 No sessions yet. Create one or generate a smart planning!
              </p>
            </div>
          ) : (
            <div className="sessions-container">
              <div className="sessions-grid">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`session-card ${session.status}`}
                  >
                    <div className="session-header">
                      <h4>{session.subject_name}</h4>
                      <span className={`status-badge ${session.status}`}>
                        {session.status === "planned" && "⏳"}
                        {session.status === "in_progress" && "⏱️"}
                        {session.status === "completed" && "✅"}
                        {" " + session.status}
                      </span>
                    </div>

                    <div className="session-details">
                      <p>
                        <strong>📅 Date:</strong>{" "}
                        {new Date(session.start_time).toLocaleString()}
                      </p>
                      <p>
                        <strong>⏱️ Duration:</strong> {session.duration_minutes}{" "}
                        minutes
                      </p>
                      {session.notes && (
                        <p>
                          <strong>📝 Notes:</strong> {session.notes}
                        </p>
                      )}
                    </div>

                    <div className="session-actions">
                      {session.status !== "completed" && (
                        <button
                          onClick={() => handleMarkComplete(session.id)}
                          className="btn btn-small btn-success"
                        >
                          ✓ Mark Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="btn btn-small btn-danger"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlanningPage;
