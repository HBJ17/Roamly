from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from database.connection import get_db_connection

transports_bp = Blueprint('transports', __name__)

@transports_bp.route('/transports')
def transports():
    query = request.args.get('q', '').strip()
    transport_type = request.args.get('type', '').strip()
    source_city = request.args.get('source', '').strip()
    dest_city = request.args.get('destination', '').strip()
    max_price = request.args.get('max_price', '').strip()
    sort_by = request.args.get('sort_by', 'price_asc').strip()

    sql = '''
        SELECT t.*, a.name as agency_name, a.agency_type
        FROM transports t
        LEFT JOIN agencies a ON t.agency_id = a.id
        WHERE 1=1
    '''
    params = []

    if query:
        sql += ' AND (t.title LIKE ? OR t.source_city LIKE ? OR t.destination_city LIKE ? OR t.features LIKE ?)'
        wildcard_q = f'%{query}%'
        params.extend([wildcard_q, wildcard_q, wildcard_q, wildcard_q])

    if transport_type:
        sql += ' AND t.transport_type = ?'
        params.append(transport_type)

    if source_city:
        sql += ' AND t.source_city LIKE ?'
        params.append(f'%{source_city}%')

    if dest_city:
        sql += ' AND t.destination_city LIKE ?'
        params.append(f'%{dest_city}%')

    if max_price and max_price.isdigit():
        sql += ' AND t.price <= ?'
        params.append(float(max_price))

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

    # Get distinct source and destination cities
    cursor.execute('SELECT DISTINCT source_city FROM transports ORDER BY source_city ASC')
    sources = [row['source_city'] for row in cursor.fetchall()]

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
        selected_dest=dest_city,
        max_price=max_price,
        sort_by=sort_by
    )

from reviews import get_item_reviews_summary

@transports_bp.route('/transports/<int:transport_id>')
def transport_detail(transport_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.*, a.name as agency_name, a.agency_type, a.phone as agency_phone, a.email as agency_email
        FROM transports t
        LEFT JOIN agencies a ON t.agency_id = a.id
        WHERE t.id = ?
    ''', (transport_id,))
    transport = cursor.fetchone()

    is_saved = False
    if session.get('user_id'):
        cursor.execute('SELECT id FROM saved_items WHERE user_id = ? AND item_type = "transport" AND item_id = ?', (session['user_id'], transport_id))
        is_saved = bool(cursor.fetchone())

    conn.close()

    if not transport:
        flash('Transport listing not found.', 'danger')
        return redirect(url_for('transports.transports'))

    reviews_data = get_item_reviews_summary('transport', transport_id)

    return render_template(
        'transport_detail.html',
        transport=transport,
        reviews_data=reviews_data,
        is_saved=is_saved
    )
