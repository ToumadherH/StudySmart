from rest_framework import serializers
from .models import Subject


class SubjectSerializer(serializers.ModelSerializer):
    completed_sessions = serializers.SerializerMethodField()
    total_sessions = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ['id', 'name', 'difficulty', 'exam_date', 'owner', 'completed_sessions', 'total_sessions']
        read_only_fields = ['id', 'owner']

    def get_completed_sessions(self, obj):
        """Count completed sessions for this subject"""
        return obj.sessions.filter(status='completed').count()

    def get_total_sessions(self, obj):
        """Count total sessions for this subject"""
        return obj.sessions.count()
