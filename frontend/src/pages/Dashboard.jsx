import React, { useState, useEffect } from "react";
import { planningService, notificationService } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchUnreadCount();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await planningService.getStats();
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>📚 StudySmart</h2>
        </div>
        <div className="nav-links">
          <button
            onClick={() => handleNavigate("/planning")}
            className="nav-btn"
          >
            📋 Planning
          </button>
          <button
            onClick={() => handleNavigate("/notifications")}
            className="nav-btn"
          >
            🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button onClick={handleLogout} className="nav-btn logout-btn">
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user?.first_name || user?.username}! 👋</h1>
          <p>Here's your study progress at a glance</p>
        </div>

        {loading ? (
          <div className="loading">Loading your stats...</div>
        ) : stats ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Progress</h3>
                  <p className="stat-value">
                    {stats.progress_percentage.toFixed(1)}%
                  </p>
                  <p className="stat-label">
                    {stats.completed_sessions} / {stats.total_sessions} sessions
                    completed
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <h3>Total Sessions</h3>
                  <p className="stat-value">{stats.total_sessions}</p>
                  <p className="stat-label">Planned study sessions</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h3>This Week</h3>
                  <p className="stat-value">{stats.sessions_this_week}</p>
                  <p className="stat-label">Sessions scheduled</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>Completed</h3>
                  <p className="stat-value">{stats.completed_sessions}</p>
                  <p className="stat-label">Sessions done</p>
                </div>
              </div>
            </div>

            {stats.upcoming_exams.length > 0 && (
              <div className="upcoming-section">
                <h2>🎯 Upcoming Exams</h2>
                <div className="exams-list">
                  {stats.upcoming_exams.map((exam, idx) => (
                    <div key={idx} className="exam-item">
                      <div className="exam-info">
                        <h4>{exam.subject}</h4>
                        <p>
                          📅 {new Date(exam.exam_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="exam-stats">
                        <span className="days-left">
                          {exam.days_left === 0
                            ? "Today!"
                            : `${exam.days_left} days left`}
                        </span>
                        <span className="sessions-done">
                          {exam.sessions_completed} sessions done
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.by_subject.length > 0 && (
              <div className="by-subject-section">
                <h2>📚 By Subject</h2>
                <div className="subjects-list">
                  {stats.by_subject.map((subj, idx) => (
                    <div key={idx} className="subject-item">
                      <div className="subject-header">
                        <h4>{subj.subject}</h4>
                        <span
                          className={`difficulty difficulty-${subj.difficulty}`}
                        >
                          {"⭐".repeat(subj.difficulty)}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width:
                              subj.total > 0
                                ? `${(subj.completed / subj.total) * 100}%`
                                : "0%",
                          }}
                        />
                      </div>
                      <p className="progress-text">
                        {subj.completed} / {subj.total} sessions
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="action-section">
              <button
                onClick={() => handleNavigate("/planning")}
                className="btn btn-primary btn-large"
              >
                ✨ Go to Planning
              </button>
              <button
                onClick={fetchStats}
                className="btn btn-secondary btn-large"
              >
                🔄 Refresh Stats
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>
              No data available. Create subjects and sessions to get started!
            </p>
            <button
              onClick={() => handleNavigate("/planning")}
              className="btn btn-primary"
            >
              Create Planning
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
