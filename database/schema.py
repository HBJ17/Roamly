from database.connection import get_db_connection
from database.seed import seed_packages

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
    seed_packages(cursor)

    conn.commit()
    conn.close()
