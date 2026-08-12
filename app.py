import sqlite3
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash

app = Flask(__name__)
app.secret_key = 'super_secret_key_for_session'

DATABASE = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            address TEXT DEFAULT '',
            bio TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Schema migration check for users table columns
    cursor.execute("PRAGMA table_info(users)")
    existing_cols = [row['name'] for row in cursor.fetchall()]
    for col, col_type in [
        ('full_name', "TEXT DEFAULT ''"),
        ('phone', "TEXT DEFAULT ''"),
        ('address', "TEXT DEFAULT ''"),
        ('bio', "TEXT DEFAULT ''"),
        ('created_at', "TIMESTAMP")
    ]:
        if col not in existing_cols:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")

    # 2. User Preferences Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            user_id INTEGER PRIMARY KEY,
            preferred_travel_mode TEXT DEFAULT 'Train',
            dietary_preference TEXT DEFAULT 'Vegetarian',
            budget_range TEXT DEFAULT 'Moderate',
            preferred_categories TEXT DEFAULT 'Hill Station',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # 3. Packages Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            destination TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            duration_days INTEGER NOT NULL,
            duration_nights INTEGER NOT NULL,
            description TEXT NOT NULL,
            highlights TEXT NOT NULL,
            included_amenities TEXT NOT NULL,
            rating REAL DEFAULT 4.5,
            image_url TEXT
        )
    ''')

    # 4. Bookings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            package_id INTEGER NOT NULL,
            travel_date TEXT NOT NULL,
            num_travelers INTEGER NOT NULL DEFAULT 1,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'Confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
        )
    ''')

    # 5. Seed packages if empty
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

    conn.commit()
    conn.close()

# Initialize Database
init_db()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Context Processor to share compare package count across templates
@app.context_processor
def inject_compare_count():
    compare_list = session.get('compare_packages', [])
    return dict(compare_count=len(compare_list))

@app.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form['username'].strip()
        email = request.form['email'].strip()
        password = request.form['password'].strip()

        if not username or not email or not password:
            flash('All fields are required.', 'danger')
            return render_template('signup.html')

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM users WHERE username = ? OR email = ?', (username, email))
        existing_user = cursor.fetchone()

        if existing_user:
            conn.close()
            flash('Username or email already registered. Please login.', 'danger')
            return render_template('signup.html')

        cursor.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            (username, email, password)
        )
        new_user_id = cursor.lastrowid
        
        # Initialize default user preferences
        cursor.execute(
            'INSERT OR IGNORE INTO user_preferences (user_id) VALUES (?)',
            (new_user_id,)
        )
        conn.commit()
        conn.close()

        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password'].strip()

        if not username or not password:
            flash('Please enter both username and password.', 'danger')
            return render_template('login.html')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password))
        user = cursor.fetchone()
        conn.close()

        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            flash('Logged in successfully!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'danger')
            return render_template('login.html')

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))

# ==========================================
# MODULE 2: USER DASHBOARD (PROFILE, PREFERENCES, BOOKINGS)
# ==========================================

