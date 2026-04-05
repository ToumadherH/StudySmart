from datetime import datetime, timedelta, date
import random
from django.utils import timezone
from subjects.models import Subject
from study_sessions.models import Session


def calculate_planning_score(subject, base_date=None):
    """Calculate priority score for a subject based on difficulty and exam proximity"""
    if base_date is None:
        base_date = timezone.now()

    # Convert exam_date to datetime  if it's a date
    exam_datetime = datetime.combine(subject.exam_date, datetime.min.time()) if isinstance(subject.exam_date, (date, type(None))) else subject.exam_date
    exam_datetime = timezone.make_aware(exam_datetime) if exam_datetime else None

    # If no exam date, use 30 days as default
    if not exam_datetime:
        days_until_exam = 30
    else:
        days_until_exam= max((exam_datetime - base_date).days, 1)

    # Score = (difficulty * 0.6) + (urgency * 0.4)
    # Difficulty: 1-5 scale
    # Urgency: closer exam = higher urgency (max 5 scale, 7 days or less = 5)
    difficulty_weight = subject.difficulty / 5.0
    urgency_weight = min(7 / max(days_until_exam, 1), 1.0)  # Max at 7 days or less

    score = (difficulty_weight * 0.6) + (urgency_weight * 0.4)
    return score, days_until_exam


def generate_planning(user, weeks=2, sessions_per_week=10, clear_existing=True):
    """
    Generate smart planning for a user
    - More difficult subjects get more sessions
    - Closer exams get higher priority
    - clear_existing: If True, deletes old sessions before generating new ones
    """
    # Delete old sessions if clear_existing is True
    if clear_existing:
        Session.objects.filter(user=user).delete()

    subjects = user.subjects.all()

    if not subjects:
        return {'success': False, 'message': 'No subjects found'}

    # Calculate scores for each subject
    scored_subjects = []
    for subject in subjects:
        score, days_until = calculate_planning_score(subject)
        scored_subjects.append({
            'subject': subject,
            'score': score,
            'days_until': days_until,
        })

    # Sort by score (highest first)
    scored_subjects.sort(key=lambda x: x['score'], reverse=True)

    # Calculate total score
    total_score = sum(s['score'] for s in scored_subjects)

    if total_score == 0:
        return {'success': False, 'message': 'Could not calculate planning scores'}

    # Generate sessions
    base_date = timezone.now()
    total_sessions_created = 0
    created_sessions_by_subject = []

    for item in scored_subjects:
        subject = item['subject']
        score = item['score']

        # Proportional allocation: sessions_for_subject = (score / total_score) * total_sessions_available
        total_sessions_available = sessions_per_week * weeks
        sessions_for_subject = max(int((score / total_score) * total_sessions_available), 2)  # At least 2 sessions

        # Create sessions spread across the weeks with improved scheduling
        session_duration = 60  # 60 minutes default

        # Define available time slots (realistic study times)
        time_slots = [9, 10, 11, 13, 14, 15, 17, 18, 19]  # 9AM-11AM, 1PM-3PM, 5PM-7PM
        weekdays = [0, 1, 2, 3, 4]  # Monday-Friday only

        # Determine cutoff date: sessions must be BEFORE exam date
        exam_date = subject.exam_date
        if exam_date:
            exam_datetime = datetime.combine(exam_date, datetime.min.time())
            exam_datetime = timezone.make_aware(exam_datetime)
            cutoff_date = exam_datetime
        else:
            cutoff_date = base_date + timedelta(weeks=weeks)

        # Generate available slots ONLY before the cutoff date
        available_slots = []
        current_date = base_date.replace(hour=0, minute=0, second=0, microsecond=0)

        while current_date.date() < cutoff_date.date():
            weekday = current_date.weekday()
            if weekday in weekdays:  # Only weekdays
                for hour in time_slots:
                    slot_time = current_date.replace(hour=hour, minute=0, second=0)
                    if slot_time < cutoff_date:  # Must be before exam
                        available_slots.append(slot_time)
            current_date += timedelta(days=1)

        # Shuffle to randomize schedule
        random.shuffle(available_slots)

        # Create sessions from available slots
        sessions_created = 0
        for slot_time in available_slots:
            if sessions_created >= sessions_for_subject:
                break

            # Check 1: No session at this time from ANY subject (time conflict)
            time_conflict = Session.objects.filter(
                user=user,
                start_time=slot_time
            ).exists()

            if time_conflict:
                continue

            # Check 2: Subject already has session on this day (one session per day per subject)
            same_day_session = Session.objects.filter(
                user=user,
                subject=subject,
                start_time__date=slot_time.date()
            ).exists()

            if same_day_session:
                continue

            # All checks passed, create session
            Session.objects.create(
                user=user,
                subject=subject,
                start_time=slot_time,
                duration_minutes=session_duration,
                status='planned',
            )
            sessions_created += 1
            total_sessions_created += 1

        if sessions_created > 0:
            created_sessions_by_subject.append({
                'subject': subject.name,
                'sessions_created': sessions_created,
                'total_duration_hours': (sessions_created * session_duration) / 60,
            })

    return {
        'success':True,
        'total_sessions_created': total_sessions_created,
        'by_subject': created_sessions_by_subject,
    }


def get_dashboard_stats(user):
    """Get dashboard statistics for a user"""
    sessions = Session.objects.filter(user=user)
    subjects = user.subjects.all()

    total_sessions = sessions.count()
    completed_sessions = sessions.filter(status='completed').count()
    progress_percentage = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0

    # Sessions this week
    week_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    week_start -= timedelta(days=week_start.weekday())
    sessions_this_week = sessions.filter(start_time__gte=week_start).count()

    # Upcoming exams (next 30 days)
    today = timezone.now()
    upcoming_exams = []
    for subject in subjects:
        if subject.exam_date:
            exam_date = datetime.combine(subject.exam_date, datetime.min.time())
            exam_date = timezone.make_aware(exam_date)
            days_left = (exam_date - today).days

            if 0 <= days_left <= 30:
                sessions_completed = sessions.filter(
                    subject=subject,
                    status='completed'
                ).count()
                upcoming_exams.append({
                    'subject': subject.name,
                    'exam_date': subject.exam_date.isoformat(),
                    'days_left': days_left,
                    'sessions_completed': sessions_completed,
                })

    # By subject stats
    by_subject = []
    for subject in subjects:
        subject_sessions = sessions.filter(subject=subject)
        completed = subject_sessions.filter(status='completed').count()
        total = subject_sessions.count()

        by_subject.append({
            'subject': subject.name,
            'difficulty': subject.difficulty,
            'completed': completed,
            'total': total,
        })

    return {
        'total_sessions': total_sessions,
        'completed_sessions': completed_sessions,
        'progress_percentage': round(progress_percentage, 2),
        'sessions_this_week': sessions_this_week,
        'upcoming_exams': upcoming_exams,
        'by_subject': by_subject,
    }
