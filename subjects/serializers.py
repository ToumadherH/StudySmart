from rest_framework import serializers
from .models import Subject


class SubjectSerializer(serializers.ModelSerializer):
    total_sessions = serializers.SerializerMethodField()
    completed_sessions = serializers.SerializerMethodField()
    has_course_pdf = serializers.SerializerMethodField()
    # Frontend-only convenience: lets callers clear the file by sending
    # `remove_course_pdf=true` (multipart-friendly: DRF can't unset a FileField
    # with `null` over multipart).
    remove_course_pdf = serializers.BooleanField(write_only=True, required=False)

    def _get_request_user(self):
        request = self.context.get('request')
        if not request or request.user.is_anonymous:
            return None
        return request.user

    def get_total_sessions(self, obj):
        # Reuse annotated values when available to avoid extra queries.
        annotated = getattr(obj, 'total_sessions', None)
        if annotated is not None:
            return annotated

        user = self._get_request_user()
        queryset = obj.sessions.all()
        if user is not None:
            queryset = queryset.filter(user=user)
        return queryset.count()

    def get_completed_sessions(self, obj):
        # Reuse annotated values when available to avoid extra queries.
        annotated = getattr(obj, 'completed_sessions', None)
        if annotated is not None:
            return annotated

        user = self._get_request_user()
        queryset = obj.sessions.filter(status='completed')
        if user is not None:
            queryset = queryset.filter(user=user)
        return queryset.count()

    def get_has_course_pdf(self, obj):
        return bool(obj.course_pdf) and bool(obj.course_pdf_text)

    def validate_course_pdf(self, value):
        if value is None:
            return value
        # 10MB cap is generous for course handouts and keeps text extraction fast.
        max_bytes = 10 * 1024 * 1024
        if value.size and value.size > max_bytes:
            raise serializers.ValidationError("PDF must be 10MB or less.")
        name = (getattr(value, 'name', '') or '').lower()
        content_type = getattr(value, 'content_type', '') or ''
        if not name.endswith('.pdf') and 'pdf' not in content_type.lower():
            raise serializers.ValidationError("File must be a PDF.")
        return value

    def create(self, validated_data):
        validated_data.pop('remove_course_pdf', False)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        remove_pdf = validated_data.pop('remove_course_pdf', False)
        if remove_pdf:
            instance.course_pdf = None
            instance.course_pdf_text = ''
        return super().update(instance, validated_data)

    class Meta:
        model = Subject
        fields = [
            'id',
            'name',
            'difficulty',
            'exam_date',
            'owner',
            'total_sessions',
            'completed_sessions',
            'course_pdf',
            'has_course_pdf',
            'remove_course_pdf',
        ]
        read_only_fields = ['id', 'owner', 'total_sessions', 'completed_sessions', 'has_course_pdf']
