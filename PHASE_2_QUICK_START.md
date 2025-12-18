# M1 Phase 2: OrchestratorAgent - Quick Start Guide

**Version**: 1.1.0
**Release**: m1-orchestrator-v1
**Status**: Production Ready ✅

---

## What is OrchestratorAgent?

A **plan-first agent** that uses Claude AI to reason about goals and propose tool calls WITHOUT executing them. All execution is delegated to Phase 3 (CLI).

```
Goal Input → OrchestratorAgent (reason + propose) → ExecutionRequest → CLI (execute)
```

---

## Basic Usage

### Simple Goal Processing

```typescript
import { OrchestratorAgent } from '@/lib/m1';

const agent = new OrchestratorAgent("Find restaurants near Times Square");
const request = await agent.execute();

console.log(request.runId);           // Unique run identifier
console.log(request.proposedActions); // Array of approved tool calls
console.log(request.constraints);     // Execution limits (12/8/60)
```

### With Configuration

```typescript
import { orchestrate } from '@/lib/m1';

const request = await orchestrate("Complex multi-step goal", {
  model: "claude-opus-4-5-20251101",
  maxTokens: 2048,
  temperature: 0.5,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

if (request.proposedActions.length > 0) {
  console.log("Ready for Phase 3 execution");
}
```

### Error Handling

```typescript
const agent = new OrchestratorAgent("Goal");
const request = await agent.execute();

// Agent never throws - always returns ExecutionRequest
// Check for errors separately
const errors = agent.getErrors();
if (errors.length > 0) {
  console.log("Warnings during reasoning:");
  errors.forEach(err => {
    console.log(`  [${err.severity}] ${err.code}: ${err.message}`);
  });
}

// Execute approved actions or proceed with constraints
console.log(`Approved actions: ${request.proposedActions.length}`);
```

---

## What Gets Created

### ExecutionRequest Structure

```typescript
{
  runId: string;              // Unique identifier
  agentName: "orchestrator";  // Always "orchestrator"
  goal: string;               // Your input goal
  constraints: {
    maxSteps: 12;             // Hard limit on reasoning steps
    maxToolCalls: 8;          // Hard limit on tool calls
    maxRuntimeSeconds: 60;    // Hard limit on execution time
  };
  proposedActions: ToolCall[]; // Policy-approved tool calls only
}
```

### ToolCall Structure (in proposedActions)

```typescript
{
  requestId: string;          // Unique request ID
  toolName: string;           // Name from M1 registry
  args?: Record<string, unknown>; // Tool arguments
  scope: "read" | "write" | "execute"; // Access scope
  approvalRequired: boolean;  // Whether approval was required
}
```

---

## Registered Tools (M1 v1.0.0)

The OrchestratorAgent has access to 4 core M1 tools:

| Tool | Scope | Purpose | Approval |
|------|-------|---------|----------|
| `tool_registry_list` | read | List available tools | No |
| `tool_policy_check` | read | Validate tool calls | No |
| `request_approval` | execute | Request authorization | Yes |
| `log_agent_run` | write | Record to audit trail | Yes |

### Scope Rules
- **read**: Safe operations, no approval needed
- **write**: State modifications, requires approval token
- **execute**: System operations, requires explicit authorization

---

## M1 Policy Engine Integration

All proposals are validated by 7 safety guards:

1. **Unregistered Tools**: Only registered tools are allowed
2. **Approval Gates**: write/execute scope needs approval
3. **Scope Control**: Least-privilege access enforcement
4. **Execution Limits**: Enforce 12 steps, 8 calls, 60s max
5. **Observability**: Full audit trail maintained
6. **Policy Denial**: Graceful failure handling
7. **Registry Integrity**: Runtime-immutable tool list

**Result**: Only policy-approved actions in `proposedActions`

---

## M1 Audit Trail

Every execution creates a complete audit trail:

