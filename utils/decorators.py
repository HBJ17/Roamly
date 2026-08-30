from functools import wraps
from flask import session, flash, redirect, url_for

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'danger')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            flash('Administrator authentication required.', 'danger')
            return redirect(url_for('admin.login'))
        return f(*args, **kwargs)
    return decorated_function

def agency_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'agency_id' not in session:
            flash('Travel agency partner authentication required.', 'danger')
            return redirect(url_for('agency.login'))
        return f(*args, **kwargs)
    return decorated_function
