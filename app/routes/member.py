from flask import Blueprint, render_template, request, redirect, url_for, flash, g
from app.extensions import db
from app.models.user import User
from app.models.event import Event
from app.models.signup import EventSignup
from app.utils.hours import hours_earned, hours_remaining, progress_color, YEARLY_HOURS_GOAL
from config.config import DEMO_MEMBER_ID
from datetime import date

member_bp = Blueprint('member', __name__)


@member_bp.before_request
def set_current_user():
    g.current_user = db.get_or_404(User, DEMO_MEMBER_ID)


@member_bp.route('/dashboard')
def dashboard():
    earned = round(hours_earned(g.current_user), 1)
    remaining = round(hours_remaining(g.current_user), 1)
    pct = min(round(earned / YEARLY_HOURS_GOAL * 100), 100)
    color = progress_color(earned)

    my_signup_ids = {s.event_id for s in
                     EventSignup.query.filter_by(user_id=g.current_user.id).all()}

    upcoming = Event.query.filter(
        Event.id.in_(my_signup_ids),
        Event.status == 'active',
        Event.date >= date.today(),
    ).order_by(Event.date).all()

    my_requests = Event.query.filter(
        Event.created_by_id == g.current_user.id,
        Event.status.in_(['pending_approval', 'cancelled']),
    ).order_by(Event.created_at.desc()).all()

    return render_template('member/dashboard.html',
                           earned=earned, remaining=remaining, pct=pct, color=color,
                           goal=YEARLY_HOURS_GOAL, upcoming=upcoming,
                           my_requests=my_requests)


@member_bp.route('/events', methods=['GET', 'POST'])
def events():
    if request.method == 'POST':
        action = request.form['action']
        event_id = int(request.form['event_id'])

        if action == 'signup':
            if not EventSignup.query.filter_by(event_id=event_id,
                                               user_id=g.current_user.id).first():
                db.session.add(EventSignup(event_id=event_id, user_id=g.current_user.id))
                db.session.commit()
                flash('Signed up!', 'success')
            else:
                flash('You are already signed up.', 'info')

        elif action == 'withdraw':
            signup = EventSignup.query.filter_by(event_id=event_id,
                                                 user_id=g.current_user.id).first()
            if signup:
                db.session.delete(signup)
                db.session.commit()
                flash('Withdrawn from event.', 'warning')

        return redirect(url_for('member.events'))

    active_events = Event.query.filter_by(status='active').order_by(Event.date).all()
    my_signups = {s.event_id for s in
                  EventSignup.query.filter_by(user_id=g.current_user.id).all()}
    return render_template('member/events.html', events=active_events, my_signups=my_signups)


@member_bp.route('/request-event', methods=['GET', 'POST'])
def request_event():
    if request.method == 'POST':
        event = Event(
            title=request.form['title'],
            description=request.form.get('description', ''),
            date=date.fromisoformat(request.form['date']),
            location=request.form.get('location', ''),
            hours_value=float(request.form['hours_value']),
            status='pending_approval',
            created_by_id=g.current_user.id,
        )
        db.session.add(event)
        db.session.commit()
        flash('Event request submitted. An officer will review it.', 'success')
        return redirect(url_for('member.dashboard'))
    return render_template('member/request_event.html')
