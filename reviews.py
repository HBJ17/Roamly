from flask import Blueprint, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import login_required
from payments import create_notification

reviews_bp = Blueprint('reviews', __name__)

# reviews summary
def get_item_reviews_summary(item_type, item_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # fetch reviews
    cursor.execute('''
        SELECT r.*, u.username, u.full_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.item_type = %s AND r.item_id = %s
        ORDER BY r.created_at DESC
    ''', (item_type.lower(), item_id))
    reviews_list = cursor.fetchall()
    conn.close()

    total_count = len(reviews_list)
    if total_count == 0:
        return {
            'reviews': [],
            'total_count': 0,
            'average_rating': 5.0,
            'breakdown': {5: 0, 4: 0, 3: 0, 2: 0, 1: 0},
            'breakdown_pct': {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        }

    sum_ratings = sum(r['rating'] for r in reviews_list)
    avg_rating = round(sum_ratings / total_count, 1)

    breakdown = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r in reviews_list:
        score = int(r['rating'])
        if score in breakdown:
            breakdown[score] += 1

    breakdown_pct = {}
    for score, count in breakdown.items():
        breakdown_pct[score] = round((count / total_count) * 100)

    return {
        'reviews': reviews_list,
        'total_count': total_count,
        'average_rating': avg_rating,
        'breakdown': breakdown,
        'breakdown_pct': breakdown_pct
    }

# recalculate ratings
def update_item_rating(item_type, item_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT AVG(rating) as avg_score FROM reviews WHERE item_type = %s AND item_id = %s', (item_type.lower(), item_id))
    row = cursor.fetchone()
    if row and row['avg_score']:
        avg_score = round(float(row['avg_score']), 1)
        if item_type.lower() == 'package':
            cursor.execute('UPDATE packages SET rating = %s WHERE id = %s', (avg_score, item_id))
        elif item_type.lower() == 'hotel':
            cursor.execute('UPDATE hotels SET star_rating = %s WHERE id = %s', (avg_score, item_id))
        conn.commit()

    conn.close()

# submit review
@reviews_bp.route('/reviews/add', methods=['POST'])
@login_required
def add_review():
    user_id = session['user_id']
    item_type = request.form.get('item_type', 'package').strip().lower()
    item_id = int(request.form.get('item_id', '0'))
    rating_str = request.form.get('rating', '5').strip()
    title = request.form.get('title', '').strip()
    comment = request.form.get('comment', '').strip()
    travel_type = request.form.get('travel_type', 'Family').strip()

    try:
        rating = max(1, min(5, int(rating_str)))
    except ValueError:
        rating = 5

    if not title or not comment or item_id == 0:
        flash('Please provide both a review headline and detailed comments.', 'danger')
        return redirect(request.referrer or url_for('packages.packages'))

    # insert review
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO reviews (user_id, item_type, item_id, rating, title, comment, travel_type, verified_booking)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
    ''', (user_id, item_type, item_id, rating, title, comment, travel_type))
    conn.commit()
    conn.close()

    # update aggregate
    update_item_rating(item_type, item_id)

    # create notification
    create_notification(
        user_id=user_id,
        title="Review Published",
        message=f"Thank you for reviewing! Your feedback '{title}' is now live.",
        notification_type='review',
        link_url=request.referrer or url_for('packages.packages')
    )

    flash('Thank you! Your verified traveler review has been published.', 'success')
    return redirect(request.referrer or url_for('packages.packages'))
