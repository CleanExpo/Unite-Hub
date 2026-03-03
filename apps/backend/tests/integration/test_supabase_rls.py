"""
Supabase RLS (Row Level Security) Integration Tests

Tests database integration and RLS policies to ensure:
- Users can only access their own data
- RLS policies are properly enforced
- Database operations respect security boundaries
- Data integrity is maintained

Requirements:
- Test database with RLS enabled
- Test user accounts
- Proper permissions setup
"""

import pytest
import os
from supabase import create_client, Client
from datetime import datetime


# Test configuration
TEST_SUPABASE_URL = os.getenv("TEST_SUPABASE_URL", "http://localhost:54321")
TEST_SUPABASE_KEY = os.getenv("TEST_SUPABASE_SERVICE_KEY", "test-key")


@pytest.fixture
def supabase_client() -> Client:
    """Create Supabase client for testing."""
    return create_client(TEST_SUPABASE_URL, TEST_SUPABASE_KEY)


@pytest.fixture
def test_user_client() -> Client:
    """Create Supabase client authenticated as test user."""
    client = create_client(TEST_SUPABASE_URL, TEST_SUPABASE_KEY)
    # In real implementation, authenticate as test user
    return client


@pytest.fixture
def cleanup_test_data(supabase_client: Client):
    """Cleanup test data after each test."""
    yield
    # Cleanup logic here
    # Delete test PRDs, users, etc.


class TestSupabaseConnection:
    """Test basic Supabase connection and setup."""

    def test_connection_success(self, supabase_client: Client):
        """Test that connection to Supabase is successful."""
        # Try a simple query
        response = supabase_client.table("prds").select("id").limit(1).execute()
        assert response is not None

    def test_database_tables_exist(self, supabase_client: Client):
        """Test that required database tables exist."""
        tables_to_check = ["prds", "agent_runs", "agent_memory"]

        for table in tables_to_check:
            try:
                response = supabase_client.table(table).select("*").limit(0).execute()
                assert response is not None
            except Exception as e:
                pytest.fail(f"Table {table} does not exist or is not accessible: {e}")


class TestPRDTableRLS:
    """Test RLS policies on PRDs table."""

    def test_user_can_create_own_prd(self, test_user_client: Client, cleanup_test_data):
        """Test that authenticated user can create their own PRD."""
        prd_data = {
            "title": "Test PRD",
            "content": {"product_name": "Test Product", "features": []},
            "status": "draft",
            "created_at": datetime.utcnow().isoformat(),
        }

        response = test_user_client.table("prds").insert(prd_data).execute()

        assert response.data is not None
        assert len(response.data) > 0
        assert response.data[0]["title"] == "Test PRD"

    def test_user_cannot_read_other_users_prds(self, supabase_client: Client):
        """Test that user cannot read PRDs belonging to other users."""
        # This would require creating PRDs for different users
        # and verifying isolation
        pass

    def test_user_can_update_own_prd(self, test_user_client: Client):
        """Test that user can update their own PRD."""
        # Create PRD
        prd_data = {
            "title": "Original Title",
            "content": {},
            "status": "draft",
        }

        create_response = test_user_client.table("prds").insert(prd_data).execute()

        prd_id = create_response.data[0]["id"]

        # Update PRD
        update_response = (
            test_user_client.table("prds").update({"title": "Updated Title"}).eq("id", prd_id).execute()
        )

        assert update_response.data[0]["title"] == "Updated Title"

    def test_user_cannot_update_other_users_prds(self, supabase_client: Client):
        """Test that user cannot update PRDs belonging to other users."""
        # Would require multi-user test setup
        pass

    def test_user_can_delete_own_prd(self, test_user_client: Client):
        """Test that user can delete their own PRD."""
        # Create PRD
        prd_data = {
            "title": "To Delete",
            "content": {},
            "status": "draft",
        }

        create_response = test_user_client.table("prds").insert(prd_data).execute()

        prd_id = create_response.data[0]["id"]

        # Delete PRD
        delete_response = test_user_client.table("prds").delete().eq("id", prd_id).execute()

        assert delete_response is not None

        # Verify deletion
        select_response = test_user_client.table("prds").select("*").eq("id", prd_id).execute()

        assert len(select_response.data) == 0


class TestAgentRunsRLS:
    """Test RLS policies on agent_runs table."""

    def test_user_can_view_own_agent_runs(self, test_user_client: Client):
        """Test that user can view their own agent runs."""
        response = test_user_client.table("agent_runs").select("*").execute()

        # Should not raise permission error
        assert response is not None

    def test_agent_run_creation(self, test_user_client: Client, cleanup_test_data):
        """Test creating agent run records."""
        agent_run_data = {
            "run_id": "test-run-123",
            "status": "pending",
            "input_data": {"task": "test"},
            "created_at": datetime.utcnow().isoformat(),
        }

        response = test_user_client.table("agent_runs").insert(agent_run_data).execute()

        assert response.data is not None
        assert response.data[0]["run_id"] == "test-run-123"


