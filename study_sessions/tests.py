from datetime import timedelta

from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from subjects.models import Subject
from .models import Session


class SessionProgressFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="secret123")
        self.client.force_authenticate(user=self.user)

        self.subject = Subject.objects.create(
            name="Mathematics",
            difficulty=3,
            exam_date=timezone.localdate() + timedelta(days=21),
            owner=self.user,
        )

        self.session = Session.objects.create(
            subject=self.subject,
            user=self.user,
            start_time=timezone.now() + timedelta(days=1),
            duration_minutes=90,
            status="planned",
        )

    def test_patch_status_returns_updated_dashboard_stats(self):
        url = reverse("session-detail", args=[self.session.id])

        response = self.client.patch(url, {"status": "completed"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "completed")
        self.assertIn("dashboard_stats", response.data)

        self.session.refresh_from_db()
        self.assertEqual(self.session.status, "completed")

        expected_total = Session.objects.filter(user=self.user).count()
        expected_completed = Session.objects.filter(
            user=self.user,
            status="completed",
        ).count()

        self.assertEqual(response.data["dashboard_stats"]["total_sessions"], expected_total)
        self.assertEqual(response.data["dashboard_stats"]["completed_sessions"], expected_completed)

    def test_patch_completed_boolean_updates_status(self):
        url = reverse("session-detail", args=[self.session.id])

        response = self.client.patch(url, {"completed": True}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "completed")
        self.assertTrue(response.data["completed"])

    def test_subject_endpoint_exposes_session_aggregates(self):
        Session.objects.create(
            subject=self.subject,
            user=self.user,
            start_time=timezone.now() + timedelta(days=2),
            duration_minutes=60,
            status="completed",
        )

        response = self.client.get(reverse("subject-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        payload = response.data.get("results", response.data)
        subject_payload = next(item for item in payload if item["id"] == self.subject.id)

        expected_total = Session.objects.filter(user=self.user, subject=self.subject).count()
        expected_completed = Session.objects.filter(
            user=self.user,
            subject=self.subject,
            status="completed",
        ).count()

        self.assertIn("total_sessions", subject_payload)
        self.assertIn("completed_sessions", subject_payload)
        self.assertEqual(subject_payload["total_sessions"], expected_total)
        self.assertEqual(subject_payload["completed_sessions"], expected_completed)
