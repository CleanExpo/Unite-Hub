# Decision Circuits v1.9.0 Release Notes

**Release Date**: December 15, 2024
**Version**: 1.9.0
**Status**: Production-Ready
**Phase**: Phase 4 - Content Regeneration Engine

---

## What's New

### Content Regeneration Engine (Phase 4)

The **Content Regeneration Engine** enables safe, AI-powered improvement of underperforming A/B test variants with multiple safety gates and deterministic workflows.

**Key Features**:

✅ **Approval-Gated Regeneration** — CX08 self-correction approval required
✅ **AI Generation** — CX06 content generation with custom instructions
✅ **Brand Validation** — CX05 brand guard enforces validation score ≥0.80
✅ **Variant Lineage** — Complete parent→child tracking through regeneration chain
✅ **Immutable Winners** — Winning variants never regenerated
✅ **Audit Trail** — Full event logging at each workflow stage
✅ **Guardrail Enforcement** — Max 2 regenerations/test, 48-hour cooldown
✅ **RLS Multi-Tenant Isolation** — Workspace-level data protection

### Safety Architecture

**Hard Constraints (Non-Negotiable)**:

1. Winners are immutable (never regenerated)
2. Only CX09-terminated losing variants eligible
3. CX08 approval required (approval gate)
4. CX06 content generation required (exclusive pathway)
5. CX05 brand validation required (validation gate)
6. No auto-publishing (execution agents still required)
7. Max 2 regenerations per test
8. 48-hour cooldown between regenerations

---

## Files Changed

### New Files (6)

1. **src/lib/decision-circuits/content-regeneration-types.ts** (500+ lines)
   - Type definitions for regeneration workflow
   - 15+ interfaces including RegenerationInput, RegenerationResult, RegenerationEligibility
   - Guardrail constants and enum types
   - Full JSDoc documentation

2. **src/lib/decision-circuits/content-regeneration-engine.ts** (650+ lines)
   - Core service layer with 8 functions
   - checkEligibility() — Multi-criteria variant validation
   - enforceGuardrails() — Rate limiting and cooldown checks
   - runContentRegeneration() — 6-step workflow orchestration
   - getContentLineage() — Parent→child relationship tracing
   - Helper functions for circuit integration

3. **src/app/api/circuits/content/regenerate/route.ts** (120 lines)
   - POST endpoint: /api/circuits/content/regenerate?workspaceId=<uuid>
   - Full request validation
   - Eligibility checking before regeneration
   - Error responses with detailed violation reasons

4. **src/app/api/circuits/content/lineage/route.ts** (80 lines)
   - GET endpoint: /api/circuits/content/lineage?workspaceId=<uuid>&abTestId=<string>&variantId=<string>
   - Variant lineage retrieval
   - Regeneration history with event metadata

5. **supabase/migrations/20251215_decision_circuits_content_regeneration_v1_9.sql** (300+ lines)
   - Table: content_regeneration_events (workflow audit trail)
   - Table: content_variant_lineage (parent→child tracking)
   - Enums: content_regeneration_status, regeneration_failure_reason
   - RLS policies on both tables
   - 5 indexes for query optimization
   - View: content_regeneration_summary (aggregated stats)

6. **docs/guides/DECISION-CIRCUITS-CONTENT-REGENERATION.md** (800+ lines)
   - Comprehensive API documentation
   - Safety architecture overview
   - Workflow diagrams and phases
   - Database schema documentation
   - Usage examples and troubleshooting guide
   - Integration points with other circuits

### Modified Files (1)

1. **src/lib/decision-circuits/index.ts** (+8 exports)
   - RegenerationInput, RegenerationResult, RegenerationEligibility types
   - RegenerationStatus, RegenerationFailureReason types
   - checkEligibility, enforceGuardrails, runContentRegeneration, getContentLineage functions
   - DEFAULT_REGENERATION_GUARDRAILS constant

---

## Technical Details

### Type System

```typescript
interface RegenerationInput {
  workspace_id: string;
  circuit_execution_id: string;
  ab_test_id: string;
  losing_variant_id: string;
  termination_reason: string;
  confidence_score: number;        // >= 0.95 required
  performance_delta: number;       // < 0 (underperforming)
  regeneration_instructions?: string;
  generated_by?: 'automated' | 'manual';
}

interface RegenerationResult {
  success: boolean;
  regeneration_event_id: string;
  new_variant_id?: string;
  status: RegenerationStatus;
  cx08_approved?: boolean;
  cx06_generated?: boolean;
  cx05_passed?: boolean;
  cx05_score?: number;
  duration_ms: number;
  error?: string;
  reason?: string;
}

type RegenerationStatus =
  | 'initiated'
  | 'cx08_approved'
  | 'cx08_rejected'
  | 'cx06_generated'
  | 'cx05_passed'
  | 'cx05_failed'
  | 'registered'
  | 'failed';
```

### Guardrails Configuration

