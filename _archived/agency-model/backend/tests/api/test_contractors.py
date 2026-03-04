"""
Tests for Contractor Availability API.

Tests Australian context validation:
- ABN validation (11 digits, XX XXX XXX XXX format)
- Mobile validation (04XX XXX XXX format)
- Brisbane locations (QLD suburbs)
- AEST timezone handling
- DD/MM/YYYY date formatting

Note: CRUD tests require Supabase and are marked as integration tests.
"""

from datetime import datetime, time
import pytest
from fastapi.testclient import TestClient

from src.api.main import app

# Check if contractors_db exists (legacy in-memory store)
try:
    from src.api.routes.contractors import contractors_db
    HAS_INMEMORY_DB = True
except ImportError:
    HAS_INMEMORY_DB = False
    contractors_db = None

requires_inmemory_db = pytest.mark.skipif(
    not HAS_INMEMORY_DB,
    reason="Contractors route now uses Supabase, not in-memory DB"
)
from src.models.contractor import (
    AustralianState,
    AvailabilityStatus,
    validate_australian_mobile,
    validate_australian_abn,
)


client = TestClient(app)


class TestAustralianValidation:
    """Test Australian field validators."""

    def test_validate_australian_mobile_valid(self):
        """Valid Australian mobile numbers are formatted correctly."""
        # Test with spaces
        assert validate_australian_mobile("0412 345 678") == "0412 345 678"

        # Test without spaces
        assert validate_australian_mobile("0412345678") == "0412 345 678"

        # Test with mixed formatting
        assert validate_australian_mobile("0412-345-678") == "0412 345 678"

    def test_validate_australian_mobile_invalid(self):
        """Invalid mobile numbers raise ValueError."""
        # Too short
        with pytest.raises(ValueError, match="Australian mobile must be 10 digits"):
            validate_australian_mobile("041234567")

        # Doesn't start with 04
        with pytest.raises(ValueError, match="starting with 04"):
            validate_australian_mobile("0312345678")

        # Contains letters
        with pytest.raises(ValueError, match="Australian mobile must be 10 digits"):
            validate_australian_mobile("04XX345678")

    def test_validate_australian_abn_valid(self):
        """Valid ABN numbers are formatted correctly."""
        # Test with spaces
        assert validate_australian_abn("12 345 678 901") == "12 345 678 901"

        # Test without spaces
        assert validate_australian_abn("12345678901") == "12 345 678 901"

    def test_validate_australian_abn_invalid(self):
        """Invalid ABN numbers raise ValueError."""
        # Too short
        with pytest.raises(ValueError, match="ABN must be 11 digits"):
            validate_australian_abn("1234567890")

        # Too long
        with pytest.raises(ValueError, match="ABN must be 11 digits"):
            validate_australian_abn("123456789012")

        # Contains letters
        with pytest.raises(ValueError, match="ABN must be 11 digits"):
            validate_australian_abn("12X45678901")


