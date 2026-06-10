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
    app.register_blueprint(landing_bp)

    with app.app_context():
        # Import models so SQLAlchemy metadata is populated before create_all
        from app.models import user, event, signup  # noqa: F401
        db.create_all()

    return app
