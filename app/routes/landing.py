from flask import Blueprint

landing_bp = Blueprint('landing', __name__)

@landing_bp.route('/')
def index():
    return 'ok'
