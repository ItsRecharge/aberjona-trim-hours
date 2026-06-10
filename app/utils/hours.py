from datetime import date

YEARLY_HOURS_GOAL = 10.0
SCHOOL_YEAR_START_MONTH = 9  # September


def school_year_range(today=None):
    if today is None:
        today = date.today()
    start_year = today.year if today.month >= SCHOOL_YEAR_START_MONTH else today.year - 1
    return date(start_year, 9, 1), date(start_year + 1, 8, 31)


def hours_earned(user):
    from app.models.signup import EventSignup
    from app.models.event import Event
    start, end = school_year_range()
    signups = (EventSignup.query
               .join(Event)
               .filter(
                   EventSignup.user_id == user.id,
                   EventSignup.attended == True,
                   Event.date >= start,
                   Event.date <= end,
               ).all())
    return sum(s.event.hours_value for s in signups)


def hours_remaining(user):
    return max(0.0, YEARLY_HOURS_GOAL - hours_earned(user))


def progress_color(earned):
    if earned >= 7:
        return 'success'
    if earned >= 3:
        return 'warning'
    return 'danger'