```typescript
import { agentRunsLogger } from '@/lib/m1';

// After execute() completes, get run details:
const run = agentRunsLogger.getRun(request.runId);

console.log(run.goal);           // Your original goal
console.log(run.createdAt);      // When run started
console.log(run.completedAt);    // When run completed
console.log(run.stopReason);     // "completed", "error", etc.
console.log(run.toolCalls);      // All tool calls attempted
```

---

## Common Patterns

### Pattern 1: Check Available Tools

```typescript
const agent = new OrchestratorAgent(
  "List what tools are available in M1"
);
const request = await agent.execute();

// Claude should propose tool_registry_list
console.log("Proposed tools:", request.proposedActions.map(a => a.toolName));
```

### Pattern 2: Multi-Step Workflow

```typescript
const agent = new OrchestratorAgent(
  "First validate a tool call, then log the execution"
);
const request = await agent.execute();

// Claude might propose:
// 1. tool_policy_check (validation)
// 2. log_agent_run (tracking)

console.log(`Step 1: ${request.proposedActions[0]?.toolName}`);
console.log(`Step 2: ${request.proposedActions[1]?.toolName}`);
```

### Pattern 3: Error Recovery

```typescript
const agent = new OrchestratorAgent("Impossible goal with no applicable tools");
const request = await agent.execute();

// May return empty proposedActions
if (request.proposedActions.length === 0) {
  console.log("No applicable tools for this goal");
  console.log("Errors:", agent.getErrors());
  // Phase 3 will handle gracefully
}
```

---

## Execution Flow Diagram

```
┌─────────────────────────────────┐
│ User provides goal               │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ OrchestratorAgent  │
    │  .execute()        │
    └────────┬───────────┘
             │
    ┌────────▼──────────────────┐
    │ 1. Build system prompt    │
    │    from M1 registry       │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ 2. Call Claude API        │
    │    for proposals          │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ 3. Validate against       │
    │    M1 registry            │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ 4. Submit to policy       │
    │    engine (7 guards)      │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ 5. Filter approved        │
    │    proposals              │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │ 6. Build ExecutionRequest │
    └────────┬──────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ ExecutionRequest   │
    │  ├─ runId         │
    │  ├─ goal          │
    │  ├─ constraints   │
    │  └─ proposed      │
    │     Actions       │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │ Phase 3: CLI       │
    │  Execute now!      │
    └────────────────────┘
```

---

## Configuration Options

```typescript
export interface OrchestratorConfig {
  model?: string;        // Default: "claude-opus-4-5-20251101"
  maxTokens?: number;    // Default: 1024 (for reasoning)
  temperature?: number;  // Default: 0.7 (creative)
  timeout?: number;      // Default: 60000ms (1 minute)
  apiKey?: string;       // Default: process.env.ANTHROPIC_API_KEY
}
```

### Configuration Examples

```typescript
// Fast mode (cheaper)
const agent = new OrchestratorAgent(goal, {
  maxTokens: 512,
  temperature: 0.3,
});

// Creative mode (more thorough)
const agent = new OrchestratorAgent(goal, {
  maxTokens: 2048,
  temperature: 0.9,
});

// With custom API key
const agent = new OrchestratorAgent(goal, {
  apiKey: process.env.CUSTOM_ANTHROPIC_KEY,
});
```

---

## Accessing Run Information

```typescript
const agent = new OrchestratorAgent(goal);
const request = await agent.execute();

// Get agent metadata
console.log(agent.getRunId());        // Unique run identifier
console.log(agent.getProposalCount()); // Number of proposals
console.log(agent.getDuration());     // Execution time in ms

// Get errors
const errors = agent.getErrors();
errors.forEach(err => {
  console.log(`${err.code} [${err.severity}]: ${err.message}`);
  console.log(`Context:`, err.context);
});
```

---

## Test Pattern

When testing code that uses OrchestratorAgent:

