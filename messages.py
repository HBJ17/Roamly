from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from database.connection import get_db_connection
from utils.decorators import login_required, agency_required
from payments import create_notification

messages_bp = Blueprint('messages', __name__)

# traveler messages list / conversation overview
@messages_bp.route('/messages')
@login_required
def user_inbox():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch user bookings that have an assigned agency
    cursor.execute('''
        SELECT b.id as booking_id, b.booking_type, b.travel_date, b.status,
               COALESCE(p.title, h.name, t.title) as item_title,
               COALESCE(a.name, 'Roamly Central Support') as agency_name,
               COALESCE(a.id, 1) as agency_id,
               (SELECT message_text FROM messages WHERE booking_id = b.id ORDER BY id DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE booking_id = b.id ORDER BY id DESC LIMIT 1) as last_message_time,
               (SELECT COUNT(*) FROM messages WHERE booking_id = b.id AND sender_type = 'agency' AND is_read = 0) as unread_count
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        LEFT JOIN agencies a ON (p.agency_id = a.id OR h.agency_id = a.id OR t.agency_id = a.id)
        WHERE b.user_id = %s
        ORDER BY b.id DESC
    ''', (user_id,))
    conversations = cursor.fetchall()
    conn.close()

    return render_template('messages.html', conversations=conversations, active_booking=None, messages=[])

# traveler conversation thread for specific booking
@messages_bp.route('/messages/<int:booking_id>')
@login_required
def user_conversation(booking_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch conversation info
    cursor.execute('''
        SELECT b.id as booking_id, b.booking_type, b.travel_date, b.status,
               COALESCE(p.title, h.name, t.title) as item_title,
               COALESCE(a.name, 'Roamly Concierge') as agency_name,
               COALESCE(a.id, 1) as agency_id
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        LEFT JOIN agencies a ON (p.agency_id = a.id OR h.agency_id = a.id OR t.agency_id = a.id)
        WHERE b.id = %s AND b.user_id = %s
    ''', (booking_id, user_id))
    active_booking = cursor.fetchone()

    if not active_booking:
        conn.close()
        flash('Conversation not found for this reservation.', 'danger')
        return redirect(url_for('messages.user_inbox'))

    # mark incoming agency messages as read
    cursor.execute('''
        UPDATE messages 
        SET is_read = 1 
        WHERE booking_id = %s AND sender_type = 'agency'
    ''', (booking_id,))
    conn.commit()

    # fetch messages
    cursor.execute('''
        SELECT * FROM messages 
        WHERE booking_id = %s 
        ORDER BY created_at ASC
    ''', (booking_id,))
    messages_list = cursor.fetchall()

    # fetch all user conversations for sidebar
    cursor.execute('''
        SELECT b.id as booking_id, b.booking_type,
               COALESCE(p.title, h.name, t.title) as item_title,
               COALESCE(a.name, 'Roamly Support') as agency_name,
               (SELECT message_text FROM messages WHERE booking_id = b.id ORDER BY id DESC LIMIT 1) as last_message,
               (SELECT COUNT(*) FROM messages WHERE booking_id = b.id AND sender_type = 'agency' AND is_read = 0) as unread_count
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        LEFT JOIN agencies a ON (p.agency_id = a.id OR h.agency_id = a.id OR t.agency_id = a.id)
        WHERE b.user_id = %s
        ORDER BY b.id DESC
    ''', (user_id,))
    conversations = cursor.fetchall()
    conn.close()

    return render_template(
        'messages.html',
        conversations=conversations,
        active_booking=active_booking,
        messages=messages_list
    )

# send message from traveler to agency
@messages_bp.route('/messages/send/<int:booking_id>', methods=['POST'])
@login_required
def send_user_message(booking_id):
    user_id = session['user_id']
    message_text = request.form.get('message_text', '').strip()
    agency_id = int(request.form.get('agency_id', 1))

    if not message_text:
        return redirect(url_for('messages.user_conversation', booking_id=booking_id))

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO messages (booking_id, sender_type, sender_id, recipient_id, message_text, is_read)
        VALUES (%s, 'user', %s, %s, %s, 0)
    ''', (booking_id, user_id, agency_id, message_text))
    conn.commit()
    conn.close()

    return redirect(url_for('messages.user_conversation', booking_id=booking_id))

# agency messages inbox
@messages_bp.route('/agency/messages')
@agency_required
def agency_inbox():
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT b.id as booking_id, b.booking_type, b.travel_date, b.status,
               u.full_name as traveler_name, u.email as traveler_email, u.phone as traveler_phone,
               COALESCE(p.title, h.name, t.title) as item_title,
               (SELECT message_text FROM messages WHERE booking_id = b.id ORDER BY id DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE booking_id = b.id ORDER BY id DESC LIMIT 1) as last_message_time,
               (SELECT COUNT(*) FROM messages WHERE booking_id = b.id AND sender_type = 'user' AND is_read = 0) as unread_count
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE p.agency_id = %s OR h.agency_id = %s OR t.agency_id = %s
        ORDER BY b.id DESC
    ''', (agency_id, agency_id, agency_id))
    conversations = cursor.fetchall()
    conn.close()

    return render_template('agency/messages.html', conversations=conversations, active_booking=None, messages=[])

