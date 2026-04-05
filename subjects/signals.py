from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Subject
from planning.services import generate_planning


@receiver(post_save, sender=Subject)
def auto_generate_sessions(sender, instance, created, **kwargs):
    """Auto-generate sessions when a new subject is created"""
    if created:  # Only on creation, not updates
        try:
            result = generate_planning(
                instance.owner,
                weeks=2,
                sessions_per_week=10
            )
            print(f"✓ Auto-generated sessions for '{instance.name}': {result.get('total_sessions_created', 0)} sessions created")
        except Exception as e:
            print(f"✗ Error auto-generating sessions for '{instance.name}': {str(e)}")
