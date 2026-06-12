import os
from flask import Flask
from app.extensions import db, csrf
from config.config import (SECRET_KEY, SQLALCHEMY_DATABASE_URI,
                            SQLALCHEMY_TRACK_MODIFICATIONS)

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def create_app(config_overrides=None):
    app = Flask(
        __name__,
        template_folder=os.path.join(_BASE, 'templates'),
        static_folder=os.path.join(_BASE, 'static'),
    )
    app.config['SECRET_KEY'] = SECRET_KEY
    app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = SQLALCHEMY_TRACK_MODIFICATIONS
    app.config['WTF_CSRF_ENABLED'] = True

    if config_overrides:
        app.config.update(config_overrides)

    db.init_app(app)
    csrf.init_app(app)

    from app.routes.landing import landing_bp
    from app.routes.officer import officer_bp
    from app.routes.member import member_bp
    app.register_blueprint(landing_bp)
    app.register_blueprint(officer_bp, url_prefix='/officer')
    app.register_blueprint(member_bp, url_prefix='/member')

    with app.app_context():
        # Import models so SQLAlchemy metadata is populated before create_all
        from app.models import user, event, signup  # noqa: F401
        db.create_all()
        if app.config.get('SEED_DATA', True):
            _seed_demo_data()

    return app


def _seed_demo_data():
    from app.models.user import User
    from app.models.event import Event
    from app.models.signup import EventSignup
    from datetime import date

    if User.query.count() > 0:
        return

    officer = User(id=1, first_name='Officer', last_name='',
                   email='officer@demo.local', role='officer')
    member = User(id=2, first_name='Member', last_name='1',
                  email='member1@demo.local', role='member')
    db.session.add_all([officer, member])
    db.session.flush()

    # Completed past event — member attended (3 hrs)
    past = Event(title='Winter Food Drive',
                 description='Sorted and packaged donations at the local food bank.',
                 date=date(2025, 11, 15), location='Aberjona Food Bank',
                 hours_value=3.0, status='completed', created_by_id=1)
    db.session.add(past)
    db.session.flush()
    db.session.add(EventSignup(event_id=past.id, user_id=2, attended=True, marked_by_id=1))

    # Active upcoming event
    active = Event(title='Spring Concert Volunteering',
                   description='Help set up chairs and assist audience members.',
                   date=date(2026, 6, 20), location='Aberjona High School Auditorium',
                   hours_value=2.0, status='active', created_by_id=1)
    db.session.add(active)

    # Pending event request from member
    pending = Event(title='Library Reading Program',
                    description='Read to elementary students at the local library.',
                    date=date(2026, 7, 10), location='Aberjona Public Library',
                    hours_value=1.5, status='pending_approval', created_by_id=2)
    db.session.add(pending)

    db.session.commit()
