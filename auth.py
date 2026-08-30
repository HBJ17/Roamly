from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard'))
    elif 'admin_id' in session:
        return redirect(url_for('admin.dashboard'))
    elif 'agency_id' in session:
        return redirect(url_for('agency.dashboard'))
    return redirect(url_for('auth.login'))

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

        cursor.execute('SELECT * FROM users WHERE username = ? OR email = ?', (username, email))
        existing_user = cursor.fetchone()

        if existing_user:
            conn.close()
            flash('Username or email already registered. Please login.', 'danger')
            return render_template('signup.html')

        cursor.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            (username, email, password)
        )
        new_user_id = cursor.lastrowid
        
        # Initialize default user preferences
        cursor.execute(
            'INSERT OR IGNORE INTO user_preferences (user_id) VALUES (?)',
            (new_user_id,)
        )
        conn.commit()
        conn.close()

        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('signup.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard.dashboard'))
    if 'admin_id' in session:
        return redirect(url_for('admin.dashboard'))
    if 'agency_id' in session:
        return redirect(url_for('agency.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        if not username or not password:
            flash('Please enter both username and password.', 'danger')
            return render_template('login.html')

        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Check Standard Customer Users
        cursor.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password))
        user = cursor.fetchone()

        if user:
            conn.close()
            session['user_id'] = user['id']
            session['username'] = user['username']
            flash('Logged in successfully!', 'success')
            return redirect(url_for('dashboard.dashboard'))

        # 2. Check Administrator Accounts
        cursor.execute('SELECT * FROM admins WHERE username = ? AND password = ?', (username, password))
        admin = cursor.fetchone()

        if admin:
            conn.close()
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            session['admin_role'] = admin['role']
            session['admin_name'] = admin['full_name']
            flash(f'Welcome back, {admin["full_name"]}!', 'success')
            return redirect(url_for('admin.dashboard'))

        # 3. Check Travel Agency Partner Accounts
        cursor.execute('SELECT * FROM agencies WHERE username = ? AND password = ?', (username, password))
        agency = cursor.fetchone()
        conn.close()

        if agency:
            if agency['status'] != 'Active':
                flash('Your agency account is currently suspended. Please contact administrator.', 'danger')
                return render_template('login.html')
            session['agency_id'] = agency['id']
            session['agency_name'] = agency['name']
            session['agency_type'] = agency['agency_type']
            session['agency_username'] = agency['username']
            flash(f'Welcome back, {agency["name"]}!', 'success')
            return redirect(url_for('agency.dashboard'))

        flash('Invalid username or password.', 'danger')
        return render_template('login.html')

    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('auth.login'))
