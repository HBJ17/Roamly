from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from datetime import datetime
from database.connection import get_db_connection
from utils.decorators import login_required

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('/book/package/<int:package_id>', methods=['POST', 'GET'])
@login_required
def book_package(package_id):
    travel_date = request.form.get('travel_date') or request.args.get('travel_date', '')
    num_travelers = request.form.get('num_travelers') or request.args.get('num_travelers', '1')
    return redirect(url_for('payments.checkout', booking_type='package', item_id=package_id, travel_date=travel_date, num_travelers=num_travelers))

@bookings_bp.route('/book/hotel/<int:hotel_id>', methods=['POST', 'GET'])
@login_required
def book_hotel(hotel_id):
    check_in_date = request.form.get('check_in_date') or request.args.get('check_in_date', '')
    check_out_date = request.form.get('check_out_date') or request.args.get('check_out_date', '')
    room_type = request.form.get('room_type') or request.args.get('room_type', '')
    num_travelers = request.form.get('num_travelers') or request.args.get('num_travelers', '2')
    return redirect(url_for('payments.checkout', booking_type='hotel', item_id=hotel_id, travel_date=check_in_date, check_out_date=check_out_date, room_type=room_type, num_travelers=num_travelers))

@bookings_bp.route('/book/transport/<int:transport_id>', methods=['POST', 'GET'])
@login_required
def book_transport(transport_id):
    travel_date = request.form.get('travel_date') or request.args.get('travel_date', '')
    num_travelers = request.form.get('num_travelers') or request.args.get('num_travelers', '1')
    pickup_location = request.form.get('pickup_location') or request.args.get('pickup_location', '')
    drop_location = request.form.get('drop_location') or request.args.get('drop_location', '')
    return redirect(url_for('payments.checkout', booking_type='transport', item_id=transport_id, travel_date=travel_date, num_travelers=num_travelers, pickup_location=pickup_location, drop_location=drop_location))

# Legacy alias for package booking
@bookings_bp.route('/book/<int:package_id>', methods=['POST', 'GET'])
@login_required
def book_package_legacy(package_id):
    return book_package(package_id)

