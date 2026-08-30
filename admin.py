from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'admin_id' in session:
        return redirect(url_for('admin.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        if not username or not password:
            flash('Please enter both admin username and password.', 'danger')
            return render_template('admin/login.html')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM admins WHERE username = ? AND password = ?', (username, password))
        admin = cursor.fetchone()
        conn.close()

        if admin:
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            session['admin_role'] = admin['role']
            session['admin_name'] = admin['full_name']
            flash(f'Welcome back, {admin["full_name"]}!', 'success')
            return redirect(url_for('admin.dashboard'))
        else:
            flash('Invalid administrator credentials.', 'danger')
            return render_template('admin/login.html')

    return render_template('admin/login.html')

@admin_bp.route('/logout')
def logout():
    session.pop('admin_id', None)
    session.pop('admin_username', None)
    session.pop('admin_role', None)
    session.pop('admin_name', None)
    flash('Administrator session terminated successfully.', 'info')
    return redirect(url_for('admin.login'))

@admin_bp.route('/dashboard')
@admin_required
def dashboard():
    return redirect(url_for('admin.analytics'))

@admin_bp.route('/analytics')
@admin_required
def analytics():
    # Will be expanded in Commit 7
    return render_template('admin/login.html')
