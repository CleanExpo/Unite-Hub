"""Tests for the Independent Verification System.

These tests verify that:
1. Self-attestation is blocked (agents cannot verify their own work)
2. IndependentVerifier performs actual verification
3. Evidence is collected for all verification claims
4. Verification fails without proper evidence
"""

import pytest
import tempfile
import os
from pathlib import Path

from src.agents.base_agent import (
    BaseAgent,
    FrontendAgent,
    BackendAgent,
    SelfAttestationError,
    TaskOutput,
)
from src.verification import (
    IndependentVerifier,
    VerificationRequest,
    VerificationResult,
    CompletionCriterion,
    ClaimedOutput,
    VerificationType,
)


# ============================================================================
# Self-Attestation Prevention Tests
# ============================================================================


class TestSelfAttestationPrevention:
    """Test that agents cannot verify their own work."""

    def test_verify_build_raises_error(self) -> None:
        """verify_build() must raise SelfAttestationError."""
        agent = FrontendAgent()
        with pytest.raises(SelfAttestationError) as exc_info:
            agent.verify_build()

        assert "SELF-ATTESTATION BLOCKED" in str(exc_info.value)
        assert "frontend" in str(exc_info.value)
        assert "verify_build" in str(exc_info.value)

    def test_verify_tests_raises_error(self) -> None:
        """verify_tests() must raise SelfAttestationError."""
        agent = BackendAgent()
        with pytest.raises(SelfAttestationError) as exc_info:
            agent.verify_tests()

        assert "SELF-ATTESTATION BLOCKED" in str(exc_info.value)
        assert "backend" in str(exc_info.value)
        assert "verify_tests" in str(exc_info.value)

    def test_verify_functionality_raises_error(self) -> None:
        """verify_functionality() must raise SelfAttestationError."""
        agent = FrontendAgent()
        with pytest.raises(SelfAttestationError) as exc_info:
            agent.verify_functionality({"result": "test"})

        assert "SELF-ATTESTATION BLOCKED" in str(exc_info.value)
        assert "verify_functionality" in str(exc_info.value)

    def test_all_agent_types_block_self_attestation(self) -> None:
        """All agent types must block self-attestation."""
        from src.agents.base_agent import (
            FrontendAgent,
            BackendAgent,
            DatabaseAgent,
            DevOpsAgent,
            GeneralAgent,
        )

        agents = [
            FrontendAgent(),
            BackendAgent(),
            DatabaseAgent(),
            DevOpsAgent(),
            GeneralAgent(),
        ]

        for agent in agents:
            with pytest.raises(SelfAttestationError):
                agent.verify_build()
            with pytest.raises(SelfAttestationError):
                agent.verify_tests()
            with pytest.raises(SelfAttestationError):
                agent.verify_functionality({})


# ============================================================================
# Agent Output Reporting Tests
# ============================================================================


class TestAgentOutputReporting:
    """Test that agents properly report outputs for verification."""

    def test_agent_can_start_task(self) -> None:
        """Agent can start tracking a task."""
        agent = FrontendAgent()
        agent.start_task("test_task_123")

        output = agent.get_task_output()
        assert output.task_id == "test_task_123"
        assert output.agent_id == agent.agent_id

    def test_agent_can_report_output(self) -> None:
        """Agent can report outputs."""
        agent = FrontendAgent()
        agent.start_task("test_task")

        agent.report_output(
            output_type="file",
            path="/src/components/Button.tsx",
            description="Created Button component",
        )

        output = agent.get_task_output()
        assert len(output.outputs) == 1
        assert output.outputs[0]["type"] == "file"
        assert output.outputs[0]["path"] == "/src/components/Button.tsx"

    def test_agent_can_add_completion_criteria(self) -> None:
        """Agent can add completion criteria."""
        agent = BackendAgent()
        agent.start_task("test_task")

        agent.add_completion_criterion(
            criterion_type="file_exists",
            target="/src/api/routes.py",
        )
        agent.add_completion_criterion(
            criterion_type="tests_pass",
            target="pytest tests/",
            threshold=100,
        )

        output = agent.get_task_output()
        assert len(output.completion_criteria) == 2
        assert output.completion_criteria[0]["type"] == "file_exists"
        assert output.completion_criteria[1]["threshold"] == 100

    def test_task_output_requires_verification(self) -> None:
        """Task output always requires verification."""
        agent = FrontendAgent()
        agent.start_task("test_task")

        output = agent.get_task_output()
        assert output.requires_verification is True
        assert output.status == "pending_verification"


