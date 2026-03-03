"""Tests for workflow execution state (state.py).

Covers:
- NodeStatus enum values
- NodeResult creation and defaults
- ExecutionState variable resolution
- ExecutionState config resolution (flat, nested, list)
"""

from uuid import uuid4

import pytest

from src.workflow.state import ExecutionState, NodeResult, NodeStatus

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def exec_state() -> ExecutionState:
    """Minimal ExecutionState with sample data."""
    return ExecutionState(
        execution_id=uuid4(),
        workflow_id=uuid4(),
        variables={"api_key": "sk-test", "threshold": 80},
        input_data={"query": "hello world", "user_id": "u123"},
        node_outputs={
            "node_a": {"score": 95, "label": "pass"},
            "node_b": "raw_string_output",
        },
    )


# ---------------------------------------------------------------------------
# NodeStatus
# ---------------------------------------------------------------------------

class TestNodeStatus:
    def test_enum_values(self):
        assert NodeStatus.PENDING == "pending"
        assert NodeStatus.RUNNING == "running"
        assert NodeStatus.COMPLETED == "completed"
        assert NodeStatus.FAILED == "failed"
        assert NodeStatus.SKIPPED == "skipped"

    def test_all_members(self):
        assert len(NodeStatus) == 5


# ---------------------------------------------------------------------------
# NodeResult
# ---------------------------------------------------------------------------

class TestNodeResult:
    def test_default_status_is_pending(self):
        result = NodeResult(node_id=uuid4(), node_type="action")
        assert result.status == NodeStatus.PENDING

    def test_default_collections_empty(self):
        result = NodeResult(node_id=uuid4(), node_type="action")
        assert result.input_data == {}
        assert result.output_data == {}

    def test_optional_fields_none(self):
        result = NodeResult(node_id=uuid4(), node_type="start")
        assert result.error_message is None
        assert result.duration_ms is None

    def test_full_result(self):
        nid = uuid4()
        result = NodeResult(
            node_id=nid,
            node_type="llm",
            status=NodeStatus.COMPLETED,
            input_data={"prompt": "hi"},
            output_data={"response": "hello"},
            error_message=None,
            duration_ms=120,
        )
        assert result.node_id == nid
        assert result.status == NodeStatus.COMPLETED
        assert result.duration_ms == 120


# ---------------------------------------------------------------------------
# ExecutionState — get/set node output
# ---------------------------------------------------------------------------

class TestExecutionStateOutputs:
    def test_get_existing_output(self, exec_state: ExecutionState):
        assert exec_state.get_node_output("node_a") == {"score": 95, "label": "pass"}

    def test_get_missing_output_returns_none(self, exec_state: ExecutionState):
        assert exec_state.get_node_output("nonexistent") is None

    def test_set_and_get_output(self, exec_state: ExecutionState):
        exec_state.set_node_output("node_c", {"value": 42})
        assert exec_state.get_node_output("node_c") == {"value": 42}

    def test_overwrite_output(self, exec_state: ExecutionState):
        exec_state.set_node_output("node_a", "overwritten")
        assert exec_state.get_node_output("node_a") == "overwritten"


# ---------------------------------------------------------------------------
# ExecutionState — resolve_variable
# ---------------------------------------------------------------------------

class TestResolveVariable:
    def test_input_variable(self, exec_state: ExecutionState):
        assert exec_state.resolve_variable("{{input.query}}") == "hello world"

    def test_input_missing_key(self, exec_state: ExecutionState):
        assert exec_state.resolve_variable("{{input.missing}}") is None

    def test_vars_variable(self, exec_state: ExecutionState):
        assert exec_state.resolve_variable("{{vars.api_key}}") == "sk-test"

    def test_vars_numeric(self, exec_state: ExecutionState):
        assert exec_state.resolve_variable("{{vars.threshold}}") == 80

    def test_node_output_dict_key(self, exec_state: ExecutionState):
        assert exec_state.resolve_variable("{{node_a.score}}") == 95

    def test_node_output_string(self, exec_state: ExecutionState):
        # When node output is a raw string, returning the string
        assert exec_state.resolve_variable("{{node_b.anything}}") == "raw_string_output"

    def test_single_token_checks_variables(self, exec_state: ExecutionState):
        assert exec_state.resolve_variable("{{api_key}}") == "sk-test"

    def test_single_token_falls_back_to_input(self, exec_state: ExecutionState):
        assert exec_state.resolve_variable("{{query}}") == "hello world"

    def test_single_token_unknown_returns_none(self, exec_state: ExecutionState):
        assert exec_state.resolve_variable("{{unknown_token}}") is None

    def test_non_template_passthrough(self, exec_state: ExecutionState):
        assert exec_state.resolve_variable("plain text") == "plain text"

    def test_whitespace_in_braces(self, exec_state: ExecutionState):
        assert exec_state.resolve_variable("{{ input.query }}") == "hello world"


# ---------------------------------------------------------------------------
# ExecutionState — resolve_config
# ---------------------------------------------------------------------------

class TestResolveConfig:
    def test_full_template_resolution(self, exec_state: ExecutionState):
        """resolve_config resolves values that are full {{...}} templates."""
        config = {"query": "{{input.query}}"}
        resolved = exec_state.resolve_config(config)
        assert resolved["query"] == "hello world"

    def test_mixed_string_passthrough(self, exec_state: ExecutionState):
        """resolve_config does NOT inline-replace mixed strings.

        Mixed strings like 'Search for {{input.query}}' are passed to
        resolve_variable which only handles full {{...}} wrappers.
        The node_handlers._resolve_string function does inline replacement.
        """
        config = {"prompt": "Search for {{input.query}}"}
        resolved = exec_state.resolve_config(config)
        # Mixed strings are passed through resolve_variable which returns them as-is
        # because the whole string doesn't start/end with {{ }}
        assert resolved["prompt"] == "Search for {{input.query}}"

    def test_nested_dict_resolution(self, exec_state: ExecutionState):
        config = {
            "headers": {
                "auth_token": "{{vars.api_key}}",
                "user": "{{input.user_id}}",
            }
        }
        resolved = exec_state.resolve_config(config)
        assert resolved["headers"]["auth_token"] == "sk-test"
        assert resolved["headers"]["user"] == "u123"

    def test_list_resolution(self, exec_state: ExecutionState):
        config = {
            "tags": ["{{input.query}}", "static", "{{vars.threshold}}"],
        }
        resolved = exec_state.resolve_config(config)
        assert resolved["tags"][0] == "hello world"
        assert resolved["tags"][1] == "static"
        assert resolved["tags"][2] == 80

    def test_non_string_passthrough(self, exec_state: ExecutionState):
        config = {"count": 42, "enabled": True, "ratio": 0.5}
        resolved = exec_state.resolve_config(config)
        assert resolved == config

    def test_full_template_in_nested(self, exec_state: ExecutionState):
        config = {
            "url": "{{input.user_id}}",
            "timeout": 30,
            "body": {"query": "{{input.query}}"},
        }
        resolved = exec_state.resolve_config(config)
        assert resolved["timeout"] == 30
        assert resolved["url"] == "u123"
        assert resolved["body"]["query"] == "hello world"

    def test_no_template_markers_unchanged(self, exec_state: ExecutionState):
        config = {"method": "GET", "retries": 3}
        resolved = exec_state.resolve_config(config)
        assert resolved == config
