# Phase 83: Client Operations Agent v1 (Safety-Caged)

**Status**: Complete
**Date**: 2025-01-24

## Overview

Phase 83 introduces a safety-caged AI agent for client operations. The agent can read real data and propose/execute low-risk tasks autonomously, while requiring human approval for higher-risk actions. The system includes full traceability, audit logging, and Truth Layer compliance.

## Core Concepts

### Safety-Caged Design

The agent operates within strict safety constraints:

1. **Risk-Based Auto-Execution**
   - Low risk (≤30%): Auto-execute (tags, notes)
   - Medium risk (31-60%): Require approval (status updates, score changes)
   - High risk (>60%): Always require approval (emails, notifications)

2. **Policy Controls**
   - Per-client or workspace-level policies
   - Configurable allowed actions
   - Adjustable risk thresholds
   - Rate limiting (max actions/day)

3. **Early Warning Integration**
   - Respects active warnings
   - Can pause on high-severity warnings
   - Factors warnings into risk assessment

4. **Truth Layer Compliance**
   - No fabricated metrics
   - Confidence scores required
   - Data sources cited
   - Honest uncertainty disclosure

### Action Types

| Action | Base Risk | Description |
|--------|-----------|-------------|
| add_tag | 0.10 | Add tag to contact |
| remove_tag | 0.15 | Remove tag from contact |
| create_note | 0.10 | Create note on contact |
| update_status | 0.20 | Update contact status |
| update_score | 0.25 | Modify AI score |
| schedule_task | 0.30 | Schedule follow-up task |
| generate_content | 0.35 | Generate marketing content |
| send_followup | 0.50 | Send follow-up email |
| send_notification | 0.60 | Send user notification |

### Approval Workflow

```
Agent Proposes Action
    ↓
Guardrails Check
    ├─→ [Failed] → Blocked
    └─→ [Passed] → Risk Assessment
                      ↓
                  ┌─────────────────┐
                  │ Can Auto-Exec?  │
                  └─────────────────┘
                      ├─→ [Yes] → Execute → Log
                      └─→ [No] → Await Approval
                                    ↓
                              ┌─────────────┐
                              │ User Action │
                              └─────────────┘
                                  ├─→ Approve → Execute → Log
                                  └─→ Reject → Log
```

## Architecture

### Database Schema (Migration 126)

Three tables:

1. **`client_agent_policies`**
   - Per-client agent settings
   - Allowed actions list
   - Auto-exec thresholds
   - Safety constraints

2. **`client_agent_sessions`**
   - Conversational sessions
   - Context snapshots
   - Message history
   - Session statistics

3. **`client_agent_actions`**
   - Immutable action log
   - Risk assessment data
   - Approval workflow tracking
   - Truth Layer metadata
   - Execution results

### Backend Services

Located in `src/lib/clientAgent/`:

1. **`clientAgentTypes.ts`**
   - Type definitions for all agent components

2. **`clientAgentContextService.ts`**
   - Aggregates context from multiple sources
   - Client profile, interactions, metrics, warnings

3. **`clientAgentPolicyService.ts`**
   - Policy CRUD operations
   - Action permission checks
   - Auto-exec eligibility

4. **`clientAgentPlannerService.ts`**
   - AI-powered planning using Claude
   - Generates response and action proposals
   - Structured output parsing

5. **`clientAgentGuardrailsService.ts`**
   - Safety checks before execution
   - Policy, risk, rate limit, warning, truth checks
   - Risk assessment calculation

6. **`clientAgentExecutorService.ts`**
   - Action execution by type
   - Database operations
   - Result recording

7. **`clientAgentLogService.ts`**
   - Session management
   - Action logging
   - Status updates

8. **`clientAgentTruthAdapter.ts`**
   - Truth compliance validation
   - Disclaimer generation
   - Compliance scoring

9. **`clientAgentScheduler.ts`**
   - Scheduled evaluations
   - Overview statistics
   - Proactive client analysis

### API Routes

- `POST /api/client-agent/chat` - Main chat endpoint
- `GET /api/client-agent/actions` - List actions
- `PATCH /api/client-agent/actions` - Approve/reject actions
- `GET /api/client-agent/policies` - List policies
- `POST /api/client-agent/policies` - Create/update policy
- `DELETE /api/client-agent/policies` - Delete policy
- `GET /api/client-agent/scheduler` - Get overview/summary
- `POST /api/client-agent/scheduler` - Run evaluation

### UI Components

Located in `src/components/clientAgent/`:

1. **`AgentChatPanel.tsx`** - Interactive chat interface
2. **`SuggestedActionsCard.tsx`** - Pending action approvals
3. **`SafetyBanner.tsx`** - Safety status display
4. **`AgentRunHistory.tsx`** - Action history list
5. **`AgentOverviewStats.tsx`** - Founder-level statistics
6. **`PolicyEditor.tsx`** - Policy configuration UI

### Pages

- `/founder/agent-console` - Founder control center
- `/dashboard/client-assistant` - User-facing assistant

## Safety Features

### Guardrail Checks

