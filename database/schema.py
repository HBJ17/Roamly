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
        ('passengers_names', "TEXT DEFAULT ''")
    ]:
        if col not in existing_cols_bk:
            cursor.execute(f"ALTER TABLE bookings ADD COLUMN {col} {col_type}")

    # Seed data
    seed_admin(cursor)
    seed_agencies(cursor)
    seed_packages(cursor)
    seed_hotels(cursor)
    seed_transports(cursor)

    conn.commit()
    conn.close()
