from datetime import datetime, timedelta, date, time
from collections import defaultdict
import random
from django.db.models import Count, Q
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
        weekdays = [0, 1, 2, 3, 4, 5, 6]  # All week

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
            if weekday in weekdays:
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


def generate_sessions_for_subject(user, subject, weeks=2, sessions_per_week=2):
    """
    Generate sessions for a single subject without affecting existing subjects.
    Used by the auto-generate signal when a new subject is created.
    """
    # Calculate score for this subject
    score, days_until = calculate_planning_score(subject)

    # Sessions for this subject
    total_sessions_available = sessions_per_week * weeks
    sessions_for_subject = max(int(total_sessions_available), 2)

    # Create sessions spread across the weeks with improved scheduling
    session_duration = 60  # 60 minutes default

    # Define available time slots (realistic study times)
    time_slots = [9, 10, 11, 13, 14, 15, 17, 18, 19]  # 9AM-11AM, 1PM-3PM, 5PM-7PM
    weekdays = [0, 1, 2, 3, 4, 5, 6]  # All week

    base_date = timezone.now()

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
        if weekday in weekdays:
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

    return sessions_created


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


DEFAULT_TIME_SLOTS = [9, 10, 11, 13, 14, 15, 17, 18, 19]
DEFAULT_WEEKDAYS = {0, 1, 2, 3, 4, 5, 6}


def getMissedSessions(user):
    return AdaptivePlanner(user).get_missed_sessions()


def analyzeUserPerformance(user):
    return AdaptivePlanner(user).analyze_user_performance()


def redistributeSessions(user, **options):
    planner = AdaptivePlanner(user, **options)
    missed_sessions = planner.get_missed_sessions()
    performance = planner.analyze_user_performance(missed_sessions=missed_sessions)
    return planner.redistribute_sessions(missed_sessions, performance)


def adjustFuturePlanning(user, **options):
    planner = AdaptivePlanner(user, **options)
    missed_sessions = planner.get_missed_sessions()
    performance = planner.analyze_user_performance(missed_sessions=missed_sessions)
    return planner.adjust_future_planning(missed_sessions, performance)


