# Decision Circuits v1.9.0 - Content Regeneration Engine (Phase 4)

## Overview

The **Content Regeneration Engine** (CX09-driven regeneration circuit) enables safe, controlled improvement of underperforming A/B test variants through AI-powered content regeneration with strict safety gates and immutability constraints.

**Core Principle**: Only losing variants can be regenerated. Winners are **immutable**. Regeneration is approval-gated (CX08), generation-gated (CX06), and brand-validated (CX05).

---

## Safety Architecture

### Hard Constraints (Non-Negotiable)

1. **Winners are immutable** — Winning variants NEVER regenerated
2. **Losers only** — Only CX09-terminated losing variants eligible
3. **CX08 approval required** — Cannot regenerate without approval
4. **CX06 generation required** — Must use CX06 for content generation (no fallback pathways)
5. **CX05 validation required** — Brand Guard must validate all generated content
6. **No auto-publishing** — Regenerated variants stored only; execution agents still required
7. **Max 2 per test** — At most 2 regenerations allowed per A/B test
8. **48-hour cooldown** — Cannot regenerate same test within 48 hours of last regeneration

### Eligibility Gates

Before regeneration can proceed, the variant must pass all eligibility checks:

```typescript
interface RegenerationEligibility {
  eligible: boolean;
  reason: string;                          // Human-readable eligibility status
  violations: string[];                    // Detailed violation reasons
  variant_exists: boolean;                 // Variant found in test definition
  cx09_termination_found: boolean;         // CX09 marked as "terminate"
  confidence_meets_threshold: boolean;     // Confidence >= 0.95
  delta_negative: boolean;                 // Performance delta < 0 (underperforming)
  regenerations_count: number;             // Current regenerations for test
  cooldown_remaining_hours: number;        // Hours remaining before cooldown expires
}
```

**Eligibility Violations**:

- `variant_not_found` — Variant ID doesn't exist in test definition
- `cx09_termination_not_found` — CX09 decision was not "terminate"
- `confidence_below_threshold` — Confidence < 0.95
- `delta_not_negative` — Delta >= 0 (not underperforming)
- `max_regenerations_exceeded` — Already regenerated 2 times for this test
- `cooldown_period_active` — Must wait 48 hours since last regeneration
- `winning_variant` — Cannot regenerate the winning variant

---

## Workflow

### Phase 1: Eligibility & Approval

```
Request
   ↓
[checkEligibility] ← Validates test exists, variant terminated, confidence ≥0.95, delta <0
   ↓
ELIGIBLE? ─→ NO → Return 403 with violations
   ↓ YES
[enforceGuardrails] ← Checks max 2/test, 48h cooldown
   ↓
GUARDRAILS PASS? ─→ NO → Return 403 with guardrail violations
   ↓ YES
[requestCX08Approval] ← Sends to CX08_SELF_CORRECTION
   ↓
CX08 APPROVED? ─→ NO → Log rejection, return failure
   ↓ YES
→ Continue to Phase 2
```

### Phase 2: Content Generation

```
[generateViaCX06] ← Calls CX06_CONTENT_GENERATION with parent variant + instructions
   ↓
GENERATION SUCCESS? ─→ NO → Log cx06_generation_failed, return failure
   ↓ YES
Generated variant contains:
  - new_variant_id (UUID)
  - new_variant_content (JSONB: subject, body, cta, etc.)
  - generation_timestamp
   ↓
→ Continue to Phase 3
```

### Phase 3: Brand Validation

```
[validateViaCX05] ← Calls CX05_BRAND_GUARD with generated content
   ↓
VALIDATION PASS? ─→ NO (score <0.80) → Log cx05_failed, return failure
   ↓ YES (score >=0.80)
Validation result includes:
  - validation_score (0-1)
  - brand_guideline_checks (array)
  - tone_consistency_check
   ↓
→ Continue to Phase 4
```

### Phase 4: Registration & Audit