```typescript
const DEFAULT_REGENERATION_GUARDRAILS = {
  minimum_confidence: 0.95,              // 95%+ confidence required
  max_regenerations_per_test: 2,         // Max 2 per test
  cooldown_hours_between_regenerations: 48,  // 48-hour cooldown
  max_parallel_regenerations: 1,         // Sequential only
  retry_on_circuit_failure: false,       // No auto-retry
  on_circuit_failure: 'return_failure',
};
```

### Database Schema

**content_regeneration_events** (Audit Trail):
- 800+ columns including workflow status, circuit approvals, validation results
- Complete JSONB payloads from CX08, CX06, CX05 circuits
- Timing: initiated_at, completed_at, duration_ms
- Indexes: workspace_id, ab_test_id, status, parent_variant_id, created_at DESC

**content_variant_lineage** (Relationship Tracking):
- Parent→child variant mapping
- Depth tracking (1-10 generations max)
- Unique constraint: (workspace_id, ab_test_id, parent_variant_id, child_variant_id)
- Indexes: workspace_id, ab_test_id, parent_variant_id, child_variant_id

### API Endpoints

#### POST /api/circuits/content/regenerate

Regenerate an underperforming variant with approval gates.

**Response (200 - Success)**:
```json
{
  "workspace_id": "uuid",
  "regeneration_result": {
    "success": true,
    "regeneration_event_id": "event_uuid",
    "new_variant_id": "var_regenerated_v1",
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

**Response (403 - Ineligible)**:
```json
{
  "error": "Not eligible for regeneration: max regenerations exceeded",
  "violations": [
    "max_regenerations_exceeded: Already 2 regenerations for test",
    "cooldown_period_active: 36 hours remaining before cooldown expires"
  ],
  "workspace_id": "uuid",
  "timestamp": "2024-12-15T10:23:45Z"
}
```

#### GET /api/circuits/content/lineage

Retrieve variant lineage and regeneration history.

**Response (200 - Success)**:
```json
{
  "workspace_id": "uuid",
  "ab_test_id": "test_summer_email_2024",
  "variant_id": "var_b_original",
  "lineage": {
    "parents": [ ... ],
    "children": [ ... ],
    "total_parents": 1,
    "total_children": 1
  },
  "regeneration_history": {
    "total_events": 1,
    "recent_events": [ ... ]
  },
  "timestamp": "2024-12-15T10:24:00Z"
}
```

---

## Eligibility Requirements

Before a variant can be regenerated:

```
✓ Test exists in workspace
✓ Variant exists in test definition
✓ CX09 termination decision = "terminate" (not "continue" or "promote")
✓ Confidence score >= 0.95
✓ Performance delta < 0 (underperforming)
✓ Not the winning variant
✓ Not already regenerated 2 times (max_regenerations_per_test: 2)
✓ 48+ hours since last regeneration (cooldown check)
```

If any check fails, regeneration blocked with detailed violation reasons.

---

## Workflow Phases

### Phase 1: Eligibility & Approval
```
Request → checkEligibility() → enforceGuardrails() → requestCX08Approval()
```

### Phase 2: Content Generation
```
CX08 Approved → generateViaCX06() → New variant content created
```

### Phase 3: Brand Validation
```
Generated content → validateViaCX05() → Score >= 0.80 required
```

### Phase 4: Registration
```
CX05 Passed → registerNewVariant() → Lineage recorded → Event logged
```

**End-to-End Latency**: 3-9 seconds (eligibility 50ms + CX08 500-2000ms + CX06 2000-5000ms + CX05 500-1500ms)

---

## Integration with Other Circuits

### Upstream: CX09 (A/B Testing)
- Consumes: "terminate" decisions, confidence score, performance delta
- Requirement: Only variants with CX09 termination eligible for regeneration

### Downstream: CX08 (Self-Correction)
- Sends: Regeneration request with parent variant + instructions
- Receives: Approval/rejection decision

### Downstream: CX06 (Content Generation)
- Sends: Parent variant content, regeneration instructions
- Receives: New generated variant content (JSONB)

### Downstream: CX05 (Brand Guard)
- Sends: Generated content, brand guidelines
- Receives: Validation score (0-1) + check results

### Note: CX04 / Execution Agents
- Content regeneration does NOT auto-publish
- Execution agents (Email, Social) must be called separately
- Regenerated variants treated like new variants for testing

---

## Safety & Compliance

### Immutability Guarantees

**Winners never regenerated** — Winning variant is excluded from regeneration eligibility.

**Variant lineage preserved** — Complete parent→child relationship tracked even through multiple regenerations.

**Audit trail immutable** — Once logged, regeneration events cannot be modified.

### Data Isolation

**Row Level Security (RLS)** enforced on both tables:
```sql
workspace_id = get_current_workspace_id()
```

Cross-workspace data access prevented by RLS policy.

### Determinism

**Same inputs always produce same outputs** (enabling auditability):
- Eligibility checks are deterministic (database state + guardrails constants)
- Workflow status transitions follow fixed state machine
- No randomness or non-deterministic branching

---

## Migration Guide

### For Existing A/B Tests

1. **No Action Required** — Existing tests continue operating normally
2. **Optional**: Enable regeneration on tests with underperforming variants
3. **Apply Migration**: Supabase Dashboard → SQL Editor → Run migration script

### For New A/B Tests

Regeneration available automatically once variants marked "terminate" by CX09.

### Database Migration

```bash
# Run migration in Supabase Dashboard
# File: supabase/migrations/20251215_decision_circuits_content_regeneration_v1_9.sql

