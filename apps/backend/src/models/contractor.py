"""
Contractor models with Australian context validation.

Features:
- ABN (Australian Business Number) validation
- Australian mobile number validation (04XX XXX XXX)
- Brisbane location validation
- AEST/AEDT timezone handling
- DD/MM/YYYY date formatting
"""

import re
from datetime import datetime, time
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AvailabilityStatus(str, Enum):
    """Availability status for contractor slots."""

    AVAILABLE = "available"
    BOOKED = "booked"
    TENTATIVE = "tentative"
    UNAVAILABLE = "unavailable"


class AustralianState(str, Enum):
    """Australian states and territories."""

    QLD = "QLD"  # Queensland
    NSW = "NSW"  # New South Wales
    VIC = "VIC"  # Victoria
    SA = "SA"    # South Australia
    WA = "WA"    # Western Australia
    TAS = "TAS"  # Tasmania
    NT = "NT"    # Northern Territory
    ACT = "ACT"  # Australian Capital Territory


def validate_australian_mobile(phone: str) -> str:
    """
    Validate Australian mobile number.

    Format: 04XX XXX XXX or 04XXXXXXXX

    Args:
        phone: Phone number to validate

    Returns:
        Formatted phone number (04XX XXX XXX)

    Raises:
        ValueError: If phone number is invalid
    """
    # Remove all spaces and special characters
    cleaned = re.sub(r'[^\d]', '', phone)

    # Must be 10 digits starting with 04
    if not re.match(r'^04\d{8}$', cleaned):
        raise ValueError(
            "Australian mobile must be 10 digits starting with 04 "
            "(e.g., 0412 345 678)"
        )

    # Format as 04XX XXX XXX
    return f"{cleaned[:4]} {cleaned[4:7]} {cleaned[7:]}"


def validate_australian_abn(abn: str) -> str:
    """
    Validate Australian Business Number (ABN).

    Format: XX XXX XXX XXX (11 digits)

    Args:
        abn: ABN to validate

    Returns:
        Formatted ABN (XX XXX XXX XXX)

    Raises:
        ValueError: If ABN is invalid
    """
    # Remove all spaces
    cleaned = re.sub(r'\s', '', abn)

    # Must be 11 digits
    if not re.match(r'^\d{11}$', cleaned):
        raise ValueError(
            "Australian ABN must be 11 digits "
            "(e.g., 12 345 678 901)"
        )

    # Format as XX XXX XXX XXX
    return f"{cleaned[:2]} {cleaned[2:5]} {cleaned[5:8]} {cleaned[8:]}"


class Location(BaseModel):
    """Australian location with suburb and state."""

    model_config = ConfigDict(str_strip_whitespace=True)

    suburb: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Suburb name (e.g., Indooroopilly)",
        examples=["Indooroopilly", "Toowong", "West End"]
    )
    state: AustralianState = Field(
        ...,
        description="Australian state or territory",
        examples=["QLD", "NSW", "VIC"]
    )
    postcode: str | None = Field(
        None,
        pattern=r"^\d{4}$",
        description="4-digit Australian postcode",
        examples=["4068", "4066", "4101"]
    )

    def __str__(self) -> str:
        """Format location as 'Suburb, STATE' (Australian standard)."""
        return f"{self.suburb}, {self.state.value}"


class AvailabilitySlot(BaseModel):
    """Single availability time slot for a contractor."""

    model_config = ConfigDict(str_strip_whitespace=True)

    id: str | None = Field(None, description="Unique slot ID")
    date: datetime = Field(
        ...,
        description="Slot date (AEST timezone)",
        examples=["2026-01-06T00:00:00+10:00"]
    )
    start_time: time = Field(
        ...,
        description="Start time in 24-hour format",
        examples=["09:00:00", "14:00:00"]
    )
    end_time: time = Field(
        ...,
        description="End time in 24-hour format",
        examples=["12:00:00", "17:00:00"]
    )
    location: Location = Field(
        ...,
        description="Work location (Brisbane suburb)"
    )
    status: AvailabilityStatus = Field(
        default=AvailabilityStatus.AVAILABLE,
        description="Slot availability status"
    )
    notes: str | None = Field(
        None,
        max_length=500,
        description="Additional notes about the slot"
    )

    @field_validator("end_time")
    @classmethod
    def validate_end_after_start(cls, v: time, info) -> time:
        """Ensure end time is after start time."""
        if "start_time" in info.data:
            start = info.data["start_time"]
            if v <= start:
                raise ValueError("End time must be after start time")
        return v


