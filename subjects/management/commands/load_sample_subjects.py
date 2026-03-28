from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from subjects.models import Subject


class Command(BaseCommand):
    help = "Load some sample subjects for a given user (by username)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            type=str,
            required=True,
            help="Username to own the created subjects.",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        username = options["username"]

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"User '{username}' does not exist."))
            return

        samples = [
            {"name": "Mathematics", "difficulty": 4, "days_ahead": 30},
            {"name": "Physics", "difficulty": 4, "days_ahead": 45},
            {"name": "Chemistry", "difficulty": 3, "days_ahead": 40},
            {"name": "Biology", "difficulty": 2, "days_ahead": 35},
            {"name": "History", "difficulty": 2, "days_ahead": 25},
            {"name": "English", "difficulty": 1, "days_ahead": 20},
            {"name": "Computer Science", "difficulty": 5, "days_ahead": 50},
        ]

        created = 0
        for s in samples:
            exam_date = date.today() + timedelta(days=s["days_ahead"])
            subject, was_created = Subject.objects.get_or_create(
                owner=user,
                name=s["name"],
                defaults={
                    "difficulty": s["difficulty"],
                    "exam_date": exam_date,
                },
            )
            if was_created:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Loaded sample subjects for '{username}'. New subjects created: {created}."
            )
        )

