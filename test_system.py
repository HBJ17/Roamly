"""Automated End-to-End System Test Suite for Roamly Travel Pro."""

import unittest
from app import app
from database.connection import get_db_connection
from database.schema import init_db
from utils.security import hash_password, verify_password
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
        self.assertTrue(verify_password("admin123", "admin123"))

    def test_02_geo_coordinates_lookup(self):
        lat, lng, name = get_coordinates_for_location("Ooty")
        self.assertAlmostEqual(lat, 11.4102, places=3)
        self.assertAlmostEqual(lng, 76.6950, places=3)
        self.assertIn("Ooty", name)

    def test_03_i18n_translation(self):
        self.assertEqual(translate('packages', 'en'), 'Packages')
        self.assertEqual(translate('packages', 'ta'), 'சுற்றுலா தொகுப்புகள்')

    def test_04_public_routes(self):
        resp = self.client.get('/packages')
        self.assertEqual(resp.status_code, 200)
        
        resp = self.client.get('/hotels')
        self.assertEqual(resp.status_code, 200)
        
        resp = self.client.get('/transports')
        self.assertEqual(resp.status_code, 200)
        
        resp = self.client.get('/itinerary/builder')
        self.assertEqual(resp.status_code, 200)

    def test_05_coupon_validation_api(self):
        resp = self.client.post('/api/validate-coupon', json={
            'code': 'ROAMFIRST',
            'subtotal': 5000.0
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['valid'])
        self.assertEqual(data['code'], 'ROAMFIRST')
        self.assertEqual(data['discount'], 750.0) # 15% of 5000

    def test_06_currency_switch(self):
        resp = self.client.get('/set-currency/USD', follow_redirects=True)
        self.assertEqual(resp.status_code, 200)

    def test_07_database_integrity(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as cnt FROM users")
        self.assertGreaterEqual(cursor.fetchone()['cnt'], 2)
        
        cursor.execute("SELECT COUNT(*) as cnt FROM admins")
        self.assertEqual(cursor.fetchone()['cnt'], 1)
        
        cursor.execute("SELECT COUNT(*) as cnt FROM agencies")
        self.assertGreaterEqual(cursor.fetchone()['cnt'], 4)
        
        cursor.execute("SELECT COUNT(*) as cnt FROM packages")
        self.assertGreaterEqual(cursor.fetchone()['cnt'], 4)
        
        cursor.execute("SELECT COUNT(*) as cnt FROM coupons")
        self.assertGreaterEqual(cursor.fetchone()['cnt'], 4)
        
        cursor.execute("SELECT COUNT(*) as cnt FROM wallets")
        self.assertGreaterEqual(cursor.fetchone()['cnt'], 2)
        
        conn.close()

if __name__ == '__main__':
    unittest.main()
