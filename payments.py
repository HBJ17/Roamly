import random
import string
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from database.connection import get_db_connection
from utils.decorators import login_required
from config import Config

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

# helper to calculate coupon discount
def evaluate_coupon(code, subtotal):
    if not code:
        return 0.0, None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM coupons WHERE code = %s AND is_active = 1', (code.upper().strip(),))
    coupon = cursor.fetchone()
    conn.close()
    if not coupon:
        return 0.0, None
    if subtotal < float(coupon['min_purchase']):
        return 0.0, coupon
    if coupon['discount_type'] == 'flat':
        discount = float(coupon['discount_value'])
    else:
        discount = subtotal * (float(coupon['discount_value']) / 100.0)
    discount = min(discount, float(coupon['max_discount']))
    return round(discount, 2), coupon

# api validate coupon
@payments_bp.route('/api/validate-coupon', methods=['POST'])
def api_validate_coupon():
    data = request.get_json() or {}
    code = data.get('code', '').strip().upper()
    subtotal = float(data.get('subtotal', 0.0))
    discount, coupon = evaluate_coupon(code, subtotal)
    if not coupon:
        return jsonify({'valid': False, 'message': 'Invalid promo code.'}), 400
    if subtotal < float(coupon['min_purchase']):
        return jsonify({'valid': False, 'message': f"Minimum cart value of ₹{coupon['min_purchase']} required."}), 400
    return jsonify({
        'valid': True,
        'code': coupon['code'],
        'discount': discount,
        'description': coupon['description'],
        'message': f"Coupon '{coupon['code']}' applied! Saved ₹{discount:,.2f}"
    })

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

    # fetch user wallet
    cursor.execute('SELECT * FROM wallets WHERE user_id = %s', (user_id,))
    wallet = cursor.fetchone()
    wallet_balance = float(wallet['balance']) if wallet else 0.0

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
        flash('Requested booking item does not exist.', 'danger')
        return redirect(url_for('packages.packages'))

    # params from request
    travel_date = request.args.get('travel_date', '')
    check_out_date = request.args.get('check_out_date', '')
    num_travelers = int(request.args.get('num_travelers', 1))
    room_type = request.args.get('room_type', 'Deluxe Room')
    pickup_location = request.args.get('pickup_location', '')

    # calculate base subtotal
    nights = 1
    if booking_type == 'Hotel':
        base_rate = float(item['price_per_night'])
        if travel_date and check_out_date:
            try:
                d1 = datetime.strptime(travel_date, '%Y-%m-%d')
                d2 = datetime.strptime(check_out_date, '%Y-%m-%d')
                nights = max(1, (d2 - d1).days)
            except ValueError:
                nights = 1
        subtotal = base_rate * nights
    elif booking_type == 'Transport':
        base_rate = float(item['price'])
        subtotal = base_rate if item['transport_type'] == 'Cab' else base_rate * num_travelers
    else:
        base_rate = float(item['price'])
        subtotal = base_rate * num_travelers

    tax_rate = 0.05
    tax_amount = round(subtotal * tax_rate, 2)
    total_estimated = round(subtotal + tax_amount, 2)

    return render_template(
        'checkout.html',
        booking_type=booking_type,
        item=item,
        user=user,
        wallet_balance=wallet_balance,
        travel_date=travel_date,
        check_out_date=check_out_date,
        num_travelers=num_travelers,
        room_type=room_type,
        pickup_location=pickup_location,
        nights=nights,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_estimated=total_estimated,
        config=Config
    )

# process payment & complete booking
@payments_bp.route('/process-payment', methods=['POST'])
@login_required
def process_payment():
    user_id = session['user_id']
    booking_type = request.form.get('booking_type')
    item_id = int(request.form.get('item_id'))
    travel_date = request.form.get('travel_date')
    check_out_date = request.form.get('check_out_date', '')
    num_travelers = int(request.form.get('num_travelers', 1))
    room_type = request.form.get('room_type', '')
    pickup_location = request.form.get('pickup_location', '')
    special_requests = request.form.get('special_requests', '')
    payment_method = request.form.get('payment_method', 'Credit Card')
    promo_code = request.form.get('promo_code', '').strip().upper()

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

    # calculate coupon discount from db
    discount, coupon = evaluate_coupon(promo_code, subtotal)
    discounted_subtotal = max(0.0, subtotal - discount)
    tax_amount = round(discounted_subtotal * 0.05, 2)
    total_price = round(discounted_subtotal + tax_amount, 2)

    # Check Wallet Balance if paying with Wallet
    if payment_method == 'Roamly Wallet':
        cursor.execute('SELECT * FROM wallets WHERE user_id = %s', (user_id,))
        wallet = cursor.fetchone()
        current_bal = float(wallet['balance']) if wallet else 0.0
        if current_bal < total_price:
            conn.close()
            flash(f'Insufficient wallet balance (₹{current_bal:,.2f}). Please top-up or choose another payment method.', 'danger')
            return redirect(url_for('payments.checkout', booking_type=booking_type, item_id=item_id, travel_date=travel_date, num_travelers=num_travelers))
        
        # Deduct wallet balance
        new_bal = current_bal - total_price
        cursor.execute('UPDATE wallets SET balance = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s', (new_bal, user_id))
        cursor.execute('''
            INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
            VALUES (%s, %s, 'Debit', %s, %s)
        ''', (user_id, total_price, f"Payment for {booking_type} booking", f"BOOK-{booking_type[:3]}-{item_id}"))

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
        message=f"Your booking for '{item_title}' (₹{total_price:,.2f}) has been confirmed via {payment_method}. Ref: #ROAM-{booking_type[:3].upper()}-{booking_id:04d}.",
        notification_type='booking',
        link_url=url_for('bookings.booking_summary', booking_id=booking_id)
    )

    flash(f"Payment successful! Booking #ROAM-{booking_type[:3].upper()}-{booking_id:04d} is confirmed.", 'success')
    return redirect(url_for('bookings.booking_summary', booking_id=booking_id))