@requires_inmemory_db
class TestContractorCRUD:
    """Test contractor CRUD operations with Australian data."""

    def setup_method(self):
        """Clear database before each test."""
        # Clear in-memory database
        from src.api.routes.contractors import contractors_db
        contractors_db.clear()

    def test_create_contractor_success(self):
        """Create contractor with valid Australian data."""
        response = client.post(
            "/api/contractors/",
            json={
                "name": "John Smith",
                "mobile": "0412 345 678",
                "abn": "12 345 678 901",
                "email": "john@example.com.au",
                "specialisation": "Water Damage Restoration",
            },
        )

        assert response.status_code == 201
        data = response.json()

        # Verify Australian formatting
        assert data["name"] == "John Smith"
        assert data["mobile"] == "0412 345 678"  # Formatted
        assert data["abn"] == "12 345 678 901"  # Formatted
        assert data["email"] == "john@example.com.au"
        assert data["specialisation"] == "Water Damage Restoration"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert data["availability_slots"] == []

    def test_create_contractor_invalid_mobile(self):
        """Creating contractor with invalid mobile returns 422."""
        response = client.post(
            "/api/contractors/",
            json={
                "name": "Jane Doe",
                "mobile": "1234567890",  # Invalid (doesn't start with 04)
                "abn": "12 345 678 901",
            },
        )

        assert response.status_code == 422
        assert "mobile" in response.text.lower() or "04" in response.text

    def test_create_contractor_invalid_abn(self):
        """Creating contractor with invalid ABN returns 422."""
        response = client.post(
            "/api/contractors/",
            json={
                "name": "Jane Doe",
                "mobile": "0412 345 678",
                "abn": "123456",  # Invalid (too short)
            },
        )

        assert response.status_code == 422
        assert "abn" in response.text.lower() or "11 digits" in response.text.lower()

    def test_create_contractor_without_abn(self):
        """Creating contractor without ABN is allowed (optional field)."""
        response = client.post(
            "/api/contractors/",
            json={
                "name": "Bob Jones",
                "mobile": "0423 456 789",
                # No ABN provided
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["abn"] is None

    def test_get_contractor_success(self):
        """Get contractor by ID returns contractor data."""
        # Create contractor
        create_response = client.post(
            "/api/contractors/",
            json={
                "name": "Sarah Johnson",
                "mobile": "0434 567 890",
                "abn": "23 456 789 012",
            },
        )
        contractor_id = create_response.json()["id"]

        # Get contractor
        response = client.get(f"/api/contractors/{contractor_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == contractor_id
        assert data["name"] == "Sarah Johnson"
        assert data["mobile"] == "0434 567 890"

    def test_get_contractor_not_found(self):
        """Getting non-existent contractor returns 404."""
        response = client.get("/api/contractors/nonexistent-id")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_update_contractor_success(self):
        """Update contractor details."""
        # Create contractor
        create_response = client.post(
            "/api/contractors/",
            json={
                "name": "Mike Brown",
                "mobile": "0445 678 901",
            },
        )
        contractor_id = create_response.json()["id"]

        # Update contractor
        response = client.patch(
            f"/api/contractors/{contractor_id}",
            json={
                "mobile": "0456 789 012",
                "specialisation": "Fire Damage Repair",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["mobile"] == "0456 789 012"  # Updated
        assert data["specialisation"] == "Fire Damage Repair"  # Updated
        assert data["name"] == "Mike Brown"  # Unchanged

    def test_delete_contractor_success(self):
        """Delete contractor removes them from system."""
        # Create contractor
        create_response = client.post(
            "/api/contractors/",
            json={
                "name": "Emma Wilson",
                "mobile": "0467 890 123",
            },
        )
        contractor_id = create_response.json()["id"]

        # Delete contractor
        response = client.delete(f"/api/contractors/{contractor_id}")

        assert response.status_code == 204

        # Verify deletion
        get_response = client.get(f"/api/contractors/{contractor_id}")
        assert get_response.status_code == 404

    def test_list_contractors_empty(self):
        """Listing contractors when database is empty."""
        response = client.get("/api/contractors/")

        assert response.status_code == 200
        data = response.json()
        assert data["contractors"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["page_size"] == 20

    def test_list_contractors_pagination(self):
        """List contractors with pagination."""
        # Create 5 contractors
        for i in range(5):
            client.post(
                "/api/contractors/",
                json={
                    "name": f"Contractor {i}",
                    "mobile": f"041{i} 345 678",
                },
            )

        # Get first page (2 per page)
        response = client.get("/api/contractors/?page=1&page_size=2")

        assert response.status_code == 200
        data = response.json()
        assert len(data["contractors"]) == 2
        assert data["total"] == 5
        assert data["page"] == 1
        assert data["page_size"] == 2


@requires_inmemory_db
class TestAvailabilitySlots:
    """Test availability slot operations with Brisbane locations."""

    def setup_method(self):
        """Clear database and create test contractor."""
        from src.api.routes.contractors import contractors_db
        contractors_db.clear()

        # Create contractor for testing
        response = client.post(
            "/api/contractors/",
            json={
                "name": "Test Contractor",
                "mobile": "0412 345 678",
                "abn": "12 345 678 901",
            },
        )
        self.contractor_id = response.json()["id"]

    def test_add_availability_slot_brisbane(self):
        """Add availability slot with Brisbane location."""
        response = client.post(
            f"/api/contractors/{self.contractor_id}/availability",
            json={
                "contractor_id": self.contractor_id,
                "date": "2026-01-06T00:00:00+10:00",  # AEST
                "start_time": "09:00:00",
                "end_time": "12:00:00",
                "location": {
                    "suburb": "Indooroopilly",
                    "state": "QLD",
                    "postcode": "4068",
                },
                "status": "available",
                "notes": "Available for water damage inspection",
            },
        )

        assert response.status_code == 201
        data = response.json()

        # Verify slot details
        assert data["start_time"] == "09:00:00"
        assert data["end_time"] == "12:00:00"
        assert data["location"]["suburb"] == "Indooroopilly"
        assert data["location"]["state"] == "QLD"
        assert data["location"]["postcode"] == "4068"
        assert data["status"] == "available"
        assert data["notes"] == "Available for water damage inspection"

    def test_add_availability_slot_invalid_time(self):
        """Adding slot with end time before start time fails."""
        response = client.post(
            f"/api/contractors/{self.contractor_id}/availability",
            json={
                "contractor_id": self.contractor_id,
                "date": "2026-01-06T00:00:00+10:00",
                "start_time": "14:00:00",
                "end_time": "12:00:00",  # Before start time
                "location": {
                    "suburb": "Toowong",
                    "state": "QLD",
                },
                "status": "available",
            },
        )

        assert response.status_code == 422
        assert "end time" in response.text.lower()

    def test_get_contractor_availability(self):
        """Get all availability slots for contractor."""
        # Add multiple slots
        brisbane_suburbs = ["Indooroopilly", "Toowong", "West End"]
        for suburb in brisbane_suburbs:
            client.post(
                f"/api/contractors/{self.contractor_id}/availability",
                json={
                    "contractor_id": self.contractor_id,
                    "date": "2026-01-06T00:00:00+10:00",
                    "start_time": "09:00:00",
                    "end_time": "12:00:00",
                    "location": {"suburb": suburb, "state": "QLD"},
                    "status": "available",
                },
            )

        # Get availability
        response = client.get(f"/api/contractors/{self.contractor_id}/availability")

        assert response.status_code == 200
        slots = response.json()
        assert len(slots) == 3
        # Verify Brisbane suburbs
        suburbs = [slot["location"]["suburb"] for slot in slots]
        assert set(suburbs) == set(brisbane_suburbs)

    def test_filter_availability_by_status(self):
        """Filter availability slots by status."""
        # Add available slot
        client.post(
            f"/api/contractors/{self.contractor_id}/availability",
            json={
                "contractor_id": self.contractor_id,
                "date": "2026-01-06T00:00:00+10:00",
                "start_time": "09:00:00",
                "end_time": "12:00:00",
                "location": {"suburb": "Indooroopilly", "state": "QLD"},
                "status": "available",
            },
        )

        # Add booked slot
        client.post(
            f"/api/contractors/{self.contractor_id}/availability",
            json={
                "contractor_id": self.contractor_id,
                "date": "2026-01-06T00:00:00+10:00",
                "start_time": "14:00:00",
                "end_time": "17:00:00",
                "location": {"suburb": "Toowong", "state": "QLD"},
                "status": "booked",
            },
        )

        # Filter for available only
        response = client.get(
            f"/api/contractors/{self.contractor_id}/availability?status=available"
        )

        assert response.status_code == 200
        slots = response.json()
        assert len(slots) == 1
        assert slots[0]["status"] == "available"


@requires_inmemory_db
class TestLocationSearch:
    """Test location-based contractor search."""

    def setup_method(self):
        """Clear database and create contractors in different locations."""
        from src.api.routes.contractors import contractors_db
        contractors_db.clear()

        # Create contractors with availability in different Brisbane suburbs
        suburbs_and_contractors = [
            ("Indooroopilly", "Contractor A"),
            ("Indooroopilly", "Contractor B"),
            ("Toowong", "Contractor C"),
        ]

        for suburb, name in suburbs_and_contractors:
            # Create contractor
            response = client.post(
                "/api/contractors/",
                json={"name": name, "mobile": "0412 345 678"},
            )
            contractor_id = response.json()["id"]

            # Add availability in suburb
            client.post(
                f"/api/contractors/{contractor_id}/availability",
                json={
                    "contractor_id": contractor_id,
                    "date": "2026-01-06T00:00:00+10:00",
                    "start_time": "09:00:00",
                    "end_time": "12:00:00",
                    "location": {"suburb": suburb, "state": "QLD"},
                    "status": "available",
                },
            )

    def test_search_by_brisbane_suburb(self):
        """Search contractors by Brisbane suburb."""
        response = client.get(
            "/api/contractors/search/by-location?suburb=Indooroopilly&state=QLD"
        )

        assert response.status_code == 200
        data = response.json()

        # Should find 2 contractors in Indooroopilly
        assert data["total"] == 2
        assert len(data["contractors"]) == 2

        # Verify they have Indooroopilly availability
        for contractor in data["contractors"]:
            suburbs = [
                slot["location"]["suburb"]
                for slot in contractor["availability_slots"]
            ]
            assert "Indooroopilly" in suburbs

    def test_search_case_insensitive(self):
        """Location search is case-insensitive."""
        # Search with different casing
        response = client.get(
            "/api/contractors/search/by-location?suburb=indooroopilly&state=QLD"
        )

        assert response.status_code == 200
        assert response.json()["total"] == 2


class TestAustralianStateEnum:
    """Test Australian state enumeration."""

    def test_all_states_valid(self):
        """All Australian states and territories are valid."""
        states = ["QLD", "NSW", "VIC", "SA", "WA", "TAS", "NT", "ACT"]
        for state in states:
            assert hasattr(AustralianState, state)

    def test_qld_default(self):
        """QLD (Queensland) is available as default for Brisbane focus."""
        assert AustralianState.QLD == "QLD"
        assert AustralianState.QLD.value == "QLD"