```
[registerNewVariant] ← Creates variant lineage record
   ↓
Inserts into:
  - circuit_variants (new_variant_id, content, metadata)
  - content_variant_lineage (parent→child relationship)
   ↓
[logRegenerationEvent] ← Records complete workflow in audit trail
   ↓
Stores:
  - status: 'registered'
  - all circuit approvals (cx08, cx06, cx05)
  - complete JSONB payloads from each circuit
  - duration_ms
   ↓
COMPLETE → Return new_variant_id to client
```

---

## Database Schema

### Table: content_regeneration_events

**Purpose**: Audit trail for all regeneration workflows (initiated through registered)

```sql
CREATE TABLE content_regeneration_events (
  id UUID PRIMARY KEY,
  workspace_id UUID,                   -- Tenant isolation
  ab_test_id TEXT,                     -- Which test triggered regeneration
  parent_variant_id TEXT,              -- Original losing variant
  new_variant_id TEXT,                 -- Generated replacement (NULL if failed)
  new_variant_content JSONB,           -- Complete generated content

  -- Workflow status
  status content_regeneration_status,  -- initiated|cx08_approved|cx08_rejected|cx06_generated|cx05_passed|cx05_failed|registered|failed
  initiated_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,

  -- Circuit approvals and results
  circuit_execution_id TEXT,           -- Links to circuit_execution_logs
  termination_reason TEXT,             -- Why CX09 terminated this variant
  confidence_score NUMERIC,            -- 0.95+ required
  performance_delta NUMERIC,           -- Negative (underperforming)

  cx08_approval_signal JSONB,          -- CX08_SELF_CORRECTION response
  cx08_approved_at TIMESTAMP,
  cx08_approved BOOLEAN,

  cx06_generation_result JSONB,        -- Full CX06 generation response
  cx06_generated_at TIMESTAMP,
  cx06_generated BOOLEAN,

  cx05_validation_result JSONB,        -- Brand Guard validation checks
  cx05_validation_score NUMERIC,       -- 0-1, must be >=0.80
  cx05_validated_at TIMESTAMP,
  cx05_validation_passed BOOLEAN,

  -- Failure tracking
  failure_reason TEXT,                 -- Why regeneration failed (if status='failed')
  failure_details JSONB,

  -- Metadata
  regeneration_instructions TEXT,      -- Optional custom instructions
  generated_by TEXT,                   -- 'automated' or 'manual'
  created_at TIMESTAMP,

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  INDEX (workspace_id, ab_test_id),
  INDEX (parent_variant_id),
  INDEX (new_variant_id),
  INDEX (status),
  INDEX (created_at DESC)
}
```

### Table: content_variant_lineage

**Purpose**: Track parent→child variant relationships through regeneration generations

```sql
CREATE TABLE content_variant_lineage (
  id UUID PRIMARY KEY,
  workspace_id UUID,                   -- Tenant isolation
  ab_test_id TEXT,                     -- Which test
  parent_variant_id TEXT,              -- Original variant
  child_variant_id TEXT,               -- Regenerated variant

  -- Lineage tracking
  depth INTEGER CHECK (depth BETWEEN 1 AND 10),  -- Max 10 generations
  regeneration_event_id UUID,                    -- Reference to content_regeneration_events

  -- Status
  is_active BOOLEAN DEFAULT TRUE,      -- Can be deactivated if child is replaced
  created_at TIMESTAMP,

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  UNIQUE (workspace_id, ab_test_id, parent_variant_id, child_variant_id),
  INDEX (workspace_id, ab_test_id),
  INDEX (parent_variant_id),
  INDEX (child_variant_id)
}
```

### Row Level Security (RLS)

Both tables enforce workspace isolation:

```sql
ALTER TABLE content_regeneration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON content_regeneration_events
  FOR ALL USING (workspace_id = get_current_workspace_id());

ALTER TABLE content_variant_lineage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON content_variant_lineage
  FOR ALL USING (workspace_id = get_current_workspace_id());
```

---

## API Reference

### POST /api/circuits/content/regenerate

**Regenerate an underperforming variant**

**Request**:

