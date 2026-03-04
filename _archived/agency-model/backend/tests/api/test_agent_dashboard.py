"""Tests for agent dashboard API routes."""

import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

AUTH_HEADERS = {"X-User-Id": "00000000-0000-0000-0000-000000000001"}


class TestAgentDashboardAPI:
    """Tests for agent dashboard endpoints."""

    @patch('src.api.routes.agent_dashboard.AgentMetrics')
    def test_get_agent_stats(self, mock_metrics_class):
        """Test GET /api/agents/stats endpoint."""
        # Mock the get_overall_statistics method
        mock_instance = mock_metrics_class.return_value
        mock_instance.get_overall_statistics = AsyncMock(return_value={
            "total_tasks": 100,
            "successful_tasks": 85,
            "failed_tasks": 15,
            "success_rate": 0.85,
            "by_agent_type": {
                "frontend": {"total": 40, "successful": 35},
                "backend": {"total": 60, "successful": 50}
            }
        })

        response = client.get("/api/agents/stats", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "total_agents" in data
        assert "active_agents" in data
        assert "total_tasks" in data
        assert "success_rate" in data
        assert "avg_iterations" in data

        # Verify values
        assert data["total_agents"] == 2  # frontend + backend
        assert data["total_tasks"] == 100
        assert data["success_rate"] == 0.85

    @patch('src.api.routes.agent_dashboard.AgentMetrics')
    def test_get_agent_stats_with_time_range(self, mock_metrics_class):
        """Test stats endpoint with custom time range."""
        mock_instance = mock_metrics_class.return_value
        mock_instance.get_overall_statistics = AsyncMock(return_value={
            "total_tasks": 50,
            "successful_tasks": 45,
            "failed_tasks": 5,
            "success_rate": 0.90,
            "by_agent_type": {}
        })

        response = client.get("/api/agents/stats?time_range=30", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()
        assert data["time_range_days"] == 30

    def test_list_agents(self):
        """Test GET /api/agents/list endpoint."""
        # This endpoint returns hardcoded data, no mocking needed
        response = client.get("/api/agents/list", headers=AUTH_HEADERS)

        assert response.status_code == 200
        agents = response.json()

        assert isinstance(agents, list)
        assert len(agents) == 3  # Hardcoded 3 agents

        # Verify agent structure
        agent = agents[0]
        assert "agent_id" in agent
        assert "agent_type" in agent
        assert "status" in agent
        assert "task_count" in agent
        assert "success_rate" in agent

    def test_list_agents_filtered_by_type(self):
        """Test listing agents with type filter."""
        response = client.get("/api/agents/list?agent_type=frontend", headers=AUTH_HEADERS)

        assert response.status_code == 200
        agents = response.json()

        # All returned agents should be frontend type
        for agent in agents:
            assert agent["agent_type"] == "frontend"

    def test_get_recent_tasks(self):
        """Test GET /api/agents/tasks/recent endpoint."""
        # This endpoint returns hardcoded data, no mocking needed
        response = client.get("/api/agents/tasks/recent?limit=5", headers=AUTH_HEADERS)

        assert response.status_code == 200
        tasks = response.json()

        assert isinstance(tasks, list)
        assert len(tasks) <= 5

        # Verify task structure
        if tasks:
            task = tasks[0]
            assert "task_id" in task
            assert "agent_type" in task
            assert "status" in task
            assert "iterations" in task
            assert "verified" in task

    def test_get_recent_tasks_filtered(self):
        """Test recent tasks with filters."""
        response = client.get(
            "/api/agents/tasks/recent?agent_type=backend&status=completed&limit=10",
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 200
        tasks = response.json()

        # All returned tasks should match filters
        for task in tasks:
            assert task["agent_type"] == "backend"
            assert task["status"] == "completed"

    def test_get_performance_trends(self):
        """Test GET /api/agents/performance/trends endpoint."""
        # This endpoint returns hardcoded data, no mocking needed
        response = client.get("/api/agents/performance/trends?days=7", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        assert "time_range_days" in data
        assert "data_points" in data
        assert data["time_range_days"] == 7

        # Verify data points structure
        if data["data_points"]:
            point = data["data_points"][0]
            assert "date" in point
            assert "tasks_completed" in point
            assert "success_rate" in point
            assert "avg_iterations" in point
