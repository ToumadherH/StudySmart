from rest_framework import serializers
from .models import Planning
from study_sessions.models import Session


class PlanningSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Planning
        fields = [
            'id',
            'subject',
            'subject_name',
            'user',
            'study_date',
            'duration_hours',
            'is_completed',
            'priority',
        ]
        read_only_fields = ['id', 'user']


class GeneratedPlanningResponseSerializer(serializers.Serializer):
    """Serializer for the planning generation response"""
    subject = serializers.CharField()
    sessions_created = serializers.IntegerField()
    total_duration = serializers.FloatField()


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_sessions = serializers.IntegerField()
    completed_sessions = serializers.IntegerField()
    progress_percentage = serializers.FloatField()
    sessions_this_week = serializers.IntegerField()
    upcoming_exams = serializers.ListField()
    by_subject = serializers.ListField()
