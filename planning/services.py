from datetime import datetime, timedelta
from django.utils import timezone
from subjects.models import Subject
from study_sessions.models import Session


def calculate_planning_score(subject, base_date=None):
    """Calculate priority score for a subject based on difficulty and exam proximity"""
    if base_date is None:
        base_date = timezone.now()

    # Convert exam_date to datetime  if it's a date
    exam_datetime = datetime.combine(subject.exam_date, datetime.min.time()) if isinstance(subject.exam_date, (datetime.date, type(None))) else subject.exam_date
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


def generate_planning(user, weeks=2, sessions_per_week=10):
    """
    Generate smart planning for a user
    - More difficult subjects get more sessions
    - Closer exams get higher priority
    """
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

        # Create sessions spread across the weeks
        session_duration = 60  # 60 minutes default
        sessions_created = 0

        for week in range(weeks):
            for day in range(7):
                if sessions_created >= sessions_for_subject:
                    break

                # Random hour between 9 AM and 8 PM
                random_hour = 9 + (sessions_created % 11)
                session_date = base_date + timedelta(weeks=week, days=day, hours=random_hour)

                # Check if session doesn't already exist at this time
                existing = Session.objects.filter(
                    user=user,
                    subject=subject,
                    start_time=session_date
                ).exists()

                if not existing:
                    Session.objects.create(
                        user=user,
                        subject=subject,
                        start_time=session_date,
                        duration_minutes=session_duration,
                        status='planned',
                    )
                    sessions_created += 1
                    total_sessions_created += 1

            if sessions_created >= sessions_for_subject:
                break

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
