# tests/test_routes.py
import pytest
from app import create_app
from app.extensions import db as _db
from datetime import date

@pytest.fixture(scope='function')
def app():
    _app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'WTF_CSRF_ENABLED': False,
        'SEED_DATA': True,
    })
    # Push app context for the entire test so SQLAlchemy queries work outside requests
    with _app.app_context():
        yield _app

@pytest.fixture
def client(app):
    return app.test_client()

def test_landing_page(client):
    r = client.get('/')
    assert r.status_code == 200
    assert b'Aberjona Tri-M' in r.data

def test_landing_has_watermark(client):
    r = client.get('/')
    assert b'Neel Bansal' in r.data

def test_officer_dashboard(client):
    r = client.get('/officer/dashboard')
    assert r.status_code == 200
    assert b'Dashboard' in r.data

def test_officer_dashboard_shows_member(client):
    r = client.get('/officer/dashboard')
    assert b'Rivera' in r.data  # seeded member last name

def test_officer_events(client):
    r = client.get('/officer/events')
    assert r.status_code == 200
    assert b'Events' in r.data

def test_officer_requests(client):
    r = client.get('/officer/requests')
    assert r.status_code == 200

def test_officer_members(client):
    r = client.get('/officer/members')
    assert r.status_code == 200
    assert b'Rivera' in r.data

def test_member_dashboard(client):
    r = client.get('/member/dashboard')
    assert r.status_code == 200
    assert b'Sam' in r.data

def test_member_dashboard_shows_hours(client):
    r = client.get('/member/dashboard')
    assert b'hours' in r.data.lower()

def test_member_events(client):
    r = client.get('/member/events')
    assert r.status_code == 200

def test_member_request_event_get(client):
    r = client.get('/member/request-event')
    assert r.status_code == 200

def test_member_signup_for_event(client):
    from app.models.event import Event
    event = Event.query.filter_by(status='active').first()
    r = client.post('/member/events', data={
        'action': 'signup',
        'event_id': str(event.id),
    }, follow_redirects=True)
    assert r.status_code == 200

def test_officer_create_event(client):
    r = client.post('/officer/events', data={
        'title': 'Test Event',
        'date': '2026-08-01',
        'hours_value': '2.0',
        'location': 'Test Location',
        'description': 'A test event',
    }, follow_redirects=True)
    assert r.status_code == 200
    from app.models.event import Event
    assert Event.query.filter_by(title='Test Event').first() is not None
