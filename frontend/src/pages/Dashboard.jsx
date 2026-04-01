import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalSessions: 0,
    completedSessions: 0,
    upcomingExams: 0,
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, statsRes] = await Promise.all([
        api.get('/subjects/').catch(() => ({ data: { results: [] } })),
        api.get('/statistics/dashboard/').catch(() => ({ data: {} })),
      ]);

      const subjectsData = subjectsRes.data.results || subjectsRes.data || [];
      setSubjects(subjectsData);

      setStats({
        totalSubjects: subjectsData.length,
        totalSessions: statsRes.data.total_sessions || 0,
        completedSessions: statsRes.data.completed_sessions || 0,
        upcomingExams: subjectsData.filter(s => {
          const daysLeft = Math.ceil((new Date(s.exam_date) - new Date()) / (1000 * 60 * 60 * 24));
          return daysLeft > 0 && daysLeft <= 30;
        }).length,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const getDaysLeft = (examDate) => {
    const today = new Date();
    const exam = new Date(examDate);
    return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  };

  const getDifficultyStars = (level) => {
    return '★'.repeat(level) + '☆'.repeat(5 - level);
  };

  const getProgress = (subject) => {
    if (!subject.total_sessions || subject.total_sessions === 0) return 0;
    return Math.round((subject.completed_sessions || 0) / subject.total_sessions * 100);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>StudySmart</h2>
        </div>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/subjects')}>
            Subjects
          </button>
          <button className="nav-btn" onClick={() => navigate('/calendar')}>
            Calendar
          </button>
          <button className="nav-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome back, {user?.username || 'Student'}!</h1>
          <p>Track your study progress and stay on top of your exams</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>Subjects</h3>
              <p className="stat-value">{stats.totalSubjects}</p>
              <p className="stat-label">Total subjects</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Sessions</h3>
              <p className="stat-value">{stats.totalSessions}</p>
              <p className="stat-label">Study sessions</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Completed</h3>
              <p className="stat-value">{stats.completedSessions}</p>
              <p className="stat-label">Sessions done</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>Upcoming</h3>
              <p className="stat-value">{stats.upcomingExams}</p>
              <p className="stat-label">Exams this month</p>
            </div>
          </div>
        </div>

        {subjects.length > 0 ? (
          <>
            <div className="upcoming-section">
              <h2>Upcoming Exams</h2>
              <div className="exams-list">
                {subjects
                  .filter(s => getDaysLeft(s.exam_date) > 0)
                  .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
                  .slice(0, 4)
                  .map(subject => (
                    <div key={subject.id} className="exam-item">
                      <div className="exam-info">
                        <h4>{subject.name}</h4>
                        <p>{new Date(subject.exam_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}</p>
                      </div>
                      <div className="exam-stats">
                        <span className="days-left">{getDaysLeft(subject.exam_date)} days left</span>
                        <span className="sessions-done">
                          {subject.completed_sessions || 0}/{subject.total_sessions || 0} sessions
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="by-subject-section">
              <h2>Progress by Subject</h2>
              <div className="subjects-list">
                {subjects.map(subject => (
                  <div key={subject.id} className="subject-item">
                    <div className="subject-header">
                      <h4>{subject.name}</h4>
                      <span className="difficulty">{getDifficultyStars(subject.difficulty)}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${getProgress(subject)}%` }}
                      ></div>
                    </div>
                    <p className="progress-text">{getProgress(subject)}% complete</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>No subjects yet. Add your first subject to start planning!</p>
            <button className="btn btn-primary btn-large" onClick={() => navigate('/subjects')}>
              + Add Subject
            </button>
          </div>
        )}

        <div className="action-section">
          <button className="btn btn-primary btn-large" onClick={() => navigate('/subjects')}>
            📚 Manage Subjects
          </button>
          <button className="btn btn-secondary btn-large" onClick={() => navigate('/calendar')}>
            📅 View Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
