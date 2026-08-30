def seed_packages(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM packages')
    count = cursor.fetchone()['count']
    if count == 0:
        seed_packages_data = [
            (
                'Ooty Alpine Magic & Nilgiri Hills Tour',
                'Ooty, Nilgiris',
                'Hill Station',
                12500.0,
                4,
                3,
                'Explore the Queen of Hill Stations! Enjoy scenic toy train rides through the Nilgiri Mountains, peaceful boat rides on Ooty Lake, and lush tea plantation tours.',
                'UNESCO Heritage Toy Train Ride, Ooty Lake Boating, Doddabetta Peak Sunset, Pykara Lake & Falls, Tea Factory Guided Tour',
                '3-Star Hotel Stay, Daily Breakfast & Dinner, Private Cab Sightseeing, Toy Train Tickets, Entry Permits',
                4.8,
                'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80',
                3
            ),
            (
                'Kodaikanal Misty Heights & Lakes Getaway',
                'Kodaikanal, Dindigul',
                'Hill Station',
                11000.0,
                3,
                2,
                'Experience the Princess of Hill Stations with misty pine forests, serene lakes, panoramic rock views, and vibrant flower parks.',
                'Kodai Lake Pedal Boating, Coaker’s Walk Cloud View, Pillar Rocks, Pine Forest Trail, Bryant Park Flora',
                'Resort Stay, Breakfast Included, Private Transfers, Boating Vouchers, Guided Trekking',
                4.7,
                'https://images.unsplash.com/photo-1626014903708-69b614006c9a?auto=format&fit=crop&w=800&q=80',
                3
            ),
            (
                'Yercaud Jewel of Shevaroy Hills Escapade',
                'Yercaud, Salem',
                'Hill Station',
                8500.0,
                3,
                2,
                'A peaceful hill retreat nestled in the Shevaroy Hills of Eastern Ghats, famous for coffee plantations, orange groves, and cool mountain breezes.',
                'Yercaud Lake Boating, Pagoda Point Sunset, Lady’s Seat Valley View, Shevaroy Temple Peak, Bear’s Cave',
                'Hill View Hotel Stay, Daily Breakfast, Private Car for Sightseeing, Plantation Walk',
                4.5,
                'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
                3
            ),
            (
                'Madurai Cultural & Meenakshi Temple Pilgrimage',
                'Madurai',
                'Heritage & Culture',
                9800.0,
                3,
                2,
                'Step into the ancient Lotus City of Madurai. Marvel at the stunning Dravidian architecture of Meenakshi Amman Temple and royal palace heritage.',
                'Meenakshi Amman Temple Special Darshan, Thirumalai Nayakkar Mahal Light Show, Gandhi Memorial Museum, Jigarthanda Tasting Tour',
                'Heritage Hotel Stay, Daily South Indian Breakfast, Temple Guide, AC Airport/Station Transfers',
                4.9,
                'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
                3
            ),
            (
                'Chennai Coastal Vibe & Heritage Trail',
                'Chennai',
                'Coastal & Urban',
                10500.0,
                3,
                2,
                'Discover the vibrant capital of Tamil Nadu! Blend coastal walks on Marina Beach with historic churches, ancient temples, and shopping districts.',
                'Marina Beach Sunset Walk, Kapaleeshwarar Temple, Fort St. George Museum, San Thome Cathedral, DakshinaChitra Cultural Village',
                '3-Star City Hotel, Daily Breakfast, Private AC Car, Museum Entry Tickets',
                4.6,
                'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
                3
            ),
            (
                'Tanjore (Thanjavur) Chola Dynasty Heritage Experience',
                'Thanjavur',
                'Heritage & Culture',
                9200.0,
                3,
                2,
                'Immerse in the grand Chola architecture and artistic legacy of Thanjavur, home to the magnificent UNESCO World Heritage Great Living Chola Temples.',
                'Brihadeeswarar Big Temple Architectural Tour, Thanjavur Maratha Palace, Saraswathi Mahal Library, Tanjore Painting Demonstration',
                'Heritage Resort Stay, Breakfast & Traditional South Indian Lunch, Heritage Art Guide, AC Cab',
                4.8,
                'https://images.unsplash.com/photo-1600100397608-f090742f40b2?auto=format&fit=crop&w=800&q=80',
                3
            ),
            (
                'Rameswaram & Kanyakumari Sacred Southern Coast',
                'Rameswaram & Kanyakumari',
                'Pilgrimage & Coastal',
                14000.0,
                5,
                4,
                'Journey to the southernmost tips of India! Marvel at the Pamban Sea Bridge, holy wells of Rameswaram, and the confluence of three oceans at Kanyakumari.',
                'Ramanathaswamy Temple 22 Holy Wells Bath, Pamban Sea Bridge View, Vivekananda Rock Ferry & Sunset, Thiruvalluvar Statue, Dhanushkodi Ghost Town',
                'Seaview Hotel Stays, Breakfast & Dinner, Private AC Vehicle, Ferry Tickets, Special Temple Entry Pass',
                4.9,
                'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
                3
            ),
            (
                'Mahabalipuram Shore Temples & Pondicherry French Quarter',
                'Mahabalipuram & Pondicherry',
                'Coastal & Heritage',
                13200.0,
                4,
                3,
                'Combine UNESCO monolith stone carvings in Mahabalipuram with French colonial architecture, beach cafes, and spiritual vibes in Auroville Pondicherry.',
                'Mahabalipuram Shore Temple & Pancha Rathas, Krishna’s Butter Ball, Pondicherry French Quarter Walking Tour, Auroville Matrimandir View, Promenade Beach',
                'Boutique Beach Resort, Daily Continental & South Indian Breakfast, Private Transport, Guided Heritage Walk',
                4.8,
                'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
                3
            )
        ]
        cursor.executemany('''
            INSERT INTO packages (title, destination, category, price, duration_days, duration_nights, description, highlights, included_amenities, rating, image_url, agency_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_packages_data)

def seed_admin(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM admins')
    count = cursor.fetchone()['count']
    if count == 0:
        cursor.execute('''
            INSERT INTO admins (username, password, email, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        ''', ('admin', 'admin123', 'admin@roamly.com', 'Super Administrator', 'superadmin'))

def seed_agencies(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM agencies')
    count = cursor.fetchone()['count']
    if count == 0:
        seed_agencies_data = [
            (
                'nilgiri_cabs',
                'agency123',
                'Nilgiri Express Cabs & Fleet',
                'Cab Service',
                'support@nilgiricabs.com',
                '+91 9840123456',
                'Commercial Road, Ooty, Nilgiris, Tamil Nadu',
                'Active'
            ),
            (
                'heritage_hotels',
                'agency123',
                'Tamil Heritage Resorts & Palaces',
                'Hotel Owner',
                'reservations@heritageresorts.com',
                '+91 9840987654',
                'East Gate Road, Thanjavur & Madurai, Tamil Nadu',
                'Active'
            ),
            (
                'tamil_tours',
                'agency123',
                'Tamil Nadu Grand Holiday Travels',
                'Travel Brand',
                'hello@tamiltours.com',
                '+91 9444112233',
                'Anna Salai, Chennai, Tamil Nadu',
                'Active'
            ),
            (
                'southern_transit',
                'agency123',
                'Southern State Bus & Volvo Transits',
                'Tour Operator',
                'ops@southerntransit.com',
                '+91 9443224466',
                'Gandhipuram, Coimbatore, Tamil Nadu',
                'Active'
            )
        ]
        cursor.executemany('''
            INSERT INTO agencies (username, password, name, agency_type, email, phone, address, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_agencies_data)

def seed_hotels(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM hotels')
    count = cursor.fetchone()['count']
    if count == 0:
        hotels_data = [
            (
                2,
                'The Savoy Heritage Resort & Spa',
                'Ooty',
                'Sylks Road, Monterosa, Ooty, Tamil Nadu 643001',
                4.8,
                6500.0,
                'Deluxe Garden View Room, Heritage Suite, Colonial Cottage',
                'Free High-Speed WiFi, Heated Fireplace, Multi-Cuisine Dining, Mountain View Lawn, Spa & Wellness, Tea Tasting',
                'Experience colonial charm in the Nilgiri hills with sweeping tea garden vistas, cozy heritage suites, and vintage afternoon tea.',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'Kodai Lakeview Valley Palace',
                'Kodaikanal',
                'Lower Shola Road, Kodaikanal, Tamil Nadu 624101',
                4.7,
                5200.0,
                'Executive Lake View Room, Shola Family Suite, Honeymoon Lake Chalet',
                'Lakefront Balcony, Complimentary Breakfast, Pedal Boat Access, Indoor Games, Bonfire Nights, 24/7 Room Service',
                'Overlooking the tranquil waters of Kodai Lake, featuring mist-kissed balconies, serene pine surroundings, and authentic Tamil gourmet cuisines.',
                'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'Madurai Heritage Crown Residency',
                'Madurai',
                'West Veli Street, Near Meenakshi Temple, Madurai, Tamil Nadu 625001',
                4.9,
                4800.0,
                'Temple View Deluxe, Royal South Suite, Premium King Room',
                'Rooftop Meenakshi Temple View Restaurant, Pure Veg & Non-Veg Kitchens, Free Valet Parking, Express Darshan Concierge, AC',
                'Located minutes from the majestic Meenakshi Temple towers, offering royal Chettinad architecture, handcrafted teak interiors, and modern comfort.',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'Svatma Chola Heritage Resort',
                'Thanjavur',
                'Blake Higher Secondary School Road, Thanjavur, Tamil Nadu 613007',
                4.8,
                7800.0,
                'Heritage Deluxe Room, Chola Signature Suite, Royal Sanctuary Villa',
                'Bronze Art Gallery, Carnatic Music Evening, Organic Sattvic Dining, Swimming Pool, Ayurveda Spa, Temple Tour Guide',
                'A living tribute to Tamil art, architecture, and classical music nestled in ancient Thanjavur with heritage architecture and serene courtyards.',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'Rameswaram Sea Palace & Holy Sands',
                'Rameswaram',
                'East Car Street, Near Agnitheertham Beach, Rameswaram, Tamil Nadu 623526',
                4.6,
                4200.0,
                'Standard Ocean View, Deluxe Sea Vista Room, Agnitheertham Suite',
                'Direct Agnitheertham Beach Access, 24-hr Hot Water, Pure Veg Restaurant, Temple Shuttle, AC, Free WiFi',
                'The ideal spiritual getaway offering refreshing sea views, immediate proximity to Ramanathaswamy Temple, and seamless sacred pilgrimage arrangements.',
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'Mahabalipuram Shoreline Grand Bay Resort',
                'Mahabalipuram',
                'East Coast Road, Mahabalipuram, Tamil Nadu 603104',
                4.7,
                8200.0,
                'Bayview Executive Room, Beachfront Cottage, Ocean Villa with Private Plunge Pool',
                'Private Sandy Beach, Infinite Horizon Swimming Pool, Beachfront Barbecue, Ayurvedic Spa, Watersports, Coastal Seafood Bistro',
                'A luxury beach resort along the Coromandel Coast, combining seaside luxury, swaying palms, and quick access to UNESCO shore temples.',
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'Yercaud Misty Mountain Lake Heights',
                'Yercaud',
                'Lake Road, Opp. Anna Park, Yercaud, Salem, Tamil Nadu 636601',
                4.5,
                3800.0,
                'Valley View Deluxe Room, Coffee Estate Cottage, Family Loft',
                'Coffee Plantation Walks, Sunset Lawn, Outdoor Barbecue & Campfire, In-house Cafe, Children Play Area, Free Wi-Fi',
                'Nestled high in the Shevaroy Hills surrounded by aromatic coffee bushes, orange orchards, and panoramic sunset cliffs.',
                'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
            )
        ]
        cursor.executemany('''
            INSERT INTO hotels (agency_id, name, city, address, star_rating, price_per_night, room_types, amenities, description, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', hotels_data)

def seed_transports(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM transports')
    count = cursor.fetchone()['count']
    if count == 0:
        transports_data = [
            (
                1,
                'Premium AC Sedan Private Cab (Toyota Etios / Dzire)',
                'Cab',
                'Chennai',
                'Ooty',
                4500.0,
                10.0,
                'Air Conditioned, Professional Chauffeur, Highway Tolls Covered, Bottled Water, Ample Luggage Space, Sanitized Fleet',
                '06:00 AM (Customizable)',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'
            ),
            (
                1,
                'Toyota Innova Crysta 7-Seater Luxury SUV',
                'Cab',
                'Coimbatore',
                'Kodaikanal',
                3800.0,
                4.5,
                'Captain Luxury Recliner Seats, Rear AC Vents, Hill-Driving Expert Driver, Roof Carrier, USB Fast Chargers, First Aid Kit',
                '07:30 AM (Customizable)',
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
            ),
            (
                4,
                'Scania Multi-Axle AC Sleeper Coach (Tamil Nadu Express)',
                'Bus',
                'Chennai',
                'Madurai',
                1250.0,
                7.5,
                'Clean Sanitized Beds, Individual Charging Ports, Reading Lamps, Mineral Water Bottle, Emergency SOS, Live GPS Tracking',
                '09:30 PM',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
            ),
            (
                4,
                'Mercedes Benz AC Semi-Sleeper Luxury Liner',
                'Bus',
                'Bangalore',
                'Ooty',
                1100.0,
                6.5,
                'Calf-Rest Recliners, AC Climate Control, Free Wifi Onboard, Smooth Air Suspension, Punctual Rest Stops, Audio Entertainment',
                '10:15 PM',
                'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'
            ),
            (
                1,
                'Nilgiri Heritage Mountain Toy Train (Mettupalayam - Ooty)',
                'Train',
                'Mettupalayam',
                'Ooty',
                600.0,
                5.0,
                'UNESCO World Heritage Route, First Class Scenic Window Seats, Rack and Pinion Mountain Engine, Forest & Waterfall Vistas',
                '07:10 AM',
                'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80'
            ),
            (
                1,
                'Southern Superfast Vande Bharat Express (Chennai - Coimbatore)',
                'Train',
                'Chennai Central',
                'Coimbatore Jn',
                1450.0,
                5.8,
                'Executive Chair Car, Onboard Gourmet Catering, 180-Degree Rotating Seats, Automatic Sensor Doors, Bio Vacuum Toilets',
                '05:50 AM',
                'https://images.unsplash.com/photo-1532105956626-9569c0f46d80?auto=format&fit=crop&w=800&q=80'
            ),
            (
                3,
                'Chennai to Madurai Express Air Direct Shuttle',
                'Flight',
                'Chennai (MAA)',
                'Madurai (IXM)',
                3200.0,
                1.1,
                'Direct Non-Stop 1h 10m, 15kg Check-in Luggage + 7kg Cabin, Refreshments Included, Fast Priority Boarding Available',
                '08:45 AM',
                'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80'
            )
        ]
        cursor.executemany('''
            INSERT INTO transports (agency_id, title, transport_type, source_city, destination_city, price, duration_hours, features, departure_time, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', transports_data)