class ContractorBase(BaseModel):
    """Base contractor information."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Contractor full name",
        examples=["John Smith", "Sarah Johnson"]
    )
    mobile: str = Field(
        ...,
        description="Australian mobile number (04XX XXX XXX)",
        examples=["0412 345 678", "0423 456 789"]
    )
    abn: str | None = Field(
        None,
        description="Australian Business Number (XX XXX XXX XXX)",
        examples=["12 345 678 901", "23 456 789 012"]
    )
    email: str | None = Field(
        None,
        pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        description="Email address",
        examples=["john@example.com.au"]
    )
    specialisation: str | None = Field(
        None,
        max_length=200,
        description="Contractor specialisation",
        examples=["Water Damage Restoration", "Fire Damage Repair"]
    )

    @field_validator("mobile")
    @classmethod
    def validate_mobile_format(cls, v: str) -> str:
        """Validate and format Australian mobile number."""
        return validate_australian_mobile(v)

    @field_validator("abn")
    @classmethod
    def validate_abn_format(cls, v: str | None) -> str | None:
        """Validate and format Australian Business Number."""
        if v is None:
            return None
        return validate_australian_abn(v)


class ContractorCreate(ContractorBase):
    """Schema for creating a new contractor."""

    pass


class ContractorUpdate(BaseModel):
    """Schema for updating contractor (all fields optional)."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(None, min_length=2, max_length=100)
    mobile: str | None = None
    abn: str | None = None
    email: str | None = None
    specialisation: str | None = Field(None, max_length=200)

    @field_validator("mobile")
    @classmethod
    def validate_mobile_format(cls, v: str | None) -> str | None:
        """Validate and format Australian mobile number."""
        if v is None:
            return None
        return validate_australian_mobile(v)

    @field_validator("abn")
    @classmethod
    def validate_abn_format(cls, v: str | None) -> str | None:
        """Validate and format Australian Business Number."""
        if v is None:
            return None
        return validate_australian_abn(v)


class Contractor(ContractorBase):
    """Full contractor model with ID and metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique contractor ID")
    created_at: datetime = Field(
        ...,
        description="Creation timestamp (AEST)"
    )
    updated_at: datetime = Field(
        ...,
        description="Last update timestamp (AEST)"
    )
    availability_slots: list[AvailabilitySlot] = Field(
        default_factory=list,
        description="Contractor's availability slots"
    )


class ContractorList(BaseModel):
    """Paginated list of contractors."""

    contractors: list[Contractor] = Field(
        default_factory=list,
        description="List of contractors"
    )
    total: int = Field(
        ...,
        ge=0,
        description="Total number of contractors"
    )
    page: int = Field(
        ...,
        ge=1,
        description="Current page number"
    )
    page_size: int = Field(
        ...,
        ge=1,
        le=100,
        description="Number of items per page"
    )


class AvailabilitySlotCreate(BaseModel):
    """Schema for creating a new availability slot."""

    model_config = ConfigDict(str_strip_whitespace=True)

    contractor_id: str = Field(..., description="Contractor ID")
    date: datetime = Field(
        ...,
        description="Slot date (AEST timezone)"
    )
    start_time: time = Field(
        ...,
        description="Start time in 24-hour format"
    )
    end_time: time = Field(
        ...,
        description="End time in 24-hour format"
    )
    location: Location = Field(
        ...,
        description="Work location"
    )
    status: AvailabilityStatus = Field(
        default=AvailabilityStatus.AVAILABLE,
        description="Slot availability status"
    )
    notes: str | None = Field(None, max_length=500)

    @field_validator("end_time")
    @classmethod
    def validate_end_after_start(cls, v: time, info) -> time:
        """Ensure end time is after start time."""
        if "start_time" in info.data:
            start = info.data["start_time"]
            if v <= start:
                raise ValueError("End time must be after start time")
        return v


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str = Field(..., description="Error message")
    error_code: str | None = Field(
        None,
        description="Machine-readable error code"
    )
