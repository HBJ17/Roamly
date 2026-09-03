from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from database.connection import get_db_connection
from reviews import get_item_reviews_summary

transports_bp = Blueprint('transports', __name__)

# transports catalog
@transports_bp.route('/transports')
def transports():
    query = request.args.get('q', '').strip()
    transport_type = request.args.get('type', '').strip()
    source_city = request.args.get('source', '').strip()
    destination_city = request.args.get('destination', '').strip()
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
        sql += ' AND (t.title LIKE %s OR t.features LIKE %s)'
        wildcard_q = f'%{query}%'
        params.extend([wildcard_q, wildcard_q])

    # type filter
    if transport_type:
        sql += ' AND t.transport_type = %s'
        params.append(transport_type)

    # origin filter
    if source_city:
        sql += ' AND t.source_city = %s'
        params.append(source_city)

    # destination filter
    if destination_city:
        sql += ' AND t.destination_city = %s'
        params.append(destination_city)

    # price filter
    if max_price and max_price.isdigit():
        sql += ' AND t.price <= %s'
        params.append(float(max_price))

    # sort order
    if sort_by == 'price_desc':
        sql += ' ORDER BY t.price DESC'
    elif sort_by == 'duration_asc':
        sql += ' ORDER BY t.duration_hours ASC'
    else:
        sql += ' ORDER BY t.price ASC'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    transports_list = cursor.fetchall()

    # distinct origins
    cursor.execute('SELECT DISTINCT source_city FROM transports ORDER BY source_city ASC')
    sources = [row['source_city'] for row in cursor.fetchall()]

    # distinct destinations
    cursor.execute('SELECT DISTINCT destination_city FROM transports ORDER BY destination_city ASC')
    destinations = [row['destination_city'] for row in cursor.fetchall()]

    conn.close()

    return render_template(
        'transports.html',
        transports=transports_list,
        sources=sources,
        destinations=destinations,
        query=query,
        selected_type=transport_type,
        selected_source=source_city,
        selected_dest=destination_city,
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
