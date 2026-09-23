from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from config import Config
from database.connection import get_db_connection
from utils.decorators import agency_required
from utils.security import verify_password, is_rate_limited, record_failed_attempt, clear_failed_attempts
from payments import create_notification

agency_bp = Blueprint('agency', __name__, url_prefix='/agency')

# agency login
@agency_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'agency_id' in session:
        return redirect(url_for('agency.dashboard'))

    if request.method == 'POST':
        client_ip = request.remote_addr or 'unknown'
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        rate_key = f"agency:{client_ip}:{username.lower()}"
        limited, retry_sec = is_rate_limited(rate_key, max_attempts=5, window_seconds=300)
        if limited:
            flash(f'Too many failed attempts. Agency portal locked for security. Please wait {retry_sec} seconds.', 'danger')
            return render_template('agency/login.html')

        if not username or not password:
            flash('Please enter both agency username and password.', 'danger')
            return render_template('agency/login.html')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM agencies WHERE username = %s', (username,))
        agency = cursor.fetchone()
        conn.close()

        if agency and verify_password(password, agency['password']):
            if agency['status'] != 'Active':
                flash('Your agency account is currently suspended. Please contact Roamly central administration.', 'danger')
                return render_template('agency/login.html')

            clear_failed_attempts(rate_key)
            session.clear()
            session['agency_id'] = agency['id']
            session['agency_name'] = agency['name']
            session['agency_type'] = agency['agency_type']
            session['agency_username'] = agency['username']
            flash(f'Welcome back, {agency["name"]}!', 'success')
            return redirect(url_for('agency.dashboard'))
        else:
            record_failed_attempt(rate_key)
            flash('Invalid agency username or password.', 'danger')
            return render_template('agency/login.html')

    return render_template('agency/login.html')

# agency logout
@agency_bp.route('/logout')
def logout():
    session.pop('agency_id', None)
    session.pop('agency_name', None)
    session.pop('agency_type', None)
    session.pop('agency_username', None)
    flash('Agency partner session terminated successfully.', 'info')
    return redirect(url_for('agency.login'))

# agency dashboard
@agency_bp.route('/dashboard')
@agency_required
def dashboard():
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    # agency info
    cursor.execute('SELECT * FROM agencies WHERE id = %s', (agency_id,))
    agency = cursor.fetchone()

    # inventory counts
    cursor.execute('SELECT COUNT(*) as cnt FROM packages WHERE agency_id = %s', (agency_id,))
    pkg_count = cursor.fetchone()['cnt']

    cursor.execute('SELECT COUNT(*) as cnt FROM hotels WHERE agency_id = %s', (agency_id,))
    hotel_count = cursor.fetchone()['cnt']

    cursor.execute('SELECT COUNT(*) as cnt FROM transports WHERE agency_id = %s', (agency_id,))
    transport_count = cursor.fetchone()['cnt']

    # agency bookings
    cursor.execute('''
        SELECT 
            b.*,
            u.username,
            u.full_name as user_full_name,
            u.email as user_email,
            u.phone as user_phone,
            COALESCE(p.title, h.name, t.title) as item_title
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE (p.agency_id = %s OR h.agency_id = %s OR t.agency_id = %s)
        ORDER BY b.created_at DESC
    ''', (agency_id, agency_id, agency_id))
    agency_bookings = cursor.fetchall()

    total_earnings = sum(float(b['total_price']) for b in agency_bookings if b['status'] != 'Cancelled')
    total_orders = len(agency_bookings)

    # agency packages
    cursor.execute('SELECT * FROM packages WHERE agency_id = %s ORDER BY id DESC', (agency_id,))
    my_packages = cursor.fetchall()

    # agency hotels
    cursor.execute('SELECT * FROM hotels WHERE agency_id = %s ORDER BY id DESC', (agency_id,))
    my_hotels = cursor.fetchall()

    # agency transports
    cursor.execute('SELECT * FROM transports WHERE agency_id = %s ORDER BY id DESC', (agency_id,))
    my_transports = cursor.fetchall()

    conn.close()

    return render_template(
        'agency/dashboard.html',
        agency=agency,
        pkg_count=pkg_count,
        hotel_count=hotel_count,
        transport_count=transport_count,
        total_earnings=total_earnings,
        total_orders=total_orders,
        bookings=agency_bookings[:8],
        my_packages=my_packages,
        my_hotels=my_hotels,
        my_transports=my_transports
    )

