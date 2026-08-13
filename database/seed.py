def seed_packages(cursor):
    cursor.execute('SELECT COUNT(*) as count FROM packages')
    count = cursor.fetchone()['count']
    if count == 0:
        seed_packages = [
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
                'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80'
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
                'https://images.unsplash.com/photo-1626014903708-69b614006c9a?auto=format&fit=crop&w=800&q=80'
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
                'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80'
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
                'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80'
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
                'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80'
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
                'https://images.unsplash.com/photo-1600100397608-f090742f40b2?auto=format&fit=crop&w=800&q=80'
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
                'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80'
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
                'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80'
            )
        ]
        cursor.executemany('''
            INSERT INTO packages (title, destination, category, price, duration_days, duration_nights, description, highlights, included_amenities, rating, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_packages)
