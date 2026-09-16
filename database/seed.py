# seed admin user
def seed_admin(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM admins')
    count = cursor.fetchone()['count']
    if count == 0:
        cursor.execute('''
            INSERT INTO admins (username, password, email, full_name, role)
            VALUES (%s, %s, %s, %s, %s)
        ''', ('admin', 'admin123', 'admin@roamly.com', 'Super Administrator', 'superadmin'))

# seed sample users
def seed_users(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM users')
    count = cursor.fetchone()['count']
    if count == 0:
        users_data = [
            (
                'traveler',
                'user123',
                'traveler@roamly.com',
                'Ramesh Kumar',
                '+91 9840112233',
                '45 Mount Road, Chennai, Tamil Nadu',
                'Avid explorer and photographer who loves South Indian hill stations and ancient temple architecture.'
            ),
            (
                'priya_travels',
                'user123',
                'priya@roamly.com',
                'Priya Sundaram',
                '+91 9840223344',
                '12 Race Course Road, Coimbatore, Tamil Nadu',
                'Heritage enthusiast and food blogger seeking authentic culinary and cultural experiences.'
            )
        ]
        cursor.executemany('''
            INSERT INTO users (username, password, email, full_name, phone, address, bio)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', users_data)

        # seed user preferences
        cursor.execute('''
            INSERT INTO user_preferences (user_id, preferred_travel_mode, dietary_preference, budget_range, preferred_categories)
            VALUES (1, 'Train', 'Vegetarian', 'Moderate', 'Hill Station, Heritage & Culture')
            ON DUPLICATE KEY UPDATE
                preferred_travel_mode = VALUES(preferred_travel_mode),
                dietary_preference = VALUES(dietary_preference),
                budget_range = VALUES(budget_range),
                preferred_categories = VALUES(preferred_categories)
        ''')
        cursor.execute('''
            INSERT INTO user_preferences (user_id, preferred_travel_mode, dietary_preference, budget_range, preferred_categories)
            VALUES (2, 'Private Car', 'Non-Vegetarian', 'Luxury', 'Heritage & Culture, Coastal & Urban')
            ON DUPLICATE KEY UPDATE
                preferred_travel_mode = VALUES(preferred_travel_mode),
                dietary_preference = VALUES(dietary_preference),
                budget_range = VALUES(budget_range),
                preferred_categories = VALUES(preferred_categories)
        ''')

# seed agencies
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
            ),
            (
                'coastal_travels',
                'agency123',
                'Coromandel Coast & Temple Voyages',
                'Tour Operator',
                'bookings@coastaltravels.com',
                '+91 9444889900',
                'East Coast Road, Mahabalipuram, Tamil Nadu',
                'Active'
            ),
            (
                'chettinad_hospitality',
                'agency123',
                'Chettinad Royal Hospitality & Culinary Tours',
                'Hotel Owner',
                'concierge@chettinadhospitality.com',
                '+91 9443778899',
                'Mansion Street, Kanadukathan, Karaikudi, Tamil Nadu',
                'Active'
            )
        ]
        cursor.executemany('''
            INSERT INTO agencies (username, password, name, agency_type, email, phone, address, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', seed_agencies_data)

# seed packages
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
                'Explore the Queen of Hill Stations. Enjoy scenic toy train rides through the Nilgiri Mountains, peaceful boat rides on Ooty Lake, and lush tea plantation walks.',
                'UNESCO Heritage Toy Train Ride, Ooty Lake Boating, Doddabetta Peak Sunset, Pykara Lake & Falls, Tea Factory Guided Tour',
                '3-Star Resort Stay, Daily Breakfast & Dinner, Private Cab Sightseeing, Toy Train Tickets, Entry Permits',
                'Nilgiri Orthodox Tea Tasting, Freshly Made Mountain Chocolates, Traditional Badaga Herb Roast Dining Experience',
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
                'Kodai Lake Pedal Boating, Coakers Walk Cloud View, Pillar Rocks, Pine Forest Trail, Bryant Park Flora',
                'Lakeview Resort Stay, Breakfast Included, Private Transfers, Boating Vouchers, Guided Trekking',
                'Kodai Artisan Homemade Dark Chocolate Making Workshop, Organic Valley Farm Fresh Continental Breakfast',
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
                'Yercaud Lake Boating, Pagoda Point Sunset, Ladys Seat Valley View, Shevaroy Temple Peak, Bears Cave',
                'Hill View Hotel Stay, Daily Breakfast, Private Car for Sightseeing, Plantation Walk',
                'Freshly Brewed Arabica Estate Coffee Tasting, Wood-Fired Garden Barbecue, Traditional Salem Mango Delicacies',
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
                'Meenakshi Amman Temple Special Darshan, Thirumalai Nayakkar Mahal Light Show, Gandhi Memorial Museum, Heritage Walking Tour',
                'Heritage Hotel Stay, Daily South Indian Breakfast, Temple Guide, AC Airport/Station Transfers',
                'Famous Madurai Jigarthanda Tasting Tour, Authentic Banana Leaf Ghee Podi Dosa & Filter Coffee Experience',
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
                'Discover the vibrant capital of Tamil Nadu. Blend coastal walks on Marina Beach with historic colonial landmarks, ancient temples, and shopping districts.',
                'Marina Beach Sunset Walk, Kapaleeshwarar Temple, Fort St. George Museum, San Thome Cathedral, DakshinaChitra Cultural Village',
                '3-Star City Hotel, Daily Breakfast, Private AC Car, Museum Entry Tickets',
                'Iconic Madras Filter Coffee at Mylapore, Marina Beach Sundal Tasting, Royal South Indian Grand Thali Lunch',
                4.6,
                'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
                5
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
                'Traditional Sattvic Temple Dining, Thanjavur Kadappa & Idiyappam Breakfast, Organic Farm Fresh Meals',
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
                'Journey to the southernmost tips of India. Marvel at the Pamban Sea Bridge, holy waters of Rameswaram, and the confluence of three oceans at Kanyakumari.',
                'Ramanathaswamy Temple Holy Waters Bath, Pamban Sea Bridge View, Vivekananda Rock Memorial Ferry, Thiruvalluvar Statue, Dhanushkodi Ghost Town',
                'Seaview Hotel Stays, Breakfast & Dinner, Private AC Vehicle, Ferry Tickets, Special Temple Entry Pass',
                'Coastal Coconut Curry Feast, Ramanathapuram Sweets, Sunrise Oceanfront Breakfast in Kanyakumari',
                4.9,
                'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
                5
            ),
            (
                'Mahabalipuram Shore Temples & Pondicherry French Quarter',
                'Mahabalipuram & Pondicherry',
                'Coastal & Heritage',
                13200.0,
                4,
                3,
                'Combine UNESCO monolith stone carvings in Mahabalipuram with French colonial architecture, beach cafes, and spiritual tranquility in Auroville Pondicherry.',
                'Mahabalipuram Shore Temple & Pancha Rathas, Krishnas Butter Ball, Pondicherry French Quarter Walking Tour, Auroville Matrimandir View, Promenade Beach',
                'Boutique Beach Resort, Daily Continental & South Indian Breakfast, Private Transport, Guided Heritage Walk',
                'French Bakeries Croissants & Crepes in White Town, Fresh Coastal Catch Barbecue, Pondicherry Wood-Fired Pizza',
                4.8,
                'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
                5
            ),
            (
                'Chettinad Royal Heritage & Culinary Grand Tour',
                'Karaikudi & Chettinad',
                'Heritage & Culture',
                12800.0,
                3,
                2,
                'Walk through majestic 19th-century Chettinad mansions adorned with Burmese teak and Italian marble, while savoring the world-renowned fiery spice gastronomy.',
                'Kanadukathan Palace Tour, Athangudi Handmade Tile Factory Demonstration, Aayiram Jannal Veedu (1000 Window House), Local Antiques Bazaar Walk',
                'Heritage Palace Stay, Gourmet Chettinad Meals Included, Private Chauffeur, Cooking Masterclass',
                'Authentic 7-Course Banana Leaf Chettinad Feast, Vellai Paniyaram & Kuzhi Paniyaram Breakfast, Fresh Pepper & Star Anise Spiced Curries',
                4.9,
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
                6
            ),
            (
                'Valparai Misty Rainforest & Tea Plantation Safari',
                'Valparai, Anamalai Hills',
                'Hill Station',
                11500.0,
                3,
                2,
                'A serene hidden hill station tucked inside the Anamalai Tiger Reserve with 40 hairpin bends, pristine waterfalls, and tea-carpeted slopes.',
                'Aliyar Dam Viewpoint, Sholayar Dam Vista, Monkey Falls, Tea Estate Walking Trail, Lion-Tailed Macaque Wildlife Spotting',
                'Colonial Tea Estate Bungalow Stay, All Meals Included, Guided Rainforest Trek, 4x4 Mountain Transfers',
                'High-Grown Single-Origin Tea Tasting, Hill Country Herbal Stews, Freshly Prepared Malabar & Tamil Foothill Delicacies',
                4.7,
                'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80',
                3
            ),
            (
                'Mudumalai Jungle Wildlife & Tiger Reserve Safari',
                'Mudumalai & Theppakadu',
                'Wildlife & Nature',
                13500.0,
                3,
                2,
                'Experience untamed wildlife at the foothills of Nilgiris. Encounter Asian elephants, spotted deer, peacocks, and majestic Bengal tigers.',
                'Open Jeep Jungle Safari in Mudumalai Core Area, Theppakadu Elephant Camp Visit, Moyar River Gorge View, Night Stargazing Experience',
                'Jungle Resort Cottage Stay, Daily Buffet Breakfast & Campfire Dinner, 2 Forest Safari Permits, Wildlife Naturalist Guide',
                'Bonfire Barbecue Buffet, Authentic Nilgiri Spiced Camp Meals, Fresh Organic Forest Honey & Herbal Brews',
                4.8,
                'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
                3
            ),
            (
                'Courtallam Spa Falls & Tenkasi Temple Circuit',
                'Courtallam & Tenkasi',
                'Nature & Pilgrimage',
                8900.0,
                3,
                2,
                'Revitalize in the natural herb-infused waterfalls of Courtallam, known as the Spa of South India, paired with ancient Western Ghats temple heritage.',
                'Main Falls Herbal Bath, Five Falls (Aintharuvi), Old Courtallam Cascade, Tenkasi Kasi Viswanathar Temple Darshan, Spice Plantation Walk',
                'Nature Resort Stay, Daily South Indian Breakfast & Dinner, Private Transport, Local Assistance',
                'World-Famous Tirunelveli Hot Wheat Halwa Tasting, Tenkasi Pepper Fry Dosa, Herbal Leaf Infused Immunity Tea',
                4.6,
                'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
                5
            )
        ]
        cursor.executemany('''
            INSERT INTO packages (title, destination, category, price, duration_days, duration_nights, description, highlights, included_amenities, food_highlights, rating, image_url, agency_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', seed_packages_data)

# seed hotels
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
                'Colonial charm in the Nilgiri hills with sweeping tea garden vistas, cozy heritage suites, and vintage afternoon high tea.',
                'In-house Colonial Dining Room serving British High Tea, Badaga Spiced Feasts, and Warm English Pudding',
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
                'Lakefront Coffee Shop & Restaurant serving South Indian Buffet, Homemade Kodai Soups, and Wood-Fired Pastries',
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
                'Rooftop View Temple Dining serving Ghee Podi Uttapam, Madurai Kari Dosa, and Fresh Jigarthanda Shakes',
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
                'Nalandha Pure Vegetarian Gourmet Restaurant serving Culinary Heritage Recipes from Tanjore Royal Palace Archives',
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
                'Agnitheertham Pure Vegetarian Kitchen serving Authentic South Indian Brahmin Meals and Temple Prasadam',
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
                'The Bay Grill serving Catch of the Day Seafood, Wood-Fired Seafood Barbecue, and Continental Sunset Cocktails',
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
                'The Hill Top Coffee House with Fresh Arabica Brews, Charcoal Barbecue, and Homemade Plantation Marmalades',
                'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
            ),
            (
                6,
                'The Bangala Royal Heritage Palace',
                'Karaikudi, Chettinad',
                'Devakottai Road, Senjai, Karaikudi, Tamil Nadu 630001',
                4.9,
                9500.0,
                'Heritage Mansion Suite, Courtyard Deluxe, Royal Palatial Room',
                'Heritage Courtyard, Award-Winning Chettinad Kitchen, Swimming Pool, Library of Antique Books, Cooking Masterclasses',
                'World-renowned heritage luxury mansion delivering legendary Chettinad hospitality, hand-pressed floor tiles, and unforgettable culinary feasts.',
                'Grand Master Chef Chettinad Dining Room serving Hand-Ground Spices, Crab Curry, Kozhi Varuval, and Coconut Milk Paniyaram',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'Chennai Marina Grand Bay Hotel & Suites',
                'Chennai',
                'Radhakrishnan Salai, Near Marina Beach, Chennai, Tamil Nadu 600004',
                4.7,
                5800.0,
                'Superior City Room, Marina Sea View Executive, Presidential Suite',
                'Rooftop Infinity Pool, 24-hr Fitness Center, High-Speed Business Lounge, 3 Specialty Restaurants, Free Airport Shuttle',
                'Modern urban elegance located walking distance from the Marina coastline, offering upscale amenities, fine dining, and prime city connectivity.',
                'Coromandel Spice Fine Dining Restaurant serving Madras Fish Curry, Filter Coffee Tiramisu, and Global Cuisine Buffet',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'Kanyakumari Cape View Ocean Sands Resort',
                'Kanyakumari',
                'Kovalam Road, Near Sunset Point, Kanyakumari, Tamil Nadu 629702',
                4.8,
                4600.0,
                'Sunrise Ocean View Deluxe, Horizon Family Suite, Vivekananda Vista Chalet',
                'Panoramic Ocean Terrace, Direct Beach Walkway, Multi-Cuisine Seafood Restaurant, Swimming Pool, Travel Concierge',
                'Spectacular oceanfront retreat overlooking the confluence of the Indian Ocean, Arabian Sea, and Bay of Bengal with unobstructed sunrise and sunset vistas.',
                'Ocean Waves Terrace Restaurant serving Fresh Fish Fry, Kerala-Tamil Malabar Curries, and Coconut Water Breakfast',
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
            )
        ]
        cursor.executemany('''
            INSERT INTO hotels (agency_id, name, city, address, star_rating, price_per_night, room_types, amenities, description, dining_options, image_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', hotels_data)

# seed transports
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
                'Complimentary Bottled Water, Wet Tissues, and Tamil Nadu Route Snack Box',
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
                'Chilled Mineral Water, Herbal Hill Lozenges, and Fresh Fruit Basket Onboard',
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
                'Bottled Water and Highway Restaurant Dinner Break at Trichy Highway Food Plaza',
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
                'Comfort Kit with Blanket, Pillow, Mineral Water, and Morning Filter Coffee Voucher',
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
                'Station Fresh Vada, Masala Tea, and Ooty Biscuit Snacks at Hill Stops',
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
                'Executive Gourmet Breakfast (Hot Idli, Vada, Upma, Fresh Juice, and South Indian Filter Coffee)',
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
                'Onboard Fruit Juice, Warm Savory Pastry, and Tea/Coffee Service',
                'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80'
            ),
            (
                1,
                'Luxury Force Urbania 12-Seater Group Van (ECR Coastal Highway)',
                'Cab',
                'Chennai',
                'Pondicherry',
                5500.0,
                3.0,
                'Individual Recliner Leather Seats, Ambient LED Lighting, Panoramic Windows, USB Ports at Every Seat, High Roof Clearance',
                '07:00 AM (Customizable)',
                'Chilled Juices, Energy Bars, Mineral Water, and Coastal Road Cafe Stop',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'
            ),
            (
                4,
                'Volvo B11R Multi-Axle Luxury Sleeper (Southern Coastal Express)',
                'Bus',
                'Madurai',
                'Kanyakumari',
                850.0,
                4.5,
                'Individual LCD Entertainment Screens, Clean Beds, Charging Sockets, Real-time Tracking, Air Suspension',
                '06:00 AM',
                'Breakfast Rest Stop with Traditional Tirunelveli Dosa and Tea',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
            ),
            (
                1,
                'Southern Vande Bharat Express (Chennai - Tirunelveli)',
                'Train',
                'Chennai Egmore',
                'Tirunelveli Jn',
                1650.0,
                7.8,
                'Executive Chair Car, Onboard Dining, Soundproof Coaches, CCTV Surveillance, Scenic Western Ghats Views',
                '02:50 PM',
                'Evening High Tea Snacks & Full 3-Course Vegetarian or Non-Vegetarian Dinner',
                'https://images.unsplash.com/photo-1532105956626-9569c0f46d80?auto=format&fit=crop&w=800&q=80'
            )
        ]
        cursor.executemany('''
            INSERT INTO transports (agency_id, title, transport_type, source_city, destination_city, price, duration_hours, features, departure_time, meal_service, image_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', transports_data)

# seed reviews
def seed_reviews(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM reviews')
    count = cursor.fetchone()['count']
    if count == 0:
        reviews_data = [
            (
                1,
                'package',
                1,
                5,
                'Magical Ooty Hills and Toy Train Experience!',
                'The UNESCO Toy Train journey was breathtaking. Our driver and guide from Tamil Nadu Grand Holiday Travels took amazing care of our family. The resort in Ooty was cozy and the tea estate tour was super informative!',
                'Family',
                1
            ),
            (
                2,
                'package',
                1,
                5,
                'Wonderful Holiday with Scenic Vistas',
                'Everything was seamless, from airport pickup in Coimbatore to the Pykara lake boat ride. High quality accommodations and wonderful food.',
                'Couple',
                1
            ),
            (
                1,
                'package',
                4,
                5,
                'Soulful Spiritual & Heritage Pilgrimage in Madurai',
                'The special darshan arrangements at Meenakshi Amman Temple saved hours. The food walk in Madurai with Jigarthanda tasting was a treat. Highly recommended!',
                'Family',
                1
            ),
            (
                2,
                'package',
                9,
                5,
                'Chettinad Hospitality and Food Masterclass Was Unbeatable',
                'Staying in a century-old mansion and eating 7-course authentic spicy Chettinad feasts was the highlight of our Tamil Nadu tour. Truly majestic!',
                'Friends',
                1
            ),
            (
                1,
                'hotel',
                1,
                5,
                'Exceptional Colonial Charm in Ooty',
                'The Savoy Heritage Resort has pristine gardens, heated fireplaces in the suites, and vintage afternoon tea. Staff is extremely polite and hospitable.',
                'Couple',
                1
            ),
            (
                2,
                'hotel',
                3,
                5,
                'Unrivaled Temple View from Rooftop',
                'Waking up to the towering gopurams of Meenakshi Temple right from the rooftop restaurant was surreal. Rooms are clean, modern, and spacious.',
                'Family',
                1
            ),
            (
                1,
                'hotel',
                8,
                5,
                'Living in a Palatial Masterpiece',
                'The Bangala in Karaikudi is a national treasure. Incredible teak pillars, Athangudi tiled corridors, and the most delicious cuisine in South India.',
                'Couple',
                1
            ),
            (
                1,
                'transport',
                1,
                5,
                'Smooth, Punctual and Courteous Chauffeur',
                'Our Nilgiri Cabs driver arrived 15 minutes before time at Chennai Central. Very safe driving on the Nilgiri ghat hairpin bends. Clean and sanitized vehicle.',
                'Solo',
                1
            ),
            (
                2,
                'transport',
                6,
                5,
                'Vande Bharat Comfort and Delicious Hot Meals',
                'Chennai to Coimbatore in under 6 hours with 180-degree rotating seats and hot South Indian breakfast. 10/10 travel experience.',
                'Business',
                1
            )
        ]
        cursor.executemany('''
            INSERT INTO reviews (user_id, item_type, item_id, rating, title, comment, travel_type, verified_booking)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', reviews_data)

# seed notifications
def seed_notifications(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM notifications')
    count = cursor.fetchone()['count']
    if count == 0:
        notifs_data = [
            (
                1,
                'Welcome to Roamly Travel Network',
                'Discover handpicked Tamil Nadu holiday packages, heritage resort stays, and verified transport transit.',
                'system',
                '/packages',
                0
            ),
            (
                1,
                'Travel Advisory: Nilgiri Mountains Weather',
                'Pleasant mountain weather reported across Ooty and Kodaikanal. Carry light woolens for evening strolls.',
                'trip',
                '/packages',
                0
            )
        ]
        cursor.executemany('''
            INSERT INTO notifications (user_id, title, message, notification_type, link_url, is_read)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', notifs_data)

# seed wishlist items
def seed_saved_items(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM saved_items')
    count = cursor.fetchone()['count']
    if count == 0:
        saved_data = [
            (1, 'package', 1),
            (1, 'hotel', 1),
            (1, 'package', 4)
        ]
        cursor.executemany('''
            INSERT INTO saved_items (user_id, item_type, item_id)
            VALUES (%s, %s, %s)
        ''', saved_data)

# seed promo coupons
def seed_coupons(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM coupons')
    count = cursor.fetchone()['count']
    if count == 0:
        coupons_data = [
            ('ROAMFIRST', 'percentage', 15.00, 2000.00, 1500.00, 'Flat 15% discount for first-time bookings', 1),
            ('SUMMER20', 'percentage', 20.00, 3000.00, 2000.00, '20% Summer holiday discount across hill stations', 1),
            ('TAMIL15', 'percentage', 15.00, 1500.00, 1000.00, '15% savings on Tamil Nadu heritage packages', 1),
            ('EXPLORE10', 'percentage', 10.00, 1000.00, 800.00, '10% instant discount on hotels and transports', 1),
            ('FLAT500', 'flat', 500.00, 2500.00, 500.00, 'Flat ₹500 discount on cart value above ₹2500', 1)
        ]
        cursor.executemany('''
            INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, description, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', coupons_data)

# seed user wallets
def seed_wallets(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM wallets')
    count = cursor.fetchone()['count']
    if count == 0:
        cursor.execute('''
            INSERT INTO wallets (user_id, balance, currency)
            VALUES (1, 5000.00, 'INR')
        ''')
        cursor.execute('''
            INSERT INTO wallets (user_id, balance, currency)
            VALUES (2, 7500.00, 'INR')
        ''')
        cursor.execute('''
            INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
            VALUES (1, 5000.00, 'Credit', 'Welcome promotional travel credits', 'CREDIT-WELCOME-01')
        ''')
        cursor.execute('''
            INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
            VALUES (2, 7500.00, 'Credit', 'Welcome promotional travel credits', 'CREDIT-WELCOME-02')
        ''')

# seed agency payouts
def seed_payouts(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM agency_payouts')
    count = cursor.fetchone()['count']
    if count == 0:
        payouts_data = [
            (1, 45000.00, 4500.00, 40500.00, 'HDFC Bank - A/C 50100238491021 (IFSC: HDFC0000123)', 'Approved'),
            (2, 62000.00, 6200.00, 55800.00, 'SBI Bank - A/C 30492819201 (IFSC: SBIN0001452)', 'Pending'),
            (3, 38000.00, 3800.00, 34200.00, 'ICICI Bank - A/C 00192837461 (IFSC: ICIC0000088)', 'Processed')
        ]
        cursor.executemany('''
            INSERT INTO agency_payouts (agency_id, amount, commission_amount, net_payout, bank_account_info, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', payouts_data)


