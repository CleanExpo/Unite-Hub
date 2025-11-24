# Phase 85: Autonomous Multi-Channel Posting Engine (AMPE)

**Status**: Complete
**Date**: 2025-11-24

## Overview

Phase 85 implements the Autonomous Multi-Channel Posting Engine (AMPE), enabling safe, truth-layer-compliant, multi-channel publishing from MCOE schedules with approval gates, policy controls, and Early Warning integration.

## Key Features

### 1. Safety-Gated Execution
- All guardrails evaluated before publishing
- Early Warning Engine integration blocks during high-severity warnings
- Confidence threshold validation
- Channel fatigue monitoring

### 2. Draft Mode (Default)
Phase 85 creates drafts only - actual publishing disabled until Phase 86+ when social media API integration is complete.

### 3. Channel Support
- Facebook, Instagram, TikTok, LinkedIn
- YouTube, Google Business Profile
- Reddit, X (Twitter), Email

### 4. Truth Layer Compliance
- Full audit trail for every attempt
- Confidence scores and explanations
- Disclaimers for uncertainty
- Source citations

### 5. Founder Controls
- Global enable/disable
- Draft mode toggle
- Rate limiting configuration
- Per-workspace overrides

## Database Schema

### Tables Created (Migration 128)

1. **posting_attempts**
   - Immutable log of all publish attempts
   - Safety check results
   - Platform responses
   - Error tracking

2. **channel_tokens**
   - Per-client channel credentials
   - Connection status tracking
   - Validation history

3. **posting_engine_config**
   - Global and workspace settings
   - Safety thresholds
   - Rate limits

## Backend Services

Located in `src/lib/postingEngine/`:

| Service | Purpose |
|---------|---------|
| `postingOrchestratorService.ts` | Top-level coordinator, context building |
| `postingSafetyService.ts` | All guardrails and safety checks |
| `postingChannelAdapterService.ts` | Per-channel adapters (draft mode) |
| `postingExecutionService.ts` | Execute attempts, record outcomes |
| `postingSchedulerService.ts` | Process ready schedules |
| `postingTruthAdapter.ts` | Truth notes and explanations |

## Safety Checks

The safety service evaluates 8 checks before posting:

1. **Engine Enabled** - Global/workspace toggle
2. **Early Warnings** - Active high/critical warnings
3. **Confidence Threshold** - Minimum confidence score
4. **Channel Fatigue** - Maximum fatigue level
5. **Approval Required** - Risk-based approvals
6. **Rate Limits** - Hourly and daily caps
7. **Channel Connection** - Valid credentials
8. **Truth Compliance** - Content passes truth layer

## API Routes

### `/api/posting/attempts`
- **GET**: List attempts, overview, or stats

### `/api/posting/scheduler`
- **GET**: Get current configuration
- **POST**: Run loop, retry attempts, toggle settings

## UI Components

Located in `src/components/posting/`:

1. **PostingAttemptTable** - View attempts with status and truth notes
2. **PostingSafetySummary** - Display guardrail evaluations
3. **PostingChannelStatus** - Channel connection and health

## Founder Dashboard

`src/app/founder/posting-engine/page.tsx`

Features:
- Engine enable/disable toggle
- Draft mode control
- Overview statistics (24h)
- Attempts list with retry
- Channel connection status

## Configuration Options

```typescript
{
  engine_enabled: true,
  draft_mode_only: true,     // Phase 85 default
  auto_publish_low_risk: false,
  require_approval_medium: true,
  require_approval_high: true,
  min_confidence_score: 0.6,
  max_fatigue_score: 0.8,
  block_during_warnings: true,
  max_posts_per_hour: 10,
  max_posts_per_day: 50
}
```

## Truth Layer Constraints

- No publishing during high-severity Early Warnings
- Default to draft mode if confidence < 0.6
- Explicit uncertainty disclosure in all explanations
- Source citations from real signals

## Files Created

### Migration
- `supabase/migrations/128_autonomous_posting_engine.sql`

### Types
- `src/lib/postingEngine/postingTypes.ts`

### Services (7)
- `src/lib/postingEngine/postingOrchestratorService.ts`
- `src/lib/postingEngine/postingSafetyService.ts`
- `src/lib/postingEngine/postingChannelAdapterService.ts`
- `src/lib/postingEngine/postingExecutionService.ts`
- `src/lib/postingEngine/postingSchedulerService.ts`
- `src/lib/postingEngine/postingTruthAdapter.ts`
- `src/lib/postingEngine/index.ts`

### API Routes (2)
- `src/app/api/posting/attempts/route.ts`
- `src/app/api/posting/scheduler/route.ts`

### UI Components (3)
- `src/components/posting/PostingAttemptTable.tsx`
- `src/components/posting/PostingSafetySummary.tsx`
- `src/components/posting/PostingChannelStatus.tsx`

### Page (1)
- `src/app/founder/posting-engine/page.tsx`

## Usage

### Run Posting Loop
```bash
curl -X POST http://localhost:3008/api/posting/scheduler \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "your-workspace-id", "action": "run"}'
```

### Enable/Disable Engine
```bash
# Enable
curl -X POST http://localhost:3008/api/posting/scheduler \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "your-workspace-id", "action": "enable"}'

# Disable
curl -X POST http://localhost:3008/api/posting/scheduler \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "your-workspace-id", "action": "disable"}'
```

### Get Overview
```bash
curl "http://localhost:3008/api/posting/attempts?workspaceId=your-workspace-id&type=overview"
```

### Retry Failed Attempt
```bash
curl -X POST http://localhost:3008/api/posting/scheduler \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "your-workspace-id", "action": "retry", "attemptId": "attempt-id"}'
```

## Acceptance Criteria

- [x] Founder can enable/disable AMPE globally
- [x] Client policy determines allowed channels
- [x] System drafts posts correctly for every channel
- [x] High-risk conditions block publish attempts
- [x] All publish attempts logged immutably

## Next Steps (Phase 86+)

1. Implement actual channel API integrations
2. OAuth flows for each platform
3. Media upload handling
4. Post scheduling with platform queues
5. Analytics and performance tracking
