---
name: cron-scheduler
description: >-
  Scheduled task management patterns for Vercel cron jobs, Next.js API route
  handlers, and backend periodic tasks. Covers cron expression conventions,
  CRON_SECRET authentication, overlap protection, timezone handling (AEST/AEDT),
  and failure alerting.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '1.0.0'
  locale: en-AU
---

# Cron Scheduler - Scheduled Task Management

---

## When to Apply

### Positive Triggers

- Creating new cron jobs or scheduled tasks
- Adding Vercel cron entries to `vercel.json`
- Writing Next.js API route handlers for `/api/cron/*` endpoints
- Implementing backend periodic tasks (APScheduler, asyncio)
- Reviewing cron expression syntax or scheduling intervals
- Adding overlap protection to existing scheduled tasks
- User mentions: "cron", "schedule", "periodic", "interval", "timer", "background job"

### Negative Triggers

- Implementing real-time WebSocket or SSE connections
- Designing state machine transitions (use `state-machine` instead)
- Building workflow pipelines with manual triggers (use `genesis-orchestrator` instead)
- Handling one-off async background tasks without recurrence

## Core Directives

### The Four Rules of Scheduled Tasks

1. **Authenticated**: Every cron endpoint validates `CRON_SECRET`
2. **Idempotent**: Re-running the same job produces the same result
3. **Observable**: Every execution logs start, end, duration, and outcome
4. **Overlap-safe**: Concurrent invocations do not corrupt shared state

---

## Existing Project Cron Jobs

### Existing Cron Jobs

**Configuration**: `apps/web/vercel.json` → `crons` array

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/cleanup-old-runs` | Daily 2:00 AM | Delete completed agent runs older than 30 days |
| `/api/cron/health-check` | Every 5 minutes | Ping backend, check responsiveness |
| `/api/cron/daily-report` | Daily 9:00 AM | Generate yesterday's agent activity summary |

### Scheduled Audit Runner

**Location**: `apps/web/lib/audit/scheduled-audit-runner.ts`

In-process scheduler using `setInterval` with `AuditSchedule` type and simplified cron parsing. Supports add/remove/toggle schedules.

---

## Frontend Patterns (Next.js + Vercel Cron)

### Standard Route Handler Template

Every cron route handler must follow this structure:

```typescript
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * {Job Name} Cron Job
 *
 * Runs {schedule description} ({cron expression})
 * {What it does}
 */
