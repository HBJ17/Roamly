from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import login_required
from payments import create_notification

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

    # Fetch Bookings across all categories
    cursor.execute('''
        SELECT 
            b.*,
            COALESCE(p.title, h.name, t.title) as item_title,
            COALESCE(p.destination, h.city, t.source_city || ' to ' || t.destination_city) as item_destination,
            COALESCE(p.category, 'Stay', t.transport_type) as item_category,
            COALESCE(p.image_url, h.image_url, t.image_url) as item_image_url
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    ''', (user_id,))
    bookings = cursor.fetchall()

    # Partition bookings
    upcoming_bookings = [b for b in bookings if b['status'] != 'Cancelled' and b['trip_status'] != 'Completed']
    completed_bookings = [b for b in bookings if b['trip_status'] == 'Completed']
    cancelled_bookings = [b for b in bookings if b['status'] == 'Cancelled']

    # Fetch Saved Items (Wishlist)
    cursor.execute('''
        SELECT s.*, 
            COALESCE(p.title, h.name, t.title) as item_title,
            COALESCE(p.destination, h.city, t.source_city || ' to ' || t.destination_city) as item_location,
            COALESCE(p.price, h.price_per_night, t.price) as item_price,
            COALESCE(p.image_url, h.image_url, t.image_url) as item_image_url,
            COALESCE(p.category, 'Stay', t.transport_type) as item_category
        FROM saved_items s
        LEFT JOIN packages p ON s.item_type = 'package' AND s.item_id = p.id
        LEFT JOIN hotels h ON s.item_type = 'hotel' AND s.item_id = h.id
        LEFT JOIN transports t ON s.item_type = 'transport' AND s.item_id = t.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    ''', (user_id,))
    saved_items = cursor.fetchall()

    conn.close()

    active_tab = request.args.get('tab', 'overview')
    booking_filter = request.args.get('filter', 'all')

    return render_template(
        'dashboard.html',
        user=user,
        preferences=preferences,
        bookings=bookings,
        upcoming_bookings=upcoming_bookings,
        completed_bookings=completed_bookings,
        cancelled_bookings=cancelled_bookings,
        saved_items=saved_items,
        active_tab=active_tab,
        booking_filter=booking_filter,
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
            return redirect(url_for('dashboard.dashboard', tab='profile'))

        # Check if email is used by another user
        cursor.execute('SELECT id FROM users WHERE email = ? AND id != ?', (email, user_id))
        if cursor.fetchone():
            flash('Email is already taken by another account.', 'danger')
            conn.close()
            return redirect(url_for('dashboard.dashboard', tab='profile'))

        cursor.execute('''
            UPDATE users
            SET email = ?, full_name = ?, phone = ?, address = ?, bio = ?
            WHERE id = ?
        ''', (email, full_name, phone, address, bio, user_id))
        conn.commit()
        conn.close()

        flash('Profile updated successfully!', 'success')
        return redirect(url_for('dashboard.dashboard', tab='profile'))

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
        return redirect(url_for('dashboard.dashboard', tab='preferences'))

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
        cursor.execute("UPDATE bookings SET status = 'Cancelled', trip_status = 'Cancelled' WHERE id = ?", (booking_id,))
        conn.commit()
        flash('Booking has been cancelled.', 'success')
    else:
        flash('Booking record not found.', 'danger')

    conn.close()
    return redirect(url_for('dashboard.dashboard', tab='bookings'))

@dashboard_bp.route('/bookings/complete/<int:booking_id>', methods=['POST'])
@login_required
def complete_trip(booking_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM bookings WHERE id = ? AND user_id = ?', (booking_id, user_id))
    booking = cursor.fetchone()

    if booking:
        cursor.execute("UPDATE bookings SET trip_status = 'Completed' WHERE id = ?", (booking_id,))
        conn.commit()
        
        create_notification(
            user_id=user_id,
            title="Trip Marked as Completed",
            message=f"Hope you had a memorable journey! Please take a moment to leave a review for booking #{booking_id:04d}.",
            notification_type='trip',
            link_url=url_for('dashboard.trip_timeline', booking_id=booking_id)
        )
        flash('Trip has been marked as Completed! Thank you for traveling with Roamly.', 'success')
    else:
        flash('Booking record not found.', 'danger')

    conn.close()
    return redirect(url_for('dashboard.trip_timeline', booking_id=booking_id))

@dashboard_bp.route('/trip-timeline/<int:booking_id>')
@login_required
def trip_timeline(booking_id):
    user_id = session['user_id']
    is_admin = bool(session.get('admin_id'))

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT b.*, u.username, u.full_name as user_full_name, u.email as user_email
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ? AND (b.user_id = ? OR ? = 1)
    ''', (booking_id, user_id, 1 if is_admin else 0))
    booking = cursor.fetchone()

    if not booking:
        conn.close()
        flash('Booking record not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))

    # Fetch Payment & Invoice
    cursor.execute('SELECT * FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 1', (booking_id,))
    payment = cursor.fetchone()

    cursor.execute('SELECT * FROM invoices WHERE booking_id = ?', (booking_id,))
    invoice = cursor.fetchone()

    # Fetch Item and Agency
    item = None
    if booking['booking_type'] == 'Package' and booking['package_id']:
        cursor.execute('''
            SELECT p.*, a.name as agency_name, a.phone as agency_phone, a.email as agency_email
            FROM packages p
            LEFT JOIN agencies a ON p.agency_id = a.id
            WHERE p.id = ?
        ''', (booking['package_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Hotel' and booking['hotel_id']:
        cursor.execute('''
            SELECT h.*, a.name as agency_name, a.phone as agency_phone, a.email as agency_email
            FROM hotels h
            LEFT JOIN agencies a ON h.agency_id = a.id
            WHERE h.id = ?
        ''', (booking['hotel_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Transport' and booking['transport_id']:
        cursor.execute('''
            SELECT t.*, a.name as agency_name, a.phone as agency_phone, a.email as agency_email
            FROM transports t
            LEFT JOIN agencies a ON t.agency_id = a.id
            WHERE t.id = ?
        ''', (booking['transport_id'],))
        item = cursor.fetchone()

    # Check if user already submitted a review
    item_type = booking['booking_type'].lower()
    item_id = booking['package_id'] or booking['hotel_id'] or booking['transport_id']
    cursor.execute('SELECT * FROM reviews WHERE user_id = ? AND item_type = ? AND item_id = ?', (user_id, item_type, item_id))
    existing_review = cursor.fetchone()

    conn.close()

    # Determine timeline milestone step (1 to 7)
    current_step = 2  # Payment settled
    if booking['status'] == 'Cancelled':
        current_step = 0
    elif booking['trip_status'] == 'Completed':
        current_step = 6 if not existing_review else 7
    else:
        # Check date comparison
        try:
            travel_dt = datetime.strptime(booking['travel_date'], '%Y-%m-%d').date()
            today = datetime.now().date()
            if today < travel_dt:
                current_step = 3  # Pre-departure preparation
            elif today == travel_dt:
                current_step = 4  # Departure & Check-in
            else:
                current_step = 5  # Tour experience / return
        except Exception:
            current_step = 3

    return render_template(
        'trip_timeline.html',
        booking=booking,
        payment=payment,
        invoice=invoice,
        item=item,
        existing_review=existing_review,
        current_step=current_step
    )

@dashboard_bp.route('/favorites/toggle/<item_type>/<int:item_id>', methods=['POST', 'GET'])
@login_required
def toggle_favorite(item_type, item_id):
    user_id = session['user_id']
    item_type = item_type.lower()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?', (user_id, item_type, item_id))
    existing = cursor.fetchone()

    if existing:
        cursor.execute('DELETE FROM saved_items WHERE id = ?', (existing['id'],))
        flash(f'Removed from your saved {item_type}s.', 'info')
    else:
        cursor.execute('INSERT INTO saved_items (user_id, item_type, item_id) VALUES (?, ?, ?)', (user_id, item_type, item_id))
        flash(f'Saved to your favorite {item_type}s wishlist!', 'success')

    conn.commit()
    conn.close()

    referrer = request.referrer
    if referrer and 'toggle' not in referrer:
        return redirect(referrer)
    return redirect(url_for('dashboard.saved_destinations'))

@dashboard_bp.route('/saved')
@login_required
def saved_destinations():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT s.*, 
            COALESCE(p.title, h.name, t.title) as item_title,
            COALESCE(p.destination, h.city, t.source_city || ' to ' || t.destination_city) as item_location,
            COALESCE(p.price, h.price_per_night, t.price) as item_price,
            COALESCE(p.image_url, h.image_url, t.image_url) as item_image_url,
            COALESCE(p.category, 'Stay', t.transport_type) as item_category,
            COALESCE(p.rating, h.star_rating, 4.8) as item_rating
        FROM saved_items s
        LEFT JOIN packages p ON s.item_type = 'package' AND s.item_id = p.id
        LEFT JOIN hotels h ON s.item_type = 'hotel' AND s.item_id = h.id
        LEFT JOIN transports t ON s.item_type = 'transport' AND s.item_id = t.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    ''', (user_id,))
    saved_list = cursor.fetchall()
    conn.close()

    return render_template('saved.html', saved_items=saved_list)