# wallet dashboard
@payments_bp.route('/wallet')
@login_required
def wallet():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # ensure wallet exists
    cursor.execute('SELECT * FROM wallets WHERE user_id = %s', (user_id,))
    wallet = cursor.fetchone()
    if not wallet:
        cursor.execute('INSERT INTO wallets (user_id, balance, currency) VALUES (%s, 5000.00, "INR")', (user_id,))
        cursor.execute('''
            INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
            VALUES (%s, 5000.00, 'Credit', 'Welcome promotional travel credits', 'CREDIT-WELCOME')
        ''', (user_id,))
        conn.commit()
        cursor.execute('SELECT * FROM wallets WHERE user_id = %s', (user_id,))
        wallet = cursor.fetchone()

    cursor.execute('''
        SELECT * FROM wallet_transactions
        WHERE user_id = %s
        ORDER BY created_at DESC
    ''', (user_id,))
    transactions = cursor.fetchall()
    
    # fetch active coupons
    cursor.execute('SELECT * FROM coupons WHERE is_active = 1 ORDER BY discount_value DESC')
    coupons = cursor.fetchall()
    
    conn.close()
    return render_template('wallet.html', wallet=wallet, transactions=transactions, coupons=coupons)

# wallet top-up
@payments_bp.route('/wallet/add-funds', methods=['POST'])
@login_required
def add_funds():
    user_id = session['user_id']
    try:
        amount = float(request.form.get('amount', 1000.0))
        if amount <= 0:
            flash('Please enter a valid positive amount.', 'danger')
            return redirect(url_for('payments.wallet'))
    except ValueError:
        flash('Invalid amount entered.', 'danger')
        return redirect(url_for('payments.wallet'))

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM wallets WHERE user_id = %s', (user_id,))
    wallet = cursor.fetchone()
    current_bal = float(wallet['balance']) if wallet else 0.0
    new_bal = current_bal + amount

    cursor.execute('UPDATE wallets SET balance = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s', (new_bal, user_id))
    txn_ref = f"TOPUP-{generate_txn_id()}"
    cursor.execute('''
        INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
        VALUES (%s, %s, 'Topup', 'Wallet instant balance recharge', %s)
    ''', (user_id, amount, txn_ref))
    
    conn.commit()
    conn.close()

    flash(f"Successfully added ₹{amount:,.2f} to your Roamly Wallet!", 'success')
    return redirect(url_for('payments.wallet'))

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

# view official tax invoice
@payments_bp.route('/invoice/<int:booking_id>')
def view_invoice(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT b.*, u.username, u.full_name as user_full_name, u.email as user_email, u.phone as user_phone, u.address as user_address
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = %s
    ''', (booking_id,))
    booking = cursor.fetchone()
    if not booking:
        conn.close()
        flash('Booking record not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))

    # fetch invoice record
    cursor.execute('SELECT * FROM invoices WHERE booking_id = %s', (booking_id,))
    inv = cursor.fetchone()
    invoice_number = inv['invoice_number'] if inv else f"INV-2026-{booking_id:06d}"

    # fetch item
    item = None
    if booking['booking_type'] == 'Package' and booking['package_id']:
        cursor.execute('''
            SELECT p.*, a.name as agency_name, a.phone as agency_phone, a.email as agency_email, a.address as agency_address
            FROM packages p
            LEFT JOIN agencies a ON p.agency_id = a.id
            WHERE p.id = %s
        ''', (booking['package_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Hotel' and booking['hotel_id']:
        cursor.execute('''
            SELECT h.*, a.name as agency_name, a.phone as agency_phone, a.email as agency_email, a.address as agency_address
            FROM hotels h
            LEFT JOIN agencies a ON h.agency_id = a.id
            WHERE h.id = %s
        ''', (booking['hotel_id'],))
        item = cursor.fetchone()
    elif booking['booking_type'] == 'Transport' and booking['transport_id']:
        cursor.execute('''
            SELECT t.*, a.name as agency_name, a.phone as agency_phone, a.email as agency_email, a.address as agency_address
            FROM transports t
            LEFT JOIN agencies a ON t.agency_id = a.id
            WHERE t.id = %s
        ''', (booking['transport_id'],))
        item = cursor.fetchone()

    conn.close()

    total = float(booking['total_price'])
    subtotal = total / 1.05
    tax_amount = total - subtotal

    return render_template(
        'invoice.html',
        booking=booking,
        item=item or {},
        invoice_number=invoice_number,
        subtotal=subtotal,
        tax_amount=tax_amount
    )

# view email confirmation simulation
@payments_bp.route('/email-confirmation/<int:booking_id>')
def view_email_confirmation(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT b.*, u.username, u.full_name as user_full_name, u.email as user_email, u.phone as user_phone, u.address as user_address
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = %s
    ''', (booking_id,))
    booking = cursor.fetchone()
    if not booking:
        conn.close()
        flash('Booking record not found.', 'danger')
        return redirect(url_for('dashboard.dashboard'))

    # fetch payment
    cursor.execute('SELECT * FROM payments WHERE booking_id = %s ORDER BY id DESC LIMIT 1', (booking_id,))
    payment = cursor.fetchone()

    # fetch item
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
        item=item or {},
        payment=payment
    )

