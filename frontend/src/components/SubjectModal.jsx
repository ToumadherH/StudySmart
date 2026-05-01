import { useEffect, useRef, useState } from "react";
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
  // Course PDF is tracked separately because it goes through a multipart
  // upload while the rest of the fields are plain JSON-style values.
  const [pdfFile, setPdfFile] = useState(null);
  const [removeExistingPdf, setRemoveExistingPdf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || "",
        exam_date: subject.exam_date || "",
        difficulty: subject.difficulty || 3,
      });
    }
    // Reset file state whenever the modal target changes.
    setPdfFile(null);
    setRemoveExistingPdf(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [subject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "difficulty" ? parseInt(value, 10) : value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPdfFile(file);
    if (file) {
      setRemoveExistingPdf(false);
    }
  };

  const clearPdfSelection = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveExisting = () => {
    setRemoveExistingPdf(true);
    clearPdfSelection();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Always send multipart so the same code path supports PDF uploads.
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("exam_date", formData.exam_date);
      payload.append("difficulty", String(formData.difficulty));
      if (pdfFile) {
        payload.append("course_pdf", pdfFile);
      }
      if (removeExistingPdf && !pdfFile) {
        payload.append("remove_course_pdf", "true");
      }
      await onSave(payload);
    } catch (err) {
      console.error("Save error:", err);
      const message =
        err.response?.data?.detail ||
        err.response?.data?.name?.[0] ||
        err.response?.data?.exam_date?.[0] ||
        err.response?.data?.course_pdf?.[0] ||
        "Failed to save subject. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (level) => {
    const labels = ["", "Easy", "Medium", "Moderate", "Hard", "Very Hard"];
    return labels[level] || "Unknown";
  };

  const hasExistingPdf = Boolean(subject?.has_course_pdf) && !removeExistingPdf;

  return (
    <div
      className="glass-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        elevated
        className="w-full max-w-xl !p-6 sm:!p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={subject ? "Edit subject" : "Add new subject"}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="m-0 text-2xl font-semibold text-ss-highlight">
            {subject ? "Edit subject" : "Add subject"}
          </h2>
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
            <label
              htmlFor="difficulty"
              className="text-sm font-semibold tracking-wide text-ss-highlight"
            >
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

          <div className="space-y-3 rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="course_pdf"
                className="text-sm font-semibold tracking-wide text-ss-highlight"
              >
                Course PDF
              </label>
              {hasExistingPdf ? (
                <span className="text-xs text-ss-muted">PDF on file</span>
              ) : null}
            </div>
            <p className="text-xs text-ss-muted">
              Upload the course material so the AI can generate a quiz when you
              complete a study session. PDF only, up to 10MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              id="course_pdf"
              name="course_pdf"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-ss-neutral-200 file:mr-4 file:rounded-lg file:border-0 file:bg-ss-accent/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ss-highlight hover:file:bg-ss-accent/30"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-ss-muted">
              {pdfFile ? (
                <>
                  <span className="font-medium text-ss-highlight">
                    {pdfFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={clearPdfSelection}
                    className="underline underline-offset-2 hover:text-ss-highlight"
                  >
                    Clear selection
                  </button>
                </>
              ) : hasExistingPdf ? (
                <button
                  type="button"
                  onClick={handleRemoveExisting}
                  className="underline underline-offset-2 hover:text-ss-highlight"
                >
                  Remove existing PDF
                </button>
              ) : removeExistingPdf ? (
                <span>Existing PDF will be removed on save.</span>
              ) : (
                <span>No file selected.</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading
                ? "Saving..."
                : subject
                ? "Update subject"
                : "Add subject"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SubjectModal;
