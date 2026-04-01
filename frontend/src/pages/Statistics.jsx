import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Statistics.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Statistics = () => {
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const [statsRes, subjectsRes] = await Promise.all([
        api.get('/statistics/').catch(() => ({ data: {} })),
        api.get('/subjects/').catch(() => ({ data: { results: [] } })),
      ]);

      setStats(statsRes.data);
      setSubjects(subjectsRes.data.results || subjectsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Progress by Subject Chart Data
  const getProgressChartData = () => {
    const labels = subjects.map(s => s.name);
    const completedData = subjects.map(s => s.completed_sessions || 0);
    const totalData = subjects.map(s => (s.total_sessions || 0) - (s.completed_sessions || 0));

    return {
      labels,
      datasets: [
        {
          label: 'Completed',
          data: completedData,
          backgroundColor: '#48bb78',
          borderRadius: 4,
        },
        {
          label: 'Remaining',
          data: totalData,
          backgroundColor: '#e2e8f0',
          borderRadius: 4,
        },
      ],
    };
  };

  // Sessions Completion Doughnut Chart
  const getCompletionChartData = () => {
    const totalSessions = subjects.reduce((acc, s) => acc + (s.total_sessions || 0), 0);
    const completedSessions = subjects.reduce((acc, s) => acc + (s.completed_sessions || 0), 0);
    const pendingSessions = totalSessions - completedSessions;

    return {
      labels: ['Completed', 'Pending'],
      datasets: [
        {
          data: [completedSessions, pendingSessions],
          backgroundColor: ['#48bb78', '#e2e8f0'],
          borderWidth: 0,
        },
      ],
    };
  };

  // Study Hours Line Chart (mock weekly data)
  const getWeeklyChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hoursData = stats?.weekly_hours || [2, 3, 1.5, 4, 2.5, 5, 3];

    return {
      labels: days,
      datasets: [
        {
          label: 'Study Hours',
          data: hoursData,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  // Difficulty Distribution
  const getDifficultyChartData = () => {
    const difficultyCount = [0, 0, 0, 0, 0];
    subjects.forEach(s => {
      if (s.difficulty >= 1 && s.difficulty <= 5) {
        difficultyCount[s.difficulty - 1]++;
      }
    });

    return {
      labels: ['Easy', 'Medium', 'Moderate', 'Hard', 'Very Hard'],
      datasets: [
        {
          data: difficultyCount,
          backgroundColor: ['#48bb78', '#38b2ac', '#ed8936', '#e53e3e', '#9b2c2c'],
          borderWidth: 0,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="statistics-loading">
        <div className="spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  const totalSessions = subjects.reduce((acc, s) => acc + (s.total_sessions || 0), 0);
  const completedSessions = subjects.reduce((acc, s) => acc + (s.completed_sessions || 0), 0);
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div className="statistics-page">
      <header className="statistics-header">
        <div className="header-left">
          <h1>Statistics</h1>
          <p>Track your study progress and performance</p>
        </div>
        <div className="header-right">
          <nav className="statistics-nav">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/subjects" className="nav-link">Subjects</Link>
            <Link to="/calendar" className="nav-link">Calendar</Link>
          </nav>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="statistics-content">
        <div className="stats-summary">
          <div className="summary-card">
            <span className="summary-value">{subjects.length}</span>
            <span className="summary-label">Total Subjects</span>
          </div>
          <div className="summary-card">
            <span className="summary-value">{totalSessions}</span>
            <span className="summary-label">Total Sessions</span>
          </div>
          <div className="summary-card">
            <span className="summary-value">{completedSessions}</span>
            <span className="summary-label">Completed</span>
          </div>
          <div className="summary-card highlight">
            <span className="summary-value">{completionRate}%</span>
            <span className="summary-label">Completion Rate</span>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Progress by Subject</h3>
            <div className="chart-container">
              {subjects.length > 0 ? (
                <Bar data={getProgressChartData()} options={barOptions} />
              ) : (
                <p className="no-data">No subjects to display</p>
              )}
            </div>
          </div>

          <div className="chart-card">
            <h3>Overall Completion</h3>
            <div className="chart-container doughnut">
              {totalSessions > 0 ? (
                <Doughnut data={getCompletionChartData()} options={chartOptions} />
              ) : (
                <p className="no-data">No sessions to display</p>
              )}
            </div>
          </div>

          <div className="chart-card">
            <h3>Study Hours This Week</h3>
            <div className="chart-container">
              <Line data={getWeeklyChartData()} options={chartOptions} />
            </div>
          </div>

          <div className="chart-card">
            <h3>Subjects by Difficulty</h3>
            <div className="chart-container doughnut">
              {subjects.length > 0 ? (
                <Doughnut data={getDifficultyChartData()} options={chartOptions} />
              ) : (
                <p className="no-data">No subjects to display</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Statistics;
