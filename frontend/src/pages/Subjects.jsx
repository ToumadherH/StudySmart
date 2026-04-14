import { useState, useEffect } from "react";
import api from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { AlertMessage, EmptyState, LoadingState } from "../components/ui/Feedback";
import SubjectCard from "../components/SubjectCard";
import SubjectModal from "../components/SubjectModal";

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
    if (!window.confirm("Are you sure you want to delete this subject?"))
      return;

    try {
      await api.delete(`/subjects/${id}/`);
      setSubjects((current) => current.filter((subject) => subject.id !== id));
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
        setSubjects((current) =>
          current.map((subject) => (subject.id === editingSubject.id ? response.data : subject)),
        );
      } else {
        const response = await api.post("/subjects/", subjectData);
        setSubjects((current) => [...current, response.data]);
      }
      setIsModalOpen(false);
      setEditingSubject(null);
    } catch (err) {
      console.error("Failed to save subject:", err);
      throw err;
    }
  };

  if (loading) {
    return <LoadingState title="Loading subjects" description="Collecting your subject library and exam dates." />;
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="page-title">My Subjects</h1>
        <p className="page-subtitle">Manage your study subjects, exam dates, and planning priorities from one glass workspace.</p>
      </header>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}

      <Card elevated className="flex flex-col gap-4 !p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ss-muted">Subject library</p>
          <h2 className="mt-2 text-2xl font-semibold text-ss-highlight">
            {subjects.length} Subject{subjects.length !== 1 ? "s" : ""}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ss-muted">
            Keep each subject in a transparent glass card with exam urgency and progress at a glance.
          </p>
        </div>
        <Button onClick={handleAddSubject}>+ Add Subject</Button>
      </Card>

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          description="Add your first subject to get started with planning and exam tracking."
          actionLabel="Add your first subject"
          onAction={handleAddSubject}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
