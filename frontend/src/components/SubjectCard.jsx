import './SubjectCard.css';

const SubjectCard = ({ subject, onEdit, onDelete }) => {
  const getDifficultyLabel = (level) => {
    const labels = ['', 'Easy', 'Medium', 'Moderate', 'Hard', 'Very Hard'];
    return labels[level] || 'Unknown';
  };

  const getDifficultyColor = (level) => {
    const colors = ['', '#48bb78', '#38b2ac', '#ed8936', '#e53e3e', '#9b2c2c'];
    return colors[level] || '#718096';
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

  return (
    <div className="subject-card">
      <div className="subject-card-header">
        <h3 className="subject-name">{subject.name}</h3>
        <span
          className="difficulty-badge"
          style={{ backgroundColor: getDifficultyColor(subject.difficulty) }}
        >
          {getDifficultyLabel(subject.difficulty)}
        </span>
      </div>

      <div className="subject-card-body">
        <div className="subject-info">
          <span className="info-label">Exam Date</span>
          <span className="info-value">{formatDate(subject.exam_date)}</span>
        </div>
        <div className="subject-info">
          <span className="info-label">Days Remaining</span>
          <span className={`info-value ${daysRemaining <= 7 ? 'urgent' : ''}`}>
            {daysRemaining > 0 ? `${daysRemaining} days` : 'Past due'}
          </span>
        </div>
      </div>

      <div className="subject-card-actions">
        <button onClick={() => onEdit(subject)} className="edit-btn">
          Edit
        </button>
        <button onClick={() => onDelete(subject.id)} className="delete-btn">
          Delete
        </button>
      </div>
    </div>
  );
};

export default SubjectCard;
