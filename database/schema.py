from database.connection import get_db_connection
from database.seed import (
    seed_packages,
    seed_admin,
    seed_users,
    seed_agencies,
    seed_hotels,
    seed_transports,
    seed_reviews,
    seed_notifications,
    seed_saved_items,
    seed_coupons,
    seed_wallets,
    seed_payouts
)

# initialize database schema
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(191) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(150) DEFAULT '',
            phone VARCHAR(50) DEFAULT '',
            address VARCHAR(255) DEFAULT '',
            bio TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # user preferences table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNIQUE NOT NULL,
            preferred_travel_mode VARCHAR(50) DEFAULT 'Train',
            dietary_preference VARCHAR(50) DEFAULT 'Vegetarian',
            budget_range VARCHAR(50) DEFAULT 'Moderate',
            preferred_categories VARCHAR(255) DEFAULT 'Hill Station',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # admins table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(191) UNIQUE NOT NULL,
            full_name VARCHAR(150) DEFAULT 'Administrator',
            role VARCHAR(50) DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # agencies table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agencies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(200) NOT NULL,
            agency_type VARCHAR(100) NOT NULL,
            email VARCHAR(191) UNIQUE NOT NULL,
            phone VARCHAR(50) DEFAULT '',
            address VARCHAR(255) DEFAULT '',
            status VARCHAR(50) DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # packages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            destination VARCHAR(150) NOT NULL,
            category VARCHAR(100) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            duration_days INT NOT NULL,
            duration_nights INT NOT NULL,
            description TEXT NOT NULL,
            highlights TEXT NOT NULL,
            included_amenities TEXT NOT NULL,
            food_highlights TEXT,
            rating DOUBLE DEFAULT 4.5,
            image_url TEXT,
            agency_id INT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # hotels table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hotels (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agency_id INT,
            name VARCHAR(200) NOT NULL,
            city VARCHAR(100) NOT NULL,
            address VARCHAR(255) NOT NULL,
            star_rating DOUBLE DEFAULT 4.0,
            price_per_night DECIMAL(10,2) NOT NULL,
            room_types TEXT NOT NULL,
            amenities TEXT NOT NULL,
            description TEXT NOT NULL,
            dining_options TEXT,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # transports table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agency_id INT,
            title VARCHAR(200) NOT NULL,
            transport_type VARCHAR(50) NOT NULL,
            source_city VARCHAR(100) NOT NULL,
            destination_city VARCHAR(100) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            duration_hours DOUBLE NOT NULL,
            features TEXT NOT NULL,
            departure_time VARCHAR(50) NOT NULL,
            meal_service TEXT,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # bookings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            booking_type VARCHAR(50) NOT NULL,
            package_id INT,
            hotel_id INT,
            transport_id INT,
            travel_date VARCHAR(50) NOT NULL,
            check_out_date VARCHAR(50),
            num_travelers INT DEFAULT 1,
            room_type VARCHAR(100),
            pickup_location VARCHAR(200),
            special_requests TEXT,
            subtotal_amount DECIMAL(10,2) DEFAULT 0.0,
            tax_amount DECIMAL(10,2) DEFAULT 0.0,
            discount_amount DECIMAL(10,2) DEFAULT 0.0,
            discount_code VARCHAR(50) DEFAULT '',
            total_price DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'Confirmed',
            payment_status VARCHAR(50) DEFAULT 'Paid',
            trip_status VARCHAR(50) DEFAULT 'Upcoming',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
            FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
            FOREIGN KEY (transport_id) REFERENCES transports(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # payments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            user_id INT NOT NULL,
            transaction_id VARCHAR(100) UNIQUE NOT NULL,
            payment_method VARCHAR(50) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            status VARCHAR(50) DEFAULT 'Success',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # invoices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_number VARCHAR(100) UNIQUE NOT NULL,
            booking_id INT NOT NULL,
            user_id INT NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            tax_amount DECIMAL(10,2) NOT NULL,
            discount DECIMAL(10,2) DEFAULT 0.0,
            total_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'Paid',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            notification_type VARCHAR(50) DEFAULT 'system',
            link_url VARCHAR(255) DEFAULT '',
            is_read INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # email logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS email_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            recipient_email VARCHAR(191) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            body_html TEXT NOT NULL,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # reviews table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            item_type VARCHAR(50) NOT NULL,
            item_id INT NOT NULL,
            rating INT NOT NULL,
            cleanliness_rating INT DEFAULT 5,
            service_rating INT DEFAULT 5,
            location_rating INT DEFAULT 5,
            value_rating INT DEFAULT 5,
            title VARCHAR(200) NOT NULL,
            comment TEXT NOT NULL,
            travel_type VARCHAR(50) DEFAULT 'Solo',
            verified_booking INT DEFAULT 1,
            agency_reply TEXT,
            agency_replied_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # safe column migrations for reviews
    for col, ctype in [
        ('cleanliness_rating', 'INT DEFAULT 5'),
        ('service_rating', 'INT DEFAULT 5'),
        ('location_rating', 'INT DEFAULT 5'),
        ('value_rating', 'INT DEFAULT 5'),
        ('agency_reply', 'TEXT'),
        ('agency_replied_at', 'DATETIME')
    ]:
        try:
            cursor.execute(f'ALTER TABLE reviews ADD COLUMN {col} {ctype}')
        except Exception:
            pass

    # saved items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            item_type VARCHAR(50) NOT NULL,
            item_id INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_item (user_id, item_type, item_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # custom itineraries table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS custom_itineraries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            destination VARCHAR(150) NOT NULL,
            duration_days INT DEFAULT 3,
            duration_nights INT DEFAULT 2,
            start_date VARCHAR(50) NOT NULL,
            hotel_id INT,
            transport_id INT,
            day_plan_json TEXT NOT NULL,
            total_estimated_price DECIMAL(10,2) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
            FOREIGN KEY (transport_id) REFERENCES transports(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # wallets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS wallets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNIQUE NOT NULL,
            balance DECIMAL(10,2) DEFAULT 5000.00,
            currency VARCHAR(10) DEFAULT 'INR',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # wallet transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            transaction_type VARCHAR(50) NOT NULL,
            description VARCHAR(255) NOT NULL,
            reference_id VARCHAR(100) DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # coupons table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS coupons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            discount_type VARCHAR(20) DEFAULT 'percentage',
            discount_value DECIMAL(10,2) NOT NULL,
            min_purchase DECIMAL(10,2) DEFAULT 0.00,
            max_discount DECIMAL(10,2) DEFAULT 2000.00,
            description VARCHAR(255) NOT NULL,
            is_active INT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            sender_type VARCHAR(20) NOT NULL,
            sender_id INT NOT NULL,
            recipient_id INT NOT NULL,
            message_text TEXT NOT NULL,
            is_read INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # agency payouts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agency_payouts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agency_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            commission_amount DECIMAL(10,2) NOT NULL,
            net_payout DECIMAL(10,2) NOT NULL,
            bank_account_info VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            processed_at DATETIME,
            FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ''')

    # seed data
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

    conn.commit()
    conn.close()