```bash
curl -X POST https://api.example.com/api/circuits/content/regenerate?workspaceId=uuid-here \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d {
    "ab_test_id": "test_summer_email_2024",
    "losing_variant_id": "var_b_original",
    "circuit_execution_id": "exec_12345",
    "termination_reason": "underperforming: conversion rate 2.1% vs control 3.2%",
    "confidence_score": 0.97,
    "performance_delta": -1.1,
    "regeneration_instructions": "Increase urgency in CTA. Test 'Limited time' angle.",
    "generated_by": "manual"
  }
```

**Required Fields**:

| Field | Type | Constraint | Description |
|-------|------|-----------|-------------|
| `ab_test_id` | string | Non-empty | A/B test identifier |
| `losing_variant_id` | string | Non-empty | Variant UUID to regenerate |
| `circuit_execution_id` | string | Non-empty | Links to circuit_execution_logs |
| `termination_reason` | string | Non-empty | Why CX09 terminated this variant |
| `confidence_score` | number | 0-1, ≥0.95 | Confidence in termination decision |
| `performance_delta` | number | <0 | Performance difference (negative) |

**Optional Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `regeneration_instructions` | string | Custom instructions for CX06 generation |
| `generated_by` | 'automated' \| 'manual' | Origin of regeneration request (default: 'automated') |

**Response (200 - Success)**:

```json
{
  "workspace_id": "uuid",
  "regeneration_result": {
    "success": true,
    "regeneration_event_id": "event_uuid",
    "new_variant_id": "var_b_regenerated_v1",
    "status": "registered",
    "cx08_approved": true,
    "cx06_generated": true,
    "cx05_passed": true,
    "cx05_score": 0.92,
    "duration_ms": 2847,
    "reason": "Successfully regenerated variant with brand validation score 0.92"
  },
  "timestamp": "2024-12-15T10:23:45Z"
}
```

**Response (403 - Not Eligible)**:

```json
{
  "error": "Not eligible for regeneration: variant terminated but max regenerations exceeded",
  "violations": [
    "max_regenerations_exceeded: Already 2 regenerations for test",
    "cooldown_period_active: 36 hours remaining before cooldown expires"
  ],
  "workspace_id": "uuid",
  "timestamp": "2024-12-15T10:23:45Z"
}
```

**Response (400 - Validation Error)**:

```json
{
  "error": "Missing required fields: confidence_score, performance_delta",
  "workspace_id": "uuid",
  "timestamp": "2024-12-15T10:23:45Z"
}
```

---

### GET /api/circuits/content/lineage

**Retrieve variant lineage and regeneration history**

**Request**:

```bash
curl -X GET "https://api.example.com/api/circuits/content/lineage?workspaceId=uuid&abTestId=test_id&variantId=var_id" \
  -H "Authorization: Bearer token"
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspaceId` | string | Yes | Workspace identifier |
| `abTestId` | string | Yes | A/B test identifier |
| `variantId` | string | Yes | Variant to trace |

**Response (200 - Success)**:

```json
{
  "workspace_id": "uuid",
  "ab_test_id": "test_summer_email_2024",
  "variant_id": "var_b_original",
  "lineage": {
    "parents": [
      {
        "child_variant_id": "var_b_original",
        "parent_variant_id": "var_b_baseline",
        "depth": 1,
        "created_at": "2024-11-01T00:00:00Z"
      }
    ],
    "children": [
      {
        "child_variant_id": "var_b_regenerated_v1",
        "parent_variant_id": "var_b_original",
        "depth": 2,
        "created_at": "2024-12-15T10:23:45Z"
      }
    ],
    "total_parents": 1,
    "total_children": 1
  },
  "regeneration_history": {
    "total_events": 1,
    "recent_events": [
      {
        "event_id": "event_uuid",
        "status": "registered",
        "parent_variant": "var_b_original",
        "child_variant": "var_b_regenerated_v1",
        "confidence_score": 0.97,
        "performance_delta": -1.1,
        "cx08_approved": true,
        "cx06_generated": true,
        "cx05_passed": true,
        "cx05_score": 0.92,
        "initiated_at": "2024-12-15T10:20:00Z",
        "completed_at": "2024-12-15T10:23:45Z",
        "duration_ms": 3456
      }
    ]
  },
  "timestamp": "2024-12-15T10:24:00Z"
}
```

---

