# Workflow Engine

> Multi-step approval workflows, business process automation, and visual workflow execution for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `workflow-engine`                                        |
| **Category**   | Orchestration & Workflow                                 |
| **Complexity** | High                                                     |
| **Complements**| `state-machine`, `saga-pattern`, `queue-worker`          |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies workflow engine patterns for NodeJS-Starter-V1: multi-step approval flows, node-based execution with the existing workflow builder, conditional branching and parallel paths, execution state persistence, timeout and escalation policies, and integration with the LangGraph agent orchestration layer.

---

## When to Apply

### Positive Triggers

- Building multi-step approval workflows with human-in-the-loop
- Executing visual workflows from the workflow builder canvas
- Adding timeout and escalation policies to workflow steps
- Implementing parallel execution paths within a workflow
- Orchestrating agent task sequences with conditional routing

### Negative Triggers

- Simple state transitions without execution logic (use `state-machine` skill)
- Single-operation rollback (use `saga-pattern` skill)
- Data processing pipelines (use `pipeline-builder` skill)
- Cron-triggered background jobs (use `cron-scheduler` skill)

---

## Core Principles

### The Three Laws of Workflow Engines

1. **Persist Every Transition**: Workflow state must survive process restarts. Every node entry, exit, and transition is written to the database before execution continues.
2. **Timeouts Are Not Optional**: Every step must have a timeout. A step without a timeout is a step that can hang forever, blocking the entire workflow.
3. **Human Steps Are Async**: Approval and review steps are asynchronous by nature. The engine must park the workflow, notify the approver, and resume on response.

---

## Pattern 1: Workflow Definition Model

### Node-Based Workflow Structure

```python
from datetime import timedelta
from enum import Enum
from pydantic import BaseModel, Field


class NodeType(str, Enum):
    START = "start"
    END = "end"
    TASK = "task"           # Automated execution
    APPROVAL = "approval"   # Human approval required
    CONDITION = "condition"  # Branching logic
    PARALLEL = "parallel"   # Fork into parallel paths
    JOIN = "join"           # Wait for all parallel paths
    AGENT = "agent"         # AI agent execution


class WorkflowNode(BaseModel):
    id: str
    type: NodeType
    name: str
    config: dict = Field(default_factory=dict)
    timeout: timedelta = timedelta(hours=24)
    next_nodes: list[str] = Field(default_factory=list)
    on_timeout: str = "escalate"  # escalate, skip, fail


class WorkflowDefinition(BaseModel):
    id: str
    name: str
    version: int = 1
    nodes: dict[str, WorkflowNode]
    start_node: str
```

**Project Reference**: `apps/backend/src/db/workflow_models.py:32-50` — the existing `WorkflowNodeType` enum defines start, trigger, end, output, llm, agent, tool, and conditional types. The workflow engine extends this with approval, parallel, and join types for business process automation.

---

## Pattern 2: Execution Engine

### Step-by-Step Workflow Execution

```python
from src.utils import get_logger

logger = get_logger(__name__)


class ExecutionStatus(str, Enum):
    RUNNING = "running"
    WAITING = "waiting"      # Paused for approval
    COMPLETED = "completed"
    FAILED = "failed"
    TIMED_OUT = "timed_out"


class WorkflowExecution(BaseModel):
    id: str
    workflow_id: str
    current_node: str
    status: ExecutionStatus = ExecutionStatus.RUNNING
    context: dict = Field(default_factory=dict)
    history: list[dict] = Field(default_factory=list)
    started_at: str
    completed_at: str | None = None


class WorkflowEngine:
    """Executes workflow definitions step by step."""

    def __init__(self, workflow: WorkflowDefinition) -> None:
        self.workflow = workflow
        self.handlers: dict[NodeType, Callable] = {
            NodeType.TASK: self._execute_task,
            NodeType.APPROVAL: self._request_approval,
            NodeType.CONDITION: self._evaluate_condition,
            NodeType.PARALLEL: self._fork_parallel,
            NodeType.JOIN: self._join_parallel,
            NodeType.AGENT: self._execute_agent,
        }

    async def run(self, execution: WorkflowExecution) -> WorkflowExecution:
        while execution.status == ExecutionStatus.RUNNING:
            node = self.workflow.nodes[execution.current_node]

            if node.type == NodeType.END:
                execution.status = ExecutionStatus.COMPLETED
                break

            handler = self.handlers.get(node.type)
            if not handler:
                execution.status = ExecutionStatus.FAILED
                break

            result = await handler(node, execution)
            execution.history.append({
                "node": node.id,
                "type": node.type.value,
                "result": result,
                "timestamp": datetime.now().isoformat(),
            })

            # Persist state after each step
            await persist_execution(execution)

            if execution.status == ExecutionStatus.WAITING:
                break  # Paused for approval

            # Advance to next node
            next_node = self._resolve_next(node, result)
            if next_node:
                execution.current_node = next_node
            else:
                execution.status = ExecutionStatus.COMPLETED

        return execution
```

