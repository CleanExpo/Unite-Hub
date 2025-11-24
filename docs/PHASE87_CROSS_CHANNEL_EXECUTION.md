# Phase 87: Cross-Channel Publishing Execution Layer

## Overview

Phase 87 upgrades the draft-mode posting from Phase 85 to real publishing with comprehensive preflight validation, channel-specific execution, and rollback capability.

## Architecture

```
Schedule Ready → Preflight Engine → Execute → Audit → Rollback (if needed)
                      ↓
               7-Point Validation
                      ↓
          Early Warning | Performance Reality
          Scaling Mode | Client Policy
          Fatigue | Compliance | Truth Layer
```

## Components

### Database (Migration 130)

3 tables created:
- `posting_preflight_checks` - Safety checks before execution
- `posting_executions` - Real posting outcomes
- `rollback_log` - Post removal/retraction actions

### Backend Services

Located in `src/lib/postingExecution/`:

1. **postingExecutionTypes.ts** - Type definitions
2. **preflightService.ts** - Run all checks before execution
3. **executionService.ts** - Execute posts and record outcomes
4. **channelExecutionAdapterService.ts** - Per-channel posting adapters
5. **rollbackService.ts** - Post removal capability
6. **postingExecutionSchedulerService.ts** - Process scheduled posts

### API Routes

- `POST /api/posting-execution/preflight` - Run preflight checks
- `GET /api/posting-execution/preflight` - List preflights
- `POST /api/posting-execution/execute` - Execute post
- `GET /api/posting-execution/execute` - List executions, stats
- `POST /api/posting-execution/rollback` - Initiate rollback
- `GET /api/posting-execution/rollback` - List rollbacks
- `POST /api/posting-execution/scheduler` - Process due schedules
- `GET /api/posting-execution/scheduler` - Get scheduler status

### UI Components

- `PreflightTable.tsx` - Display preflight check results
- `ExecutionHistoryTable.tsx` - Display execution results with retry/rollback
- `RollbackTable.tsx` - Display rollback actions

### Founder Page

`/founder/posting-execution` - Execution console with:
- Execution stats (total, success, failed, rolled back, pending)
- Scheduler status (due, processing, blocked, completed today)
- Tabbed view: Executions, Preflights, Rollbacks
- Actions: Process schedules, retry failed, initiate rollback

## 7-Point Preflight Validation

1. **Early Warning Check** - No active critical warnings
2. **Performance Reality Check** - Confidence score > 30%
3. **Scaling Mode Check** - Not frozen, capacity < 95%
4. **Client Policy Check** - Channel not blocked for client
5. **Fatigue Check** - Not exceeding channel limits (24h)
6. **Compliance Check** - No banned patterns in content
7. **Truth Layer Check** - No unverified claims

## Channel Support

### Execution Supported
- Facebook (Graph API)
- Instagram (Graph API)
- TikTok (Content Posting API)
- LinkedIn (UGC Posts API)
- YouTube (Data API)
- Google My Business (Business API)
- Reddit (OAuth API)
- Email (Multi-provider)
- X/Twitter (v2 API)

### Rollback Supported
- Facebook ✅
- LinkedIn ✅
- X/Twitter ✅
- Reddit ✅
- YouTube ✅
- GMB ✅

### Rollback Not Supported
- Instagram ❌ (no programmatic deletion)
- TikTok ❌ (no programmatic deletion)
- Email ❌ (cannot recall sent emails)

## Channel Fatigue Limits (24h)

| Channel | Max Posts |
|---------|-----------|
| fb | 3 |
| ig | 5 |
| tiktok | 5 |
| linkedin | 2 |
| youtube | 1 |
| gmb | 2 |
| reddit | 3 |
| email | 2 |
| x | 10 |

## Compliance Patterns (Blocked)

- "guaranteed results"
- "100% success"
- "get rich quick"
- "free money"
- "click here now"
- "act now"
- "limited time only"

## Truth Layer Patterns (Flagged)

- "best in class"
- "#1 rated"
- "industry leading"
- "world's first"

## Risk Levels

- **Low**: Confidence > 70%, all checks passed
- **Medium**: Confidence 50-70%
- **High**: Confidence < 50% or any check failed

## Force Override

Founders can force execution even when preflight fails:
- Requires `forcedBy` (user ID)
- Requires `forceReason`
- Recorded in execution metadata
- Still creates audit trail

## Retry Logic

- Failed executions can be retried up to 3 times
- Each retry increments `retry_count`
- Re-runs execution with same payload

## Usage

### Run Preflight
```typescript
import { runPreflight } from '@/lib/postingExecution';

const result = await runPreflight({
  scheduleId: 'schedule-uuid',
  clientId: 'client-uuid',
  workspaceId: 'workspace-uuid',
  channel: 'linkedin',
  content: 'Post content here...',
});

if (result.passed) {
  // Safe to execute
}
```

### Execute Post
```typescript
import { executePost } from '@/lib/postingExecution';

const result = await executePost({
  preflightId: 'preflight-uuid',
  payload: {
    content: 'Post content',
    mediaUrls: ['https://...'],
  },
});

if (result.status === 'success') {
  console.log('Posted:', result.externalUrl);
}
```

### Rollback Post
```typescript
import { initiateRollback } from '@/lib/postingExecution';

const result = await initiateRollback({
  executionId: 'execution-uuid',
  requestedBy: 'user-uuid',
  reason: 'Incorrect information',
});

if (result.status === 'success') {
  console.log('Post removed');
}
```

### Process Schedules
```typescript
import { processDueSchedules } from '@/lib/postingExecution';

const results = await processDueSchedules('workspace-uuid');

console.log(`Processed ${results.length} schedules`);
console.log(`Executed: ${results.filter(r => r.executed).length}`);
```

## Files Created

### Migration
- `supabase/migrations/130_cross_channel_execution.sql`

### Backend (6 files)
- `src/lib/postingExecution/postingExecutionTypes.ts`
- `src/lib/postingExecution/preflightService.ts`
- `src/lib/postingExecution/executionService.ts`
- `src/lib/postingExecution/channelExecutionAdapterService.ts`
- `src/lib/postingExecution/rollbackService.ts`
- `src/lib/postingExecution/postingExecutionSchedulerService.ts`
- `src/lib/postingExecution/index.ts`

### API Routes (4 files)
- `src/app/api/posting-execution/preflight/route.ts`
- `src/app/api/posting-execution/execute/route.ts`
- `src/app/api/posting-execution/rollback/route.ts`
- `src/app/api/posting-execution/scheduler/route.ts`

### UI Components (3 files)
- `src/components/postingExecution/PreflightTable.tsx`
- `src/components/postingExecution/ExecutionHistoryTable.tsx`
- `src/components/postingExecution/RollbackTable.tsx`

### Pages
- `src/app/founder/posting-execution/page.tsx`

## Integration Points

- **Phase 83**: Early Warning Engine (veto check)
- **Phase 84**: Performance Reality (confidence gating)
- **Phase 85**: AMPE (channel tokens, posting attempts)
- **Phase 86**: Scaling Mode (capacity gating)
- **MCOE**: Campaign orchestration schedules

## Demo Mode

When no real credentials exist, all channel adapters return demo responses:
- Demo post IDs: `demo-{channel}-{timestamp}`
- Demo URLs: `https://demo.unite-hub.com/posts/{id}`
- Safe for testing without real platform accounts

## Next Steps

1. Connect real OAuth tokens for each platform
2. Add webhook support for platform callbacks
3. Implement content preview before execution
4. Add bulk execution capability
5. Create execution analytics dashboard
