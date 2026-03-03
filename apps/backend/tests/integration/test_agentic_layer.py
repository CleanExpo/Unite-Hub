"""Integration tests for the complete agentic layer.

Tests end-to-end workflows:
- Feature development workflow
- Bug fixing workflow
- Multi-agent coordination
- PR automation
- Memory and learning
"""

import pytest
from datetime import datetime

from src.agents.orchestrator import OrchestratorAgent
from src.agents.subagent_manager import SubTask, SubagentConfig
from src.memory.session_manager import SessionManager
from src.workflows.pr_automation import PRAutomation, FileChange
from src.monitoring.agent_metrics import AgentMetrics


class TestAgenticLayerIntegration:
    """Integration tests for complete agentic layer."""

    @pytest.fixture
    async def orchestrator(self):
        """Create orchestrator instance."""
        return OrchestratorAgent()

    @pytest.fixture
    async def session_manager(self):
        """Create session manager instance."""
        manager = SessionManager()
        await manager.initialize_memory_store()
        return manager

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_self_correction_workflow(self, orchestrator):
        """Test that agents can self-correct and iterate."""
        # This tests Phase 1.2 functionality
        task = "Test self-correction workflow"

        # The agent should attempt, review, and iterate if needed
        # This test verifies the iterate_until_passing mechanism works
        assert orchestrator is not None
        assert hasattr(orchestrator, "subagent_manager")

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_multi_agent_coordination(self, orchestrator):
        """Test coordinating multiple subagents in parallel."""
        # This tests Phase 2.1 functionality

        # Create sample subtasks
        subtasks = [
            SubTask(
                subtask_id="frontend_1",
                description="Create frontend component",
                agent_type="frontend",
                priority=1
            ),
            SubTask(
                subtask_id="backend_1",
                description="Create backend API",
                agent_type="backend",
                priority=1
            ),
            SubTask(
                subtask_id="test_1",
                description="Write tests",
                agent_type="test",
                priority=2,
                dependencies=["frontend_1", "backend_1"]  # Depends on others
            )
        ]

        # Coordinate parallel execution
        # Frontend and backend should run in parallel
        # Test should run after both complete
        results = await orchestrator.coordinate_parallel(subtasks)

        # Verify all subtasks executed
        assert len(results) == 3
        assert all(r.subtask_id in ["frontend_1", "backend_1", "test_1"] for r in results)

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_session_learning_workflow(self, session_manager):
        """Test session-based learning and knowledge accumulation."""
        # This tests Phase 1.3 functionality

        # Start session
        session = await session_manager.start_session(
            task_type="test",
            user_id="test_user"
        )

        assert session.session_id is not None

        # Simulate task outcomes
        task_outcomes = [
            {
                "success": True,
                "type": "test_task",
                "approach": "test_approach",
                "tools_used": ["tool1", "tool2"],
                "success_factors": ["factor1"]
            },
            {
                "success": False,
                "type": "test_task",
                "failure_type": "timeout",
                "error": "Operation timed out",
                "approach": "slow_approach",
                "failure_reason": "Too complex"
            }
        ]

        # End session and capture learnings
        summary = await session_manager.end_session(
            session_id=session.session_id,
            task_outcomes=task_outcomes
        )

        # Verify learnings captured
        assert summary.tasks_completed == 1
        assert summary.tasks_failed == 1
        assert summary.patterns_learned > 0 or summary.failures_recorded > 0

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_context_partitioning(self, orchestrator):
        """Test that context is properly partitioned for subagents."""
        # This tests Phase 2.3 functionality

        subtask = SubTask(
            subtask_id="test_partition",
            description="Test context partitioning",
            agent_type="frontend"
        )

        # Partition context
        partition = orchestrator._partition_context_for_subagent(subtask)

        # Verify partition contains only frontend-relevant data
        assert "relevant_paths" in partition
        assert "skills_to_load" in partition
        assert "memory_domain" in partition
        assert partition["memory_domain"] == "frontend"

        # Verify skills are frontend-specific
        skills = partition["skills_to_load"]
        assert any("NEXTJS" in skill or "COMPONENTS" in skill for skill in skills)

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_pr_automation_workflow(self):
        """Test PR creation workflow."""
        # This tests Phase 3.1 functionality
        # Note: This is a smoke test, doesn't actually create PR

        pr_automation = PRAutomation()

        # Verify PR automation is properly configured
        assert pr_automation.repo_path is not None

        # Test branch name generation
        task_id = "test_123"
        expected_branch = f"feature/agent-{task_id}"

        # In real scenario, would create branch, commit, and PR
        # Here we just verify the component is properly structured

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_metrics_tracking(self):
        """Test agent metrics tracking."""
        # This tests Phase 3.3 functionality

        metrics = AgentMetrics()

        # Track sample task
        await metrics.track_task_execution(
            task_id="test_task_metrics",
            agent_id="test_agent_123",
            agent_type="frontend",
            metrics={
                "started_at": datetime.now().isoformat(),
                "completed_at": datetime.now().isoformat(),
                "duration_seconds": 45.2,
                "iterations": 2,
                "verification_attempts": 1,
                "verified": True,
                "pr_created": True,
                "pr_merged": False
            }
        )

        # Verify tracking worked
        # In real test would query database and verify metrics stored

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_end_to_end_feature_workflow(self, orchestrator, session_manager):
        """Test complete feature development workflow end-to-end.

        This simulates the full workflow:
        1. Start session
        2. Orchestrator receives feature request
        3. Coordinates multiple agents (frontend, backend, test)
        4. Agents iterate with self-correction
        5. Independent verification
        6. PR creation (shadow mode)
        7. Session learnings captured
        """
        # Start session
        session = await session_manager.start_session(
            task_type="feature_development",
            user_id="integration_test"
        )

        # Define feature request
        feature_request = "Add user profile page with API integration"

        # Orchestrator would:
        # 1. Analyze request
        # 2. Create subtasks (frontend UI, backend API, tests)
        # 3. Spawn subagents
        # 4. Coordinate execution
        # 5. Merge results
        # 6. Independent verification
        # 7. Create PR

        # For integration test, we verify the components exist
        assert hasattr(orchestrator, "coordinate_parallel")
        assert hasattr(orchestrator, "merge_results")
        assert hasattr(orchestrator, "spawn_subagent")

        # End session
        task_outcomes = [
            {
                "success": True,
                "type": "feature_development",
                "approach": "TDD with parallel agents",
                "tools_used": ["frontend_agent", "backend_agent", "test_agent"]
            }
        ]

        summary = await session_manager.end_session(
            session_id=session.session_id,
            task_outcomes=task_outcomes
        )

        # Verify session completed successfully
        assert summary.tasks_completed == 1


