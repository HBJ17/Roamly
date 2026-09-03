from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import login_required

bookings_bp = Blueprint('bookings', __name__)

# package checkout redirect
@bookings_bp.route('/book/package/<int:package_id>', methods=['POST'])
@login_required
def book_package(package_id):
    travel_date = request.form.get('travel_date')
    num_travelers = request.form.get('num_travelers', '1')

    if not travel_date:
        flash('Please select a valid travel date.', 'danger')
        return redirect(url_for('packages.package_detail', package_id=package_id))

    try:
        num_travelers = max(1, int(num_travelers))
    except ValueError:
        num_travelers = 1

    return redirect(url_for(
        'payments.checkout',
        booking_type='Package',
        item_id=package_id,
        travel_date=travel_date,
        num_travelers=num_travelers
    ))

# legacy booking route
@bookings_bp.route('/book/<int:package_id>', methods=['POST'])
@login_required
def book_package_legacy(package_id):
    return book_package(package_id)

# hotel checkout redirect
@bookings_bp.route('/book/hotel/<int:hotel_id>', methods=['POST'])
@login_required
def book_hotel(hotel_id):
    travel_date = request.form.get('travel_date')
    check_out_date = request.form.get('check_out_date')
    num_travelers = request.form.get('num_travelers', '1')
    room_type = request.form.get('room_type', '')

    if not travel_date or not check_out_date:
        flash('Please select check-in and check-out dates.', 'danger')
        return redirect(url_for('hotels.hotel_detail', hotel_id=hotel_id))

    try:
        num_travelers = max(1, int(num_travelers))
    except ValueError:
        num_travelers = 1

    return redirect(url_for(
        'payments.checkout',
        booking_type='Hotel',
        item_id=hotel_id,
        travel_date=travel_date,
        check_out_date=check_out_date,
        num_travelers=num_travelers,
        room_type=room_type
    ))

# transport checkout redirect
@bookings_bp.route('/book/transport/<int:transport_id>', methods=['POST'])
@login_required
def book_transport(transport_id):
    travel_date = request.form.get('travel_date')
    num_travelers = request.form.get('num_travelers', '1')
    pickup_location = request.form.get('pickup_location', '')

    if not travel_date:
        flash('Please select a travel date.', 'danger')
        return redirect(url_for('transports.transport_detail', transport_id=transport_id))

    try:
        num_travelers = max(1, int(num_travelers))
    except ValueError:
        num_travelers = 1

    return redirect(url_for(
        'payments.checkout',
        booking_type='Transport',
        item_id=transport_id,
        travel_date=travel_date,
        num_travelers=num_travelers,
        pickup_location=pickup_location
    ))

# booking voucher summary
@bookings_bp.route('/bookings/summary/<int:booking_id>')
@login_required
def booking_summary(booking_id):
    user_id = session['user_id']
    is_admin = bool(session.get('admin_id'))

    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch booking
    cursor.execute('''
        SELECT b.*, u.username, u.email as user_email, u.full_name as user_full_name, u.phone as user_phone
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = %s AND (b.user_id = %s OR %s = 1)
    ''', (booking_id, user_id, 1 if is_admin else 0))
    booking = cursor.fetchone()

    if not booking:
        conn.close()
        flash('Booking not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))

    # fetch item
    item = None
    if booking['booking_type'] == 'Package' and booking['package_id']:
        cursor.execute('''
            SELECT p.*, a.name as agency_name, a.phone as agency_phone, a.email as agency_email
            FROM packages p
            LEFT JOIN agencies a ON p.agency_id = a.id
            WHERE p.id = %s
        ''', (booking['package_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Hotel' and booking['hotel_id']:
        cursor.execute('''
            SELECT h.*, a.name as agency_name, a.phone as agency_phone, a.email as agency_email
            FROM hotels h
            LEFT JOIN agencies a ON h.agency_id = a.id
            WHERE h.id = %s
        ''', (booking['hotel_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Transport' and booking['transport_id']:
        cursor.execute('''
            SELECT t.*, a.name as agency_name, a.phone as agency_phone, a.email as agency_email
            FROM transports t
            LEFT JOIN agencies a ON t.agency_id = a.id
            WHERE t.id = %s
        ''', (booking['transport_id'],))
        item = cursor.fetchone()

    conn.close()

    return render_template('booking_summary.html', booking=booking, item=item)

# modify booking
@bookings_bp.route('/bookings/modify/<int:booking_id>', methods=['GET', 'POST'])
@login_required
def modify_booking(booking_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch booking
    cursor.execute('SELECT * FROM bookings WHERE id = %s AND user_id = %s', (booking_id, user_id))
    booking = cursor.fetchone()

    if not booking:
        conn.close()
        flash('Booking record not found.', 'danger')
        return redirect(url_for('dashboard.dashboard', tab='bookings'))

    if booking['status'] == 'Cancelled':
        conn.close()
        flash('Cancelled bookings cannot be modified.', 'danger')
        return redirect(url_for('dashboard.dashboard', tab='bookings'))

    # fetch item
    item = None
    if booking['booking_type'] == 'Package':
        cursor.execute('SELECT * FROM packages WHERE id = %s', (booking['package_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Hotel':
        cursor.execute('SELECT * FROM hotels WHERE id = %s', (booking['hotel_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Transport':
        cursor.execute('SELECT * FROM transports WHERE id = %s', (booking['transport_id'],))
        item = cursor.fetchone()

    if request.method == 'POST':
        travel_date = request.form.get('travel_date', booking['travel_date'])
        check_out_date = request.form.get('check_out_date', booking['check_out_date'])
        num_travelers = request.form.get('num_travelers', booking['num_travelers'])
        room_type = request.form.get('room_type', booking['room_type'])
        pickup_location = request.form.get('pickup_location', booking['pickup_location'])
        special_requests = request.form.get('special_requests', booking['special_requests'])

        try:
            num_travelers = max(1, int(num_travelers))
        except ValueError:
            num_travelers = booking['num_travelers']

        # recompute price
        total_price = booking['total_price']
        if booking['booking_type'] == 'Package' and item:
            total_price = item['price'] * num_travelers
        elif booking['booking_type'] == 'Hotel' and item:
            total_price = item['price_per_night']
        elif booking['booking_type'] == 'Transport' and item:
            if item['transport_type'] == 'Cab':
                total_price = item['price']
            else:
                total_price = item['price'] * num_travelers

        # update booking
        cursor.execute('''
            UPDATE bookings
            SET travel_date = %s,
                check_out_date = %s,
                num_travelers = %s,
                room_type = %s,
                pickup_location = %s,
                special_requests = %s,
                total_price = %s,
                status = 'Modified'
            WHERE id = %s AND user_id = %s
        ''', (travel_date, check_out_date, num_travelers, room_type, pickup_location, special_requests, total_price, booking_id, user_id))
        conn.commit()
        conn.close()

        flash('Booking has been modified successfully!', 'success')
        return redirect(url_for('bookings.booking_summary', booking_id=booking_id))

    conn.close()
    return render_template('booking_modify.html', booking=booking, item=item)
