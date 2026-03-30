import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import ProgressChart from '../components/ProgressChart';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalSubjects: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    progressPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, statsRes] = await Promise.all([
        api.get('/subjects/'),
        api.get('/planning/stats/'),
      ]);

      const subjects = subjectsRes.data.results || subjectsRes.data || [];
      const planningStats = statsRes.data;

      setStats({
        totalSubjects: subjects.length,
        completedSessions: planningStats.completed_sessions || 0,
        upcomingSessions: planningStats.upcoming_sessions || 0,
        progressPercentage: planningStats.progress_percentage || 0,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>StudySmart Dashboard</h1>
          <p>Welcome back, <strong>{user?.username}</strong>!</p>
        </div>
        <div className="header-right">
          <nav className="dashboard-nav">
            <Link to="/subjects" className="nav-link">Subjects</Link>
            <Link to="/calendar" className="nav-link">Calendar</Link>
            <Link to="/planning" className="nav-link">Planning</Link>
          </nav>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="dashboard-content">
        <section className="stats-section">
          <h2>Your Progress</h2>
          <div className="stats-grid">
            <StatsCard
              title="Total Subjects"
              value={stats.totalSubjects}
              icon="📚"
              color="#667eea"
            />
            <StatsCard
              title="Completed Sessions"
              value={stats.completedSessions}
              icon="✅"
              color="#48bb78"
            />
            <StatsCard
              title="Upcoming Sessions"
              value={stats.upcomingSessions}
              icon="📅"
              color="#ed8936"
            />
            <StatsCard
              title="Overall Progress"
              value={`${stats.progressPercentage}%`}
              icon="📈"
              color="#9f7aea"
            />
          </div>
        </section>

        <section className="chart-section">
          <h2>Study Progress</h2>
          <div className="chart-container">
            <ProgressChart progress={stats.progressPercentage} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