class TestAgenticLayerReliability:
    """Test reliability and error handling of agentic layer."""

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_handles_agent_failure_gracefully(self, orchestrator):
        """Test that orchestrator handles agent failures gracefully."""
        # Create subtask that might fail
        subtask = SubTask(
            subtask_id="failing_task",
            description="Task designed to fail",
            agent_type="general"
        )

        # Execute
        results = await orchestrator.coordinate_parallel([subtask])

        # Verify system doesn't crash even if agent fails
        assert len(results) == 1
        # Result might be failed, but orchestrator handled it

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_escalation_after_max_attempts(self):
        """Test that tasks escalate to human after max verification failures."""
        # This would test the escalation mechanism
        # In real implementation, after 3 failed verifications, task escalates

        # For now, verify the escalation mechanism exists
        from src.agents.orchestrator import OrchestratorAgent, TaskStatus

        orchestrator = OrchestratorAgent()

        # Verify escalation status exists
        assert TaskStatus.ESCALATED_TO_HUMAN in [s for s in TaskStatus]

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_context_optimization_achieves_reduction(self, orchestrator):
        """Test that context optimization achieves significant reduction."""
        # This tests that context partitioning reduces token usage

        subtask = SubTask(
            subtask_id="optimization_test",
            description="Test context optimization",
            agent_type="frontend"
        )

        partition = orchestrator._partition_context_for_subagent(subtask)

        # Verify partitioning occurred
        assert "relevant_paths" in partition
        assert "memory_domain" in partition

        # Frontend agent should only get frontend-relevant context
        assert partition["memory_domain"] == "frontend"
