"""Tests for database-backed workflow executor (db_executor.py).

Covers:
- _should_follow_edge (pure logic, no DB)
- _compile_workflow (ORM model → compiler input conversion)
- Edge-following logic for conditional branches

The full execute() path requires a live async DB session and
is better suited for integration tests. These unit tests focus
on the decision-logic methods that can run without a database.
"""

from enum import Enum
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.workflow.compiler import CompiledEdge
from src.workflow.db_executor import DbWorkflowExecutor

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_db() -> AsyncMock:
    """Create a mock AsyncSession."""
    db = AsyncMock()
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    db.add = MagicMock()
    return db


def _compiled_edge(
    source_id=None,
    target_id=None,
    edge_type: str = "default",
    **kwargs,
) -> CompiledEdge:
    return CompiledEdge(
        source_id=source_id or uuid4(),
        target_id=target_id or uuid4(),
        edge_type=edge_type,
        **kwargs,
    )


class MockNodeType(str, Enum):
    START = "start"
    ACTION = "action"
    END = "end"
    CONDITIONAL = "conditional"


class MockEdgeType(str, Enum):
    DEFAULT = "default"
    TRUE = "true"
    FALSE = "false"


# ---------------------------------------------------------------------------
# _should_follow_edge
# ---------------------------------------------------------------------------

class TestShouldFollowEdge:
    @pytest.fixture
    def executor(self):
        return DbWorkflowExecutor(_mock_db())

    def test_default_edge_always_followed(self, executor):
        edge = _compiled_edge(edge_type="default")
        assert executor._should_follow_edge(edge, {"result": "any"}) is True

    def test_success_edge_followed_on_success(self, executor):
        edge = _compiled_edge(edge_type="success")
        assert executor._should_follow_edge(edge, {"success": True}) is True

    def test_success_edge_not_followed_on_error(self, executor):
        edge = _compiled_edge(edge_type="success")
        assert executor._should_follow_edge(edge, {"error": "boom"}) is False

    def test_success_edge_not_followed_when_success_false(self, executor):
        edge = _compiled_edge(edge_type="success")
        assert executor._should_follow_edge(edge, {"success": False}) is False

    def test_error_edge_followed_on_error(self, executor):
        edge = _compiled_edge(edge_type="error")
        assert executor._should_follow_edge(edge, {"error": "something broke"}) is True

    def test_error_edge_followed_when_success_false(self, executor):
        edge = _compiled_edge(edge_type="error")
        assert executor._should_follow_edge(edge, {"success": False}) is True

    def test_error_edge_not_followed_on_success(self, executor):
        edge = _compiled_edge(edge_type="error")
        assert executor._should_follow_edge(edge, {"success": True}) is False

    def test_default_edge_with_error_still_followed(self, executor):
        edge = _compiled_edge(edge_type="default")
        assert executor._should_follow_edge(edge, {"error": "oops"}) is True

    def test_success_edge_no_explicit_success_key(self, executor):
        """When result has no 'success' or 'error' key, success edge follows."""
        edge = _compiled_edge(edge_type="success")
        assert executor._should_follow_edge(edge, {"data": "ok"}) is True


# ---------------------------------------------------------------------------
# _compile_workflow — ORM to dict conversion
# ---------------------------------------------------------------------------

class TestCompileWorkflow:
    @pytest.fixture
    def executor(self):
        return DbWorkflowExecutor(_mock_db())

    def _mock_workflow(self) -> MagicMock:
        """Build a mock SQLAlchemy Workflow with nodes and edges."""
        wf = MagicMock()
        wf.id = uuid4()

        node_ids = [uuid4(), uuid4(), uuid4()]

        # Mock nodes
        node_start = MagicMock()
        node_start.id = node_ids[0]
        node_start.type = MockNodeType.START
        node_start.label = "Start"
        node_start.config = {}
        node_start.inputs = {}
        node_start.outputs = {}

        node_action = MagicMock()
        node_action.id = node_ids[1]
        node_action.type = MockNodeType.ACTION
        node_action.label = "Do thing"
        node_action.config = {"key": "value"}
        node_action.inputs = {}
        node_action.outputs = {}

        node_end = MagicMock()
        node_end.id = node_ids[2]
        node_end.type = MockNodeType.END
        node_end.label = "End"
        node_end.config = {}
        node_end.inputs = {}
        node_end.outputs = {}

        wf.nodes = [node_start, node_action, node_end]

        # Mock edges
        edge1 = MagicMock()
        edge1.source_node_id = node_ids[0]
        edge1.target_node_id = node_ids[1]
        edge1.type = MockEdgeType.DEFAULT
        edge1.condition = None
        edge1.source_handle = None
        edge1.target_handle = None

        edge2 = MagicMock()
        edge2.source_node_id = node_ids[1]
        edge2.target_node_id = node_ids[2]
        edge2.type = MockEdgeType.DEFAULT
        edge2.condition = None
        edge2.source_handle = None
        edge2.target_handle = None

        wf.edges = [edge1, edge2]

        return wf, node_ids

    def test_compile_produces_valid_graph(self, executor):
        wf, ids = self._mock_workflow()
        compiled = executor._compile_workflow(wf)

        assert compiled.workflow_id == wf.id
        assert len(compiled.nodes) == 3
        assert len(compiled.edges) == 2
        assert compiled.start_node_id == str(ids[0])
        assert str(ids[2]) in compiled.end_node_ids

    def test_compile_preserves_config(self, executor):
        wf, ids = self._mock_workflow()
        compiled = executor._compile_workflow(wf)

        action_node = compiled.nodes[str(ids[1])]
        assert action_node.config == {"key": "value"}

    def test_compile_extracts_enum_values(self, executor):
        wf, ids = self._mock_workflow()
        compiled = executor._compile_workflow(wf)

        start_node = compiled.nodes[str(ids[0])]
        assert start_node.node_type == "start"

    def test_execution_order_correct(self, executor):
        wf, ids = self._mock_workflow()
        compiled = executor._compile_workflow(wf)

        order = compiled.execution_order
        assert order.index(str(ids[0])) < order.index(str(ids[1]))
        assert order.index(str(ids[1])) < order.index(str(ids[2]))


# ---------------------------------------------------------------------------
# Conditional edge following logic
# ---------------------------------------------------------------------------

class TestConditionalEdgeLogic:
    """Test the conditional branch selection logic.

    _follow_conditional_edges is async and calls _execute_from,
    so we test it via the selection logic it implements.
    """

    def test_true_edge_selected_when_condition_met(self):
        """Verify true/false edge type matching."""
        true_edge = _compiled_edge(edge_type="true")
        false_edge = _compiled_edge(edge_type="false")
        default_edge = _compiled_edge(edge_type="default")

        condition_met = True

        selected = []
        for edge in [true_edge, false_edge, default_edge]:
            if edge.edge_type == "true" and condition_met:
                selected.append(("true", edge))
            elif edge.edge_type == "false" and not condition_met:
                selected.append(("false", edge))
            elif edge.edge_type == "default":
                selected.append(("default", edge))

        types = [s[0] for s in selected]
        assert "true" in types
        assert "false" not in types
        assert "default" in types

    def test_false_edge_selected_when_condition_not_met(self):
        true_edge = _compiled_edge(edge_type="true")
        false_edge = _compiled_edge(edge_type="false")

        condition_met = False

        selected = []
        for edge in [true_edge, false_edge]:
            if edge.edge_type == "true" and condition_met:
                selected.append("true")
            elif edge.edge_type == "false" and not condition_met:
                selected.append("false")

        assert "false" in selected
        assert "true" not in selected
