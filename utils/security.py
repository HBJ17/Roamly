import os
import secrets
import time
import hmac
from collections import defaultdict
from werkzeug.security import generate_password_hash, check_password_hash
from flask import session

# Rate limiting in-memory store: {key: [timestamps]}
_FAILED_ATTEMPTS = defaultdict(list)

def hash_password(password: str) -> str:
    """Hash password using pbkdf2:sha256."""
    if not password:
        return ''
    return generate_password_hash(password, method='pbkdf2:sha256')

def verify_password(plain_password: str, hashed_or_plain: str) -> bool:
    """Verify password against hash with backward-compatible plain text check."""
    if not plain_password or not hashed_or_plain:
        return False
    if hashed_or_plain.startswith(('pbkdf2:', 'scrypt:', 'argon2:')):
        try:
            return check_password_hash(hashed_or_plain, plain_password)
        except Exception:
            return False
    # fallback plain string comparison
    return hmac.compare_digest(plain_password, hashed_or_plain)

def is_rate_limited(key: str, max_attempts: int = 5, window_seconds: int = 300) -> tuple[bool, int]:
    """Check if an action identifier (e.g. IP or username) has exceeded max attempts within the window.
    Returns (is_limited, seconds_remaining)."""
    now = time.time()
    attempts = [t for t in _FAILED_ATTEMPTS[key] if now - t < window_seconds]
    _FAILED_ATTEMPTS[key] = attempts
    if len(attempts) >= max_attempts:
        earliest = attempts[0]
        remaining = int(window_seconds - (now - earliest))
        return True, max(1, remaining)
    return False, 0

def record_failed_attempt(key: str):
    """Record a failed attempt for rate limiting."""
    _FAILED_ATTEMPTS[key].append(time.time())

def clear_failed_attempts(key: str):
    """Clear failed attempts upon successful authentication."""
    if key in _FAILED_ATTEMPTS:
        del _FAILED_ATTEMPTS[key]

def generate_reset_token() -> str:
    """Generate a cryptographically secure random token for password resets."""
    return secrets.token_urlsafe(32)

def generate_csrf_token() -> str:
    """Generate or retrieve a CSRF token stored in the user session."""
    if '_csrf_token' not in session:
        session['_csrf_token'] = secrets.token_hex(24)
    return session['_csrf_token']

def validate_csrf_token(token: str) -> bool:
    """Validate a submitted CSRF token against session token."""
    session_token = session.get('_csrf_token')
    if not session_token or not token:
        return False
    return hmac.compare_digest(session_token, token)