# agency conversation thread
@messages_bp.route('/agency/messages/<int:booking_id>')
@agency_required
def agency_conversation(booking_id):
    agency_id = session['agency_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT b.id as booking_id, b.booking_type, b.travel_date, b.status, b.user_id,
               u.full_name as traveler_name, u.email as traveler_email, u.phone as traveler_phone,
               COALESCE(p.title, h.name, t.title) as item_title
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE b.id = %s AND (p.agency_id = %s OR h.agency_id = %s OR t.agency_id = %s)
    ''', (booking_id, agency_id, agency_id, agency_id))
    active_booking = cursor.fetchone()

    if not active_booking:
        conn.close()
        flash('Reservation inquiry not found.', 'danger')
        return redirect(url_for('messages.agency_inbox'))

    # mark incoming user messages as read
    cursor.execute('''
        UPDATE messages 
        SET is_read = 1 
        WHERE booking_id = %s AND sender_type = 'user'
    ''', (booking_id,))
    conn.commit()

    cursor.execute('SELECT * FROM messages WHERE booking_id = %s ORDER BY created_at ASC', (booking_id,))
    messages_list = cursor.fetchall()

    cursor.execute('''
        SELECT b.id as booking_id, b.booking_type,
               u.full_name as traveler_name,
               COALESCE(p.title, h.name, t.title) as item_title,
               (SELECT message_text FROM messages WHERE booking_id = b.id ORDER BY id DESC LIMIT 1) as last_message,
               (SELECT COUNT(*) FROM messages WHERE booking_id = b.id AND sender_type = 'user' AND is_read = 0) as unread_count
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN packages p ON b.package_id = p.id
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN transports t ON b.transport_id = t.id
        WHERE p.agency_id = %s OR h.agency_id = %s OR t.agency_id = %s
        ORDER BY b.id DESC
    ''', (agency_id, agency_id, agency_id))
    conversations = cursor.fetchall()
    conn.close()

    return render_template(
        'agency/messages.html',
        conversations=conversations,
        active_booking=active_booking,
        messages=messages_list
    )

# send message from agency to traveler
@messages_bp.route('/agency/messages/send/<int:booking_id>', methods=['POST'])
@agency_required
def send_agency_message(booking_id):
    agency_id = session['agency_id']
    user_id = int(request.form.get('user_id'))
    message_text = request.form.get('message_text', '').strip()

    if not message_text:
        return redirect(url_for('messages.agency_conversation', booking_id=booking_id))

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO messages (booking_id, sender_type, sender_id, recipient_id, message_text, is_read)
        VALUES (%s, 'agency', %s, %s, %s, 0)
    ''', (booking_id, agency_id, user_id, message_text))
    conn.commit()
    conn.close()

    # notify traveler
    create_notification(
        user_id=user_id,
        title="New Message from Travel Agency",
        message=f"New message regarding booking #{booking_id}: \"{message_text[:50]}...\"",
        notification_type='message',
        link_url=f"/messages/{booking_id}"
    )

    return redirect(url_for('messages.agency_conversation', booking_id=booking_id))
