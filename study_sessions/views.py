from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Prefetch
from .models import Session
from .serializers import SessionSerializer


class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Optimize with select_related to avoid N+1 queries
        return Session.objects.filter(user=self.request.user).select_related(
            'subject', 'user'
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """Mark a session as completed"""
        session = self.get_object()
        session.status = 'completed'
        session.save(update_fields=['status', 'updated_at'])
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_subject(self, request):
        """Get sessions by subject"""
        subject_id = request.query_params.get('subject_id')
        if not subject_id:
            return Response({'error': 'subject_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        sessions = self.get_queryset().filter(subject_id=subject_id)
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming sessions from today onwards"""
        sessions = self.get_queryset().filter(
            start_time__gte=timezone.now()
        ).order_by('start_time')[:50]  # Limit to 50 for performance
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)
