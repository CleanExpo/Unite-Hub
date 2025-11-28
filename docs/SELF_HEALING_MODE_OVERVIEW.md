# Self-Healing Mode (Human-Governed)

> **Status**: Installed
> **Mode**: Human-Governed (no auto-apply to MAIN)
> **Access**: FOUNDER and ADMIN roles only

---

## What It Does

Self-Healing Mode continuously monitors production for errors, classifies them using ML-style pattern matching, and proposes patches for founder review. Key capabilities:

- **Continuously classifies errors** using ML-style patterns
- **Logs occurrences** to the observability layer with deduplication
- **Proposes patches** with confidence scores and diffs
- **Notifies founder** via the System Health dashboard
- **Awaits explicit approval** before any changes reach MAIN

---

## Error Categories

| Category | Severity | Description | Example Pattern |
|----------|----------|-------------|-----------------|
| `RLS_VIOLATION` | HIGH | Row Level Security policy violations | `row level security`, `policy.*denied` |
| `AUTH_FAILURE` | HIGH | Authentication/authorization errors | `JWT expired`, `401 status`, `unauthorized` |
| `SSR_HYDRATION` | MEDIUM | Server/client mismatch errors | `Text content did not match`, `Hydration failed` |
| `API_SCHEMA` | MEDIUM | Validation and schema errors | `Zod validation`, `400 status` |
| `PERFORMANCE` | HIGH | Timeouts and slow responses | `timeout`, `ETIMEDOUT` |
| `REDIRECT_LOOP` | CRITICAL | Infinite redirect chains | `ERR_TOO_MANY_REDIRECTS` |
| `DB_ERROR` | HIGH | Database constraint/connection errors | `duplicate key`, `violates.*constraint` |
| `NETWORK_ERROR` | MEDIUM | External service connectivity | `ECONNREFUSED`, `ENOTFOUND` |
| `RATE_LIMIT` | MEDIUM | API rate limiting | `429 status`, `rate limit` |
| `UI_BUG` | MEDIUM | JavaScript runtime errors | `Cannot read properties of undefined` |
| `UNKNOWN` | MEDIUM | Unrecognized error patterns | (fallback) |

---

## Severity Levels

| Level | Priority | Action Required |
|-------|----------|-----------------|
| `CRITICAL` | 4 | Immediate attention - system may be unusable |
| `HIGH` | 3 | Urgent review - affects core functionality |
| `MEDIUM` | 2 | Standard review - degraded experience |
| `LOW` | 1 | Can wait - minor inconvenience |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Production Errors                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Error Classifier                              │
│  - Pattern matching (10 categories)                              │
│  - Signature generation (deduplication)                          │
│  - Severity assignment                                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Self-Healing Service                             │
│  - Job creation/upsert (occurrence counting)                     │
│  - Patch attachment (with confidence scores)                     │
│  - Status management (lifecycle tracking)                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Founder System Health Dashboard                     │
│  - Summary cards (open jobs, severity counts)                    │
│  - Expandable job details with patches                           │
│  - Approve / Reject / Test in Sandbox actions                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Job Lifecycle

```
PENDING → ANALYSING → PATCH_GENERATED → AWAITING_APPROVAL → APPROVED → APPLIED
                                              ↓
                                          REJECTED
```

| Status | Description |
|--------|-------------|
| `PENDING` | Error logged, awaiting analysis |
| `ANALYSING` | AI is investigating root cause |
| `PATCH_GENERATED` | Patch proposal created |
| `AWAITING_APPROVAL` | Waiting for founder decision |
| `APPROVED` | Founder approved, ready to apply |
| `REJECTED` | Founder rejected the patch |
| `APPLIED` | Patch successfully applied to codebase |
| `RESOLVED` | Issue confirmed fixed |

---

## Patch Types

| Type | Description |
|------|-------------|
| `CODE_FIX` | TypeScript/JavaScript code changes |
| `SQL_MIGRATION` | Database schema or RLS policy changes |
| `CONFIG_UPDATE` | Environment or configuration changes |
| `DEPENDENCY_UPDATE` | Package version updates |
| `MANUAL_INTERVENTION` | Requires human action (documented) |

---

## Database Schema

### Tables

**`self_healing_jobs`**
- Tracks error occurrences with deduplication by signature
- Links to observability logs via `observability_log_id`
- Stores AI summary and recommended actions

**`self_healing_patches`**
- Attached to jobs, contains proposed fix details
- Includes confidence score (0-1), diff proposals
- Tracks files changed and migration paths

**`self_healing_decisions`**
- Audit trail of founder/admin decisions
- Records who approved/rejected and why
- Links to specific patch if applicable

### RLS Policies

All tables enforce:
- SELECT: FOUNDER and ADMIN roles only
- INSERT: System (service role) or FOUNDER/ADMIN
- UPDATE: FOUNDER and ADMIN roles only
- DELETE: Disabled (audit trail preservation)

---

## API Endpoints

### `/api/self-healing/jobs`

**GET** - List open self-healing jobs
- Auth: FOUNDER/ADMIN only
- Query params: `includeAll=true` for all jobs (not just open)
- Returns: `{ jobs: Job[], summary: HealthSummary }`

