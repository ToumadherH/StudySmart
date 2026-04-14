from rest_framework import serializers
from .models import Subject


class SubjectSerializer(serializers.ModelSerializer):
    total_sessions = serializers.SerializerMethodField()
    completed_sessions = serializers.SerializerMethodField()

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
        ]
        read_only_fields = ['id', 'owner', 'total_sessions', 'completed_sessions']
