import { useState, useEffect } from 'react';
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
import api from '../services/api';
import Card from '../components/ui/Card';
import { AlertMessage, EmptyState, LoadingState } from '../components/ui/Feedback';
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
  const [stats, setStats] = useState(null);
  const [subjectStats, setSubjectStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      const statsRes = await api.get('/planning/stats/').catch(() => ({ data: {} }));

      setStats(statsRes.data);
      setSubjectStats(statsRes.data.by_subject || []);
    } catch {
      setError('Failed to load statistics. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  // Progress by Subject Chart Data
  const getProgressChartData = () => {
    const labels = subjectStats.map(s => s.subject);
    const completedData = subjectStats.map(s => s.completed || 0);
    const totalData = subjectStats.map(s => (s.total || 0) - (s.completed || 0));

    return {
      labels,
      datasets: [
        {
          label: 'Completed',
          data: completedData,
          backgroundColor: '#00a385',
          borderRadius: 4,
        },
        {
          label: 'Remaining',
          data: totalData,
          backgroundColor: '#116556',
          borderRadius: 4,
        },
      ],
    };
  };

  // Sessions Completion Doughnut Chart
  const getCompletionChartData = () => {
    const totalSessions = stats?.total_sessions || 0;
    const completedSessions = stats?.completed_sessions || 0;
    const pendingSessions = totalSessions - completedSessions;

    return {
      labels: ['Completed', 'Pending'],
      datasets: [
        {
          data: [completedSessions, pendingSessions],
          backgroundColor: ['#00a385', '#116556'],
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
          borderColor: '#00a385',
          backgroundColor: 'rgba(0, 163, 133, 0.18)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  // Difficulty Distribution
  const getDifficultyChartData = () => {
    const difficultyCount = [0, 0, 0, 0, 0];
    subjectStats.forEach(s => {
      if (s.difficulty >= 1 && s.difficulty <= 5) {
        difficultyCount[s.difficulty - 1]++;
      }
    });

    return {
      labels: ['Easy', 'Medium', 'Moderate', 'Hard', 'Very Hard'],
      datasets: [
        {
          data: difficultyCount,
          backgroundColor: ['#49b48f', '#00a385', '#d7d7a8', '#c77f5f', '#d16666'],
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
        labels: {
          color: '#8cb6ab',
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: '#8cb6ab',
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: '#8cb6ab',
        },
      },
    },
  };

  if (loading) {
    return <LoadingState title="Loading statistics" description="Preparing your study performance insights." />;
  }

  const totalSessions = stats?.total_sessions || 0;
  const completedSessions = stats?.completed_sessions || 0;
  const completionRate =
    stats?.progress_percentage !== undefined
      ? Math.round(stats.progress_percentage)
      : totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-title">Statistics</h1>
        <p className="page-subtitle">Analyze completion trends and subject distribution to improve your weekly focus.</p>
      </header>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistics summary">
        <Card elevated className="text-center">
          <p className="text-xs uppercase tracking-wide text-ss-muted">Subjects</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{subjectStats.length}</p>
        </Card>
        <Card elevated className="text-center">
          <p className="text-xs uppercase tracking-wide text-ss-muted">Total sessions</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{totalSessions}</p>
        </Card>
        <Card elevated className="text-center">
          <p className="text-xs uppercase tracking-wide text-ss-muted">Completed</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{completedSessions}</p>
        </Card>
        <Card elevated className="text-center">
          <p className="text-xs uppercase tracking-wide text-ss-muted">Completion rate</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{completionRate}%</p>
        </Card>
      </section>

      {subjectStats.length === 0 ? (
        <EmptyState
          title="No statistics available yet"
          description="Add subjects and generate planning sessions to populate analytics charts."
        />
      ) : (
        <section className="statistics-grid" aria-label="Statistics charts">
          <Card elevated className="statistics-card">
            <h2 className="statistics-card-title">Progress by subject</h2>
            <div className="statistics-chart">
              <Bar data={getProgressChartData()} options={barOptions} />
            </div>
          </Card>

          <Card elevated className="statistics-card">
            <h2 className="statistics-card-title">Overall completion</h2>
            <div className="statistics-chart statistics-chart--doughnut">
              <Doughnut data={getCompletionChartData()} options={chartOptions} />
            </div>
          </Card>

          <Card elevated className="statistics-card">
            <h2 className="statistics-card-title">Study hours this week</h2>
            <div className="statistics-chart">
              <Line data={getWeeklyChartData()} options={chartOptions} />
            </div>
          </Card>

          <Card elevated className="statistics-card">
            <h2 className="statistics-card-title">Subjects by difficulty</h2>
            <div className="statistics-chart statistics-chart--doughnut">
              <Doughnut data={getDifficultyChartData()} options={chartOptions} />
            </div>
          </Card>
        </section>
      )}
    </div>
  );
};

export default Statistics;
