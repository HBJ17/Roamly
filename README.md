# Roamly - Flask Travel & Destination Web Application

A clean, responsive Flask web application built with HTML5, CSS3, and SQLite. Features user authentication, personalized dashboard, destination package exploration, multi-category booking engine (Packages, Hotels, Transports), printable booking voucher receipts, booking lifecycle management (modify dates/passengers & cancellation), superadmin analytics & response dashboard, travel agency credential provisioning, and dedicated partner agency inventory & dynamic pricing portals. Includes curated Tamil Nadu destinations (Ooty, Kodaikanal, Yercaud, Madurai, Chennai, Thanjavur, Rameswaram, Kanyakumari, Mahabalipuram).

---

## Technologies Used

- **Backend Framework**: Python Flask
- **Database**: SQLite (`database.db`)
- **Frontend**: HTML5 & Plain Vanilla CSS (Responsive & Print-ready)
- **Architecture**: Modular Flask Blueprints (`auth`, `dashboard`, `packages`, `hotels`, `transports`, `bookings`, `admin`, `agency`)

---

## Key Features by Module

### Module 1: Authentication
1. **Sign Up**: Create account with Username, Email, and Password.
2. **Login**: Authenticate using registered Username and Password.
3. **Logout**: Session termination and redirect to login page.
4. **Flash Feedback**: Flash alerts for actions, errors, and session status.

### Module 2: User Dashboard
1. **Overview Dashboard**: Overview cards displaying total user bookings, preferred travel mode, budget tier, and quick navigation.
2. **Profile Management**: View and edit user details (Full Name, Phone, Email, Residential Address, Bio).
3. **Travel Preferences**: Save customized preferences (Transport Mode: Train/Flight/Bus/Cab, Dietary: Veg/Non-Veg/Vegan, Budget Tier: Budget/Moderate/Luxury, Destination Types: Hill Station/Heritage/Coastal/Pilgrimage).
4. **Booking Management**: Comprehensive table of active and past bookings across packages, stays, and transit with quick links to vouchers, modification, and cancellation.

### Module 3: Destinations & Packages
1. **Search & Multi-Criteria Filtering**: Search by place name or keyword (e.g., Ooty, Kodaikanal, Tanjore, temple), filter by category, price range (Min/Max ₹), and sort by rating, price, or duration.
2. **Featured Tamil Nadu Packages**: Curated packages covering top destinations (Ooty, Kodaikanal, Yercaud, Madurai, Chennai, Tanjore, Rameswaram/Kanyakumari, Mahabalipuram/Pondicherry).
3. **Detailed Package View**: Comprehensive package view displaying destination info, itinerary highlights, included amenities, rating, price per person, and interactive cost calculation booking form.
4. **Side-by-Side Package Comparison**: Add up to 3 packages to session comparison list and compare specifications in a structured matrix table.

### Module 4: Multi-Category Booking System & Enterprise Portals

#### 1. Multi-Category Booking System
- **Hotel & Resort Booking**: Explore curated Tamil Nadu hotels (Ooty, Kodai, Madurai, Thanjavur, Rameswaram, Mahabalipuram). Select check-in & check-out dates, room tiers (Deluxe, Suite, Villa), guest count, and view calculated night counts and total cost.
- **Transport & Cab Booking**: Book private AC sedan/SUV cabs, luxury multi-axle Volvo sleeper coaches, UNESCO Nilgiri toy train passes, and express air shuttles. Select travel dates, passenger counts, exact pickup address, and drop address.
- **Package Booking**: Instant package booking with custom travel dates, traveler counts, and special itinerary requests.
- **Official Booking Summary Voucher**: Printable invoice receipt (`/bookings/summary/<id>`) displaying unique booking reference (e.g. `#ROAM-PKG-0001`, `#ROAM-HTL-0002`, `#ROAM-TRN-0003`), traveler details, schedule dates, service specifications, itemized pricing, provider info, and `@media print` styling for saving clean PDF vouchers.
- **Booking Lifecycle Management (Modify & Cancel)**:
  - **Modify Booking** (`/bookings/modify/<id>`): Update travel dates, check-in/out schedules, passenger/guest counts, room categories, pickup/drop locations, and special requests with automatic total price recalculation.
  - **Cancel Booking** (`/bookings/cancel/<id>`): Cancel reservation with confirmation guards and status tracking.

