from django.db import models
from django.contrib.auth.models import User
from subjects.models import Subject


class Session(models.Model):
    STATUS_CHOICES = [
        ('planned', 'Planifiée'),
        ('in_progress', 'En cours'),
        ('completed', 'Complétée'),
    ]

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='sessions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_sessions')
    start_time = models.DateTimeField()
    duration_minutes = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['user', 'start_time']),
        ]

    def __str__(self):
        return f"{self.subject.name} - {self.start_time} ({self.status})"
