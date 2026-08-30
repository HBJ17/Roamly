from flask import Blueprint, render_template, request, redirect, url_for, flash
from database.connection import get_db_connection

hotels_bp = Blueprint('hotels', __name__)

@hotels_bp.route('/hotels')
def hotels():
    query = request.args.get('q', '').strip()
    city = request.args.get('city', '').strip()
    min_price = request.args.get('min_price', '').strip()
    max_price = request.args.get('max_price', '').strip()
    sort_by = request.args.get('sort_by', 'rating_desc').strip()

    sql = '''
        SELECT h.*, a.name as agency_name, a.agency_type
        FROM hotels h
        LEFT JOIN agencies a ON h.agency_id = a.id
        WHERE 1=1
    '''
    params = []

    if query:
        sql += ' AND (h.name LIKE ? OR h.city LIKE ? OR h.description LIKE ?)'
        wildcard_q = f'%{query}%'
        params.extend([wildcard_q, wildcard_q, wildcard_q])

    if city:
        sql += ' AND h.city LIKE ?'
        params.append(f'%{city}%')

    if min_price and min_price.isdigit():
        sql += ' AND h.price_per_night >= ?'
        params.append(float(min_price))

    if max_price and max_price.isdigit():
        sql += ' AND h.price_per_night <= ?'
        params.append(float(max_price))

    if sort_by == 'price_asc':
        sql += ' ORDER BY h.price_per_night ASC'
    elif sort_by == 'price_desc':
        sql += ' ORDER BY h.price_per_night DESC'
    elif sort_by == 'rating_desc':
        sql += ' ORDER BY h.star_rating DESC'
    else:
        sql += ' ORDER BY h.star_rating DESC, h.price_per_night ASC'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    hotels_list = cursor.fetchall()

    # Get distinct cities for filter dropdown
    cursor.execute('SELECT DISTINCT city FROM hotels ORDER BY city ASC')
    cities = [row['city'] for row in cursor.fetchall()]
    conn.close()

    return render_template(
        'hotels.html',
        hotels=hotels_list,
        cities=cities,
        query=query,
        selected_city=city,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by
    )

@hotels_bp.route('/hotels/<int:hotel_id>')
def hotel_detail(hotel_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT h.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
        FROM hotels h
        LEFT JOIN agencies a ON h.agency_id = a.id
        WHERE h.id = ?
    ''', (hotel_id,))
    hotel = cursor.fetchone()
    conn.close()

    if not hotel:
        flash('Hotel listing not found.', 'danger')
        return redirect(url_for('hotels.hotels'))

    return render_template('hotel_detail.html', hotel=hotel)
