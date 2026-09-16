# Roamly Travel Pro - Enterprise Travel & Tourism Web Platform

A modern, responsive Flask web application and enterprise travel portal built with **HTML5**, **Plain CSS3**, **SQLite**, and **MySQL** compatibility. Features multi-role authentication, personalized dashboards, curated South India and Tamil Nadu holiday packages, multi-category booking engines (Packages, Hotels, Transports), custom multi-day dynamic trip builders, Leaflet/OpenStreetMap interactive geolocation, Roamly digital wallet, live promo code engine, verified multi-criteria guest reviews with agency response, real-time traveler-to-agency messaging, superadmin commission management, agency bank payout settlement ledgers, live multi-currency conversion, Tamil/English language toggle, scannable QR boarding passes, and PWA offline support.

---

## Key Technologies & Architecture

- **Backend Framework**: Python 3.11+ / Flask Modular Blueprints
- **Database Engine**: Dual-Engine (SQLite `database.db` with native PyMySQL Docker support)
- **Frontend & Styling**: HTML5, Vanilla CSS3 (Luxury Travel Aesthetic, Google Fonts Outfit & Plus Jakarta Sans, print-ready stylesheets)
- **Maps & Geolocation**: Leaflet.js / OpenStreetMap with custom SVG markers
- **Security & Cryptography**: PBKDF2 / SHA-256 password hashing with fallback validation
- **Mobile & Offline**: Progressive Web App (PWA) manifest and Service Worker caching

---

## System Modules & Feature Suite

### 1. Modern Travel Aesthetic UI & Design System
- **Luxury Travel Palette**: Deep Obsidian Navy (`#0B192C`), Maritime Sapphire (`#1E3E62`), and Sunset Terracotta (`#E85D04`).
- **Travel UI Tokens & Micro-Animations**: Boarding-pass cards, transit timeline waypoints, compass badges, luggage tags, live status indicators, smooth hover elevations, and modal dialogs.
- **Modern Typography**: Google Fonts `Outfit` (headings) and `Plus Jakarta Sans` (body).

### 2. Custom Multi-Day Dynamic Trip Planner (`/itinerary/builder`)
- **Step-by-Step Customization**: Select destination, dates, duration (2 to 5 days), lodging category, transport transit, and morning/afternoon/evening sightseeing excursions.
- **Live Composite Cost Calculation**: Real-time composite price breakdown (transports + nightly stays + excursion fees + taxes).
- **Interactive Trip Schedule**: Day-by-day visual timeline and instant saving to traveler account.

### 3. Interactive Geolocation Maps
- Embedded Leaflet/OpenStreetMap interactive maps on package detail, hotel detail, and trip builder pages.
- Precise GPS destination coordinates for Ooty, Kodaikanal, Yercaud, Madurai, Chennai, Thanjavur, Rameswaram, Kanyakumari, Mahabalipuram, and Coimbatore.

### 4. Digital Wallet & Multi-Gateway Checkout (`/wallet`, `/checkout`)
- **Roamly Traveler Wallet**: View balance, instant fund top-up, zero-click checkout, and automatic transaction ledger.
- **Multi-Gateway Payment Options**: Roamly Wallet, Credit/Debit Card (Stripe integration ready), UPI QR Scan (Razorpay integration ready), and Net Banking.
- **Live Promo Code Engine**: Instant coupon validation (`ROAMFIRST`, `SUMMER20`, `TAMIL15`, `EXPLORE10`, `FLAT500`) with dynamic subtotal and tax recalculation.

### 5. Verified Reviews, Multi-Criteria Ratings & Agency Reply (`/reviews`)
- **Multi-Criteria Scoring**: Cleanliness, Service, Location, and Value for Money ratings (1-5 stars).
- **Verified Traveler Badges**: Reviews linked to completed customer bookings.
- **Agency Partner Response**: Travel agencies and hotel owners can publicly reply to customer reviews.

### 6. Traveler-to-Agency Direct Messaging (`/messages`)
- In-app live chat thread between travelers and assigned partner agencies for trip coordination, pickup time updates, and concierge support.