#### 2. Main Admin Portal & Live Analytics (`/admin/login`)
- **Superadmin Authentication**: Dedicated administrator console protected by `@admin_required`.
- **Platform Analytics & Business Response Dashboard**:
  - Gross Platform Revenue (₹) and Total Bookings metrics.
  - Active Users, Registered Agencies, and Inventory catalog counters.
  - Category Revenue & Volume Split (Packages vs Hotels vs Transports) with progress charts.
  - Booking Status Fulfillment metrics (Confirmed, Modified, Cancelled).
  - Top Performing Destinations Leaderboard ordered by revenue and booking volume.
  - Real-time recent transaction activity stream.
- **Agency Credential Provisioning & Management**:
  - Create and register login credentials for new travel agencies (Travel Brands, Hotel Owners, Cab Services, Tour Operators).
  - Search, filter by agency type, toggle status (`Active` / `Inactive`), or delete partner entities.
- **Platform Bookings Audit Log** (`/admin/bookings`): Master transaction ledger with category and status filters.

#### 3. Travel Agency Partner Portal (`/agency/login`)
- **Partner Authentication**: Dedicated login for travel brands, cab fleet operators, hotel owners, and tour operators.
- **Agency Dashboard**: Track agency-specific listings, customer orders, and earned revenue (₹).
- **Inventory & Dynamic Pricing Management**:
  - **Add Package / Plan**: Publish new tour itineraries, set descriptions, highlights, amenities, duration, and pricing.
  - **Edit & Price Adjustment**: Adjust package pricing and update itinerary offerings.
  - **Delete Package**: Remove outdated packages from the catalog.
  - **Hotel & Fleet Management**: Add and remove hotel properties and transport routes under the agency banner.

---

## Default Access Credentials

| Role | Portal URL | Username | Password | Notes |
|---|---|---|---|---|
| **Super Admin** | `/admin/login` | `admin` | `admin123` | Master control & analytics |
| **Cab Service Agency** | `/agency/login` | `nilgiri_cabs` | `agency123` | Nilgiri Express Cabs & Fleet |
| **Hotel Owner Agency** | `/agency/login` | `heritage_hotels` | `agency123` | Tamil Heritage Resorts & Palaces |
| **Travel Brand Agency** | `/agency/login` | `tamil_tours` | `agency123` | Tamil Nadu Grand Holiday Travels |
| **Tour Operator Agency** | `/agency/login` | `southern_transit` | `agency123` | Southern State Volvo Transits |
| **Customer User** | `/login` or `/signup` | User Created | User Created | Standard traveler account |

---

## Project Directory Layout

