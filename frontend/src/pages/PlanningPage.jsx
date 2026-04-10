import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Card from "../components/ui/Card";
import InputField from "../components/ui/InputField";
import Button from "../components/ui/Button";
import { AlertMessage, EmptyState } from "../components/ui/Feedback";

const PlanningPage = () => {
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

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-title">Planning generator</h1>
        <p className="page-subtitle">Create optimized sessions using subject difficulty and exam urgency.</p>
      </header>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}

      <Card elevated>
        <form onSubmit={handleGeneratePlan} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="m-0 text-xl font-semibold text-ss-highlight">Configuration</h2>
          </div>
          <InputField
            id="weeks"
            name="weeks"
            type="number"
            min="1"
            max="12"
            label="Number of weeks"
            hint="Choose between 1 and 12 weeks."
            value={formData.weeks}
            onChange={handleInputChange}
            required
          />
          <InputField
            id="sessions_per_week"
            name="sessions_per_week"
            type="number"
            min="1"
            max="20"
            label="Sessions per week"
            hint="Choose between 1 and 20 sessions."
            value={formData.sessions_per_week}
            onChange={handleInputChange}
            required
          />
          <div className="md:col-span-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Generating plan..." : "Generate plan"}
            </Button>
          </div>
        </form>
      </Card>

      {result && result.success ? (
        <>
          <AlertMessage variant="success">
            Plan generated successfully with {result.total_sessions_created} sessions.
          </AlertMessage>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Generated sessions by subject">
            {result.by_subject.map((item, index) => (
              <Card key={index} elevated>
                <h3 className="m-0 text-lg font-semibold text-ss-highlight">{item.subject}</h3>
                <p className="mt-3 text-sm text-ss-muted">Sessions created: {item.sessions_created}</p>
                <p className="mt-1 text-sm text-ss-muted">Total duration: {item.total_duration_hours.toFixed(1)} hours</p>
              </Card>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
            <Button variant="primary" onClick={() => navigate("/calendar")}>
              View calendar
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setResult(null);
                setError("");
              }}
            >
              Generate another plan
            </Button>
          </section>
        </>
      ) : null}

      {!result && !error ? (
        <EmptyState
          title="Generate your first plan"
          description="Choose a planning range and session frequency. The system balances subject difficulty and exam proximity."
        />
      ) : null}
    </div>
  );
};

export default PlanningPage;
