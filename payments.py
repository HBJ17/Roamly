import random
import string
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import login_required

payments_bp = Blueprint('payments', __name__)

# generate transaction id
def generate_txn_id():
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"TXN-ROAM-{chars}"

# generate invoice number
def generate_invoice_number():
    year = datetime.now().year
    num = ''.join(random.choices(string.digits, k=6))
    return f"INV-{year}-{num}"

# create in-app notification
def create_notification(user_id, title, message, notification_type='booking', link_url=''):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO notifications (user_id, title, message, notification_type, link_url, is_read)
            VALUES (%s, %s, %s, %s, %s, 0)
        ''', (user_id, title, message, notification_type, link_url))
        conn.commit()
        conn.close()
    except Exception:
        pass

# log transactional email
def log_email_confirmation(booking_id, recipient_email, subject, body_html):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO email_logs (booking_id, recipient_email, subject, body_html)
            VALUES (%s, %s, %s, %s)
        ''', (booking_id, recipient_email, subject, body_html))
        conn.commit()
        conn.close()
    except Exception:
        pass

# checkout route
@payments_bp.route('/checkout/<booking_type>/<int:item_id>', methods=['GET', 'POST'])
@login_required
def checkout(booking_type, item_id):
    user_id = session['user_id']
    booking_type = booking_type.capitalize()

    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch user
    cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
    user = cursor.fetchone()

    item = None
    if booking_type == 'Package':
        cursor.execute('''
            SELECT p.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
            FROM packages p
            LEFT JOIN agencies a ON p.agency_id = a.id
            WHERE p.id = %s
        ''', (item_id,))
        item = cursor.fetchone()
    elif booking_type == 'Hotel':
        cursor.execute('''
            SELECT h.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
            FROM hotels h
            LEFT JOIN agencies a ON h.agency_id = a.id
            WHERE h.id = %s
        ''', (item_id,))
        item = cursor.fetchone()
    elif booking_type == 'Transport':
        cursor.execute('''
            SELECT t.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
            FROM transports t
            LEFT JOIN agencies a ON t.agency_id = a.id
            WHERE t.id = %s
        ''', (item_id,))
        item = cursor.fetchone()

    conn.close()

    if not item:
        flash('Requested service was not found.', 'danger')
        return redirect(url_for('packages.packages'))

    # gather parameters
    travel_date = request.args.get('travel_date') or request.form.get('travel_date', '')
    check_out_date = request.args.get('check_out_date') or request.form.get('check_out_date', '')
    num_travelers_str = request.args.get('num_travelers') or request.form.get('num_travelers', '1')
    room_type = request.args.get('room_type') or request.form.get('room_type', '')
    pickup_location = request.args.get('pickup_location') or request.form.get('pickup_location', '')
    drop_location = request.args.get('drop_location') or request.form.get('drop_location', '')
    promo_code = (request.args.get('promo_code') or request.form.get('promo_code', '')).strip().upper()

    try:
        num_travelers = max(1, int(num_travelers_str))
    except ValueError:
        num_travelers = 1

    nights = 1
    if booking_type == 'Hotel' and travel_date and check_out_date:
        try:
            d1 = datetime.strptime(travel_date, '%Y-%m-%d')
            d2 = datetime.strptime(check_out_date, '%Y-%m-%d')
            nights = max(1, (d2 - d1).days)
        except ValueError:
            nights = 1

    # compute subtotal
    if booking_type == 'Package':
        base_rate = float(item['price'])
        subtotal = base_rate * num_travelers
    elif booking_type == 'Hotel':
        base_rate = float(item['price_per_night'])
        subtotal = base_rate * nights
    elif booking_type == 'Transport':
        base_rate = float(item['price'])
        if item['transport_type'] == 'Cab':
            subtotal = base_rate
        else:
            subtotal = base_rate * num_travelers
    else:
        subtotal = 0.0

    # compute discount
    discount = 0.0
    discount_msg = ''
    if promo_code == 'ROAMLY10':
        discount = round(subtotal * 0.10, 2)
        discount_msg = '10% Roamly Welcome Discount Applied'
    elif promo_code == 'DISCOVER':
        discount = min(500.0, subtotal * 0.5)
        discount_msg = 'FLAT ₹500 Explorer Coupon Applied'
    elif promo_code == 'TAMILNADU':
        discount = round(subtotal * 0.15, 2)
        discount_msg = '15% Tamil Nadu Tourism Special Discount Applied'
    elif promo_code:
        discount_msg = 'Invalid or expired coupon code'

    discounted_subtotal = max(0.0, subtotal - discount)
    tax_amount = round(discounted_subtotal * 0.05, 2)
    total_amount = round(discounted_subtotal + tax_amount, 2)

    return render_template(
        'checkout.html',
        user=user,
        booking_type=booking_type,
        item=item,
        travel_date=travel_date,
        check_out_date=check_out_date,
        num_travelers=num_travelers,
        room_type=room_type,
        pickup_location=pickup_location,
        drop_location=drop_location,
        nights=nights,
        subtotal=subtotal,
        discount=discount,
        discount_msg=discount_msg,
        promo_code=promo_code,
        tax_amount=tax_amount,
        total_amount=total_amount
    )