**POST** - Create a new self-healing job
- Auth: System or authenticated user
- Body: `{ route, method?, statusCode?, errorMessage?, stack? }`
- Returns: `{ job: Job }`

### `/api/self-healing/patches`

**GET** - List patches for a job
- Auth: FOUNDER/ADMIN only
- Query params: `jobId` (optional, omit for all pending patches)
- Returns: `{ patches: Patch[] }` or `{ job, patches, decisions }`

**POST** - Create a patch proposal
- Auth: FOUNDER/ADMIN only
- Body: `{ jobId, patchType, description, filesChanged?, confidenceScore? }`
- Returns: `{ patch: Patch }`

**PATCH** - Update patch status (approve/reject)
- Auth: FOUNDER/ADMIN only
- Body: `{ patchId, jobId, action: 'APPROVE'|'REJECT'|'APPLY_SANDBOX' }`
- Returns: `{ ok: true, decision, message }`

---

## Dashboard Location

**Route**: `/founder/system-health`

**Features**:
- Summary cards: Open Issues, Critical, High, Pending Patches, Resolved (7d)
- Job list with severity badges and time-ago formatting
- Expandable cards showing AI recommendations and patches
- Inline actions: Approve, Test in Sandbox, Reject

---

## Integration with AI Phill

The `SelfHealingOrchestratorAgent` enables natural language interaction:

```typescript
import { selfHealingAgent } from '@/lib/agents/orchestrator-self-healing';

// Structured intent
const result = await selfHealingAgent.handle({
  intent: 'get_health_summary',
});

// Natural language
const result = await selfHealingAgent.handleNaturalLanguageQuery(
  "What's broken in the system?"
);
```

**Supported Intents**:
- `diagnose_system_issue` - Create a job from error details
- `list_self_healing_jobs` - Get open jobs
- `get_job_details` - Get job with patches
- `get_health_summary` - Overall system health
- `classify_error` - Classify an error pattern
- `propose_patch` - Attach a patch to a job

**Natural Language Triggers**:
- "What is broken?" / "What's broken?"
- "System health" / "Health status"
- "Open issues" / "Pending issues"
- "Critical issues"

---

## Human-Governed Mode

**Key Principle**: No changes are applied to MAIN without explicit founder approval.

This means:
1. Errors are detected and classified automatically
2. AI proposes patches with confidence scores
3. Founder reviews in the System Health dashboard
4. Founder can Approve, Reject, or Test in Sandbox
5. Only approved patches proceed to application

**Benefits**:
- Full visibility into system health
- No surprise changes to production
- Audit trail of all decisions
- AI assistance without AI autonomy

---

## Testing

Unit tests are located at:
```
tests/unit/selfHealing/errorClassifier.test.ts
```

Run with:
```bash
npm run test:unit
```

Tests cover:
- All error category classifications
- Severity priority values
- Production-critical detection
- Signature deduplication
- Null/undefined input handling

---

## Migration

**File**: `supabase/migrations/316_self_healing_jobs_and_patches.sql`

**To Apply**:
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste the migration SQL
3. Execute
4. Verify tables exist: `self_healing_jobs`, `self_healing_patches`, `self_healing_decisions`

The migration is idempotent (safe to run multiple times).

---

## Extension Points

### Adding New Error Patterns

Edit `src/lib/selfHealing/errorClassifier.ts`:

```typescript
const ERROR_PATTERNS: ErrorPattern[] = [
  // Add new pattern
  {
    category: 'NEW_CATEGORY',
    severity: 'HIGH',
    patterns: [/your_regex_here/i],
    statusCodes: [418], // optional
    suggestedAction: 'What to do about it',
  },
  // ... existing patterns
];
```

### Adding New Patch Types

1. Update the `PatchType` type in `src/lib/selfHealing/selfHealingService.ts`
2. Add handling in the patches API route
3. Update dashboard display if needed

### Connecting to CI/CD

Future enhancement: Connect approved patches to GitHub PRs:
1. On approval, create a branch
2. Apply patch to branch
3. Create PR for review
4. Merge after CI passes

---

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/selfHealing/errorClassifier.ts` | Error pattern matching |
| `src/lib/selfHealing/selfHealingService.ts` | Core service logic |
| `src/lib/selfHealing/index.ts` | Module exports |
| `src/app/api/self-healing/jobs/route.ts` | Jobs API |
| `src/app/api/self-healing/patches/route.ts` | Patches API |
| `src/app/founder/system-health/page.tsx` | Dashboard UI |
| `src/lib/agents/orchestrator-self-healing.ts` | AI Phill integration |
| `supabase/migrations/316_*.sql` | Database schema |

---

## Troubleshooting

### "Unauthorized" on API calls
- Verify user has FOUNDER or ADMIN role in profiles table
- Check Authorization header is being sent with valid token

### Jobs not appearing
- Verify migration 316 has been applied
- Check RLS policies are correctly configured
- Verify user role in profiles table

### Patches not saving
- Check all required fields (jobId, patchType, description)
- Verify job exists before attaching patch

---

*Last Updated: 2025-11-29*
