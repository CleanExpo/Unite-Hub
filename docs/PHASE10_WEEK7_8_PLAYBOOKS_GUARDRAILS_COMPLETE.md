# Phase 10 Week 7-8: Operator Playbooks, Guardrails & Sandbox - COMPLETE

**Status**: COMPLETE
**Date**: 2025-11-20
**Branch**: `feature/phase10-week7-8-playbooks-guardrails-sandbox`

---

## Overview

Implemented operator playbooks, guardrail policies, and training sandbox mode for Unite-Hub's Operator Mode. This enables structured procedures, safety guardrails, and risk-free simulation training for human-in-the-loop decisions.

---

## Deliverables

### 1. Database Migration (062_operator_playbooks.sql)

**6 new tables created:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `operator_playbooks` | Operational procedures | name, domain, risk_level, status |
| `playbook_rules` | Individual rules | rule_type, conditions, action, coaching_message |
| `playbook_assignments` | Role/user assignments | assignment_type, target_role, target_user_id |
| `guardrail_evaluations` | Decision logs | evaluated_rules, final_action, blocking_rule_id |
| `sandbox_executions` | Simulation records | simulated_result, would_have_succeeded, insights |
| `coaching_hints` | Hint delivery tracking | hint_type, message, was_helpful |

### 2. GuardrailPolicyService (guardrailPolicyService.ts)

**Guardrail Actions:**
- `ALLOW` - Permit the action
- `BLOCK` - Prevent the action
- `REQUIRE_QUORUM` - Require multi-approval
- `SIMULATE` - Run in sandbox only
- `ESCALATE` - Escalate to higher role
- `NOTIFY` - Send notification
- `COACH` - Show coaching hint

**Rule Types:**
- `GUARDRAIL` - Block or require approval
- `COACHING` - Show hints/tips
- `AUTOMATION` - Auto-actions
- `ESCALATION` - Escalation triggers
- `VALIDATION` - Pre-flight checks

**Key Methods:**
```typescript
// Evaluate guardrails for a context
evaluateGuardrails(context: GuardrailEvaluationContext)
  → GuardrailEvaluationResult

// Run sandbox simulation
runSandboxSimulation(
  organizationId, operatorId, executionType, inputData
) → SandboxExecutionResult

// Get coaching hints
getCoachingHints(organizationId, operatorId, contextType)
  → CoachingHint[]

// Record hint feedback
recordHintFeedback(hintId, wasHelpful, feedback)

// Get sandbox history
getSandboxHistory(organizationId, operatorId?, limit)
```

### 3. API Route (/api/operator/playbooks)

**GET Parameters:**
- `type`: playbooks | rules | assignments | evaluations | sandbox_history | coaching_hints
- `organization_id`: UUID (required)
- `playbook_id`: UUID (for rules)
- `context_type`: APPROVAL_QUEUE | REVIEW_THREAD | DASHBOARD | EXECUTION

**POST Actions:**
- `create_playbook` - Create new playbook
- `update_playbook` - Update playbook metadata/status
- `create_rule` - Add rule to playbook
- `update_rule` - Modify rule
- `delete_rule` - Remove rule
- `assign_playbook` - Assign to role/user
- `unassign_playbook` - Remove assignment
- `evaluate` - Run guardrail evaluation
- `run_sandbox` - Execute sandbox simulation
- `hint_feedback` - Record hint feedback

### 4. OperatorPlaybooksDashboard Component

**UI Features:**
- **Playbooks Tab**: List, create, activate playbooks
- **Rules Tab**: Add, edit, delete rules with conditions
- **Assignments Tab**: Assign playbooks to roles/users

**Interactive Elements:**
- Create Playbook dialog
- Add Rule dialog with condition JSON editor
- Assign Playbook dialog
- Activate playbook button
- Delete rule button

### 5. Unit Tests (18 tests)

**Test Coverage:**
- Guardrail evaluation (6 tests)
- Condition evaluation (4 tests)
- Sandbox simulation (4 tests)
- Coaching hints (2 tests)
- Sandbox history (2 tests)
- Rule precedence (1 test)

---

## Condition Syntax

Rules can specify conditions as JSON:

```json
// Operator score conditions
{"operator_score": "<50"}    // Less than 50
{"operator_score": ">80"}    // Greater than 80
{"operator_score": "<=60"}   // Less than or equal to 60
{"operator_score": ">=70"}   // Greater than or equal to 70

// Domain/risk conditions
{"domain": "SEO"}
{"risk_level": "HIGH_RISK"}

// Combined conditions
{
  "operator_score": "<50",
  "risk_level": "HIGH_RISK"
}
```

---

## Action Restriction Order

When multiple rules apply, the most restrictive action wins:

1. `ALLOW` (least restrictive)
2. `COACH`
3. `NOTIFY`
4. `SIMULATE`
5. `REQUIRE_QUORUM`
6. `ESCALATE`
7. `BLOCK` (most restrictive)

---

## Sandbox Simulation

The sandbox mode allows risk-free testing:

