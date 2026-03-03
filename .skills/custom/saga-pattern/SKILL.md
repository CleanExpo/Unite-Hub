# Saga Pattern

> Distributed transaction orchestration with compensation, rollback, and step-based execution for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `saga-pattern`                                           |
| **Category**   | Orchestration & Workflow                                 |
| **Complexity** | High                                                     |
| **Complements**| `retry-strategy`, `queue-worker`, `state-machine`        |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies the saga pattern for NodeJS-Starter-V1: orchestration-based sagas for multi-step operations, compensation actions for rollback, step execution with idempotency, saga state persistence, and integration with the existing workflow builder and queue infrastructure.

---

## When to Apply

### Positive Triggers

- Multi-step operations that span multiple services or database tables
- Operations requiring rollback if any step fails (e.g., create user + provision resources)
- Agent workflows with compensation (undo agent actions on failure)
- Order processing or payment flows with multiple external calls
- Workflow builder execution with step-by-step rollback

### Negative Triggers

- Simple database transactions within a single service (use SQLAlchemy transactions)
- State machine transitions without compensation (use `state-machine` skill)
- Background job retry logic (use `retry-strategy` skill)
- Pipeline data transforms without rollback needs (use `pipeline-builder` skill)

---

## Core Principles

### The Three Laws of Sagas

1. **Every Step Has a Compensator**: If a step can execute, it must define how to undo itself. Steps without compensation are unrecoverable failure points.
2. **Persist Before Execute**: Save the saga state before each step begins. On crash recovery, the saga engine replays from the last persisted state.
3. **Idempotent Steps and Compensators**: Both forward and compensation steps must be idempotent. The saga engine may retry either on failure.

---

## Pattern 1: Saga Definition (Python)

### Step-Based Saga with Compensation

```python
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Coroutine


class SagaStepStatus(str, Enum):
    PENDING = "pending"
    EXECUTING = "executing"
    COMPLETED = "completed"
    COMPENSATING = "compensating"
    COMPENSATED = "compensated"
    FAILED = "failed"


@dataclass
class SagaStep:
    name: str
    execute: Callable[..., Coroutine]
    compensate: Callable[..., Coroutine]
    status: SagaStepStatus = SagaStepStatus.PENDING
    result: Any = None
    error: str | None = None


@dataclass
class Saga:
    id: str
    name: str
    steps: list[SagaStep] = field(default_factory=list)
    context: dict[str, Any] = field(default_factory=dict)
    status: str = "pending"  # pending, running, completed, compensating, failed

    def add_step(
        self,
        name: str,
        execute: Callable,
        compensate: Callable,
    ) -> "Saga":
        self.steps.append(SagaStep(name=name, execute=execute, compensate=compensate))
        return self
```

---

## Pattern 2: Saga Orchestrator

### Execution Engine with Rollback

```python
from src.utils import get_logger

logger = get_logger(__name__)


class SagaOrchestrator:
    """Executes saga steps with automatic compensation on failure."""

    async def execute(self, saga: Saga) -> Saga:
        saga.status = "running"
        completed_steps: list[SagaStep] = []

        for step in saga.steps:
            step.status = SagaStepStatus.EXECUTING
            logger.info("saga_step_start", saga=saga.name, step=step.name)

            try:
                step.result = await step.execute(saga.context)
                step.status = SagaStepStatus.COMPLETED
                completed_steps.append(step)
                logger.info("saga_step_complete", saga=saga.name, step=step.name)
            except Exception as e:
                step.status = SagaStepStatus.FAILED
                step.error = str(e)
                logger.error("saga_step_failed", saga=saga.name, step=step.name, error=str(e))

                # Compensate completed steps in reverse order
                await self._compensate(saga, completed_steps)
                saga.status = "failed"
                return saga

        saga.status = "completed"
        return saga

    async def _compensate(self, saga: Saga, completed: list[SagaStep]) -> None:
        saga.status = "compensating"
        for step in reversed(completed):
            step.status = SagaStepStatus.COMPENSATING
            try:
                await step.compensate(saga.context)
                step.status = SagaStepStatus.COMPENSATED
                logger.info("saga_compensated", saga=saga.name, step=step.name)
            except Exception as e:
                step.status = SagaStepStatus.FAILED
                logger.error("saga_compensation_failed", saga=saga.name, step=step.name, error=str(e))
```

---