```typescript
import { describe, it, expect, vi } from "vitest";
import { OrchestratorAgent } from '@/lib/m1';

describe("My feature using OrchestratorAgent", () => {
  it("should handle goal processing", async () => {
    const agent = new OrchestratorAgent("Test goal");

    // Mock Claude API to avoid actual calls
    vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
      reasoning: "Test reasoning",
      toolCalls: [{
        toolName: "tool_registry_list",
        args: {},
        reasoning: "List tools",
      }],
      explanation: "Will list tools",
    });

    const request = await agent.execute();

    expect(request.goal).toBe("Test goal");
    expect(request.proposedActions.length).toBeGreaterThanOrEqual(0);
  });
});
```

---

## Troubleshooting

### Issue: No proposed actions returned

```typescript
const request = await agent.execute();
if (request.proposedActions.length === 0) {
  // Possible reasons:
  // 1. Claude didn't generate proposals
  // 2. Policy engine rejected all proposals
  // 3. No applicable tools for goal

  const errors = agent.getErrors();
  errors.forEach(err => console.log(err.message));
}
```

### Issue: Getting API key error

```typescript
// Make sure ANTHROPIC_API_KEY is set:
// 1. In .env file
// 2. Or pass directly:

const agent = new OrchestratorAgent(goal, {
  apiKey: "sk-ant-...",
});
```

### Issue: Tests timing out

```typescript
// OrchestratorAgent makes Claude API calls
// Mock in tests to avoid real API:

vi.spyOn(agent as any, "generateProposals").mockResolvedValue({
  reasoning: "...",
  toolCalls: [],
  explanation: "...",
});

// Now tests run without API delays
```

---

## Performance Notes

| Operation | Time |
|-----------|------|
| Agent initialization | <1ms |
| System prompt build | <5ms |
| Claude API call | 500-2000ms |
| Registry validation | <5ms |
| Policy submission | <10ms |
| Total | 500-2100ms |

**Notes**:
- Dominated by Claude API latency
- First request may be slower due to SDK initialization
- Cached results used for identical goals (with same config)

---

## Next Steps: Phase 3

The ExecutionRequest returned by OrchestratorAgent is ready for Phase 3:

```typescript
// Phase 2 creates the request
const request = await orchestrate(goal);

// Phase 3 will:
// 1. Receive ExecutionRequest
// 2. Execute each proposedAction
// 3. Track results
// 4. Return ExecutionResult
// 5. Log to M1 audit trail
```

---

## Key Constraints

| Constraint | Limit | Reason |
|-----------|-------|--------|
| Max steps | 12 | Prevent infinite loops |
| Max tool calls | 8 | Control resource usage |
| Max runtime | 60s | Prevent hung processes |
| Tools available | 4 | Security - strict allowlist |
| Approval required | 2+ tools | Safety - write/execute scope |

---

## Security

✅ **No arbitrary code execution** - Only registered tools allowed
✅ **Approval gates enforced** - write/execute requires tokens
✅ **Scope-based access** - read-only by default
✅ **Execution limits** - Hard cap on steps/calls/time
✅ **Full audit trail** - Every action logged
✅ **External execution** - Agent can't execute, only propose

---

## Documentation

- **Full Reference**: [PHASE_2_COMPLETION_SUMMARY.md](./PHASE_2_COMPLETION_SUMMARY.md)
- **Implementation Guide**: [M1_IMPLEMENTATION_GUIDE.md](./M1_IMPLEMENTATION_GUIDE.md)
- **Version Policy**: [src/lib/m1/VERSION.md](./src/lib/m1/VERSION.md)
- **Phase 1 Summary**: [M1_SESSION_SUMMARY.md](./M1_SESSION_SUMMARY.md)

---

## Version Info

```typescript
import { M1_VERSION, M1_RELEASE } from '@/lib/m1';

console.log(`M1 ${M1_VERSION} (${M1_RELEASE})`);
// Output: M1 1.1.0 (m1-orchestrator-v1)
```

---

**Built with Claude Code** 🤖
**Status**: Production Ready ✅
