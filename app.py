from flask import Flask, session, url_for
from database.schema import init_db
from auth import auth_bp
from dashboard import dashboard_bp
from packages import packages_bp

app = Flask(__name__)
app.secret_key = 'super_secret_key_for_session'

# Initialize Database
init_db()

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(packages_bp)

# Build error handler for legacy endpoint names in templates
def url_build_error_handler(error, endpoint, values):
    for ep in app.view_functions:
        if ep.endswith('.' + endpoint):
            return url_for(ep, **values)
    raise error

app.url_build_error_handlers.append(url_build_error_handler)

# Context Processor to share compare package count across templates
@app.context_processor
def inject_compare_count():
    compare_list = session.get('compare_packages', [])
    return dict(compare_count=len(compare_list))

if __name__ == '__main__':
    app.run(debug=True)
