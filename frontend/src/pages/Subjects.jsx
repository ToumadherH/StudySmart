import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../services/api";
import SubjectCard from "../components/SubjectCard";
import SubjectModal from "../components/SubjectModal";
import "./Subjects.css";

const Subjects = () => {
  const { logout } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/subjects/");
      setSubjects(response.data.results || response.data || []);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      setError("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;

    try {
      await api.delete(`/subjects/${id}/`);
      setSubjects(subjects.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete subject:", err);
      setError("Failed to delete subject");
    }
  };

  const handleSaveSubject = async (subjectData) => {
    try {
      if (editingSubject) {
        const response = await api.patch(
          `/subjects/${editingSubject.id}/`,
          subjectData,
        );
        setSubjects(
          subjects.map((s) => (s.id === editingSubject.id ? response.data : s)),
        );
      } else {
        const response = await api.post("/subjects/", subjectData);
        setSubjects([...subjects, response.data]);
      }
      setIsModalOpen(false);
      setEditingSubject(null);
    } catch (err) {
      console.error("Failed to save subject:", err);
      throw err;
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="subjects-loading">
        <div className="spinner"></div>
        <p>Loading subjects...</p>
      </div>
    );
  }

  return (
    <div className="subjects-page">
      <header className="subjects-header">
        <div className="header-left">
          <h1>My Subjects</h1>
          <p>Manage your study subjects and exams</p>
        </div>
        <div className="header-right">
          <nav className="subjects-nav">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/planning" className="nav-link">
              Planning
            </Link>
            <Link to="/calendar" className="nav-link">
              Calendar
            </Link>
          </nav>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="subjects-content">
        <div className="subjects-toolbar">
          <h2>
            {subjects.length} Subject{subjects.length !== 1 ? "s" : ""}
          </h2>
          <button onClick={handleAddSubject} className="add-btn">
            + Add Subject
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="empty-state">
            <p>No subjects yet. Add your first subject to get started!</p>
            <button onClick={handleAddSubject} className="add-btn large">
              + Add Your First Subject
            </button>
          </div>
        ) : (
          <div className="subjects-grid">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onEdit={handleEditSubject}
                onDelete={handleDeleteSubject}
              />
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <SubjectModal
          subject={editingSubject}
          onSave={handleSaveSubject}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSubject(null);
          }}
        />
      )}
    </div>
  );
};

export default Subjects;
