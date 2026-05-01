import logging

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from subjects.models import Subject
from study_sessions.models import Session

from .models import Quiz
from .serializers import (
    GenerateQuizRequestSerializer,
    GradeQuizRequestSerializer,
    QuizSerializer,
)
from .services import QuizGenerationError, generate_quiz, grade_quiz

logger = logging.getLogger(__name__)


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for browsing past quizzes plus action endpoints
    for generating new ones and submitting answers for grading.
    """

    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Quiz.objects.filter(user=self.request.user)
            .select_related("subject", "session")
            .order_by("-created_at")
        )

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        """Generate a quiz from a subject's course PDF.

        Body: { subject_id, session_id?, language?, difficulty?, num_questions?, question_types? }
        """
        request_serializer = GenerateQuizRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        params = request_serializer.validated_data

        subject = get_object_or_404(
            Subject, pk=params["subject_id"], owner=request.user
        )

        if not subject.course_pdf_text:
            return Response(
                {
                    "error": (
                        "This subject has no course PDF yet. Upload one before "
                        "generating a quiz."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = None
        if params.get("session_id"):
            session = Session.objects.filter(
                pk=params["session_id"], user=request.user
            ).first()

        difficulty = params.get("difficulty") or subject.difficulty
        question_types = params.get("question_types") or [
            "mcq",
            "true_false",
            "short_answer",
        ]

        try:
            payload = generate_quiz(
                subject_name=subject.name,
                course_pdf_text=subject.course_pdf_text,
                language=params.get("language", "en"),
                difficulty=difficulty,
                num_questions=params.get("num_questions", 5),
                question_types=question_types,
            )
        except QuizGenerationError as exc:
            logger.exception("Quiz generation failed for subject %s", subject.id)
            return Response(
                {"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY
            )

        quiz = Quiz.objects.create(
            user=request.user,
            subject=subject,
            session=session,
            language=params.get("language", "en"),
            difficulty=difficulty,
            num_questions=params.get("num_questions", 5),
            question_types=question_types,
            questions=payload.get("quiz", []),
            grading=payload.get("grading"),
        )

        data = QuizSerializer(quiz).data
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="grade")
    def grade(self, request, pk=None):
        """Submit answers for a previously generated quiz and get a graded
        result back."""
        quiz = self.get_queryset().filter(pk=pk).first()
        if not quiz:
            return Response(
                {"error": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND
            )

        request_serializer = GradeQuizRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        answers = request_serializer.validated_data["answers"]

        try:
            payload = grade_quiz(
                subject_name=quiz.subject.name,
                course_pdf_text=quiz.subject.course_pdf_text,
                language=quiz.language,
                difficulty=quiz.difficulty,
                num_questions=quiz.num_questions,
                question_types=quiz.question_types or [],
                questions=quiz.questions or [],
                user_answers=answers,
            )
        except QuizGenerationError as exc:
            logger.exception("Quiz grading failed for quiz %s", quiz.id)
            return Response(
                {"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY
            )

        grading = payload.get("grading") or {}
        quiz.grading = grading
        quiz.score_total = int(grading.get("score_total") or 0)
        quiz.score_max = int(grading.get("score_max") or 0)
        try:
            quiz.score_percent = float(grading.get("score_percent") or 0)
        except (TypeError, ValueError):
            quiz.score_percent = 0.0
        quiz.rating_label = str(grading.get("rating_label") or "")
        quiz.save(
            update_fields=[
                "grading",
                "score_total",
                "score_max",
                "score_percent",
                "rating_label",
                "updated_at",
            ]
        )

        return Response(QuizSerializer(quiz).data)
