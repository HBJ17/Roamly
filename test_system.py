"""Automated Comprehensive End-to-End System Test Suite for Roamly Travel Pro."""

import unittest
from datetime import datetime, timedelta
from app import app
from database.connection import get_db_connection
from database.schema import init_db
from utils.security import hash_password, verify_password, is_rate_limited, record_failed_attempt, clear_failed_attempts
from utils.geo import get_coordinates_for_location
from utils.i18n import translate

class RoamlySystemTestSuite(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SECRET_KEY'] = 'test_secret_key'
        self.client = self.app.test_client()
        init_db()

    def test_01_security_hashing(self):
        pwd = "testPassword123"
        hashed = hash_password(pwd)
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("wrongPassword", hashed))

    def test_02_database_passwords_are_hashed(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT password FROM admins WHERE username = 'admin'")
        admin_pwd = cursor.fetchone()['password']
        self.assertTrue(admin_pwd.startswith(('pbkdf2:', 'scrypt:', 'argon2:')))
        self.assertTrue(verify_password('admin123', admin_pwd))

        cursor.execute("SELECT password FROM users WHERE username = 'traveler'")
        user_pwd = cursor.fetchone()['password']
        self.assertTrue(user_pwd.startswith(('pbkdf2:', 'scrypt:', 'argon2:')))
        self.assertTrue(verify_password('user123', user_pwd))

        cursor.execute("SELECT password FROM agencies WHERE username = 'makemytrip'")
        agency_pwd = cursor.fetchone()['password']
        self.assertTrue(agency_pwd.startswith(('pbkdf2:', 'scrypt:', 'argon2:')))
        self.assertTrue(verify_password('agency123', agency_pwd))

        conn.close()

    def test_03_login_all_roles(self):
        # Traveler login
        resp = self.client.post('/login', data={'username': 'traveler', 'password': 'user123'}, follow_redirects=True)
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'Explorer Desk', resp.data)

        # Admin login
        resp = self.client.post('/admin/login', data={'username': 'admin', 'password': 'admin123'}, follow_redirects=True)
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'ROAMLY ADMIN', resp.data)

        # Agency login
        resp = self.client.post('/agency/login', data={'username': 'makemytrip', 'password': 'agency123'}, follow_redirects=True)
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'PARTNER DESK', resp.data)

    def test_04_idor_invoice_and_confirmation_protection(self):
        # Unauthenticated access to invoice should redirect to login
        resp = self.client.get('/invoice/1', follow_redirects=False)
        self.assertEqual(resp.status_code, 302)
        self.assertIn('/login', resp.headers['Location'])

        # Unauthenticated access to email confirmation should redirect to login
        resp = self.client.get('/email-confirmation/1', follow_redirects=False)
        self.assertEqual(resp.status_code, 302)
        self.assertIn('/login', resp.headers['Location'])

    def test_05_cancellation_and_wallet_refund(self):
        with self.client.session_transaction() as sess:
            sess['user_id'] = 1
            sess['username'] = 'traveler'

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Ensure user 1 wallet exists
        cursor.execute("SELECT balance FROM wallets WHERE user_id = 1")
        w = cursor.fetchone()
        initial_balance = float(w['balance']) if w else 5000.0

        # Insert a confirmed test booking
        future_date = (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d')
        cursor.execute("""
            INSERT INTO bookings (user_id, booking_type, package_id, travel_date, total_price, status, payment_status, trip_status)
            VALUES (1, 'Package', 1, %s, 1500.00, 'Confirmed', 'Paid', 'Upcoming')
        """, (future_date,))
        booking_id = cursor.lastrowid
        conn.commit()
        conn.close()

        # Cancel the booking
        resp = self.client.post(f'/bookings/cancel/{booking_id}', follow_redirects=True)
        self.assertEqual(resp.status_code, 200)

        # Verify wallet was credited
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT balance FROM wallets WHERE user_id = 1")
        new_balance = float(cursor.fetchone()['balance'])
        self.assertAlmostEqual(new_balance, initial_balance + 1500.00, places=2)

        cursor.execute("SELECT status FROM bookings WHERE id = %s", (booking_id,))
        self.assertEqual(cursor.fetchone()['status'], 'Cancelled')
        conn.close()

    def test_06_agency_payout_amount_validation(self):
        with self.client.session_transaction() as sess:
            sess['agency_id'] = 1
            sess['agency_name'] = 'MakeMyTrip'
            sess['agency_type'] = 'Travel Brand'

        # Attempt to request an astronomical payout exceeding earnings
        resp = self.client.post('/agency/payouts/request', data={
            'amount': '99999999.00',
            'bank_info': 'HDFC Bank Acct #987654321, IFSC: HDFC0001234'
        }, follow_redirects=True)
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'exceeds your available withdrawable earnings', resp.data)

    def test_07_past_booking_date_validation(self):
        with self.client.session_transaction() as sess:
            sess['user_id'] = 1
            sess['username'] = 'traveler'

        past_date = (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d')
        resp = self.client.post('/book/package/1', data={
            'travel_date': past_date,
            'num_travelers': '1'
        }, follow_redirects=True)
        self.assertIn(b'Travel date cannot be in the past', resp.data)

    def test_08_early_trip_completion_validation(self):
        with self.client.session_transaction() as sess:
            sess['user_id'] = 1
            sess['username'] = 'traveler'

        conn = get_db_connection()
        cursor = conn.cursor()
        future_date = (datetime.now() + timedelta(days=20)).strftime('%Y-%m-%d')
        cursor.execute("""
            INSERT INTO bookings (user_id, booking_type, package_id, travel_date, total_price, status, payment_status, trip_status)
            VALUES (1, 'Package', 1, %s, 2000.00, 'Confirmed', 'Paid', 'Upcoming')
        """, (future_date,))
        booking_id = cursor.lastrowid
        conn.commit()
        conn.close()

        # Attempt to complete a trip scheduled 20 days in the future
        resp = self.client.post(f'/bookings/complete/{booking_id}', follow_redirects=True)
        self.assertIn(b'Cannot complete trip before your scheduled travel date', resp.data)

    def test_09_rate_limiting_helper(self):
        test_key = "test_user_rate_limit"
        clear_failed_attempts(test_key)

        for _ in range(4):
            record_failed_attempt(test_key)
            limited, _ = is_rate_limited(test_key, max_attempts=5, window_seconds=60)
            self.assertFalse(limited)

        record_failed_attempt(test_key)
        limited, remaining = is_rate_limited(test_key, max_attempts=5, window_seconds=60)
        self.assertTrue(limited)
        self.assertGreater(remaining, 0)

        clear_failed_attempts(test_key)
        limited, _ = is_rate_limited(test_key, max_attempts=5, window_seconds=60)
        self.assertFalse(limited)

    def test_10_role_based_navbars(self):
        # 1. Admin Navbar
        with self.client.session_transaction() as sess:
            sess['admin_id'] = 1
            sess['admin_username'] = 'admin'
        resp = self.client.get('/admin/dashboard')
        self.assertIn(b'ROAMLY ADMIN', resp.data)
        self.assertIn(b'Audit Trail', resp.data)

        # 2. Agency Navbar
        with self.client.session_transaction() as sess:
            sess.clear()
            sess['agency_id'] = 1
            sess['agency_name'] = 'MakeMyTrip'
            sess['agency_type'] = 'Travel Brand'
        resp = self.client.get('/agency/dashboard')
        self.assertIn(b'PARTNER DESK', resp.data)
        self.assertIn(b'Packages Catalog', resp.data)

        # 3. Traveler Navbar
        with self.client.session_transaction() as sess:
            sess.clear()
            sess['user_id'] = 1
            sess['username'] = 'traveler'
        resp = self.client.get('/packages')
        self.assertIn(b'Explorer Desk', resp.data)
        self.assertIn(b'Wishlist', resp.data)

    def test_11_coupon_validation_api(self):
        resp = self.client.post('/api/validate-coupon', json={
            'code': 'ROAMFIRST',
            'subtotal': 5000.0
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['valid'])
        self.assertEqual(data['code'], 'ROAMFIRST')
        self.assertEqual(data['discount'], 750.0)

if __name__ == '__main__':
    unittest.main()
