from database.connection import get_db_connection
from database.seed import (
    seed_packages,
    seed_admin,
    seed_agencies,
    seed_hotels,
    seed_transports
)

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
    existing_cols_users = [row['name'] for row in cursor.fetchall()]
    for col, col_type in [
        ('full_name', "TEXT DEFAULT ''"),
        ('phone', "TEXT DEFAULT ''"),
        ('address', "TEXT DEFAULT ''"),
        ('bio', "TEXT DEFAULT ''"),
        ('created_at', "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ]:
        if col not in existing_cols_users:
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

    # 3. Admins Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT DEFAULT 'Super Administrator',
            role TEXT DEFAULT 'superadmin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 4. Agencies Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            agency_type TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT DEFAULT '',
            address TEXT DEFAULT '',
            status TEXT DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 5. Hotels Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agency_id INTEGER,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            address TEXT NOT NULL,
            star_rating REAL DEFAULT 4.0,
            price_per_night REAL NOT NULL,
            room_types TEXT NOT NULL,
            amenities TEXT NOT NULL,
            description TEXT NOT NULL,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
        )
    ''')

    # 6. Transports Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agency_id INTEGER,
            title TEXT NOT NULL,
            transport_type TEXT NOT NULL,
            source_city TEXT NOT NULL,
            destination_city TEXT NOT NULL,
            price REAL NOT NULL,
            duration_hours REAL NOT NULL,
            features TEXT NOT NULL,
            departure_time TEXT DEFAULT '06:00 AM',
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
        )
    ''')

    # 7. Packages Table
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
            image_url TEXT,
            agency_id INTEGER,
            FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
        )
    ''')

    # Migration for packages table
    cursor.execute("PRAGMA table_info(packages)")
    existing_cols_pkg = [row['name'] for row in cursor.fetchall()]
    if 'agency_id' not in existing_cols_pkg:
        cursor.execute("ALTER TABLE packages ADD COLUMN agency_id INTEGER")

    # 8. Bookings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            package_id INTEGER,
            hotel_id INTEGER,
            transport_id INTEGER,
            booking_type TEXT DEFAULT 'Package',
            travel_date TEXT NOT NULL,
            check_out_date TEXT DEFAULT '',
            num_travelers INTEGER NOT NULL DEFAULT 1,
            room_type TEXT DEFAULT '',
            pickup_location TEXT DEFAULT '',
            drop_location TEXT DEFAULT '',
            special_requests TEXT DEFAULT '',
            contact_phone TEXT DEFAULT '',
            contact_email TEXT DEFAULT '',
            passengers_names TEXT DEFAULT '',
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'Confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
            FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
            FOREIGN KEY (transport_id) REFERENCES transports(id) ON DELETE SET NULL
        )
    ''')

    # Migration for bookings table
    cursor.execute("PRAGMA table_info(bookings)")
    existing_cols_bk = [row['name'] for row in cursor.fetchall()]
    for col, col_type in [
        ('hotel_id', "INTEGER"),
        ('transport_id', "INTEGER"),
        ('booking_type', "TEXT DEFAULT 'Package'"),
        ('check_out_date', "TEXT DEFAULT ''"),
        ('room_type', "TEXT DEFAULT ''"),
        ('pickup_location', "TEXT DEFAULT ''"),
        ('drop_location', "TEXT DEFAULT ''"),
        ('special_requests', "TEXT DEFAULT ''"),
        ('contact_phone', "TEXT DEFAULT ''"),
        ('contact_email', "TEXT DEFAULT ''"),
        ('passengers_names', "TEXT DEFAULT ''"),
        ('payment_status', "TEXT DEFAULT 'Paid'"),
        ('trip_status', "TEXT DEFAULT 'Upcoming'"),
        ('subtotal_amount', "REAL DEFAULT 0.0"),
        ('tax_amount', "REAL DEFAULT 0.0"),
        ('discount_amount', "REAL DEFAULT 0.0"),
        ('discount_code', "TEXT DEFAULT ''")
    ]:
        if col not in existing_cols_bk:
            cursor.execute(f"ALTER TABLE bookings ADD COLUMN {col} {col_type}")

    # Additional migrations for packages, hotels, transports (food & dining highlights)
    cursor.execute("PRAGMA table_info(packages)")
    existing_cols_pkg = [row['name'] for row in cursor.fetchall()]
    for col, col_type in [
        ('food_highlights', "TEXT DEFAULT ''"),
        ('agency_id', "INTEGER")
    ]:
        if col not in existing_cols_pkg:
            cursor.execute(f"ALTER TABLE packages ADD COLUMN {col} {col_type}")

    cursor.execute("PRAGMA table_info(hotels)")
    existing_cols_htl = [row['name'] for row in cursor.fetchall()]
    for col, col_type in [
        ('dining_options', "TEXT DEFAULT 'In-House Multi-Cuisine Restaurant & Room Service'"),
        ('agency_id', "INTEGER")
    ]:
        if col not in existing_cols_htl:
            cursor.execute(f"ALTER TABLE hotels ADD COLUMN {col} {col_type}")

    cursor.execute("PRAGMA table_info(transports)")
    existing_cols_trn = [row['name'] for row in cursor.fetchall()]
    for col, col_type in [
        ('meal_service', "TEXT DEFAULT 'Complimentary Bottled Water & Snack Kit'"),
        ('agency_id', "INTEGER")
    ]:
        if col not in existing_cols_trn:
            cursor.execute(f"ALTER TABLE transports ADD COLUMN {col} {col_type}")

    # 9. Payments Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            transaction_id TEXT UNIQUE NOT NULL,
            payment_method TEXT NOT NULL,
            payment_gateway TEXT DEFAULT 'Roamly Secure Pay',
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'INR',
            status TEXT DEFAULT 'Success',
            card_last4 TEXT DEFAULT '',
            payer_name TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # 10. Invoices Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT UNIQUE NOT NULL,
            booking_id INTEGER UNIQUE NOT NULL,
            payment_id INTEGER,
            user_id INTEGER NOT NULL,
            agency_id INTEGER,
            subtotal REAL NOT NULL,
            tax_amount REAL NOT NULL,
            discount_amount REAL DEFAULT 0.0,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'Paid',
            issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # 11. Notifications Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            notification_type TEXT DEFAULT 'booking',
            link_url TEXT DEFAULT '',
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # 12. Email Logs Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            body_html TEXT NOT NULL,
            email_type TEXT DEFAULT 'Booking Confirmation',
            status TEXT DEFAULT 'Sent',
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # 13. Reviews Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_type TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            title TEXT NOT NULL,
            comment TEXT NOT NULL,
            travel_type TEXT DEFAULT 'Family',
            verified_booking INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # 14. Saved / Favorite Items Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_type TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, item_type, item_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Seed data
    seed_admin(cursor)
    seed_agencies(cursor)
    seed_packages(cursor)
    seed_hotels(cursor)
    seed_transports(cursor)

    conn.commit()
    conn.close()
