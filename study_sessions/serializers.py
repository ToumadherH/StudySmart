from rest_framework import serializers
from .models import Session
from subjects.serializers import SubjectSerializer


class SessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.IntegerField(write_only=True)

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
            'status',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