# manage packages
@agency_bp.route('/packages')
@agency_required
def manage_packages():
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM packages WHERE agency_id = %s ORDER BY id DESC', (agency_id,))
    packages_list = cursor.fetchall()
    conn.close()
    return render_template('agency/packages.html', packages=packages_list)

# add package
@agency_bp.route('/packages/add', methods=['GET', 'POST'])
@agency_required
def add_package():
    agency_id = session['agency_id']
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        destination = request.form.get('destination', '').strip()
        category = request.form.get('category', 'Hill Station').strip()
        price = request.form.get('price', '0').strip()
        duration_days = request.form.get('duration_days', '3').strip()
        duration_nights = request.form.get('duration_nights', '2').strip()
        description = request.form.get('description', '').strip()
        highlights = request.form.get('highlights', '').strip()
        included_amenities = request.form.get('included_amenities', '').strip()
        image_url = request.form.get('image_url', '').strip()

        if not title or not destination or not price:
            flash('Title, destination, and package price are required fields.', 'danger')
            return render_template('agency/package_form.html', is_edit=False, package=None)

        try:
            price_val = float(price)
            days_val = int(duration_days)
            nights_val = int(duration_nights)
        except ValueError:
            flash('Please enter valid numeric values for price and duration.', 'danger')
            return render_template('agency/package_form.html', is_edit=False, package=None)

        if not image_url:
            image_url = 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80'

        # insert package
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO packages (
                title, destination, category, price, duration_days,
                duration_nights, description, highlights, included_amenities,
                rating, image_url, agency_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 4.8, %s, %s)
        ''', (
            title, destination, category, price_val, days_val,
            nights_val, description, highlights, included_amenities,
            image_url, agency_id
        ))
        conn.commit()
        conn.close()

        flash(f'New holiday package "{title}" created and listed with price ₹{price_val:,.2f}!', 'success')
        return redirect(url_for('agency.manage_packages'))

    return render_template('agency/package_form.html', is_edit=False, package=None)

# edit package (Strictly bounded to agency_id)
@agency_bp.route('/packages/edit/<int:package_id>', methods=['GET', 'POST'])
@agency_required
def edit_package(package_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM packages WHERE id = %s AND agency_id = %s', (package_id, agency_id))
    pkg = cursor.fetchone()

    if not pkg:
        conn.close()
        flash('Package listing not found or permission denied.', 'danger')
        return redirect(url_for('agency.manage_packages'))

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        destination = request.form.get('destination', '').strip()
        category = request.form.get('category', 'Hill Station').strip()
        price = request.form.get('price', '').strip()
        duration_days = request.form.get('duration_days', '3').strip()
        duration_nights = request.form.get('duration_nights', '2').strip()
        description = request.form.get('description', '').strip()
        highlights = request.form.get('highlights', '').strip()
        included_amenities = request.form.get('included_amenities', '').strip()
        image_url = request.form.get('image_url', '').strip()

        try:
            price_val = float(price)
            days_val = int(duration_days)
            nights_val = int(duration_nights)
        except ValueError:
            flash('Invalid numeric inputs.', 'danger')
            conn.close()
            return render_template('agency/package_form.html', is_edit=True, package=pkg)

        # update package
        cursor.execute('''
            UPDATE packages
            SET title = %s, destination = %s, category = %s, price = %s,
                duration_days = %s, duration_nights = %s, description = %s,
                highlights = %s, included_amenities = %s, image_url = %s
            WHERE id = %s AND agency_id = %s
        ''', (
            title or pkg['title'],
            destination or pkg['destination'],
            category,
            price_val,
            days_val,
            nights_val,
            description or pkg['description'],
            highlights or pkg['highlights'],
            included_amenities or pkg['included_amenities'],
            image_url or pkg['image_url'],
            package_id,
            agency_id
        ))
        conn.commit()
        conn.close()

        flash(f'Package "{title}" and pricing updated to ₹{price_val:,.2f}!', 'success')
        return redirect(url_for('agency.manage_packages'))

    conn.close()
    return render_template('agency/package_form.html', is_edit=True, package=pkg)

# delete package (Strictly bounded to agency_id)
@agency_bp.route('/packages/delete/<int:package_id>', methods=['POST'])
@agency_required
def delete_package(package_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT title FROM packages WHERE id = %s AND agency_id = %s', (package_id, agency_id))
    pkg = cursor.fetchone()

    if pkg:
        pkg_title = pkg['title']
        cursor.execute('DELETE FROM packages WHERE id = %s AND agency_id = %s', (package_id, agency_id))
        conn.commit()
        flash(f'Package "{pkg_title}" has been deleted from your catalog.', 'success')
    else:
        flash('Package not found or unauthorized.', 'danger')

    conn.close()
    return redirect(url_for('agency.manage_packages'))

# add hotel
@agency_bp.route('/hotels/add', methods=['POST'])
@agency_required
def add_hotel():
    agency_id = session['agency_id']
    name = request.form.get('name', '').strip()
    city = request.form.get('city', '').strip()
    address = request.form.get('address', '').strip()
    price = request.form.get('price_per_night', '3000').strip()
    room_types = request.form.get('room_types', 'Deluxe Room, Luxury Suite').strip()
    amenities = request.form.get('amenities', 'Free WiFi, AC, Breakfast').strip()
    description = request.form.get('description', '').strip()
    image_url = request.form.get('image_url', '').strip() or 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'

    if not name or not city or not price:
        flash('Hotel name, city, and rate are required.', 'danger')
        return redirect(url_for('agency.dashboard'))

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO hotels (agency_id, name, city, address, star_rating, price_per_night, room_types, amenities, description, image_url)
        VALUES (%s, %s, %s, %s, 4.7, %s, %s, %s, %s, %s)
    ''', (agency_id, name, city, address, float(price), room_types, amenities, description, image_url))
    conn.commit()
    conn.close()

    flash(f'Hotel property "{name}" registered at ₹{float(price):,.2f} / night!', 'success')
    return redirect(url_for('agency.dashboard'))

