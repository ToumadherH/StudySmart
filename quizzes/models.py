from django.contrib.auth.models import User
from django.db import models

from study_sessions.models import Session
from subjects.models import Subject


class Quiz(models.Model):
    """A quiz generated from a subject's course PDF.

    The questions plus optional grading results live in JSONField columns so
    we don't need a separate questions/answers schema – the LLM hands us the
    JSON shape defined in `quizzes/prompt_template.txt` and we persist it as-is
    so the frontend can render it without re-parsing.
    """

    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("fr", "French"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="quizzes")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="quizzes")
    session = models.ForeignKey(
        Session,
        on_delete=models.SET_NULL,
        related_name="quizzes",
        null=True,
        blank=True,
    )

    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default="en")
    difficulty = models.IntegerField(default=3)
    num_questions = models.IntegerField(default=5)
    question_types = models.JSONField(default=list)

    # Raw LLM payload: {"subject": ..., "quiz": [...], "grading": {...}}.
    questions = models.JSONField(default=list)
    grading = models.JSONField(null=True, blank=True)

    score_total = models.IntegerField(default=0)
    score_max = models.IntegerField(default=0)
    score_percent = models.FloatField(default=0.0)
    rating_label = models.CharField(max_length=32, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Quiz #{self.pk} - {self.subject.name} ({self.user.username})"