### 7. Superadmin Commission & Agency Payout Ledger (`/admin/commissions`, `/agency/payouts`)
- **Commission Management**: Configurable platform commission rate (10% default platform fee).
- **Financial Reconciliation**: Gross volume tracking, net agency pool calculation, and payout request approval/rejection workflows.
- **Agency Payout Requests**: Partner withdrawal requests with bank account and IFSC details.

### 8. Promotional Coupons Management (`/admin/coupons`)
- Admin CRUD interface for creating, activating, deactivating, and deleting discount promo codes.

### 9. Multi-Currency Converter & Language Toggle
- **Live Currency Selector**: Instant conversion between INR (₹), USD ($), EUR (€), GBP (£), and AED with real-time exchange rates.
- **Bilingual Localization**: English and Tamil (தமிழ்) toggle for navigation, buttons, and status labels.

### 10. Scannable QR Boarding Passes & Offline PWA
- **Encrypted SVG QR Passes**: High-resolution scannable QR codes rendered on booking vouchers (`/bookings/summary/<id>`) for hotel desk check-in and driver boarding.
- **Progressive Web App**: `manifest.json` and `sw.js` service worker for offline ticket viewing.

---

## Default Access Credentials

| Role | Portal URL | Username | Password | Notes |
|---|---|---|---|---|
| **Super Admin** | `/admin/login` | `admin` | `admin123` | Master control & financial analytics |
| **Cab Service Agency** | `/agency/login` | `nilgiri_cabs` | `agency123` | Nilgiri Express Cabs & Fleet |
| **Hotel Owner Agency** | `/agency/login` | `heritage_hotels` | `agency123` | Tamil Heritage Resorts & Palaces |
| **Travel Brand Agency** | `/agency/login` | `tamil_tours` | `agency123` | Tamil Nadu Grand Holiday Travels |
| **Tour Operator Agency** | `/agency/login` | `southern_transit` | `agency123` | Southern State Volvo Transits |
| **Customer User** | `/login` or `/signup` | `traveler` | `user123` | Pre-seeded traveler profile (Ramesh Kumar) |

---

## External API Keys Configuration Guide (`config.py`)

To connect external live APIs, define the following environment variables or update `config.py`:

```bash
# Payment Gateways
STRIPE_PUBLIC_KEY="pk_live_your_stripe_public_key"
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
RAZORPAY_KEY_ID="rzp_live_your_razorpay_key_id"
RAZORPAY_KEY_SECRET="rzp_live_your_razorpay_key_secret"

# Transactional Emails (SendGrid / SMTP)
MAIL_SERVER="smtp.sendgrid.net"
MAIL_PORT="587"
MAIL_USERNAME="apikey"
MAIL_PASSWORD="SG.your_sendgrid_api_key"
MAIL_DEFAULT_SENDER="bookings@yourdomain.com"

# Communications (Twilio WhatsApp / SMS)
TWILIO_ACCOUNT_SID="AC_your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_token"
TWILIO_WHATSAPP_NUMBER="+14155238886"

# Maps & Geolocation (Google Maps / Mapbox)
GOOGLE_MAPS_API_KEY="AIzaSyYourGoogleMapsApiKey"
MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoieW91ciIsImEiOiJ5b3VyX3Rva2VuIn0"
```

---

## Running the Application

### 1. Local Python Setup (Zero-Prerequisites)
```bash
# 1. Install dependencies
pip install flask pymysql werkzeug

# 2. Run test suite
python test_system.py

# 3. Start development server
python app.py
```
Access in browser:
- Traveler Portal: [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
- Trip Builder: [http://127.0.0.1:5000/itinerary/builder](http://127.0.0.1:5000/itinerary/builder)
- Admin Console: [http://127.0.0.1:5000/admin/login](http://127.0.0.1:5000/admin/login)
- Partner Agency Portal: [http://127.0.0.1:5000/agency/login](http://127.0.0.1:5000/agency/login)

### 2. Containerized Deployment (Docker Compose)
```bash
docker-compose up --build
```