# add transport
@agency_bp.route('/transports/add', methods=['POST'])
@agency_required
def add_transport():
    agency_id = session['agency_id']
    title = request.form.get('title', '').strip()
    transport_type = request.form.get('transport_type', 'Cab').strip()
    source_city = request.form.get('source_city', '').strip()
    dest_city = request.form.get('destination_city', '').strip()
    price = request.form.get('price', '2500').strip()
    duration_hours = request.form.get('duration_hours', '4').strip()
    features = request.form.get('features', 'AC, Professional Chauffeur, Sanitized Fleet').strip()
    departure_time = request.form.get('departure_time', '06:00 AM').strip()
    image_url = request.form.get('image_url', '').strip() or 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'

    if not title or not source_city or not dest_city or not price:
        flash('Vehicle title, source, destination, and fare are required.', 'danger')
        return redirect(url_for('agency.dashboard'))

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO transports (agency_id, title, transport_type, source_city, destination_city, price, duration_hours, features, departure_time, image_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (agency_id, title, transport_type, source_city, dest_city, float(price), float(duration_hours), features, departure_time, image_url))
    conn.commit()
    conn.close()

    flash(f'Transport route "{title}" added at fare ₹{float(price):,.2f}!', 'success')
    return redirect(url_for('agency.dashboard'))

