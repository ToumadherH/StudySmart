from datetime import timedelta

from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from subjects.models import Subject
from study_sessions.models import Session


class PlanningStatsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="planner", password="secret123")
        self.client.force_authenticate(user=self.user)

        subject = Subject.objects.create(
            name="Physics",
            difficulty=4,
            exam_date=timezone.localdate() + timedelta(days=15),
            owner=self.user,
        )

        Session.objects.create(
            subject=subject,
            user=self.user,
            start_time=timezone.now() + timedelta(days=1),
            duration_minutes=45,
            status="planned",
        )
        Session.objects.create(
            subject=subject,
            user=self.user,
            start_time=timezone.now() + timedelta(days=2),
            duration_minutes=45,
            status="completed",
        )

    def test_stats_endpoint_returns_dynamic_progress(self):
        response = self.client.get(reverse("planning-stats"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected_total = Session.objects.filter(user=self.user).count()
        expected_completed = Session.objects.filter(
            user=self.user,
            status="completed",
        ).count()
        expected_percentage = round((expected_completed / expected_total) * 100, 2)

        self.assertEqual(response.data["total_sessions"], expected_total)
        self.assertEqual(response.data["completed_sessions"], expected_completed)
        self.assertEqual(response.data["progress_percentage"], expected_percentage)
        self.assertIn("by_subject", response.data)

        by_subject_item = response.data["by_subject"][0]
        self.assertGreaterEqual(by_subject_item["total"], by_subject_item["completed"])
