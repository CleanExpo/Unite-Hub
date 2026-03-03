"""
JWT Authentication Module
Simple, self-contained JWT token generation and validation
"""

from datetime import UTC, datetime, timedelta

import jwt
from passlib.context import CryptContext

from src.config.settings import get_settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings from config
ALGORITHM = "HS256"


def _get_secret_key() -> str:
    """Get JWT secret key from settings."""
    return get_settings().jwt_secret_key


def _get_expire_minutes() -> int:
    """Get JWT expiration minutes from settings."""
    return get_settings().jwt_expire_minutes


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Dictionary containing claims (e.g., {"sub": user_email})
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=_get_expire_minutes())

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, _get_secret_key(), algorithm=ALGORITHM)

    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string

    Returns:
        Decoded payload dict if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, _get_secret_key(), algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None


def extract_user_email(token: str) -> str | None:
    """
    Extract user email from JWT token.

    Args:
        token: JWT token string

    Returns:
        User email if valid token, None otherwise
    """
    payload = decode_access_token(token)
    if payload is None:
        return None

    return payload.get("sub")
