from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from .models import Session
from subjects.serializers import SubjectSerializer


class SessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.IntegerField()
    end_time = serializers.SerializerMethodField()
    completed = serializers.BooleanField(required=False)

    def get_end_time(self, obj):
        return obj.start_time + timedelta(minutes=obj.duration_minutes)

    @staticmethod
    def _to_local_date(datetime_value):
        if datetime_value is None:
            return None

        if timezone.is_aware(datetime_value):
            return timezone.localtime(datetime_value).date()

        return datetime_value.date()

    def validate(self, attrs):
        status_provided = 'status' in attrs
        completed_provided = 'completed' in attrs

        completed = attrs.get('completed', None)
        status = attrs.get('status', None)

        if completed_provided and status is None:
            attrs['status'] = 'completed' if completed else 'planned'
            status = attrs['status']

        if status_provided and completed is None:
            attrs['completed'] = status == 'completed'
            completed = attrs['completed']

        attempting_completion = False
        if status_provided and attrs.get('status') == 'completed':
            attempting_completion = True
        if completed_provided and attrs.get('completed') is True:
            attempting_completion = True

        target_start_time = attrs.get('start_time')
        if target_start_time is None and self.instance is not None:
            target_start_time = self.instance.start_time

        if attempting_completion and target_start_time is not None:
            session_date = self._to_local_date(target_start_time)
            if session_date and session_date > timezone.localdate():
                raise serializers.ValidationError({'error': 'You cannot complete a future session'})

        return attrs

    class Meta:
        model = Session
        fields = [
            'id',
            'subject',
            'subject_id',
            'subject_name',
            'user',
            'start_time',
            'duration_minutes',
            'end_time',
            'status',
            'completed',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'end_time']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
