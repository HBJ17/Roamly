import json
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from database.connection import get_db_connection
from utils.decorators import login_required
from utils.geo import get_coordinates_for_location

itinerary_bp = Blueprint('itinerary', __name__)

SAMPLE_ACTIVITIES = {
    'kodaikanal': [
        {'title': 'Coaker’s Walk & Bryant Park Mist Stroll', 'time': 'Morning', 'cost': 60, 'desc': 'Pedestrian cliff edge path with valley mist vistas and floral gardens.'},
        {'title': 'Pillar Rocks & Guna Caves Geological Exploration', 'time': 'Afternoon', 'cost': 100, 'desc': 'Giant 400-foot granite rock boulders and dense shola pine forests.'},
        {'title': 'Kodai Star Lake Pedal Boating & Cycle Loop', 'time': 'Evening', 'cost': 250, 'desc': 'Heritage star-shaped lake boat cruise with eucalyptus fragrance.'},
        {'title': 'Silver Cascade & Bear Shola Forest Waterfalls', 'time': 'Morning', 'cost': 50, 'desc': 'Crystal cascading natural mountain springs nestled in forest clearings.'},
        {'title': 'Mannavanur Sheep Farm & High Valley Meadow Safari', 'time': 'Afternoon', 'cost': 350, 'desc': 'Rolling green pastures, coracle boating, and organic rabbit farm.'},
        {'title': 'Berijam Biosphere Forest Protected Safari', 'time': 'Morning', 'cost': 500, 'desc': 'Restricted evergreen forest zone with bison and Nilgiri langurs.'},
        {'title': 'Vattakanal Dolphin’s Nose Sunrise Cliff Trek', 'time': 'Morning', 'cost': 200, 'desc': 'Flat rock projecting over a 6,600-foot deep valley precipice.'}
    ],
    'madurai': [
        {'title': 'Meenakshi Amman Temple Golden Gopuram Darshan', 'time': 'Morning', 'cost': 150, 'desc': 'Explore towering sculptured gopurams and the Thousand Pillar Hall.'},
        {'title': 'Thirumalai Nayakkar Mahal Light & Sound Spectacle', 'time': 'Evening', 'cost': 100, 'desc': '17th-century Indo-Saracenic palace with giant stucco pillars.'},
        {'title': 'Keeladi Sangam-Era Archaeological Museum Tour', 'time': 'Afternoon', 'cost': 120, 'desc': '2,600-year-old Vaigai river civilization artifacts and ancient script pottery.'},
        {'title': 'Authentic Madurai Street Food & Jigarthanda Walk', 'time': 'Evening', 'cost': 350, 'desc': 'Taste Famous Jigarthanda, fluffy bun parottas, and piping hot filter coffee.'},
        {'title': 'Alagar Hills & Pazhamudircholai Murugan Temple', 'time': 'Morning', 'cost': 180, 'desc': 'Scenic hill forest temple dedicated to Lord Vishnu and Lord Murugan.'},
        {'title': 'Vandiyur Mariamman Teppakulam Temple Tank Heritage Walk', 'time': 'Afternoon', 'cost': 50, 'desc': 'Enormous granite tank with island pavilion built in 1645.'}
    ],
    'chennai': [
        {'title': 'Kapaleeshwarar Temple & Mylapore Cultural Walk', 'time': 'Morning', 'cost': 100, 'desc': 'Dravidian temple architecture, colorful bronze deities, and traditional silk stores.'},
        {'title': 'Marina Beach Promenade & Lighthouse Panoramic View', 'time': 'Evening', 'cost': 80, 'desc': 'India’s longest urban beach with ocean breeze and sunset lighthouse deck.'},
        {'title': 'Fort St. George & 1644 Colonial Museum', 'time': 'Afternoon', 'cost': 100, 'desc': 'First British fortress in India with historic artifacts and St. Mary’s Church.'},
        {'title': 'Mahabalipuram UNESCO Shore Temples & Arjuna’s Penance', 'time': 'Morning', 'cost': 300, 'desc': '7th-century rock-cut monoliths and oceanfront stone sanctum.'},
        {'title': 'DakshinaChitra Living Heritage Museum Excursion', 'time': 'Afternoon', 'cost': 250, 'desc': 'Authentic reconstructed traditional houses of South Indian communities.'},
        {'title': 'San Thome Basilica & St. Thomas Mount Heritage', 'time': 'Evening', 'cost': 60, 'desc': 'Neo-Gothic cathedral built over the tomb of apostle St. Thomas.'}
    ],
    'thanjavur': [
        {'title': 'Brihadisvara Great Living Chola Temple Darshan', 'time': 'Morning', 'cost': 100, 'desc': '1,000-year-old UNESCO World Heritage granite marvel with monolithic Nandi.'},
        {'title': 'Thanjavur Maratha Royal Palace & Art Gallery', 'time': 'Afternoon', 'cost': 150, 'desc': 'Royal courtyards, Darbar hall, and ancient Chola bronze masterworks.'},
        {'title': 'Saraswathi Mahal Ancient Palm-Leaf Library', 'time': 'Morning', 'cost': 80, 'desc': 'One of the oldest libraries in Asia housing rare medieval manuscripts.'},
        {'title': 'Swamimalai Traditional Bronze Casting Workshop', 'time': 'Evening', 'cost': 300, 'desc': 'Witness generational artisans practicing lost-wax bronze casting technique.'},
        {'title': 'Darasuram Airavatesvara UNESCO Sculptural Marvel', 'time': 'Afternoon', 'cost': 120, 'desc': 'Chola chariot temple adorned with exquisite musical steps.'},
        {'title': 'Cauvery Delta Village & Handloom Silk Weaving Safari', 'time': 'Morning', 'cost': 220, 'desc': 'Scenic paddy field village with live silk handloom weavers.'}
    ],
    'bangalore': [
        {'title': 'Bangalore Palace & Tudor Royal Heritage Tour', 'time': 'Morning', 'cost': 250, 'desc': '1878 royal palace inspired by Windsor Castle with wood carvings.'},
        {'title': 'Lalbagh Botanical Gardens & Historic Glass House', 'time': 'Morning', 'cost': 70, 'desc': '240 acres of exotic trees, bonsai gardens, and centuries-old lake.'},
        {'title': 'Nandi Hills Cloud Sunrise & Bhoga Nandeeshwara Temple', 'time': 'Morning', 'cost': 350, 'desc': 'Breathtaking cloud-sea sunrise from 4,850 ft high mountain peak.'},
        {'title': 'Bannerghatta National Park Jungle Safari & Zoo', 'time': 'Afternoon', 'cost': 400, 'desc': 'Witness royal Bengal tigers, lions, and bears in protected forest.'},
        {'title': 'Grover Zampa Vineyard Guided Tour & Wine Tasting', 'time': 'Afternoon', 'cost': 800, 'desc': 'Scenic vineyard walk, barrel cellar tour, and sommelier tasting flight.'},
        {'title': 'Cubbon Park Bamboo Grove Walk & Vidhana Soudha View', 'time': 'Evening', 'cost': 50, 'desc': 'Lush green lung of the city with neo-Dravidian state legislature facade.'}
    ],
    'kanyakumari': [
        {'title': 'Vivekananda Rock Memorial & Ferry Ocean Ride', 'time': 'Morning', 'cost': 150, 'desc': 'Sacred monument on rock island surrounded by three uniting oceans.'},
        {'title': '133-Foot Thiruvalluvar Statue & Triveni Sangam', 'time': 'Morning', 'cost': 100, 'desc': 'Gigantic stone statue of ancient Tamil sage and poet overlooking ocean waters.'},
        {'title': 'Padmanabhapuram 16th-Century Teakwood Palace', 'time': 'Afternoon', 'cost': 200, 'desc': 'Magnificent wooden architecture with Belgian mirrors and carved ceilings.'},
        {'title': 'Vattakottai Ocean Granite Fort & Black Sand Beach', 'time': 'Evening', 'cost': 80, 'desc': '18th-century coastal fortress with panoramic views of the sea and Western Ghats.'},
        {'title': 'Sunset View Point & Catamaran Ocean Cruise', 'time': 'Evening', 'cost': 300, 'desc': 'Watch the sun dip below the horizon over the confluence of three oceans.'},
        {'title': 'Suchindram Thanumalayan Temple Musical Pillars', 'time': 'Morning', 'cost': 100, 'desc': 'Unique temple dedicated to Trinity (Brahma, Vishnu, Shiva) with acoustic pillars.'}
    ]
}

