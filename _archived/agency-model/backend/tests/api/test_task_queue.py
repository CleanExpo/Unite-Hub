"""Tests for task queue API routes."""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

AUTH_HEADERS = {"X-User-Id": "00000000-0000-0000-0000-000000000001"}


class TestTaskQueueAPI:
    """Tests for task queue endpoints."""

    @patch('src.api.routes.task_queue.SupabaseStateStore')
    def test_create_task_success(self, mock_store_class):
        """Test creating a new task."""
        # Mock Supabase client
        mock_client = MagicMock()
        mock_store = mock_store_class.return_value
        mock_store.client = mock_client

        # Mock insert response
        mock_result = MagicMock()
        mock_result.data = [{
            "id": "test-uuid-123",
            "title": "Test Task",
            "description": "This is a test task for the agentic layer",
            "task_type": "feature",
            "priority": 5,
            "status": "pending",
            "assigned_agent_id": None,
            "assigned_agent_type": None,
            "started_at": None,
            "completed_at": None,
            "iterations": 0,
            "verification_status": None,
            "pr_url": None,
            "created_by": None,
            "created_at": "2025-12-30T15:00:00",
            "updated_at": "2025-12-30T15:00:00"
        }]
        mock_client.table.return_value.insert.return_value.execute.return_value = mock_result

        response = client.post(
            "/api/tasks/",
            json={
                "title": "Test Task",
                "description": "This is a test task for the agentic layer",
                "task_type": "feature",
                "priority": 5
            },
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 201
        data = response.json()

        assert data["title"] == "Test Task"
        assert data["task_type"] == "feature"
        assert data["status"] == "pending"

    def test_create_task_validation_short_title(self):
        """Test that short titles are rejected."""
        response = client.post(
            "/api/tasks/",
            json={
                "title": "AB",  # Too short (min 3)
                "description": "Valid description here",
                "task_type": "feature",
                "priority": 5
            },
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 422  # Validation error

    def test_create_task_validation_invalid_type(self):
        """Test that invalid task types are rejected."""
        response = client.post(
            "/api/tasks/",
            json={
                "title": "Valid Title",
                "description": "Valid description",
                "task_type": "invalid_type",
                "priority": 5
            },
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 422  # Validation error

    @patch('src.api.routes.task_queue.SupabaseStateStore')
    def test_list_tasks(self, mock_store_class):
        """Test listing tasks."""
        # Mock Supabase client
        mock_client = MagicMock()
        mock_store = mock_store_class.return_value
        mock_store.client = mock_client

        # Mock query response
        mock_result = MagicMock()
        mock_result.data = [{
            "id": "task-1",
            "title": "Test Task 1",
            "description": "Description 1",
            "task_type": "feature",
            "priority": 5,
            "status": "pending",
            "assigned_agent_id": None,
            "assigned_agent_type": None,
            "started_at": None,
            "completed_at": None,
            "iterations": 0,
            "verification_status": None,
            "pr_url": None,
            "created_by": None,
            "created_at": "2025-12-30T15:00:00",
            "updated_at": "2025-12-30T15:00:00"
        }]
        mock_result.count = 1

        # Mock the query chain
        mock_table = MagicMock()
        mock_table.select.return_value.order.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        mock_table.select.return_value.execute.return_value = mock_result
        mock_client.table.return_value = mock_table

        response = client.get("/api/tasks/", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        assert "tasks" in data
        assert "total" in data
        assert isinstance(data["tasks"], list)
        assert len(data["tasks"]) == 1

    @patch('src.api.routes.task_queue.SupabaseStateStore')
    def test_list_tasks_with_filters(self, mock_store_class):
        """Test listing tasks with status filter."""
        mock_client = MagicMock()
        mock_store = mock_store_class.return_value
        mock_store.client = mock_client

        mock_result = MagicMock()
        mock_result.data = [{
            "id": "task-pending",
            "title": "Pending Task",
            "description": "Desc",
            "task_type": "feature",
            "priority": 5,
            "status": "pending",
            "assigned_agent_id": None,
            "assigned_agent_type": None,
            "started_at": None,
            "completed_at": None,
            "iterations": 0,
            "verification_status": None,
            "pr_url": None,
            "created_by": None,
            "created_at": "2025-12-30T15:00:00",
            "updated_at": "2025-12-30T15:00:00"
        }]
        mock_result.count = 1

        mock_table = MagicMock()
        mock_table.select.return_value.eq.return_value.order.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        mock_table.select.return_value.eq.return_value.execute.return_value = mock_result
        mock_client.table.return_value = mock_table

        response = client.get("/api/tasks/?status_filter=pending&page_size=10", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        # All returned tasks should be pending
        for task in data["tasks"]:
            assert task["status"] == "pending"

    @patch('src.api.routes.task_queue.SupabaseStateStore')
    def test_list_tasks_pagination(self, mock_store_class):
        """Test task list pagination."""
        mock_client = MagicMock()
        mock_store = mock_store_class.return_value
        mock_store.client = mock_client

        mock_result = MagicMock()
        mock_result.data = []
        mock_result.count = 0

        mock_table = MagicMock()
        mock_table.select.return_value.order.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        mock_table.select.return_value.execute.return_value = mock_result
        mock_client.table.return_value = mock_table

        response = client.get("/api/tasks/?page=1&page_size=5", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        assert data["page"] == 1
        assert data["page_size"] == 5

    @patch('src.api.routes.task_queue.SupabaseStateStore')
    def test_get_queue_stats(self, mock_store_class):
        """Test getting queue statistics."""
        mock_client = MagicMock()
        mock_store = mock_store_class.return_value
        mock_store.client = mock_client

        mock_result = MagicMock()
        mock_result.data = [
            {"status": "pending", "task_type": "feature"},
            {"status": "in_progress", "task_type": "bug"},
            {"status": "completed", "task_type": "feature"},
            {"status": "pending", "task_type": "docs"}
        ]

        mock_client.table.return_value.select.return_value.execute.return_value = mock_result

        response = client.get("/api/tasks/stats/summary", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        assert "total_tasks" in data
        assert "by_status" in data
        assert data["total_tasks"] == 4
        assert data["pending"] == 2
        assert data["in_progress"] == 1
        assert data["completed"] == 1

    def test_get_task_by_id(self):
        """Test getting a specific task."""
        # Skipping - requires database integration test
        pass

    def test_update_task_status(self):
        """Test updating a task status."""
        # Skipping - requires database integration test
        pass

    def test_cancel_task(self):
        """Test cancelling a task."""
        # Skipping - requires database integration test
        pass
