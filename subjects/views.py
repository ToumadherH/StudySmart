from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from .models import Subject
from .serializers import SubjectSerializer


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Subject.objects.filter(owner=user).annotate(
            total_sessions=Count(
                'sessions',
                filter=Q(sessions__user=user),
                distinct=True,
            ),
            completed_sessions=Count(
                'sessions',
                filter=Q(sessions__user=user, sessions__status='completed'),
                distinct=True,
            ),
        ).order_by('id')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

