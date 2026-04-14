import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { subscribeSessionProgressUpdated } from "../services/sessionSync";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { AlertMessage, EmptyState, LoadingState } from "../components/ui/Feedback";

const normalizeToArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

const isSessionCompleted = (session) =>
  session?.completed === true || session?.status === "completed";

const clampProgress = (value) => Math.min(Math.max(value, 0), 100);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAllSessions = useCallback(async () => {
    const collectedSessions = [];
    let nextPage = "/sessions/";

    while (nextPage) {
      const response = await api.get(nextPage);
      const payload = response.data;

      if (Array.isArray(payload)) {
        collectedSessions.push(...payload);
        break;
      }

      if (Array.isArray(payload?.results)) {
        collectedSessions.push(...payload.results);

        if (typeof payload.next === "string" && payload.next.startsWith("/api/")) {
          nextPage = payload.next.replace(/^\/api/, "");
        } else {
          nextPage = payload.next || null;
        }

        continue;
      }

      break;
    }

    return collectedSessions;
  }, []);

  const fetchDashboardData = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }

      setError("");
      const [subjectsRes, sessionsData] = await Promise.all([
        api.get("/subjects/").catch(() => ({ data: { results: [] } })),
        fetchAllSessions().catch(() => []),
      ]);

      const subjectsData = normalizeToArray(subjectsRes.data);
      setSubjects(subjectsData);
      setSessions(sessionsData);
    } catch {
      setError("We could not load your dashboard data right now.");
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [fetchAllSessions]);

  const getDaysLeft = (examDate) => {
    const today = new Date();
    const exam = new Date(examDate);
    return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  };

  const getDifficultyLabel = (level) => {
    const labels = ["", "Easy", "Medium", "Moderate", "Hard", "Very hard"];
    return labels[level] || "Unknown";
  };

  const dashboardStats = useMemo(() => {
    const completedSessions = sessions.reduce(
      (total, session) => (isSessionCompleted(session) ? total + 1 : total),
      0,
    );

    return {
      totalSubjects: subjects.length,
      totalSessions: sessions.length,
      completedSessions,
      upcomingExams: subjects.filter((subject) => {
        const daysLeft = getDaysLeft(subject.exam_date);
        return daysLeft > 0 && daysLeft <= 30;
      }).length,
    };
  }, [sessions, subjects]);

  const subjectProgressMap = useMemo(() => {
    const progressMap = new Map();

    sessions.forEach((session) => {
      const subjectId = Number(session.subject_id ?? session.subject?.id);
      if (Number.isNaN(subjectId)) {
        return;
      }

      const previous = progressMap.get(subjectId) || {
        totalSessions: 0,
        completedSessions: 0,
      };

      progressMap.set(subjectId, {
        totalSessions: previous.totalSessions + 1,
        completedSessions:
          previous.completedSessions + (isSessionCompleted(session) ? 1 : 0),
      });
    });

    return progressMap;
  }, [sessions]);

  const getSubjectProgress = (subjectId) => {
    const metrics = subjectProgressMap.get(Number(subjectId)) || {
      totalSessions: 0,
      completedSessions: 0,
    };

    const progress =
      metrics.totalSessions > 0
        ? Math.round((metrics.completedSessions / metrics.totalSessions) * 100)
        : 0;

    return {
      ...metrics,
      progress: clampProgress(progress),
    };
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const unsubscribe = subscribeSessionProgressUpdated((payload = {}) => {
      const sessionId = Number(payload.session_id);
      const status = payload.status;

      if (!Number.isNaN(sessionId) && status) {
        setSessions((currentSessions) =>
          currentSessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  status,
                  completed: status === "completed",
                }
              : session,
          ),
        );
      }

      fetchDashboardData(false);
    });

    return unsubscribe;
  }, [fetchDashboardData]);

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
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{dashboardStats.totalSubjects}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-wide text-ss-muted">Total sessions</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{dashboardStats.totalSessions}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-wide text-ss-muted">Completed sessions</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{dashboardStats.completedSessions}</p>
        </Card>
        <Card elevated>
          <p className="text-xs uppercase tracking-wide text-ss-muted">Upcoming exams</p>
          <p className="mt-2 text-3xl font-bold text-ss-highlight">{dashboardStats.upcomingExams}</p>
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
                {subjects.map((subject) => {
                  const subjectProgress = getSubjectProgress(subject.id);

                  return (
                    <div key={subject.id} className="glass-surface px-4 py-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="m-0 text-sm font-semibold text-ss-text">{subject.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-ss-accent">{subjectProgress.progress}%</span>
                          <span className="text-xs text-ss-muted">{getDifficultyLabel(subject.difficulty)}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)]">
                        <div
                          className="h-2 rounded-full bg-white transition-all duration-300"
                          style={{ width: `${subjectProgress.progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-ss-muted">
                        {subjectProgress.completedSessions}/{subjectProgress.totalSessions} sessions
                      </p>
                    </div>
                  );
                })}
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
