"""
Roamly Database Seed Data Module
Seeds tailored agencies (Cab/Rental, Hotel, Travel), curated holiday packages across 6 core destinations
(Madurai, Kodaikanal, Chennai, Thanjavur, Bangalore, Kanyakumari) with multi-duration options and pros/cons,
authentic regional hotels with AC/Pet/Bed/Capacity options, and taxi/self-drive rental fleets.
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
                'Avid explorer and photographer who loves South Indian hill stations, heritage temples, and coastal escapes.'
            ),
            (
                'priya_travels',
                hash_password('user123'),
                'priya@roamly.com',
                'Priya Sundaram',
                '+91 9840223344',
                '12 Race Course Road, Coimbatore, Tamil Nadu',
                'Heritage enthusiast, food blogger, and road-tripper seeking authentic cultural and culinary experiences.'
            ),
            (
                'aarav_explorer',
                hash_password('user123'),
                'aarav@roamly.com',
                'Aarav Sharma',
                '+91 9811223344',
                'B-42 Indiranagar, Bangalore, Karnataka',
                'Mountain road-tripper and nature lover exploring hill stations and scenic coastal highways.'
            )
        ]
        cursor.executemany('''
            INSERT INTO users (username, password, email, full_name, phone, address, bio)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', users_data)

        cursor.execute('''
            INSERT INTO user_preferences (user_id, preferred_travel_mode, dietary_preference, budget_range, preferred_categories)
            VALUES (1, 'Train', 'Vegetarian', 'Moderate', 'Hill Station, Heritage & Culture, Pilgrimage & Coastal')
        ''')
        cursor.execute('''
            INSERT INTO user_preferences (user_id, preferred_travel_mode, dietary_preference, budget_range, preferred_categories)
            VALUES (2, 'Private Car', 'Non-Vegetarian', 'Luxury', 'Heritage & Culture, Coastal & Beach, Nature & Wellness')
        ''')

# seed partner agencies (Destination-specific Hotel & Cab Agencies + Intercity Transit + Tour Operators)
def seed_agencies(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM agencies')
    count = cursor.fetchone()['count']
    if count == 0:
        seed_agencies_data = [
            # 1. Bangalore Agencies
            (
                'bangalore_stays',
                hash_password('agency123'),
                'Bengaluru Garden City Hospitality & Suites',
                'Hotel Agency',
                'stays@bangalorehospitality.in',
                '+91 80 41234567',
                'MG Road & Indiranagar, Bengaluru, Karnataka',
                'Active'
            ),
            (
                'bangalore_cabs',
                hash_password('agency123'),
                'Namma Bengaluru Cabs & ZoomFleet',
                'Cab Agency',
                'cabs@bangalorefleet.in',
                '+91 80 49876543',
                '100 Feet Road, Indiranagar, Bengaluru, Karnataka',
                'Active'
            ),

            # 2. Chennai Agencies
            (
                'chennai_hotels',
                hash_password('agency123'),
                'Marina Bay Stays & Heritage Resorts',
                'Hotel Agency',
                'reservations@chennaistays.in',
                '+91 44 28551122',
                'MRC Nagar & Mylapore, Chennai, Tamil Nadu',
                'Active'
            ),
            (
                'chennai_cabs',
                hash_password('agency123'),
                'Madras City Cabs & Coastline Rentals',
                'Cab Agency',
                'support@madrascabs.in',
                '+91 44 28443322',
                'Mount Road & ECR, Chennai, Tamil Nadu',
                'Active'
            ),

            # 3. Kodaikanal Agencies
            (
                'kodai_resorts',
                hash_password('agency123'),
                'Kodai Mist Luxury Retreats & Chalets',
                'Hotel Agency',
                'stay@kodaimistretreats.in',
                '+91 4542 245678',
                'Observatory Road, Kodaikanal, Tamil Nadu',
                'Active'
            ),
            (
                'kodai_cabs',
                hash_password('agency123'),
                'Kodai Pine Hills Taxi & 4x4 Fleet',
                'Cab Agency',
                'rides@kodaipinefleet.in',
                '+91 4542 241122',
                'Lake Road, Kodaikanal, Tamil Nadu',
                'Active'
            ),

            # 4. Madurai Agencies
            (
                'madurai_stays',
                hash_password('agency123'),
                'Temple City Heritage Palaces & Residency',
                'Hotel Agency',
                'hospitality@maduraipalaces.in',
                '+91 452 2334455',
                'Pasumalai & West Perumal Street, Madurai, Tamil Nadu',
                'Active'
            ),
            (
                'madurai_cabs',
                hash_password('agency123'),
                'Meenakshi City Taxis & Self-Drive',
                'Cab Agency',
                'booking@meenakshicabs.in',
                '+91 452 2399887',
                'Town Hall Road, Madurai, Tamil Nadu',
                'Active'
            ),

            # 5. Thanjavur Agencies
            (
                'thanjavur_stays',
                hash_password('agency123'),
                'Chola Heritage Mansions & Resorts',
                'Hotel Agency',
                'welcome@cholastays.in',
                '+91 4362 278899',
                'South Rampart, Thanjavur, Tamil Nadu',
                'Active'
            ),
            (
                'thanjavur_cabs',
                hash_password('agency123'),
                'Chola Delta Travels & Cabs',
                'Cab Agency',
                'travel@choladeltacabs.in',
                '+91 4362 271133',
                'Big Temple Road, Thanjavur, Tamil Nadu',
                'Active'
            ),

            # 6. Kanyakumari Agencies
            (
                'kanyakumari_stays',
                hash_password('agency123'),
                'Lands End Oceanfront Resorts & Inns',
                'Hotel Agency',
                'booking@capeoceanfront.in',
                '+91 4652 246677',
                'Beach Road, Kanyakumari, Tamil Nadu',
                'Active'
            ),
            (
                'kanyakumari_cabs',
                hash_password('agency123'),
                'Cape Ocean Drive Cabs & Rentals',
                'Cab Agency',
                'fleet@capeoceancabs.in',
                '+91 4652 248899',
                'Main Road, Kanyakumari, Tamil Nadu',
                'Active'
            ),

            # 7. Intercity Bus Agency (RedBus style)
            (
                'redbus_express',
                hash_password('agency123'),
                'RedBus Intercity Express Coaches',
                'Bus Agency',
                'dispatch@redbusexpress.in',
                '+91 1800 1039876',
                'Kallada & Zingbus Transit Hubs, Bangalore / Chennai',
                'Active'
            ),

            # 8. Rail & Air Transit Agency (IRCTC & Regional Air Connect)
            (
                'rail_flight_connect',
                hash_password('agency123'),
                'Southern Railways & Regional Air Connect',
                'Transit Agency',
                'booking@southtransitconnect.in',
                '+91 1800 111139',
                'Central Railway & Airport Stations, Chennai & Bangalore',
                'Active'
            ),

            # 9. Tour & Legacy Agencies
            (
                'fasttrack_cabs',
                hash_password('agency123'),
                'FastTrack Cabs & Self-Drive Rentals',
                'Cab Agency',
                'cabs@fasttrackrentals.in',
                '+91 44 28889999',
                'Mount Road, Chennai & South Hubs',
                'Active'
            ),
            (
                'zoomwheels_fleet',
                hash_password('agency123'),
                'ZoomWheels Self-Drive & Taxi Fleet',
                'Cab Agency',
                'fleet@zoomwheels.in',
                '+91 80 41112233',
                'Indiranagar 100ft Road, Bangalore',
                'Active'
            ),
            (
                'heritage_palaces',
                hash_password('agency123'),
                'Heritage Southern Palaces & Resorts',
                'Hotel Agency',
                'stay@heritagesouth.in',
                '+91 452 2345678',
                'Pasumalai Hills, Madurai',
                'Active'
            ),
            (
                'grand_star_hotels',
                hash_password('agency123'),
                'Grand Star Hotels & Eco Retreats',
                'Hotel Agency',
                'bookings@grandstarhotels.in',
                '+91 4542 240001',
                'Observatory Road, Kodaikanal',
                'Active'
            ),
            (
                'roamly_expeditions',
                hash_password('agency123'),
                'Roamly South Expeditions & Trails',
                'Travel Agency',
                'tours@roamly.com',
                '+91 44 28460000',
                'Anna Salai, Chennai',
                'Active'
            ),
            (
                'dravidian_holidays',
                hash_password('agency123'),
                'Dravidian Heritage & Mountain Holidays',
                'Travel Agency',
                'holidays@dravidianholidays.com',
                '+91 4362 270000',
                'South Rampart, Thanjavur',
                'Active'
            )
        ]
        cursor.executemany('''
            INSERT INTO agencies (username, password, name, agency_type, email, phone, address, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', seed_agencies_data)

# seed packages for the 6 core destinations with multi-durations (2D, 3D, 5D, 7D) and pros/cons
def seed_packages(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM packages')
    count = cursor.fetchone()['count']
    if count == 0:
        seed_packages_data = [
            # 1. Kodaikanal 3D/2N Classic
            (
                'Kodaikanal Misty Pines & Lake Classic Getaway',
                'Kodaikanal',
                'Hill Station',
                7999.0,
                3,
                2,
                'A refreshing 3-day mountain retreat exploring mist-covered Coaker’s Walk, star-shaped Kodai Lake, Pillar Rocks, and pine forest trails.',
                'Coaker’s Walk, Kodai Lake Boating, Pillar Rocks, Bryant Park, Silver Cascade Falls, Pine Forest Walk',
                '3-Star Mountain Resort, Daily Buffet Breakfast, Sightseeing Cab, Boating Pass, Tea Plantation Walk',
                'Homemade Kodai Chocolates, Hot Filter Coffee, Hill Station Masala Corn & Herbal Soups',
                4.8,
                'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80',
                5,
                'Fast-paced and budget-friendly; Covers all prime postcard landmarks; Ideal for a quick weekend recharge',
                'Rushed schedule with limited leisure time; Misses remote waterfalls and deep trekking trails',
                'Weekend travelers & couples looking for a quick mountain break'
            ),
            # 2. Kodaikanal 5D/4N Leisure Deep Immersion
            (
                'Kodaikanal Wilderness, Berijam Forest & High Valley Trek',
                'Kodaikanal',
                'Hill Station',
                14500.0,
                5,
                4,
                'A relaxed 5-day immersive holiday including exclusive Berijam Lake forest permits, Vattakanal dolphin nose sunrise trek, and organic spice plantation stay.',
                'Berijam Biosphere Forest Safari, Vattakanal Dolphin Nose Trek, Mannavanur Sheep Farm & Lake, Guna Caves, Silent Valley Viewpoint, Kodai Solar Observatory',
                '4-Star Premium Valley View Chalet, Daily Breakfast & Dinner, Private SUV Sightseeing, Forest Entry Permits, Campfire Evening',
                'Farm-to-Table Organic Meals, Badaga Herb Roast Dishes, Authentic Kodai Cheeses & Wood-Fired Sourdough Pizzas',
                4.9,
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80',
                5,
                'Deep leisurely pace; Includes protected eco-zones and hidden lakes; Ample time for relaxation and photography; Campfire dinner included',
                'Higher overall price; Requires moderate walking stamina for valley treks',
                'Nature lovers, photographers & families desiring an in-depth serene vacation'
            ),
            # 3. Kodaikanal 7D/6N Grand Mountain Expedition
            (
                'Kodaikanal & Western Ghats Ultimate Mountain Odyssey',
                'Kodaikanal',
                'Hill Station',
                21900.0,
                7,
                6,
                'The definitive 7-day high-altitude adventure covering all Kodai highlights plus offbeat Poombari terraced villages, Kukkal shola forest, and yoga retreats.',
                'Poombari Garlic Terrace Hills, Kukkal Forest Sanctuary, Pambar Waterfalls Safari, Berijam Lake, Night Sky Stargazing at Observatory, Kurinji Andavar Temple',
                'Luxury Boutique Villa with Fireplace, All Meals Included, Dedicated 4x4 Vehicle, Forest & Wildlife Guide, Spa & Wellness Session',
                'Multi-Course Traditional Hill Country Banquet, Artisan Kodai Chocolate Tasting Masterclass, Fresh Strawberry & Plum Delicacies',
                5.0,
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
                6,
                'Complete all-inclusive coverage; Zero rush; Access to secluded mountain villages and remote waterfalls; Spa and bonfire sessions included',
                'Requires a full week leave; Premium price point',
                'Long-stay travelers, remote work vacationers, honeymooners & trekking enthusiasts'
            ),

            # 4. Madurai 2D/1N Express Heritage
            (
                'Madurai Meenakshi Temple Express Weekend',
                'Madurai',
                'Heritage & Culture',
                4999.0,
                2,
                1,
                'Experience the spiritual grandeur and culinary vibrant night markets of the ancient Athens of the East in a compact 2-day express tour.',
                'Meenakshi Amman Temple Special Darshan, Thousand Pillar Hall, Thirumalai Nayakkar Palace Light & Sound Show, Vandiyur Mariamman Teppakulam',
                '3-Star City Hotel Stay, South Indian Breakfast, AC Sedan Sightseeing, Temple Guide',
                'Original Famous Madurai Jigarthanda Tasting, Murugan Idli Shop Breakfast, Madurai Kari Dosa Dinner',
                4.7,
                'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
                6,
                'Very affordable; Seamless quick weekend getaway; Covers the essential temple darshan and top street foods',
                'Tight timeline; Does not include day excursions to Keeladi or Alagar Kovil',
                'Weekend pilgrims & short-trip city explorers'
            ),
            # 5. Madurai 4D/3N Heritage & Culinary Heritage Trail
            (
                'Madurai Grand Nayakkar Heritage & Keeladi Civilization Trail',
                'Madurai',
                'Heritage & Culture',
                11200.0,
                4,
                3,
                'Comprehensive 4-day deep dive into Sangam-era history at the Keeladi Archaeological Museum, Alagar Hills temple, and Chettinad architectural fringes.',
                'Keeladi Archaeological Excavation Museum, Alagar Kovil & Pazhamudircholai Hill Temple, Meenakshi Golden Tower Darshan, Banana Market Walk, Thirupparankundram Rock-Cut Shrine',
                '4-Star Heritage Palace Resort, Daily Breakfast & Chef Dinners, Private AC Chauffeur Cab, VIP Temple Darshan Passes, Historian Guide',
                'Chettinad Spicy Kuzhambu Feast on Banana Leaf, Bun Parotta Masterclass, Madurai Halwa & Jigarthanda Safari',
                4.9,
                'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
                5,
                'In-depth historical immersion; Includes world-renowned Keeladi museum; Guided food walk through historic bazaars; Relaxed afternoon palace visits',
                'Involves local market walking in warmer daytime temperatures',
                'History buffs, culture enthusiasts, foodies & multi-generational families'
            ),

            # 6. Chennai 3D/2N Coastal & Colonial Heritage
            (
                'Chennai Coastal Breeze & Colonial Heritage Trail',
                'Chennai',
                'Coastal & Heritage',
                6800.0,
                3,
                2,
                'Discover Madras history from 1644 Fort St. George, San Thome Cathedral, colorful Mylapore Kapaleeshwarar temple, and vibrant Marina beach evenings.',
                'Kapaleeshwarar Temple Mylapore Walk, Marina Beach Lighthouse Panorama, San Thome Basilica, Fort St. George Colonial Museum, Government Museum Bronze Gallery',
                '3-Star Seaside Hotel, Daily Buffet Breakfast, Private AC Car, Museum Fast-Track Entry, Filter Coffee Experience',
                'Mylapore Ghee Roast Dosas with 4 Chutneys, Fresh Marina Beach Sundal, Madras Filter Coffee & Authentic South Indian Thali',
                4.7,
                'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
                5,
                'Efficient coverage of city icons; Great blend of coastal breeze and historic landmarks; Easy airport and railway connectivity',
                'City traffic during peak hours; Shorter stay doesn’t cover Mahabalipuram shore temples',
                'Business travelers extending stay, weekend coastal explorers & first-time Tamil Nadu visitors'
            ),
            # 7. Chennai 5D/4N Coastal City & Mahabalipuram UNESCO Wonders
            (
                'Chennai & Mahabalipuram UNESCO Shore Temple Immersion',
                'Chennai',
                'Coastal & Heritage',
                13900.0,
                5,
                4,
                'A 5-day coastal luxury tour spanning ancient Madras, East Coast Road scenic drives, and the 7th-century UNESCO Shore Temples of Mahabalipuram.',
                'Mahabalipuram Shore Temple & Arjuna’s Penance, DakshinaChitra Living History Museum, Covelong Beach Watersports, Mylapore Silk Street, Cholamandal Artists’ Village',
                '4-Star Beachside Resort on ECR, Daily Breakfast & Seafood Dinners, Private AC Chauffeur Car, Monument Passes, Surfing / Boating Voucher',
                'Fresh Coastal Crab & Fish Curry, Chettinad Spiced Prawns, Dakshin Fine Dining Experience, Coconut Tender Water Refreshments',
                4.9,
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
                6,
                'Expands to scenic ECR beaches and world heritage monuments; Relaxed coastal resort stay; Combines culture, beach activities, and living art villages',
                'Higher price due to premium beach resort stay and extended cab hire',
                'Families, heritage travelers, beach enthusiasts & slow-paced vacationers'
            ),

            # 8. Thanjavur 3D/2N Chola Dynasty Heritage
            (
                'Thanjavur Brihadisvara Great Chola Temple Trail',
                'Thanjavur',
                'Heritage & Culture',
                6500.0,
                3,
                2,
                'Marvel at the 1,000-year-old architectural marvel Brihadisvara Big Temple, explore the Maratha Palace, and visit generation-old bronze casting artisans.',
                'Brihadisvara UNESCO Big Temple Darshan, Thanjavur Maratha Royal Palace & Art Gallery, Saraswathi Mahal Ancient Manuscript Library, Bronze & Art Plate Workshops',
                'Heritage 3-Star Hotel Stay, Daily South Indian Breakfast, Private AC Sightseeing Vehicle, Certified Historian Guide, Art Souvenir Gift',
                'Authentic Thanjavur Thali with More Kuzhambu, Kumbakonam Degree Coffee, Fresh Banana Leaf Sambhar Rice & Ash Gourd Halwa',
                4.8,
                'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
                6,
                'Focused exploration of world-famous Chola architecture; Meets authentic metalcraft artisans; Pocket-friendly heritage tour',
                'Does not include nearby temple towns like Gangaikonda Cholapuram or Darasuram',
                'Architecture lovers, spiritual seekers & culture buffs'
            ),
            # 9. Thanjavur 5D/4N Great Living Chola Temples Circuit
            (
                'Great Living Chola Dynasty Complete Triangle (Thanjavur - Kumbakonam - Gangaikonda)',
                'Thanjavur',
                'Heritage & Culture',
                13200.0,
                5,
                4,
                'Complete 5-day expedition covering the trio of UNESCO Great Living Chola Temples, ancient weaving clusters, and tranquil Cauvery delta villages.',
                'Brihadisvara Temple at Thanjavur, Gangaikonda Cholapuram Sanctuary, Airavatesvara Temple Darshan at Darasuram, Kumbakonam Brass & Silk Weavers, Royal Palace Courtyard',
                'Heritage Luxury Ayurvedic Resort Stay, Daily Breakfast & Traditional Dinners, AC Chauffeur Car, Temple VIP Passes, Village Bull Cart Ride',
                'Delta Harvest Feast with 14 Native Curries, Traditional Kumbakonam Ghee Roast, Filter Coffee Tasting & Svatma Classical Dinner',
                4.9,
                'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
                6,
                'Comprehensive coverage of all three UNESCO Chola monuments; Rich artisan and handloom village visits; Authentic heritage resort experience',
                'Moderate road travel between delta temple clusters',
                'Art historians, photographers, spiritual explorers & discerning culture seekers'
            ),

            # 10. Bangalore 3D/2N Garden City & Royal Palace Tour
            (
                'Bangalore Garden City, Palaces & Craft Breweries',
                'Bangalore',
                'City & Nature',
                7200.0,
                3,
                2,
                'Explore the royal Tudor-style Bangalore Palace, lush Lalbagh Botanical Gardens, Tipu Sultan’s Summer Palace, and the vibrant pub & craft brewing culture.',
                'Bangalore Tudor Palace Tour, Lalbagh Glass House & 200-yr-old Trees, Cubbon Park Walk, Tipu Sultan Summer Palace, Indiranagar Craft Brewery Experience',
                '4-Star Central Hotel, Daily Buffet Breakfast, Private AC Sedan Sightseeing, Palace Entry Passes, Craft Tasting Voucher',
                'Iconic Vidyarthi Bhavan Masala Dosa, CTR Benne Dosa, Craft Beer Tasting Flights, Authentic Karnataka Ragi Mudde Thali',
                4.8,
                'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
                5,
                'Exciting blend of royal heritage, vast botanical green spaces, and modern cosmopolitan gastronomy; Very flexible itinerary',
                'City traffic during evening rush hours',
                'Young professionals, couples, urban explorers & food & beverage enthusiasts'
            ),
            # 11. Bangalore 5D/4N Hills, Palaces & Nandi Sunrise Expedition
            (
                'Bangalore & Nandi Hills Royal Nature & Vineyard Escape',
                'Bangalore',
                'City & Nature',
                14900.0,
                5,
                4,
                'A 5-day luxurious retreat combining Bengaluru heritage, early morning Nandi Hills cloud sunrise, Grover Zampa vineyard wine tour, and Bannerghatta safari.',
                'Nandi Hills Sunrise & Bhoga Nandeeshwara Temple, Grover Zampa Vineyard Tour & Wine Tasting, Bannerghatta National Park Jungle Safari, Bangalore Palace, MG Road Walking Safari',
                'Luxury 5-Star Garden Palace Hotel, Daily Breakfast & Gourmet Dinners, Private SUV Chauffeur, Safari & Vineyard Passes',
                'Vineyard Gourmet Cheese & Wine Pairing, Mysore Pak Tasting, Udupi Multi-Course Feast & High Tea at Palace Gardens',
                4.9,
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
                5,
                'Expands into breathtaking cloud-top hills and boutique vineyards; Top-tier luxury hotel stay; Wildlife safari included',
                'Early 4:30 AM departure required for Nandi sunrise on Day 3',
                'Leisure travelers, wine enthusiasts, families & luxury seekers'
            ),

            # 12. Kanyakumari 3D/2N Lands End & Triveni Sangam
            (
                'Kanyakumari Lands End, Sunrise & Ocean Confluence',
                'Kanyakumari',
                'Coastal & Pilgrimage',
                6200.0,
                3,
                2,
                'Stand at the southern tip of the Indian subcontinent where the Indian Ocean, Arabian Sea, and Bay of Bengal unite. Witness spectacular sunrise and sunset.',
                'Vivekananda Rock Memorial & Ferry Ride, 133-ft Thiruvalluvar Statue, Triveni Sangam Holy Dip, Sunset Viewpoint at Beach Promenade, Kanyakumari Bhagavathy Amman Temple',
                '3-Star Sea Facing Hotel, Daily Breakfast, Private AC Sightseeing Car, Ferry Passes, Temple Guide',
                'Coastal Kanyakumari Nethili Fish Fry, Fresh Coconut Banana Halwa, Appam with Sweet Coconut Milk & Filter Coffee',
                4.8,
                'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
                5,
                'Witness both sunrise and sunset over the ocean from the same point; Unmatched spiritual & geographical significance; Budget-friendly',
                'Peak season ferry queues for Vivekananda Rock; Afternoon coastal heat',
                'Spiritual travelers, geography enthusiasts, families & budget travelers'
            ),
            # 13. Kanyakumari 5D/4N Coastal Castles & Padmanabhapuram Royal Tour
            (
                'Kanyakumari & Travancore Coastal Castles Odyssey',
                'Kanyakumari',
                'Coastal & Pilgrimage',
                13500.0,
                5,
                4,
                'A 5-day scenic expedition exploring Kanyakumari along with the 16th-century wooden marvel Padmanabhapuram Palace, Mathur Hanging Trough, and Vattakottai ocean fort.',
                'Padmanabhapuram Teakwood Palace Tour, Vattakottai Beachside Granite Fort, Mathur Aqueduct Hanging Trough, Vivekananda Rock Memorial, Suchindram Thanumalayan Temple, Sunset Catamaran Cruise',
                '4-Star Oceanfront Suite Resort, Daily Breakfast & Seafood Dinners, Private AC Chauffeur Car, Ferry & Palace VIP Passes, Catamaran Ride',
                'Travancore Royal Sadya Feast, Fresh Coastal Seafood Platters, Tirunelveli Ghee Halwa & South Coastal Coconut Curries',
                4.9,
                'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
                6,
                'Explores hidden coastal forts and majestic teakwood palaces; Unhurried relaxed pace with sunset catamaran cruise; Seafront private balcony stay',
                'Requires inter-district sightseeing transit along the scenic coastal route',
                'History buffs, beach lovers, honeymooners & multi-generational vacationers'
            )
        ]
        cursor.executemany('''
            INSERT INTO packages (title, destination, category, price, duration_days, duration_nights, description, highlights, included_amenities, food_highlights, rating, image_url, agency_id, pros, cons, ideal_for)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', seed_packages_data)

# helper to fetch agency id by username
def _get_agency_id(cursor, username):
    cursor.execute('SELECT id FROM agencies WHERE username = %s', (username,))
    row = cursor.fetchone()
    return row['id'] if row else None

# seed hotels for each of the 6 core destinations with AC, Pet, Bed, and Capacity options
def seed_hotels(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM hotels')
    count = cursor.fetchone()['count']
    if count == 0:
        # Resolve agency IDs
        bangalore_aid = _get_agency_id(cursor, 'bangalore_stays') or 1
        chennai_aid = _get_agency_id(cursor, 'chennai_hotels') or 3
        kodai_aid = _get_agency_id(cursor, 'kodai_resorts') or 5
        madurai_aid = _get_agency_id(cursor, 'madurai_stays') or 7
        thanjavur_aid = _get_agency_id(cursor, 'thanjavur_stays') or 9
        kanyakumari_aid = _get_agency_id(cursor, 'kanyakumari_stays') or 11

        hotels_data = [
            # Madurai Hotels
            (
                madurai_aid,
                'Heritage Madurai Palace & Banyan Resort',
                'Madurai',
                '11 Melakkal Main Road, Kochadai, Madurai 625016',
                4.9,
                5200.0,
                'Heritage Deluxe Room, Luxury Plunge Pool Villa, Royal Suite',
                'Olympic-Sized Temple-Style Pool, Traditional Ayurvedic Spa, 300-Year-Old Banyan Tree Courtyard, Free WiFi, 24/7 Butler',
                'Sprawling 17-acre heritage sanctuary designed by Geoffrey Bawa blending ancient Tamil craftsmanship with modern five-star comfort.',
                'Banyan Multi-Cuisine Fine Dining, Madurai Kari Dosa Live Counter, and Traditional South Indian Filter Coffee Bar',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                'AC',
                0,
                'King Bed',
                2
            ),
            (
                madurai_aid,
                'The Gateway Hotel Pasumalai Madurai',
                'Madurai',
                'Pasumalai Hills, Madurai 625004',
                4.8,
                6400.0,
                'Executive Hill View Room, Garden Cottage, Suite',
                'Panoramic City & Temple Views, Swimming Pool, Pet-Friendly Cottages, Lawn Tennis, Fitness Center',
                'Perched atop Pasumalai hill amidst 62 acres of lush gardens with wandering peacocks and serene sunset vistas.',
                'Gadam Multi-Cuisine, High Point Lounge Bar, Authentic Chettinad & Madurai Special Menus',
                'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
                'AC',
                1,
                'Queen Bed',
                4
            ),
            (
                madurai_aid,
                'Meenakshi Heritage Residency & Suites',
                'Madurai',
                'West Perumal Maistry Street, Madurai 625001',
                4.4,
                2400.0,
                'Standard Double Room, Family 4-Bed Suite',
                'Walking Distance to Meenakshi Temple, Free WiFi, Lift, 24-hr Travel Desk, Room Service',
                'Comfortable, budget-friendly heritage accommodation situated just 400m from Meenakshi Amman Temple Golden Towers.',
                'Annapoorna Pure Vegetarian South Indian Restaurant',
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
                'Both',
                0,
                'Twin Beds',
                3
            ),

            # Kodaikanal Hotels
            (
                kodai_aid,
                'The Tamara Kodai Luxury Hill Retreat',
                'Kodaikanal',
                'St Marys Road, Kodaikanal 624101',
                5.0,
                11500.0,
                'Luxury Pine Suite, Mountain View Suite, Presidential Grand Suite',
                'Heated Outdoor Pool, Spa Elevation, Fireplace in All Suites, French Architectural Heritage, High-Speed WiFi',
                'A restored 1840s French monastic heritage retreat nestled high in the misty pine hills with breathtaking valley panoramas.',
                'La Providence (Multi-Cuisine Buffet) & Bistro 1845 with Mountain Valley Views',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
                'AC',
                0,
                'King Suite',
                4
            ),
            (
                kodai_aid,
                'Sterling Kodai Valley & Pines Resort',
                'Kodaikanal',
                'Pallangi Road, Attuvampatti, Kodaikanal 624101',
                4.7,
                5400.0,
                'Classic Room, Premiere Valley Suite, Pet-Friendly Family Chalet',
                'Ship-Shaped Architecture, Pet-Friendly Grounds, Children Activity Zone, Campfire Evenings, Trekking Desk',
                'Overlooking the terraced valley of Villpatti, offering pure pine mountain air, quiet gardens, and star-filled night skies.',
                'Valley View Restaurant with South Indian & Continental Buffet Delicacies',
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80',
                'AC',
                1,
                'Queen Bed',
                3
            ),
            (
                kodai_aid,
                'Kodai Misty Mountain Chalet & Homestay',
                'Kodaikanal',
                'Observatory Road, Kodaikanal 624103',
                4.5,
                2800.0,
                'Mountain Double Room, Pine Wood Cottage',
                'Pure Mountain Breeze, Campfire by Request, Lawn Gardens, Pet Welcoming, Homemade Breakfast',
                'Cozy mountain chalet surrounded by eucalyptus and silver oak trees, ideal for peaceful hill station stays.',
                'Home-Cooked Warm Soups, Fresh Bread, Dosa & Filter Coffee',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
                'Non-AC',
                1,
                'Twin Beds',
                2
            ),

            # Chennai Hotels
            (
                chennai_aid,
                'The Leela Palace Seaside Marina',
                'Chennai',
                'Adyar Seaface, MRC Nagar, Chennai 600028',
                5.0,
                11800.0,
                'Deluxe Sea Facing Room, Grand Heritage Suite, Presidential Bay Suite',
                'Bay of Bengal Ocean Panorama, Infinity Pool, ESPA Royal Spa, 6 Specialty Restaurants, Valet Parking',
                'Chennai’s only seafront palace hotel, inspired by Chettinad royal architecture and regal Tamil splendor.',
                'Spectra (Seven Global Kitchens), China XO, Jamavar (Royal Indian), and Library Blu Lounge',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
                'AC',
                0,
                'King Bed',
                2
            ),
            (
                chennai_aid,
                'Taj Connemara Heritage Hotel',
                'Chennai',
                'Binny Road, Anna Salai, Chennai 600002',
                4.9,
                8200.0,
                'Heritage Superior Room, Colonial Deluxe Suite, Luxury Suite',
                '130-Year-Old Historic Heritage, Pet-Friendly Lawns, Jiva Spa, Large Swimming Pool, Fitness Center',
                'South India’s oldest heritage hotel dating to 1891, combining art deco architecture and legendary hospitality.',
                'Raintree (Authentic Chettinad Open-Air Dining) & The Verandah 24-hr Cafe',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                'AC',
                1,
                'King Bed',
                3
            ),
            (
                chennai_aid,
                'Mylapore Courtyard Heritage Inn',
                'Chennai',
                'Luz Church Road, Mylapore, Chennai 600004',
                4.4,
                3200.0,
                'Executive AC Room, Cultural Family Room',
                'Close to Kapaleeshwarar Temple & Music Academies, Free WiFi, Travel Desk, Sanitized Rooms',
                'Traditional Tamil courtyard architecture located right in the cultural heart of Mylapore.',
                'Mylapore Tiffin Room serving Hot Idli, Vada, Poori & Fresh Filter Coffee',
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
                'AC',
                0,
                'Twin Beds',
                2
            ),

            # Thanjavur Hotels
            (
                thanjavur_aid,
                'Svatma Luxury Heritage Sanctuary',
                'Thanjavur',
                'Blake Higher Secondary Road, Thanjavur 613007',
                4.9,
                7900.0,
                'Heritage Deluxe Suite, Svatma Royal Villa',
                'Restored 100-Year-Old Brahmin Mansion, Aromatherapy Spa, Classical Carnatic Music Concerts, Rooftop Pool',
                'An ultra-exclusive luxury sanctuary dedicated to Tamil art, architecture, bronze casting, and ancient healing.',
                'Aaharam (Pure Gourmet Vegetarian Flavors) & Nila Rooftop Dining',
                'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
                'AC',
                0,
                'King Suite',
                3
            ),
            (
                thanjavur_aid,
                'Great Chola Palace & Garden Resort',
                'Thanjavur',
                'Trichy-Thanjavur Highway, Thanjavur 613005',
                4.6,
                4200.0,
                'Executive Club Room, Chola Suite, Pet Family Room',
                'Swimming Pool, Pet Welcoming Grounds, Free High-Speed WiFi, Banquet Lawns, Travel Desk',
                'Grand hotel reflecting Chola pillars and courtyard designs, ideal for visiting the Big Temple and palace.',
                'Rajarajan Multi-Cuisine Restaurant serving Traditional Thanjavur Feast & Continental favorites',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                'AC',
                1,
                'Queen Bed',
                4
            ),
            (
                thanjavur_aid,
                'Tanjore Heritage Homestay & Lodge',
                'Thanjavur',
                'South Rampart, Near Palace, Thanjavur 613001',
                4.3,
                2100.0,
                'Standard AC Room, Traditional Non-AC Double',
                'Walk to Royal Palace & Saraswathi Mahal, Free WiFi, Travel Information Desk, Authentic Hospitality',
                'Warm family-run homestay with traditional red oxide floors and wood-carved verandas.',
                'Homemade Thanjavur Sambhar Rice, Poriyal, Rasam & Curd with Appalam',
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
                'Both',
                1,
                'Twin Beds',
                2
            ),

            # Bangalore Hotels
            (
                bangalore_aid,
                'The Oberoi Bengaluru Garden City',
                'Bangalore',
                '37-39 MG Road, Bengaluru 560001',
                5.0,
                12500.0,
                'Premier Garden View Room, Deluxe Balcony Room, Presidential Suite',
                'Centenary Rain Tree Gardens, Heated Outdoor Pool, Oberoi Spa, Private Garden Balconies, High-Speed WiFi',
                'A tranquil tropical garden oasis set in the heart of Bangalore’s commercial district, famous for bespoke hospitality.',
                'Rim Naam (Alfresco Thai by Koi Pond), Le Jardin (All-Day Dining), and Polo Club Bar',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
                'AC',
                0,
                'King Bed',
                2
            ),
            (
                bangalore_aid,
                'ITC Windsor, a Luxury Collection Palace Hotel',
                'Bangalore',
                '25 Golf Course Road, Bengaluru 560052',
                4.9,
                8800.0,
                'Executive Club Room, The Manor Luxury Suite, Presidential Suite',
                'British Regency Architecture, Pet-Friendly Lawns, Kaya Kalp Spa, Swimming Pool, Golf Course Views',
                'Evokes the charm of the Victorian era with white pillared verandas, chandeliers, and manicured gardens.',
                'Dakshin (Southern Indian Masterpieces), Dum Pukht Jolly Nabobs (Awadhi Cuisine), and Royal Afghan',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                'AC',
                1,
                'Queen Bed',
                3
            ),
            (
                bangalore_aid,
                'Silicon Valley Boutique Suites & Studios',
                'Bangalore',
                '100 Feet Road, Indiranagar, Bengaluru 560038',
                4.5,
                3600.0,
                'Studio Suite, One-Bedroom Executive Apartment',
                'Kitchenette, Pet Friendly, Workstation with Ergonomic Chair, High-Speed Fiber WiFi, Gym',
                'Trendy boutique suites right next to Indiranagar’s premier cafes, craft breweries, and shopping high streets.',
                'Rooftop Cafe serving Artisan Coffee, Avocado Toast, and South Indian Breakfast Bowls',
                'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
                'AC',
                1,
                'Twin Beds',
                2
            ),

            # Kanyakumari Hotels
            (
                kanyakumari_aid,
                'The Seashore Grand Resort & Spa',
                'Kanyakumari',
                'East Car Street, Beach Road, Kanyakumari 629702',
                4.8,
                4800.0,
                'Ocean Front Deluxe Room, Sunrise Panorama Suite',
                'Direct Ocean Views from Balcony, Swimming Pool, Rooftop Sunrise Observation Deck, Spa, Free WiFi',
                'Positioned right on the shore, offering unmatched direct views of Vivekananda Rock and early morning sunrises.',
                'Ocean Whisper Multi-Cuisine Restaurant with Fresh Catch Seafood Specialties',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                'AC',
                0,
                'King Bed',
                2
            ),
            (
                kanyakumari_aid,
                'Cape Heritage Ocean View Chalet & Resort',
                'Kanyakumari',
                'Kovalam Road, Kanyakumari 629702',
                4.7,
                5600.0,
                'Heritage Beach Villa, Family Sea Chalet',
                'Private Beach Access, Pet Friendly Lawns, Children Play Area, Ayurvedic Wellness, Campfire',
                'Relaxing coastal resort surrounded by swaying coconut palms and soothing Arabian Sea breeze.',
                'Sea Wave Restaurant serving Authentic Coastal Fish Curry Meals & Kerala Parottas',
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80',
                'AC',
                1,
                'Queen Bed',
                4
            ),
            (
                kanyakumari_aid,
                'Vivekananda Sunrise Inn & Residency',
                'Kanyakumari',
                'Main Road, Near Bus Stand, Kanyakumari 629702',
                4.3,
                2200.0,
                'Standard AC Room, Budget Non-AC Triple Room',
                '500m to Triveni Sangam, Free WiFi, 24-hr Front Desk, Travel Assistance Desk',
                'Comfortable, budget-friendly lodging ideal for pilgrims and weekend coastal tourists.',
                'Annai Pure Vegetarian Mess serving Hot Dosas, Idlis, and Meals',
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
                'Both',
                0,
                'Twin Beds',
                3
            )
        ]
        cursor.executemany('''
            INSERT INTO hotels (agency_id, name, city, address, star_rating, price_per_night, room_types, amenities, description, dining_options, image_url, ac_type, pet_friendly, bed_type, max_capacity)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', hotels_data)

# seed transports (Local Taxis & Rentals per city + Intercity Buses, Trains, and Flights)
def seed_transports(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM transports')
    count = cursor.fetchone()['count']
    if count == 0:
        # Resolve agency IDs
        bangalore_cab_aid = _get_agency_id(cursor, 'bangalore_cabs') or 2
        chennai_cab_aid = _get_agency_id(cursor, 'chennai_cabs') or 4
        kodai_cab_aid = _get_agency_id(cursor, 'kodai_cabs') or 6
        madurai_cab_aid = _get_agency_id(cursor, 'madurai_cabs') or 8
        thanjavur_cab_aid = _get_agency_id(cursor, 'thanjavur_cabs') or 10
        kanyakumari_cab_aid = _get_agency_id(cursor, 'kanyakumari_cabs') or 12
        bus_aid = _get_agency_id(cursor, 'redbus_express') or 13
        rail_flight_aid = _get_agency_id(cursor, 'rail_flight_connect') or 14

        transports_data = [
            # =========================================================================
            # SECTION A: LOCAL CABS & SELF-DRIVE RENTALS (Place-Specific)
            # =========================================================================

            # 1. Madurai Local Taxis & Rentals
            (
                madurai_cab_aid,
                'Madurai Swift Dzire Chauffeur Taxi',
                'Taxi',
                'Madurai',
                'Madurai & Surrounds',
                2200.0,
                8.0,
                'AC Sedan, Verified Uniformed Chauffeur, Fuel & Tolls Included, Bottled Water, Sanitized Interior, City & Temple Sightseeing',
                'Flexible (07:00 AM - 10:00 PM)',
                'Chilled Bottled Water & Wet Wipes',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                4,
                2200.0
            ),
            (
                madurai_cab_aid,
                'Madurai Toyota Innova Crysta Family Cab',
                'Taxi',
                'Madurai',
                'Madurai & Southern Circuit',
                3800.0,
                8.0,
                'AC 7-Seater Luxury SUV, Expert Chauffeur, Large Luggage Space, FastTag Included, Music System, High Comfort Suspension',
                'Flexible (06:30 AM - 11:00 PM)',
                'Mineral Water & Route Snack Box',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                7,
                3800.0
            ),
            (
                madurai_cab_aid,
                'Madurai Mahindra Thar 4x4 Self-Drive Rental',
                'Rental',
                'Madurai',
                'Madurai & Ghats',
                2900.0,
                24.0,
                'Self-Drive 4x4 Automatic, Unlimited KM, GPS Navigation, Comprehensive Insurance, Zero Security Deposit Option, Bluetooth Touchscreen',
                '24/7 Keyless App Pickup',
                'Roadside Emergency Assistance Included',
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
                'Self-Drive Rental',
                'AC',
                4,
                2900.0
            ),
            (
                madurai_cab_aid,
                'Madurai Budget City Taxi (Non-AC)',
                'Taxi',
                'Madurai',
                'Madurai Local City',
                1400.0,
                6.0,
                'Compact Non-AC Hatchback, Local Driver, Temple & Bazaar Drops, Punctual Service',
                'Flexible (08:00 AM - 08:00 PM)',
                'Local City Map & Temple Timing Guide',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'Non-AC',
                4,
                1400.0
            ),

            # 2. Kodaikanal Local Taxis & Rentals
            (
                kodai_cab_aid,
                'Kodai Mountain Chauffeur Scorpio 4x4 Taxi',
                'Taxi',
                'Kodaikanal',
                'Kodaikanal & Berijam Valley',
                3400.0,
                8.0,
                'High-Ground Clearance 4x4 Scorpio, Experienced Hill Chauffeur, Fog Lights, Heater/AC, Forest Permits Assistance, Music System',
                'Flexible (07:30 AM - 09:00 PM)',
                'Warm Herbal Tea Flask & Bottled Water',
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                6,
                3400.0
            ),
            (
                kodai_cab_aid,
                'Kodai Hyundai Creta Self-Drive Mountain Rental',
                'Rental',
                'Kodaikanal',
                'Kodaikanal Hill Circuit',
                2700.0,
                24.0,
                'Self-Drive SUV, Hill Hold Assist, Automatic AC, Sunroof, Unlimited KM, Comprehensive Hill Insurance, 24/7 Roadside Support',
                '24/7 Station Pickup',
                'Mountain Road Emergency Kit Included',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Self-Drive Rental',
                'AC',
                5,
                2700.0
            ),
            (
                kodai_cab_aid,
                'Kodai Toyota Fortuner Luxury Chauffeur SUV',
                'Taxi',
                'Kodaikanal',
                'Kodaikanal & Poombari Villages',
                4800.0,
                10.0,
                '7-Seater Luxury SUV, Leather Recliner Seats, Chauffeur with 15+ Yrs Hill Experience, Panoramic Sunroof, FastTag, Bottled Water',
                'Flexible (06:00 AM - 10:00 PM)',
                'Gourmet Snack Basket & Fresh Hot Beverages',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                7,
                4800.0
            ),
            (
                kodai_cab_aid,
                'Kodai Budget Eco Hatchback Self-Drive',
                'Rental',
                'Kodaikanal',
                'Kodaikanal Town & Lakes',
                1800.0,
                24.0,
                'Fuel-Efficient Maruti Swift, Fresh Mountain Air Non-AC Mode, Agile on Narrow Hairpin Bends, Unlimited KM',
                '08:00 AM - 08:00 PM',
                'Hill Station Tourist Map',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Self-Drive Rental',
                'Non-AC',
                4,
                1800.0
            ),

            # 3. Chennai Local Taxis & Rentals
            (
                chennai_cab_aid,
                'Chennai Honda City Chauffeur Executive Sedan',
                'Taxi',
                'Chennai',
                'Chennai & Mahabalipuram',
                2500.0,
                8.0,
                'Premium AC Sedan, Uniformed Executive Driver, ECR Tolls Included, Sanitized, Mobile Chargers, Airport / Station Pickup',
                '24/7 on Demand',
                'Chilled Bottled Water & Daily Newspaper',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                4,
                2500.0
            ),
            (
                chennai_cab_aid,
                'Chennai Mahindra XUV700 Self-Drive Rental',
                'Rental',
                'Chennai',
                'Chennai Coastal & ECR',
                3600.0,
                24.0,
                'Luxury 7-Seater Self-Drive SUV, ADAS & Cruise Control, Dual Climate AC, Unlimited KM, Zero Deposit, Comprehensive Insurance',
                '24/7 Airport / City Drop',
                'Emergency 24x7 Roadside Support',
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
                'Self-Drive Rental',
                'AC',
                7,
                3600.0
            ),
            (
                chennai_cab_aid,
                'Chennai Tata Nexon EV Eco Self-Drive Rental',
                'Rental',
                'Chennai',
                'Chennai City & Marina',
                2800.0,
                24.0,
                '100% Electric SUV, 350km Range, Automatic Silent Drive, Touchscreen Carplay, Fast Charger Network Access Included',
                '24/7 Keyless Unlock',
                'Fast Charging Card Included',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Self-Drive Rental',
                'AC',
                5,
                2800.0
            ),
            (
                chennai_cab_aid,
                'Chennai Force Urbania Luxury 12-Seater Van',
                'Taxi',
                'Chennai',
                'Chennai Group Circuit',
                6500.0,
                10.0,
                '12 Individual Recliner Seats, Dual AC Roof Vents, Professional Chauffeur, Smart LED TV, FastTag, Huge Luggage Boot',
                'Flexible (06:00 AM - 11:00 PM)',
                'Welcome Refreshment Kits for all 12 Guests',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                12,
                6500.0
            ),

            # 4. Thanjavur Local Taxis & Rentals
            (
                thanjavur_cab_aid,
                'Thanjavur Chola Temple Tour Chauffeur Sedan',
                'Taxi',
                'Thanjavur',
                'Thanjavur & Delta Circuit',
                2100.0,
                8.0,
                'AC Sedan, Knowledgeable Local Driver, Big Temple & Palace Sightseeing, Fuel & Parking Included, Sanitized',
                'Flexible (07:00 AM - 09:00 PM)',
                'Chilled Bottled Water & Temple Guidebook',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                4,
                2100.0
            ),
            (
                thanjavur_cab_aid,
                'Thanjavur Maruti Ertiga 7-Seater Chauffeur Cab',
                'Taxi',
                'Thanjavur',
                'Thanjavur - Kumbakonam - Gangaikonda',
                3200.0,
                9.0,
                'Spacious 7-Seater AC MUV, Experienced Highway Driver, Multi-Temple Circuit Coverage, FastTag, USB Ports for all rows',
                'Flexible (06:30 AM - 09:30 PM)',
                'Bottled Water & Banana Leaf Snack Box',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                7,
                3200.0
            ),
            (
                thanjavur_cab_aid,
                'Thanjavur Maruti Baleno Self-Drive Rental',
                'Rental',
                'Thanjavur',
                'Thanjavur Delta Roads',
                2200.0,
                24.0,
                'Self-Drive Premium Hatchback, AC, Fuel Efficient, Unlimited KM, Free Cancellation, Comprehensive Coverage',
                '08:00 AM - 08:00 PM',
                'Cauvery Delta Road Map',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Self-Drive Rental',
                'AC',
                5,
                2200.0
            ),

            # 5. Bangalore Local Taxis & Rentals
            (
                bangalore_cab_aid,
                'Bengaluru Toyota Camry / Ciaz Chauffeur Sedan',
                'Taxi',
                'Bangalore',
                'Bangalore City & Airport',
                2800.0,
                8.0,
                'Executive AC Sedan, Corporate-Grade Chauffeur, Airport Tolls Included, High-Speed WiFi Dongle, Phone Chargers',
                '24/7 on Demand',
                'Mineral Water, Wet Wipes & Mint Candies',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                4,
                2800.0
            ),
            (
                bangalore_cab_aid,
                'Bengaluru ZoomWheels Thar 4x4 Self-Drive Rental',
                'Rental',
                'Bangalore',
                'Bangalore & Nandi Hills',
                3200.0,
                24.0,
                'Hard-Top 4x4 Convertible Thar, Automatic, Touchscreen Infotainment, Keyless App Pickup, Unlimited KM, Zero Deposit',
                '24/7 App Keyless Unlock',
                '24x7 Roadside Assistance & Tire Support',
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
                'Self-Drive Rental',
                'AC',
                4,
                3200.0
            ),
            (
                bangalore_cab_aid,
                'Bengaluru Innova Hycross Hybrid Chauffeur Taxi',
                'Taxi',
                'Bangalore',
                'Bangalore & Outstation Circuit',
                4200.0,
                10.0,
                'Ultra-Silent Hybrid 7-Seater, Ottoman Reclining Captain Seats, Panoramic Roof, Dedicated Chauffeur, FastTag',
                'Flexible (06:00 AM - 11:30 PM)',
                'Gourmet Snack Basket & Chilled Beverages',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                7,
                4200.0
            ),
            (
                bangalore_cab_aid,
                'Bengaluru Compact Kia Sonet Self-Drive',
                'Rental',
                'Bangalore',
                'Bangalore Urban & Cafes',
                2400.0,
                24.0,
                'Compact City SUV, Automatic Turbo, Reverse Camera, Bluetooth Audio, Sanitized, Unlimited KM',
                '24/7 City Center Pickup',
                'City Parking Guide App Integration',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Self-Drive Rental',
                'AC',
                5,
                2400.0
            ),

            # 6. Kanyakumari Local Taxis & Rentals
            (
                kanyakumari_cab_aid,
                'Kanyakumari Ocean Drive Chauffeur Sedan',
                'Taxi',
                'Kanyakumari',
                'Kanyakumari & Lands End',
                2300.0,
                8.0,
                'AC Sedan, Friendly Local Chauffeur, Sunrise to Sunset Points Covered, Parking & Tolls Included, Clean & Sanitized',
                'Flexible (05:30 AM - 08:30 PM)',
                'Chilled Bottled Water & Sunrise Guide',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                4,
                2300.0
            ),
            (
                kanyakumari_cab_aid,
                'Kanyakumari Innova Coastal Safari Cab',
                'Taxi',
                'Kanyakumari',
                'Kanyakumari - Padmanabhapuram - Vattakottai',
                3600.0,
                9.0,
                '7-Seater AC SUV, Experienced Coastal Driver, Forts and Palaces Circuit, FastTag Included, Dual AC',
                'Flexible (06:00 AM - 09:00 PM)',
                'Mineral Water & Coastal Banana Chips',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                'Taxi Service',
                'AC',
                7,
                3600.0
            ),
            (
                kanyakumari_cab_aid,
                'Kanyakumari Open-Air Beach Gypsy / Jeep Self-Drive',
                'Rental',
                'Kanyakumari',
                'Kanyakumari Coastal Highway',
                2000.0,
                24.0,
                'Open-Top Beach Jeep, Non-AC Pure Ocean Air Drive, 4WD Capability, Unlimited KM, Perfect for Coastal Photography',
                '06:00 AM - 08:00 PM',
                'Beach Road Map & Sunset Points Guide',
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
                'Self-Drive Rental',
                'Non-AC',
                4,
                2000.0
            ),

            # =========================================================================
            # SECTION B: INTERCITY BUSES, TRAINS & FLIGHTS (RedBus / MMT Style)
            # =========================================================================

            # Intercity Buses (RedBus Express)
            (
                bus_aid,
                'Zingbus Multi-Axle Volvo AC Sleeper (Bangalore to Chennai)',
                'Bus',
                'Bangalore',
                'Chennai',
                850.0,
                6.0,
                'AC Sleeper Berths, Individual Charging Ports, Sanitized Blankets & Pillows, Live GPS Tracking, Reading Lights, Experienced Highway Captains',
                '10:30 PM (Overnight)',
                'Complimentary Mineral Water & Biscuit Pack',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                'Intercity Bus',
                'AC',
                36,
                850.0
            ),
            (
                bus_aid,
                'IntrCity SmartBus Volvo 2+1 AC Sleeper (Chennai to Madurai)',
                'Bus',
                'Chennai',
                'Madurai',
                790.0,
                7.5,
                'AC Sleeper, Clean Fresh Linens, SOS Emergency Button, Punctual Boarding, Automatic Climate Control, Air Suspension',
                '09:45 PM (Overnight)',
                'Bottled Water & Wet Wipes',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                'Intercity Bus',
                'AC',
                36,
                790.0
            ),
            (
                bus_aid,
                'KPN Premium Sleeper Coach (Bangalore to Kodaikanal)',
                'Bus',
                'Bangalore',
                'Kodaikanal',
                980.0,
                8.5,
                'AC Sleeper, Mountain Road Suspension, Push-Back Berths, Scenic Ghat Arrival, Luggage Assistance',
                '09:00 PM (Overnight)',
                'Bottled Mineral Water',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                'Intercity Bus',
                'AC',
                32,
                980.0
            ),
            (
                bus_aid,
                'SRS Travels Semi-Sleeper Non-AC (Chennai to Thanjavur)',
                'Bus',
                'Chennai',
                'Thanjavur',
                450.0,
                6.5,
                'Non-AC Semi-Sleeper, Reclining Pushback Seats, USB Phone Charger, Economical & Fast Highway Connect',
                '10:00 PM (Overnight)',
                'None',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                'Intercity Bus',
                'Non-AC',
                40,
                450.0
            ),
            (
                bus_aid,
                'GreenLine Travels AC Multi-Axle (Madurai to Kanyakumari)',
                'Bus',
                'Madurai',
                'Kanyakumari',
                550.0,
                4.0,
                'AC Seater/Sleeper, High Speed Onboard WiFi, Live Journey Tracking, Chilled AC, NH44 Expressway Express',
                '06:30 AM (Morning)',
                'Refreshment Kit & Juice Box',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                'Intercity Bus',
                'AC',
                38,
                550.0
            ),
            (
                bus_aid,
                'Orange Travels Luxury Sleeper (Bangalore to Madurai)',
                'Bus',
                'Bangalore',
                'Madurai',
                890.0,
                7.0,
                'Luxury AC Sleeper, Individual LCD Entertainment Screens, Sanitized Blankets, Fast NH44 Highway Route',
                '10:15 PM (Overnight)',
                'Mineral Water & Snack Box',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                'Intercity Bus',
                'AC',
                34,
                890.0
            ),
            (
                bus_aid,
                'SETC Ultra Deluxe Non-AC (Chennai to Kanyakumari)',
                'Bus',
                'Chennai',
                'Kanyakumari',
                650.0,
                12.0,
                'State Express Transport Coach, Ergonomic Pushback Seats, Direct Long-Haul Coastal Corridor',
                '06:00 PM (Evening)',
                'None',
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                'Intercity Bus',
                'Non-AC',
                42,
                650.0
            ),

            # Intercity Trains (Southern Railways Express & Vande Bharat)
            (
                rail_flight_aid,
                'Vande Bharat Superfast Express 20607 (Chennai to Bangalore)',
                'Train',
                'Chennai',
                'Bangalore',
                1080.0,
                4.2,
                'Executive AC Chair Car, 160 kmph Top Speed, Bio-Vacuum Toilets, 180° Rotating Seats, CCTV Surveillance, Infotainment Screens',
                '05:50 AM (Morning Express)',
                'Hot Gourmet Breakfast & Traditional Filter Coffee Included',
                'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=800&q=80',
                'Express Train',
                'AC',
                78,
                1080.0
            ),
            (
                rail_flight_aid,
                'Vande Bharat Express 20635 (Chennai to Madurai)',
                'Train',
                'Chennai',
                'Madurai',
                1365.0,
                5.8,
                'AC Chair Car, High-Speed Aerodynamic Train, Touch-Free Automatic Doors, Real-Time Passenger Information GPS Displays',
                '05:15 AM (Morning Express)',
                'Traditional South Indian Breakfast & High Tea Included',
                'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=800&q=80',
                'Express Train',
                'AC',
                78,
                1365.0
            ),
            (
                rail_flight_aid,
                'Kanyakumari Superfast Express 12633 (Chennai to Kanyakumari)',
                'Train',
                'Chennai',
                'Kanyakumari',
                520.0,
                12.5,
                '3-Tier AC & Sleeper Coach, Overnight Scenic Coastal Track, Clean Bedrolls, Dedicated Security Staff',
                '05:20 PM (Evening Express)',
                'Pantry Catering Available on Order',
                'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=800&q=80',
                'Express Train',
                'AC',
                72,
                520.0
            ),
            (
                rail_flight_aid,
                'Mysuru - Thanjavur Express 16232 (Bangalore to Thanjavur)',
                'Train',
                'Bangalore',
                'Thanjavur',
                460.0,
                9.0,
                'AC 3-Tier & Non-AC Sleeper, Clean Bedrolls, Scenic Cauvery Delta Route, Punctual Track Schedule',
                '07:00 PM (Night Express)',
                'Pantry Meal Service Available',
                'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=800&q=80',
                'Express Train',
                'AC',
                72,
                460.0
            ),

            # Regional Flights (Air Connect)
            (
                rail_flight_aid,
                'IndiGo Regional Air Connect 6E-7215 (Bangalore to Chennai)',
                'Flight',
                'Bangalore',
                'Chennai',
                2850.0,
                0.9,
                'Direct Jet ATR-72 / A320, 15kg Check-in Baggage Allowance, 7kg Cabin Baggage, Express Boarding & Seamless Web Check-in',
                '08:15 AM (Morning Flight)',
                'In-flight Cafe Menu for Purchase',
                'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
                'Regional Flight',
                'AC',
                72,
                2850.0
            ),
            (
                rail_flight_aid,
                'Air India Regional Connect AI-542 (Chennai to Madurai)',
                'Flight',
                'Chennai',
                'Madurai',
                3200.0,
                1.1,
                'Direct Jet A320neo, Complimentary Refreshments, 15kg Check-in Luggage, Priority Baggage Handling, Rapid Transit',
                '11:30 AM (Noon Flight)',
                'Complimentary Sandwich & Beverage Service',
                'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
                'Regional Flight',
                'AC',
                150,
                3200.0
            )
        ]
        cursor.executemany('''
            INSERT INTO transports (agency_id, title, transport_type, source_city, destination_city, price, duration_hours, features, departure_time, meal_service, image_url, service_type, ac_type, seating_capacity, daily_rate)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                'Magical 3 Days in Kodaikanal!',
                'The mist at Coakers walk and the fresh homemade chocolates were sublime. FastTrack cabs made transit seamless.',
                'Family',
                1
            ),
            (
                2,
                'package',
                2,
                5,
                'Berijam Safari was the Highlight of our Trip',
                'The 5-day itinerary was so well-paced. The private SUV and forest guide made our wilderness dream come true.',
                'Couple',
                1
            ),
            (
                1,
                'package',
                4,
                5,
                'Meenakshi Temple & Keeladi were mindblowing',
                'Exceptional historical depth! The guide brought 2,000 years of Madurai history alive.',
                'Solo',
                1
            ),
            (
                3,
                'hotel',
                1,
                5,
                'Banyan Resort Heritage Madurai is a Masterpiece',
                'Geoffrey Bawas architecture and the Olympic temple pool made our stay unforgettable.',
                'Family',
                1
            ),
            (
                2,
                'transport',
                1,
                5,
                'Punctual and Polite Chauffeur in Madurai',
                'Driver was polite, vehicle was spotless with AC on throughout.',
                'Couple',
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
                'Welcome to Roamly Expeditions',
                'Your Roamly Explorer Passport is active with ₹5,000 complimentary travel credits.',
                'system',
                '/dashboard',
                0
            ),
            (
                1,
                'Booking Confirmed #ROAM-PAC-0001',
                'Your Kodaikanal Misty Pines Classic Getaway has been confirmed.',
                'booking',
                '/bookings/summary/1',
                0
            ),
            (
                2,
                'Welcome to Roamly Expeditions',
                'Start exploring handcrafted South Indian holiday packages and taxi/self-drive rentals.',
                'system',
                '/packages',
                0
            )
        ]
        cursor.executemany('''
            INSERT INTO notifications (user_id, title, message, notification_type, link_url, is_read)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', notifs_data)

# seed saved items
def seed_saved_items(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM saved_items')
    count = cursor.fetchone()['count']
    if count == 0:
        saved_data = [
            (1, 'package', 2),
            (1, 'hotel', 1),
            (1, 'transport', 1),
            (2, 'package', 1)
        ]
        cursor.executemany('''
            INSERT INTO saved_items (user_id, item_type, item_id)
            VALUES (%s, %s, %s)
        ''', saved_data)

# seed coupons
def seed_coupons(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM coupons')
    count = cursor.fetchone()['count']
    if count == 0:
        coupons_data = [
            ('ROAMFIRST', 'percentage', 15.0, 1000.0, 2500.0, '15% instant discount on your first Indian expedition booking', 1),
            ('SUMMER20', 'percentage', 20.0, 2000.0, 3000.0, '20% discount on hill station chalets and mountain tours', 1),
            ('SOUTHTRAILS', 'flat', 1000.0, 4000.0, 1000.0, 'Flat ₹1,000 off on heritage & coastal packages', 1),
            ('DRIVE15', 'percentage', 15.0, 1500.0, 2000.0, '15% discount on self-drive car rentals and private taxis', 1)
        ]
        cursor.executemany('''
            INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, description, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', coupons_data)

# seed wallets
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
            (1, 14500.0, 1450.0, 13050.0, 'HDFC Bank - A/C 501004928192 (IFSC: HDFC0001234) - FastTrack Cabs', 'Approved'),
            (3, 11800.0, 1180.0, 10620.0, 'State Bank of India - A/C 30291049281 (IFSC: SBIN0000456) - Heritage Palaces', 'Processed'),
            (2, 6400.0, 640.0, 5760.0, 'ICICI Bank - A/C 001205019284 (IFSC: ICIC0000012) - ZoomWheels', 'Pending')
        ]
        cursor.executemany('''
            INSERT INTO agency_payouts (agency_id, amount, commission_amount, net_payout, bank_account_info, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', payouts_data)

# seed initial sample bookings
def seed_initial_bookings(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM bookings')
    count = cursor.fetchone()['count']
    if count == 0:
        cursor.execute('''
            INSERT INTO bookings (user_id, booking_type, package_id, hotel_id, transport_id, travel_date, num_travelers, total_price, status, pickup_location, special_requests)
            VALUES (1, 'Package', 1, NULL, NULL, '2026-10-15', 2, 15998.00, 'Confirmed', 'Madurai / Kodai Road Station', 'Vegetarian meals preferred')
        ''')
        b_id = cursor.lastrowid
        cursor.execute('''
            INSERT INTO payments (booking_id, user_id, amount, payment_method, status, transaction_id)
            VALUES (%s, 1, 15998.00, 'Roamly Wallet', 'Completed', 'TXN-ROAM-99210482')
        ''', (b_id,))
        cursor.execute('''
            INSERT INTO invoices (invoice_number, booking_id, user_id, subtotal, tax_amount, discount, total_amount)
            VALUES ('INV-2026-000001', %s, 1, 14283.93, 1714.07, 0.00, 15998.00)
        ''', (b_id,))
        cursor.execute('''
            INSERT INTO messages (booking_id, sender_type, sender_id, recipient_id, message_text, is_read)
            VALUES 
            (%s, 'agency', 5, 1, 'Welcome to Roamly South Expeditions! Your Kodaikanal classic itinerary is confirmed. Driver details will be shared on morning of travel.', 1),
            (%s, 'user', 1, 1, 'Thank you! Looking forward to the mountain trip.', 1)
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