class AdaptivePlanner:
    def __init__(
        self,
        user,
        max_sessions_per_day=3,
        horizon_days=14,
        time_slots=None,
        weekdays=None,
    ):
        self.user = user
        self.max_sessions_per_day = int(max_sessions_per_day)
        self.horizon_days = int(horizon_days)
        self.time_slots = list(time_slots or DEFAULT_TIME_SLOTS)
        self.weekdays = set(weekdays or DEFAULT_WEEKDAYS)
        self.now = timezone.localtime(timezone.now())
        self.today = self.now.date()
        self.tz = timezone.get_current_timezone()
        self.subjects = list(user.subjects.all())
        self.subject_map = {subject.id: subject for subject in self.subjects}

    def get_missed_sessions(self):
        return Session.objects.filter(
            user=self.user,
            start_time__date__lt=self.today,
        ).exclude(Q(status='completed') | Q(completed=True))

    def analyze_user_performance(self, missed_sessions=None):
        if missed_sessions is None:
            missed_sessions = self.get_missed_sessions()

        window_start = self.now - timedelta(days=30)
        recent_sessions = Session.objects.filter(
            user=self.user,
            start_time__gte=window_start,
        )

        overall = recent_sessions.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed') | Q(completed=True)),
        )
        overall_total = overall.get('total') or 0
        overall_completed = overall.get('completed') or 0
        overall_rate = (overall_completed / overall_total) if overall_total else 0.0

        subject_stats = {
            subject_id: {
                'total': 0,
                'completed': 0,
                'completion_rate': overall_rate,
                'missed': 0,
            }
            for subject_id in self.subject_map
        }

        for row in recent_sessions.values('subject_id').annotate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed') | Q(completed=True)),
        ):
            subject_id = row['subject_id']
            total = row.get('total') or 0
            completed = row.get('completed') or 0
            subject_stats.setdefault(subject_id, {})
            subject_stats[subject_id].update({
                'total': total,
                'completed': completed,
                'completion_rate': (completed / total) if total else overall_rate,
            })

        for row in missed_sessions.values('subject_id').annotate(missed=Count('id')):
            subject_id = row['subject_id']
            subject_stats.setdefault(subject_id, {})
            subject_stats[subject_id]['missed'] = row.get('missed') or 0

        return {
            'overall': {
                'total': overall_total,
                'completed': overall_completed,
                'completion_rate': overall_rate,
            },
            'by_subject': subject_stats,
        }

    def adjust_future_planning(self, missed_sessions, performance):
        result = self.redistribute_sessions(missed_sessions, performance)
        if result.get('success') and result.get('rescheduled_sessions', 0) > 0:
            result['message'] = 'Your planning has been updated based on your progress.'
        elif result.get('success'):
            result['message'] = 'No adaptive changes were needed right now.'
        return result

    def _build_slot_datetime(self, day, hour):
        slot = datetime.combine(day, time(hour=hour))
        if timezone.is_aware(self.now):
            return timezone.make_aware(slot, self.tz)
        return slot

    def _subject_allows_day(self, subject_id, day):
        subject = self.subject_map.get(subject_id)
        if subject is None:
            return False
        if subject.exam_date and day > subject.exam_date:
            return False
        return True

    def _exam_boost(self, days_remaining):
        if days_remaining is None:
            return 0
        if days_remaining < 0:
            return 0
        if days_remaining < 5:
            return 2
        if days_remaining < 10:
            return 1
        return 0

    def _performance_adjustment(self, completion_rate, missed_count):
        if missed_count >= 3 or completion_rate <= 0.5:
            return 1
        if completion_rate >= 0.8 and missed_count == 0:
            return -1
        return 0

    def _build_priority(self, subject, missed_count, completion_rate):
        base_score, days_until = calculate_planning_score(subject, base_date=self.now)
        priority = base_score
        priority += min(missed_count, 3) * 0.35
        if days_until < 5:
            priority += 0.4
        elif days_until < 10:
            priority += 0.2
        priority += max(0, 0.7 - completion_rate) * 0.5
        return priority, days_until

    def _find_next_available_slot(
        self,
        subject_id,
        start_day,
        end_day,
        occupied_slots,
        daily_counts,
        subjects_by_day,
    ):
        day = start_day
        while day <= end_day:
            if day.weekday() in self.weekdays and self._subject_allows_day(subject_id, day):
                if daily_counts[day] < self.max_sessions_per_day:
                    for hour in self.time_slots:
                        slot_key = (day, hour)
                        if slot_key in occupied_slots:
                            continue
                        if subject_id in subjects_by_day[day]:
                            continue
                        return self._build_slot_datetime(day, hour), slot_key
            day += timedelta(days=1)
        return None, None

    def _select_subject(self, day, remaining_demand, subjects_by_day, priority_map):
        candidates = []
        for subject_id, remaining in remaining_demand.items():
            if remaining <= 0:
                continue
            if subject_id in subjects_by_day[day]:
                continue
            if not self._subject_allows_day(subject_id, day):
                continue
            candidates.append(subject_id)

        if not candidates:
            return None

        return max(candidates, key=lambda sid: priority_map.get(sid, 0))

    def redistribute_sessions(self, missed_sessions, performance):
        missed_by_subject = performance.get('by_subject', {})
        priority_map = {}
        remaining_demand = {}

        for subject in self.subjects:
            subject_stats = missed_by_subject.get(subject.id, {})
            missed_count = subject_stats.get('missed', 0) or 0
            completion_rate = subject_stats.get('completion_rate', performance['overall']['completion_rate'])
            priority, days_until = self._build_priority(subject, missed_count, completion_rate)
            exam_boost = self._exam_boost(days_until)
            performance_adjustment = self._performance_adjustment(completion_rate, missed_count)
            extra = exam_boost + performance_adjustment
            if extra < 0:
                extra = 0
            demand = missed_count + extra
            if demand <= 0:
                continue
            priority_map[subject.id] = priority
            remaining_demand[subject.id] = demand

        total_demand = sum(remaining_demand.values())
        if total_demand == 0:
            return {
                'success': True,
                'missed_sessions': missed_sessions.count(),
                'rescheduled_sessions': 0,
                'moved_sessions': 0,
                'unassigned_sessions': 0,
                'by_subject': [],
            }

        future_sessions = list(Session.objects.filter(
            user=self.user,
            start_time__gte=self.now,
        ))

        occupied_slots = set()
        daily_counts = defaultdict(int)
        subjects_by_day = defaultdict(set)
        sessions_by_day = defaultdict(list)

        for session in future_sessions:
            local_start = timezone.localtime(session.start_time) if timezone.is_aware(session.start_time) else session.start_time
            day = local_start.date()
            slot_key = (day, local_start.hour)
            occupied_slots.add(slot_key)
            daily_counts[day] += 1
            subjects_by_day[day].add(session.subject_id)
            sessions_by_day[day].append({
                'session': session,
                'slot_key': slot_key,
            })

        start_day = self.today + timedelta(days=1)
        end_day = self.today + timedelta(days=self.horizon_days)

        rescheduled_sessions = 0
        moved_sessions = 0
        scheduled_by_subject = defaultdict(int)

        day = start_day
        while day <= end_day:
            if day.weekday() not in self.weekdays:
                day += timedelta(days=1)
                continue

            for hour in self.time_slots:
                if daily_counts[day] >= self.max_sessions_per_day:
                    break
                slot_key = (day, hour)
                if slot_key in occupied_slots:
                    continue

                subject_id = self._select_subject(day, remaining_demand, subjects_by_day, priority_map)
                if subject_id is None:
                    break

                slot_time = self._build_slot_datetime(day, hour)
                Session.objects.create(
                    user=self.user,
                    subject_id=subject_id,
                    start_time=slot_time,
                    duration_minutes=60,
                    status='planned',
                )
                remaining_demand[subject_id] -= 1
                rescheduled_sessions += 1
                scheduled_by_subject[subject_id] += 1
                occupied_slots.add(slot_key)
                daily_counts[day] += 1
                subjects_by_day[day].add(subject_id)

            if daily_counts[day] >= self.max_sessions_per_day:
                target_subject_id = self._select_subject(day, remaining_demand, subjects_by_day, priority_map)
                if target_subject_id is not None:
                    target_priority = priority_map.get(target_subject_id, 0)
                    movable = sorted(
                        (
                            item for item in sessions_by_day.get(day, [])
                            if item['session'].status != 'completed'
                        ),
                        key=lambda item: priority_map.get(item['session'].subject_id, 0),
                    )
                    candidate = None
                    for item in movable:
                        if priority_map.get(item['session'].subject_id, 0) < target_priority:
                            candidate = item
                            break
                    if candidate is not None:
                        candidate_session = candidate['session']
                        new_start, new_slot_key = self._find_next_available_slot(
                            candidate_session.subject_id,
                            day + timedelta(days=1),
                            end_day,
                            occupied_slots,
                            daily_counts,
                            subjects_by_day,
                        )
                        if new_start is not None:
                            old_slot_key = candidate['slot_key']
                            old_subject_id = candidate_session.subject_id
                            candidate_session.start_time = new_start
                            candidate_session.save(update_fields=['start_time', 'updated_at'])

                            occupied_slots.discard(old_slot_key)
                            occupied_slots.add(new_slot_key)
                            daily_counts[day] -= 1
                            daily_counts[new_start.date()] += 1
                            if not any(
                                item['session'].subject_id == old_subject_id
                                for item in sessions_by_day[day]
                            ):
                                subjects_by_day[day].discard(old_subject_id)
                            subjects_by_day[new_start.date()].add(old_subject_id)

                            sessions_by_day[day] = [
                                item for item in sessions_by_day[day]
                                if item['session'].id != candidate_session.id
                            ]
                            sessions_by_day[new_start.date()].append({
                                'session': candidate_session,
                                'slot_key': new_slot_key,
                            })

                            moved_sessions += 1

                            if old_slot_key not in occupied_slots and remaining_demand.get(target_subject_id, 0) > 0:
                                if target_subject_id not in subjects_by_day[day]:
                                    slot_time = self._build_slot_datetime(day, old_slot_key[1])
                                    Session.objects.create(
                                        user=self.user,
                                        subject_id=target_subject_id,
                                        start_time=slot_time,
                                        duration_minutes=60,
                                        status='planned',
                                    )
                                    remaining_demand[target_subject_id] -= 1
                                    rescheduled_sessions += 1
                                    scheduled_by_subject[target_subject_id] += 1
                                    occupied_slots.add(old_slot_key)
                                    daily_counts[day] += 1
                                    subjects_by_day[day].add(target_subject_id)

            day += timedelta(days=1)

        unassigned = sum(max(value, 0) for value in remaining_demand.values())

        by_subject = []
        for subject in self.subjects:
            subject_id = subject.id
            if subject_id not in remaining_demand and subject_id not in scheduled_by_subject:
                continue
            subject_stats = missed_by_subject.get(subject_id, {})
            by_subject.append({
                'subject': subject.name,
                'subject_id': subject_id,
                'missed': subject_stats.get('missed', 0) or 0,
                'scheduled': scheduled_by_subject.get(subject_id, 0),
                'remaining': max(remaining_demand.get(subject_id, 0), 0),
            })

        return {
            'success': True,
            'missed_sessions': missed_sessions.count(),
            'rescheduled_sessions': rescheduled_sessions,
            'moved_sessions': moved_sessions,
            'unassigned_sessions': unassigned,
            'by_subject': by_subject,
        }