# ============================================================================
# Independent Verifier Tests
# ============================================================================


class TestIndependentVerifier:
    """Test IndependentVerifier functionality."""

    def test_verifier_has_unique_id(self) -> None:
        """Verifier must have a unique ID."""
        verifier = IndependentVerifier()
        verifier_id = verifier.get_verifier_id()

        assert verifier_id is not None
        assert verifier_id.startswith("verifier_")
        assert len(verifier_id) > 20

    def test_verifier_id_differs_from_agent_id(self) -> None:
        """Verifier ID must differ from agent IDs."""
        agent = FrontendAgent()
        verifier = IndependentVerifier()

        assert agent.get_agent_id() != verifier.get_verifier_id()
        assert not agent.get_agent_id().startswith("verifier_")
        assert not verifier.get_verifier_id().startswith("agent_")


class TestFileVerification:
    """Test file-based verification."""

    @pytest.mark.anyio
    async def test_file_exists_verification_passes(self) -> None:
        """FILE_EXISTS passes for existing files."""
        verifier = IndependentVerifier()

        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as f:
            f.write("test content")
            temp_path = f.name

        try:
            result = await verifier.verify(
                VerificationRequest(
                    task_id="test_task",
                    claimed_outputs=[],
                    completion_criteria=[
                        CompletionCriterion(
                            type=VerificationType.FILE_EXISTS,
                            target=temp_path,
                        )
                    ],
                    requesting_agent_id="agent_test_123",
                )
            )

            assert result.verified is True
            assert result.passed_checks == 1
            assert result.failed_checks == 0
            assert len(result.evidence) == 1
        finally:
            os.unlink(temp_path)

    @pytest.mark.anyio
    async def test_file_exists_verification_fails_for_missing(self) -> None:
        """FILE_EXISTS fails for non-existent files."""
        verifier = IndependentVerifier()

        result = await verifier.verify(
            VerificationRequest(
                task_id="test_task",
                claimed_outputs=[],
                completion_criteria=[
                    CompletionCriterion(
                        type=VerificationType.FILE_EXISTS,
                        target="/nonexistent/file/path.txt",
                    )
                ],
                requesting_agent_id="agent_test_123",
            )
        )

        assert result.verified is False
        assert result.failed_checks == 1
        assert len(result.failures) == 1
        assert "does not exist" in result.failures[0].reason.lower()

    @pytest.mark.anyio
    async def test_file_not_empty_verification(self) -> None:
        """FILE_NOT_EMPTY verifies file has content."""
        verifier = IndependentVerifier()

        # Create non-empty file
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as f:
            f.write("some content here")
            non_empty_path = f.name

        # Create empty file
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as f:
            empty_path = f.name

        try:
            # Test non-empty file passes
            result = await verifier.verify(
                VerificationRequest(
                    task_id="test_task",
                    claimed_outputs=[],
                    completion_criteria=[
                        CompletionCriterion(
                            type=VerificationType.FILE_NOT_EMPTY,
                            target=non_empty_path,
                        )
                    ],
                    requesting_agent_id="agent_test_123",
                )
            )
            assert result.verified is True

            # Test empty file fails
            result = await verifier.verify(
                VerificationRequest(
                    task_id="test_task_2",
                    claimed_outputs=[],
                    completion_criteria=[
                        CompletionCriterion(
                            type=VerificationType.FILE_NOT_EMPTY,
                            target=empty_path,
                        )
                    ],
                    requesting_agent_id="agent_test_123",
                )
            )
            assert result.verified is False
        finally:
            os.unlink(non_empty_path)
            os.unlink(empty_path)