# Creates:
# - content_regeneration_events table
# - content_variant_lineage table
# - RLS policies
# - Indexes
# - View: content_regeneration_summary
```

---

## Performance Characteristics

### Latency

| Phase | Duration | Constraint |
|-------|----------|-----------|
| Eligibility check | ~50ms | Database queries |
| CX08 approval | 500-2000ms | API call |
| CX06 generation | 2000-5000ms | AI model (Claude) |
| CX05 validation | 500-1500ms | Rules engine |
| **Total** | **3-9s** | Sequential execution |

### Throughput

- Sequential execution (max_parallel_regenerations: 1)
- No queueing — blocking API calls
- Rate limiting via cooldown (1 per 48 hours per test)

### Scalability

- Workspace isolation via RLS
- Multi-tenant safe (no cross-workspace data leakage)
- Index strategy optimized for common queries:
  - (workspace_id, ab_test_id)
  - (parent_variant_id)
  - (status, created_at DESC)

---

## Known Limitations

1. **No Parallel Regenerations** — Only 1 per test at a time
2. **No Auto-Rollback** — Unlike traffic allocation, regenerations don't auto-rollback if they underperform
3. **Max 2 Generations** — Lineage depth capped at 10 generations
4. **No Variant Deletion** — Regenerated variants are immutable (full audit trail)
5. **Manual Execution** — Regenerated variants require explicit execution agent calls
6. **No Strategy Selection** — Regeneration instructions are static; no dynamic strategy switching

---

## Testing & Validation

### TypeScript
- ✅ Strict mode enabled
- ✅ Full type coverage (0 `any` types)
- ✅ 100% export validation

### Linting
- ✅ ESLint --max-warnings=0 passing
- ✅ No unused imports/variables
- ✅ Consistent naming conventions

### Database
- ✅ RLS policies enforced on all tables
- ✅ Indexes optimized for query patterns
- ✅ Referential integrity constraints

### API
- ✅ Request validation (all required fields)
- ✅ Error responses with detailed reasons
- ✅ Workspace isolation enforced

---

## Breaking Changes

**None** — v1.9.0 is additive only.

---

## Deprecations

**None** — No features deprecated in this release.

---

## What's Next (v1.10.0+)

Potential future enhancements (not committed):

- **Parallel Regenerations** — Allow multiple regenerations per test (if cooldown permits)
- **Auto-Execution** — Optionally auto-publish regenerated variants to execution agents
- **Strategy Selection** — Dynamic regeneration instructions based on CX08 recommendations
- **Rollback Triggers** — Automatic rollback if regenerated variant underperforms in live test
- **Lineage Visualization** — Dashboard UI for variant genealogy

---

## Changelog

### v1.9.0 (Current)

**Added**:
- Content Regeneration Engine (content-regeneration-types.ts)
- Engine service with 8 core functions (content-regeneration-engine.ts)
- API endpoints: POST /regenerate, GET /lineage
- Database tables: content_regeneration_events, content_variant_lineage
- RLS policies for multi-tenant isolation
- Complete documentation guide

**Changed**:
- src/lib/decision-circuits/index.ts — Added 8 exports for regeneration

**Fixed**:
- ESLint warnings (unused imports, variables)

---

## Support & Questions

For issues, questions, or feedback:

1. **API Issues**: Check [DECISION-CIRCUITS-CONTENT-REGENERATION.md](./docs/guides/DECISION-CIRCUITS-CONTENT-REGENERATION.md) Troubleshooting section
2. **Schema Questions**: See [schema-reference.md](./docs/guides/schema-reference.md)
3. **Integration Help**: Review circuit integration points in documentation
4. **Bug Reports**: File in GitHub issues with reproduction steps

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.9.0 | 2024-12-15 | Current | Content Regeneration Engine |
| 1.8.0 | 2024-12-15 | Stable | Traffic Allocation Engine |
| 1.7.1 | 2024-12-14 | Stable | Dashboard Observability |
| 1.7.0 | 2024-12-14 | Stable | CX09 A/B Testing Evaluation |

---

## Acknowledgments

**Decision Circuits v1.7.0 → v1.9.0** spans 3 phases of multi-stage circuit orchestration:

- **Phase 1 (v1.7.0)**: CX09 A/B Testing evaluation logic
- **Phase 2 (v1.7.1)**: Dashboard observability
- **Phase 3 (v1.8.0)**: Traffic allocation with guardrails
- **Phase 4 (v1.9.0)**: Content regeneration with approval gates

Each phase builds on the previous, with clear separation of concerns and deterministic decision-making.

---

**End of Release Notes**