# process payment
@payments_bp.route('/payment/process', methods=['POST'])
@login_required
def process_payment():
    user_id = session['user_id']
    booking_type = request.form.get('booking_type', 'Package').capitalize()
    item_id = int(request.form.get('item_id', '0'))
    travel_date = request.form.get('travel_date', '').strip()
    check_out_date = request.form.get('check_out_date', '').strip()
    num_travelers_str = request.form.get('num_travelers', '1').strip()
    room_type = request.form.get('room_type', '').strip()
    pickup_location = request.form.get('pickup_location', '').strip()
    contact_phone = request.form.get('contact_phone', '').strip()
    contact_email = request.form.get('contact_email', '').strip()
    special_requests = request.form.get('special_requests', '').strip()
    payment_method = request.form.get('payment_method', 'Credit / Debit Card').strip()
    promo_code = request.form.get('promo_code', '').strip().upper()

    try:
        num_travelers = max(1, int(num_travelers_str))
    except ValueError:
        num_travelers = 1

    if not travel_date:
        flash('Travel date is required to complete booking.', 'danger')
        return redirect(url_for('packages.packages'))

    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch item
    item = None
    if booking_type == 'Package':
        cursor.execute('SELECT * FROM packages WHERE id = %s', (item_id,))
        item = cursor.fetchone()
        base_rate = float(item['price']) if item else 0.0
        subtotal = base_rate * num_travelers
        pkg_id, htl_id, trn_id = item_id, None, None
    elif booking_type == 'Hotel':
        cursor.execute('SELECT * FROM hotels WHERE id = %s', (item_id,))
        item = cursor.fetchone()
        base_rate = float(item['price_per_night']) if item else 0.0
        nights = 1
        if travel_date and check_out_date:
            try:
                d1 = datetime.strptime(travel_date, '%Y-%m-%d')
                d2 = datetime.strptime(check_out_date, '%Y-%m-%d')
                nights = max(1, (d2 - d1).days)
            except ValueError:
                nights = 1
        subtotal = base_rate * nights
        pkg_id, htl_id, trn_id = None, item_id, None
    else:
        cursor.execute('SELECT * FROM transports WHERE id = %s', (item_id,))
        item = cursor.fetchone()
        base_rate = float(item['price']) if item else 0.0
        subtotal = base_rate if item and item['transport_type'] == 'Cab' else base_rate * num_travelers
        pkg_id, htl_id, trn_id = None, None, item_id

    if not item:
        conn.close()
        flash('Selected itinerary item not found.', 'danger')
        return redirect(url_for('packages.packages'))

    # calculate total
    discount = 0.0
    if promo_code == 'ROAMLY10':
        discount = round(subtotal * 0.10, 2)
    elif promo_code == 'DISCOVER':
        discount = min(500.0, subtotal * 0.5)
    elif promo_code == 'TAMILNADU':
        discount = round(subtotal * 0.15, 2)

    discounted_subtotal = max(0.0, subtotal - discount)
    tax_amount = round(discounted_subtotal * 0.05, 2)
    total_price = round(discounted_subtotal + tax_amount, 2)

    # insert booking
    cursor.execute('''
        INSERT INTO bookings (
            user_id, package_id, hotel_id, transport_id, booking_type,
            travel_date, check_out_date, num_travelers, room_type,
            pickup_location, special_requests,
            total_price, status, payment_status, trip_status,
            subtotal_amount, tax_amount, discount_amount, discount_code
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Confirmed', 'Paid', 'Upcoming', %s, %s, %s, %s)
    ''', (
        user_id, pkg_id, htl_id, trn_id, booking_type,
        travel_date, check_out_date, num_travelers, room_type,
        pickup_location, special_requests,
        total_price, subtotal, tax_amount, discount, promo_code
    ))
    booking_id = cursor.lastrowid

    # insert payment
    txn_id = generate_txn_id()
    cursor.execute('''
        INSERT INTO payments (
            booking_id, user_id, transaction_id, payment_method,
            amount, currency, status
        )
        VALUES (%s, %s, %s, %s, %s, 'INR', 'Success')
    ''', (booking_id, user_id, txn_id, payment_method, total_price))

    # insert invoice
    invoice_number = generate_invoice_number()
    cursor.execute('''
        INSERT INTO invoices (
            invoice_number, booking_id, user_id,
            subtotal, tax_amount, discount, total_amount, status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'Paid')
    ''', (invoice_number, booking_id, user_id, subtotal, tax_amount, discount, total_price))

    conn.commit()
    conn.close()

    # send notification
    item_title = item['title'] if 'title' in item.keys() else item['name']
    create_notification(
        user_id=user_id,
        title=f"Booking & Payment Confirmed ({booking_type})",
        message=f"Your booking for '{item_title}' (₹{total_price:,.2f}) has been confirmed. Ref: #ROAM-{booking_type[:3].upper()}-{booking_id:04d}.",
        notification_type='booking',
        link_url=url_for('bookings.booking_summary', booking_id=booking_id)
    )

    # log email
    recipient_email = contact_email or session.get('email', 'traveler@roamly.com')
    email_html = f"""
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f766e; margin-bottom: 5px;">Roamly Booking Confirmation</h2>
        <p style="color: #64748b; font-size: 14px;">Tax Invoice Ref: {invoice_number} | Txn ID: {txn_id}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
        <p>Dear Traveler,</p>
        <p>Thank you for choosing Roamly. Your reservation for <strong>{item_title}</strong> is fully confirmed and paid.</p>
        <table style="width: 100%; font-size: 14px; margin-top: 15px; border-collapse: collapse;">
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Booking Type:</td><td style="padding: 8px;">{booking_type}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Travel Date:</td><td style="padding: 8px;">{travel_date}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Travelers/Guests:</td><td style="padding: 8px;">{num_travelers}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Total Amount Paid:</td><td style="padding: 8px; color: #0f766e; font-weight: bold;">₹{total_price:,.2f}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Payment Method:</td><td style="padding: 8px;">{payment_method}</td></tr>
        </table>
    </div>
    """
    log_email_confirmation(
        booking_id=booking_id,
        recipient_email=recipient_email,
        subject=f"Roamly Booking Confirmation: {item_title} [#{booking_id:04d}]",
        body_html=email_html
    )

    flash(f'Payment of ₹{total_price:,.2f} successful! Booking confirmed under Reference #{booking_id:04d}.', 'success')
    return redirect(url_for('bookings.booking_summary', booking_id=booking_id))