class TestPlaceholderDetection:
    """Test placeholder detection verification."""

    @pytest.mark.anyio
    async def test_no_placeholders_passes_clean_file(self) -> None:
        """NO_PLACEHOLDERS passes for clean files."""
        verifier = IndependentVerifier()

        with tempfile.NamedTemporaryFile(
            mode="w", delete=False, suffix=".py"
        ) as f:
            f.write(
                '''
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b
'''
            )
            temp_path = f.name

        try:
            result = await verifier.verify(
                VerificationRequest(
                    task_id="test_task",
                    claimed_outputs=[],
                    completion_criteria=[
                        CompletionCriterion(
                            type=VerificationType.NO_PLACEHOLDERS,
                            target=temp_path,
                        )
                    ],
                    requesting_agent_id="agent_test_123",
                )
            )

            assert result.verified is True
        finally:
            os.unlink(temp_path)

    @pytest.mark.anyio
    async def test_no_placeholders_fails_with_todo(self) -> None:
        """NO_PLACEHOLDERS fails when TODO is present."""
        verifier = IndependentVerifier()

        with tempfile.NamedTemporaryFile(
            mode="w", delete=False, suffix=".py"
        ) as f:
            f.write(
                '''
def add(a: int, b: int) -> int:
    # TODO: Implement this properly
    pass
'''
            )
            temp_path = f.name

        try:
            result = await verifier.verify(
                VerificationRequest(
                    task_id="test_task",
                    claimed_outputs=[],
                    completion_criteria=[
                        CompletionCriterion(
                            type=VerificationType.NO_PLACEHOLDERS,
                            target=temp_path,
                        )
                    ],
                    requesting_agent_id="agent_test_123",
                )
            )

            assert result.verified is False
            assert len(result.failures) == 1
            assert "placeholder" in result.failures[0].reason.lower()
        finally:
            os.unlink(temp_path)

    @pytest.mark.anyio
    async def test_no_placeholders_fails_with_not_implemented(self) -> None:
        """NO_PLACEHOLDERS fails when NotImplementedError is present."""
        verifier = IndependentVerifier()

        with tempfile.NamedTemporaryFile(
            mode="w", delete=False, suffix=".py"
        ) as f:
            f.write(
                '''
def add(a: int, b: int) -> int:
    raise NotImplementedError("Not done yet")
'''
            )
            temp_path = f.name

        try:
            result = await verifier.verify(
                VerificationRequest(
                    task_id="test_task",
                    claimed_outputs=[],
                    completion_criteria=[
                        CompletionCriterion(
                            type=VerificationType.NO_PLACEHOLDERS,
                            target=temp_path,
                        )
                    ],
                    requesting_agent_id="agent_test_123",
                )
            )

            assert result.verified is False
        finally:
            os.unlink(temp_path)


class TestEvidenceCollection:
    """Test that evidence is properly collected."""

    @pytest.mark.anyio
    async def test_evidence_includes_verifier_id(self) -> None:
        """Evidence must include verifier ID."""
        verifier = IndependentVerifier()

        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as f:
            f.write("test")
            temp_path = f.name

        try:
            result = await verifier.verify(
                VerificationRequest(
                    task_id="test_task",
                    claimed_outputs=[],
                    completion_criteria=[
                        CompletionCriterion(
                            type=VerificationType.FILE_EXISTS,
                            target=temp_path,
                        )
                    ],
                    requesting_agent_id="agent_test_123",
                )
            )

            assert result.verifier_id == verifier.get_verifier_id()
            for evidence in result.evidence:
                assert evidence.verifier_id == verifier.get_verifier_id()
        finally:
            os.unlink(temp_path)

    @pytest.mark.anyio
    async def test_evidence_has_timestamp(self) -> None:
        """Evidence must have timestamp."""
        verifier = IndependentVerifier()

        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as f:
            f.write("test")
            temp_path = f.name

        try:
            result = await verifier.verify(
                VerificationRequest(
                    task_id="test_task",
                    claimed_outputs=[],
                    completion_criteria=[
                        CompletionCriterion(
                            type=VerificationType.FILE_EXISTS,
                            target=temp_path,
                        )
                    ],
                    requesting_agent_id="agent_test_123",
                )
            )

            assert result.timestamp is not None
            for evidence in result.evidence:
                assert evidence.timestamp is not None
        finally:
            os.unlink(temp_path)


class TestVerificationIntegrity:
    """Test verification integrity checks."""

    @pytest.mark.anyio
    async def test_verifier_cannot_verify_itself(self) -> None:
        """Verifier must reject requests from itself."""
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

    @pytest.mark.anyio
    async def test_verification_requires_different_agent(self) -> None:
        """Verification must be from different agent."""
        verifier = IndependentVerifier()
        agent = FrontendAgent()

        # This should work - different agent
        result = await verifier.verify(
            VerificationRequest(
                task_id="test_task",
                claimed_outputs=[],
                completion_criteria=[],
                requesting_agent_id=agent.get_agent_id(),
            )
        )

        assert result.verifier_id != agent.get_agent_id()
