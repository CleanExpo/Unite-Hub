"""
User Authentication Models
SQLAlchemy models for JWT-based authentication
"""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase

from .jwt import get_password_hash, verify_password


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


class User(Base):
    """User model for authentication."""

    __tablename__ = "users"

    id: UUID = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: str = Column(String(255), unique=True, nullable=False, index=True)
    password_hash: str = Column(String(255), nullable=False)
    full_name: str | None = Column(String(255), nullable=True)
    is_active: bool = Column(Boolean, default=True, nullable=False, index=True)
    is_admin: bool = Column(Boolean, default=False, nullable=False)
    created_at: datetime = Column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: datetime = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )
    last_login_at: datetime | None = Column(DateTime(timezone=True), nullable=True)

    def set_password(self, password: str) -> None:
        """Hash and set the user's password."""
        self.password_hash = get_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify the user's password."""
        return verify_password(password, self.password_hash)

    def to_dict(self) -> dict:
        """Convert user to dictionary (excluding password_hash)."""
        return {
            "id": str(self.id),
            "email": self.email,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
        }

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
