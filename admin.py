from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# admin login
@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'admin_id' in session:
        return redirect(url_for('admin.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        if not username or not password:
            flash('Please enter both admin username and password.', 'danger')
            return render_template('admin/login.html')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM admins WHERE username = %s AND password = %s', (username, password))
        admin = cursor.fetchone()
        conn.close()

        if admin:
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            session['admin_role'] = admin['role']
            session['admin_name'] = admin['full_name']
            flash(f'Welcome to the Roamly Admin Console, {admin["full_name"]}!', 'success')
            return redirect(url_for('admin.dashboard'))
        else:
            flash('Invalid administrator credentials.', 'danger')
            return render_template('admin/login.html')

    return render_template('admin/login.html')

# admin logout
@admin_bp.route('/logout')
def logout():
    session.pop('admin_id', None)
    session.pop('admin_username', None)
    session.pop('admin_role', None)
    session.pop('admin_name', None)
    flash('Administrator session terminated successfully.', 'info')
    return redirect(url_for('admin.login'))

# admin dashboard
@admin_bp.route('/dashboard')
@admin_required
def dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()

    # revenue metrics
    cursor.execute("SELECT COALESCE(SUM(total_price), 0) as total_rev FROM bookings WHERE status != 'Cancelled'")
    total_revenue = float(cursor.fetchone()['total_rev'])

    # booking counts
    cursor.execute("SELECT COUNT(*) as total_bk FROM bookings")
    total_bookings = cursor.fetchone()['total_bk']

    # user counts
    cursor.execute("SELECT COUNT(*) as total_users FROM users")
    total_users = cursor.fetchone()['total_users']

    # agency counts
    cursor.execute("SELECT COUNT(*) as total_agencies FROM agencies")
    total_agencies = cursor.fetchone()['total_agencies']

    # inventory counts
    cursor.execute("SELECT COUNT(*) as total_pkgs FROM packages")
    total_packages = cursor.fetchone()['total_pkgs']

    cursor.execute("SELECT COUNT(*) as total_htls FROM hotels")
    total_hotels = cursor.fetchone()['total_htls']

    cursor.execute("SELECT COUNT(*) as total_trns FROM transports")
    total_transports = cursor.fetchone()['total_trns']

    # category breakdown
    cursor.execute('''
        SELECT 
            booking_type,
            COUNT(*) as count,
            COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN total_price ELSE 0 END), 0) as revenue
        FROM bookings
        GROUP BY booking_type
    ''')
    category_stats_raw = cursor.fetchall()
    
    category_metrics = {
        'Package': {'count': 0, 'revenue': 0.0, 'pct_rev': 0, 'pct_cnt': 0},
        'Hotel': {'count': 0, 'revenue': 0.0, 'pct_rev': 0, 'pct_cnt': 0},
        'Transport': {'count': 0, 'revenue': 0.0, 'pct_rev': 0, 'pct_cnt': 0}
    }
    
    for row in category_stats_raw:
        b_type = row['booking_type']
        if b_type in category_metrics:
            category_metrics[b_type]['count'] = row['count']
            category_metrics[b_type]['revenue'] = float(row['revenue'])

    if total_revenue > 0:
        for k in category_metrics:
            category_metrics[k]['pct_rev'] = round((category_metrics[k]['revenue'] / total_revenue) * 100, 1)

    if total_bookings > 0:
        for k in category_metrics:
            category_metrics[k]['pct_cnt'] = round((category_metrics[k]['count'] / total_bookings) * 100, 1)

    # status breakdown
    cursor.execute('''
        SELECT status, COUNT(*) as count
        FROM bookings
        GROUP BY status
    ''')
    status_counts_raw = cursor.fetchall()
    status_counts = {'Confirmed': 0, 'Modified': 0, 'Cancelled': 0}
    for row in status_counts_raw:
        st = row['status']
        if st in status_counts:
            status_counts[st] = row['count']

    # top destinations
    cursor.execute('''
        SELECT 
            COALESCE(p.destination, h.city, t.destination_city) as destination_name,
            COUNT(b.id) as booking_count,
            COALESCE(SUM(CASE WHEN b.status != 'Cancelled' THEN b.total_price ELSE 0 END), 0) as destination_revenue
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE COALESCE(p.destination, h.city, t.destination_city) IS NOT NULL
        GROUP BY destination_name
        ORDER BY destination_revenue DESC, booking_count DESC
        LIMIT 6
    ''')
    top_destinations = cursor.fetchall()

    # recent bookings
    cursor.execute('''
        SELECT 
            b.*,
            u.username,
            u.email as user_email,
            COALESCE(p.title, h.name, t.title) as item_title
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        ORDER BY b.created_at DESC
        LIMIT 8
    ''')
    recent_bookings = cursor.fetchall()

    conn.close()

    return render_template(
        'admin/dashboard.html',
        total_revenue=total_revenue,
        total_bookings=total_bookings,
        total_users=total_users,
        total_agencies=total_agencies,
        total_packages=total_packages,
        total_hotels=total_hotels,
        total_transports=total_transports,
        category_metrics=category_metrics,
        status_counts=status_counts,
        top_destinations=top_destinations,
        recent_bookings=recent_bookings,
        admin_name=session.get('admin_name', 'Super Administrator')
    )

# manage agencies
@admin_bp.route('/agencies')
@admin_required
def agencies():
    agency_type = request.args.get('type', '').strip()
    status = request.args.get('status', '').strip()
    query = request.args.get('q', '').strip()

    sql = '''
        SELECT 
            a.*,
            (SELECT COUNT(*) FROM packages WHERE agency_id = a.id) as package_count,
            (SELECT COUNT(*) FROM hotels WHERE agency_id = a.id) as hotel_count,
            (SELECT COUNT(*) FROM transports WHERE agency_id = a.id) as transport_count
        FROM agencies a
        WHERE 1=1
    '''
    params = []

    # search query
    if query:
        sql += ' AND (a.name LIKE %s OR a.username LIKE %s OR a.email LIKE %s OR a.address LIKE %s)'
        wildcard_q = f'%{query}%'
        params.extend([wildcard_q, wildcard_q, wildcard_q, wildcard_q])

    # type filter
    if agency_type:
        sql += ' AND a.agency_type = %s'
        params.append(agency_type)

    # status filter
    if status:
        sql += ' AND a.status = %s'
        params.append(status)

    sql += ' ORDER BY a.created_at DESC'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    agencies_list = cursor.fetchall()
    conn.close()

    return render_template(
        'admin/agencies.html',
        agencies=agencies_list,
        query=query,
        selected_type=agency_type,
        selected_status=status
    )

# add agency
@admin_bp.route('/agencies/add', methods=['POST'])
@admin_required
def add_agency():
    name = request.form.get('name', '').strip()
    agency_type = request.form.get('agency_type', 'Travel Brand').strip()
    username = request.form.get('username', '').strip()
    password = request.form.get('password', '').strip()
    email = request.form.get('email', '').strip()
    phone = request.form.get('phone', '').strip()
    address = request.form.get('address', '').strip()

    if not name or not username or not password or not email:
        flash('Agency name, username, password, and email are required fields.', 'danger')
        return redirect(url_for('admin.agencies'))

    conn = get_db_connection()
    cursor = conn.cursor()

    # check duplicate
    cursor.execute('SELECT id FROM agencies WHERE username = %s OR email = %s', (username, email))
    if cursor.fetchone():
        conn.close()
        flash('An agency with this username or email already exists.', 'danger')
        return redirect(url_for('admin.agencies'))

    # insert agency
    cursor.execute('''
        INSERT INTO agencies (name, agency_type, username, password, email, phone, address, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'Active')
    ''', (name, agency_type, username, password, email, phone, address))
    conn.commit()
    conn.close()

    flash(f'Successfully provisioned credentials for agency partner "{name}" ({agency_type})!', 'success')
    return redirect(url_for('admin.agencies'))

# toggle agency status
@admin_bp.route('/agencies/toggle/<int:agency_id>', methods=['POST'])
@admin_required
def toggle_agency(agency_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT status FROM agencies WHERE id = %s', (agency_id,))
    agency = cursor.fetchone()

    if agency:
        new_status = 'Inactive' if agency['status'] == 'Active' else 'Active'
        cursor.execute('UPDATE agencies SET status = %s WHERE id = %s', (new_status, agency_id))
        conn.commit()
        flash(f'Agency status updated to {new_status}.', 'success')
    else:
        flash('Agency not found.', 'danger')

    conn.close()
    return redirect(url_for('admin.agencies'))

# delete agency
@admin_bp.route('/agencies/delete/<int:agency_id>', methods=['POST'])
@admin_required
def delete_agency(agency_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT name FROM agencies WHERE id = %s', (agency_id,))
    agency = cursor.fetchone()

    if agency:
        agency_name = agency['name']
        cursor.execute('DELETE FROM agencies WHERE id = %s', (agency_id,))
        # disassociate items
        cursor.execute('UPDATE packages SET agency_id = NULL WHERE agency_id = %s', (agency_id,))
        cursor.execute('UPDATE hotels SET agency_id = NULL WHERE agency_id = %s', (agency_id,))
        cursor.execute('UPDATE transports SET agency_id = NULL WHERE agency_id = %s', (agency_id,))
        conn.commit()
        flash(f'Agency partner "{agency_name}" deleted successfully.', 'success')
    else:
        flash('Agency not found.', 'danger')

    conn.close()
    return redirect(url_for('admin.agencies'))

# global bookings list
@admin_bp.route('/bookings')
@admin_required
def global_bookings():
    booking_type = request.args.get('type', '').strip()
    status = request.args.get('status', '').strip()
    query = request.args.get('q', '').strip()

    sql = '''
        SELECT 
            b.*,
            u.username,
            u.email as user_email,
            u.full_name as user_full_name,
            COALESCE(p.title, h.name, t.title) as item_title,
            COALESCE(p.destination, h.city, CONCAT(t.source_city, ' to ', t.destination_city)) as item_location
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE 1=1
    '''
    params = []

    # search filter
    if query:
        sql += ' AND (u.username LIKE %s OR u.email LIKE %s OR p.title LIKE %s OR h.name LIKE %s OR t.title LIKE %s)'
        wildcard_q = f'%{query}%'
        params.extend([wildcard_q, wildcard_q, wildcard_q, wildcard_q, wildcard_q])

    # type filter
    if booking_type:
        sql += ' AND b.booking_type = %s'
        params.append(booking_type)

    # status filter
    if status:
        sql += ' AND b.status = %s'
        params.append(status)

    sql += ' ORDER BY b.created_at DESC'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    all_bookings = cursor.fetchall()
    conn.close()

    return render_template(
        'admin/bookings.html',
        bookings=all_bookings,
        selected_type=booking_type,
        selected_status=status,
        query=query
    )
