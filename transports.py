from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from database.connection import get_db_connection
from reviews import get_item_reviews_summary

transports_bp = Blueprint('transports', __name__)

# transports catalog (Standalone Local Cabs & Rentals + RedBus/MMT-style Intercity Transit)
@transports_bp.route('/transports')
def transports():
    query = request.args.get('q', '').strip()
    service_mode = request.args.get('mode', 'all').strip() # 'all', 'cabs', 'intercity'
    transport_type = request.args.get('type', '').strip()
    city = request.args.get('city', '').strip()
    source_city = request.args.get('source', '').strip()
    destination_city = request.args.get('destination', '').strip()
    ac_type = request.args.get('ac_type', '').strip()
    min_capacity = request.args.get('capacity', '').strip()
    max_price = request.args.get('max_price', '').strip()
    sort_by = request.args.get('sort_by', 'price_asc').strip()

    sql = '''
        SELECT t.*, a.name as agency_name 
        FROM transports t 
        LEFT JOIN agencies a ON t.agency_id = a.id 
        WHERE 1=1
    '''
    params = []

    # search query
    if query:
        sql += ' AND (t.title LIKE %s OR t.features LIKE %s OR t.source_city LIKE %s OR t.destination_city LIKE %s)'
        wildcard_q = f'%{query}%'
        params.extend([wildcard_q, wildcard_q, wildcard_q, wildcard_q])

    # service mode filter
    if service_mode == 'cabs':
        sql += " AND (t.transport_type IN ('Taxi', 'Rental', 'Cab') OR t.service_type IN ('Taxi Service', 'Self-Drive Rental'))"
    elif service_mode == 'intercity':
        sql += " AND (t.transport_type IN ('Bus', 'Train', 'Flight') OR t.service_type IN ('Intercity Bus', 'Express Train', 'Regional Flight'))"

    # transport type filter
    if transport_type:
        sql += ' AND t.transport_type = %s'
        params.append(transport_type)

    # local city filter (for local cabs)
    if city:
        sql += ' AND (t.source_city = %s OR t.destination_city LIKE %s)'
        params.extend([city, f'%{city}%'])

    # origin filter (for intercity)
    if source_city:
        sql += ' AND t.source_city = %s'
        params.append(source_city)

    # destination filter (for intercity)
    if destination_city:
        sql += ' AND (t.destination_city = %s OR t.destination_city LIKE %s)'
        params.extend([destination_city, f'%{destination_city}%'])

    # AC filter
    if ac_type:
        if ac_type == 'AC':
            sql += " AND (t.ac_type = 'AC' OR t.ac_type = 'Both')"
        elif ac_type == 'Non-AC':
            sql += " AND (t.ac_type = 'Non-AC' OR t.ac_type = 'Both')"

    # Capacity filter
    if min_capacity and min_capacity.isdigit():
        sql += ' AND t.seating_capacity >= %s'
        params.append(int(min_capacity))

    # price filter
    if max_price and max_price.isdigit():
        sql += ' AND t.price <= %s'
        params.append(float(max_price))

    # sort order
    if sort_by == 'price_desc':
        sql += ' ORDER BY t.price DESC'
    elif sort_by == 'duration_asc':
        sql += ' ORDER BY t.duration_hours ASC'
    elif sort_by == 'capacity_desc':
        sql += ' ORDER BY t.seating_capacity DESC, t.price ASC'
    else:
        sql += ' ORDER BY t.price ASC'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    transports_list = cursor.fetchall()

    # distinct local cities (where taxis/rentals operate)
    cursor.execute('''
        SELECT DISTINCT source_city FROM transports 
        WHERE transport_type IN ('Taxi', 'Rental', 'Cab') 
        ORDER BY source_city ASC
    ''')
    local_cities = [row['source_city'] for row in cursor.fetchall()]

    # distinct intercity origins
    cursor.execute('''
        SELECT DISTINCT source_city FROM transports 
        WHERE transport_type IN ('Bus', 'Train', 'Flight') 
        ORDER BY source_city ASC
    ''')
    sources = [row['source_city'] for row in cursor.fetchall()]

    # distinct intercity destinations
    cursor.execute('''
        SELECT DISTINCT destination_city FROM transports 
        WHERE transport_type IN ('Bus', 'Train', 'Flight') 
        ORDER BY destination_city ASC
    ''')
    destinations = [row['destination_city'] for row in cursor.fetchall()]

    conn.close()

    return render_template(
        'transports.html',
        transports=transports_list,
        local_cities=local_cities,
        sources=sources,
        destinations=destinations,
        query=query,
        service_mode=service_mode,
        selected_type=transport_type,
        selected_city=city,
        selected_source=source_city,
        selected_dest=destination_city,
        selected_ac=ac_type,
        selected_capacity=min_capacity,
        max_price=max_price,
        sort_by=sort_by
    )

# transport details
@transports_bp.route('/transports/<int:transport_id>')
def transport_detail(transport_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch transport
    cursor.execute('''
        SELECT t.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
        FROM transports t
        LEFT JOIN agencies a ON t.agency_id = a.id
        WHERE t.id = %s
    ''', (transport_id,))
    transport = cursor.fetchone()

    # check saved
    is_saved = False
    if session.get('user_id'):
        cursor.execute('SELECT id FROM saved_items WHERE user_id = %s AND item_type = "transport" AND item_id = %s', (session['user_id'], transport_id))
        is_saved = bool(cursor.fetchone())

    conn.close()

    if not transport:
        flash('Transport option not found.', 'danger')
        return redirect(url_for('transports.transports'))

    reviews_data = get_item_reviews_summary('transport', transport_id)

    return render_template(
        'transport_detail.html',
        transport=transport,
        reviews_data=reviews_data,
        is_saved=is_saved
    )
