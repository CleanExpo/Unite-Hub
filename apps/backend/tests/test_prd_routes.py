"""Unit tests for PRD API routes."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from src.api.main import app


client = TestClient(app)

AUTH_HEADERS = {"X-User-Id": "00000000-0000-0000-0000-000000000001"}


@pytest.fixture
def sample_prd_request():
    """Sample PRD generation request."""
    return {
        "requirements": "Build a task management app for remote teams with Kanban boards",
        "context": {
            "target_users": "Remote teams",
            "timeline": "3 months",
            "team_size": 2,
        },
        "output_dir": "./test-workspace",
    }


@pytest.fixture
def sample_prd_result():
    """Sample PRD result."""
    return {
        "prd_analysis": {
            "executive_summary": "Test summary",
            "problem_statement": "Test problem",
            "target_users": ["Remote teams"],
            "success_metrics": ["Metric 1"],
            "functional_requirements": ["Req 1"],
            "non_functional_requirements": ["Non-req 1"],
            "constraints": ["Constraint 1"],
            "assumptions": ["Assumption 1"],
            "out_of_scope": ["Out 1"],
        },
        "feature_decomposition": {
            "epics": [],
            "user_stories": [],
            "total_effort_estimate": "2 weeks",
            "critical_path": [],
        },
        "technical_spec": {
            "architecture_overview": "Test",
            "database_schema": [],
            "api_endpoints": [],
        },
        "test_plan": {
            "unit_tests": [],
            "integration_tests": [],
            "e2e_tests": [],
            "total_test_count": 10,
        },
        "roadmap": {
            "sprints": [],
            "total_duration_weeks": 12,
            "milestones": [],
        },
        "documents_generated": [],
        "total_user_stories": 15,
        "total_api_endpoints": 25,
        "total_test_scenarios": 10,
        "total_sprints": 6,
        "estimated_duration_weeks": 12,
        "generated_at": "2025-01-01T00:00:00",
    }


class TestPRDGenerateEndpoint:
    """Tests for POST /api/prd/generate endpoint."""

    @patch("src.api.routes.prd.AgentEventPublisher")
    def test_generate_prd_success(self, mock_publisher, sample_prd_request):
        """Test successful PRD generation request."""
        # Mock event publisher
        mock_pub_instance = AsyncMock()
        mock_pub_instance.start_run.return_value = "run-123"
        mock_publisher.return_value = mock_pub_instance

        response = client.post("/api/prd/generate", json=sample_prd_request, headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        assert "prd_id" in data
        assert "run_id" in data
        assert "status" in data
        assert data["status"] == "pending"
        assert "prd_" in data["prd_id"]

    def test_generate_prd_missing_requirements(self):
        """Test PRD generation with missing requirements."""
        response = client.post("/api/prd/generate", json={"context": {}}, headers=AUTH_HEADERS)

        assert response.status_code == 422  # Validation error

    def test_generate_prd_requirements_too_short(self):
        """Test PRD generation with requirements too short."""
        response = client.post(
            "/api/prd/generate",
            json={"requirements": "Short", "context": {}},
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 422  # Validation error

    def test_generate_prd_invalid_context(self):
        """Test PRD generation with invalid context."""
        response = client.post(
            "/api/prd/generate",
            json={
                "requirements": "Build a task management app for remote teams with real-time collaboration",
                "context": "invalid",  # Should be dict
            },
            headers=AUTH_HEADERS,
        )

        assert response.status_code == 422


class TestPRDStatusEndpoint:
    """Tests for GET /api/prd/status/{run_id} endpoint."""

    @patch("src.state.supabase.SupabaseStateStore")
    def test_get_prd_status_success(self, mock_store_class):
        """Test successful status retrieval."""
        # Mock state store
        mock_store = AsyncMock()
        mock_store_class.return_value = mock_store
        mock_store.get_agent_run.return_value = {
            "task_id": "prd_123",
            "status": "in_progress",
            "progress_percent": 50.0,
            "current_step": "Generating technical spec",
            "metadata": {},
        }

        response = client.get("/api/prd/status/run-123", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        assert data["prd_id"] == "prd_123"
        assert data["status"] == "in_progress"
        assert data["progress_percent"] == 50.0
        assert data["current_step"] == "Generating technical spec"

    @patch("src.state.supabase.SupabaseStateStore")
    def test_get_prd_status_completed(self, mock_store_class, sample_prd_result):
        """Test status retrieval for completed PRD."""
        mock_store = AsyncMock()
        mock_store_class.return_value = mock_store
        mock_store.get_agent_run.return_value = {
            "task_id": "prd_123",
            "status": "completed",
            "progress_percent": 100.0,
            "current_step": None,
            "metadata": {"prd_result": sample_prd_result},
        }

        response = client.get("/api/prd/status/run-123", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "completed"
        assert data["progress_percent"] == 100.0
        assert data["result"] is not None
        assert data["result"]["total_user_stories"] == 15

    @patch("src.state.supabase.SupabaseStateStore")
    def test_get_prd_status_not_found(self, mock_store_class):
        """Test status retrieval for non-existent run."""
        mock_store = AsyncMock()
        mock_store_class.return_value = mock_store
        mock_store.get_agent_run.return_value = None

        response = client.get("/api/prd/status/nonexistent", headers=AUTH_HEADERS)

        assert response.status_code == 404

    @patch("src.state.supabase.SupabaseStateStore")
    def test_get_prd_status_failed(self, mock_store_class):
        """Test status retrieval for failed PRD."""
        mock_store = AsyncMock()
        mock_store_class.return_value = mock_store
        mock_store.get_agent_run.return_value = {
            "task_id": "prd_123",
            "status": "failed",
            "progress_percent": 30.0,
            "current_step": "Failed at analysis",
            "error": "API timeout",
            "metadata": {},
        }

        response = client.get("/api/prd/status/run-123", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "failed"
        assert data["error"] == "API timeout"


class TestPRDResultEndpoint:
    """Tests for GET /api/prd/result/{prd_id} endpoint."""

    @patch("src.state.supabase.SupabaseStateStore")
    def test_get_prd_result_success(self, mock_store_class, sample_prd_result):
        """Test successful PRD result retrieval."""
        mock_store = AsyncMock()
        mock_store_class.return_value = mock_store
        mock_store.get_task_agent_runs.return_value = [
            {
                "status": "completed",
                "metadata": {"prd_result": sample_prd_result},
            }
        ]

        response = client.get("/api/prd/result/prd_123", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        assert data["total_user_stories"] == 15
        assert data["total_api_endpoints"] == 25
        assert data["total_sprints"] == 6
        assert data["estimated_duration_weeks"] == 12

    @patch("src.state.supabase.SupabaseStateStore")
    def test_get_prd_result_not_found(self, mock_store_class):
        """Test PRD result retrieval for non-existent PRD."""
        mock_store = AsyncMock()
        mock_store_class.return_value = mock_store
        mock_store.get_task_agent_runs.return_value = []

        response = client.get("/api/prd/result/nonexistent", headers=AUTH_HEADERS)

        assert response.status_code == 404

    @patch("src.state.supabase.SupabaseStateStore")
    def test_get_prd_result_not_completed(self, mock_store_class):
        """Test PRD result retrieval for incomplete PRD."""
        mock_store = AsyncMock()
        mock_store_class.return_value = mock_store
        mock_store.get_task_agent_runs.return_value = [
            {
                "status": "in_progress",
                "metadata": {},
            }
        ]

        response = client.get("/api/prd/result/prd_123", headers=AUTH_HEADERS)

        assert response.status_code == 400


class TestPRDDocumentsEndpoint:
    """Tests for GET /api/prd/documents/{prd_id} endpoint."""

    @patch("src.state.supabase.SupabaseStateStore")
    def test_list_prd_documents_success(self, mock_store_class):
        """Test successful document listing."""
        mock_store = AsyncMock()
        mock_store_class.return_value = mock_store
        mock_store.get_task_agent_runs.return_value = [
            {
                "status": "completed",
                "metadata": {
                    "prd_result": {
                        "documents_generated": [
                            "./prd.md",
                            "./user_stories.md",
                            "./feature_list.json",
                            "./tech_spec.md",
                            "./test_plan.md",
                            "./roadmap.md",
                        ]
                    }
                },
            }
        ]

        response = client.get("/api/prd/documents/prd_123", headers=AUTH_HEADERS)

        assert response.status_code == 200
        data = response.json()

        assert data["prd_id"] == "prd_123"
        assert data["count"] == 6
        assert len(data["documents"]) == 6
        assert "./feature_list.json" in data["documents"]


@pytest.mark.asyncio
async def test_execute_prd_generation_background(sample_prd_request, sample_prd_result):
    """Test background PRD generation execution."""
    from src.api.routes.prd import execute_prd_generation
    from src.state.events import AgentEventPublisher

    mock_publisher = AsyncMock()
    mock_publisher.update_status = AsyncMock()
    mock_publisher.update_progress = AsyncMock()
    mock_publisher.complete_run = AsyncMock()

    with patch("src.api.routes.prd.PRDOrchestrator") as mock_orchestrator_class:
        mock_orchestrator = AsyncMock()
        mock_orchestrator_class.return_value = mock_orchestrator
        mock_orchestrator.generate.return_value = {
            "success": True,
            "prd_result": sample_prd_result,
        }

        with patch("src.state.supabase.SupabaseStateStore") as mock_store_class:
            mock_store = AsyncMock()
            mock_store_class.return_value = mock_store

            await execute_prd_generation(
                prd_id="prd_123",
                run_id="run_123",
                requirements=sample_prd_request["requirements"],
                context=sample_prd_request["context"],
                output_dir=sample_prd_request["output_dir"],
                publisher=mock_publisher,
            )

            # Verify orchestrator was called
            mock_orchestrator.generate.assert_called_once()

            # Verify progress updates
            mock_publisher.update_status.assert_called()
            mock_publisher.update_progress.assert_called()
            mock_publisher.complete_run.assert_called_once()


@pytest.mark.asyncio
async def test_execute_prd_generation_failure(sample_prd_request):
    """Test background PRD generation with failure."""
    from src.api.routes.prd import execute_prd_generation

    mock_publisher = AsyncMock()
    mock_publisher.update_status = AsyncMock()
    mock_publisher.fail_run = AsyncMock()

    with patch("src.api.routes.prd.PRDOrchestrator") as mock_orchestrator_class:
        mock_orchestrator = AsyncMock()
        mock_orchestrator_class.return_value = mock_orchestrator
        mock_orchestrator.generate.return_value = {
            "success": False,
            "error": "Analysis failed",
        }

        with patch("src.state.supabase.SupabaseStateStore") as mock_store_class:
            mock_store = AsyncMock()
            mock_store_class.return_value = mock_store

            await execute_prd_generation(
                prd_id="prd_123",
                run_id="run_123",
                requirements=sample_prd_request["requirements"],
                context=sample_prd_request["context"],
                output_dir=None,
                publisher=mock_publisher,
            )

            # Verify failure was reported
            mock_publisher.fail_run.assert_called_once()
