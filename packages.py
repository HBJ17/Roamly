from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import login_required
from reviews import get_item_reviews_summary

packages_bp = Blueprint('packages', __name__)

# packages catalog
@packages_bp.route('/packages')
def packages():
    query = request.args.get('q', '').strip()
    category = request.args.get('category', '').strip()
    min_price = request.args.get('min_price', '').strip()
    max_price = request.args.get('max_price', '').strip()
    sort_by = request.args.get('sort_by', 'popular').strip()

    sql = 'SELECT * FROM packages WHERE 1=1'
    params = []

    # search query
    if query:
        sql += ' AND (title LIKE %s OR destination LIKE %s OR description LIKE %s)'
        wildcard_q = f'%{query}%'
        params.extend([wildcard_q, wildcard_q, wildcard_q])

    # category filter
    if category:
        sql += ' AND category LIKE %s'
        params.append(f'%{category}%')

    # price filters
    if min_price and min_price.isdigit():
        sql += ' AND price >= %s'
        params.append(float(min_price))

    if max_price and max_price.isdigit():
        sql += ' AND price <= %s'
        params.append(float(max_price))

    # sort order
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

    # distinct categories
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

# package details
@packages_bp.route('/packages/<int:package_id>')
def package_detail(package_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch package
    cursor.execute('''
        SELECT p.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
        FROM packages p
        LEFT JOIN agencies a ON p.agency_id = a.id
        WHERE p.id = %s
    ''', (package_id,))
    pkg = cursor.fetchone()

    # check saved
    is_saved = False
    if session.get('user_id'):
        cursor.execute('SELECT id FROM saved_items WHERE user_id = %s AND item_type = "package" AND item_id = %s', (session['user_id'], package_id))
        is_saved = bool(cursor.fetchone())

    conn.close()

    if not pkg:
        flash('Package not found.', 'danger')
        return redirect(url_for('packages.packages'))

    compare_list = session.get('compare_packages', [])
    is_in_compare = package_id in compare_list
    reviews_data = get_item_reviews_summary('package', package_id)

    from utils.geo import get_coordinates_for_location
    map_lat, map_lng, map_title = get_coordinates_for_location(pkg['destination'])

    return render_template(
        'package_detail.html',
        package=pkg,
        is_in_compare=is_in_compare,
        reviews_data=reviews_data,
        is_saved=is_saved,
        map_lat=map_lat,
        map_lng=map_lng,
        map_title=map_title
    )

# book package
@packages_bp.route('/book/<int:package_id>', methods=['POST'])
@login_required
def book_package(package_id):
    travel_date = request.form.get('travel_date')
    num_travelers = request.form.get('num_travelers', '1')

    if not travel_date:
        flash('Please select a valid travel date.', 'danger')
        return redirect(url_for('packages.package_detail', package_id=package_id))

    try:
        num_travelers = int(num_travelers)
        if num_travelers < 1:
            num_travelers = 1
    except ValueError:
        num_travelers = 1

    return redirect(url_for(
        'payments.checkout',
        booking_type='Package',
        item_id=package_id,
        travel_date=travel_date,
        num_travelers=num_travelers
    ))

# toggle comparison
@packages_bp.route('/compare/toggle/<int:package_id>', methods=['POST'])
def compare_toggle(package_id):
    compare_list = session.get('compare_packages', [])

    if package_id in compare_list:
        compare_list.remove(package_id)
        flash('Package removed from comparison.', 'info')
    else:
        if len(compare_list) >= 3:
            flash('You can compare a maximum of 3 packages at a time.', 'warning')
        else:
            compare_list.append(package_id)
            flash('Package added to comparison.', 'success')

    session['compare_packages'] = compare_list
    return redirect(request.referrer or url_for('packages.packages'))

# view comparison
@packages_bp.route('/compare')
def compare():
    compare_list = session.get('compare_packages', [])

    if not compare_list:
        return render_template('compare.html', packages=[])

    # query comparison
    placeholders = ','.join(['%s'] * len(compare_list))
    sql = f'SELECT * FROM packages WHERE id IN ({placeholders})'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, tuple(compare_list))
    packages_data = cursor.fetchall()
    conn.close()

    return render_template('compare.html', packages=packages_data)

# clear comparison
@packages_bp.route('/compare/clear')
def compare_clear():
    session.pop('compare_packages', None)
    flash('Comparison list cleared.', 'info')
    return redirect(url_for('packages.packages'))