## Pattern 3: Practical Example

### User Onboarding Saga

```python
async def create_user(ctx: dict) -> dict:
    user = await db.create_user(ctx["email"], ctx["name"])
    ctx["user_id"] = str(user.id)
    return {"user_id": ctx["user_id"]}


async def undo_create_user(ctx: dict) -> None:
    await db.delete_user(ctx["user_id"])


async def provision_workspace(ctx: dict) -> dict:
    workspace = await db.create_workspace(ctx["user_id"], ctx["workspace_name"])
    ctx["workspace_id"] = str(workspace.id)
    return {"workspace_id": ctx["workspace_id"]}


async def undo_provision_workspace(ctx: dict) -> None:
    await db.delete_workspace(ctx["workspace_id"])


async def send_welcome_email(ctx: dict) -> dict:
    await email_sender.send("welcome", ctx["email"])
    return {"email_sent": True}


async def log_email_failure(ctx: dict) -> None:
    logger.warning("welcome_email_compensation", user=ctx["user_id"])


# Build and execute
saga = (
    Saga(id="onboard-123", name="user-onboarding", context={
        "email": "user@example.com",
        "name": "Jane",
        "workspace_name": "Default",
    })
    .add_step("create_user", create_user, undo_create_user)
    .add_step("provision_workspace", provision_workspace, undo_provision_workspace)
    .add_step("send_welcome", send_welcome_email, log_email_failure)
)

result = await SagaOrchestrator().execute(saga)
```

**Project Reference**: `apps/backend/src/db/workflow_models.py` — the existing workflow builder has multi-step execution. The saga pattern adds compensation logic for each workflow step so failed executions can roll back cleanly.

---

## Pattern 4: Saga State Persistence

### Database-Backed Recovery

```python
async def persist_saga_state(saga: Saga) -> None:
    """Save saga state for crash recovery."""
    await db.execute(
        text("""
            INSERT INTO saga_state (id, name, status, context, steps, updated_at)
            VALUES (:id, :name, :status, :context, :steps, NOW())
            ON CONFLICT (id) DO UPDATE SET
                status = :status, context = :context,
                steps = :steps, updated_at = NOW()
        """),
        {
            "id": saga.id,
            "name": saga.name,
            "status": saga.status,
            "context": json.dumps(saga.context),
            "steps": json.dumps([
                {"name": s.name, "status": s.status.value, "error": s.error}
                for s in saga.steps
            ]),
        },
    )
```

---

## Pattern 5: TypeScript Saga (Frontend Workflows)

### Client-Side Multi-Step Operations

```typescript
interface SagaStep<T = unknown> {
  name: string;
  execute: (context: Record<string, unknown>) => Promise<T>;
  compensate: (context: Record<string, unknown>) => Promise<void>;
}

async function executeSaga(
  steps: SagaStep[],
  context: Record<string, unknown>,
): Promise<{ status: "completed" | "failed"; context: Record<string, unknown> }> {
  const completed: SagaStep[] = [];

  for (const step of steps) {
    try {
      await step.execute(context);
      completed.push(step);
    } catch {
      // Compensate in reverse
      for (const done of completed.reverse()) {
        await done.compensate(context).catch(() => {});
      }
      return { status: "failed", context };
    }
  }

  return { status: "completed", context };
}
```

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Steps without compensators | Unrecoverable partial failures | Every step defines undo |
| Non-idempotent steps | Retry causes duplicate side effects | Idempotency keys for each step |
| In-memory saga state | Lost on crash, no recovery | Persist to database |
| Sequential without timeout | Hanging step blocks entire saga | Timeout per step |
| Compensating in forward order | Later steps depend on earlier ones | Always reverse order |

---

## Checklist

Before merging saga-pattern changes:

- [ ] `Saga` and `SagaStep` models with execute/compensate pairs
- [ ] `SagaOrchestrator` with automatic reverse compensation on failure
- [ ] Saga state persisted to database for crash recovery
- [ ] Idempotent steps and compensators
- [ ] Integration with workflow builder execution engine
- [ ] Structured logging for each step transition

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Saga Implementation

**Type**: [orchestration-based / choreography-based]
**Persistence**: [database / Redis / in-memory]
**Compensation**: [automatic reverse / manual]
**Idempotency**: [idempotency keys / natural idempotent]
**Integration**: [workflow builder / standalone]
```