## Guardrails Configuration

### Default Guardrails

```typescript
const DEFAULT_REGENERATION_GUARDRAILS = {
  minimum_confidence: 0.95,              // ≥ 95% confidence required
  max_regenerations_per_test: 2,         // Max 2 regenerations per test
  cooldown_hours_between_regenerations: 48,  // 48-hour cooldown
  max_parallel_regenerations: 1,         // No parallel regenerations (sequential only)
  retry_on_circuit_failure: false,       // No automatic retries
  on_circuit_failure: 'return_failure',  // Return error instead of auto-retry
} as const;
```

### Customization

Guardrails are **not customizable per workspace**. They are system-level constraints to ensure safety.

To change guardrails:
1. Update `DEFAULT_REGENERATION_GUARDRAILS` constant in `src/lib/decision-circuits/content-regeneration-types.ts`
2. Run database migrations (if schema changes needed)
3. Deploy changes

---

## Usage Examples

### Example 1: Basic Regeneration Request

```typescript
const response = await fetch('/api/circuits/content/regenerate?workspaceId=workspace-123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ab_test_id: 'test_email_subject_2024',
    losing_variant_id: 'var_subject_b',
    circuit_execution_id: 'exec_cx09_12345',
    termination_reason: 'Subject line B significantly underperforming',
    confidence_score: 0.96,
    performance_delta: -2.3,
    regeneration_instructions: 'Focus on emotional triggers and scarcity',
  }),
});

const result = await response.json();
if (result.regeneration_result.success) {
  console.log(`New variant: ${result.regeneration_result.new_variant_id}`);
} else {
  console.error(`Regeneration failed: ${result.regeneration_result.reason}`);
}
```

### Example 2: Check Variant Lineage

```typescript
const lineageResponse = await fetch(
  '/api/circuits/content/lineage?workspaceId=workspace-123&abTestId=test_email_subject_2024&variantId=var_subject_b'
);

const lineage = await lineageResponse.json();

// Trace full parent chain
console.log('Parents:', lineage.lineage.parents);
console.log('Children:', lineage.lineage.children);

// Show recent regeneration events
for (const event of lineage.regeneration_history.recent_events) {
  console.log(`Regeneration ${event.event_id}:`);
  console.log(`  Parent: ${event.parent_variant}`);
  console.log(`  Child: ${event.child_variant}`);
  console.log(`  CX05 Score: ${event.cx05_score}`);
  console.log(`  Status: ${event.status}`);
}
```

### Example 3: Handle Ineligibility

```typescript
try {
  const response = await fetch('/api/circuits/content/regenerate?workspaceId=workspace-123', {
    method: 'POST',
    body: JSON.stringify({ /* ... */ }),
  });

  const result = await response.json();

  if (!response.ok) {
    // 403 Forbidden - Ineligible
    if (response.status === 403) {
      console.error('Ineligibility violations:');
      result.violations.forEach(v => console.error(`  - ${v}`));
      return;
    }
  }

  // Success
  console.log(`Regenerated: ${result.regeneration_result.new_variant_id}`);
} catch (error) {
  console.error('API error:', error);
}
```

---

## Troubleshooting

### Issue: "max_regenerations_exceeded"

**Cause**: Test has already been regenerated 2 times.

**Solution**:
- Wait for next iteration or create new A/B test
- Review generated variants from previous regenerations
- If critical improvement needed, reach out to platform team for exception

### Issue: "cooldown_period_active"

**Cause**: Last regeneration was less than 48 hours ago.

**Solution**:
- Wait the remaining cooldown period
- Cooldown resets after 48 hours from last regeneration timestamp
- Check `cooldown_remaining_hours` in eligibility response to see exact wait time

### Issue: "cx08_rejected"

**Cause**: CX08_SELF_CORRECTION rejected the regeneration request (confidence too low or context insufficient).

**Solution**:
- Ensure confidence_score ≥ 0.95
- Provide detailed `regeneration_instructions` with specific improvement goals
- Retry after resolving underlying confidence issue

### Issue: "cx05_failed - validation_score < 0.80"

**Cause**: Generated content failed brand validation (score < 0.80).

