from app.extensions import db
from datetime import datetime

class EventSignup(db.Model):
    __tablename__ = 'event_signups'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    signed_up_at = db.Column(db.DateTime, default=datetime.utcnow)
    attended = db.Column(db.Boolean, default=False, nullable=False)
    marked_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    marked_by = db.relationship('User', foreign_keys=[marked_by_id])
