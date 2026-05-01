import { useEffect, useMemo, useState } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { AlertMessage } from "./ui/Feedback";
import quizService from "../services/quizService";

/**
 * QuizModal walks the user through a freshly generated quiz.
 *
 * Lifecycle:
 *  1. On mount we call /quizzes/generate/ with the subject (and optional
 *     session). The backend asks the LLM for a quiz built ONLY from the
 *     uploaded course PDF.
 *  2. The user fills in their answers locally.
 *  3. On submit we POST those answers to /quizzes/<id>/grade/. The backend
 *     re-prompts the LLM with the original questions plus the answers and
 *     returns a graded result.
 *  4. We show feedback per question and an overall rating.
 */
const ratingTone = {
  Excellent: "text-ss-accent",
  Bien: "text-ss-accent",
  Good: "text-ss-highlight",
  "Needs improvement": "text-ss-danger",
  "À améliorer": "text-ss-danger",
};

const QuizModal = ({
  subject,
  sessionId = null,
  language = "en",
  numQuestions = 5,
  onClose,
}) => {
  const [phase, setPhase] = useState("generating"); // generating | answering | grading | done | error
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setPhase("generating");
        setError("");
        const response = await quizService.generate({
          subjectId: subject.id,
          sessionId,
          language,
          numQuestions,
        });
        if (cancelled) return;
        setQuiz(response.data);
        // Pre-seed empty answers so controlled inputs don't warn.
        const initialAnswers = {};
        (response.data.questions || []).forEach((q) => {
          initialAnswers[q.id] = "";
        });
        setAnswers(initialAnswers);
        setPhase("answering");
      } catch (err) {
        if (cancelled) return;
        const message =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          "Could not generate a quiz. Make sure a course PDF is uploaded.";
        setError(message);
        setPhase("error");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [subject.id, sessionId, language, numQuestions]);

  const questions = quiz?.questions || [];

  const allAnswered = useMemo(() => {
    if (!questions.length) return false;
    return questions.every((q) => {
      const value = answers[q.id];
      return value !== undefined && value !== null && String(value).trim() !== "";
    });
  }, [answers, questions]);

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    try {
      setPhase("grading");
      setError("");
      const payload = questions.map((q) => ({
        id: q.id,
        user_answer: String(answers[q.id] ?? ""),
      }));
      const response = await quizService.grade(quiz.id, payload);
      setQuiz(response.data);
      setPhase("done");
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Could not grade your answers. Please try again.";
      setError(message);
      setPhase("answering");
    }
  };

  const grading = quiz?.grading || null;
  const resultsById = useMemo(() => {
    const map = {};
    (grading?.results || []).forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [grading]);

  return (
    <div
      className="glass-overlay fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        elevated
        className="flex max-h-[90vh] w-full max-w-2xl flex-col !p-0"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Session quiz"
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ss-muted">
              Session quiz
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-ss-highlight">
              {subject?.name || "Quiz"}
            </h2>
            <p className="mt-1 text-sm text-ss-muted">
              Generated from your uploaded course PDF.
            </p>
          </div>
          <Button
            className="h-10 w-10 !p-0 text-ss-neutral-300 hover:text-ss-neutral-100"
            onClick={onClose}
            type="button"
            variant="ghost"
            aria-label="Close quiz"
          >
            X
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}

          {phase === "generating" ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-ss-border border-t-ss-accent" />
              <p className="text-sm text-ss-muted">
                Generating your quiz from the course PDF...
              </p>
            </div>
          ) : null}

          {phase === "error" && !quiz ? (
            <div className="py-8 text-center text-sm text-ss-muted">
              No quiz yet. Close this dialog and try again after uploading a
              PDF for this subject.
            </div>
          ) : null}

          {(phase === "answering" || phase === "grading" || phase === "done") &&
          quiz ? (
            <div className="space-y-6">
              {phase === "done" && grading ? (
                <Card className="flex flex-col gap-1 !p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-ss-muted">
                    Result
                  </p>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-semibold text-ss-highlight">
                      {grading.score_total}/{grading.score_max}
                    </span>
                    <span className="text-sm text-ss-muted">
                      ({grading.score_percent}% )
                    </span>
                    <span
                      className={`ml-auto text-sm font-semibold ${
                        ratingTone[grading.rating_label] ||
                        "text-ss-highlight"
                      }`}
                    >
                      {grading.rating_label}
                    </span>
                  </div>
                </Card>
              ) : null}

              <ol className="space-y-5">
                {questions.map((question, index) => {
                  const result = resultsById[question.id];
                  const isGraded = phase === "done" && Boolean(result);
                  const correct = isGraded && result.is_correct;
                  const insufficient =
                    question.insufficient_context === true;
                  return (
                    <li
                      key={question.id}
                      className={`rounded-[18px] border p-5 ${
                        isGraded
                          ? correct
                            ? "border-ss-accent/40 bg-[rgba(0,163,133,0.08)]"
                            : "border-ss-danger/40 bg-[rgba(209,102,102,0.08)]"
                          : "border-white/10 bg-[rgba(255,255,255,0.03)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-ss-highlight">
                          {index + 1}. {question.question}
                        </p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ss-muted">
                          {question.type}
                        </span>
                      </div>

                      {insufficient ? (
                        <p className="mt-2 text-xs text-ss-muted">
                          Not enough context in the PDF to answer with
                          confidence.
                        </p>
                      ) : null}

                      <div className="mt-4">
                        {question.type === "mcq" &&
                        Array.isArray(question.options) &&
                        question.options.length > 0 ? (
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <label
                                key={option}
                                className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-ss-neutral-100 hover:border-white/20"
                              >
                                <input
                                  type="radio"
                                  name={`q-${question.id}`}
                                  value={option}
                                  checked={answers[question.id] === option}
                                  onChange={(e) =>
                                    handleAnswer(question.id, e.target.value)
                                  }
                                  disabled={phase !== "answering"}
                                  className="accent-ss-accent"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : question.type === "true_false" ? (
                          <div className="flex flex-wrap gap-2">
                            {["true", "false"].map((option) => {
                              const selected = answers[question.id] === option;
                              return (
                                <button
                                  type="button"
                                  key={option}
                                  onClick={() =>
                                    handleAnswer(question.id, option)
                                  }
                                  disabled={phase !== "answering"}
                                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                                    selected
                                      ? "border-ss-accent/60 bg-ss-accent/15 text-ss-highlight"
                                      : "border-white/10 bg-white/5 text-ss-neutral-200 hover:border-white/20"
                                  }`}
                                >
                                  {option === "true" ? "True" : "False"}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <textarea
                            value={answers[question.id] ?? ""}
                            onChange={(e) =>
                              handleAnswer(question.id, e.target.value)
                            }
                            disabled={phase !== "answering"}
                            rows={3}
                            placeholder="Type your answer..."
                            className="glass-control w-full px-4 py-3 text-sm text-ss-neutral-100 placeholder:text-ss-neutral-400"
                          />
                        )}
                      </div>

                      {isGraded ? (
                        <div className="mt-4 space-y-2 rounded-[14px] border border-white/10 bg-white/5 p-3 text-sm">
                          <p className="text-ss-neutral-200">
                            <span className="font-semibold text-ss-highlight">
                              Your answer:
                            </span>{" "}
                            {result.user_answer || "(blank)"}
                          </p>
                          <p className="text-ss-neutral-200">
                            <span className="font-semibold text-ss-highlight">
                              Correct answer:
                            </span>{" "}
                            {question.correct_answer}
                          </p>
                          {result.feedback ? (
                            <p className="text-ss-muted">{result.feedback}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap justify-end gap-3 border-t border-white/10 p-5">
          {phase === "done" ? (
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          ) : phase === "answering" || phase === "grading" ? (
            <>
              <Button variant="ghost" onClick={onClose} type="button">
                Skip
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!allAnswered || phase === "grading"}
              >
                {phase === "grading" ? "Grading..." : "Submit answers"}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={onClose} type="button">
              Close
            </Button>
          )}
        </footer>
      </Card>
    </div>
  );
};

export default QuizModal;