```typescript
const result = await guardrailService.runSandboxSimulation(
  "org-1",
  "operator-1",
  "EMAIL_SEND",
  {
    recipients: ["test@example.com"],
    subject: "Test Campaign",
    body: "Hello world",
  }
);

// Result
{
  id: "sim-uuid",
  simulatedResult: {
    type: "EMAIL_SEND",
    status: "SIMULATED_SUCCESS",
    timestamp: "2025-11-20T..."
  },
  wouldHaveSucceeded: true,
  simulatedSideEffects: [
    { type: "EMAIL_DELIVERED", recipients: [...] }
  ],
  insights: ["Email would be sent to specified recipients"],
  warnings: []
}
```

**Supported Execution Types:**
- `EMAIL_SEND` - Email delivery simulation
- `CONTENT_PUBLISH` - Content publication simulation
- `DATA_UPDATE` - Database modification simulation

---

## Usage Examples

### Create a Playbook with Rules

```typescript
// 1. Create playbook
const playbook = await fetch("/api/operator/playbooks", {
  method: "POST",
  body: JSON.stringify({
    action: "create_playbook",
    organization_id: "org-id",
    name: "High-Risk Review Process",
    description: "Strict controls for high-risk decisions",
    risk_level: "HIGH_RISK",
  }),
});

// 2. Add a guardrail rule
await fetch("/api/operator/playbooks", {
  method: "POST",
  body: JSON.stringify({
    action: "create_rule",
    playbook_id: playbook.id,
    rule_name: "Require quorum for low-score operators",
    rule_type: "GUARDRAIL",
    conditions: { operator_score: "<60" },
    rule_action: "REQUIRE_QUORUM",
    action_params: { quorum_size: 2 },
    priority: 100,
  }),
});

// 3. Add a coaching rule
await fetch("/api/operator/playbooks", {
  method: "POST",
  body: JSON.stringify({
    action: "create_rule",
    playbook_id: playbook.id,
    rule_name: "Coach on high-risk items",
    rule_type: "COACHING",
    conditions: {},
    rule_action: "COACH",
    coaching_message: "High-risk items require extra scrutiny. Check all data sources.",
    coaching_severity: "WARNING",
    priority: 50,
  }),
});

// 4. Assign to analysts
await fetch("/api/operator/playbooks", {
  method: "POST",
  body: JSON.stringify({
    action: "assign_playbook",
    playbook_id: playbook.id,
    organization_id: "org-id",
    assignment_type: "ROLE",
    target_role: "ANALYST",
  }),
});

// 5. Activate the playbook
await fetch("/api/operator/playbooks", {
  method: "POST",
  body: JSON.stringify({
    action: "update_playbook",
    playbook_id: playbook.id,
    status: "ACTIVE",
  }),
});
```

### Evaluate Guardrails Before Action

```typescript
const result = await fetch("/api/operator/playbooks", {
  method: "POST",
  body: JSON.stringify({
    action: "evaluate",
    organization_id: "org-id",
    domain: "SEO",
    risk_level: "HIGH_RISK",
  }),
}).then(r => r.json());

if (result.result.action === "BLOCK") {
  console.log(`Blocked by rule: ${result.result.blockingRuleName}`);
} else if (result.result.requiresQuorum) {
  console.log(`Requires ${result.result.quorumSize} approvals`);
}

// Show coaching hints
for (const hint of result.result.coachingHints) {
  showHint(hint.message, hint.severity);
}
```

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `supabase/migrations/062_operator_playbooks.sql` | ~280 | Database schema |
| `src/lib/operator/guardrailPolicyService.ts` | ~450 | Guardrail engine |
| `src/app/api/operator/playbooks/route.ts` | ~400 | API endpoints |
| `src/components/operator/OperatorPlaybooksDashboard.tsx` | ~550 | UI dashboard |
| `src/lib/__tests__/guardrailPolicyService.test.ts` | ~450 | Unit tests |
| `docs/PHASE10_WEEK7_8_PLAYBOOKS_GUARDRAILS_COMPLETE.md` | ~350 | This doc |

**Total**: ~2,480 lines of code

---

## Integration Points

### With Operator Insights (Week 5-6)
- Uses operator_score from reviewer_scores
- Conditions can reference operator performance

### With Approval Queue (Week 1-2)
- Guardrails evaluated before queue item approval
- Coaching hints shown in approval interface

### With Review Thread (Week 3-4)
- Contextual hints in review discussions
- Rules can require quorum for comments

### With Autonomy Proposals (Phase 9)
- Playbooks can gate proposal execution
- Sandbox mode for testing proposals

---

## Next Steps (Week 9+)

1. **Visual Playbook Builder** - Drag-and-drop rule creation
2. **A/B Testing for Playbooks** - Compare playbook effectiveness
3. **Auto-Generated Playbooks** - AI suggests playbooks based on patterns
4. **Playbook Templates** - Pre-built playbooks for common scenarios
5. **Cross-Org Playbook Sharing** - Share best practices

---

## Testing

```bash
# Run guardrail tests
npm test -- --grep "GuardrailPolicyService"

# Run all operator tests
npm test -- --grep "operator"
```

---

## Summary

Phase 10 Week 7-8 delivers a complete playbook and guardrail system enabling:
- Structured operational procedures (playbooks)
- Rule-based guardrails with condition matching
- Training sandbox for risk-free simulation
- Contextual coaching hints
- Assignment by role or user
- 18 unit tests for reliability

The system creates a safety net for human-in-the-loop decisions while providing training opportunities through sandbox mode.
