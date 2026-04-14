import Card from "./ui/Card";
import Button from "./ui/Button";

const difficultyTone = {
  1: "border-emerald-200/25 bg-emerald-200/10 text-emerald-100",
  2: "border-teal-200/25 bg-teal-200/10 text-teal-100",
  3: "border-amber-200/25 bg-amber-200/10 text-amber-100",
  4: "border-orange-200/25 bg-orange-200/10 text-orange-100",
  5: "border-rose-200/25 bg-rose-200/10 text-rose-100",
  default: "border-white/10 bg-[rgba(255,255,255,0.05)] text-ss-neutral-200",
};

const SubjectCard = ({ subject, onEdit, onDelete }) => {
  const getDifficultyLabel = (level) => {
    const labels = ["", "Easy", "Medium", "Moderate", "Hard", "Very Hard"];
    return labels[level] || 'Unknown';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
  const tone = difficultyTone[subject.difficulty] || difficultyTone.default;
  const daysRemainingClass =
    daysRemaining <= 0
      ? "text-ss-danger"
      : daysRemaining <= 7
        ? "text-ss-highlight"
        : "text-ss-neutral-100";

  return (
    <Card elevated className="flex h-full flex-col gap-5 !p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="m-0 text-lg font-semibold tracking-tight text-ss-highlight">{subject.name}</h3>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md ${tone}`}>
          {getDifficultyLabel(subject.difficulty)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3">
          <span className="text-sm text-ss-neutral-300">Exam Date</span>
          <span className="text-sm font-semibold text-ss-neutral-100">{formatDate(subject.exam_date)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3">
          <span className="text-sm text-ss-neutral-300">Days Remaining</span>
          <span className={`text-sm font-semibold ${daysRemainingClass}`}>
            {daysRemaining > 0 ? `${daysRemaining} days` : 'Past due'}
          </span>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3">
        <Button variant="secondary" size="sm" type="button" onClick={() => onEdit(subject)}>
          Edit
        </Button>
        <Button variant="danger" size="sm" type="button" onClick={() => onDelete(subject.id)}>
          Delete
        </Button>
      </div>
    </Card>
  );
};

export default SubjectCard;
