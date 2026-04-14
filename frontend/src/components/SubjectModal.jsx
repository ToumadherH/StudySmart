import { useState, useEffect } from "react";
import InputField from "./ui/InputField";
import Button from "./ui/Button";
import Card from "./ui/Card";
import { AlertMessage } from "./ui/Feedback";

const SubjectModal = ({ subject, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    exam_date: "",
    difficulty: 3,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || "",
        exam_date: subject.exam_date || "",
        difficulty: subject.difficulty || 3,
      });
    }
  }, [subject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'difficulty' ? parseInt(value, 10) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSave(formData);
    } catch (err) {
      console.error("Save error:", err);
      const message =
        err.response?.data?.detail ||
        err.response?.data?.name?.[0] ||
        err.response?.data?.exam_date?.[0] ||
        "Failed to save subject. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (level) => {
    const labels = ["", "Easy", "Medium", "Moderate", "Hard", "Very Hard"];
    return labels[level] || 'Unknown';
  };

  return (
    <div className="glass-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card
        elevated
        className="w-full max-w-xl !p-6 sm:!p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={subject ? "Edit subject" : "Add new subject"}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="m-0 text-2xl font-semibold text-ss-highlight">{subject ? 'Edit subject' : 'Add subject'}</h2>
          <Button
            className="h-10 w-10 !p-0 text-ss-neutral-300 hover:text-ss-neutral-100"
            onClick={onClose}
            type="button"
            variant="ghost"
            aria-label="Close dialog"
          >
            X
          </Button>
        </div>

        {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <InputField
            type="text"
            id="name"
            label="Subject name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Example: Mathematics"
          />

          <InputField
            type="date"
            id="exam_date"
            label="Exam date"
            name="exam_date"
            value={formData.exam_date}
            onChange={handleChange}
            required
          />

          <div className="space-y-3 rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
            <label htmlFor="difficulty" className="text-sm font-semibold tracking-wide text-ss-highlight">
              Difficulty: {getDifficultyLabel(formData.difficulty)}
            </label>
            <input
              type="range"
              id="difficulty"
              name="difficulty"
              min="1"
              max="5"
              value={formData.difficulty}
              onChange={handleChange}
              className="h-2 w-full appearance-none rounded-full bg-[rgba(255,255,255,0.08)] accent-ss-accent"
              aria-label="Difficulty level"
            />
            <div className="flex justify-between text-xs text-ss-muted">
              <span>Easy</span>
              <span>Very hard</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : subject ? 'Update subject' : 'Add subject'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SubjectModal;
