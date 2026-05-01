import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("study_sessions", "0002_session_completed"),
        ("subjects", "0002_subject_course_pdf_subject_course_pdf_text"),
    ]

    operations = [
        migrations.CreateModel(
            name="Quiz",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("language", models.CharField(choices=[("en", "English"), ("fr", "French")], default="en", max_length=2)),
                ("difficulty", models.IntegerField(default=3)),
                ("num_questions", models.IntegerField(default=5)),
                ("question_types", models.JSONField(default=list)),
                ("questions", models.JSONField(default=list)),
                ("grading", models.JSONField(blank=True, null=True)),
                ("score_total", models.IntegerField(default=0)),
                ("score_max", models.IntegerField(default=0)),
                ("score_percent", models.FloatField(default=0.0)),
                ("rating_label", models.CharField(blank=True, default="", max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "session",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="quizzes",
                        to="study_sessions.session",
                    ),
                ),
                (
                    "subject",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="quizzes",
                        to="subjects.subject",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="quizzes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
