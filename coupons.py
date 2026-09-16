from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from database.connection import get_db_connection
from utils.decorators import admin_required

coupons_bp = Blueprint('coupons', __name__, url_prefix='/admin/coupons')

# list coupons
@coupons_bp.route('')
@admin_required
def list_coupons():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM coupons ORDER BY created_at DESC')
    coupons = cursor.fetchall()
    conn.close()

    return render_template('admin/coupons.html', coupons=coupons)

# create coupon
@coupons_bp.route('/create', methods=['POST'])
@admin_required
def create_coupon():
    code = request.form.get('code', '').strip().upper()
    discount_type = request.form.get('discount_type', 'percentage')
    discount_value = float(request.form.get('discount_value', 10.0))
    min_purchase = float(request.form.get('min_purchase', 0.0))
    max_discount = float(request.form.get('max_discount', 2000.0))
    description = request.form.get('description', '').strip()

    if not code or not description:
        flash('Coupon code and description are required.', 'danger')
        return redirect(url_for('coupons.list_coupons'))

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, description, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, 1)
        ''', (code, discount_type, discount_value, min_purchase, max_discount, description))
        conn.commit()
        flash(f"Coupon '{code}' created successfully!", 'success')
    except Exception as e:
        flash(f"Error creating coupon: {e}", 'danger')
    finally:
        conn.close()

    return redirect(url_for('coupons.list_coupons'))

# toggle status
@coupons_bp.route('/toggle/<int:coupon_id>', methods=['POST'])
@admin_required
def toggle_coupon(coupon_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE coupons SET is_active = (1 - is_active) WHERE id = %s', (coupon_id,))
    conn.commit()
    conn.close()
    flash('Coupon active status updated.', 'info')
    return redirect(url_for('coupons.list_coupons'))

# delete coupon
@coupons_bp.route('/delete/<int:coupon_id>', methods=['POST'])
@admin_required
def delete_coupon(coupon_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM coupons WHERE id = %s', (coupon_id,))
    conn.commit()
    conn.close()
    flash('Coupon deleted from database.', 'warning')
    return redirect(url_for('coupons.list_coupons'))
