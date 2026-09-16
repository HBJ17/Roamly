import json
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from database.connection import get_db_connection
from utils.decorators import login_required
from utils.geo import get_coordinates_for_location

itinerary_bp = Blueprint('itinerary', __name__)

SAMPLE_ACTIVITIES = {
    'ooty': [
        {'title': 'Doddabetta Peak Viewpoint', 'time': 'Morning', 'cost': 50, 'desc': 'Highest point in Nilgiris offering 360-degree panoramic views.'},
        {'title': 'Government Botanical Gardens & Rose Garden', 'time': 'Afternoon', 'cost': 100, 'desc': 'Exotic flora and thousands of hybrid rose cultivars.'},
        {'title': 'Pykara Lake Boating & Waterfalls', 'time': 'Evening', 'cost': 350, 'desc': 'Tranquil speedboat ride surrounded by pine forests.'},
        {'title': 'Nilgiri Heritage Tea Factory Tour', 'time': 'Morning', 'cost': 200, 'desc': 'Live orthodox tea manufacturing with tasting session.'},
        {'title': 'Avalanche Lake Nature Excursion', 'time': 'Afternoon', 'cost': 300, 'desc': 'Pristine biosphere reserve with trout fishing streams.'}
    ],
    'kodaikanal': [
        {'title': 'Coaker’s Walk & Bryant Park Stroll', 'time': 'Morning', 'cost': 50, 'desc': 'Pedestrian cliff path with valley mist vistas.'},
        {'title': 'Pillar Rocks & Guna Caves Exploration', 'time': 'Afternoon', 'cost': 80, 'desc': 'Giant granite rock formations and dense pine forests.'},
        {'title': 'Kodai Lake Pedal Boating & Cycling', 'time': 'Evening', 'cost': 250, 'desc': 'Star-shaped lake surrounded by heritage bungalows.'},
        {'title': 'Silver Cascade & Bear Shola Waterfalls', 'time': 'Morning', 'cost': 50, 'desc': 'Crystal cascading forest springs.'}
    ],
    'madurai': [
        {'title': 'Meenakshi Amman Temple Architecture Tour', 'time': 'Morning', 'cost': 150, 'desc': 'Towering colorful gopurams and Thousand Pillar Hall.'},
        {'title': 'Thirumalai Nayakkar Mahal Light & Sound', 'time': 'Evening', 'cost': 100, 'desc': '17th-century palace with Indo-Saracenic arches.'},
        {'title': 'Traditional South Indian Culinary Trail', 'time': 'Afternoon', 'cost': 450, 'desc': 'Authentic Madurai Kari Dosa, Jigarthanda, and Banana Leaf feast.'}
    ],
    'thanjavur': [
        {'title': 'Brihadisvara Great Living Chola Temple', 'time': 'Morning', 'cost': 100, 'desc': 'UNESCO World Heritage granite sanctuary with monolithic Nandi.'},
        {'title': 'Thanjavur Royal Palace & Saraswathi Mahal Library', 'time': 'Afternoon', 'cost': 120, 'desc': 'Ancient palm-leaf manuscripts and Maratha art museum.'},
        {'title': 'Thanjavur Art Plate & Bronze Casting Workshop', 'time': 'Evening', 'cost': 250, 'desc': 'Witness generational artisans crafting metal masterpieces.'}
    ],
    'rameswaram': [
        {'title': 'Ramanathaswamy Temple 22 Sacred Wells & Corridors', 'time': 'Morning', 'cost': 100, 'desc': 'Longest corridor of carved sandstone pillars in India.'},
        {'title': 'Dhanushkodi Ghost Town & Lands End 4x4 Safari', 'time': 'Afternoon', 'cost': 600, 'desc': 'Meeting point of Bay of Bengal and Indian Ocean.'},
        {'title': 'Pamban Sea Bridge Sunset Viewpoint', 'time': 'Evening', 'cost': 50, 'desc': 'Historic cantilevering maritime railway bridge.'}
    ],
    'chennai': [
        {'title': 'Kapaleeshwarar Temple & Mylapore Heritage Walk', 'time': 'Morning', 'cost': 100, 'desc': 'Dravidian temple architecture and heritage silk boutiques.'},
        {'title': 'Marina Beach Promenade & Lighthouse View', 'time': 'Evening', 'cost': 50, 'desc': 'Second longest urban beach with panoramic ocean view.'},
        {'title': 'Fort St. George & National Art Gallery', 'time': 'Afternoon', 'cost': 80, 'desc': '1644 British citadel museum and colonial artifacts.'}
    ]
}

