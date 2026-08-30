from flask import Blueprint, request, redirect, url_for, session, flash
from datetime import datetime
from database.connection import get_db_connection
from utils.decorators import login_required

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('/book/package/<int:package_id>', methods=['POST'])
@login_required
def book_package(package_id):
    user_id = session['user_id']
    travel_date = request.form.get('travel_date', '').strip()
    num_travelers_str = request.form.get('num_travelers', '1').strip()
    contact_phone = request.form.get('contact_phone', '').strip()
    contact_email = request.form.get('contact_email', '').strip()
    special_requests = request.form.get('special_requests', '').strip()

    if not travel_date:
        flash('Please select a valid travel date.', 'danger')
        return redirect(url_for('packages.package_detail', package_id=package_id))

    try:
        num_travelers = max(1, int(num_travelers_str))
    except ValueError:
        num_travelers = 1

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM packages WHERE id = ?', (package_id,))
    pkg = cursor.fetchone()

    if not pkg:
        conn.close()
        flash('Package not found.', 'danger')
        return redirect(url_for('packages.packages'))

    total_price = float(pkg['price']) * num_travelers

    cursor.execute('''
        INSERT INTO bookings (
            user_id, package_id, booking_type, travel_date,
            num_travelers, total_price, contact_phone, contact_email,
            special_requests, status
        )
        VALUES (?, ?, 'Package', ?, ?, ?, ?, ?, ?, 'Confirmed')
    ''', (user_id, package_id, travel_date, num_travelers, total_price, contact_phone, contact_email, special_requests))
    
    booking_id = cursor.lastrowid
    conn.commit()
    conn.close()

    flash(f'Successfully confirmed your package booking for "{pkg["title"]}"!', 'success')
    return redirect(url_for('bookings.booking_summary', booking_id=booking_id))

@bookings_bp.route('/book/hotel/<int:hotel_id>', methods=['POST'])
@login_required
def book_hotel(hotel_id):
    user_id = session['user_id']
    check_in_date = request.form.get('check_in_date', '').strip()
    check_out_date = request.form.get('check_out_date', '').strip()
    room_type = request.form.get('room_type', '').strip()
    num_guests_str = request.form.get('num_travelers', '2').strip()
    contact_phone = request.form.get('contact_phone', '').strip()
    special_requests = request.form.get('special_requests', '').strip()

    if not check_in_date or not check_out_date:
        flash('Please select valid check-in and check-out dates.', 'danger')
        return redirect(url_for('hotels.hotel_detail', hotel_id=hotel_id))

    try:
        num_guests = max(1, int(num_guests_str))
    except ValueError:
        num_guests = 2

    # Calculate number of nights
    try:
        d1 = datetime.strptime(check_in_date, '%Y-%m-%d')
        d2 = datetime.strptime(check_out_date, '%Y-%m-%d')
        nights = (d2 - d1).days
        if nights < 1:
            nights = 1
    except ValueError:
        nights = 1

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM hotels WHERE id = ?', (hotel_id,))
    hotel = cursor.fetchone()

    if not hotel:
        conn.close()
        flash('Hotel listing not found.', 'danger')
        return redirect(url_for('hotels.hotels'))

    total_price = float(hotel['price_per_night']) * nights

    cursor.execute('''
        INSERT INTO bookings (
            user_id, hotel_id, booking_type, travel_date, check_out_date,
            num_travelers, room_type, total_price, contact_phone,
            special_requests, status
        )
        VALUES (?, ?, 'Hotel', ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
    ''', (user_id, hotel_id, check_in_date, check_out_date, num_guests, room_type, total_price, contact_phone, special_requests))

    booking_id = cursor.lastrowid
    conn.commit()
    conn.close()

    flash(f'Successfully reserved your stay at "{hotel["name"]}" for {nights} night(s)!', 'success')
    return redirect(url_for('bookings.booking_summary', booking_id=booking_id))

@bookings_bp.route('/book/transport/<int:transport_id>', methods=['POST'])
@login_required
def book_transport(transport_id):
    user_id = session['user_id']
    travel_date = request.form.get('travel_date', '').strip()
    num_travelers_str = request.form.get('num_travelers', '1').strip()
    pickup_location = request.form.get('pickup_location', '').strip()
    drop_location = request.form.get('drop_location', '').strip()
    contact_phone = request.form.get('contact_phone', '').strip()
    special_requests = request.form.get('special_requests', '').strip()

    if not travel_date:
        flash('Please select a valid travel date.', 'danger')
        return redirect(url_for('transports.transport_detail', transport_id=transport_id))

    if not pickup_location or not drop_location:
        flash('Pickup and drop locations are required.', 'danger')
        return redirect(url_for('transports.transport_detail', transport_id=transport_id))

    try:
        num_travelers = max(1, int(num_travelers_str))
    except ValueError:
        num_travelers = 1

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM transports WHERE id = ?', (transport_id,))
    transport = cursor.fetchone()

    if not transport:
        conn.close()
        flash('Transport listing not found.', 'danger')
        return redirect(url_for('transports.transports'))

    if transport['transport_type'] == 'Cab':
        total_price = float(transport['price'])
    else:
        total_price = float(transport['price']) * num_travelers

    cursor.execute('''
        INSERT INTO bookings (
            user_id, transport_id, booking_type, travel_date,
            num_travelers, pickup_location, drop_location, total_price,
            contact_phone, special_requests, status
        )
        VALUES (?, ?, 'Transport', ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
    ''', (user_id, transport_id, travel_date, num_travelers, pickup_location, drop_location, total_price, contact_phone, special_requests))

    booking_id = cursor.lastrowid
    conn.commit()
    conn.close()

    flash(f'Successfully booked transport "{transport["title"]}"!', 'success')
    return redirect(url_for('bookings.booking_summary', booking_id=booking_id))

# Legacy alias for package booking
@bookings_bp.route('/book/<int:package_id>', methods=['POST'])
@login_required
def book_package_legacy(package_id):
    return book_package(package_id)

@bookings_bp.route('/bookings/summary/<int:booking_id>')
@login_required
def booking_summary(booking_id):
    # Will be expanded in Commit 4 with full template
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM bookings WHERE id = ? AND user_id = ?', (booking_id, user_id))
    booking = cursor.fetchone()
    conn.close()
    if not booking:
        flash('Booking record not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))
    return redirect(url_for('dashboard.dashboard', tab='bookings'))
