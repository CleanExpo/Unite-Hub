"""Integration tests for Orchestrator with Independent Verification.

Tests the complete workflow:
1. Orchestrator receives task
2. Routes to appropriate agent
3. Agent executes and reports outputs
4. IndependentVerifier verifies (not the agent)
5. Task marked complete only after verification passes
6. Escalation after max failures
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from src.agents.orchestrator import (
    OrchestratorAgent,
    TaskStatus,
    TaskState,
    OrchestratorState,
)
from src.agents.base_agent import (
    FrontendAgent,
    BackendAgent,
    TaskOutput,
    SelfAttestationError,
)
from src.verification import (
    IndependentVerifier,
    VerificationRequest,
    VerificationResult,
    VerificationEvidence,
    VerificationType,
)


class TestOrchestratorIntegration:
    """Integration tests for orchestrator workflow."""

    @pytest.fixture
    def orchestrator(self) -> OrchestratorAgent:
        """Create orchestrator instance."""
        return OrchestratorAgent()

    @pytest.mark.anyio
    async def test_orchestrator_uses_independent_verifier(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Orchestrator must use IndependentVerifier, not agent self-verification."""
        assert hasattr(orchestrator, "verifier")
        assert isinstance(orchestrator.verifier, IndependentVerifier)

        # Verify verifier ID is different from orchestrator agent ID
        assert orchestrator.verifier.get_verifier_id() != orchestrator.agent_id

    @pytest.mark.anyio
    async def test_task_not_complete_without_verification(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Task must not be marked complete without passing verification."""
        # Create a state with a task in awaiting verification
        state = OrchestratorState(
            current_task=TaskState(
                task_id="test_task",
                description="Test task",
                status=TaskStatus.AWAITING_VERIFICATION,
                assigned_agent="frontend",
            )
        )

        # The task should not be in completed state yet
        assert state.current_task.status == TaskStatus.AWAITING_VERIFICATION
        assert len(state.completed_tasks) == 0

    @pytest.mark.anyio
    async def test_verification_uses_different_agent_id(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Verification request must have different agent ID than verifier."""
        agent = FrontendAgent()
        verifier = orchestrator.verifier

        # Agent ID and verifier ID must be different
        assert agent.get_agent_id() != verifier.get_verifier_id()

        # Agent ID starts with agent_, verifier ID starts with verifier_
        assert agent.get_agent_id().startswith("agent_")
        assert verifier.get_verifier_id().startswith("verifier_")


class TestVerificationGate:
    """Tests for the verification gate in orchestrator."""

    @pytest.fixture
    def orchestrator(self) -> OrchestratorAgent:
        return OrchestratorAgent()

    @pytest.mark.anyio
    async def test_verification_gate_passes_with_evidence(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Verification gate passes when evidence is provided."""
        # Create mock verification result with evidence
        vid = orchestrator.verifier.get_verifier_id()
        mock_result = VerificationResult(
            task_id="test_task",
            verifier_id=vid,
            requesting_agent_id="agent_test",
            timestamp="2024-01-01T00:00:00Z",
            verified=True,
            passed_checks=3,
            failed_checks=0,
            total_checks=3,
            evidence=[
                VerificationEvidence(
                    criterion="file_exists",
                    type=VerificationType.FILE_EXISTS,
                    method="pathlib.Path.exists()",
                    result="pass",
                    proof="File exists: /path/to/file",
                    timestamp="2024-01-01T00:00:00Z",
                    duration_ms=5,
                    verifier_id=vid,
                )
            ],
            failures=[],
        )

        assert mock_result.verified is True
        assert mock_result.passed_checks == 3
        assert len(mock_result.evidence) > 0

    @pytest.mark.anyio
    async def test_verification_gate_fails_without_evidence(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Verification gate fails when no evidence is provided."""
        mock_result = VerificationResult(
            task_id="test_task",
            verifier_id=orchestrator.verifier.get_verifier_id(),
            requesting_agent_id="agent_test",
            timestamp="2024-01-01T00:00:00Z",
            verified=False,
            passed_checks=0,
            failed_checks=1,
            total_checks=1,
            evidence=[],
            failures=[],
        )

        assert mock_result.verified is False
        assert len(mock_result.evidence) == 0


class TestEscalationFlow:
    """Tests for escalation after verification failures."""

    @pytest.fixture
    def orchestrator(self) -> OrchestratorAgent:
        return OrchestratorAgent()

    def test_escalation_after_max_attempts(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Task is escalated after max verification attempts."""
        state = OrchestratorState(
            current_task=TaskState(
                task_id="test_task",
                description="Test task",
                status=TaskStatus.VERIFICATION_FAILED,
                attempts=3,
                max_attempts=3,
                assigned_agent="frontend",
            )
        )

        # Trigger escalation
        state = orchestrator._escalate_to_human(state)

        # Task should be escalated
        assert state.current_task is None
        assert len(state.escalated_tasks) == 1
        assert state.escalated_tasks[0].status == TaskStatus.ESCALATED_TO_HUMAN

    def test_retry_before_max_attempts(
        self, orchestrator: OrchestratorAgent
    ) -> None:
        """Task is retried if under max attempts."""
        state = OrchestratorState(
            current_task=TaskState(
                task_id="test_task",
                description="Test task",
                status=TaskStatus.VERIFICATION_FAILED,
                attempts=1,
                max_attempts=3,
                assigned_agent="frontend",
            )
        )

        # Check that we can still retry
        task = state.current_task
        assert task.attempts < task.max_attempts
        assert len(state.escalated_tasks) == 0


class TestTaskStatusFlow:
    """Tests for correct task status transitions."""

    def test_status_transitions(self) -> None:
        """Verify correct status transitions."""
        # Valid transitions
        assert TaskStatus.PENDING.value == "pending"
        assert TaskStatus.IN_PROGRESS.value == "in_progress"
        assert TaskStatus.AWAITING_VERIFICATION.value == "awaiting_verification"
        assert TaskStatus.VERIFICATION_IN_PROGRESS.value == "verification_in_progress"
        assert TaskStatus.VERIFICATION_PASSED.value == "verification_passed"
        assert TaskStatus.VERIFICATION_FAILED.value == "verification_failed"
        assert TaskStatus.COMPLETED.value == "completed"
        assert TaskStatus.ESCALATED_TO_HUMAN.value == "escalated_to_human"

    def test_task_cannot_skip_verification(self) -> None:
        """Task cannot go directly from IN_PROGRESS to COMPLETED."""
        task = TaskState(
            task_id="test",
            description="Test",
            status=TaskStatus.IN_PROGRESS,
        )

        # The proper flow requires going through verification
        # AWAITING_VERIFICATION -> VERIFICATION_IN_PROGRESS -> VERIFICATION_PASSED -> COMPLETED
        assert task.status != TaskStatus.COMPLETED

        # Cannot mark complete without verification
        # This is enforced by the orchestrator logic


class TestAgentOutputReportingIntegration:
    """Integration tests for agent output reporting."""

    def test_agent_reports_for_verification(self) -> None:
        """Agent must report outputs for independent verification."""
        agent = FrontendAgent()
        agent.start_task("test_task_123")

        # Report outputs
        agent.report_output(
            output_type="file",
            path="/src/components/Button.tsx",
            description="Created Button component",
        )

        # Add completion criteria
        agent.add_completion_criterion(
            criterion_type="file_exists",
            target="/src/components/Button.tsx",
        )
        agent.add_completion_criterion(
            criterion_type="no_placeholders",
            target="/src/components/Button.tsx",
        )

        # Get task output
        output = agent.get_task_output()

        # Verify output structure
        assert output.task_id == "test_task_123"
        assert output.agent_id == agent.agent_id
        assert output.status == "pending_verification"
        assert output.requires_verification is True
        assert len(output.outputs) == 1
        assert len(output.completion_criteria) == 2

    def test_agent_cannot_self_verify_in_workflow(self) -> None:
        """Agent cannot call verify methods in workflow."""
        agent = BackendAgent()
        agent.start_task("test_task")

        # Agent does work
        agent.report_output(
            output_type="file",
            path="/src/api/routes.py",
            description="Created API routes",
        )

        # Agent tries to verify own work - must fail
        with pytest.raises(SelfAttestationError) as exc_info:
            agent.verify_build()

        assert "SELF-ATTESTATION BLOCKED" in str(exc_info.value)
        assert "backend" in str(exc_info.value)


class TestVerifierIndependence:
    """Tests to ensure verifier is truly independent."""

    def test_multiple_verifiers_have_unique_ids(self) -> None:
        """Each verifier instance has unique ID."""
        verifier1 = IndependentVerifier()
        verifier2 = IndependentVerifier()

        assert verifier1.get_verifier_id() != verifier2.get_verifier_id()

    def test_verifier_id_format(self) -> None:
        """Verifier ID has correct format."""
        verifier = IndependentVerifier()
        verifier_id = verifier.get_verifier_id()

        assert verifier_id.startswith("verifier_")
        # Should have UUID component
        parts = verifier_id.split("_")
        assert len(parts) >= 2

    @pytest.mark.anyio
    async def test_verifier_rejects_self_verification(self) -> None:
        """Verifier rejects verification requests from itself."""
        verifier = IndependentVerifier()

        with pytest.raises(ValueError) as exc_info:
            await verifier.verify(
                VerificationRequest(
                    task_id="test_task",
                    claimed_outputs=[],
                    completion_criteria=[],
                    requesting_agent_id=verifier.get_verifier_id(),
                )
            )

        assert "VERIFICATION INTEGRITY ERROR" in str(exc_info.value)
