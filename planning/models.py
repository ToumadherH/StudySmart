from django.db import models
from django.contrib.auth.models import User
from subjects.models import Subject


class Planning(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='plannings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plannings')
    study_date = models.DateField()
    duration_hours = models.IntegerField()
    is_completed = models.BooleanField(default=False)
    priority = models.FloatField()

    def __str__(self):
        return f"{self.subject.name} - {self.study_date}"