export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    // 1. Authenticate
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorised', { status: 401 });
    }

    // 2. Execute job logic
    const result = await executeJob();

    // 3. Log success with duration
    const duration = Date.now() - startedAt;
    logger.info('cron_job_completed', {
      job: 'job-name',
      duration_ms: duration,
      result,
    });

    // 4. Return structured response
    return NextResponse.json({
      success: true,
      ...result,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startedAt;
    logger.error('cron_job_failed', {
      job: 'job-name',
      duration_ms: duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Route File Location

```
apps/web/app/api/cron/
├── cleanup-old-runs/route.ts    # Existing
├── health-check/route.ts        # Existing
├── daily-report/route.ts        # Existing
└── {new-job-name}/route.ts      # New jobs go here
```

### Vercel Cron Registration

When adding a new cron job, update `apps/web/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/{job-name}",
      "schedule": "{cron expression}"
    }
  ]
}
```

---

## Authentication

### CRON_SECRET Pattern

Every cron endpoint must validate the `CRON_SECRET` environment variable:

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new NextResponse('Unauthorised', { status: 401 });
}
```

No authentication or hardcoded secrets are **REJECTED**. Store `CRON_SECRET` in `.env.local`.

---

## Overlap Protection

The existing cron jobs lack overlap protection. Use one of these patterns:

### Pattern 1: Database Lock (Recommended for Vercel)

```typescript
import { createClient } from '@/lib/supabase/server';

async function acquireLock(jobName: string, ttlSeconds: number): Promise<boolean> {
  const supabase = await createClient();
  const lockId = `cron_lock_${jobName}`;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  // Attempt to insert lock row — fails if already locked
  const { error } = await supabase
    .from('cron_locks')
    .upsert(
      { id: lockId, locked_at: new Date().toISOString(), expires_at: expiresAt },
      { onConflict: 'id', ignoreDuplicates: false }
    )
    .lt('expires_at', new Date().toISOString());  // Only if expired

  return !error;
}

async function releaseLock(jobName: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('cron_locks')
    .delete()
    .eq('id', `cron_lock_${jobName}`);
}
```

Usage in a cron handler:

```typescript
export async function GET(request: Request) {
  // ... auth check ...

  const locked = await acquireLock('cleanup-old-runs', 300);
  if (!locked) {
    return NextResponse.json({ skipped: true, reason: 'Already running' });
  }

  try {
    const result = await executeJob();
    return NextResponse.json({ success: true, ...result });
  } finally {
    await releaseLock('cleanup-old-runs');
  }
}
```

### Pattern 2: In-Memory Flag (For ScheduledAuditRunner)

```typescript
class ScheduledAuditRunner {
  private running: Set<string> = new Set();

  async runAudit(type: AuditType, config?: AuditConfig): Promise<ScheduledAuditResult> {
    const lockKey = `${type}_${JSON.stringify(config ?? {})}`;

    if (this.running.has(lockKey)) {
      return { status: 'skipped', reason: 'Already running' } as ScheduledAuditResult;
    }

    this.running.add(lockKey);
    try {
      // ... existing audit logic ...
    } finally {
      this.running.delete(lockKey);
    }
  }
}
```

### Database Schema for Locks

```sql
CREATE TABLE IF NOT EXISTS cron_locks (
  id TEXT PRIMARY KEY,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Auto-cleanup expired locks
CREATE INDEX idx_cron_locks_expires ON cron_locks (expires_at);
```

---

## Backend Patterns (FastAPI + asyncio)

### Startup/Shutdown Lifecycle

```python
from contextlib import asynccontextmanager
from asyncio import create_task, sleep, Task

_background_tasks: list[Task] = []


async def periodic_cleanup(interval_seconds: int = 3600) -> None:
    """Run cleanup every hour."""
    while True:
        try:
            await run_cleanup_job()
        except Exception as e:
            logger.error("periodic_cleanup_failed", error=str(e))
        await sleep(interval_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background tasks
    task = create_task(periodic_cleanup(3600))
    _background_tasks.append(task)
    yield
    # Shutdown: cancel all background tasks
    for task in _background_tasks:
        task.cancel()
```

### APScheduler Integration (When Needed)

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler(timezone="Australia/Brisbane")
scheduler.add_job(
    cleanup_old_runs,
    CronTrigger(hour=2, minute=0),
    id="cleanup_old_runs",
    replace_existing=True,
    misfire_grace_time=300,
)
scheduler.start()
```

---

## Cron Expression Reference

### Syntax

```
┌─────────── minute (0-59)
│ ┌─────────── hour (0-23)
│ │ ┌─────────── day of month (1-31)
│ │ │ ┌─────────── month (1-12)
│ │ │ │ ┌─────────── day of week (0-6, Sunday=0)
│ │ │ │ │
* * * * *
```

### Common Expressions

| Expression | Schedule | Use Case |
|-----------|----------|----------|
| `*/5 * * * *` | Every 5 minutes | Health checks |
| `0 * * * *` | Every hour | Metrics aggregation |
| `0 2 * * *` | Daily 2:00 AM | Data cleanup |
| `0 9 * * *` | Daily 9:00 AM | Daily reports |
| `0 9 * * 1-5` | Weekdays 9:00 AM | Business reports |
| `0 0 1 * *` | Monthly (1st) | Monthly aggregation |
| `0 0 * * 0` | Weekly (Sunday) | Weekly cleanup |

### Timezone Consideration (AEST/AEDT)

Vercel cron runs in UTC. Convert Australian times:

| AEST (UTC+10) | AEDT (UTC+11) | UTC | Cron |
|---|---|---|---|
| 9:00 AM AEST | 10:00 AM AEDT | 23:00 (prev day) | `0 23 * * *` |
| 2:00 AM AEST | 3:00 AM AEDT | 16:00 (prev day) | `0 16 * * *` |
| 12:00 PM AEST | 1:00 PM AEDT | 02:00 | `0 2 * * *` |

For the backend (APScheduler), set `timezone="Australia/Brisbane"` to avoid manual conversion.

---

## Idempotency

Cron jobs may execute more than once (retries, clock drift). Design for idempotency:

```typescript
// GOOD: Idempotent — deletes by criteria, safe to re-run
await supabase.from('agent_runs').delete()
  .in('status', ['completed', 'failed'])
  .lt('completed_at', cutoffDate.toISOString());

// GOOD: Idempotent insert — upsert on unique key
await supabase.from('daily_reports')
  .upsert({ date: yesterday, data: report }, { onConflict: 'date' });
```

**REJECTED**: Plain `.insert()` without upsert — creates duplicates on retry.

---

## Monitoring and Alerting

### Structured Log Events

Every cron job must emit these log events:

```typescript
// On start
logger.info('cron_job_started', { job: 'cleanup-old-runs' });

// On success
logger.info('cron_job_completed', {
  job: 'cleanup-old-runs',
  duration_ms: 1234,
  records_processed: 42,
});

// On failure
logger.error('cron_job_failed', {
  job: 'cleanup-old-runs',
  duration_ms: 567,
  error: 'Connection timeout',
});

// On skip (overlap protection)
logger.warn('cron_job_skipped', {
  job: 'cleanup-old-runs',
  reason: 'Already running',
});
```

### Failure Alerting

Alert after 3+ consecutive failures. Track failure count per job in the database or in-memory store. Log `cron_job_alert` with `consecutive_failures` count when threshold is breached.

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|---|---|---|
| No `CRON_SECRET` validation | Public endpoint, anyone can trigger | Bearer token auth on every handler |
| `setInterval` for critical jobs | Drift, no persistence across restarts | Vercel cron or APScheduler |
| No overlap protection | Concurrent runs corrupt shared state | Database lock or in-memory flag |
| Hardcoded UTC offsets | Breaks on AEST/AEDT transition | Use `Australia/Brisbane` timezone |
| Non-idempotent inserts | Duplicate records on retry | Upsert with unique constraint |
| Silent failures | Jobs fail without anyone knowing | Structured logging + alerting |

---

## Checklist for New Cron Jobs

### Setup

- [ ] Route handler created in `apps/web/app/api/cron/{job-name}/route.ts`
- [ ] Cron entry added to `apps/web/vercel.json`
- [ ] `CRON_SECRET` validation at top of handler
- [ ] JSDoc with schedule description and cron expression

### Safety

- [ ] Overlap protection implemented (database lock or flag)
- [ ] Job is idempotent — safe to re-run
- [ ] Timeout configured (Vercel function timeout or `AbortSignal.timeout`)
- [ ] Error handling with structured logging

### Observability

- [ ] `cron_job_started` log event
- [ ] `cron_job_completed` log event with `duration_ms`
- [ ] `cron_job_failed` log event with error details
- [ ] `cron_job_skipped` log event for overlap protection
- [ ] Alerting on consecutive failures

### Timezone

- [ ] Schedule expressed in UTC for Vercel cron
- [ ] AEST/AEDT conversion documented in JSDoc
- [ ] Backend uses `Australia/Brisbane` timezone for APScheduler

---

## Response Format

```
[AGENT_ACTIVATED]: Cron Scheduler
[PHASE]: {Design | Implementation | Review}
[STATUS]: {in_progress | complete}

{scheduling analysis or implementation guidance}

[NEXT_ACTION]: {what to do next}
```

## Integration Points

### Structured Logging

- Every cron execution emits structured log events matching `structured-logging` patterns
- `correlation_id` per execution for tracing across services
- Duration tracking in milliseconds

### Error Taxonomy

- Cron auth failures use `AUTH_VALIDATION_MISSING_TOKEN` (401)
- Job execution failures use `SYS_RUNTIME_INTERNAL` (500)
- Database lock failures use `WORKFLOW_CONFLICT_LOCKED` (409)

### State Machine

- Cron job execution follows `PENDING → RUNNING → COMPLETED/FAILED` (same as `NodeStatus`)
- Lock states: `UNLOCKED → LOCKED → UNLOCKED` (with TTL expiry)

### API Contract

- Cron route responses follow the standard JSON envelope pattern
- All responses include `timestamp` in ISO 8601

## Australian Localisation (en-AU)

- **Timezone**: AEST (UTC+10) / AEDT (UTC+11) — store UTC, convert in display
- **Spelling**: serialise, analyse, optimise, behaviour, colour, authorise
- **Date Format**: ISO 8601 in API; DD/MM/YYYY in UI display