```typescript
const result = await checkGuardrails(proposal, policy, context, workspaceId, clientId);

// Returns:
{
  allowed: boolean,
  checks: {
    policy_check: { passed, reason, severity },
    risk_check: { passed, reason, severity },
    rate_limit_check: { passed, reason, severity },
    early_warning_check: { passed, reason, severity },
    truth_layer_check: { passed, reason, severity },
  },
  overall_message: string
}
```

### Risk Assessment

```typescript
const risk = assessRisk(proposal, context);

// Factors:
// - Base action type risk (0.1 - 0.6)
// - High-value client modifier (+30%)
// - Active warnings modifier (+20%)
// - Low confidence modifier (+10%)

// Returns: { level: 'low'|'medium'|'high', score: 0-1, factors: [] }
```

### Truth Layer Validation

```typescript
const validation = validateTruthCompliance(action);

// Checks:
// - Confidence above 50%
// - Data sources cited
// - Source reliability
// - Reasoning quality

// Returns: { compliant, issues, disclaimers }
```

## Usage

### Chat with Agent

```typescript
const response = await fetch('/api/client-agent/chat', {
  method: 'POST',
  body: JSON.stringify({
    workspace_id: 'your-workspace',
    client_id: 'optional-client-id',
    message: 'Schedule a follow-up for next week',
  }),
});

const data = await response.json();
// data.message - Agent's response
// data.proposed_actions - Actions needing approval
// data.executed_actions - Auto-executed actions
// data.safety_info - Risk and compliance info
```

### Approve Action

```typescript
await fetch('/api/client-agent/actions', {
  method: 'PATCH',
  body: JSON.stringify({
    action_id: 'action-uuid',
    approval_status: 'approved_executed',
  }),
});
```

### Run Scheduled Evaluation

```typescript
await fetch('/api/client-agent/scheduler', {
  method: 'POST',
  body: JSON.stringify({
    workspace_id: 'your-workspace',
    action: 'run_evaluation',
  }),
});
```

### Get Agent Overview

```typescript
const res = await fetch(
  '/api/client-agent/scheduler?workspaceId=xyz&type=overview'
);
const { data } = await res.json();

// data: {
//   total_sessions,
//   active_sessions,
//   actions_today,
//   auto_executed_today,
//   awaiting_approval,
//   rejection_rate,
//   avg_risk_score,
//   truth_compliance_avg,
//   clients_with_warnings
// }
```

## Integration Points

### Early Warning System

The agent integrates with Phase 82's Early Warning Engine:
- Reads client warnings as context
- Factors warnings into risk assessment
- Can pause operations on high-severity warnings

### Truth Layer

All agent actions comply with Truth Layer standards:
- Confidence scores required (minimum 50%)
- Data sources must be cited
- Honest uncertainty disclosure
- No fabricated metrics

### Founder Intelligence

Agent operations appear in Founder Intel through:
- Agent overview in Founder Console
- Pending approvals alerts
- Safety status monitoring

## Files Created

### Database
- `supabase/migrations/126_client_ops_agent.sql`

### Backend (9 files)
- `src/lib/clientAgent/clientAgentTypes.ts`
- `src/lib/clientAgent/clientAgentContextService.ts`
- `src/lib/clientAgent/clientAgentPolicyService.ts`
- `src/lib/clientAgent/clientAgentPlannerService.ts`
- `src/lib/clientAgent/clientAgentGuardrailsService.ts`
- `src/lib/clientAgent/clientAgentExecutorService.ts`
- `src/lib/clientAgent/clientAgentLogService.ts`
- `src/lib/clientAgent/clientAgentTruthAdapter.ts`
- `src/lib/clientAgent/clientAgentScheduler.ts`
- `src/lib/clientAgent/index.ts`

### API Routes (4 files)
- `src/app/api/client-agent/chat/route.ts`
- `src/app/api/client-agent/actions/route.ts`
- `src/app/api/client-agent/policies/route.ts`
- `src/app/api/client-agent/scheduler/route.ts`

### UI Components (6 files)
- `src/components/clientAgent/AgentChatPanel.tsx`
- `src/components/clientAgent/SuggestedActionsCard.tsx`
- `src/components/clientAgent/SafetyBanner.tsx`
- `src/components/clientAgent/AgentRunHistory.tsx`
- `src/components/clientAgent/AgentOverviewStats.tsx`
- `src/components/clientAgent/PolicyEditor.tsx`

### Pages (2 files)
- `src/app/founder/agent-console/page.tsx`
- `src/app/dashboard/client-assistant/page.tsx`

## Default Policy Settings

```typescript
{
  agent_enabled: true,
  allowed_actions: [
    'send_followup',
    'update_status',
    'add_tag',
    'schedule_task',
    'generate_content'
  ],
  auto_exec_enabled: true,
  auto_exec_risk_threshold: 'low',
  low_risk_threshold: 0.30,
  medium_risk_threshold: 0.60,
  max_actions_per_day: 10,
  require_human_review_above_score: 70,
  respect_early_warnings: true,
  pause_on_high_severity_warning: true
}
```

## Next Steps

Potential enhancements:
- Bulk action approval interface
- Custom action templates
- Scheduled evaluation cron job
- Email/Slack notifications for pending actions
- Action undo capability
- Advanced analytics dashboard
- Multi-workspace policy inheritance
- Action chaining and workflows