---

## Pattern 3: Approval Steps

### Human-in-the-Loop Workflow

```python
async def _request_approval(
    self, node: WorkflowNode, execution: WorkflowExecution,
) -> dict:
    """Park workflow and notify approver."""
    approver_id = node.config.get("approver_id")
    if not approver_id:
        approver_id = execution.context.get("default_approver")

    # Create approval request
    approval = {
        "execution_id": execution.id,
        "node_id": node.id,
        "approver_id": approver_id,
        "requested_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + node.timeout).isoformat(),
    }
    await store_approval_request(approval)

    # Notify approver
    await enqueue_notification(NotificationEvent(
        event_type="workflow.approval_required",
        recipient_id=approver_id,
        channels=[NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority=NotificationPriority.HIGH,
        subject=f"Approval needed: {node.name}",
        body=f"Workflow '{self.workflow.name}' requires your approval.",
        data={"execution_id": execution.id, "node_id": node.id},
    ))

    execution.status = ExecutionStatus.WAITING
    return {"status": "waiting_for_approval", "approver": approver_id}


# Resume endpoint
@router.post("/workflows/{exec_id}/approve")
async def approve_step(
    exec_id: str,
    approved: bool,
    user = Depends(get_current_user),
):
    """Resume workflow after approval decision."""
    execution = await get_execution(exec_id)
    if approved:
        execution.status = ExecutionStatus.RUNNING
        execution.current_node = get_next_node(execution)
        await engine.run(execution)
    else:
        execution.status = ExecutionStatus.FAILED
        execution.history.append({"action": "rejected", "by": str(user.id)})
    await persist_execution(execution)
    return {"status": execution.status.value}
```

**Complements**: `notification-system` skill — approval requests trigger notifications. `rbac-patterns` skill — only users with the approver role can approve.

---

## Pattern 4: Conditional Branching

### Runtime Decision Logic

```python
async def _evaluate_condition(
    self, node: WorkflowNode, execution: WorkflowExecution,
) -> dict:
    """Evaluate condition and choose branch."""
    condition = node.config.get("condition", "")
    context = execution.context

    # Simple expression evaluation
    result = eval_condition(condition, context)

    return {
        "condition": condition,
        "result": result,
        "branch": "true" if result else "false",
    }

def _resolve_next(self, node: WorkflowNode, result: dict) -> str | None:
    if node.type == NodeType.CONDITION:
        branch = result.get("branch", "true")
        branches = node.config.get("branches", {})
        return branches.get(branch, node.next_nodes[0] if node.next_nodes else None)
    return node.next_nodes[0] if node.next_nodes else None
```

---

## Pattern 5: Timeout and Escalation

### Step-Level Timeout Policies

```python
async def check_timeouts() -> None:
    """Periodic check for timed-out workflow steps."""
    waiting = await get_waiting_executions()

    for execution in waiting:
        node = get_current_node(execution)
        if not node:
            continue

        elapsed = datetime.now() - parse_datetime(execution.history[-1]["timestamp"])
        if elapsed > node.timeout:
            match node.on_timeout:
                case "escalate":
                    await escalate_to_manager(execution, node)
                case "skip":
                    execution.current_node = node.next_nodes[0]
                    execution.status = ExecutionStatus.RUNNING
                    await engine.run(execution)
                case "fail":
                    execution.status = ExecutionStatus.TIMED_OUT
            await persist_execution(execution)
```

**Complements**: `cron-scheduler` skill — run `check_timeouts()` every 5 minutes via the cron infrastructure.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| In-memory execution state | Lost on restart | Database-persisted execution |
| No step timeouts | Workflows hang indefinitely | Timeout + escalation per node |
| Synchronous approval waits | Blocks thread/worker | Async park + resume pattern |
| Hardcoded workflow logic | Cannot modify without code deploy | Data-driven definitions |
| No execution history | Cannot audit or debug | Record every node transition |

---

## Checklist

Before merging workflow-engine changes:

- [ ] `WorkflowDefinition` with typed nodes and connections
- [ ] `WorkflowEngine` with step-by-step execution and state persistence
- [ ] Approval steps with async park/resume and notification
- [ ] Conditional branching with runtime expression evaluation
- [ ] Timeout policies with escalation, skip, and fail actions
- [ ] Execution history for audit and debugging
- [ ] Integration with existing workflow builder node types

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Workflow Engine Implementation

**Node Types**: [task, approval, condition, parallel, join, agent]
**Persistence**: [database / Redis]
**Approvals**: [async notification / polling]
**Timeouts**: [per-node / global]
**Escalation**: [manager / skip / fail]
**Integration**: [workflow builder / standalone / LangGraph]
```