@bookings_bp.route('/bookings/summary/<int:booking_id>')
@login_required
def booking_summary(booking_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT b.*, u.username, u.email as user_email, u.full_name as user_full_name, u.phone as user_phone
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ? AND (b.user_id = ? OR ? = 1)
    ''', (booking_id, user_id, 1 if session.get('admin_id') else 0))
    booking = cursor.fetchone()

    if not booking:
        conn.close()
        flash('Booking voucher record not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))

    item_details = None

    if booking['booking_type'] == 'Hotel' and booking['hotel_id']:
        cursor.execute('''
            SELECT h.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
            FROM hotels h
            LEFT JOIN agencies a ON h.agency_id = a.id
            WHERE h.id = ?
        ''', (booking['hotel_id'],))
        item_details = cursor.fetchone()
    elif booking['booking_type'] == 'Transport' and booking['transport_id']:
        cursor.execute('''
            SELECT t.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
            FROM transports t
            LEFT JOIN agencies a ON t.agency_id = a.id
            WHERE t.id = ?
        ''', (booking['transport_id'],))
        item_details = cursor.fetchone()
    else:
        cursor.execute('''
            SELECT p.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
            FROM packages p
            LEFT JOIN agencies a ON p.agency_id = a.id
            WHERE p.id = ?
        ''', (booking['package_id'],))
        item_details = cursor.fetchone()

    conn.close()

    nights = 1
    if booking['booking_type'] == 'Hotel' and booking['check_out_date']:
        try:
            d1 = datetime.strptime(booking['travel_date'], '%Y-%m-%d')
            d2 = datetime.strptime(booking['check_out_date'], '%Y-%m-%d')
            nights = max(1, (d2 - d1).days)
        except ValueError:
            nights = 1

    return render_template(
        'booking_summary.html',
        booking=booking,
        item=item_details,
        nights=nights
    )

@bookings_bp.route('/bookings/modify/<int:booking_id>', methods=['GET', 'POST'])
@login_required
def modify_booking(booking_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM bookings WHERE id = ? AND user_id = ?', (booking_id, user_id))
    booking = cursor.fetchone()

    if not booking:
        conn.close()
        flash('Booking not found.', 'danger')
        return redirect(url_for('dashboard.dashboard', tab='bookings'))

    if booking['status'] == 'Cancelled':
        conn.close()
        flash('Cannot modify a cancelled booking.', 'danger')
        return redirect(url_for('dashboard.dashboard', tab='bookings'))

    item = None
    if booking['booking_type'] == 'Hotel':
        cursor.execute('SELECT * FROM hotels WHERE id = ?', (booking['hotel_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Transport':
        cursor.execute('SELECT * FROM transports WHERE id = ?', (booking['transport_id'],))
        item = cursor.fetchone()
    else:
        cursor.execute('SELECT * FROM packages WHERE id = ?', (booking['package_id'],))
        item = cursor.fetchone()

    if request.method == 'POST':
        travel_date = request.form.get('travel_date', '').strip()
        num_travelers_str = request.form.get('num_travelers', '1').strip()
        contact_phone = request.form.get('contact_phone', '').strip()
        special_requests = request.form.get('special_requests', '').strip()

        try:
            num_travelers = max(1, int(num_travelers_str))
        except ValueError:
            num_travelers = 1

        new_total_price = booking['total_price']
        check_out_date = booking['check_out_date']
        room_type = booking['room_type']
        pickup_location = booking['pickup_location']
        drop_location = booking['drop_location']

        if booking['booking_type'] == 'Hotel':
            check_out_date = request.form.get('check_out_date', '').strip()
            room_type = request.form.get('room_type', booking['room_type']).strip()
            if travel_date and check_out_date:
                try:
                    d1 = datetime.strptime(travel_date, '%Y-%m-%d')
                    d2 = datetime.strptime(check_out_date, '%Y-%m-%d')
                    nights = max(1, (d2 - d1).days)
                except ValueError:
                    nights = 1
                if item:
                    new_total_price = float(item['price_per_night']) * nights

        elif booking['booking_type'] == 'Transport':
            pickup_location = request.form.get('pickup_location', booking['pickup_location']).strip()
            drop_location = request.form.get('drop_location', booking['drop_location']).strip()
            if item:
                if item['transport_type'] == 'Cab':
                    new_total_price = float(item['price'])
                else:
                    new_total_price = float(item['price']) * num_travelers

        elif booking['booking_type'] == 'Package':
            if item:
                new_total_price = float(item['price']) * num_travelers

        cursor.execute('''
            UPDATE bookings
            SET travel_date = ?, check_out_date = ?, num_travelers = ?,
                room_type = ?, pickup_location = ?, drop_location = ?,
                contact_phone = ?, special_requests = ?,
                total_price = ?, status = 'Modified'
            WHERE id = ? AND user_id = ?
        ''', (
            travel_date or booking['travel_date'],
            check_out_date,
            num_travelers,
            room_type,
            pickup_location,
            drop_location,
            contact_phone,
            special_requests,
            new_total_price,
            booking_id,
            user_id
        ))
        conn.commit()
        conn.close()

        flash('Booking has been updated successfully with new schedule/details!', 'success')
        return redirect(url_for('bookings.booking_summary', booking_id=booking_id))

    conn.close()
    return render_template('booking_modify.html', booking=booking, item=item)

@bookings_bp.route('/bookings/cancel/<int:booking_id>', methods=['POST'])
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
        flash('Your booking has been cancelled.', 'success')
    else:
        flash('Booking record not found.', 'danger')

    conn.close()
    return redirect(url_for('dashboard.dashboard', tab='bookings'))
