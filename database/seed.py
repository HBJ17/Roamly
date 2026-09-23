"""
Roamly Database Seed Data Module
Seeds well-known national and state travel agencies, iconic holiday packages across India,
prestigious hotels, and high-speed transit routes.
"""
from utils.security import hash_password

# seed admin user
def seed_admin(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM admins')
    count = cursor.fetchone()['count']
    if count == 0:
        cursor.execute('''
            INSERT INTO admins (username, password, email, full_name, role)
            VALUES (%s, %s, %s, %s, %s)
        ''', ('admin', hash_password('admin123'), 'admin@roamly.com', 'Super Administrator', 'superadmin'))

# seed sample users
def seed_users(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM users')
    count = cursor.fetchone()['count']
    if count == 0:
        users_data = [
            (
                'traveler',
                hash_password('user123'),
                'traveler@roamly.com',
                'Ramesh Kumar',
                '+91 9840112233',
                '45 Mount Road, Chennai, Tamil Nadu',
                'Avid explorer and photographer who loves South Indian hill stations, heritage temples, and Himalayan trails.'
            ),
            (
                'priya_travels',
                hash_password('user123'),
                'priya@roamly.com',
                'Priya Sundaram',
                '+91 9840223344',
                '12 Race Course Road, Coimbatore, Tamil Nadu',
                'Heritage enthusiast, food blogger, and road-tripper seeking authentic cultural experiences across India.'
            ),
            (
                'aarav_explorer',
                hash_password('user123'),
                'aarav@roamly.com',
                'Aarav Sharma',
                '+91 9811223344',
                'B-42 Connaught Place, New Delhi',
                'Mountain trekker and wildlife enthusiast exploring high-altitude passes and coastal escapes.'
            )
        ]
        cursor.executemany('''
            INSERT INTO users (username, password, email, full_name, phone, address, bio)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', users_data)

        # seed user preferences
        cursor.execute('''
            INSERT INTO user_preferences (user_id, preferred_travel_mode, dietary_preference, budget_range, preferred_categories)
            VALUES (1, 'Train', 'Vegetarian', 'Moderate', 'Hill Station, Heritage & Culture, Pilgrimage & Coastal')
        ''')
        cursor.execute('''
            INSERT INTO user_preferences (user_id, preferred_travel_mode, dietary_preference, budget_range, preferred_categories)
            VALUES (2, 'Private Car', 'Non-Vegetarian', 'Luxury', 'Heritage & Culture, Coastal & Beach, Nature & Wellness')
        ''')

# seed 6 recognized partner agencies
def seed_agencies(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM agencies')
    count = cursor.fetchone()['count']
    if count == 0:
        seed_agencies_data = [
            (
                'makemytrip',
                hash_password('agency123'),
                'MakeMyTrip Holidays & Expeditions',
                'Travel Brand',
                'holidays@makemytrip.com',
                '+91 124 4628747',
                'DLF Cyber City, Tower A, Gurugram, Delhi NCR',
                'Active'
            ),
            (
                'taj_hotels',
                hash_password('agency123'),
                'Taj & IHCL Luxury Palace Resorts',
                'Hotel Owner',
                'reservations@ihcltata.com',
                '+91 22 66653366',
                'Apollo Bunder, Colaba, Mumbai, Maharashtra',
                'Active'
            ),
            (
                'zingbus_fleet',
                hash_password('agency123'),
                'Zingbus Intercity Express & Cabs',
                'Cab Service',
                'support@zingbus.com',
                '+91 1800 1028747',
                'Sector 44, Gurugram, Delhi NCR',
                'Active'
            ),
            (
                'thomas_cook',
                hash_password('agency123'),
                'Thomas Cook India Grand Expeditions',
                'Tour Operator',
                'customercare@thomascook.in',
                '+91 22 42427000',
                'Dr. D.N. Road, Fort, Mumbai, Maharashtra',
                'Active'
            ),
            (
                'southern_travels',
                hash_password('agency123'),
                'Southern Travels & Tamil Nadu Tourism (TTDC)',
                'Travel Brand',
                'contact@southerntravels.in',
                '+91 44 28460280',
                'Wallajah Road, Triplicane, Chennai, Tamil Nadu',
                'Active'
            ),
            (
                'club_mahindra',
                hash_password('agency123'),
                'Club Mahindra Wilderness & Hill Resorts',
                'Hotel Owner',
                'memberrelations@clubmahindra.com',
                '+91 1800 2668800',
                'Mahindra Towers, P.K. Kurne Chowk, Worli, Mumbai',
                'Active'
            )
        ]
        cursor.executemany('''
            INSERT INTO agencies (username, password, name, agency_type, email, phone, address, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', seed_agencies_data)

# seed well-known packages across India
def seed_packages(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM packages')
    count = cursor.fetchone()['count']
    if count == 0:
        seed_packages_data = [
            (
                'Golden Triangle Royal Heritage Tour (Delhi - Agra - Jaipur)',
                'Delhi, Agra & Jaipur',
                'Heritage & Culture',
                18500.0,
                5,
                4,
                'Experience the golden era of Mughal and Rajputana royalty. Marvel at the Taj Mahal at sunrise, walk the halls of Agra Fort, climb the ramparts of Amber Fort in Jaipur, and explore Old Delhi markets.',
                'Taj Mahal Sunrise View, Agra Fort, Qutub Minar, Amber Fort Elephant Trail, Hawa Mahal & City Palace Jaipur, Chandni Chowk Rickshaw Safari',
                '5-Star Heritage Hotel Stay, Private AC Chauffeur Sedan, Daily Buffet Breakfast & Dinner, Monuments Fast-Track Passes, Licensed Guide',
                'Old Delhi Street Food Walk (Paranthe Wali Gali), Mughlai Handi Biryani Dinner in Agra, Royal Rajasthani Dal Baati Churma Thali in Jaipur',
                4.9,
                'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
                1
            ),
            (
                'Kashmir Valley, Dal Lake & Gulmarg Snow Peaks',
                'Srinagar, Gulmarg & Pahalgam, Kashmir',
                'Hill Station',
                22000.0,
                6,
                5,
                'Discover paradise on earth with snow-capped Pir Panjal peaks, peaceful Shikara rides on Dal Lake, meadow walks in Pahalgam, and the world-famous Gulmarg Gondola cable car.',
                'Dal Lake Shikara Cruise at Sunset, Luxury Houseboat Stay, Gulmarg Phase 2 Gondola Cable Car Ride, Betaab Valley Horse Trail, Mughal Gardens Nishat & Shalimar',
                'Deluxe Heritage Houseboat Stay, Pine Valley Resort in Pahalgam, Daily Breakfast & Wazwan Dinners, Private 4x4 Mountain Scorpio, Gondola Tickets',
                'Traditional Kashmiri 7-Course Wazwan Feast (Rogan Josh & Gushtaba), Saffron Kehwa Tea with Almonds, Kashmiri Pulao & Nadru Yakhni',
                5.0,
                'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80',
                4
            ),
            (
                'Kerala Backwaters, Munnar Hills & Alleppey Houseboat',
                'Munnar & Alleppey, Kerala',
                'Nature & Wellness',
                16800.0,
                5,
                4,
                'Serene palm-fringed backwaters, rolling emerald tea estates in Munnar, aromatic spice plantations in Thekkady, and an overnight luxury houseboat cruise through Alleppey.',
                'Munnar Tea Plantation Walking Trail, Eravikulam National Park Nilgiri Tahr Spotting, Periyar Lake Wildlife Boat Safari, Private Alleppey Houseboat Overnight Cruise',
                'Colonial Tea Chalet Stay, Private Air-Conditioned Deluxe Houseboat, All Houseboat Meals, Spice Plantation Guided Walk, Airport Transfers',
                'Traditional Kerala Sadya on Fresh Banana Leaf, Alleppey Karimeen Pollichathu (Pearl Spot Fish), Appam with Vegetable Stew & Coconut Milk',
                4.9,
                'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
                1
            ),
            (
                'Tamil Nadu Grand Temple & Coastal Heritage Trail',
                'Madurai, Rameswaram & Kanyakumari, Tamil Nadu',
                'Pilgrimage & Coastal',
                14500.0,
                5,
                4,
                'Journey through sacred temples, historic sea bridges, and the confluence of three oceans. Explore Madurai Meenakshi Amman Temple, Pamban Sea Bridge, and Kanyakumari sunrise.',
                'Meenakshi Amman Temple Golden Tower Darshan, Pamban Sea Bridge Train View, Ramanathaswamy 22 Sacred Theerthams, Dhanushkodi Ghost Town, Vivekananda Rock Memorial Sunrise',
                '3-Star Heritage Hotels, Daily South Indian Buffet Breakfast, Private AC Sightseeing Vehicle, Temple Guide, Ferry Tickets',
                'Authentic Madurai Jigarthanda Tasting, Banana Leaf Ghee Roast Dosa & Filter Coffee, Coastal Tamil Coconut Fish Curry & Tirunelveli Halwa',
                4.9,
                'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
                5
            ),
            (
                'Royal Rajasthan Palaces & Thar Desert Safari',
                'Udaipur, Jodhpur & Jaisalmer, Rajasthan',
                'Heritage & Culture',
                24500.0,
                6,
                5,
                'Immerse yourself in royal Rajputana heritage. Glide over Lake Pichola in Udaipur, scale Mehrangarh Fort in Jodhpur, and sleep under desert stars in the golden sand dunes of Jaisalmer.',
                'Lake Pichola Sunset Boat Cruise, Jag Mandir Palace, Mehrangarh Fort Tower Tour, Jaisalmer Golden Fort, Sam Sand Dunes Camel Safari & Luxury Tent Campfire',
                'Heritage Haveli & Luxury Desert Camp Stay, Daily Breakfast & Camp Dinner, Private AC SUV Transfers, Desert Safari, Folk Dance Access',
                'Royal Marwari Thali, Junglee Maas & Laal Maas Specialty, Desert Campfire Barbecue with Mawa Kachori & Masala Chai',
                4.8,
                'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
                1
            ),
            (
                'Goa Coastal Sun, Beaches & Portuguese Heritage',
                'North & South Goa',
                'Coastal & Beach',
                13900.0,
                4,
                3,
                'Sun-kissed beaches, thrilling water sports, UNESCO Portuguese churches, vibrant flea markets, and sunset catamaran cruises along the Arabian Sea.',
                'Baga & Calangute Beach Watersports, Basilica of Bom Jesus UNESCO Heritage, Fontainhas Latin Quarter Photo Walk, Mandovi River Sunset Catamaran Cruise, Dudhsagar Waterfalls Jeep Trek',
                '4-Star Beachside Resort Stay, Daily Breakfast, Private AC Airport & Sightseeing Car, Catamaran Cruise Passes, Watersports Voucher',
                'Authentic Goan Fish Curry Thali, Prawn Balchao, Bebinca Layered Cake & Tropical Feni Cocktails at Beach Shacks',
                4.7,
                'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
                4
            ),
            (
                'Leh-Ladakh High Altitude Himalayan Odyssey',
                'Leh, Nubra Valley & Pangong Lake, Ladakh',
                'Adventure & Mountain',
                29000.0,
                7,
                6,
                'Cross the highest motorable mountain passes in the world. Witness the color-shifting waters of Pangong Tso Lake, ride double-humped camels in Nubra Valley, and visit ancient cliffside monasteries.',
                'Pangong Tso Color-Changing Lake, Khardung La Pass (17,982 ft), Nubra Valley Hunder Sand Dunes Double-Humped Camel Ride, Diskit Monastery Giant Buddha, Magnetic Hill',
                'Boutique Hotel in Leh & Luxury Swiss Tent at Pangong, Oxygen Cylinders Onboard, 4x4 Luxury Scorpio, All Inner Line Permits, All Meals',
                'Traditional Ladakhi Thukpa, Steamed Yak Cheese Momos, Butter Tea (Gur Gur Chai), Hot Wood-Fired Stews at Mountain Passes',
                5.0,
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
                4
            ),
            (
                'Ooty & Nilgiri Mountain Steam Toy Train Escape',
                'Ooty & Coonoor, Tamil Nadu',
                'Hill Station',
                12500.0,
                4,
                3,
                'Escape into the misty blue mountains of Nilgiris. Ride the UNESCO heritage steam toy train, wander around tranquil Ooty Lake, and breathe fresh aroma in century-old tea gardens.',
                'UNESCO Heritage Steam Toy Train Ride, Ooty Lake Boating, Doddabetta Peak Panoramic View, Sim\'s Park Coonoor, Single-Origin High-Grown Tea Factory Tour',
                'Colonial Heritage Resort Stay, Daily Breakfast & Dinner, Private Sightseeing Cab, Toy Train Reserved First Class Tickets, Entry Permits',
                'Nilgiri Orthodox Tea Tasting, Fresh Handmade Mountain Chocolates, Badaga Herbal Roast Dining & South Indian Filter Coffee',
                4.8,
                'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80',
                5
            ),
            (
                'Varanasi Spiritual Ganges & Sarnath Odyssey',
                'Varanasi, Uttar Pradesh',
                'Heritage & Culture',
                9800.0,
                3,
                2,
                'Witness timeless spirituality on the banks of the sacred Ganges River. Experience the mesmerizing evening Maha Aarti, sunrise boat ride, and the historic Buddhist ruins of Sarnath.',
                'Dashashwamedh Ghat Grand Evening Ganga Aarti, Sunrise Wooden Boat Ride on Sacred Ganges, Kashi Vishwanath Golden Temple Corridor, Sarnath Deer Park & Dhamek Stupa',
                'Ganga Riverside Heritage Hotel, Daily Breakfast, Private AC Car, Private Boat with Priest for Aarti, Temple Special Darshan Pass',
                'Authentic Banarasi Malaiyo, Kachori Jalebi Breakfast on Ghats, Banarasi Paan Tasting, Thandai with Saffron & Pistachio',
                4.9,
                'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
                1
            ),
            (
                'Andaman Coral Islands & Radhanagar Beach Paradise',
                'Port Blair & Havelock Island, Andaman',
                'Coastal & Beach',
                26500.0,
                5,
                4,
                'Pristine turquoise waters, white sand beaches, and coral reefs. Relax on Radhanagar Beach (voted Asia’s best beach), explore Cellular Jail history, and snorkel in vibrant sea waters.',
                'Radhanagar Beach Sunset, Cellular Jail Light & Sound Show, Elephant Beach Coral Snorkeling, Makruzz High-Speed Sea Catamaran Ride, Kalapathar Beach Sunrise',
                'Beach Villa Resort Stay, High-Speed Ferry Tickets, Daily Breakfast & Seafood Dinner, Snorkeling Gear & Instructor, Private AC Transfers',
                'Fresh Coconut Crab Curry, Ocean Catch Grilled Fish, Tropical Mango Coconut Shakes & Beachside Barbecue',
                4.9,
                'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
                4
            )
        ]
        cursor.executemany('''
            INSERT INTO packages (title, destination, category, price, duration_days, duration_nights, description, highlights, included_amenities, food_highlights, rating, image_url, agency_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', seed_packages_data)

# seed premier hotels across India
def seed_hotels(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM hotels')
    count = cursor.fetchone()['count']
    if count == 0:
        hotels_data = [
            (
                2,
                'The Taj Mahal Palace',
                'Mumbai, Maharashtra',
                'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001',
                5.0,
                14500.0,
                'Luxury Sea Facing Room, Tower Deluxe Room, Presidential Grand Suite',
                'Gateway of India Sea Vista, Swimming Pool, Jiva Spa, 9 Fine Dining Specialty Restaurants, 24/7 Butler Service, High-Speed WiFi',
                'Legendary 1903 flagship luxury hotel overlooking the Gateway of India and the Arabian Sea with royal architecture and world-class hospitality.',
                'Wasabi by Morimoto (Japanese), Golden Dragon (Sichuan), Shamiana 24-hr Coffee Shop, and Sea Lounge Afternoon High Tea',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'The Oberoi Udaivilas',
                'Udaipur, Rajasthan',
                'Haridas Ji Ki Magri, Mulla Talai, Udaipur, Rajasthan 313001',
                5.0,
                18000.0,
                'Premier Lake View Room, Luxury Suite with Private Pool, Kohinoor Royal Villa',
                'Private Boat Arrival across Lake Pichola, Semi-Private Moat Pools, Royal Peacock Courtyards, Ayurvedic Spa, Fine Dining',
                'Set on the banks of Lake Pichola with majestic domes, hand-painted frescoes, reflection pools, and 50 acres of royal gardens.',
                'Suryamahal & Chandni serving Royal Rajasthani Mewari Thalis, European Classics, and Lakeside Candlelight Dining',
                'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'ITC Grand Chola, a Luxury Collection Hotel',
                'Chennai, Tamil Nadu',
                '63 Mount Road, Guindy, Chennai, Tamil Nadu 600032',
                5.0,
                9500.0,
                'Executive Club Room, The Towers Luxury Room, Chola Grand Suite',
                'Imperial Chola White Marble Architecture, 3 Swimming Pools, Kaya Kalp Royal Spa, Heliport, 10 Gourmet Restaurants, Valet Parking',
                'Palatial grandeur inspired by the ancient Chola Empire with 1 million square feet of carved white Italian marble, grand pillars, and regal luxury.',
                'Peshawri (Tandoori & Kebabs), Madras Pavilion (Grand World Buffet), Pan Asian, and Royal South Indian Cuisines',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
            ),
            (
                6,
                'Wildflower Hall, An Oberoi Resort',
                'Shimla, Himachal Pradesh',
                'Chharabra, Shimla, Himachal Pradesh 171012',
                5.0,
                16500.0,
                'Premier Mountain View Room, Deluxe Pine View Room, Lord Kitchener Suite',
                'Outdoor Heated Infinity Whirlpool over Himalayas, Cedar Forest Sanctuary, Billiards Room, Tennis Courts, Mountain Biking, Spa',
                'Former residence of Lord Kitchener nestled 8,250 feet high in the Himalayas surrounded by 22 acres of virgin pine and cedar forests.',
                'The Restaurant with Open-Air Terrace serving Himachali Sepu Vadi, Pan-Asian Delicacies, and Wood-Fired Pastries',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'
            ),
            (
                6,
                'Kumarakom Lake Resort',
                'Kumarakom, Kerala',
                'Vembanad Lake, Kumarakom, Kottayam, Kerala 686563',
                4.9,
                12800.0,
                'Heritage Meandering Pool Villa, Presidential Pool Villa, Traditional Backwater Chalet',
                'Meandering 250m Swimming Pool connecting Villas, Sunset Lake Cruise, Ayurmana Ayurveda Hospital, Traditional Kathakali Evenings',
                'Ranked among the finest luxury resorts in India, featuring 16th-century reconstructed wooden ancestral homes on the shores of Lake Vembanad.',
                'Ettukettu Heritage Multi-Cuisine Restaurant and Seafood Bar on the Backwaters serving Fresh Crab and Pearl Spot Curry',
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'
            ),
            (
                2,
                'Savoy - IHCL SeleQtions',
                'Ooty, Tamil Nadu',
                '77 Sylks Road, Monterosa, Ooty, Nilgiris, Tamil Nadu 643001',
                4.8,
                7800.0,
                'Colonial Superior Room, Heritage Deluxe Cottage, Nilgiri Suite',
                '180-Year-Old English Heritage Estate, Log Fireplaces in Every Room, Afternoon Tea on Lawns, Billiards, Badminton, Spa',
                'Dating back to 1841, Savoy captures the timeless colonial romance of the Nilgiri hills with wood-beamed ceilings and vintage gardens.',
                'The Dining Hall serving British Roast Classics, Badaga Tribal Spiced Mutton, and Warm Steamed Chocolate Puddings',
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
            )
        ]
        cursor.executemany('''
            INSERT INTO hotels (agency_id, name, city, address, star_rating, price_per_night, room_types, amenities, description, dining_options, image_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', hotels_data)

# seed premier transports across India
def seed_transports(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM transports')
    count = cursor.fetchone()['count']
    if count == 0:
        transports_data = [
            (
                1,
                'Southern Vande Bharat Superfast Express (Chennai - Coimbatore)',
                'Train',
                'Chennai Central',
                'Coimbatore Jn',
                1450.0,
                5.8,
                'Executive Chair Car, Onboard Gourmet Catering, 180-Degree Rotating Recliner Seats, WiFi, Panoramic Windows, Bio-Vacuum Toilets',
                '05:50 AM',
                'Executive Gourmet Breakfast (Hot Idli, Medu Vada, Upma, Fresh Fruit Juice, and South Indian Filter Coffee)',
                'https://images.unsplash.com/photo-1532105956626-9569c0f46d80?auto=format&fit=crop&w=800&q=80'
            ),
            (
                1,
                'Northern Vande Bharat Express (Delhi - Varanasi Superfast)',
                'Train',
                'New Delhi',
                'Varanasi Cantt',
                1750.0,
                8.0,
                'High-Speed 130 km/h Running, Executive AC Luxury, Soundproof Coaches, CCTV Security, Bio-Vacuum Restrooms, GPS Tracking',
                '06:00 AM',
                'Complimentary 3-Course Hot Lunch with Paneer Butter Masala, Dal Makhani, Parathas, and Gulab Jamun',
                'https://images.unsplash.com/photo-1532105956626-9569c0f46d80?auto=format&fit=crop&w=800&q=80'
            ),
            (
                3,
                'Zingbus Multi-Axle Volvo AC Sleeper (Bengaluru - Ooty)',
                'Bus',
                'Bengaluru (Majestic)',
                'Ooty (Charring Cross)',
                1200.0,
                7.0,
                'Sanitized Sleeping Pods, Individual Type-C Fast Chargers, Premium Air Suspension, Live GPS Link, Emergency SOS, Reading Lamps',
                '10:30 PM',
                'Welcome Chilled Water Bottle, Fruit Juice, and Highway Food Court Dinner Stop',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
            ),
            (
                1,
                'MakeMyTrip Private Chauffeur Innova Crysta (Delhi - Agra - Jaipur)',
                'Cab',
                'New Delhi',
                'Agra / Jaipur',
                4800.0,
                4.5,
                'Dedicated Uniformed Chauffeur, Yamuna Expressway FastTag Tolls Included, Dual AC, Sanitized Fleet, Mineral Water, Flexible Stops',
                '06:30 AM (Customizable)',
                'Chilled Bottled Water, Wet Tissues, and Route Highway Confectionery Box',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'
            ),
            (
                5,
                'Nilgiri UNESCO Heritage Mountain Toy Train (Mettupalayam - Ooty)',
                'Train',
                'Mettupalayam',
                'Ooty (Udagamandalam)',
                650.0,
                4.8,
                'UNESCO Heritage Steam Rack Engine, First Class Wooden Window Carriages, 250 Bridges & 16 Tunnels View, Waterfall Panoramas',
                '07:10 AM',
                'Hill Station Hot Masala Tea, Fresh Medu Vadas, and Ooty Butter Rusks at Coonoor Station',
                'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80'
            ),
            (
                4,
                'IndiGo Regional Air Connect (Chennai - Madurai / Kochi)',
                'Flight',
                'Chennai (MAA)',
                'Madurai (IXM)',
                3400.0,
                1.2,
                'Direct Non-Stop Express Flight, 15kg Check-in + 7kg Cabin Luggage, Priority Web Check-in, Punctual Transit, Air Conditioned',
                '08:45 AM',
                'Onboard Gourmet Snack Box with Cashews, Cookie, and Choice of Beverage',
                'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80'
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
                'Unforgettable Golden Triangle Experience!',
                'The sunrise at the Taj Mahal was pure magic. Our chauffeur from MakeMyTrip was punctual and polite, and the hotels in Agra and Jaipur were palatial!',
                'Family',
                1
            ),
            (
                2,
                'package',
                2,
                5,
                'Kashmir Paradise - Dream Vacation Come True',
                'The Shikara ride on Dal Lake and the snow at Gulmarg Gondola phase 2 were out of this world. Thomas Cook handled all mountain permits smoothly.',
                'Couple',
                1
            ),
            (
                1,
                'package',
                4,
                5,
                'Grand Temple & Coastal Trail in Tamil Nadu',
                'Special darshan at Madurai Meenakshi Amman Temple and crossing the Pamban Bridge at sunset to Rameswaram was spiritually enriching.',
                'Family',
                1
            ),
            (
                3,
                'hotel',
                1,
                5,
                'Iconic Stay at The Taj Mahal Palace Mumbai',
                'The historic sea-facing luxury and afternoon high tea at the Sea Lounge were unforgettable. Impeccable Tata hospitality!',
                'Solo',
                1
            ),
            (
                2,
                'transport',
                1,
                5,
                'Superb Punctuality on Vande Bharat Express',
                'Smooth 130 km/h ride between Chennai and Coimbatore. The executive breakfast with hot filter coffee was delicious.',
                'Business',
                1
            )
        ]
        cursor.executemany('''
            INSERT INTO reviews (user_id, item_type, item_id, rating, title, comment, travel_type, cleanliness_rating)
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
                'Welcome to Roamly Expeditions',
                'Your Roamly Explorer Passport is officially active with ₹5,000 complimentary travel credits.',
                'system',
                '/dashboard',
                0
            ),
            (
                1,
                'Booking Confirmed #ROAM-PAC-0001',
                'Your Golden Triangle Royal Heritage Tour has been confirmed with MakeMyTrip Holidays.',
                'booking',
                '/bookings/summary/1',
                0
            ),
            (
                2,
                'Welcome to Roamly Expeditions',
                'Your travel account is verified. Start exploring handcrafted Indian holiday packages and luxury stays.',
                'system',
                '/packages',
                0
            )
        ]
        cursor.executemany('''
            INSERT INTO notifications (user_id, title, message, notification_type, link_url, is_read)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', notifs_data)

# seed saved wishlist items
def seed_saved_items(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM saved_items')
    count = cursor.fetchone()['count']
    if count == 0:
        saved_data = [
            (1, 'package', 2),
            (1, 'hotel', 2),
            (1, 'transport', 1),
            (2, 'package', 1)
        ]
        cursor.executemany('''
            INSERT INTO saved_items (user_id, item_type, item_id)
            VALUES (%s, %s, %s)
        ''', saved_data)

# seed promotional coupons
def seed_coupons(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM coupons')
    count = cursor.fetchone()['count']
    if count == 0:
        coupons_data = [
            ('ROAMFIRST', 'percentage', 15.0, 1000.0, 2500.0, '15% instant discount on your first Indian expedition booking', 1),
            ('SUMMER20', 'percentage', 20.0, 2000.0, 3000.0, '20% discount on hill station chalets and mountain tours', 1),
            ('EXPLOREINDIA', 'flat', 1000.0, 5000.0, 1000.0, 'Flat ₹1,000 off on national heritage packages', 1),
            ('TAMIL15', 'percentage', 15.0, 1000.0, 2000.0, '15% discount on Tamil Nadu temple and hill trails', 1)
        ]
        cursor.executemany('''
            INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, description, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', coupons_data)

# seed digital wallets
def seed_wallets(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM wallets')
    count = cursor.fetchone()['count']
    if count == 0:
        cursor.execute('''
            INSERT INTO wallets (user_id, balance, currency)
            VALUES (1, 5000.00, 'INR'), (2, 5000.00, 'INR'), (3, 5000.00, 'INR')
        ''')
        cursor.execute('''
            INSERT INTO wallet_transactions (user_id, amount, transaction_type, description, reference_id)
            VALUES 
            (1, 5000.00, 'Credit', 'Welcome promotional travel credits', 'CREDIT-WELCOME-01'),
            (2, 5000.00, 'Credit', 'Welcome promotional travel credits', 'CREDIT-WELCOME-02'),
            (3, 5000.00, 'Credit', 'Welcome promotional travel credits', 'CREDIT-WELCOME-03')
        ''')

# seed agency payouts
def seed_payouts(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM agency_payouts')
    count = cursor.fetchone()['count']
    if count == 0:
        payouts_data = [
            (1, 18500.0, 1850.0, 16650.0, 'HDFC Bank - A/C 501004928192 (IFSC: HDFC0001234) - MakeMyTrip', 'Approved'),
            (2, 14500.0, 1450.0, 13050.0, 'State Bank of India - A/C 30291049281 (IFSC: SBIN0000456) - Taj Hotels', 'Processed'),
            (3, 3600.0, 360.0, 3240.0, 'ICICI Bank - A/C 001205019284 (IFSC: ICIC0000012) - Zingbus', 'Pending')
        ]
        cursor.executemany('''
            INSERT INTO agency_payouts (agency_id, amount, commission_amount, net_payout, bank_account_info, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', payouts_data)

# seed initial sample bookings for rich initial state
def seed_initial_bookings(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM bookings')
    count = cursor.fetchone()['count']
    if count == 0:
        cursor.execute('''
            INSERT INTO bookings (user_id, booking_type, package_id, hotel_id, transport_id, travel_date, num_travelers, total_price, status, pickup_location, special_requests)
            VALUES (1, 'Package', 1, NULL, NULL, '2026-10-15', 2, 37000.00, 'Confirmed', 'New Delhi Airport', 'Vegetarian meals preferred')
        ''')
        b_id = cursor.lastrowid
        cursor.execute('''
            INSERT INTO payments (booking_id, user_id, amount, payment_method, status, transaction_id)
            VALUES (%s, 1, 37000.00, 'Roamly Wallet', 'Completed', 'TXN-ROAM-99210482')
        ''', (b_id,))
        cursor.execute('''
            INSERT INTO invoices (invoice_number, booking_id, user_id, subtotal, tax_amount, discount, total_amount)
            VALUES ('INV-2026-000001', %s, 1, 35238.10, 1761.90, 0.00, 37000.00)
        ''', (b_id,))
        cursor.execute('''
            INSERT INTO messages (booking_id, sender_type, sender_id, recipient_id, message_text, is_read)
            VALUES 
            (%s, 'agency', 1, 1, 'Welcome to MakeMyTrip! Your Golden Triangle itinerary is confirmed. Our driver will meet you at Terminal 3.', 1),
            (%s, 'user', 1, 1, 'Thank you! Looking forward to the tour.', 1)
        ''', (b_id, b_id))

# function to wipe and reseed database cleanly
def clear_and_reseed_all(conn):
    cursor = conn.cursor()
    tables = [
        'messages',
        'invoices',
        'payments',
        'agency_payouts',
        'wallet_transactions',
        'wallets',
        'saved_items',
        'notifications',
        'reviews',
        'coupons',
        'bookings',
        'transports',
        'hotels',
        'packages',
        'user_preferences',
        'agencies',
        'users',
        'admins'
    ]
    for tbl in tables:
        try:
            cursor.execute(f'DELETE FROM {tbl}')
        except Exception:
            pass

    try:
        cursor.execute("DELETE FROM sqlite_sequence")
    except Exception:
        pass

    seed_admin(cursor)
    seed_users(cursor)
    seed_agencies(cursor)
    seed_packages(cursor)
    seed_hotels(cursor)
    seed_transports(cursor)
    seed_reviews(cursor)
    seed_notifications(cursor)
    seed_saved_items(cursor)
    seed_coupons(cursor)
    seed_wallets(cursor)
    seed_payouts(cursor)
    seed_initial_bookings(cursor)
    conn.commit()
