from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Prefetch, Count, Q
from .models import Planning
from .serializers import PlanningSerializer, GeneratedPlanningResponseSerializer, DashboardStatsSerializer
from .services import generate_planning, get_dashboard_stats
from study_sessions.models import Session


class PlanningViewSet(viewsets.ModelViewSet):
    serializer_class = PlanningSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Optimize with select_related and prefetch_related
        sessions_prefetch = Prefetch(
            'subject__sessions',
            Session.objects.filter(user=self.request.user).select_related('user')
        )
        return Planning.objects.filter(user=self.request.user).select_related(
            'subject', 'user'
        ).prefetch_related(sessions_prefetch).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate smart planning based on difficulty and exam proximity"""
        weeks = request.data.get('weeks', 2)
        sessions_per_week = request.data.get('sessions_per_week', 10)

        result = generate_planning(
            request.user,
            weeks=weeks,
            sessions_per_week=sessions_per_week
        )

        if result['success']:
            return Response(result, status=status.HTTP_201_CREATED)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics with optimized queries"""
        stats = get_dashboard_stats(request.user)
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def exams_timeline(self, request):
        """Get upcoming exams timeline"""
        stats = get_dashboard_stats(request.user)
        return Response({
            'upcoming_exams': stats['upcoming_exams']
        })

