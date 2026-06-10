from flask import Blueprint, render_template, request, redirect, url_for, flash, g
from app.extensions import db
from app.models.user import User
from app.models.event import Event
from app.models.signup import EventSignup
from app.utils.hours import hours_earned, hours_remaining, progress_color, YEARLY_HOURS_GOAL
from config.config import DEMO_OFFICER_ID
from datetime import date

officer_bp = Blueprint('officer', __name__)


@officer_bp.before_request
def set_current_user():
    g.current_user = db.get_or_404(User, DEMO_OFFICER_ID)


@officer_bp.route('/dashboard')
def dashboard():
    members = User.query.filter_by(role='member').all()
    rows = []
    for m in members:
        earned = hours_earned(m)
        rows.append({
            'user': m,
            'earned': round(earned, 1),
            'remaining': round(max(0.0, YEARLY_HOURS_GOAL - earned), 1),
            'pct': min(round(earned / YEARLY_HOURS_GOAL * 100), 100),
            'color': progress_color(earned),
        })
    rows.sort(key=lambda r: r['remaining'], reverse=True)
    return render_template('officer/dashboard.html', rows=rows, goal=YEARLY_HOURS_GOAL)


@officer_bp.route('/events', methods=['GET', 'POST'])
def events():
    if request.method == 'POST':
        event = Event(
            title=request.form['title'],
            description=request.form.get('description', ''),
            date=date.fromisoformat(request.form['date']),
            location=request.form.get('location', ''),
            hours_value=float(request.form['hours_value']),
            status='active',
            created_by_id=g.current_user.id,
        )
        db.session.add(event)
        db.session.commit()
        flash('Event created.', 'success')
        return redirect(url_for('officer.events'))
    all_events = Event.query.order_by(Event.date.desc()).all()
    return render_template('officer/events.html', events=all_events)


@officer_bp.route('/events/<int:event_id>/attendance', methods=['GET', 'POST'])
def attendance(event_id):
    event = db.get_or_404(Event, event_id)
    signups = EventSignup.query.filter_by(event_id=event_id).all()
    if request.method == 'POST':
        attended_ids = {int(x) for x in request.form.getlist('attended')}
        for signup in signups:
            signup.attended = signup.user_id in attended_ids
            if signup.attended:
                signup.marked_by_id = g.current_user.id
        event.status = 'completed'
        db.session.commit()
        flash('Attendance saved and event marked complete.', 'success')
        return redirect(url_for('officer.events'))
    return render_template('officer/attendance.html', event=event, signups=signups)


@officer_bp.route('/requests', methods=['GET', 'POST'])
def requests():
    if request.method == 'POST':
        event = db.get_or_404(Event, int(request.form['event_id']))
        action = request.form['action']
        if action == 'approve':
            event.status = 'active'
            event.approved_by_id = g.current_user.id
            flash(f'"{event.title}" approved and is now active.', 'success')
        elif action == 'deny':
            event.status = 'cancelled'
            flash(f'"{event.title}" denied.', 'warning')
        db.session.commit()
        return redirect(url_for('officer.requests'))
    pending = Event.query.filter_by(status='pending_approval').all()
    return render_template('officer/requests.html', pending=pending)


@officer_bp.route('/members')
def members():
    members = User.query.filter_by(role='member').all()
    return render_template('officer/members.html', members=members)
