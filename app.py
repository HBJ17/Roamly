import os
from flask import Flask, session, url_for
from database.schema import init_db
from auth import auth_bp
from dashboard import dashboard_bp
from packages import packages_bp
from hotels import hotels_bp
from transports import transports_bp
from bookings import bookings_bp
from admin import admin_bp
from agency import agency_bp
from payments import payments_bp
from reviews import reviews_bp
from itinerary import itinerary_bp
from messages import messages_bp
from coupons import coupons_bp
from database.connection import get_db_connection

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'super_secret_key_for_session')

# register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(packages_bp)
app.register_blueprint(hotels_bp)
app.register_blueprint(transports_bp)
app.register_blueprint(bookings_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(agency_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(reviews_bp)
app.register_blueprint(itinerary_bp)
app.register_blueprint(messages_bp)
app.register_blueprint(coupons_bp)

# legacy route handler
def url_build_error_handler(error, endpoint, values):
    for ep in app.view_functions:
        if ep.endswith('.' + endpoint):
            return url_for(ep, **values)
    raise error

app.url_build_error_handlers.append(url_build_error_handler)

# custom template filters
@app.template_filter('format_date')
def format_date_filter(val):
    if not val:
        return ''
    if hasattr(val, 'strftime'):
        return val.strftime('%Y-%m-%d')
    return str(val)[:10]

@app.template_filter('format_datetime')
def format_datetime_filter(val):
    if not val:
        return ''
    if hasattr(val, 'strftime'):
        return val.strftime('%Y-%m-%d %H:%M:%S')
    return str(val)

# global template context
@app.context_processor
def inject_global_data():
    compare_list = session.get('compare_packages', [])
    unread_notifs = 0
    saved_count = 0
    
    user_id = session.get('user_id')
    if user_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = %s AND is_read = 0', (user_id,))
            unread_notifs = cursor.fetchone()['cnt']
            
            cursor.execute('SELECT COUNT(*) as cnt FROM saved_items WHERE user_id = %s', (user_id,))
            saved_count = cursor.fetchone()['cnt']
            conn.close()
        except Exception:
            pass

    return dict(
        compare_count=len(compare_list),
        unread_notifications_count=unread_notifs,
        saved_count=saved_count,
        is_admin=bool(session.get('admin_id')),
        is_agency=bool(session.get('agency_id')),
        admin_username=session.get('admin_username'),
        agency_name=session.get('agency_name'),
        agency_type=session.get('agency_type')
    )

# initialize app schema
try:
    init_db()
except Exception as e:
    print(f"Database init notice: {e}")

# run server
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
