# Roamly - Flask Travel & Destination Web Application

A clean, responsive Flask web application built with HTML5, CSS3, and SQLite. Features complete user authentication, user dashboard (profile management, travel preferences, booking history), and destination package exploration (search, multi-criteria filtering, detail view, side-by-side comparison, and direct booking). Includes curated Tamil Nadu holiday destinations (Ooty, Kodaikanal, Yercaud, Madurai, Chennai, Tanjore, Rameswaram, Kanyakumari, Mahabalipuram).

## Technologies Used

- **Backend Framework**: Python Flask
- **Database**: SQLite (`database.db`)
- **Frontend**: HTML5 & Plain Vanilla CSS

## Key Features

### Module 1: Authentication
1. **Sign Up**: Create account with Username, Email, and Password.
2. **Login**: Authenticate using registered Username and Password.
3. **Logout**: Session termination and redirect to login page.
4. **Flash Feedback**: Flash alerts for actions, errors, and session status.

### Module 2: User Dashboard
1. **Overview Dashboard**: Overview cards displaying total user bookings, preferred travel mode, budget tier, and quick navigation.
2. **Profile Management**: View and edit user details (Full Name, Phone, Email, Residential Address, Bio).
3. **Travel Preferences**: Save customized preferences (Transport Mode: Train/Flight/Bus/Cab, Dietary: Veg/Non-Veg/Vegan, Budget Tier: Budget/Moderate/Luxury, Destination Types: Hill Station/Heritage/Coastal/Pilgrimage).
4. **Booking History**: Table of active and past trip bookings with package details, travel dates, passenger counts, total price in INR (₹), status (Confirmed/Cancelled), and cancellation options.

### Module 3: Destinations & Packages
1. **Search & Multi-Criteria Filtering**: Search by place name or keyword (e.g., Ooty, Kodaikanal, Tanjore, temple), filter by category, price range (Min/Max ₹), and sort by rating, price, or duration.
2. **Featured Tamil Nadu Packages**: Curated packages covering top destinations (Ooty, Kodaikanal, Yercaud, Madurai, Chennai, Tanjore, Rameswaram/Kanyakumari, Mahabalipuram/Pondicherry).
3. **Detailed Package View**: Comprehensive package view displaying destination info, itinerary highlights, included amenities, rating, price per person, and interactive cost calculation booking form.
4. **Side-by-Side Package Comparison**: Add up to 3 packages to session comparison list and compare specifications (Price, Duration, Rating, Highlights, Amenities) in a structured matrix table.

## Project Directory Layout

```
Roamly/
├── app.py              # Main Flask application, routes, and SQLite DB setup
├── database.db         # SQLite database (auto-initialized with seed data)
├── .gitignore          # Git ignore rules
├── README.md           # Project documentation
├── static/
│   └── css/
│       └── style.css   # Main CSS stylesheet
└── templates/
    ├── base.html       # Base layout header navigation & footer
    ├── login.html      # Login page template
    ├── signup.html     # Sign Up page template
    ├── dashboard.html  # User dashboard template (Overview, Profile, Preferences, Bookings)
    ├── packages.html   # Package listing page (Search, Filters, Compare toggle)
    ├── package_detail.html # Detailed package view & booking form
    └── compare.html    # Side-by-side package comparison matrix
```

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
   Open browser at [http://127.0.0.1:5000/](http://127.0.0.1:5000/)

## Database Schema

The SQLite database (`database.db`) initializes four tables on startup:

```sql
-- Users Table
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

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INTEGER PRIMARY KEY,
    preferred_travel_mode TEXT DEFAULT 'Train',
    dietary_preference TEXT DEFAULT 'Vegetarian',
    budget_range TEXT DEFAULT 'Moderate',
    preferred_categories TEXT DEFAULT 'Hill Station',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Packages Table
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
    image_url TEXT
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    travel_date TEXT NOT NULL,
    num_travelers INTEGER NOT NULL DEFAULT 1,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);
```

