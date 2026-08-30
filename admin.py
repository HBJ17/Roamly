from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

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
        cursor.execute('SELECT * FROM admins WHERE username = ? AND password = ?', (username, password))
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

@admin_bp.route('/logout')
def logout():
    session.pop('admin_id', None)
    session.pop('admin_username', None)
    session.pop('admin_role', None)
    session.pop('admin_name', None)
    flash('Administrator session terminated successfully.', 'info')
    return redirect(url_for('admin.login'))

@admin_bp.route('/dashboard')
@admin_required
def dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Total Platform Revenue (Active bookings only)
    cursor.execute("SELECT COALESCE(SUM(total_price), 0) as total_rev FROM bookings WHERE status != 'Cancelled'")
    total_revenue = cursor.fetchone()['total_rev']

    # 2. Total Bookings Count
    cursor.execute("SELECT COUNT(*) as total_bk FROM bookings")
    total_bookings = cursor.fetchone()['total_bk']

    # 3. Active Users Count
    cursor.execute("SELECT COUNT(*) as total_users FROM users")
    total_users = cursor.fetchone()['total_users']

    # 4. Registered Agencies Count
    cursor.execute("SELECT COUNT(*) as total_agencies FROM agencies")
    total_agencies = cursor.fetchone()['total_agencies']

    # 5. Inventory Counts
    cursor.execute("SELECT COUNT(*) as total_pkgs FROM packages")
    total_packages = cursor.fetchone()['total_pkgs']

    cursor.execute("SELECT COUNT(*) as total_htls FROM hotels")
    total_hotels = cursor.fetchone()['total_htls']

    cursor.execute("SELECT COUNT(*) as total_trns FROM transports")
    total_transports = cursor.fetchone()['total_trns']

    # 6. Breakdown by Booking Category (Revenue & Count)
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

    # 7. Booking Status Breakdown
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

    # 8. Top Destinations Analytics
    cursor.execute('''
        SELECT 
            COALESCE(p.destination, h.city, t.destination_city) as destination_name,
            COUNT(b.id) as booking_count,
            COALESCE(SUM(CASE WHEN b.status != 'Cancelled' THEN b.total_price ELSE 0 END), 0) as destination_revenue
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE destination_name IS NOT NULL
        GROUP BY destination_name
        ORDER BY destination_revenue DESC, booking_count DESC
        LIMIT 6
    ''')
    top_destinations = cursor.fetchall()

    # 9. Recent Platform Activity Stream (Last 8 bookings)
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
