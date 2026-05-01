import logging
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from study_sessions.models import Session

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sends email reminders to users for study sessions starting in the next 1 hour.'

    def handle(self, *args, **options):
        now = timezone.now()
        one_hour_from_now = now + timedelta(hours=1)

        # Find sessions that start between now and 1 hour from now, and haven't had a reminder sent yet
        upcoming_sessions = Session.objects.filter(
            start_time__gte=now,
            start_time__lte=one_hour_from_now,
            status='planned',
            reminder_sent=False
        ).select_related('user', 'subject')

        count = 0
        for session in upcoming_sessions:
            if not session.user.email:
                continue

            subject_name = session.subject.name
            start_time_str = session.start_time.strftime('%Y-%m-%d %H:%M')
            
            email_subject = f"Reminder: Upcoming Study Session for {subject_name}"
            email_body = (
                f"Hello {session.user.username},\n\n"
                f"This is a reminder that you have a study session scheduled for {subject_name} "
                f"starting at {start_time_str}.\n\n"
                f"Duration: {session.duration_minutes} minutes.\n\n"
                "Good luck with your studies!\n\n"
                "StudySmart Team"
            )

            try:
                send_mail(
                    subject=email_subject,
                    message=email_body,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[session.user.email],
                    fail_silently=False,
                )
                session.reminder_sent = True
                session.save()
                count += 1
                self.stdout.write(self.style.SUCCESS(f"Sent reminder to {session.user.email} for session {session.id}"))
            except Exception as e:
                logger.error(f"Failed to send email to {session.user.email}: {str(e)}")
                self.stdout.write(self.style.ERROR(f"Failed to send email to {session.user.email}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f"Successfully sent {count} reminder(s)."))
