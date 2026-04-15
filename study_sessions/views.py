from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Prefetch
from .models import Session
from .serializers import SessionSerializer
from planning.services import get_dashboard_stats
from planning.serializers import DashboardStatsSerializer


class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _to_local_date(datetime_value):
        if timezone.is_aware(datetime_value):
            return timezone.localtime(datetime_value).date()
        return datetime_value.date()

    def _is_future_session(self, session):
        return self._to_local_date(session.start_time) > timezone.localdate()

    @staticmethod
    def _is_truthy(value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {'true', '1', 'yes', 'on'}
        return bool(value)

    def _is_completion_attempt(self, data):
        status_value = data.get('status') if hasattr(data, 'get') else None
        completed_value = data.get('completed') if hasattr(data, 'get') else None
        return status_value == 'completed' or self._is_truthy(completed_value) is True

    @staticmethod
    def _future_completion_response():
        return Response(
            {'error': 'You cannot complete a future session'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _get_dashboard_stats_data(self):
        stats = get_dashboard_stats(self.request.user)
        return DashboardStatsSerializer(stats).data

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
        if self._is_future_session(session):
            return self._future_completion_response()

        session.status = 'completed'
        session.completed = True
        session.save(update_fields=['status', 'completed', 'updated_at'])
        serializer = self.get_serializer(session)
        response_data = serializer.data
        response_data['dashboard_stats'] = self._get_dashboard_stats_data()
        return Response(response_data)

    def update(self, request, *args, **kwargs):
        session = self.get_object()
        if self._is_completion_attempt(request.data) and self._is_future_session(session):
            return self._future_completion_response()

        response = super().update(request, *args, **kwargs)
        if response.status_code < 400 and ('status' in request.data or 'completed' in request.data):
            response.data['dashboard_stats'] = self._get_dashboard_stats_data()
        return response

    def partial_update(self, request, *args, **kwargs):
        session = self.get_object()
        if self._is_completion_attempt(request.data) and self._is_future_session(session):
            return self._future_completion_response()

        response = super().partial_update(request, *args, **kwargs)
        if response.status_code < 400 and ('status' in request.data or 'completed' in request.data):
            response.data['dashboard_stats'] = self._get_dashboard_stats_data()
        return response

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