**Solution**:
- CX05 validation details available in `cx05_validation_result` JSONB field
- Review specific brand guideline violations returned by CX05
- Retry with more specific `regeneration_instructions` addressing brand concerns
- Or manually adjust generated content via CX06 with refined prompts

### Issue: "variant_not_found"

**Cause**: Variant ID doesn't exist in the test definition.

**Solution**:
- Verify variant ID matches actual variant in test
- Check test definition to confirm variant exists
- Use lineage endpoint to trace variant history

---

## Integration Points

### Upstream: CX09 (A/B Testing)

- **Signal**: CX09 emits `'terminate'` decision for losing variants
- **Data Used**: Confidence score, performance delta, termination reason
- **Workflow**: Only variants with CX09 termination decision are eligible

### Downstream: CX08 (Self-Correction)

- **Signal**: Regeneration requests approval/veto from CX08
- **Data Sent**: Parent variant content, regeneration instructions, confidence score
- **Response**: Approval decision + reasoning

### Downstream: CX06 (Content Generation)

- **Signal**: Approved regenerations trigger CX06 generation
- **Data Sent**: Parent variant content, regeneration instructions, performance context
- **Response**: New generated content (subject, body, CTA, metadata)

### Downstream: CX05 (Brand Guard)

- **Signal**: Generated content validation request
- **Data Sent**: Generated variant content, brand guidelines
- **Response**: Validation score (0-1) + brand guideline check results

### Note on Execution

- **CX04** (Email Executor) or **AGENT_SOCIAL_EXECUTOR** must be called separately
- Content regeneration only creates/registers variants; it does NOT publish
- Execution agents determine if/when to test regenerated variants

---

## Audit & Compliance

### Complete Event Trail

Every regeneration attempt is logged with:
- Timestamp (initiated_at, completed_at)
- Variant IDs (parent, child)
- All circuit responses (CX08, CX06, CX05)
- Validation scores
- Failure reasons (if applicable)
- Duration (ms)
- User/system attribution (generated_by)

### Data Retention

- Events stored indefinitely for audit purposes
- RLS enforced per workspace
- Lineage preserved even if variant is replaced

### Compliance Notes

- All regeneration decisions are deterministic and reproducible
- Complete approval chain documented (CX08 → CX06 → CX05)
- No content changes without explicit gate approvals
- Winners never modified (immutable constraint enforced)

---

## Performance Characteristics

### Latency

- Eligibility check: ~50ms (database queries)
- CX08 approval: 500-2000ms (API call to CX08 circuit)
- CX06 generation: 2000-5000ms (AI generation via Claude)
- CX05 validation: 500-1500ms (brand validation rules engine)
- **Total**: ~3-9 seconds end-to-end

### Throughput

- Sequential execution (max_parallel_regenerations: 1)
- No queueing — blocking API call pattern
- Rate limiting via cooldown (1 per 48 hours per test)

### Scalability

- Workspace isolation via RLS ensures multi-tenant safety
- No cross-workspace queries
- Index strategy (workspace_id, ab_test_id, status) optimizes common queries

---

## Known Limitations

1. **No Parallel Regenerations** — Only 1 regeneration per test at a time
2. **No Auto-Rollback** — Unlike traffic allocation, regenerations don't auto-rollback on failure
3. **Max 2 Generations** — Deep lineage (>10 generations) not supported
4. **No Variant Deletion** — Regenerated variants cannot be deleted (immutable audit trail)
5. **Manual Execution** — Regenerated variants still require manual execution agent calls

---

## Version History

**v1.9.0** (Current)
- Initial release: Content regeneration engine
- CX08/CX06/CX05 approval gates
- Lineage tracking
- Guardrail enforcement (max 2/test, 48h cooldown)

---

## See Also

- [Decision Circuits Overview](./DECISION-CIRCUITS.md)
- [CX09 A/B Testing](./DECISION-CIRCUITS-CX09-AB-TESTING.md)
- [Traffic Allocation (CX09 Phase 3)](./DECISION-CIRCUITS-TRAFFIC-ALLOCATION.md)
- [Schema Reference](./schema-reference.md)
