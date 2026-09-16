import hmac
from werkzeug.security import generate_password_hash, check_password_hash

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
