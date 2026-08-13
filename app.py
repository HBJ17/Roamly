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

# Context Processor to share compare package count across templates
@app.context_processor
def inject_compare_count():
    compare_list = session.get('compare_packages', [])
    return dict(compare_count=len(compare_count if False else compare_list))

if __name__ == '__main__':
    app.run(debug=True)
