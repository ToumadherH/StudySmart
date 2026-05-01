import logging

from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q

from .models import Subject
from .serializers import SubjectSerializer
from .pdf_utils import extract_pdf_text

logger = logging.getLogger(__name__)


class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    # Accept JSON for the regular CRUD shape and multipart for PDF uploads.
    parser_classes = [JSONParser, MultiPartParser, FormParser]

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

    def _apply_pdf_side_effects(self, subject, validated_data):
        """Handle PDF text extraction and removal flag after save."""
        remove_pdf = validated_data.get('remove_course_pdf')
        if remove_pdf:
            if subject.course_pdf:
                subject.course_pdf.delete(save=False)
            subject.course_pdf = None
            subject.course_pdf_text = ""
            subject.save(update_fields=['course_pdf', 'course_pdf_text'])
            return

        if 'course_pdf' in validated_data and subject.course_pdf:
            try:
                subject.course_pdf_text = extract_pdf_text(subject.course_pdf)
            except Exception:
                logger.exception("Failed to extract text from PDF for subject %s", subject.id)
                subject.course_pdf_text = ""
            subject.save(update_fields=['course_pdf_text'])

    def perform_create(self, serializer):
        validated_data = dict(serializer.validated_data)
        validated_data.pop('remove_course_pdf', None)
        subject = serializer.save(owner=self.request.user)
        self._apply_pdf_side_effects(subject, serializer.validated_data)

    def perform_update(self, serializer):
        subject = serializer.save()
        self._apply_pdf_side_effects(subject, serializer.validated_data)
