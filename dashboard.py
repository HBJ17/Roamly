from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import login_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
@login_required
def dashboard():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch User Info
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()

    # Fetch Preferences
    cursor.execute('SELECT * FROM user_preferences WHERE user_id = ?', (user_id,))
    preferences = cursor.fetchone()

    # Fetch Bookings
    cursor.execute('''
        SELECT b.*, p.title as package_title, p.destination, p.category, p.image_url
        FROM bookings b
        JOIN packages p ON b.package_id = p.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    ''', (user_id,))
    bookings = cursor.fetchall()
    conn.close()

    active_tab = request.args.get('tab', 'overview')

    return render_template(
        'dashboard.html',
        user=user,
        preferences=preferences,
        bookings=bookings,
        active_tab=active_tab,
        username=session.get('username')
    )

@dashboard_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        full_name = request.form.get('full_name', '').strip()
        phone = request.form.get('phone', '').strip()
        address = request.form.get('address', '').strip()
        bio = request.form.get('bio', '').strip()

        if not email:
            flash('Email address cannot be empty.', 'danger')
            conn.close()
            return redirect(url_for('dashboard', tab='profile'))

        # Check if email is used by another user
        cursor.execute('SELECT id FROM users WHERE email = ? AND id != ?', (email, user_id))
        if cursor.fetchone():
            flash('Email is already taken by another account.', 'danger')
            conn.close()
            return redirect(url_for('dashboard', tab='profile'))

        cursor.execute('''
            UPDATE users
            SET email = ?, full_name = ?, phone = ?, address = ?, bio = ?
            WHERE id = ?
        ''', (email, full_name, phone, address, bio, user_id))
        conn.commit()
        conn.close()

        flash('Profile updated successfully!', 'success')
        return redirect(url_for('dashboard', tab='profile'))

    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    return render_template('dashboard.html', user=user, active_tab='profile', username=session.get('username'))

@dashboard_bp.route('/preferences', methods=['GET', 'POST'])
@login_required
def preferences():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        preferred_travel_mode = request.form.get('preferred_travel_mode', 'Train')
        dietary_preference = request.form.get('dietary_preference', 'Vegetarian')
        budget_range = request.form.get('budget_range', 'Moderate')
        preferred_categories_list = request.form.getlist('preferred_categories')
        preferred_categories = ', '.join(preferred_categories_list) if preferred_categories_list else 'Hill Station'

        cursor.execute('''
            INSERT INTO user_preferences (user_id, preferred_travel_mode, dietary_preference, budget_range, preferred_categories)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                preferred_travel_mode = excluded.preferred_travel_mode,
                dietary_preference = excluded.dietary_preference,
                budget_range = excluded.budget_range,
                preferred_categories = excluded.preferred_categories
        ''', (user_id, preferred_travel_mode, dietary_preference, budget_range, preferred_categories))
        conn.commit()
        conn.close()

        flash('Travel preferences saved successfully!', 'success')
        return redirect(url_for('dashboard', tab='preferences'))

    cursor.execute('SELECT * FROM user_preferences WHERE user_id = ?', (user_id,))
    preferences_data = cursor.fetchone()
    conn.close()
    return render_template('dashboard.html', preferences=preferences_data, active_tab='preferences', username=session.get('username'))

@dashboard_bp.route('/bookings/cancel/<int:booking_id>', methods=['POST'])
@login_required
def cancel_booking(booking_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM bookings WHERE id = ? AND user_id = ?', (booking_id, user_id))
    booking = cursor.fetchone()

    if booking:
        cursor.execute("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", (booking_id,))
        conn.commit()
        flash('Booking has been cancelled.', 'success')
    else:
        flash('Booking record not found.', 'danger')

    conn.close()
    return redirect(url_for('dashboard', tab='bookings'))
