"""Unit tests for PRD generation agents."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from pathlib import Path

from src.agents.prd import (
    PRDAnalysisAgent,
    PRDAnalysis,
    FeatureDecomposer,
    FeatureDecomposition,
    TechnicalSpecGenerator,
    TechnicalSpec,
    TestScenarioGenerator,
    TestPlan,
    RoadmapPlanner,
    Roadmap,
    PRDOrchestrator,
)


@pytest.fixture
def sample_requirements():
    """Sample requirements for testing."""
    return """
    Build a task management application for remote teams.
    Users should be able to create projects, assign tasks to team members,
    track progress with Kanban boards, and receive real-time notifications.
    Must support 100+ concurrent users.
    """


@pytest.fixture
def sample_context():
    """Sample context for testing."""
    return {
        "target_users": "Remote teams, project managers",
        "timeline": "3 months",
        "team_size": 2,
        "existing_stack": "Next.js + FastAPI + Supabase",
    }


@pytest.fixture
def mock_anthropic_response():
    """Mock Anthropic API response."""
    mock_response = MagicMock()
    mock_response.content = [
        MagicMock(
            text="""
            {
                "executive_summary": "Test summary",
                "problem_statement": "Test problem",
                "target_users": ["Remote teams"],
                "success_metrics": ["User adoption > 1000"],
                "functional_requirements": ["Requirement 1", "Requirement 2"],
                "non_functional_requirements": ["Performance < 200ms"],
                "constraints": ["Budget constraint"],
                "assumptions": ["Users have internet"],
                "out_of_scope": ["Mobile app v1"]
            }
            """
        )
    ]
    return mock_response


class TestPRDAnalysisAgent:
    """Tests for PRDAnalysisAgent."""

    @pytest.mark.asyncio
    async def test_execute_success(self, sample_requirements, sample_context, mock_anthropic_response):
        """Test successful PRD analysis."""
        agent = PRDAnalysisAgent()

        with patch.object(agent.client.messages, "create", new=AsyncMock(return_value=mock_anthropic_response)):
            result = await agent.execute(
                task_description=sample_requirements,
                context=sample_context
            )

            assert result["success"] is True
            assert "analysis" in result
            assert result["analysis"]["executive_summary"] == "Test summary"
            assert result["analysis"]["problem_statement"] == "Test problem"
            assert len(result["analysis"]["target_users"]) == 1
            assert len(result["analysis"]["functional_requirements"]) == 2

    @pytest.mark.asyncio
    async def test_execute_api_failure(self, sample_requirements, sample_context):
        """Test PRD analysis with API failure."""
        agent = PRDAnalysisAgent()

        with patch.object(agent.client.messages, "create", new=AsyncMock(side_effect=Exception("API Error"))):
            result = await agent.execute(
                task_description=sample_requirements,
                context=sample_context
            )

            assert result["success"] is False
            assert "error" in result
            assert "API Error" in result["error"]

    @pytest.mark.asyncio
    async def test_execute_invalid_json(self, sample_requirements, sample_context):
        """Test PRD analysis with invalid JSON response."""
        agent = PRDAnalysisAgent()

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="Invalid JSON {{{")]

        with patch.object(agent.client.messages, "create", new=AsyncMock(return_value=mock_response)):
            result = await agent.execute(
                task_description=sample_requirements,
                context=sample_context
            )

            # Should use fallback parser
            assert result["success"] is True
            assert "analysis" in result


class TestFeatureDecomposer:
    """Tests for FeatureDecomposer."""

    @pytest.fixture
    def sample_prd_analysis(self):
        """Sample PRD analysis for testing."""
        return PRDAnalysis(
            executive_summary="Test summary",
            problem_statement="Test problem",
            target_users=["Remote teams"],
            success_metrics=["Metric 1"],
            functional_requirements=["Req 1", "Req 2"],
            non_functional_requirements=["Non-func 1"],
            constraints=["Constraint 1"],
            assumptions=["Assumption 1"],
            out_of_scope=["Out 1"],
        )

    @pytest.mark.asyncio
    async def test_execute_success(self, sample_prd_analysis, sample_context):
        """Test successful feature decomposition."""
        decomposer = FeatureDecomposer()

        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(
                text="""
                {
                    "epics": [{
                        "id": "EP-001",
                        "name": "User Management",
                        "description": "User auth and profiles",
                        "user_stories": ["US-001"],
                        "priority": "Critical",
                        "business_value": "Core functionality"
                    }],
                    "user_stories": [{
                        "id": "US-001",
                        "title": "User Registration",
                        "description": "As a user, I want to register",
                        "acceptance_criteria": ["Given valid email", "When register", "Then account created"],
                        "priority": "Critical",
                        "epic": "EP-001",
                        "dependencies": [],
                        "effort_estimate": "M",
                        "technical_notes": []
                    }],
                    "total_effort_estimate": "2 weeks",
                    "critical_path": ["US-001"]
                }
                """
            )
        ]

        with patch.object(decomposer.client.messages, "create", new=AsyncMock(return_value=mock_response)):
            result = await decomposer.execute(
                prd_analysis=sample_prd_analysis,
                context=sample_context
            )

            assert result["success"] is True
            assert "decomposition" in result
            assert len(result["decomposition"]["epics"]) == 1
            assert len(result["decomposition"]["user_stories"]) == 1
            assert result["decomposition"]["epics"][0]["id"] == "EP-001"

    @pytest.mark.asyncio
    async def test_to_feature_list_json(self, sample_prd_analysis, sample_context):
        """Test conversion to feature_list.json format."""
        decomposer = FeatureDecomposer()

        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(
                text="""
                {
                    "epics": [{
                        "id": "EP-001",
                        "name": "Test Epic",
                        "description": "Test",
                        "user_stories": ["US-001"],
                        "priority": "Critical",
                        "business_value": "Test value"
                    }],
                    "user_stories": [{
                        "id": "US-001",
                        "title": "Test Story",
                        "description": "As a user",
                        "acceptance_criteria": ["Criteria 1"],
                        "priority": "Critical",
                        "epic": "EP-001",
                        "dependencies": [],
                        "effort_estimate": "M",
                        "technical_notes": ["Note 1"]
                    }],
                    "total_effort_estimate": "2 weeks",
                    "critical_path": ["US-001"]
                }
                """
            )
        ]

        with patch.object(decomposer.client.messages, "create", new=AsyncMock(return_value=mock_response)):
            result = await decomposer.execute(
                prd_analysis=sample_prd_analysis,
                context=sample_context
            )

            decomposition = FeatureDecomposition(**result["decomposition"])
            feature_list = decomposer.to_feature_list_json(decomposition)

            assert "features" in feature_list
            assert "version" in feature_list
            assert len(feature_list["features"]) == 1
            assert feature_list["features"][0]["id"] == "US-001"


class TestTechnicalSpecGenerator:
    """Tests for TechnicalSpecGenerator."""

    @pytest.fixture
    def sample_prd_analysis(self):
        return PRDAnalysis(
            executive_summary="Summary",
            problem_statement="Problem",
            target_users=["Users"],
            success_metrics=["Metric"],
            functional_requirements=["Req"],
            non_functional_requirements=["Non-req"],
            constraints=["Constraint"],
            assumptions=["Assumption"],
            out_of_scope=["Out"],
        )

    @pytest.fixture
    def sample_decomposition(self):
        return FeatureDecomposition(
            epics=[],
            user_stories=[],
            total_effort_estimate="2 weeks",
            critical_path=[],
        )

    @pytest.mark.asyncio
    async def test_execute_success(self, sample_prd_analysis, sample_decomposition, sample_context):
        """Test successful technical spec generation."""
        generator = TechnicalSpecGenerator()

        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(
                text="""
                {
                    "architecture_overview": "Test architecture",
                    "architecture_diagram_mermaid": "graph TD\\nA --> B",
                    "database_schema": [{
                        "name": "users",
                        "description": "User table",
                        "columns": [{"name": "id", "type": "UUID", "constraints": "PK", "description": "ID"}],
                        "indexes": [],
                        "relationships": []
                    }],
                    "database_migrations_needed": ["Create users table"],
                    "api_endpoints": [{
                        "method": "POST",
                        "path": "/api/users",
                        "description": "Create user",
                        "auth_required": true,
                        "request_body": {},
                        "response": {}
                    }],
                    "api_versioning_strategy": "Path-based",
                    "recommended_stack": {"frontend": "Next.js"},
                    "existing_stack_integration": ["Integrate"],
                    "security_considerations": ["Use HTTPS"],
                    "authentication_approach": "JWT",
                    "authorization_model": "RBAC",
                    "scalability_approach": "Horizontal",
                    "performance_targets": {"api": "< 200ms"},
                    "caching_strategy": "Redis",
                    "third_party_services": [],
                    "integration_points": ["REST API"],
                    "deployment_architecture": "Vercel + Railway",
                    "infrastructure_requirements": ["2x servers"]
                }
                """
            )
        ]

        with patch.object(generator.client.messages, "create", new=AsyncMock(return_value=mock_response)):
            result = await generator.execute(
                prd_analysis=sample_prd_analysis,
                feature_decomposition=sample_decomposition,
                context=sample_context
            )

            assert result["success"] is True
            assert "specification" in result
            assert len(result["specification"]["database_schema"]) == 1
            assert len(result["specification"]["api_endpoints"]) == 1


class TestPRDOrchestrator:
    """Tests for PRDOrchestrator."""

    @pytest.mark.asyncio
    async def test_generate_full_prd(self, sample_requirements, sample_context, tmp_path):
        """Test full PRD generation end-to-end."""
        orchestrator = PRDOrchestrator()

        # Mock all sub-agents
        with patch.object(orchestrator.analysis_agent, "execute") as mock_analysis, \
             patch.object(orchestrator.feature_decomposer, "execute") as mock_decomposer, \
             patch.object(orchestrator.tech_spec_generator, "execute") as mock_tech, \
             patch.object(orchestrator.test_generator, "execute") as mock_test, \
             patch.object(orchestrator.roadmap_planner, "execute") as mock_roadmap:

            # Setup mock returns
            mock_analysis.return_value = {
                "success": True,
                "analysis": {
                    "executive_summary": "Test",
                    "problem_statement": "Problem",
                    "target_users": ["Users"],
                    "success_metrics": ["Metric"],
                    "functional_requirements": ["Req"],
                    "non_functional_requirements": ["Non-req"],
                    "constraints": ["Constraint"],
                    "assumptions": ["Assumption"],
                    "out_of_scope": ["Out"],
                    "generated_at": "2025-01-01T00:00:00",
                    "model_used": "test",
                }
            }

            mock_decomposer.return_value = {
                "success": True,
                "decomposition": {
                    "epics": [],
                    "user_stories": [],
                    "total_effort_estimate": "2 weeks",
                    "critical_path": [],
                    "generated_at": "2025-01-01T00:00:00",
                    "model_used": "test",
                }
            }

            mock_tech.return_value = {
                "success": True,
                "specification": {
                    "architecture_overview": "Test",
                    "architecture_diagram_mermaid": "graph TD",
                    "database_schema": [],
                    "database_migrations_needed": [],
                    "api_endpoints": [],
                    "api_versioning_strategy": "v1",
                    "recommended_stack": {},
                    "existing_stack_integration": [],
                    "security_considerations": [],
                    "authentication_approach": "JWT",
                    "authorization_model": "RBAC",
                    "scalability_approach": "Horizontal",
                    "performance_targets": {},
                    "caching_strategy": "Redis",
                    "third_party_services": [],
                    "integration_points": [],
                    "deployment_architecture": "Cloud",
                    "infrastructure_requirements": [],
                    "generated_at": "2025-01-01T00:00:00",
                    "model_used": "test",
                }
            }

            mock_test.return_value = {
                "success": True,
                "test_plan": {
                    "unit_tests": [],
                    "integration_tests": [],
                    "e2e_tests": [],
                    "test_categories": [],
                    "coverage_strategy": "80%",
                    "critical_test_paths": [],
                    "test_fixtures": {},
                    "ci_integration": "GitHub Actions",
                    "test_frameworks": {},
                    "total_test_count": 0,
                    "estimated_implementation_effort": "1 week",
                    "generated_at": "2025-01-01T00:00:00",
                    "model_used": "test",
                }
            }

            mock_roadmap.return_value = {
                "success": True,
                "roadmap": {
                    "sprints": [],
                    "total_duration_weeks": 12,
                    "milestones": [],
                    "dependency_graph_mermaid": "graph TD",
                    "critical_path": [],
                    "team_composition": {},
                    "resource_allocation": [],
                    "risks": [],
                    "release_strategy": "Continuous",
                    "deployment_checkpoints": [],
                    "velocity_tracking": "Story points",
                    "kpis": [],
                    "executive_summary": "12 weeks",
                    "generated_at": "2025-01-01T00:00:00",
                    "model_used": "test",
                }
            }

            # Execute
            result = await orchestrator.generate(
                requirements=sample_requirements,
                context=sample_context,
                output_dir=tmp_path,
            )

            # Verify
            assert result["success"] is True
            assert "prd_result" in result
            assert result["prd_result"]["total_user_stories"] == 0
            assert result["prd_result"]["total_api_endpoints"] == 0
            assert result["prd_result"]["estimated_duration_weeks"] == 12

            # Verify documents were generated
            assert len(result["prd_result"]["documents_generated"]) == 6
            assert (tmp_path / "prd.md").exists()
            assert (tmp_path / "user_stories.md").exists()
            assert (tmp_path / "feature_list.json").exists()

    @pytest.mark.asyncio
    async def test_generate_agent_failure(self, sample_requirements, sample_context):
        """Test PRD generation when a sub-agent fails."""
        orchestrator = PRDOrchestrator()

        with patch.object(orchestrator.analysis_agent, "execute") as mock_analysis:
            mock_analysis.return_value = {
                "success": False,
                "error": "Analysis failed"
            }

            result = await orchestrator.generate(
                requirements=sample_requirements,
                context=sample_context,
            )

            assert result["success"] is False
            assert "error" in result
            assert "Analysis failed" in result["error"]


@pytest.mark.asyncio
async def test_generate_features_from_spec(sample_requirements, sample_context):
    """Test generate_features_from_spec function."""
    from src.agents.long_running.features import generate_features_from_spec

    with patch("src.agents.prd.PRDOrchestrator") as mock_orchestrator_class:
        mock_orchestrator = AsyncMock()
        mock_orchestrator_class.return_value = mock_orchestrator

        mock_orchestrator.generate.return_value = {
            "success": True,
            "prd_result": {
                "feature_decomposition": {
                    "user_stories": [
                        {
                            "id": "US-001",
                            "title": "User Registration",
                            "description": "As a user, I want to register",
                            "acceptance_criteria": ["Criteria 1"],
                            "priority": "Critical",
                            "epic": "EP-001",
                            "dependencies": [],
                            "effort_estimate": "M",
                            "technical_notes": ["Note 1"],
                        }
                    ],
                    "epics": [{"id": "EP-001", "name": "Test Epic"}],
                }
            }
        }

        features = await generate_features_from_spec(
            spec=sample_requirements,
            context=sample_context,
        )

        assert len(features) == 1
        assert features[0]["id"] == "us_001"
        assert features[0]["priority"] == "critical"
        assert features[0]["description"] == "User Registration"


@pytest.mark.asyncio
async def test_load_features_from_prd_json(tmp_path):
    """Test loading features from PRD-generated JSON."""
    from src.agents.long_running.features import load_features_from_prd_json
    import json

    # Create test JSON file
    feature_list = {
        "version": "1.0",
        "features": [
            {
                "id": "us_001",
                "name": "Test Feature",
                "description": "Test description",
                "priority": "critical",
                "status": "pending",
            }
        ],
    }

    json_path = tmp_path / "feature_list.json"
    json_path.write_text(json.dumps(feature_list), encoding="utf-8")

    # Load features
    features = load_features_from_prd_json(json_path)

    assert len(features) == 1
    assert features[0]["id"] == "us_001"
    assert features[0]["priority"] == "critical"


@pytest.mark.asyncio
async def test_load_features_from_prd_json_not_found():
    """Test loading features from non-existent JSON file."""
    from src.agents.long_running.features import load_features_from_prd_json

    with pytest.raises(FileNotFoundError):
        load_features_from_prd_json("/nonexistent/path.json")