# view tax invoice
@payments_bp.route('/invoice/<int:booking_id>')
@login_required
def view_invoice(booking_id):
    user_id = session['user_id']
    is_admin = bool(session.get('admin_id'))

    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch booking
    cursor.execute('''
        SELECT b.*, u.username, u.email as user_email, u.full_name as user_full_name, u.phone as user_phone, u.address as user_address
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = %s AND (b.user_id = %s OR %s = 1)
    ''', (booking_id, user_id, 1 if is_admin else 0))
    booking = cursor.fetchone()

    if not booking:
        conn.close()
        flash('Invoice not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))

    # fetch invoice
    cursor.execute('SELECT * FROM invoices WHERE booking_id = %s', (booking_id,))
    invoice = cursor.fetchone()

    # fetch payment
    cursor.execute('SELECT * FROM payments WHERE booking_id = %s ORDER BY id DESC LIMIT 1', (booking_id,))
    payment = cursor.fetchone()

    # fetch item
    item = None
    if booking_type := booking['booking_type']:
        if booking_type == 'Package' and booking['package_id']:
            cursor.execute('''
                SELECT p.*, a.name as agency_name, a.email as agency_email, a.phone as agency_phone, a.address as agency_address
                FROM packages p
                LEFT JOIN agencies a ON p.agency_id = a.id
                WHERE p.id = %s
            ''', (booking['package_id'],))
            item = cursor.fetchone()
        elif booking_type == 'Hotel' and booking['hotel_id']:
            cursor.execute('''
                SELECT h.*, a.name as agency_name, a.email as agency_email, a.phone as agency_phone, a.address as agency_address
                FROM hotels h
                LEFT JOIN agencies a ON h.agency_id = a.id
                WHERE h.id = %s
            ''', (booking['hotel_id'],))
            item = cursor.fetchone()
        elif booking_type == 'Transport' and booking['transport_id']:
            cursor.execute('''
                SELECT t.*, a.name as agency_name, a.email as agency_email, a.phone as agency_phone, a.address as agency_address
                FROM transports t
                LEFT JOIN agencies a ON t.agency_id = a.id
                WHERE t.id = %s
            ''', (booking['transport_id'],))
            item = cursor.fetchone()

    conn.close()

    # compute breakdown
    subtotal = invoice['subtotal'] if invoice else (booking['subtotal_amount'] or round(booking['total_price'] / 1.05, 2))
    tax_amount = invoice['tax_amount'] if invoice else (booking['tax_amount'] or round(booking['total_price'] - subtotal, 2))
    discount_amount = invoice['discount'] if invoice else (booking['discount_amount'] or 0.0)
    total_amount = invoice['total_amount'] if invoice else booking['total_price']
    invoice_number = invoice['invoice_number'] if invoice else f"INV-2026-{booking_id:06d}"

    return render_template(
        'invoice.html',
        booking=booking,
        invoice=invoice,
        payment=payment,
        item=item,
        invoice_number=invoice_number,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=total_amount
    )

# email confirmation preview
@payments_bp.route('/email-confirmation/<int:booking_id>')
@login_required
def view_email_confirmation(booking_id):
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
        flash('Booking record not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))

    cursor.execute('SELECT * FROM email_logs WHERE booking_id = %s ORDER BY id DESC LIMIT 1', (booking_id,))
    email_log = cursor.fetchone()

    cursor.execute('SELECT * FROM payments WHERE booking_id = %s ORDER BY id DESC LIMIT 1', (booking_id,))
    payment = cursor.fetchone()

    cursor.execute('SELECT * FROM invoices WHERE booking_id = %s', (booking_id,))
    invoice = cursor.fetchone()

    item = None
    if booking['booking_type'] == 'Package' and booking['package_id']:
        cursor.execute('SELECT * FROM packages WHERE id = %s', (booking['package_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Hotel' and booking['hotel_id']:
        cursor.execute('SELECT * FROM hotels WHERE id = %s', (booking['hotel_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Transport' and booking['transport_id']:
        cursor.execute('SELECT * FROM transports WHERE id = %s', (booking['transport_id'],))
        item = cursor.fetchone()

    conn.close()

    return render_template(
        'email_confirmation.html',
        booking=booking,
        email_log=email_log,
        payment=payment,
        invoice=invoice,
        item=item
    )

# notifications list
@payments_bp.route('/notifications')
@login_required
def notifications():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM notifications
        WHERE user_id = %s
        ORDER BY created_at DESC
    ''', (user_id,))
    notifs = cursor.fetchall()
    conn.close()

    return render_template('notifications.html', notifications=notifs)

# mark notification read
@payments_bp.route('/notifications/read/<int:notification_id>', methods=['POST'])
@login_required
def mark_notification_read(notification_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE notifications SET is_read = 1 WHERE id = %s AND user_id = %s', (notification_id, user_id))
    conn.commit()
    conn.close()
    return redirect(url_for('payments.notifications'))

# mark all read
@payments_bp.route('/notifications/read-all', methods=['POST'])
@login_required
def mark_all_notifications_read():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE notifications SET is_read = 1 WHERE user_id = %s', (user_id,))
    conn.commit()
    conn.close()
    flash('All notifications marked as read.', 'info')
    return redirect(url_for('payments.notifications'))

# clear notifications
@payments_bp.route('/notifications/clear', methods=['POST'])
@login_required
def clear_notifications():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM notifications WHERE user_id = %s AND is_read = 1', (user_id,))
    conn.commit()
    conn.close()
    flash('Read notifications cleared.', 'info')
    return redirect(url_for('payments.notifications'))
