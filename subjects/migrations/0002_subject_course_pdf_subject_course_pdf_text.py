from django.db import migrations, models

import subjects.models


class Migration(migrations.Migration):

    dependencies = [
        ("subjects", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="subject",
            name="course_pdf",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to=subjects.models.subject_pdf_upload_path,
            ),
        ),
        migrations.AddField(
            model_name="subject",
            name="course_pdf_text",
            field=models.TextField(blank=True, default=""),
        ),
    ]
