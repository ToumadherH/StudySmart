import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./PlanningPage.css";

const PlanningPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    weeks: 2,
    sessions_per_week: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Math.max(
        1,
        Math.min(parseInt(value) || 1, name === "weeks" ? 12 : 20),
      ),
    }));
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await api.post("/planning/generate/", {
        weeks: formData.weeks,
        sessions_per_week: formData.sessions_per_week,
      });

      setResult(response.data);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to generate plan. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="planning-page">
      <header className="planning-header">
        <div className="header-left">
          <h1>Study Plan Generator</h1>
          <p>Generate optimized study sessions based on subject priority</p>
        </div>
        <nav className="header-actions">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/subjects" className="nav-link">
            Subjects
          </Link>
          <Link to="/calendar" className="nav-link">
            Calendar
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </nav>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="session-form-container">
        <form onSubmit={handleGeneratePlan} className="session-form">
          <h3>Configure Plan</h3>

          <div className="form-group">
            <label htmlFor="weeks">Number of Weeks to Plan</label>
            <input
              type="number"
              id="weeks"
              name="weeks"
              value={formData.weeks}
              onChange={handleInputChange}
              min="1"
              max="12"
              required
            />
            <small style={{ color: "#666", marginTop: "4px" }}>
              Between 1 and 12 weeks
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="sessions_per_week">Sessions Per Week</label>
            <input
              type="number"
              id="sessions_per_week"
              name="sessions_per_week"
              value={formData.sessions_per_week}
              onChange={handleInputChange}
              min="1"
              max="20"
              required
            />
            <small style={{ color: "#666", marginTop: "4px" }}>
              Between 1 and 20 sessions
            </small>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Generating Plan..." : "✨ Generate Plan"}
          </button>
        </form>
      </div>

      {result && result.success && (
        <div>
          <div className="alert alert-success">
            ✓ Successfully generated{" "}
            <strong>{result.total_sessions_created}</strong> study sessions!
          </div>

          <div className="sessions-container">
            <h2 style={{ marginBottom: "20px", color: "#2c3e50" }}>
              Sessions Breakdown by Subject
            </h2>
            <div className="sessions-grid">
              {result.by_subject.map((item, index) => (
                <div key={index} className="session-card">
                  <div className="session-header">
                    <h4>{item.subject}</h4>
                  </div>
                  <div className="session-details">
                    <p>
                      <strong>Sessions Created:</strong> {item.sessions_created}
                    </p>
                    <p>
                      <strong>Total Duration:</strong>{" "}
                      {item.total_duration_hours.toFixed(1)} hours
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/calendar")}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              📅 View Calendar
            </button>
            <button
              onClick={() => {
                setResult(null);
                setError("");
              }}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Generate Another Plan
            </button>
          </div>
        </div>
      )}

      {!result && !error && (
        <div className="empty-state">
          <p>
            👋 Configure your plan parameters and click "Generate Plan" to
            create study sessions.
          </p>
          <p style={{ fontSize: "14px", color: "#999", marginTop: "10px" }}>
            Sessions will be distributed across your subjects based on
            difficulty level (60%) and exam proximity (40%).
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanningPage;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="planning-page">
      <header className="planning-header">
        <div className="header-left">
          <h1>Study Plan Generator</h1>
          <p>Generate optimized study sessions based on subject priority</p>
        </div>
        <nav className="header-actions">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/subjects" className="nav-link">
            Subjects
          </Link>
          <Link to="/calendar" className="nav-link">
            Calendar
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </nav>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="session-form-container">
        <form onSubmit={handleGeneratePlan} className="session-form">
          <h3>Configure Plan</h3>

          <div className="form-group">
            <label htmlFor="weeks">Number of Weeks to Plan</label>
            <input
              type="number"
              id="weeks"
              name="weeks"
              value={formData.weeks}
              onChange={handleInputChange}
              min="1"
              max="12"
              required
            />
            <small style={{ color: "#666", marginTop: "4px" }}>
              Between 1 and 12 weeks
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="sessions_per_week">Sessions Per Week</label>
            <input
              type="number"
              id="sessions_per_week"
              name="sessions_per_week"
              value={formData.sessions_per_week}
              onChange={handleInputChange}
              min="1"
              max="20"
              required
            />
            <small style={{ color: "#666", marginTop: "4px" }}>
              Between 1 and 20 sessions
            </small>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Generating Plan..." : "✨ Generate Plan"}
          </button>
        </form>
      </div>

      {result && result.success && (
        <div>
          <div className="alert alert-success">
            ✓ Successfully generated{" "}
            <strong>{result.total_sessions_created}</strong> study sessions!
          </div>

          <div className="sessions-container">
            <h2 style={{ marginBottom: "20px", color: "#2c3e50" }}>
              Sessions Breakdown by Subject
            </h2>
            <div className="sessions-grid">
              {result.by_subject.map((item, index) => (
                <div key={index} className="session-card">
                  <div className="session-header">
                    <h4>{item.subject}</h4>
                  </div>
                  <div className="session-details">
                    <p>
                      <strong>Sessions Created:</strong> {item.sessions_created}
                    </p>
                    <p>
                      <strong>Total Duration:</strong>{" "}
                      {item.total_duration_hours.toFixed(1)} hours
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/calendar")}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              📅 View Calendar
            </button>
            <button
              onClick={() => {
                setResult(null);
                setError("");
              }}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Generate Another Plan
            </button>
          </div>
        </div>
      )}

      {!result && !error && (
        <div className="empty-state">
          <p>
            👋 Configure your plan parameters and click "Generate Plan" to
            create study sessions.
          </p>
          <p style={{ fontSize: "14px", color: "#999", marginTop: "10px" }}>
            Sessions will be distributed across your subjects based on
            difficulty level (60%) and exam proximity (40%).
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanningPage;
