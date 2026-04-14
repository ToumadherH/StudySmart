import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { AlertMessage, EmptyState, LoadingState } from "../components/ui/Feedback";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalSessions: 0,
    completedSessions: 0,
    upcomingExams: 0,
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const [subjectsRes, statsRes] = await Promise.all([
        api.get("/subjects/").catch(() => ({ data: { results: [] } })),
        api.get("/planning/stats/").catch(() => ({ data: {} })),
      ]);

      const subjectsData = subjectsRes.data.results || subjectsRes.data || [];
      setSubjects(subjectsData);

      setStats({
        totalSubjects: subjectsData.length,
        totalSessions: statsRes.data.total_sessions || 0,
        completedSessions: statsRes.data.completed_sessions || 0,
        upcomingExams: subjectsData.filter((s) => {
          const daysLeft = Math.ceil(
            (new Date(s.exam_date) - new Date()) / (1000 * 60 * 60 * 24),
          );
          return daysLeft > 0 && daysLeft <= 30;
        }).length,
      });
    } catch {
      setError("We could not load your dashboard data right now.");
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (examDate) => {
    const today = new Date();
    const exam = new Date(examDate);
    return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  };

  const getDifficultyLabel = (level) => {
    const labels = ["", "Easy", "Medium", "Moderate", "Hard", "Very hard"];
    return labels[level] || "Unknown";
  };

  const getProgress = (subject) => {
    if (!subject.total_sessions || subject.total_sessions === 0) return 0;
    return Math.round(
      ((subject.completed_sessions || 0) / subject.total_sessions) * 100,
    );
  };

  if (loading) {
    return <LoadingState title="Loading dashboard" description="Collecting your progress and upcoming exams." />;
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-title">Welcome back, {user?.username || "Student"}</h1>
        <p className="page-subtitle">Track your progress, monitor exam priorities, and keep your study cadence consistent.</p>
      </header>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Summary metrics">
        <Card elevated>
          <p className="text-xs uppercase tracking-wide text-ss-muted">Subjects</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{stats.totalSubjects}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-wide text-ss-muted">Total sessions</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{stats.totalSessions}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-wide text-ss-muted">Completed sessions</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{stats.completedSessions}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-wide text-ss-muted">Upcoming exams</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{stats.upcomingExams}</p>
        </Card>
      </section>

      {subjects.length > 0 ? (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Exam and progress panels">
            <Card elevated className="space-y-4 !p-6">
              <h2 className="mb-4 text-xl font-semibold text-ss-highlight">Upcoming exams</h2>
              <div className="space-y-3">
                {subjects
                  .filter((s) => getDaysLeft(s.exam_date) > 0)
                  .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
                  .slice(0, 5)
                  .map((subject) => (
                    <div
                      key={subject.id}
                      className="glass-surface px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="m-0 text-base font-semibold text-ss-text">{subject.name}</h3>
                        <span className="text-sm font-semibold text-ss-accent">
                          {getDaysLeft(subject.exam_date)} days left
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ss-muted">
                        {new Date(subject.exam_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>

            <Card elevated className="space-y-4 !p-6">
              <h2 className="mb-4 text-xl font-semibold text-ss-highlight">Progress by subject</h2>
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div key={subject.id} className="glass-surface px-4 py-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="m-0 text-sm font-semibold text-ss-text">{subject.name}</h3>
                      <span className="text-xs text-ss-muted">{getDifficultyLabel(subject.difficulty)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)]">
                      <div
                        className="h-2 rounded-full bg-ss-accent transition-all duration-300"
                        style={{ width: `${getProgress(subject)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-ss-muted">
                      {subject.completed_sessions || 0}/{subject.total_sessions || 0} sessions completed
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
            <Button variant="primary" onClick={() => navigate("/subjects")}>
              Manage subjects
            </Button>
            <Button variant="secondary" onClick={() => navigate("/calendar")}>
              View calendar
            </Button>
          </section>
        </>
      ) : (
        <EmptyState
          title="No subjects yet"
          description="Create your first subject to generate planning sessions and track upcoming exams."
          actionLabel="Add subject"
          onAction={() => navigate("/subjects")}
        />
      )}
    </div>
  );
};

export default Dashboard;
