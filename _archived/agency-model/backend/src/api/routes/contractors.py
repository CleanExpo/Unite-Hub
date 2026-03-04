"""Contractor Availability API Routes.

Australian-first API for managing contractor schedules.
Currently returns 503 — Supabase was removed in the JWT migration.
Requires PostgreSQL migration to restore functionality.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from src.models.contractor import (
    AustralianState,
    AvailabilitySlot,
    AvailabilitySlotCreate,
    AvailabilityStatus,
    Contractor,
    ContractorCreate,
    ContractorList,
    ContractorUpdate,
    ErrorResponse,
)
from src.utils import get_logger

logger = get_logger(__name__)

_SERVICE_MSG = "Contractor API requires database migration to PostgreSQL"

router = APIRouter(
    prefix="/contractors",
    tags=["contractors"],
    responses={
        404: {"model": ErrorResponse, "description": "Contractor not found"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        503: {"model": ErrorResponse, "description": _SERVICE_MSG},
    },
)


def _raise_unavailable() -> None:
    raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=_SERVICE_MSG)


@router.get("/", response_model=ContractorList, summary="List all contractors")
async def list_contractors(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    state: AustralianState | None = Query(None),
    specialisation: str | None = Query(None),
) -> ContractorList:
    _raise_unavailable()


@router.get("/{contractor_id}", response_model=Contractor, summary="Get contractor by ID")
async def get_contractor(contractor_id: str) -> Contractor:
    _raise_unavailable()


@router.post("/", response_model=Contractor, status_code=status.HTTP_201_CREATED, summary="Create new contractor")
async def create_contractor(contractor: ContractorCreate) -> Contractor:
    _raise_unavailable()


@router.patch("/{contractor_id}", response_model=Contractor, summary="Update contractor")
async def update_contractor(contractor_id: str, updates: ContractorUpdate) -> Contractor:
    _raise_unavailable()


@router.delete("/{contractor_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete contractor")
async def delete_contractor(contractor_id: str):
    _raise_unavailable()


@router.post(
    "/{contractor_id}/availability",
    response_model=AvailabilitySlot,
    status_code=status.HTTP_201_CREATED,
    summary="Add availability slot",
)
async def add_availability_slot(contractor_id: str, slot: AvailabilitySlotCreate) -> AvailabilitySlot:
    _raise_unavailable()


@router.get(
    "/{contractor_id}/availability",
    response_model=list[AvailabilitySlot],
    summary="Get contractor availability",
)
async def get_contractor_availability(
    contractor_id: str,
    status_filter: AvailabilityStatus | None = Query(None, alias="status"),
) -> list[AvailabilitySlot]:
    _raise_unavailable()


@router.get("/search/by-location", response_model=ContractorList, summary="Search contractors by location")
async def search_by_location(
    suburb: Annotated[str, Query(description="Brisbane suburb")],
    state: AustralianState = Query(AustralianState.QLD),
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ContractorList:
    _raise_unavailable()
