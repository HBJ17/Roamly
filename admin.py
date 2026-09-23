from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from config import Config
from database.connection import get_db_connection
from utils.decorators import admin_required
from utils.security import hash_password, verify_password, is_rate_limited, record_failed_attempt, clear_failed_attempts
from payments import create_notification

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def log_audit(actor_type, actor_id, actor_name, action, details, ip_address=''):
    """Record an entry into the immutable administrative audit log."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO audit_logs (actor_type, actor_id, actor_name, action, details, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (actor_type, actor_id, actor_name, action, details, ip_address))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Audit log error: {e}")

# admin login
@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'admin_id' in session:
        return redirect(url_for('admin.dashboard'))

    if request.method == 'POST':
        client_ip = request.remote_addr or 'unknown'
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        rate_key = f"admin:{client_ip}:{username.lower()}"
        limited, retry_sec = is_rate_limited(rate_key, max_attempts=5, window_seconds=300)
        if limited:
            flash(f'Too many failed attempts. Console locked for security. Please wait {retry_sec} seconds.', 'danger')
            return render_template('admin/login.html')

        if not username or not password:
            flash('Please enter both admin username and password.', 'danger')
            return render_template('admin/login.html')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM admins WHERE username = %s', (username,))
        admin = cursor.fetchone()
        conn.close()

        if admin and verify_password(password, admin['password']):
            clear_failed_attempts(rate_key)
            session.clear()
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            session['admin_role'] = admin['role']
            session['admin_name'] = admin['full_name']
            
            log_audit('admin', admin['id'], admin['full_name'], 'LOGIN', f"Admin logged in from {client_ip}", client_ip)
            flash(f'Welcome to the Roamly Admin Console, {admin["full_name"]}!', 'success')
            return redirect(url_for('admin.dashboard'))
        else:
            record_failed_attempt(rate_key)
            flash('Invalid administrator credentials.', 'danger')
            return render_template('admin/login.html')

    return render_template('admin/login.html')

# admin logout
@admin_bp.route('/logout')
def logout():
    admin_id = session.get('admin_id')
    admin_name = session.get('admin_name', 'Administrator')
    if admin_id:
        log_audit('admin', admin_id, admin_name, 'LOGOUT', 'Admin logged out')
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

    # insert agency with securely hashed password
    hashed_pwd = hash_password(password)
    cursor.execute('''
        INSERT INTO agencies (name, agency_type, username, password, email, phone, address, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'Active')
    ''', (name, agency_type, username, hashed_pwd, email, phone, address))
    new_agency_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit('admin', session.get('admin_id'), session.get('admin_name'), 'PROVISION_AGENCY', f"Provisioned agency '{name}' ({agency_type}, ID: {new_agency_id})")
    flash(f'Successfully provisioned credentials for agency partner "{name}" ({agency_type})!', 'success')
    return redirect(url_for('admin.agencies'))

# toggle agency status
@admin_bp.route('/agencies/toggle/<int:agency_id>', methods=['POST'])
@admin_required
def toggle_agency(agency_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT name, status FROM agencies WHERE id = %s', (agency_id,))
    agency = cursor.fetchone()

    if agency:
        new_status = 'Inactive' if agency['status'] == 'Active' else 'Active'
        cursor.execute('UPDATE agencies SET status = %s WHERE id = %s', (new_status, agency_id))
        conn.commit()
        log_audit('admin', session.get('admin_id'), session.get('admin_name'), 'TOGGLE_AGENCY_STATUS', f"Agency '{agency['name']}' status changed from {agency['status']} to {new_status}")
        flash(f"Agency partner '{agency['name']}' status updated to {new_status}.", 'success')
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
        log_audit('admin', session.get('admin_id'), session.get('admin_name'), 'DELETE_AGENCY', f"Deleted agency '{agency_name}' (ID: {agency_id}) and unlinked its listings")
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

# admin cancel booking with automatic wallet refund
@admin_bp.route('/bookings/cancel/<int:booking_id>', methods=['POST'])
@admin_required
def cancel_booking(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM bookings WHERE id = %s', (booking_id,))
    booking = cursor.fetchone()

    if not booking:
        conn.close()
        flash('Booking record not found.', 'danger')
        return redirect(url_for('admin.global_bookings'))

    if booking['status'] == 'Cancelled':
        conn.close()
        flash('This booking is already cancelled.', 'warning')
        return redirect(url_for('admin.global_bookings'))

    total_refund = float(booking['total_price'])
    user_id = booking['user_id']

    # update booking status
    cursor.execute("UPDATE bookings SET status = 'Cancelled', trip_status = 'Cancelled' WHERE id = %s", (booking_id,))

    # ensure user wallet exists & credit refund
    cursor.execute('SELECT * FROM wallets WHERE user_id = %s', (user_id,))
    wallet = cursor.fetchone()
    current_bal = float(wallet['balance']) if wallet else 0.0
    new_bal = current_bal + total_refund

    if wallet:
        cursor.execute('UPDATE wallets SET balance = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s', (new_bal, user_id))
    else:
        cursor.execute('INSERT INTO wallets (user_id, balance, currency) VALUES (%s, %s, "INR")', (user_id, new_bal))

    # insert ledger transaction
    cursor.execute('''
        INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
        VALUES (%s, %s, 'Refund', %s, %s)
    ''', (user_id, total_refund, f"Admin Refund for cancelled booking #ROAM-{booking['booking_type'][:3].upper()}-{booking_id:04d}", f"REFUND-ADM-{booking_id}"))

    conn.commit()
    conn.close()

    # notify customer
    create_notification(
        user_id=user_id,
        title="Booking Cancelled & Refunded by Admin",
        message=f"Booking #{booking_id:04d} was cancelled by Roamly Administration. A full refund of ₹{total_refund:,.2f} has been credited to your Roamly Wallet.",
        notification_type='booking',
        link_url=url_for('payments.wallet')
    )

    log_audit('admin', session.get('admin_id'), session.get('admin_name'), 'CANCEL_BOOKING', f"Admin force-cancelled booking #{booking_id} and issued ₹{total_refund:,.2f} wallet refund to user ID {user_id}")
    flash(f'Booking #{booking_id:04d} has been cancelled and ₹{total_refund:,.2f} successfully refunded to customer wallet.', 'success')
    return redirect(url_for('admin.global_bookings'))

# admin update booking status
@admin_bp.route('/bookings/status/<int:booking_id>', methods=['POST'])
@admin_required
def update_booking_status(booking_id):
    new_status = request.form.get('status', 'Confirmed').strip()
    trip_status = request.form.get('trip_status', 'Upcoming').strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE bookings SET status = %s, trip_status = %s WHERE id = %s', (new_status, trip_status, booking_id))
    conn.commit()
    conn.close()

    log_audit('admin', session.get('admin_id'), session.get('admin_name'), 'UPDATE_BOOKING_STATUS', f"Booking #{booking_id} status updated to {new_status} / trip: {trip_status}")
    flash(f'Booking #{booking_id:04d} status updated to {new_status}.', 'success')
    return redirect(url_for('admin.global_bookings'))

# admin commission & payout settlement console
@admin_bp.route('/commissions')
@admin_required
def commissions():
    conn = get_db_connection()
    cursor = conn.cursor()

    # compute platform financials
    cursor.execute("SELECT COALESCE(SUM(total_price), 0) as total_sales FROM bookings WHERE status != 'Cancelled'")
    total_sales = float(cursor.fetchone()['total_sales'])
    
    commission_rate = Config.DEFAULT_COMMISSION_PERCENT / 100.0
    platform_earnings = round(total_sales * commission_rate, 2)
    net_agency_pool = round(total_sales - platform_earnings, 2)

    # fetch all payout requests
    cursor.execute('''
        SELECT p.*, a.name as agency_name, a.agency_type, a.email as agency_email, a.phone as agency_phone
        FROM agency_payouts p
        JOIN agencies a ON p.agency_id = a.id
        ORDER BY p.created_at DESC
    ''')
    payouts = cursor.fetchall()
    conn.close()

    return render_template(
        'admin/commissions.html',
        total_sales=total_sales,
        platform_earnings=platform_earnings,
        net_agency_pool=net_agency_pool,
        commission_rate=int(Config.DEFAULT_COMMISSION_PERCENT),
        payouts=payouts
    )

# approve payout
@admin_bp.route('/payouts/approve/<int:payout_id>', methods=['POST'])
@admin_required
def approve_payout(payout_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE agency_payouts 
        SET status = 'Approved', processed_at = CURRENT_TIMESTAMP
        WHERE id = %s
    ''', (payout_id,))
    conn.commit()
    conn.close()
    
    log_audit('admin', session.get('admin_id'), session.get('admin_name'), 'APPROVE_PAYOUT', f"Approved agency payout #{payout_id}")
    flash(f'Agency payout #{payout_id} approved for bank transfer settlement.', 'success')
    return redirect(url_for('admin.commissions'))

# reject payout
@admin_bp.route('/payouts/reject/<int:payout_id>', methods=['POST'])
@admin_required
def reject_payout(payout_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE agency_payouts 
        SET status = 'Rejected', processed_at = CURRENT_TIMESTAMP
        WHERE id = %s
    ''', (payout_id,))
    conn.commit()
    conn.close()
    
    log_audit('admin', session.get('admin_id'), session.get('admin_name'), 'REJECT_PAYOUT', f"Rejected agency payout #{payout_id}")
    flash(f'Agency payout #{payout_id} marked as rejected.', 'warning')
    return redirect(url_for('admin.commissions'))

# audit logs console
@admin_bp.route('/audit-logs')
@admin_required
def audit_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100')
    logs = cursor.fetchall()
    conn.close()
    return render_template('admin/audit_logs.html', logs=logs)
