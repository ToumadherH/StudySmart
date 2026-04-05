from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Subject
from planning.services import generate_sessions_for_subject


@receiver(post_save, sender=Subject)
def auto_generate_sessions(sender, instance, created, **kwargs):
    """Auto-generate sessions when a new subject is created"""
    if created:  # Only on creation, not updates
        try:
            sessions_created = generate_sessions_for_subject(
                user=instance.owner,
                subject=instance,
                weeks=2,
                sessions_per_week=2
            )
            print(f"✓ Auto-generated sessions for '{instance.name}': {sessions_created} sessions created")
        except Exception as e:
            print(f"✗ Error auto-generating sessions for '{instance.name}': {str(e)}")
