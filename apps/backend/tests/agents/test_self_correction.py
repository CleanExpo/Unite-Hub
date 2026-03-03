"""Tests for self-correction and feedback loop functionality.

Tests Phase 1.2 enhancements:
- self_review() method
- collect_failure_evidence() method
- suggest_alternative_approach() method
- iterate_until_passing() method
"""

import pytest
from unittest.mock import AsyncMock, Mock
from src.agents.base_agent import BaseAgent


class TestSelfReview:
    """Test self-review functionality."""

    @pytest.fixture
    def agent(self):
        """Create a test agent."""

        class TestAgent(BaseAgent):
            async def execute(self, task_description, context=None):
                return {"result": "test"}

        return TestAgent(name="test", capabilities=["test"])

    @pytest.mark.asyncio
    async def test_self_review_empty_result(self, agent):
        """Test self-review rejects empty results."""
        review = await agent.self_review(None)

        assert not review["passed"]
        assert "Result is empty or None" in review["issues"]

    @pytest.mark.asyncio
    async def test_self_review_missing_outputs_fails(self, agent):
        """Test self-review fails when outputs are missing."""
        result = {
            "task_output": {
                "task_id": "test",
                "agent_id": agent.agent_id,
                "outputs": [],
                "completion_criteria": []
            }
        }

        review = await agent.self_review(result)

        assert not review["passed"]  # Should fail with missing outputs
        assert any("No outputs reported" in issue for issue in review["issues"])

    @pytest.mark.asyncio
    async def test_self_review_file_output_missing_path(self, agent):
        """Test self-review detects file outputs without paths."""
        result = {
            "task_output": {
                "task_id": "test",
                "agent_id": agent.agent_id,
                "outputs": [
                    {"type": "file", "description": "Some file"}
                    # Missing "path" field
                ],
                "completion_criteria": []
            }
        }

        review = await agent.self_review(result)

        assert not review["passed"]
        assert len(review["issues"]) > 0


class TestCollectFailureEvidence:
    """Test failure evidence collection."""

    @pytest.fixture
    def agent(self):
        """Create a test agent."""

        class TestAgent(BaseAgent):
            async def execute(self, task_description, context=None):
                return {"result": "test"}

        return TestAgent(name="test", capabilities=["test"])

    @pytest.mark.asyncio
    async def test_collect_evidence_with_exception(self, agent):
        """Test collecting evidence from exception."""
        agent.start_task("test_task_123")

        error = ValueError("Test error message")
        evidence = await agent.collect_failure_evidence(error)

        assert evidence["agent_id"] == agent.agent_id
        assert evidence["agent_name"] == "test"
        assert evidence["task_id"] == "test_task_123"
        assert evidence["failure_type"] == "ValueError"
        assert evidence["error_message"] == "Test error message"
        assert "stack_trace" in evidence

    @pytest.mark.asyncio
    async def test_collect_evidence_with_context(self, agent):
        """Test collecting evidence with additional context."""
        agent.start_task("test_task_456")

        context = {"attempt": 2, "previous_error": "Import failed"}
        evidence = await agent.collect_failure_evidence(None, context)

        assert evidence["context"] == context
        assert evidence["task_id"] == "test_task_456"


class TestSuggestAlternativeApproach:
    """Test alternative approach suggestions."""

    @pytest.fixture
    def agent(self):
        """Create a test agent."""

        class TestAgent(BaseAgent):
            async def execute(self, task_description, context=None):
                return {"result": "test"}

        return TestAgent(name="test", capabilities=["test"])

    @pytest.mark.asyncio
    async def test_suggest_for_file_not_found(self, agent):
        """Test suggestion for FileNotFoundError."""
        evidence = {
            "failure_type": "FileNotFoundError",
            "error_message": "File not found: /path/to/file"
        }

        suggestion = await agent.suggest_alternative_approach(evidence)

        assert len(suggestion["alternative_approaches"]) > 0
        assert any("file path" in a.lower() for a in suggestion["alternative_approaches"])

    @pytest.mark.asyncio
    async def test_suggest_for_timeout(self, agent):
        """Test suggestion for TimeoutError."""
        evidence = {
            "failure_type": "TimeoutError",
            "error_message": "Operation timed out"
        }

        suggestion = await agent.suggest_alternative_approach(evidence)

        assert len(suggestion["alternative_approaches"]) > 0
        assert any("timeout" in a.lower() for a in suggestion["alternative_approaches"])

    @pytest.mark.asyncio
    async def test_suggest_for_import_error(self, agent):
        """Test suggestion for import/module errors."""
        evidence = {
            "failure_type": "ImportError",
            "error_message": "Module not found: some_module"
        }

        suggestion = await agent.suggest_alternative_approach(evidence)

        assert len(suggestion["alternative_approaches"]) > 0
        assert any("import" in a.lower() for a in suggestion["alternative_approaches"])

    @pytest.mark.asyncio
    async def test_suggest_generic_for_unknown(self, agent):
        """Test generic suggestion for unknown errors."""
        evidence = {
            "failure_type": "UnknownError",
            "error_message": "Something went wrong"
        }

        suggestion = await agent.suggest_alternative_approach(evidence)

        assert len(suggestion["alternative_approaches"]) > 0
        assert "reasoning" in suggestion


