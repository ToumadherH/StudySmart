import api from "./api";

/**
 * Thin wrapper around the /api/quizzes/ endpoints.
 *
 * - generate(): asks the backend to call the LLM and produce a quiz tied to
 *   the given subject (and optionally a session).
 * - grade(): submits the user's answers for a quiz so the backend can grade
 *   them through the same LLM and return the score.
 */
const quizService = {
  generate: ({
    subjectId,
    sessionId,
    language = "en",
    numQuestions = 5,
    questionTypes,
    difficulty,
  }) =>
    api.post("/quizzes/generate/", {
      subject_id: subjectId,
      session_id: sessionId ?? null,
      language,
      num_questions: numQuestions,
      ...(questionTypes ? { question_types: questionTypes } : {}),
      ...(difficulty ? { difficulty } : {}),
    }),

  grade: (quizId, answers) =>
    api.post(`/quizzes/${quizId}/grade/`, { answers }),
};

export default quizService;
