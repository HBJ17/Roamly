# Roamly - Minimal Flask Dashboard Web Application

A minimal, clean Flask web application built with HTML, simple CSS, and SQLite. Features user signup, login, and an empty dashboard accessible after logging in.

## Technologies Used

- **Backend Framework**: Python Flask
- **Database**: SQLite (`database.db`)
- **Frontend**: HTML5 & Plain Vanilla CSS (Simple College Student Level Styling)

## Features

1. **Sign Up**: Create a new account with Username, Email, and Password (stored in plaintext without hashing as requested).
2. **Login**: Authenticate using registered Username and Password.
3. **Empty Dashboard**: Protected area displaying a simple welcome card after successful login.
4. **Logout**: End user session and return to the login page.
5. **Flash Messages**: Clean user feedback for successful registration, login errors, and session warnings.

## Project Directory Layout

```
Roamly/
├── app.py              # Main Flask application and SQLite database setup
├── database.db         # SQLite database file (automatically created on run)
├── .gitignore          # Ignored files (virtualenv, database.db, pycache)
├── README.md           # Project setup and documentation
├── static/
│   └── css/
│       └── style.css   # Simple CSS stylesheet
└── templates/
    ├── base.html       # Base HTML layout
    ├── login.html      # Login page template
    ├── signup.html     # Sign Up page template
    └── dashboard.html  # Empty dashboard page template
```

## How to Run the Project

1. **Install Prerequisites**:
   Make sure Python 3 and Flask are installed:
   ```bash
   pip install flask
   ```

2. **Run the Flask App**:
   Execute the following command in the project directory:
   ```bash
   python app.py
   ```

3. **Access in Browser**:
   Open your browser and navigate to:
   [http://127.0.0.1:5000/](http://127.0.0.1:5000/)

## Database Schema

The SQLite database (`database.db`) automatically initializes the `users` table upon launching `app.py`:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);
```
