from rest_framework import serializers

from .models import Quiz


class QuizSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id",
            "subject",
            "subject_name",
            "session",
            "language",
            "difficulty",
            "num_questions",
            "question_types",
            "questions",
            "grading",
            "score_total",
            "score_max",
            "score_percent",
            "rating_label",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "subject_name",
            "questions",
            "grading",
            "score_total",
            "score_max",
            "score_percent",
            "rating_label",
            "created_at",
            "updated_at",
        ]


class GenerateQuizRequestSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()
    session_id = serializers.IntegerField(required=False, allow_null=True)
    language = serializers.ChoiceField(choices=["en", "fr"], default="en")
    difficulty = serializers.IntegerField(min_value=1, max_value=5, required=False)
    num_questions = serializers.IntegerField(min_value=1, max_value=15, default=5)
    question_types = serializers.ListField(
        child=serializers.ChoiceField(choices=["mcq", "true_false", "short_answer"]),
        required=False,
        allow_empty=False,
    )


class GradeAnswerSerializer(serializers.Serializer):
    id = serializers.CharField()
    user_answer = serializers.CharField(allow_blank=True, allow_null=True)


class GradeQuizRequestSerializer(serializers.Serializer):
    answers = serializers.ListField(child=GradeAnswerSerializer(), allow_empty=False)
