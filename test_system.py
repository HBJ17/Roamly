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

    def test_09_strict_itinerary_destination_scoping(self):
        # When Bangalore is chosen, only Bangalore hotels and Bangalore vehicles must be present
        resp = self.client.get('/itinerary/builder?destination=Bangalore')
        self.assertEqual(resp.status_code, 200)
        html = resp.data.decode('utf-8')
        
        # Bangalore stays and vehicles must be present
        self.assertIn('The Oberoi Bengaluru', html)
        self.assertIn('Bengaluru Toyota Camry', html)
        self.assertIn('Bengaluru ZoomWheels Thar', html)

        # Madurai, Kodai, Chennai vehicles/hotels must NOT be present in options
        self.assertNotIn('Madurai Swift Dzire', html)
        self.assertNotIn('Heritage Madurai Palace', html)
        self.assertNotIn('Kodai Mountain Chauffeur', html)
        self.assertNotIn('The Tamara Kodai', html)
        self.assertNotIn('Chennai Honda City', html)
        self.assertNotIn('The Leela Palace Seaside', html)

        # When Kodaikanal is chosen, only Kodaikanal stays and vehicles must appear
        resp_kodai = self.client.get('/itinerary/builder?destination=Kodaikanal')
        self.assertEqual(resp_kodai.status_code, 200)
        html_kodai = resp_kodai.data.decode('utf-8')
        self.assertIn('The Tamara Kodai', html_kodai)
        self.assertIn('Kodai Mountain Chauffeur', html_kodai)
        self.assertNotIn('The Oberoi Bengaluru', html_kodai)
        self.assertNotIn('Bengaluru Toyota Camry', html_kodai)

    def test_10_standalone_transports_modes(self):
        # 1. Local Cabs mode
        resp_cabs = self.client.get('/transports?mode=cabs&city=Bangalore')
        self.assertEqual(resp_cabs.status_code, 200)
        html_cabs = resp_cabs.data.decode('utf-8')
        self.assertIn('Bengaluru Toyota Camry', html_cabs)
        self.assertNotIn('Zingbus Multi-Axle Volvo', html_cabs)

        # 2. Intercity Transit mode (RedBus / MMT style)
        resp_intercity = self.client.get('/transports?mode=intercity&type=Bus')
        self.assertEqual(resp_intercity.status_code, 200)
        html_intercity = resp_intercity.data.decode('utf-8')
        self.assertIn('Zingbus Multi-Axle Volvo', html_intercity)
        self.assertIn('IntrCity SmartBus', html_intercity)

        # 3. Intercity Trains
        resp_train = self.client.get('/transports?mode=intercity&type=Train')
        self.assertEqual(resp_train.status_code, 200)
        html_train = resp_train.data.decode('utf-8')
        self.assertIn('Vande Bharat Superfast Express', html_train)

    def test_11_standalone_hotels_airbnb_filters(self):
        # City filter
        resp_blr = self.client.get('/hotels?city=Bangalore')
        self.assertEqual(resp_blr.status_code, 200)
        html_blr = resp_blr.data.decode('utf-8')
        self.assertIn('The Oberoi Bengaluru', html_blr)
        self.assertNotIn('Heritage Madurai Palace', html_blr)

        # Pet Friendly filter
        resp_pets = self.client.get('/hotels?city=Bangalore&pet_friendly=1')
        self.assertEqual(resp_pets.status_code, 200)
        html_pets = resp_pets.data.decode('utf-8')
        self.assertIn('ITC Windsor', html_pets)

    def test_12_location_specific_agency_logins(self):
        agency_users = [
            'bangalore_stays',
            'bangalore_cabs',
            'chennai_hotels',
            'chennai_cabs',
            'kodai_resorts',
            'kodai_cabs',
            'madurai_stays',
            'madurai_cabs',
            'thanjavur_stays',
            'thanjavur_cabs',
            'kanyakumari_stays',
            'kanyakumari_cabs',
            'redbus_express',
            'rail_flight_connect'
        ]

        for u in agency_users:
            resp = self.client.post('/agency/login', data={'username': u, 'password': 'agency123'}, follow_redirects=True)
            self.assertEqual(resp.status_code, 200, f"Failed login for {u}")
            self.assertIn(b'Agency Partner', resp.data, f"Partner badge missing for {u}")
            self.assertIn(u.encode('utf-8'), resp.data, f"Username missing in dashboard for {u}")
            # log out before next
            self.client.get('/agency/logout')

if __name__ == '__main__':
    unittest.main()
