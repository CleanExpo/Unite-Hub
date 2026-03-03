"""Tests for workflow graph compiler (compiler.py).

Covers:
- Successful compilation of linear workflows
- Start/end node validation
- Invalid edge references
- Cycle detection
- Loop nodes (allowed back-edges)
- Unreachable node handling
- Topological execution order
- Adjacency list construction
"""

from uuid import uuid4

import pytest

from src.workflow.compiler import (
    CompilationError,
    CompiledWorkflow,
    WorkflowCompiler,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _node(nid: str, node_type: str, label: str | None = None) -> dict:
    """Create a node dict for the compiler."""
    return {
        "id": nid if "-" in nid else str(uuid4()),  # use passed UUID strings
        "type": node_type,
        "label": label or node_type.capitalize(),
        "config": {},
        "inputs": {},
        "outputs": {},
    }


def _edge(source: str, target: str, edge_type: str = "default", **kwargs) -> dict:
    """Create an edge dict for the compiler."""
    return {
        "source_node_id": source,
        "target_node_id": target,
        "type": edge_type,
        **kwargs,
    }


def _make_ids(n: int) -> list[str]:
    """Generate n UUID strings."""
    return [str(uuid4()) for _ in range(n)]


@pytest.fixture
def compiler() -> WorkflowCompiler:
    return WorkflowCompiler()


@pytest.fixture
def workflow_id():
    return uuid4()


# ---------------------------------------------------------------------------
# Successful compilation
# ---------------------------------------------------------------------------

class TestSuccessfulCompilation:
    def test_linear_workflow(self, compiler: WorkflowCompiler, workflow_id):
        """start -> action -> end compiles with correct order."""
        ids = _make_ids(3)
        nodes = [
            {"id": ids[0], "type": "start", "label": "Begin"},
            {"id": ids[1], "type": "action", "label": "Do stuff"},
            {"id": ids[2], "type": "end", "label": "Finish"},
        ]
        edges = [
            _edge(ids[0], ids[1]),
            _edge(ids[1], ids[2]),
        ]

        result = compiler.compile(workflow_id, nodes, edges)

        assert isinstance(result, CompiledWorkflow)
        assert result.workflow_id == workflow_id
        assert result.start_node_id == ids[0]
        assert ids[2] in result.end_node_ids
        assert len(result.execution_order) == 3
        # Topological: start before action, action before end
        order = result.execution_order
        assert order.index(ids[0]) < order.index(ids[1])
        assert order.index(ids[1]) < order.index(ids[2])

    def test_branching_workflow(self, compiler: WorkflowCompiler, workflow_id):
        """start -> conditional -> (true_branch | false_branch) -> end."""
        ids = _make_ids(5)
        nodes = [
            {"id": ids[0], "type": "start", "label": "Start"},
            {"id": ids[1], "type": "conditional", "label": "Check"},
            {"id": ids[2], "type": "action", "label": "True path"},
            {"id": ids[3], "type": "action", "label": "False path"},
            {"id": ids[4], "type": "end", "label": "End"},
        ]
        edges = [
            _edge(ids[0], ids[1]),
            _edge(ids[1], ids[2], "true"),
            _edge(ids[1], ids[3], "false"),
            _edge(ids[2], ids[4]),
            _edge(ids[3], ids[4]),
        ]

        result = compiler.compile(workflow_id, nodes, edges)

        assert result.start_node_id == ids[0]
        assert len(result.execution_order) == 5
        # Start should be first
        assert result.execution_order[0] == ids[0]

    def test_trigger_as_start(self, compiler: WorkflowCompiler, workflow_id):
        """A 'trigger' node acts as a valid start node."""
        ids = _make_ids(2)
        nodes = [
            {"id": ids[0], "type": "trigger", "label": "Trigger"},
            {"id": ids[1], "type": "output", "label": "Output"},
        ]
        edges = [_edge(ids[0], ids[1])]

        result = compiler.compile(workflow_id, nodes, edges)

        assert result.start_node_id == ids[0]
        assert ids[1] in result.end_node_ids

    def test_adjacency_lists_populated(self, compiler: WorkflowCompiler, workflow_id):
        """Adjacency and reverse adjacency are correctly built."""
        ids = _make_ids(3)
        nodes = [
            {"id": ids[0], "type": "start", "label": "Start"},
            {"id": ids[1], "type": "action", "label": "Action"},
            {"id": ids[2], "type": "end", "label": "End"},
        ]
        edges = [_edge(ids[0], ids[1]), _edge(ids[1], ids[2])]

        result = compiler.compile(workflow_id, nodes, edges)

        assert ids[0] in result.adjacency
        assert len(result.adjacency[ids[0]]) == 1
        assert ids[1] in result.reverse_adjacency
        assert len(result.reverse_adjacency[ids[1]]) == 1


# ---------------------------------------------------------------------------
# Validation errors
# ---------------------------------------------------------------------------

class TestCompilationErrors:
    def test_no_nodes_raises(self, compiler: WorkflowCompiler, workflow_id):
        with pytest.raises(CompilationError, match="no nodes"):
            compiler.compile(workflow_id, [], [])

    def test_no_start_node_raises(self, compiler: WorkflowCompiler, workflow_id):
        ids = _make_ids(2)
        nodes = [
            {"id": ids[0], "type": "action", "label": "Action"},
            {"id": ids[1], "type": "end", "label": "End"},
        ]
        edges = [_edge(ids[0], ids[1])]

        with pytest.raises(CompilationError) as exc_info:
            compiler.compile(workflow_id, nodes, edges)
        assert "start" in str(exc_info.value.errors).lower()

    def test_multiple_start_nodes_raises(self, compiler: WorkflowCompiler, workflow_id):
        ids = _make_ids(3)
        nodes = [
            {"id": ids[0], "type": "start", "label": "Start 1"},
            {"id": ids[1], "type": "start", "label": "Start 2"},
            {"id": ids[2], "type": "end", "label": "End"},
        ]
        edges = [_edge(ids[0], ids[2]), _edge(ids[1], ids[2])]

        with pytest.raises(CompilationError) as exc_info:
            compiler.compile(workflow_id, nodes, edges)
        assert "2 start nodes" in str(exc_info.value.errors).lower()

    def test_no_end_node_raises(self, compiler: WorkflowCompiler, workflow_id):
        ids = _make_ids(2)
        nodes = [
            {"id": ids[0], "type": "start", "label": "Start"},
            {"id": ids[1], "type": "action", "label": "Action"},
        ]
        edges = [_edge(ids[0], ids[1])]

        with pytest.raises(CompilationError) as exc_info:
            compiler.compile(workflow_id, nodes, edges)
        assert "end" in str(exc_info.value.errors).lower()

    def test_invalid_edge_source_raises(self, compiler: WorkflowCompiler, workflow_id):
        """Edges referencing unknown source nodes cause CompilationError."""
        ids = _make_ids(2)
        fake_source = str(uuid4())
        nodes = [
            {"id": ids[0], "type": "start", "label": "Start"},
            {"id": ids[1], "type": "end", "label": "End"},
        ]
        edges = [
            _edge(ids[0], ids[1]),
            _edge(fake_source, ids[1]),  # bad source
        ]

        with pytest.raises(CompilationError) as exc_info:
            compiler.compile(workflow_id, nodes, edges)
        assert "unknown source" in str(exc_info.value.errors).lower()

    def test_invalid_edge_target_raises(self, compiler: WorkflowCompiler, workflow_id):
        """Edges referencing unknown target nodes cause CompilationError."""
        ids = _make_ids(2)
        fake_target = str(uuid4())
        nodes = [
            {"id": ids[0], "type": "start", "label": "Start"},
            {"id": ids[1], "type": "end", "label": "End"},
        ]
        edges = [
            _edge(ids[0], ids[1]),
            _edge(ids[0], fake_target),  # bad target
        ]

        with pytest.raises(CompilationError) as exc_info:
            compiler.compile(workflow_id, nodes, edges)
        assert "unknown target" in str(exc_info.value.errors).lower()


# ---------------------------------------------------------------------------
# Cycle detection
# ---------------------------------------------------------------------------

class TestCycleDetection:
    def test_simple_cycle_raises(self, compiler: WorkflowCompiler, workflow_id):
        """A -> B -> A (with no loop node) is detected as a cycle."""
        ids = _make_ids(3)
        nodes = [
            {"id": ids[0], "type": "start", "label": "Start"},
            {"id": ids[1], "type": "action", "label": "A"},
            {"id": ids[2], "type": "end", "label": "End"},
        ]
        # Cycle: Start -> A -> Start (creates cycle for A since Start feeds A)
        # More precisely: Start -> A and A -> Start create a cycle
        edges = [
            _edge(ids[0], ids[1]),
            _edge(ids[1], ids[0]),  # back-edge creating cycle
            _edge(ids[0], ids[2]),  # so there's an end reachable
        ]

        with pytest.raises(CompilationError, match="[Cc]ycle"):
            compiler.compile(workflow_id, nodes, edges)

    def test_loop_node_allows_back_edge(self, compiler: WorkflowCompiler, workflow_id):
        """Loop nodes allow back-edges without triggering cycle detection."""
        ids = _make_ids(4)
        nodes = [
            {"id": ids[0], "type": "start", "label": "Start"},
            {"id": ids[1], "type": "loop", "label": "Loop"},
            {"id": ids[2], "type": "action", "label": "Body"},
            {"id": ids[3], "type": "end", "label": "End"},
        ]
        edges = [
            _edge(ids[0], ids[1]),
            _edge(ids[1], ids[2], "item"),
            _edge(ids[2], ids[1]),  # back-edge to loop node — allowed
            _edge(ids[1], ids[3]),  # continuation after loop
        ]

        result = compiler.compile(workflow_id, nodes, edges)

        assert result is not None
        assert ids[1] in result.loop_nodes
        assert len(result.loop_nodes) == 1


# ---------------------------------------------------------------------------
# Unreachable nodes
# ---------------------------------------------------------------------------

class TestUnreachableNodes:
    def test_unreachable_nodes_still_compile(self, compiler: WorkflowCompiler, workflow_id):
        """Unreachable nodes are warned about but don't fail compilation."""
        ids = _make_ids(4)
        nodes = [
            {"id": ids[0], "type": "start", "label": "Start"},
            {"id": ids[1], "type": "action", "label": "Action"},
            {"id": ids[2], "type": "end", "label": "End"},
            {"id": ids[3], "type": "action", "label": "Orphan"},  # unreachable
        ]
        edges = [
            _edge(ids[0], ids[1]),
            _edge(ids[1], ids[2]),
        ]

        result = compiler.compile(workflow_id, nodes, edges)

        assert result is not None
        # Orphan should not be in execution order
        assert ids[3] not in result.execution_order
        # But reachable nodes are all present
        assert ids[0] in result.execution_order
        assert ids[1] in result.execution_order
        assert ids[2] in result.execution_order
