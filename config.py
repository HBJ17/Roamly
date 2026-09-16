import os

class Config:
    """Centralized application configuration with external API placeholders."""
    
    # Flask Core
    SECRET_KEY = os.environ.get('SECRET_KEY', 'roamly_enterprise_secret_key_2026')
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    
    # Database Settings (MySQL default with SQLite auto-fallback)
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
    MYSQL_USER = os.environ.get('MYSQL_USER', 'roamly_user')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'roamly_password')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'roamly_db')
    MYSQL_CONNECT_TIMEOUT = int(os.environ.get('MYSQL_CONNECT_TIMEOUT', 2))
    SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')
    
    # Payment Gateways (Placeholders for real keys)
    # Stripe Configuration
    STRIPE_PUBLIC_KEY = os.environ.get('STRIPE_PUBLIC_KEY', 'pk_test_sample_placeholder_stripe')
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_sample_placeholder_stripe')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_sample_placeholder')
    
    # Razorpay Configuration
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_sample_placeholder_key')
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'rzp_test_sample_placeholder_secret')
    
    # Maps & Geolocation (Placeholders for real keys)
    GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', 'AIzaSyPlaceholderGoogleMapsKey')
    MAPBOX_ACCESS_TOKEN = os.environ.get('MAPBOX_ACCESS_TOKEN', 'pk.eyJ1IjoicGxhY2Vob2xkZXIiLCJhIjoiY2x4bXBsZSJ9')
    
    # Communications & Notifications (Placeholders for real keys)
    # Email (SendGrid / SMTP)
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.sendgrid.net')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', 'apikey')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', 'SG.sample_placeholder_sendgrid_key')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'bookings@roamly.com')
    
    # SMS / WhatsApp (Twilio)
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', 'AC_sample_placeholder_twilio_sid')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', 'auth_sample_placeholder_twilio_token')
    TWILIO_WHATSAPP_NUMBER = os.environ.get('TWILIO_WHATSAPP_NUMBER', '+14155238886')
    
    # Business & Financial Rules
    DEFAULT_COMMISSION_PERCENT = float(os.environ.get('DEFAULT_COMMISSION_PERCENT', 10.0)) # 10% platform fee
    LOYALTY_POINTS_PER_100_INR = int(os.environ.get('LOYALTY_POINTS_PER_100_INR', 5))     # 5 pts per 100 INR
    LOYALTY_POINT_VALUE_INR = float(os.environ.get('LOYALTY_POINT_VALUE_INR', 1.0))       # 1 pt = 1 INR
    
    # Currencies & Conversion Rates (Base: INR)
    SUPPORTED_CURRENCIES = {
        'INR': {'symbol': '₹', 'rate': 1.0, 'name': 'Indian Rupee'},
        'USD': {'symbol': '$', 'rate': 0.012, 'name': 'US Dollar'},
        'EUR': {'symbol': '€', 'rate': 0.011, 'name': 'Euro'},
        'GBP': {'symbol': '£', 'rate': 0.0094, 'name': 'British Pound'},
        'AED': {'symbol': 'AED ', 'rate': 0.044, 'name': 'UAE Dirham'}
    }
    
    # Localization Languages
    SUPPORTED_LANGUAGES = {
        'en': 'English',
        'ta': 'தமிழ் (Tamil)'
    }