@itinerary_bp.route('/itinerary/builder')
def builder():
    destination = request.args.get('destination', 'Kodaikanal').strip()
    
    dest_key = destination.lower()
    if 'kodai' in dest_key:
        dest_key = 'kodaikanal'
        canonical_dest = 'Kodaikanal'
    elif 'madurai' in dest_key:
        dest_key = 'madurai'
        canonical_dest = 'Madurai'
    elif 'thanjavur' in dest_key or 'tanjavur' in dest_key or 'tanjore' in dest_key:
        dest_key = 'thanjavur'
        canonical_dest = 'Thanjavur'
    elif 'chennai' in dest_key:
        dest_key = 'chennai'
        canonical_dest = 'Chennai'
    elif 'bangalore' in dest_key or 'bengaluru' in dest_key:
        dest_key = 'bangalore'
        canonical_dest = 'Bangalore'
    elif 'kanyakumari' in dest_key or 'cape' in dest_key:
        dest_key = 'kanyakumari'
        canonical_dest = 'Kanyakumari'
    else:
        dest_key = 'kodaikanal'
        canonical_dest = 'Kodaikanal'

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # fetch hotels strictly for this destination/region
    cursor.execute('''
        SELECT h.*, a.name as agency_name 
        FROM hotels h 
        LEFT JOIN agencies a ON h.agency_id = a.id
        WHERE h.city LIKE %s
        ORDER BY h.star_rating DESC, h.price_per_night ASC
    ''', (f'%{canonical_dest}%',))
    hotels = cursor.fetchall()
    
    # if none found with exact wildcard, fallback to all hotels
    if not hotels:
        cursor.execute('SELECT h.*, a.name as agency_name FROM hotels h LEFT JOIN agencies a ON h.agency_id = a.id ORDER BY h.star_rating DESC')
        hotels = cursor.fetchall()

    # fetch transports (Taxis and Self-Drive Rentals) available for this region
    cursor.execute('''
        SELECT t.*, a.name as agency_name 
        FROM transports t 
        LEFT JOIN agencies a ON t.agency_id = a.id
        WHERE t.source_city LIKE %s OR t.destination_city LIKE %s OR t.title LIKE %s
        ORDER BY t.daily_rate ASC, t.price ASC
    ''', (f'%{canonical_dest}%', f'%{canonical_dest}%', f'%{canonical_dest}%'))
    transports = cursor.fetchall()
    
    if not transports:
        cursor.execute('SELECT t.*, a.name as agency_name FROM transports t LEFT JOIN agencies a ON t.agency_id = a.id ORDER BY t.price ASC')
        transports = cursor.fetchall()
        
    conn.close()
    
    activities = SAMPLE_ACTIVITIES.get(dest_key, SAMPLE_ACTIVITIES['kodaikanal'])
    map_lat, map_lng, map_title = get_coordinates_for_location(canonical_dest)
    
    return render_template(
        'itinerary_builder.html',
        hotels=hotels,
        transports=transports,
        destination=canonical_dest,
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
    destination = request.form.get('destination', 'Kodaikanal').strip()
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
    
    flash('Custom Trip Itinerary stamped and saved successfully!', 'success')
    return redirect(url_for('itinerary.view_itinerary', itinerary_id=itinerary_id))

@itinerary_bp.route('/itinerary/<int:itinerary_id>')
def view_itinerary(itinerary_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT ci.*, u.full_name, u.email as user_email,
               h.name as hotel_name, h.star_rating as hotel_stars, h.city as hotel_city, h.ac_type as hotel_ac, h.pet_friendly as hotel_pets, h.bed_type as hotel_bed, h.max_capacity as hotel_capacity,
               t.title as transport_title, t.transport_type, t.service_type, t.ac_type as transport_ac, t.seating_capacity as transport_seats, t.source_city, t.destination_city
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
