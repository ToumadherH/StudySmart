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


class AdaptivePlanningTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="adaptive", password="secret123")
        self.client.force_authenticate(user=self.user)

    def _create_subject(self, *, name="Math", days_until_exam=20, difficulty=3):
        return Subject.objects.create(
            name=name,
            difficulty=difficulty,
            exam_date=timezone.localdate() + timedelta(days=days_until_exam),
            owner=self.user,
        )

    def _create_session(self, subject, *, day_offset, status="planned"):
        return Session.objects.create(
            subject=subject,
            user=self.user,
            start_time=timezone.now() + timedelta(days=day_offset),
            duration_minutes=60,
            status=status,
        )

    def test_adapt_reschedules_missed_sessions(self):
        subject = self._create_subject(days_until_exam=20)

        self._create_session(subject, day_offset=-3, status="completed")
        self._create_session(subject, day_offset=-2, status="completed")
        self._create_session(subject, day_offset=-1, status="completed")
        self._create_session(subject, day_offset=-2, status="planned")
        self._create_session(subject, day_offset=-1, status="planned")

        response = self.client.post(reverse("planning-adapt"), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rescheduled_sessions"], 2)

        future_sessions = Session.objects.filter(
            user=self.user,
            start_time__date__gte=timezone.localdate(),
            status="planned",
        )
        self.assertGreaterEqual(future_sessions.count(), 2)

    def test_adapt_skips_when_no_missed_and_exam_far(self):
        subject = self._create_subject(days_until_exam=40)
        self._create_session(subject, day_offset=-2, status="completed")
        self._create_session(subject, day_offset=-1, status="completed")

        response = self.client.post(reverse("planning-adapt"), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rescheduled_sessions"], 0)

    def test_adapt_adds_sessions_when_exam_near(self):
        subject = self._create_subject(name="Physics", days_until_exam=3, difficulty=4)
        self._create_session(subject, day_offset=-1, status="completed")

        response = self.client.post(reverse("planning-adapt"), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["rescheduled_sessions"], 1)
