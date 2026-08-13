from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import login_required

packages_bp = Blueprint('packages', __name__)

@packages_bp.route('/packages')
def packages():
    query = request.args.get('q', '').strip()
    category = request.args.get('category', '').strip()
    min_price = request.args.get('min_price', '').strip()
    max_price = request.args.get('max_price', '').strip()
    sort_by = request.args.get('sort_by', 'popular').strip()

    sql = 'SELECT * FROM packages WHERE 1=1'
    params = []

    if query:
        sql += ' AND (title LIKE ? OR destination LIKE ? OR description LIKE ?)'
        wildcard_q = f'%{query}%'
        params.extend([wildcard_q, wildcard_q, wildcard_q])

    if category:
        sql += ' AND category LIKE ?'
        params.append(f'%{category}%')

    if min_price and min_price.isdigit():
        sql += ' AND price >= ?'
        params.append(float(min_price))

    if max_price and max_price.isdigit():
        sql += ' AND price <= ?'
        params.append(float(max_price))

    if sort_by == 'price_asc':
        sql += ' ORDER BY price ASC'
    elif sort_by == 'price_desc':
        sql += ' ORDER BY price DESC'
    elif sort_by == 'rating_desc':
        sql += ' ORDER BY rating DESC'
    elif sort_by == 'duration_asc':
        sql += ' ORDER BY duration_days ASC'
    else:
        sql += ' ORDER BY rating DESC, price ASC'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    packages_list = cursor.fetchall()

    # Get distinct categories for filter dropdown
    cursor.execute('SELECT DISTINCT category FROM packages')
    categories = [row['category'] for row in cursor.fetchall()]

    conn.close()

    compare_list = session.get('compare_packages', [])

    return render_template(
        'packages.html',
        packages=packages_list,
        categories=categories,
        query=query,
        selected_category=category,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        compare_list=compare_list
    )

@packages_bp.route('/packages/<int:package_id>')
def package_detail(package_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM packages WHERE id = ?', (package_id,))
    pkg = cursor.fetchone()
    conn.close()

    if not pkg:
        flash('Package not found.', 'danger')
        return redirect(url_for('packages'))

    compare_list = session.get('compare_packages', [])
    is_in_compare = package_id in compare_list

    return render_template('package_detail.html', package=pkg, is_in_compare=is_in_compare)

@packages_bp.route('/book/<int:package_id>', methods=['POST'])
@login_required
def book_package(package_id):
    user_id = session['user_id']
    travel_date = request.form.get('travel_date')
    num_travelers = request.form.get('num_travelers', '1')

    if not travel_date:
        flash('Please select a valid travel date.', 'danger')
        return redirect(url_for('package_detail', package_id=package_id))

    try:
        num_travelers = int(num_travelers)
        if num_travelers < 1:
            num_travelers = 1
    except ValueError:
        num_travelers = 1

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM packages WHERE id = ?', (package_id,))
    pkg = cursor.fetchone()

    if not pkg:
        conn.close()
        flash('Package not found.', 'danger')
        return redirect(url_for('packages'))

    total_price = pkg['price'] * num_travelers

    cursor.execute('''
        INSERT INTO bookings (user_id, package_id, travel_date, num_travelers, total_price, status)
        VALUES (?, ?, ?, ?, ?, 'Confirmed')
    ''', (user_id, package_id, travel_date, num_travelers, total_price))
    conn.commit()
    conn.close()

    flash(f'Successfully booked "{pkg["title"]}" for {num_travelers} traveler(s)!', 'success')
    return redirect(url_for('dashboard', tab='bookings'))

@packages_bp.route('/compare/toggle/<int:package_id>', methods=['POST', 'GET'])
def compare_toggle(package_id):
    compare_list = session.get('compare_packages', [])

    if package_id in compare_list:
        compare_list.remove(package_id)
        flash('Package removed from comparison list.', 'info')
    else:
        if len(compare_list) >= 3:
            flash('You can compare up to 3 packages at a time. Removed the oldest selection.', 'warning')
            compare_list.pop(0)
        compare_list.append(package_id)
        flash('Package added to comparison list!', 'success')

    session['compare_packages'] = compare_list
    session.modified = True

    referrer = request.referrer or url_for('packages')
    return redirect(referrer)

@packages_bp.route('/compare/clear', methods=['POST', 'GET'])
def compare_clear():
    session['compare_packages'] = []
    session.modified = True
    flash('Comparison list cleared.', 'info')
    return redirect(url_for('packages'))

@packages_bp.route('/compare')
def compare():
    compare_ids = session.get('compare_packages', [])

    if not compare_ids:
        return render_template('compare.html', packages=[])

    conn = get_db_connection()
    cursor = conn.cursor()
    
    placeholders = ','.join(['?'] * len(compare_ids))
    cursor.execute(f'SELECT * FROM packages WHERE id IN ({placeholders})', compare_ids)
    packages_list = cursor.fetchall()
    conn.close()

    return render_template('compare.html', packages=packages_list)
