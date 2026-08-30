from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import agency_required

agency_bp = Blueprint('agency', __name__, url_prefix='/agency')

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
        cursor.execute('SELECT * FROM agencies WHERE username = ? AND password = ?', (username, password))
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

@agency_bp.route('/logout')
def logout():
    session.pop('agency_id', None)
    session.pop('agency_name', None)
    session.pop('agency_type', None)
    session.pop('agency_username', None)
    flash('Agency partner session terminated successfully.', 'info')
    return redirect(url_for('agency.login'))

@agency_bp.route('/dashboard')
@agency_required
def dashboard():
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    # Agency profile info
    cursor.execute('SELECT * FROM agencies WHERE id = ?', (agency_id,))
    agency = cursor.fetchone()

    # Inventory counts
    cursor.execute('SELECT COUNT(*) as cnt FROM packages WHERE agency_id = ?', (agency_id,))
    pkg_count = cursor.fetchone()['cnt']

    cursor.execute('SELECT COUNT(*) as cnt FROM hotels WHERE agency_id = ?', (agency_id,))
    hotel_count = cursor.fetchone()['cnt']

    cursor.execute('SELECT COUNT(*) as cnt FROM transports WHERE agency_id = ?', (agency_id,))
    transport_count = cursor.fetchone()['cnt']

    # Bookings and revenue for items belonging to this agency
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
        WHERE (p.agency_id = ? OR h.agency_id = ? OR t.agency_id = ?)
        ORDER BY b.created_at DESC
    ''', (agency_id, agency_id, agency_id))
    agency_bookings = cursor.fetchall()

    total_earnings = sum(float(b['total_price']) for b in agency_bookings if b['status'] != 'Cancelled')
    total_orders = len(agency_bookings)

    # Fetch this agency's inventory items
    cursor.execute('SELECT * FROM packages WHERE agency_id = ? ORDER BY id DESC', (agency_id,))
    my_packages = cursor.fetchall()

    cursor.execute('SELECT * FROM hotels WHERE agency_id = ? ORDER BY id DESC', (agency_id,))
    my_hotels = cursor.fetchall()

    cursor.execute('SELECT * FROM transports WHERE agency_id = ? ORDER BY id DESC', (agency_id,))
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

# --- Package Management (CRUD & Pricing) ---
@agency_bp.route('/packages')
@agency_required
def manage_packages():
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM packages WHERE agency_id = ? ORDER BY id DESC', (agency_id,))
    packages_list = cursor.fetchall()
    conn.close()
    return render_template('agency/packages.html', packages=packages_list)

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

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO packages (
                title, destination, category, price, duration_days,
                duration_nights, description, highlights, included_amenities,
                rating, image_url, agency_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 4.8, ?, ?)
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

@agency_bp.route('/packages/edit/<int:package_id>', methods=['GET', 'POST'])
@agency_required
def edit_package(package_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM packages WHERE id = ? AND (agency_id = ? OR agency_id IS NULL)', (package_id, agency_id))
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

        cursor.execute('''
            UPDATE packages
            SET title = ?, destination = ?, category = ?, price = ?,
                duration_days = ?, duration_nights = ?, description = ?,
                highlights = ?, included_amenities = ?, image_url = ?,
                agency_id = ?
            WHERE id = ?
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

@agency_bp.route('/packages/delete/<int:package_id>', methods=['POST'])
@agency_required
def delete_package(package_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT title FROM packages WHERE id = ? AND (agency_id = ? OR agency_id IS NULL)', (package_id, agency_id))
    pkg = cursor.fetchone()

    if pkg:
        pkg_title = pkg['title']
        cursor.execute('DELETE FROM packages WHERE id = ?', (package_id,))
        conn.commit()
        flash(f'Package "{pkg_title}" has been deleted from your catalog.', 'success')
    else:
        flash('Package not found or unauthorized.', 'danger')

    conn.close()
    return redirect(url_for('agency.manage_packages'))

# --- Hotel & Transport Add/Delete for Hotel Owners & Cab Services ---
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
        VALUES (?, ?, ?, ?, 4.7, ?, ?, ?, ?, ?)
    ''', (agency_id, name, city, address, float(price), room_types, amenities, description, image_url))
    conn.commit()
    conn.close()

    flash(f'Hotel property "{name}" registered at ₹{float(price):,.2f} / night!', 'success')
    return redirect(url_for('agency.dashboard'))

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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (agency_id, title, transport_type, source_city, dest_city, float(price), float(duration_hours), features, departure_time, image_url))
    conn.commit()
    conn.close()

    flash(f'Transport route "{title}" added at fare ₹{float(price):,.2f}!', 'success')
    return redirect(url_for('agency.dashboard'))

@agency_bp.route('/hotels/delete/<int:hotel_id>', methods=['POST'])
@agency_required
def delete_hotel(hotel_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM hotels WHERE id = ? AND agency_id = ?', (hotel_id, agency_id))
    conn.commit()
    conn.close()
    flash('Hotel property removed.', 'success')
    return redirect(url_for('agency.dashboard'))

@agency_bp.route('/transports/delete/<int:transport_id>', methods=['POST'])
@agency_required
def delete_transport(transport_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM transports WHERE id = ? AND agency_id = ?', (transport_id, agency_id))
    conn.commit()
    conn.close()
    flash('Transport service removed.', 'success')
    return redirect(url_for('agency.dashboard'))