# delete hotel
@agency_bp.route('/hotels/delete/<int:hotel_id>', methods=['POST'])
@agency_required
def delete_hotel(hotel_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM hotels WHERE id = %s AND agency_id = %s', (hotel_id, agency_id))
    conn.commit()
    conn.close()
    flash('Hotel property removed.', 'success')
    return redirect(url_for('agency.dashboard'))

# delete transport
@agency_bp.route('/transports/delete/<int:transport_id>', methods=['POST'])
@agency_required
def delete_transport(transport_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM transports WHERE id = %s AND agency_id = %s', (transport_id, agency_id))
    conn.commit()
    conn.close()
    flash('Transport service removed.', 'success')
    return redirect(url_for('agency.dashboard'))

# agency reviews & guest feedback
@agency_bp.route('/reviews')
@agency_required
def reviews():
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch reviews across all agency listings
    cursor.execute('''
        SELECT r.*, u.username, u.full_name,
               COALESCE(p.title, h.name, t.title) as item_title
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN packages p ON r.item_type = 'package' AND r.item_id = p.id AND p.agency_id = %s
        LEFT JOIN hotels h ON r.item_type = 'hotel' AND r.item_id = h.id AND h.agency_id = %s
        LEFT JOIN transports t ON r.item_type = 'transport' AND r.item_id = t.id AND t.agency_id = %s
        WHERE p.id IS NOT NULL OR h.id IS NOT NULL OR t.id IS NOT NULL
        ORDER BY r.created_at DESC
    ''', (agency_id, agency_id, agency_id))
    reviews_list = cursor.fetchall()
    conn.close()

    return render_template('agency/reviews.html', reviews=reviews_list)

# agency payouts & settlement ledger
@agency_bp.route('/payouts')
@agency_required
def payouts():
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    # gross earnings from confirmed bookings
    cursor.execute('''
        SELECT COALESCE(SUM(b.total_price), 0) as gross_sales
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE (p.agency_id = %s OR h.agency_id = %s OR t.agency_id = %s)
          AND b.status != 'Cancelled'
    ''', (agency_id, agency_id, agency_id))
    gross_sales = float(cursor.fetchone()['gross_sales'])

    commission_rate = Config.DEFAULT_COMMISSION_PERCENT / 100.0
    platform_fee = round(gross_sales * commission_rate, 2)
    net_earnings = round(gross_sales - platform_fee, 2)

    # total already requested, approved, or settled
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total_claimed
        FROM agency_payouts
        WHERE agency_id = %s AND status IN ('Approved', 'Processed', 'Pending')
    ''', (agency_id,))
    total_claimed = float(cursor.fetchone()['total_claimed'])
    available_balance = max(0.0, round(gross_sales - total_claimed, 2))

    # payout history
    cursor.execute('''
        SELECT * FROM agency_payouts
        WHERE agency_id = %s
        ORDER BY created_at DESC
    ''', (agency_id,))
    history = cursor.fetchall()
    conn.close()

    return render_template(
        'agency/payouts.html',
        gross_sales=gross_sales,
        platform_fee=platform_fee,
        net_earnings=net_earnings,
        available_balance=available_balance,
        history=history,
        commission_rate=int(Config.DEFAULT_COMMISSION_PERCENT)
    )

# submit payout settlement request with strict server-side balance validation
@agency_bp.route('/payouts/request', methods=['POST'])
@agency_required
def request_payout():
    agency_id = session['agency_id']
    try:
        req_amount = float(request.form.get('amount', 0.0))
        bank_info = request.form.get('bank_info', '').strip()
        
        if req_amount <= 0 or not bank_info:
            flash('Please enter a valid amount and complete bank account details.', 'danger')
            return redirect(url_for('agency.payouts'))
    except ValueError:
        flash('Invalid withdrawal amount.', 'danger')
        return redirect(url_for('agency.payouts'))

    conn = get_db_connection()
    cursor = conn.cursor()

    # Compute actual available balance on backend
    cursor.execute('''
        SELECT COALESCE(SUM(b.total_price), 0) as gross_sales
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE (p.agency_id = %s OR h.agency_id = %s OR t.agency_id = %s)
          AND b.status != 'Cancelled'
    ''', (agency_id, agency_id, agency_id))
    gross_sales = float(cursor.fetchone()['gross_sales'])

    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total_claimed
        FROM agency_payouts
        WHERE agency_id = %s AND status IN ('Approved', 'Processed', 'Pending')
    ''', (agency_id,))
    total_claimed = float(cursor.fetchone()['total_claimed'])
    available_balance = max(0.0, round(gross_sales - total_claimed, 2))

    if req_amount > available_balance:
        conn.close()
        flash(f'Requested amount (₹{req_amount:,.2f}) exceeds your available withdrawable earnings (₹{available_balance:,.2f}).', 'danger')
        return redirect(url_for('agency.payouts'))

    commission_rate = Config.DEFAULT_COMMISSION_PERCENT / 100.0
    commission_amount = round(req_amount * commission_rate, 2)
    net_payout = round(req_amount - commission_amount, 2)

    cursor.execute('''
        INSERT INTO agency_payouts (agency_id, amount, commission_amount, net_payout, bank_account_info, status)
        VALUES (%s, %s, %s, %s, %s, 'Pending')
    ''', (agency_id, req_amount, commission_amount, net_payout, bank_info))
    conn.commit()
    conn.close()

    flash(f'Settlement request for ₹{net_payout:,.2f} (Gross ₹{req_amount:,.2f}) submitted to Roamly Admin for processing.', 'success')
    return redirect(url_for('agency.payouts'))

# agency update booking status (confirm/cancel assigned booking)
@agency_bp.route('/bookings/status/<int:booking_id>', methods=['POST'])
@agency_required
def update_booking_status(booking_id):
    agency_id = session['agency_id']
    new_status = request.form.get('status', 'Confirmed').strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    # verify this booking belongs to this agency's packages/hotels/transports
    cursor.execute('''
        SELECT b.*, u.username
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE b.id = %s AND (p.agency_id = %s OR h.agency_id = %s OR t.agency_id = %s)
    ''', (booking_id, agency_id, agency_id, agency_id))
    booking = cursor.fetchone()

    if not booking:
        conn.close()
        flash('Booking record not found or permission denied.', 'danger')
        return redirect(url_for('agency.dashboard'))

    if new_status == 'Cancelled':
        if booking['status'] == 'Cancelled':
            conn.close()
            flash('This booking is already cancelled.', 'warning')
            return redirect(url_for('agency.dashboard'))

        total_refund = float(booking['total_price'])
        user_id = booking['user_id']

        cursor.execute("UPDATE bookings SET status = 'Cancelled', trip_status = 'Cancelled' WHERE id = %s", (booking_id,))

        # refund customer wallet
        cursor.execute('SELECT * FROM wallets WHERE user_id = %s', (user_id,))
        wallet = cursor.fetchone()
        current_bal = float(wallet['balance']) if wallet else 0.0
        new_bal = current_bal + total_refund

        if wallet:
            cursor.execute('UPDATE wallets SET balance = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s', (new_bal, user_id))
        else:
            cursor.execute('INSERT INTO wallets (user_id, balance, currency) VALUES (%s, %s, "INR")', (user_id, new_bal))

        cursor.execute('''
            INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
            VALUES (%s, %s, 'Refund', %s, %s)
        ''', (user_id, total_refund, f"Agency cancellation refund for booking #{booking_id:04d}", f"REFUND-AG-{booking_id}"))

        conn.commit()
        conn.close()

        create_notification(
            user_id=user_id,
            title="Booking Cancelled by Travel Agency Partner",
            message=f"Your booking #{booking_id:04d} was cancelled by {session.get('agency_name')}. A full refund of ₹{total_refund:,.2f} has been deposited to your Roamly Wallet.",
            notification_type='booking',
            link_url=url_for('payments.wallet')
        )
        flash(f'Booking #{booking_id:04d} cancelled and full refund of ₹{total_refund:,.2f} returned to customer.', 'warning')
    else:
        cursor.execute("UPDATE bookings SET status = %s WHERE id = %s", (new_status, booking_id))
        conn.commit()
        conn.close()
        flash(f'Booking #{booking_id:04d} marked as {new_status}.', 'success')

    return redirect(url_for('agency.dashboard'))