class TestIterateUntilPassing:
    """Test iteration loop functionality."""

    @pytest.mark.asyncio
    async def test_iterate_success_first_attempt(self):
        """Test successful execution on first attempt."""

        class SuccessfulAgent(BaseAgent):
            def __init__(self):
                super().__init__(name="successful", capabilities=["test"])
                self.execute_count = 0

            async def execute(self, task_description, context=None):
                self.execute_count += 1
                self.start_task(f"task_{self.execute_count}")
                return {
                    "result": "success",
                    "task_output": {
                        "task_id": f"task_{self.execute_count}",
                        "agent_id": self.agent_id,
                        "outputs": [{"type": "file", "path": "/test/file.py"}],
                        "completion_criteria": [{"type": "file_exists"}]
                    }
                }

        agent = SuccessfulAgent()
        result, success = await agent.iterate_until_passing("Test task")

        assert success
        assert agent.execute_count == 1  # Only one attempt needed

    @pytest.mark.asyncio
    async def test_iterate_success_after_retry(self):
        """Test successful execution after one failure."""

        class RetryAgent(BaseAgent):
            def __init__(self):
                super().__init__(name="retry", capabilities=["test"])
                self.execute_count = 0

            async def execute(self, task_description, context=None):
                self.execute_count += 1
                self.start_task(f"task_{self.execute_count}")

                # Fail first attempt, succeed second
                if self.execute_count == 1:
                    return {
                        "result": "incomplete",
                        "task_output": {
                            "task_id": f"task_{self.execute_count}",
                            "agent_id": self.agent_id,
                            "outputs": [],  # No outputs - will fail review
                            "completion_criteria": []
                        }
                    }
                else:
                    return {
                        "result": "success",
                        "task_output": {
                            "task_id": f"task_{self.execute_count}",
                            "agent_id": self.agent_id,
                            "outputs": [{"type": "file", "path": "/test/file.py"}],
                            "completion_criteria": [{"type": "file_exists"}]
                        }
                    }

        agent = RetryAgent()
        result, success = await agent.iterate_until_passing("Test task", max_attempts=3)

        assert success
        assert agent.execute_count == 2  # One retry

    @pytest.mark.asyncio
    async def test_iterate_max_attempts_reached(self):
        """Test max attempts reached without success."""

        class FailingAgent(BaseAgent):
            def __init__(self):
                super().__init__(name="failing", capabilities=["test"])
                self.execute_count = 0

            async def execute(self, task_description, context=None):
                self.execute_count += 1
                self.start_task(f"task_{self.execute_count}")
                # Always fail review (no outputs)
                return {
                    "result": "incomplete",
                    "task_output": {
                        "task_id": f"task_{self.execute_count}",
                        "agent_id": self.agent_id,
                        "outputs": [],
                        "completion_criteria": []
                    }
                }

        agent = FailingAgent()
        result, success = await agent.iterate_until_passing("Test task", max_attempts=3)

        assert not success
        assert agent.execute_count == 3  # All attempts used

    @pytest.mark.asyncio
    async def test_iterate_with_context_accumulation(self):
        """Test that context accumulates between iterations."""

        class ContextAwareAgent(BaseAgent):
            def __init__(self):
                super().__init__(name="context_aware", capabilities=["test"])
                self.execute_count = 0
                self.received_contexts = []

            async def execute(self, task_description, context=None):
                self.execute_count += 1
                self.start_task(f"task_{self.execute_count}")
                self.received_contexts.append(context)

                # Succeed on second attempt
                if self.execute_count >= 2:
                    return {
                        "result": "success",
                        "task_output": {
                            "task_id": f"task_{self.execute_count}",
                            "agent_id": self.agent_id,
                            "outputs": [{"type": "file", "path": "/test/file.py"}],
                            "completion_criteria": [{"type": "file_exists"}]
                        }
                    }
                else:
                    return {
                        "result": "incomplete",
                        "task_output": {
                            "task_id": f"task_{self.execute_count}",
                            "agent_id": self.agent_id,
                            "outputs": [],
                            "completion_criteria": []
                        }
                    }

        agent = ContextAwareAgent()
        result, success = await agent.iterate_until_passing("Test task", max_attempts=5)

        assert success
        assert agent.execute_count == 2  # First attempt fails, second succeeds

        # Verify context accumulated
        assert agent.received_contexts[0] is None  # First attempt
        assert agent.received_contexts[1] is not None  # Second attempt has context
        assert "previous_attempt" in agent.received_contexts[1]
        assert agent.received_contexts[1]["previous_attempt"] == 1
