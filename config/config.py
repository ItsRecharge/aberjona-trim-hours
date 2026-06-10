import os
import secrets

SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_hex(32))

_base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(_base, 'data', 'hours.db')
SQLALCHEMY_TRACK_MODIFICATIONS = False

DEMO_OFFICER_ID = 1
DEMO_MEMBER_ID = 2
SCHOOL_YEAR_START_MONTH = 9  # September
YEARLY_HOURS_GOAL = 10.0
