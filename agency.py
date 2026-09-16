from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import agency_required

agency_bp = Blueprint('agency', __name__, url_prefix='/agency')

# agency login
@agency_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'agency_id' in session:
        return redirect(url_for('agency.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        if not username or not password:
            flash('Please enter both agency username and password.', 'danger')
            return render_template('agency/login.html')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM agencies WHERE username = %s AND password = %s', (username, password))
        agency = cursor.fetchone()
        conn.close()

        if agency:
            if agency['status'] != 'Active':
                flash('Your agency account is currently suspended. Please contact Roamly central administration.', 'danger')
                return render_template('agency/login.html')

            session['agency_id'] = agency['id']
            session['agency_name'] = agency['name']
            session['agency_type'] = agency['agency_type']
            session['agency_username'] = agency['username']
            flash(f'Welcome back, {agency["name"]}!', 'success')
            return redirect(url_for('agency.dashboard'))
        else:
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
        bookings=agency_bookings[:6],
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

# edit package
@agency_bp.route('/packages/edit/<int:package_id>', methods=['GET', 'POST'])
@agency_required
def edit_package(package_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM packages WHERE id = %s AND (agency_id = %s OR agency_id IS NULL)', (package_id, agency_id))
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
                highlights = %s, included_amenities = %s, image_url = %s,
                agency_id = %s
            WHERE id = %s
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
            agency_id,
            package_id
        ))
        conn.commit()
        conn.close()

        flash(f'Package "{title}" and pricing updated to ₹{price_val:,.2f}!', 'success')
        return redirect(url_for('agency.manage_packages'))

    conn.close()
    return render_template('agency/package_form.html', is_edit=True, package=pkg)

# delete package
@agency_bp.route('/packages/delete/<int:package_id>', methods=['POST'])
@agency_required
def delete_package(package_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT title FROM packages WHERE id = %s AND (agency_id = %s OR agency_id IS NULL)', (package_id, agency_id))
    pkg = cursor.fetchone()

    if pkg:
        pkg_title = pkg['title']
        cursor.execute('DELETE FROM packages WHERE id = %s', (package_id,))
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

    commission_rate = 0.10
    platform_fee = round(gross_sales * commission_rate, 2)
    net_earnings = round(gross_sales - platform_fee, 2)

    # total already withdrawn or approved
    cursor.execute('''
        SELECT COALESCE(SUM(net_payout), 0) as total_settled
        FROM agency_payouts
        WHERE agency_id = %s AND status IN ('Approved', 'Processed')
    ''', (agency_id,))
    total_settled = float(cursor.fetchone()['total_settled'])
    available_balance = max(0.0, round(net_earnings - total_settled, 2))

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
        commission_rate=int(commission_rate * 100)
    )

# submit payout settlement request
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

    commission_amount = round(req_amount * 0.10, 2)
    net_payout = round(req_amount - commission_amount, 2)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO agency_payouts (agency_id, amount, commission_amount, net_payout, bank_account_info, status)
        VALUES (%s, %s, %s, %s, %s, 'Pending')
    ''', (agency_id, req_amount, commission_amount, net_payout, bank_info))
    conn.commit()
    conn.close()

    flash(f'Settlement request for ₹{net_payout:,.2f} submitted to Roamly Admin for processing.', 'success')
    return redirect(url_for('agency.payouts'))
