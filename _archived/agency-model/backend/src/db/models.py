"""
SQLAlchemy ORM Models

Database models matching the PostgreSQL schema from init-db.sql.
These are separate from Pydantic models (used for API validation).
"""

import enum
from datetime import UTC, datetime
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


class AustralianState(str, enum.Enum):
    """Australian states and territories (matching database ENUM)."""

    QLD = "QLD"  # Queensland
    NSW = "NSW"  # New South Wales
    VIC = "VIC"  # Victoria
    SA = "SA"  # South Australia
    WA = "WA"  # Western Australia
    TAS = "TAS"  # Tasmania
    NT = "NT"  # Northern Territory
    ACT = "ACT"  # Australian Capital Territory


class AvailabilityStatus(str, enum.Enum):
    """Availability status for contractor slots (matching database ENUM)."""

    AVAILABLE = "available"
    BOOKED = "booked"
    TENTATIVE = "tentative"
    UNAVAILABLE = "unavailable"


class User(Base):
    """
    User model for JWT authentication.

    Table: users
    """

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

    # Relationships
    contractors = relationship("Contractor", back_populates="user")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"


class Contractor(Base):
    """
    Contractor model for tracking contractor information.

    Table: contractors
    """

    __tablename__ = "contractors"

    id: UUID = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: UUID | None = Column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    name: str = Column(String(100), nullable=False)
    mobile: str = Column(String(20), nullable=False, index=True)
    abn: str | None = Column(String(20), nullable=True, index=True)
    email: str | None = Column(String(255), nullable=True)
    specialisation: str | None = Column(String(100), nullable=True)
    created_at: datetime = Column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: datetime = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="contractors")
    availability_slots = relationship(
        "AvailabilitySlot", back_populates="contractor", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Contractor(id={self.id}, name={self.name})>"


class AvailabilitySlot(Base):
    """
    Availability slot model for contractor scheduling.

    Table: availability_slots
    """

    __tablename__ = "availability_slots"

    id: UUID = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    contractor_id: UUID = Column(
        PGUUID(as_uuid=True),
        ForeignKey("contractors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    start_time: datetime = Column(Time, nullable=False)
    end_time: datetime = Column(Time, nullable=False)
    suburb: str = Column(String(100), nullable=False, index=True)
    state: AustralianState = Column(
        Enum(AustralianState, name="australian_state"),
        nullable=False,
        default=AustralianState.QLD,
        index=True,
    )
    postcode: str | None = Column(String(10), nullable=True)
    status: AvailabilityStatus = Column(
        Enum(AvailabilityStatus, name="availability_status"),
        default=AvailabilityStatus.AVAILABLE,
        index=True,
    )
    notes: str | None = Column(Text, nullable=True)
    created_at: datetime = Column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: datetime = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    contractor = relationship("Contractor", back_populates="availability_slots")

    def __repr__(self) -> str:
        return f"<AvailabilitySlot(id={self.id}, contractor_id={self.contractor_id}, date={self.date})>"


class Document(Base):
    """
    Document model for RAG/semantic search with pgvector.

    Table: documents
    """

    __tablename__ = "documents"

    id: UUID = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: UUID | None = Column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    title: str = Column(String(255), nullable=False)
    content: str = Column(Text, nullable=False)
    embedding: list[float] | None = Column(Vector(1536), nullable=True)  # OpenAI/Anthropic dimension
    # Renamed from 'metadata' to avoid SQLAlchemy reserved name
    doc_metadata: dict = Column("metadata", JSONB, default=dict, nullable=False)
    created_at: datetime = Column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: datetime = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="documents")

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, title={self.title})>"
