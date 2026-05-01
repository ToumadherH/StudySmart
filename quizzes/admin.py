from django.contrib import admin

from .models import Quiz


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "subject", "session", "language", "difficulty", "score_percent", "created_at")
    list_filter = ("language", "difficulty", "rating_label")
    search_fields = ("subject__name", "user__username")
    readonly_fields = ("created_at", "updated_at")
