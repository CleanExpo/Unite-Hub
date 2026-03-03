"""Tests for workflow execution engine."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from src.workflow.engine import WorkflowEngine
from src.workflow.models import (
    WorkflowDefinition,
    NodeConfig,
    NodeType,
    NodePosition,
    WorkflowEdge,
    EdgeType,
    ExecutionContext,
    ExecutionStatus,
)


@pytest.fixture
def simple_workflow():
    """Create a simple test workflow."""
    return WorkflowDefinition(
        id="test-workflow-1",
        name="Test Workflow",
        description="A simple test workflow",
        nodes=[
            NodeConfig(
                id="start",
                type=NodeType.START,
                position=NodePosition(x=0, y=0),
                label="Start",
            ),
            NodeConfig(
                id="end",
                type=NodeType.END,
                position=NodePosition(x=0, y=100),
                label="End",
            ),
        ],
        edges=[
            WorkflowEdge(
                id="edge-1",
                source_node_id="start",
                target_node_id="end",
                type=EdgeType.DEFAULT,
            )
        ],
    )


@pytest.mark.asyncio
async def test_workflow_engine_initialization():
    """Test workflow engine can be initialized."""
    engine = WorkflowEngine()
    assert engine is not None
    assert engine.storage is not None
    assert engine.orchestrator is not None
    assert engine.tool_registry is not None


@pytest.mark.asyncio
async def test_start_execution(simple_workflow):
    """Test starting a workflow execution."""
    engine = WorkflowEngine()

    # Mock storage to avoid database dependency
    engine.storage.create_execution = AsyncMock()

    execution_id = await engine.start_execution(
        workflow=simple_workflow,
        input_variables={"test_var": "test_value"},
        user_id="test-user",
    )

    assert execution_id is not None
    assert isinstance(execution_id, str)
    assert len(execution_id) > 0

    # Verify storage was called
    assert engine.storage.create_execution.called


@pytest.mark.asyncio
async def test_variable_resolution():
    """Test variable interpolation."""
    engine = WorkflowEngine()

    template = {
        "message": "Hello {{user.name}}!",
        "count": "{{stats.total}}",
    }

    variables = {
        "user": {"name": "Alice"},
        "stats": {"total": "42"},
    }

    resolved = engine._resolve_variables(template, variables)

    assert resolved["message"] == "Hello Alice!"
    assert resolved["count"] == "42"


@pytest.mark.asyncio
async def test_find_outgoing_edges(simple_workflow):
    """Test finding outgoing edges from a node."""
    engine = WorkflowEngine()

    edges = engine._find_outgoing_edges("start", simple_workflow)

    assert len(edges) == 1
    assert edges[0].source_node_id == "start"
    assert edges[0].target_node_id == "end"


@pytest.mark.asyncio
async def test_conditional_node_evaluation():
    """Test conditional node true/false paths."""
    engine = WorkflowEngine()

    node = NodeConfig(
        id="cond-1",
        type=NodeType.CONDITIONAL,
        position=NodePosition(x=0, y=0),
        label="Check condition",
        config={"condition": "{{value}} > 10"},
    )

    # Test true condition
    inputs_true = {"value": "15"}
    result_true = await engine._execute_conditional_node(node, inputs_true)
    assert result_true["condition"] is True

    # Test false condition
    inputs_false = {"value": "5"}
    result_false = await engine._execute_conditional_node(node, inputs_false)
    assert result_false["condition"] is False


# NOTE: More comprehensive tests require database access
# Run these tests after Docker/Supabase is started:
# pytest tests/test_workflow_engine.py -v
