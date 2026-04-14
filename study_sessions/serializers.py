from rest_framework import serializers
from datetime import timedelta
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

    def validate(self, attrs):
        completed = attrs.get('completed', None)
        status = attrs.get('status', None)

        if completed is not None and status is None:
            attrs['status'] = 'completed' if completed else 'planned'

        if status is not None and completed is None:
            attrs['completed'] = status == 'completed'

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
