# Macro Coaches

> Daily AI coaching briefs for the Unite-Group Nexus founder dashboard.

## Overview

Four AI coaches run as scheduled Vercel cron jobs each morning (AEST), generating concise daily briefs that appear on the founder dashboard. Each coach pulls data from a specific integration, sends it to Claude Haiku for analysis, and stores the result in the `coach_reports` table.

## Coaches

| Coach | Data Source | Schedule (AEST) | UTC Cron | Purpose |
|-------|------------|-----------------|----------|---------|
| Life | Google Calendar + Gmail | 07:15 | `15 21 * * *` | Bandwidth management, daily schedule, email triage |
| Revenue | Xero Accounting | 07:30 | `30 21 * * *` | MTD revenue, expenses, growth trends per business |
| Build | Linear | 07:45 | `45 21 * * *` | Sprint health, velocity, blockers, high-priority issues |
| Marketing | Social OAuth channels | 08:00 | `0 22 * * *` | Channel health, content suggestions, follower metrics |

Life fires first to set the daily context before business-specific coaches.

## Architecture

```
Vercel Cron (UTC)
  └─► /api/cron/coaches/{type}/route.ts
        ├── Auth: CRON_SECRET Bearer token
        ├── FOUNDER_USER_ID from env
        └── runCoach()
              ├── Insert coach_reports row (status: running)
              ├── Call data fetcher (integration-specific)
              ├── Build user message from context data
              ├── Call Claude Haiku via Anthropic SDK
              ├── Update row (status: completed, brief_markdown, metrics)
              └── On error: update row (status: failed, error_message)

Dashboard
  └─► /api/coaches/reports (GET, ?date=YYYY-MM-DD)
        └── CoachBriefs widget — 4 collapsible cards with status indicators
```

## Database Schema

```sql
-- public.coach_reports
id              uuid        PK, gen_random_uuid()
founder_id      uuid        FK → auth.users(id)
coach_type      text        CHECK ('revenue','build','marketing','life')
business_key    text        nullable — for business-scoped reports
report_date     date        default current_date
status          text        CHECK ('pending','running','completed','failed')
brief_markdown  text        AI-generated brief
raw_data        jsonb       input data snapshot
metrics         jsonb       extracted numeric metrics
input_tokens    integer     Anthropic API usage
output_tokens   integer     Anthropic API usage
model           text        e.g. claude-haiku-4-20250414
duration_ms     integer     total run time
error_message   text        populated on failure
created_at      timestamptz
updated_at      timestamptz

-- RLS: founder_id = auth.uid()
-- Unique index: (coach_type, report_date, coalesce(business_key, '__all__'))
--   WHERE status != 'failed'
```

## File Structure

```
src/lib/coaches/
  types.ts              — CoachType, CoachConfig, CoachContext, CoachResult, CoachReport
  runner.ts             — Generic runCoach() — DB record + AI call + error handling
  life.ts               — Life Coach data fetcher
  revenue.ts            — Revenue Coach data fetcher
  build.ts              — Build Coach data fetcher
  marketing.ts          — Marketing Coach data fetcher
  prompts/
    life.ts             — System prompt + user message builder
    revenue.ts          — System prompt + user message builder
    build.ts            — System prompt + user message builder
    marketing.ts        — System prompt + user message builder

src/app/api/cron/coaches/
  life/route.ts         — Cron endpoint
  revenue/route.ts      — Cron endpoint
  build/route.ts        — Cron endpoint
  marketing/route.ts    — Cron endpoint

src/app/api/coaches/
  reports/route.ts      — Dashboard API (authenticated, RLS-protected)

src/components/founder/dashboard/
  CoachBriefs.tsx       — Dashboard widget with collapsible cards
```

## Adding a New Coach

1. Add the type to the `coach_type` CHECK constraint in the migration
2. Add config to `COACH_CONFIGS` in `src/lib/coaches/types.ts`
3. Create `src/lib/coaches/prompts/{name}.ts` with system prompt and message builder
4. Create `src/lib/coaches/{name}.ts` with data fetcher
5. Create `src/app/api/cron/coaches/{name}/route.ts` following the existing pattern
6. Add cron entry to `vercel.json`
7. Add the coach type to `COACH_ORDER` in `CoachBriefs.tsx`

## Model Selection

All coaches use `claude-haiku-4-20250414` for cost efficiency. Daily briefs are short summaries (~500-1500 tokens output) that don't require the reasoning power of Sonnet or Opus. Token budgets are configured per coach in `COACH_CONFIGS`.

## Future: WhatsApp Delivery

The current implementation stores briefs in the database and displays them on the dashboard. A future enhancement will send briefs via WhatsApp using the Meta Business API, delivering them as morning messages to the founder's phone.
