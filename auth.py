import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.security import (
    hash_password,
    verify_password,
    is_rate_limited,
    record_failed_attempt,
    clear_failed_attempts,
    generate_reset_token
)

auth_bp = Blueprint('auth', __name__)

# home route
@auth_bp.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard'))
    elif 'admin_id' in session:
        return redirect(url_for('admin.dashboard'))
    elif 'agency_id' in session:
        return redirect(url_for('agency.dashboard'))
    return redirect(url_for('auth.login'))

# user registration
@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard'))

    if request.method == 'POST':
        username = request.form['username'].strip()
        email = request.form['email'].strip()
        password = request.form['password'].strip()

        if not username or not email or not password:
            flash('All fields are required.', 'danger')
            return render_template('signup.html')

        conn = get_db_connection()
        cursor = conn.cursor()

        # check existing
        cursor.execute('SELECT * FROM users WHERE username = %s OR email = %s', (username, email))
        existing_user = cursor.fetchone()

        if existing_user:
            conn.close()
            flash('Username or email already registered. Please login.', 'danger')
            return render_template('signup.html')

        # insert user with hashed password
        hashed_pwd = hash_password(password)
        cursor.execute(
            'INSERT INTO users (username, email, password) VALUES (%s, %s, %s)',
            (username, email, hashed_pwd)
        )
        new_user_id = cursor.lastrowid
        
        # default preferences
        try:
            cursor.execute(
                'INSERT INTO user_preferences (user_id) VALUES (%s)',
                (new_user_id,)
            )
        except Exception:
            pass

        conn.commit()
        conn.close()

        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('signup.html')

# user login
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard'))
    if 'admin_id' in session:
        return redirect(url_for('admin.dashboard'))
    if 'agency_id' in session:
        return redirect(url_for('agency.dashboard'))

    if request.method == 'POST':
        client_ip = request.remote_addr or 'unknown'
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        # check rate limiting per IP + username
        rate_key = f"{client_ip}:{username.lower()}"
        limited, retry_sec = is_rate_limited(rate_key, max_attempts=5, window_seconds=300)
        if limited:
            flash(f'Too many failed login attempts. Account temporarily locked for security. Try again in {retry_sec} seconds.', 'danger')
            return render_template('login.html')

        if not username or not password:
            flash('Please enter both username and password.', 'danger')
            return render_template('login.html')

        conn = get_db_connection()
        cursor = conn.cursor()

        # check users
        cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()

        if user and verify_password(password, user['password']):
            clear_failed_attempts(rate_key)
            conn.close()
            session.clear()
            session['user_id'] = user['id']
            session['username'] = user['username']
            flash('Logged in successfully!', 'success')
            return redirect(url_for('dashboard.dashboard'))

        # check admins
        cursor.execute('SELECT * FROM admins WHERE username = %s', (username,))
        admin = cursor.fetchone()

        if admin and verify_password(password, admin['password']):
            clear_failed_attempts(rate_key)
            conn.close()
            session.clear()
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            session['admin_role'] = admin['role']
            session['admin_name'] = admin['full_name']
            flash(f'Welcome back, {admin["full_name"]}!', 'success')
            return redirect(url_for('admin.dashboard'))

        # check agencies
        cursor.execute('SELECT * FROM agencies WHERE username = %s', (username,))
        agency = cursor.fetchone()
        conn.close()

        if agency and verify_password(password, agency['password']):
            if agency['status'] != 'Active':
                flash('Your agency account is currently suspended. Please contact administrator.', 'danger')
                return render_template('login.html')
            clear_failed_attempts(rate_key)
            session.clear()
            session['agency_id'] = agency['id']
            session['agency_name'] = agency['name']
            session['agency_type'] = agency['agency_type']
            session['agency_username'] = agency['username']
            flash(f'Welcome back, {agency["name"]}!', 'success')
            return redirect(url_for('agency.dashboard'))

        record_failed_attempt(rate_key)
        flash('Invalid username or password.', 'danger')
        return render_template('login.html')

    return render_template('login.html')

# forgot password request
@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        if not email:
            flash('Please enter your registered email address.', 'danger')
            return render_template('forgot_password.html')

        conn = get_db_connection()
        cursor = conn.cursor()

        # check in users, admins, agencies
        cursor.execute('SELECT email FROM users WHERE email = %s UNION SELECT email FROM admins WHERE email = %s UNION SELECT email FROM agencies WHERE email = %s', (email, email, email))
        account = cursor.fetchone()

        if account:
            token = generate_reset_token()
            expires_at = datetime.datetime.now() + datetime.timedelta(hours=1)
            cursor.execute('''
                INSERT INTO password_resets (email, token, expires_at, used)
                VALUES (%s, %s, %s, 0)
            ''', (email, token, expires_at))
            conn.commit()

            reset_url = url_for('auth.reset_password', token=token, _external=True)
            flash(f"Password reset link created! (For testing/development: {reset_url})", 'success')
        else:
            # Prevent email enumeration while giving positive feedback
            flash("If that email address exists in our system, a password reset link has been dispatched.", 'info')

        conn.close()
        return redirect(url_for('auth.login'))

    return render_template('forgot_password.html')

# reset password with token
@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM password_resets 
        WHERE token = %s AND used = 0 AND expires_at >= CURRENT_TIMESTAMP
        ORDER BY id DESC LIMIT 1
    ''', (token,))
    reset_record = cursor.fetchone()

    if not reset_record:
        conn.close()
        flash('Password reset token is invalid or has expired. Please request a new link.', 'danger')
        return redirect(url_for('auth.forgot_password'))

    if request.method == 'POST':
        password = request.form.get('password', '').strip()
        confirm_password = request.form.get('confirm_password', '').strip()

        if not password or len(password) < 6:
            conn.close()
            flash('Password must be at least 6 characters.', 'danger')
            return render_template('reset_password.html', token=token)

        if password != confirm_password:
            conn.close()
            flash('Passwords do not match.', 'danger')
            return render_template('reset_password.html', token=token)

        hashed = hash_password(password)
        email = reset_record['email']

        # Update in users, admins, agencies
        cursor.execute('UPDATE users SET password = %s WHERE email = %s', (hashed, email))
        cursor.execute('UPDATE admins SET password = %s WHERE email = %s', (hashed, email))
        cursor.execute('UPDATE agencies SET password = %s WHERE email = %s', (hashed, email))
        cursor.execute('UPDATE password_resets SET used = 1 WHERE id = %s', (reset_record['id'],))
        conn.commit()
        conn.close()

        flash('Your password has been successfully updated! Please log in.', 'success')
        return redirect(url_for('auth.login'))

    conn.close()
    return render_template('reset_password.html', token=token)

# user logout
@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('auth.login'))

