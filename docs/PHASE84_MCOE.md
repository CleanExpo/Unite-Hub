# Phase 84: Multi-Agent Campaign Orchestration Engine (MCOE)

**Status**: Complete
**Date**: 2025-11-24

## Overview

Phase 84 implements the Multi-Agent Campaign Orchestration Engine (MCOE), unifying scheduling, publishing decisions, creative evolution, performance analysis, and cross-channel orchestration into one coordinated engine.

## Key Features

### 1. Channel-Aware Scheduling
- Supports 9 channels: fb, ig, tiktok, linkedin, youtube, gmb, reddit, email, x
- Channel-specific posting frequencies (e.g., TikTok 14/week, LinkedIn 5/week)
- Optimal posting times per channel
- Fatigue-aware frequency adjustment

### 2. Asset Selection with Intelligence
- VIF (Value, Impact, Freshness) scoring
- Fatigue avoidance (penalizes recently used assets)
- Quality and brand consistency scoring
- Channel optimization matching

### 3. Guardrails System
- Early Warning Engine integration
- Channel fatigue monitoring (warn at 0.5, block at 0.8)
- Policy compliance checks
- Truth Layer validation
- Timing conflict detection

### 4. Draft-Only Execution
Phase 84 creates draft posts only - actual publishing disabled until Phase 85+ when social media API integration is complete.

### 5. Full Audit Trail
- All decisions logged with context
- Confidence scores and risk classification
- Truth notes and disclaimers
- Source signals tracking

## Database Schema

### Tables Created (Migration 127)

1. **campaign_orchestration_schedules**
   - Schedule management with status tracking
   - Content preview and metadata
   - Risk level classification
   - Block reasons

2. **campaign_orchestration_actions**
   - Decision audit log
   - Action types: select_asset, time_choice, variation_choice, evolution_step, posting_decision, schedule_created/blocked/approved/executed/failed, conflict_detected, fatigue_check
   - Risk classification: low/medium/high
   - Truth notes storage

3. **channel_state**
   - Per-client, per-channel health metrics
   - Fatigue, momentum, visibility, engagement scores
   - Last post tracking

## Backend Services

Located in `src/lib/orchestration/`:

| Service | Purpose |
|---------|---------|
| `mcoePlannerService.ts` | Weekly planning, optimal time selection, conflict detection |
| `mcoeAssetSelectorService.ts` | Asset scoring, variation selection, freshness checking |
| `mcoeGuardrailsService.ts` | Validation, early warnings, fatigue checks |
| `mcoeExecutorService.ts` | Draft creation, status updates, schedule blocking |
| `mcoeLogService.ts` | Action logging, truth notes, statistics |
| `mcoeSchedulerService.ts` | Daily/weekly orchestration passes, overview data |

## API Routes

### `/api/orchestration/schedules`
- **GET**: List schedules, overview, or channel summaries
- **PATCH**: Approve or cancel schedules

### `/api/orchestration/scheduler`
- **GET**: Get actions or statistics
- **POST**: Run daily pass or weekly planning

## UI Components

Located in `src/components/orchestration/`:

1. **OrchestrationScheduleTable** - View and manage scheduled posts
2. **OrchestrationChannelHealth** - Channel fatigue/momentum indicators
3. **OrchestrationConflictMap** - Visual conflict grouping by severity
4. **OrchestrationDecisionLog** - Timeline of all decisions

## Founder Dashboard

`src/app/founder/orchestration/page.tsx`

Features:
- Overview statistics (total, pending, completed, blocked)
- Tabbed interface: Schedules, Channel Health, Conflicts, Decision Log
- One-click daily pass and weekly planning
- Approve/cancel schedule actions

## Cross-Agent Coordination

MCOE coordinates with:
- **Creative Director Agent** - Asset selection
- **Agency Director Agent** - Campaign strategy
- **Client Ops Agent** - Contact context
- **Scaling Engine** - Resource allocation
- **Performance Reality Engine** - Metrics validation
- **Early Warning Engine** - Risk gating

## Channel Configuration

### Posting Frequencies (per week)
- Facebook: 5
- Instagram: 7
- TikTok: 14
- LinkedIn: 5
- YouTube: 2
- GMB: 3
- Reddit: 3
- Email: 2
- X: 10

### Minimum Post Spacing
- LinkedIn: 12 hours
- YouTube: 48 hours
- Email: 24 hours
- GMB: 12 hours
- Others: 4 hours

## Risk Classification

- **Low**: Auto-executable, confidence >= 0.75
- **Medium**: Requires review, confidence 0.6-0.74
- **High**: Requires approval, confidence < 0.6

## Files Created

### Migration
- `supabase/migrations/127_campaign_orchestration_engine.sql`

### Types
- `src/lib/orchestration/mcoeTypes.ts`

### Services (7)
- `src/lib/orchestration/mcoePlannerService.ts`
- `src/lib/orchestration/mcoeAssetSelectorService.ts`
- `src/lib/orchestration/mcoeGuardrailsService.ts`
- `src/lib/orchestration/mcoeExecutorService.ts`
- `src/lib/orchestration/mcoeLogService.ts`
- `src/lib/orchestration/mcoeSchedulerService.ts`
- `src/lib/orchestration/index.ts`

### API Routes (2)
- `src/app/api/orchestration/schedules/route.ts`
- `src/app/api/orchestration/scheduler/route.ts`

### UI Components (4)
- `src/components/orchestration/OrchestrationScheduleTable.tsx`
- `src/components/orchestration/OrchestrationChannelHealth.tsx`
- `src/components/orchestration/OrchestrationConflictMap.tsx`
- `src/components/orchestration/OrchestrationDecisionLog.tsx`

### Page (1)
- `src/app/founder/orchestration/page.tsx`

## Usage

### Run Daily Orchestration
```bash
curl -X POST http://localhost:3008/api/orchestration/scheduler \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "your-workspace-id", "action": "daily"}'
```

### Run Weekly Planning
```bash
curl -X POST http://localhost:3008/api/orchestration/scheduler \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "your-workspace-id", "action": "weekly"}'
```

### Get Overview
```bash
curl "http://localhost:3008/api/orchestration/schedules?workspaceId=your-workspace-id&type=overview"
```

## Next Steps (Phase 85+)

1. Social media API integration for actual publishing
2. A/B testing for content variations
3. Advanced analytics and reporting
4. Automated optimization based on performance
5. Multi-client batch operations