@app.route('/dashboard')
@login_required
def dashboard():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch User Info
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()

    # Fetch Preferences
    cursor.execute('SELECT * FROM user_preferences WHERE user_id = ?', (user_id,))
    preferences = cursor.fetchone()

    # Fetch Bookings
    cursor.execute('''
        SELECT b.*, p.title as package_title, p.destination, p.category, p.image_url
        FROM bookings b
        JOIN packages p ON b.package_id = p.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    ''', (user_id,))
    bookings = cursor.fetchall()
    conn.close()

    active_tab = request.args.get('tab', 'overview')

    return render_template(
        'dashboard.html',
        user=user,
        preferences=preferences,
        bookings=bookings,
        active_tab=active_tab,
        username=session.get('username')
    )

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        full_name = request.form.get('full_name', '').strip()
        phone = request.form.get('phone', '').strip()
        address = request.form.get('address', '').strip()
        bio = request.form.get('bio', '').strip()

        if not email:
            flash('Email address cannot be empty.', 'danger')
            conn.close()
            return redirect(url_for('dashboard', tab='profile'))

        # Check if email is used by another user
        cursor.execute('SELECT id FROM users WHERE email = ? AND id != ?', (email, user_id))
        if cursor.fetchone():
            flash('Email is already taken by another account.', 'danger')
            conn.close()
            return redirect(url_for('dashboard', tab='profile'))

        cursor.execute('''
            UPDATE users
            SET email = ?, full_name = ?, phone = ?, address = ?, bio = ?
            WHERE id = ?
        ''', (email, full_name, phone, address, bio, user_id))
        conn.commit()
        conn.close()

        flash('Profile updated successfully!', 'success')
        return redirect(url_for('dashboard', tab='profile'))

    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    return render_template('dashboard.html', user=user, active_tab='profile', username=session.get('username'))

@app.route('/preferences', methods=['GET', 'POST'])
@login_required
def preferences():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'POST':
        preferred_travel_mode = request.form.get('preferred_travel_mode', 'Train')
        dietary_preference = request.form.get('dietary_preference', 'Vegetarian')
        budget_range = request.form.get('budget_range', 'Moderate')
        preferred_categories_list = request.form.getlist('preferred_categories')
        preferred_categories = ', '.join(preferred_categories_list) if preferred_categories_list else 'Hill Station'

        cursor.execute('''
            INSERT INTO user_preferences (user_id, preferred_travel_mode, dietary_preference, budget_range, preferred_categories)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                preferred_travel_mode = excluded.preferred_travel_mode,
                dietary_preference = excluded.dietary_preference,
                budget_range = excluded.budget_range,
                preferred_categories = excluded.preferred_categories
        ''', (user_id, preferred_travel_mode, dietary_preference, budget_range, preferred_categories))
        conn.commit()
        conn.close()

        flash('Travel preferences saved successfully!', 'success')
        return redirect(url_for('dashboard', tab='preferences'))

    cursor.execute('SELECT * FROM user_preferences WHERE user_id = ?', (user_id,))
    preferences_data = cursor.fetchone()
    conn.close()
    return render_template('dashboard.html', preferences=preferences_data, active_tab='preferences', username=session.get('username'))