```
Roamly/
├── app.py                      # Main Flask application & blueprint registrations
├── auth.py                     # User authentication routes (Login, Signup, Logout)
├── dashboard.py                # User dashboard & preferences management
├── packages.py                 # Package exploration, filters, and comparison
├── hotels.py                   # Hotel listings and property detail view
├── transports.py               # Transport & Cab listings and route detail view
├── bookings.py                 # Multi-service booking engine, summary vouchers, modify/cancel
├── admin.py                    # Superadmin auth, analytics, agency provisioning & audit
├── agency.py                   # Travel agency auth, inventory management & dynamic pricing
├── database/
│   ├── connection.py           # SQLite connection helper
│   ├── schema.py               # Database initialization & table migration checks
│   └── seed.py                 # Seed data for packages, hotels, transports, admins & agencies
├── database.db                 # Auto-generated SQLite database
├── static/
│   └── css/
│       └── style.css           # Styling, responsive layout, dashboards, and print stylesheet
├── templates/
│   ├── base.html               # Global base layout header, navigation & footer
│   ├── login.html              # Customer login template
│   ├── signup.html             # Customer signup template
│   ├── dashboard.html          # Customer dashboard & booking management
│   ├── packages.html           # Package exploration & filtering
│   ├── package_detail.html     # Detailed package view & booking form
│   ├── compare.html            # Side-by-side package comparison matrix
│   ├── hotels.html             # Hotel listings & city filtering
│   ├── hotel_detail.html       # Hotel property view with check-in/out date calculations
│   ├── transports.html         # Transport & cab listings
│   ├── transport_detail.html   # Transport route view & booking form
│   ├── booking_summary.html    # Official booking confirmation voucher & tax invoice
│   ├── booking_modify.html     # Booking modification form (Dates, Guests, Requests)
│   ├── admin/
│   │   ├── login.html          # Admin portal login template
│   │   ├── dashboard.html      # Analytics & live platform response metrics
│   │   ├── agencies.html       # Agency credential provisioning & management
│   │   └── bookings.html       # Platform master transaction ledger
│   └── agency/
│       ├── login.html          # Agency partner login template
│       ├── dashboard.html      # Agency partner overview & earnings
│       ├── packages.html       # Agency package inventory list
│       └── package_form.html   # Add/Edit package & price adjustment form
└── utils/
    └── decorators.py           # Authentication guards (login_required, admin_required, agency_required)
```

---

## How to Run the Project

1. **Install Prerequisites**:
   ```bash
   pip install flask
   ```

2. **Run the Flask App**:
   ```bash
   python app.py
   ```

3. **Access in Browser**:
   - Customer Portal: [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
   - Admin Analytics Console: [http://127.0.0.1:5000/admin/login](http://127.0.0.1:5000/admin/login)
   - Travel Agency Portal: [http://127.0.0.1:5000/agency/login](http://127.0.0.1:5000/agency/login)

---

## Database Schema

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INTEGER PRIMARY KEY,
    preferred_travel_mode TEXT DEFAULT 'Train',
    dietary_preference TEXT DEFAULT 'Vegetarian',
    budget_range TEXT DEFAULT 'Moderate',
    preferred_categories TEXT DEFAULT 'Hill Station',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT DEFAULT 'Super Administrator',
    role TEXT DEFAULT 'superadmin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Agencies Table
CREATE TABLE IF NOT EXISTS agencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    agency_type TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Hotels Table
CREATE TABLE IF NOT EXISTS hotels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agency_id INTEGER,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    star_rating REAL DEFAULT 4.0,
    price_per_night REAL NOT NULL,
    room_types TEXT NOT NULL,
    amenities TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
);

-- 6. Transports Table
CREATE TABLE IF NOT EXISTS transports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agency_id INTEGER,
    title TEXT NOT NULL,
    transport_type TEXT NOT NULL,
    source_city TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    price REAL NOT NULL,
    duration_hours REAL NOT NULL,
    features TEXT NOT NULL,
    departure_time TEXT DEFAULT '06:00 AM',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
);

-- 7. Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    duration_days INTEGER NOT NULL,
    duration_nights INTEGER NOT NULL,
    description TEXT NOT NULL,
    highlights TEXT NOT NULL,
    included_amenities TEXT NOT NULL,
    rating REAL DEFAULT 4.5,
    image_url TEXT,
    agency_id INTEGER,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
);

-- 8. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_id INTEGER,
    hotel_id INTEGER,
    transport_id INTEGER,
    booking_type TEXT DEFAULT 'Package',
    travel_date TEXT NOT NULL,
    check_out_date TEXT DEFAULT '',
    num_travelers INTEGER NOT NULL DEFAULT 1,
    room_type TEXT DEFAULT '',
    pickup_location TEXT DEFAULT '',
    drop_location TEXT DEFAULT '',
    special_requests TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    passengers_names TEXT DEFAULT '',
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
    FOREIGN KEY (transport_id) REFERENCES transports(id) ON DELETE SET NULL
);
```
