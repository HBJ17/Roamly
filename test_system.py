"""Automated Comprehensive End-to-End System Test Suite for Roamly Travel Pro."""

import unittest
from datetime import datetime, timedelta
from app import app
from database.connection import get_db_connection
from database.schema import init_db
from database.seed import clear_and_reseed_all
from utils.security import hash_password, verify_password, is_rate_limited, record_failed_attempt, clear_failed_attempts
from utils.geo import get_coordinates_for_location
from utils.i18n import translate, TRANSLATIONS

class RoamlySystemTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        conn = get_db_connection()
        clear_and_reseed_all(conn)
        conn.close()

    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

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

        cursor.execute("SELECT password FROM agencies WHERE username = 'fasttrack_cabs'")
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
        self.assertIn(b'SUPERADMIN CONSOLE', resp.data)

        # Agency login (FastTrack Cabs)
        resp = self.client.post('/agency/login', data={'username': 'fasttrack_cabs', 'password': 'agency123'}, follow_redirects=True)
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'FastTrack', resp.data)

    def test_04_i18n_translations_for_11_languages(self):
        languages = ['en', 'ta', 'hi', 'te', 'ml', 'kn', 'fr', 'de', 'es', 'ja', 'ar']
        for lang in languages:
            self.assertIn(lang, TRANSLATIONS)
            t_pkg = translate('packages', lang)
            self.assertTrue(len(t_pkg) > 0)
            t_builder = translate('trip_builder', lang)
            self.assertTrue(len(t_builder) > 0)

        # test fallback
        self.assertEqual(translate('packages', 'unknown_lang'), 'Packages')

    def test_05_package_comparison_matrix(self):
        # compare for Kodaikanal
        resp = self.client.get('/compare?destination=Kodaikanal')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'Kodaikanal', resp.data)
        self.assertIn(b'Advantages / Highlights', resp.data)
        self.assertIn(b'Trade-offs', resp.data)

        # compare for Madurai
        resp = self.client.get('/compare?destination=Madurai')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'Madurai', resp.data)

    def test_06_custom_itinerary_builder(self):
        # builder for Kodaikanal
        resp = self.client.get('/itinerary/builder?destination=Kodaikanal')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'Kodaikanal', resp.data)
        self.assertIn(b'The Tamara Kodai', resp.data)
        self.assertIn(b'Mountain Chauffeur Scorpio', resp.data)

        # builder for Bangalore
        resp = self.client.get('/itinerary/builder?destination=Bangalore')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'Bangalore', resp.data)
        self.assertIn(b'The Oberoi Bengaluru', resp.data)

    def test_07_language_and_currency_switchers(self):
        # Test Tamil
        self.client.get('/set-lang/ta')
        resp = self.client.get('/packages')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('சுற்றுலா தொகுப்புகள்'.encode('utf-8'), resp.data)

        # Test Hindi
        self.client.get('/set-lang/hi')
        resp = self.client.get('/packages')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('यात्रा पैकेज'.encode('utf-8'), resp.data)

        # Test French
        self.client.get('/set-lang/fr')
        resp = self.client.get('/packages')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('Forfaits'.encode('utf-8'), resp.data)

        # Test German
        self.client.get('/set-lang/de')
        resp = self.client.get('/packages')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('Reisepakete'.encode('utf-8'), resp.data)

        # Test Spanish
        self.client.get('/set-lang/es')
        resp = self.client.get('/packages')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('Paquetes'.encode('utf-8'), resp.data)

        # Test Japanese
        self.client.get('/set-lang/ja')
        resp = self.client.get('/packages')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('パッケージ'.encode('utf-8'), resp.data)

        # Test Arabic
        self.client.get('/set-lang/ar')
        resp = self.client.get('/packages')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('الباقات'.encode('utf-8'), resp.data)

        # Test Telugu, Malayalam, Kannada
        for lang in ['te', 'ml', 'kn']:
            self.client.get(f'/set-lang/{lang}')
            resp = self.client.get('/packages')
            self.assertEqual(resp.status_code, 200)

        # Switch back to English
        self.client.get('/set-lang/en')
        resp = self.client.get('/packages')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'Packages', resp.data)

        # Currency Switcher
        self.client.get('/set-currency/USD')
        resp = self.client.get('/packages')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'$', resp.data)

    def test_08_coupon_validation_api(self):
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