@app.route('/bookings/cancel/<int:booking_id>', methods=['POST'])
@login_required
def cancel_booking(booking_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM bookings WHERE id = ? AND user_id = ?', (booking_id, user_id))
    booking = cursor.fetchone()

    if booking:
        cursor.execute("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", (booking_id,))
        conn.commit()
        flash('Booking has been cancelled.', 'success')
    else:
        flash('Booking record not found.', 'danger')

    conn.close()
    return redirect(url_for('dashboard', tab='bookings'))


# ==========================================
# MODULE 3: DESTINATIONS & PACKAGES (SEARCH, FILTERS, VIEW, COMPARE)
# ==========================================

@app.route('/packages')
def packages():
    query = request.args.get('q', '').strip()
    category = request.args.get('category', '').strip()
    min_price = request.args.get('min_price', '').strip()
    max_price = request.args.get('max_price', '').strip()
    sort_by = request.args.get('sort_by', 'popular').strip()

    sql = 'SELECT * FROM packages WHERE 1=1'
    params = []

    if query:
        sql += ' AND (title LIKE ? OR destination LIKE ? OR description LIKE ?)'
        wildcard_q = f'%{query}%'
        params.extend([wildcard_q, wildcard_q, wildcard_q])

    if category:
        sql += ' AND category LIKE ?'
        params.append(f'%{category}%')

    if min_price and min_price.isdigit():
        sql += ' AND price >= ?'
        params.append(float(min_price))

    if max_price and max_price.isdigit():
        sql += ' AND price <= ?'
        params.append(float(max_price))

    if sort_by == 'price_asc':
        sql += ' ORDER BY price ASC'
    elif sort_by == 'price_desc':
        sql += ' ORDER BY price DESC'
    elif sort_by == 'rating_desc':
        sql += ' ORDER BY rating DESC'
    elif sort_by == 'duration_asc':
        sql += ' ORDER BY duration_days ASC'
    else:
        sql += ' ORDER BY rating DESC, price ASC'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    packages_list = cursor.fetchall()

    # Get distinct categories for filter dropdown
    cursor.execute('SELECT DISTINCT category FROM packages')
    categories = [row['category'] for row in cursor.fetchall()]

    conn.close()

    compare_list = session.get('compare_packages', [])

    return render_template(
        'packages.html',
        packages=packages_list,
        categories=categories,
        query=query,
        selected_category=category,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        compare_list=compare_list
    )

@app.route('/packages/<int:package_id>')
def package_detail(package_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM packages WHERE id = ?', (package_id,))
    pkg = cursor.fetchone()
    conn.close()

    if not pkg:
        flash('Package not found.', 'danger')
        return redirect(url_for('packages'))

    compare_list = session.get('compare_packages', [])
    is_in_compare = package_id in compare_list

    return render_template('package_detail.html', package=pkg, is_in_compare=is_in_compare)

@app.route('/book/<int:package_id>', methods=['POST'])
@login_required
def book_package(package_id):
    user_id = session['user_id']
    travel_date = request.form.get('travel_date')
    num_travelers = request.form.get('num_travelers', '1')

    if not travel_date:
        flash('Please select a valid travel date.', 'danger')
        return redirect(url_for('package_detail', package_id=package_id))

    try:
        num_travelers = int(num_travelers)
        if num_travelers < 1:
            num_travelers = 1
    except ValueError:
        num_travelers = 1

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM packages WHERE id = ?', (package_id,))
    pkg = cursor.fetchone()

    if not pkg:
        conn.close()
        flash('Package not found.', 'danger')
        return redirect(url_for('packages'))

    total_price = pkg['price'] * num_travelers

    cursor.execute('''
        INSERT INTO bookings (user_id, package_id, travel_date, num_travelers, total_price, status)
        VALUES (?, ?, ?, ?, ?, 'Confirmed')
    ''', (user_id, package_id, travel_date, num_travelers, total_price))
    conn.commit()
    conn.close()

    flash(f'Successfully booked "{pkg["title"]}" for {num_travelers} traveler(s)!', 'success')
    return redirect(url_for('dashboard', tab='bookings'))

@app.route('/compare/toggle/<int:package_id>', methods=['POST', 'GET'])
def compare_toggle(package_id):
    compare_list = session.get('compare_packages', [])

    if package_id in compare_list:
        compare_list.remove(package_id)
        flash('Package removed from comparison list.', 'info')
    else:
        if len(compare_list) >= 3:
            flash('You can compare up to 3 packages at a time. Removed the oldest selection.', 'warning')
            compare_list.pop(0)
        compare_list.append(package_id)
        flash('Package added to comparison list!', 'success')

    session['compare_packages'] = compare_list
    session.modified = True

    referrer = request.referrer or url_for('packages')
    return redirect(referrer)

@app.route('/compare/clear', methods=['POST', 'GET'])
def compare_clear():
    session['compare_packages'] = []
    session.modified = True
    flash('Comparison list cleared.', 'info')
    return redirect(url_for('packages'))

@app.route('/compare')
def compare():
    compare_ids = session.get('compare_packages', [])

    if not compare_ids:
        return render_template('compare.html', packages=[])

    conn = get_db_connection()
    cursor = conn.cursor()
    
    placeholders = ','.join(['?'] * len(compare_ids))
    cursor.execute(f'SELECT * FROM packages WHERE id IN ({placeholders})', compare_ids)
    packages_list = cursor.fetchall()
    conn.close()

    return render_template('compare.html', packages=packages_list)

if __name__ == '__main__':
    app.run(debug=True)

