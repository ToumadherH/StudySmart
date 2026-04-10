import Button from "./ui/Button";

const SubjectCard = ({ subject, onEdit, onDelete }) => {
  const getDifficultyLabel = (level) => {
    const labels = ["", "Easy", "Medium", "Moderate", "Hard", "Very hard"];
    return labels[level] || "Unknown";
  };

  const getDifficultyClass = (level) => {
    if (level <= 2) return "bg-ss-success/20 text-ss-highlight";
    if (level === 3) return "bg-ss-accent/20 text-ss-highlight";
    return "bg-ss-danger/20 text-ss-highlight";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (dateString) => {
    const examDate = new Date(dateString);
    const today = new Date();
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(subject.exam_date);

  return (
    <article className="rounded-2xl border border-ss-border bg-ss-surface/35 p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="m-0 text-lg font-semibold text-ss-highlight">{subject.name}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyClass(subject.difficulty)}`}>
          {getDifficultyLabel(subject.difficulty)}
        </span>
      </div>

      <div className="mb-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-ss-muted">Exam date</span>
          <span className="text-sm font-semibold text-ss-text">{formatDate(subject.exam_date)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-ss-muted">Days remaining</span>
          <span className={`text-sm font-semibold ${daysRemaining <= 7 ? "text-ss-danger" : "text-ss-accent"}`}>
            {daysRemaining > 0 ? `${daysRemaining} days` : "Past due"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => onEdit(subject)}>
          Edit
        </Button>
        <Button variant="danger" onClick={() => onDelete(subject.id)}>
          Delete
        </Button>
      </div>
    </article>
  );
};

export default SubjectCard;
