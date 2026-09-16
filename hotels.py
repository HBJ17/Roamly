from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from database.connection import get_db_connection
from reviews import get_item_reviews_summary

hotels_bp = Blueprint('hotels', __name__)

# hotels catalog
@hotels_bp.route('/hotels')
def hotels():
    query = request.args.get('q', '').strip()
    city = request.args.get('city', '').strip()
    min_price = request.args.get('min_price', '').strip()
    max_price = request.args.get('max_price', '').strip()
    sort_by = request.args.get('sort_by', 'rating_desc').strip()

    sql = '''
        SELECT h.*, a.name as agency_name 
        FROM hotels h 
        LEFT JOIN agencies a ON h.agency_id = a.id 
        WHERE 1=1
    '''
    params = []

    # search query
    if query:
        sql += ' AND (h.name LIKE %s OR h.city LIKE %s OR h.amenities LIKE %s)'
        wildcard_q = f'%{query}%'
        params.extend([wildcard_q, wildcard_q, wildcard_q])

    # city filter
    if city:
        sql += ' AND h.city = %s'
        params.append(city)

    # price filters
    if min_price and min_price.isdigit():
        sql += ' AND h.price_per_night >= %s'
        params.append(float(min_price))

    if max_price and max_price.isdigit():
        sql += ' AND h.price_per_night <= %s'
        params.append(float(max_price))

    # sort order
    if sort_by == 'price_asc':
        sql += ' ORDER BY h.price_per_night ASC'
    elif sort_by == 'price_desc':
        sql += ' ORDER BY h.price_per_night DESC'
    else:
        sql += ' ORDER BY h.star_rating DESC, h.price_per_night ASC'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    hotels_list = cursor.fetchall()

    # distinct cities
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

# hotel details
@hotels_bp.route('/hotels/<int:hotel_id>')
def hotel_detail(hotel_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch hotel
    cursor.execute('''
        SELECT h.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
        FROM hotels h
        LEFT JOIN agencies a ON h.agency_id = a.id
        WHERE h.id = %s
    ''', (hotel_id,))
    hotel = cursor.fetchone()

    # check saved
    is_saved = False
    if session.get('user_id'):
        cursor.execute('SELECT id FROM saved_items WHERE user_id = %s AND item_type = "hotel" AND item_id = %s', (session['user_id'], hotel_id))
        is_saved = bool(cursor.fetchone())

    conn.close()

    if not hotel:
        flash('Hotel not found.', 'danger')
        return redirect(url_for('hotels.hotels'))

    reviews_data = get_item_reviews_summary('hotel', hotel_id)

    from utils.geo import get_coordinates_for_location
    map_lat, map_lng, map_title = get_coordinates_for_location(hotel['city'])

    return render_template(
        'hotel_detail.html',
        hotel=hotel,
        reviews_data=reviews_data,
        is_saved=is_saved,
        map_lat=map_lat,
        map_lng=map_lng,
        map_title=map_title
    )
