from datetime import datetime
from flask import Blueprint, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import login_required, agency_required
from payments import create_notification

reviews_bp = Blueprint('reviews', __name__)

# reviews summary with multi-criteria scores
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
            'avg_cleanliness': 5.0,
            'avg_service': 5.0,
            'avg_location': 5.0,
            'avg_value': 5.0,
            'breakdown': {5: 0, 4: 0, 3: 0, 2: 0, 1: 0},
            'breakdown_pct': {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        }

    sum_ratings = sum(r['rating'] for r in reviews_list)
    avg_rating = round(sum_ratings / total_count, 1)

    avg_cleanliness = round(sum(r.get('cleanliness_rating') or 5 for r in reviews_list) / total_count, 1)
    avg_service = round(sum(r.get('service_rating') or 5 for r in reviews_list) / total_count, 1)
    avg_location = round(sum(r.get('location_rating') or 5 for r in reviews_list) / total_count, 1)
    avg_value = round(sum(r.get('value_rating') or 5 for r in reviews_list) / total_count, 1)

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
        'avg_cleanliness': avg_cleanliness,
        'avg_service': avg_service,
        'avg_location': avg_location,
        'avg_value': avg_value,
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

# submit verified review
@reviews_bp.route('/reviews/add', methods=['POST'])
@login_required
def add_review():
    user_id = session['user_id']
    item_type = request.form.get('item_type', 'package').strip().lower()
    item_id = int(request.form.get('item_id', '0'))
    rating_str = request.form.get('rating', '5').strip()
    cleanliness = int(request.form.get('cleanliness_rating', 5))
    service = int(request.form.get('service_rating', 5))
    location = int(request.form.get('location_rating', 5))
    value = int(request.form.get('value_rating', 5))
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
        INSERT INTO reviews (user_id, item_type, item_id, rating, cleanliness_rating, service_rating, location_rating, value_rating, title, comment, travel_type, verified_booking)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
    ''', (user_id, item_type, item_id, rating, cleanliness, service, location, value, title, comment, travel_type))
    conn.commit()
    conn.close()

    # update overall score
    update_item_rating(item_type, item_id)

    # notify traveler
    create_notification(
        user_id=user_id,
        title="Review Published",
        message=f"Thank you! Your verified {rating}-star review for this {item_type} has been published.",
        notification_type='review',
        link_url=request.referrer or '/packages'
    )

    flash('Your verified traveler review has been submitted successfully!', 'success')
    return redirect(request.referrer or url_for('packages.packages'))

# agency reply to review
@reviews_bp.route('/agency/reviews/reply/<int:review_id>', methods=['POST'])
@agency_required
def agency_reply(review_id):
    reply_text = request.form.get('reply_text', '').strip()
    if not reply_text:
        flash('Reply content cannot be empty.', 'danger')
        return redirect(request.referrer or '/agency/dashboard')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE reviews 
        SET agency_reply = %s, agency_replied_at = CURRENT_TIMESTAMP
        WHERE id = %s
    ''', (reply_text, review_id))
    
    # fetch reviewer to notify
    cursor.execute('SELECT user_id, title FROM reviews WHERE id = %s', (review_id,))
    rev = cursor.fetchone()
    conn.commit()
    conn.close()

    if rev:
        create_notification(
            user_id=rev['user_id'],
            title="Agency Response to Your Review",
            message=f"The travel partner replied to your review '{rev['title']}': \"{reply_text[:60]}...\"",
            notification_type='review',
            link_url='/dashboard'
        )

    flash('Official response published to customer review.', 'success')
    return redirect(request.referrer or '/agency/dashboard')
