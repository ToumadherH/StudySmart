import { useState, useEffect } from 'react';
import './SubjectModal.css';

const SubjectModal = ({ subject, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    exam_date: '',
    difficulty: 3,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || '',
        exam_date: subject.exam_date || '',
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
    setError('');
    setLoading(true);

    try {
      await onSave(formData);
    } catch (err) {
      console.error('Save error:', err);
      const message = err.response?.data?.detail ||
                      err.response?.data?.name?.[0] ||
                      err.response?.data?.exam_date?.[0] ||
                      'Failed to save subject. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (level) => {
    const labels = ['', 'Easy', 'Medium', 'Moderate', 'Hard', 'Very Hard'];
    return labels[level] || 'Unknown';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{subject ? 'Edit Subject' : 'Add New Subject'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Subject Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Mathematics, Physics"
            />
          </div>

          <div className="form-group">
            <label htmlFor="exam_date">Exam Date</label>
            <input
              type="date"
              id="exam_date"
              name="exam_date"
              value={formData.exam_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">
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
            />
            <div className="difficulty-labels">
              <span>Easy</span>
              <span>Very Hard</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : subject ? 'Update' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectModal;
