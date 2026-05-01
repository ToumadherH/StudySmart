from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


def subject_pdf_upload_path(instance, filename):
    """Store PDFs under media/subject_pdfs/<user_id>/<filename>."""
    owner_id = instance.owner_id or "anon"
    return f"subject_pdfs/{owner_id}/{filename}"


class Subject(models.Model):
    name = models.CharField(max_length=50)
    difficulty = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    exam_date = models.DateField()
    course_pdf_text = models.TextField(blank=True, default="")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subjects')

    # Course material used by the AI quiz generator. The PDF is uploaded by the
    # user and the extracted text is cached so the LLM call doesn't have to
    # re-parse the file every time.
    course_pdf = models.FileField(
        upload_to=subject_pdf_upload_path,
        null=True,
        blank=True,
    )
    course_pdf_text = models.TextField(blank=True, default="")

    def __str__(self):
        return self.name

    @property
    def has_course_pdf(self):
        return bool(self.course_pdf) and bool(self.course_pdf_text)