@itinerary_bp.route('/itinerary/builder')
def builder():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # fetch hotels and transports
    cursor.execute('SELECT * FROM hotels ORDER BY star_rating DESC')
    hotels = cursor.fetchall()
    
    cursor.execute('SELECT * FROM transports ORDER BY price ASC')
    transports = cursor.fetchall()
    
    conn.close()
    
    destination = request.args.get('destination', 'Ooty')
    dest_key = destination.lower()
    if 'kodai' in dest_key:
        dest_key = 'kodaikanal'
    elif 'madurai' in dest_key:
        dest_key = 'madurai'
    elif 'thanjavur' in dest_key or 'tanjore' in dest_key:
        dest_key = 'thanjavur'
    elif 'rameswaram' in dest_key:
        dest_key = 'rameswaram'
    elif 'chennai' in dest_key:
        dest_key = 'chennai'
    else:
        dest_key = 'ooty'
        
    activities = SAMPLE_ACTIVITIES.get(dest_key, SAMPLE_ACTIVITIES['ooty'])
    map_lat, map_lng, map_title = get_coordinates_for_location(destination)
    
    return render_template(
        'itinerary_builder.html',
        hotels=hotels,
        transports=transports,
        destination=destination,
        dest_key=dest_key,
        activities=activities,
        map_lat=map_lat,
        map_lng=map_lng,
        map_title=map_title
    )

@itinerary_bp.route('/itinerary/save', methods=['POST'])
@login_required
def save_itinerary():
    user_id = session['user_id']
    title = request.form.get('title', 'Custom South India Getaway').strip()
    destination = request.form.get('destination', 'Ooty').strip()
    start_date = request.form.get('start_date')
    duration_days = int(request.form.get('duration_days', 3))
    duration_nights = max(1, duration_days - 1)
    hotel_id = request.form.get('hotel_id') or None
    transport_id = request.form.get('transport_id') or None
    total_price = float(request.form.get('total_price', 5000))
    day_plan_json = request.form.get('day_plan_json', '[]')
    
    if not start_date:
        flash('Please provide a valid departure date.', 'danger')
        return redirect(url_for('itinerary.builder', destination=destination))
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO custom_itineraries 
        (user_id, title, destination, duration_days, duration_nights, start_date, hotel_id, transport_id, day_plan_json, total_estimated_price)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (user_id, title, destination, duration_days, duration_nights, start_date, hotel_id, transport_id, day_plan_json, total_price))
    
    itinerary_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    flash('Custom Trip Itinerary created and saved successfully!', 'success')
    return redirect(url_for('itinerary.view_itinerary', itinerary_id=itinerary_id))

@itinerary_bp.route('/itinerary/<int:itinerary_id>')
def view_itinerary(itinerary_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT ci.*, u.full_name, u.email as user_email,
               h.name as hotel_name, h.star_rating as hotel_stars, h.city as hotel_city,
               t.title as transport_title, t.transport_type, t.source_city, t.destination_city
        FROM custom_itineraries ci
        LEFT JOIN users u ON ci.user_id = u.id
        LEFT JOIN hotels h ON ci.hotel_id = h.id
        LEFT JOIN transports t ON ci.transport_id = t.id
        WHERE ci.id = %s
    ''', (itinerary_id,))
    itinerary = cursor.fetchone()
    conn.close()
    
    if not itinerary:
        flash('Itinerary plan not found.', 'danger')
        return redirect(url_for('itinerary.builder'))
        
    try:
        day_plans = json.loads(itinerary['day_plan_json'])
    except Exception:
        day_plans = []
        
    map_lat, map_lng, map_title = get_coordinates_for_location(itinerary['destination'])
    
    return render_template(
        'itinerary_view.html',
        itinerary=itinerary,
        day_plans=day_plans,
        map_lat=map_lat,
        map_lng=map_lng,
        map_title=map_title
    )

@itinerary_bp.route('/itineraries')
@login_required
def my_itineraries():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT ci.*, h.name as hotel_name, t.title as transport_title
        FROM custom_itineraries ci
        LEFT JOIN hotels h ON ci.hotel_id = h.id
        LEFT JOIN transports t ON ci.transport_id = t.id
        WHERE ci.user_id = %s
        ORDER BY ci.id DESC
    ''', (user_id,))
    itineraries = cursor.fetchall()
    conn.close()
    
    return render_template('itineraries_list.html', itineraries=itineraries)
