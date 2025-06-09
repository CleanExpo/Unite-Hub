
import pytest
import asyncpg
import os
from datetime import datetime

@pytest.fixture
async def db_connection():
    """Create database connection for testing"""
    conn = await asyncpg.connect(os.getenv("DATABASE_URL", "postgresql://localhost/crm_test"))
    yield conn
    await conn.close()

class TestDatabaseOperations:
    """Test database CRUD operations"""
    
    async def test_client_crud(self, db_connection):
        """Test client CRUD operations"""
        # Create
        client_id = await db_connection.fetchval(
            "INSERT INTO clients (name, email, company) VALUES ($1, $2, $3) RETURNING id",
            "Test Client", "test@example.com", "Test Company"
        )
        assert client_id is not None
        
        # Read
        client = await db_connection.fetchrow(
            "SELECT * FROM clients WHERE id = $1", client_id
        )
        assert client["name"] == "Test Client"
        assert client["email"] == "test@example.com"
        
        # Update
        await db_connection.execute(
            "UPDATE clients SET name = $1 WHERE id = $2",
            "Updated Client", client_id
        )
        
        updated_client = await db_connection.fetchrow(
            "SELECT * FROM clients WHERE id = $1", client_id
        )
        assert updated_client["name"] == "Updated Client"
        
        # Delete
        await db_connection.execute("DELETE FROM clients WHERE id = $1", client_id)
        
        deleted_client = await db_connection.fetchrow(
            "SELECT * FROM clients WHERE id = $1", client_id
        )
        assert deleted_client is None
