# tests/test_models.py
import pytest
from app import create_app
from app.extensions import db as _db

@pytest.fixture(scope='function')
def app():
    _app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'WTF_CSRF_ENABLED': False,
        'SEED_DATA': False,
    })
    yield _app

@pytest.fixture
def db(app):
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()

def test_user_creation(db):
    from app.models.user import User
    u = User(first_name='Alex', last_name='Johnson', email='alex@test.com', role='officer')
    db.session.add(u)
    db.session.commit()
    assert u.id is not None
    assert u.full_name == 'Alex Johnson'

def test_event_creation(db):
    from app.models.user import User
    from app.models.event import Event
    from datetime import date
    officer = User(id=1, first_name='Alex', last_name='Johnson', email='alex@test.com', role='officer')
    db.session.add(officer)
    db.session.flush()
    event = Event(title='Test Event', date=date(2026, 3, 1), hours_value=2.0,
                  status='active', created_by_id=officer.id)
    db.session.add(event)
    db.session.commit()
    assert event.id is not None
    assert event.hours_value == 2.0

def test_signup_creation(db):
    from app.models.user import User
    from app.models.event import Event
    from app.models.signup import EventSignup
    from datetime import date
    officer = User(id=1, first_name='Alex', last_name='J', email='a@test.com', role='officer')
    member = User(id=2, first_name='Sam', last_name='R', email='s@test.com', role='member')
    db.session.add_all([officer, member])
    db.session.flush()
    event = Event(title='E', date=date(2026, 3, 1), hours_value=1.0,
                  status='active', created_by_id=1)
    db.session.add(event)
    db.session.flush()
    signup = EventSignup(event_id=event.id, user_id=2)
    db.session.add(signup)
    db.session.commit()
    assert signup.attended == False