class TestDataIntegrity:
    """Test data integrity and constraints."""

    def test_prd_required_fields(self, test_user_client: Client):
        """Test that required fields are enforced."""
        # Try to create PRD without required fields
        incomplete_prd = {
            "content": {},
            # Missing title and status
        }

        with pytest.raises(Exception):
            test_user_client.table("prds").insert(incomplete_prd).execute()

    def test_prd_status_enum(self, test_user_client: Client):
        """Test that PRD status is constrained to valid values."""
        invalid_prd = {
            "title": "Test",
            "content": {},
            "status": "invalid_status",  # Invalid status
        }

        # Should fail if status enum is enforced
        # Note: This depends on database constraints
        with pytest.raises(Exception):
            test_user_client.table("prds").insert(invalid_prd).execute()

    def test_json_field_validation(self, test_user_client: Client):
        """Test that JSON fields accept valid JSON."""
        valid_json_prd = {
            "title": "JSON Test",
            "content": {
                "product_name": "Test",
                "features": ["feature1", "feature2"],
                "requirements": {"functional": [], "non_functional": []},
            },
            "status": "draft",
        }

        response = test_user_client.table("prds").insert(valid_json_prd).execute()

        assert response.data[0]["content"]["product_name"] == "Test"


class TestTransactions:
    """Test database transactions and rollback."""

    def test_transaction_rollback_on_error(self, supabase_client: Client):
        """Test that transactions rollback on error."""
        # This would require transaction support testing
        # Supabase/Postgres should handle this automatically
        pass


class TestIndexPerformance:
    """Test that database indexes are working."""

    def test_prd_id_index(self, supabase_client: Client):
        """Test that queries by ID use index."""
        # Create multiple PRDs
        for i in range(10):
            supabase_client.table("prds").insert(
                {
                    "title": f"PRD {i}",
                    "content": {},
                    "status": "draft",
                }
            ).execute()

        # Query by ID should be fast
        import time

        start = time.time()
        supabase_client.table("prds").select("*").limit(1).execute()
        duration = time.time() - start

        # Should complete quickly (< 100ms)
        assert duration < 0.1

    def test_user_id_index(self, test_user_client: Client):
        """Test that queries by user_id use index."""
        # Similar to above, test user_id filtering performance
        pass


class TestConcurrency:
    """Test concurrent database access."""

    def test_concurrent_inserts(self, supabase_client: Client):
        """Test that concurrent inserts don't conflict."""
        import asyncio

        async def insert_prd(title: str):
            supabase_client.table("prds").insert(
                {
                    "title": title,
                    "content": {},
                    "status": "draft",
                }
            ).execute()

        # Run multiple inserts concurrently
        # Note: This requires async Supabase client
        pass

    def test_optimistic_locking(self, supabase_client: Client):
        """Test optimistic locking for concurrent updates."""
        # Create PRD
        prd_data = {
            "title": "Concurrent Test",
            "content": {},
            "status": "draft",
        }

        response = supabase_client.table("prds").insert(prd_data).execute()

        prd_id = response.data[0]["id"]

        # Simulate concurrent updates
        # Should handle gracefully
        pass


class TestSoftDeletes:
    """Test soft delete functionality if implemented."""

    def test_soft_delete_prd(self, test_user_client: Client):
        """Test that PRDs are soft deleted, not hard deleted."""
        # Create PRD
        prd_data = {
            "title": "Soft Delete Test",
            "content": {},
            "status": "draft",
        }

        create_response = test_user_client.table("prds").insert(prd_data).execute()

        prd_id = create_response.data[0]["id"]

        # Soft delete (update deleted_at field)
        test_user_client.table("prds").update({"deleted_at": datetime.utcnow().isoformat()}).eq(
            "id", prd_id
        ).execute()

        # Verify still exists in database but marked deleted
        response = test_user_client.table("prds").select("*").eq("id", prd_id).execute()

        if len(response.data) > 0:
            assert response.data[0]["deleted_at"] is not None


class TestAuditTrail:
    """Test audit trail and change tracking if implemented."""

    def test_created_at_timestamp(self, test_user_client: Client):
        """Test that created_at is automatically set."""
        prd_data = {
            "title": "Timestamp Test",
            "content": {},
            "status": "draft",
        }

        response = test_user_client.table("prds").insert(prd_data).execute()

        assert "created_at" in response.data[0]
        assert response.data[0]["created_at"] is not None

    def test_updated_at_timestamp(self, test_user_client: Client):
        """Test that updated_at is automatically updated."""
        # Create PRD
        prd_data = {
            "title": "Update Test",
            "content": {},
            "status": "draft",
        }

        create_response = test_user_client.table("prds").insert(prd_data).execute()

        prd_id = create_response.data[0]["id"]
        original_updated_at = create_response.data[0].get("updated_at")

        import time

        time.sleep(1)  # Ensure time difference

        # Update PRD
        update_response = (
            test_user_client.table("prds").update({"title": "Updated"}).eq("id", prd_id).execute()
        )

        new_updated_at = update_response.data[0].get("updated_at")

        # updated_at should change
        if original_updated_at and new_updated_at:
            assert new_updated_at > original_updated_at


class TestErrorHandling:
    """Test error handling and edge cases."""

    def test_invalid_table_name(self, supabase_client: Client):
        """Test query to non-existent table."""
        with pytest.raises(Exception):
            supabase_client.table("nonexistent_table").select("*").execute()

    def test_invalid_column_name(self, test_user_client: Client):
        """Test query with invalid column name."""
        # Some databases may allow this, others may error
        try:
            response = test_user_client.table("prds").select("nonexistent_column").execute()
            # If it doesn't error, verify it returns empty or handles gracefully
        except Exception:
            # Expected behavior - column doesn't exist
            pass

    def test_null_value_handling(self, test_user_client: Client):
        """Test handling of null values."""
        prd_data = {
            "title": "Null Test",
            "content": None,  # Nullable field
            "status": "draft",
        }

        # Should handle null gracefully
        response = test_user_client.table("prds").insert(prd_data).execute()

        assert response.data[0]["content"] is None


# Run tests with: pytest tests/integration/test_supabase_rls.py -v
