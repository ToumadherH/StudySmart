import { useState, useEffect } from "react";
import api from "../services/api";
import SubjectCard from "../components/SubjectCard";
import SubjectModal from "../components/SubjectModal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { AlertMessage, EmptyState, LoadingState } from "../components/ui/Feedback";

const Subjects = () => {
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
      setError("Failed to delete subject.");
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

  if (loading) {
    return <LoadingState title="Loading subjects" description="Fetching your existing subjects and exam dates." />;
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-title">Subjects</h1>
        <p className="page-subtitle">Manage exam timelines and difficulty levels to drive planning quality.</p>
      </header>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}

      <Card elevated className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 text-lg font-semibold text-ss-highlight">
          {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
        </h2>
        <Button variant="primary" onClick={handleAddSubject}>
          Add subject
        </Button>
      </Card>

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects found"
          description="Start by adding a subject with exam date and difficulty. Planning sessions will be generated from this data."
          actionLabel="Add first subject"
          onAction={handleAddSubject}
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Subjects list">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleEditSubject}
              onDelete={handleDeleteSubject}
            />
          ))}
        </section>
      )}

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
