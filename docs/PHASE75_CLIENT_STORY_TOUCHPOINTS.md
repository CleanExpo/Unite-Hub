# Phase 75: Client Story Touchpoints

**Status**: Complete
**Date**: 2025-11-24
**Files Created**: 10 files (~2,500 lines)

---

## Overview

Phase 75 transforms the Client Storytelling Engine into a repeatable, schedulable touchpoint system. Touchpoints are regular story summaries (weekly, monthly, 90-day) that surface client progress without requiring full report reads each time.

### Key Features

1. **Scheduled touchpoints**: Weekly, monthly, and 90-day story generation
2. **Batch processing**: Run touchpoints for all soft-launch clients at once
3. **Freshness tracking**: Fresh/stale/expired status indicators
4. **Email digests**: Prepared content for client and founder notifications
5. **API endpoints**: Manual and scheduled touchpoint generation

---

## Architecture

### Data Flow

```
Scheduler → Touchpoint Engine → Story Engine → Narrative Builder
                   ↓
         Notification Bridge → Email/In-App Notifications
                   ↓
              API Routes → Client/Founder Dashboards
```

### Components

#### 1. Touchpoint Engine (`storyTouchpointEngine.ts`)
- Thin orchestration layer over storytellingEngine
- Generates touchpoints with metadata (freshness, health, excerpt)
- Functions: `generateWeeklyTouchpointForClient`, `generateMonthlyTouchpointForClient`, `generate90DayTouchpointForClient`

#### 2. Touchpoint Scheduler (`storyTouchpointScheduler.ts`)
- Batch processing for multiple clients
- Schedule detection (weekly on Monday, monthly on 1st)
- Functions: `runWeeklyTouchpoints`, `runMonthlyTouchpoints`, `getSoftLaunchClients`

#### 3. Notification Bridge (`storyNotificationBridge.ts`)
- Email content builders for client and founder
- In-app notification helpers
- Functions: `buildClientStoryEmailBody`, `buildFounderDigestEmailBody`

---

## Touchpoint Model

```typescript
interface StoryTouchpoint {
  touchpoint_id: string;
  workspace_id: string;
  client_id: string;
  client_name: string;
  timeframe: 'weekly' | 'monthly' | 'ninety_day';
  time_range: StoryTimeRange;
  theme: string;
  generated_at: string;
  story_health: number;
  excerpt: string;
  narrative: ClientStoryNarrative | FounderStoryNarrative;
  has_video_script: boolean;
  has_voice_script: boolean;
  data_status: 'complete' | 'partial' | 'limited';
}
```

---

## API Endpoints

### POST `/api/storytelling/run`

Generate touchpoints with various actions:

**Actions:**
- `generate_single` - Single client, single timeframe
- `generate_founder` - Single client with operational insights
- `generate_all_for_client` - All timeframes for one client
- `run_weekly` - Weekly for all soft-launch clients
- `run_monthly` - Monthly for all soft-launch clients
- `run_90day` - 90-day for all soft-launch clients
- `run_batch` - Custom client list

**Example:**
```bash
curl -X POST /api/storytelling/run \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate_single",
    "workspace_id": "ws_123",
    "client_id": "client_456",
    "client_name": "Alpha Construction",
    "timeframe": "weekly"
  }'
```

### GET `/api/storytelling/touchpoints`

Retrieve touchpoints for dashboards:

**Parameters:**
- `view`: `client` or `founder`
- `client_id`: Required for client view
- `workspace_id`: Workspace filter
- `timeframe`: Filter by weekly/monthly/ninety_day

**Example:**
```bash
# Client view
curl "/api/storytelling/touchpoints?view=client&client_id=contact_demo"

# Founder view
curl "/api/storytelling/touchpoints?view=founder"
```

---

## UI Components

### StoryTouchpointCard
Displays touchpoint summary:
- Timeframe badge (weekly/monthly/90-day)
- Data status indicator
- Freshness status
- Excerpt preview
- Copy and regenerate actions

### StoryTouchpointList
Grouped display:
- Expandable timeframe groups
- Sort by most recent
- Batch operations

### TouchpointStatusTable
Founder overview:
- Client rows with status columns
- Fresh/stale/expired badges
- Quick regenerate actions

---

## Dashboard Pages

### Client Touchpoints (`/client/dashboard/touchpoints`)
- Filter by timeframe (all/weekly/monthly/90-day)
- Grid of touchpoint cards
- Regenerate individual touchpoints
- Link to full stories

### Founder Story Touchpoints (`/founder/dashboard/story-touchpoints`)
- Summary cards (total, avg health, stale, needs attention)
- Batch run controls (run weekly/monthly/90-day for all clients)
- Client status table
- Selected client detail view

---

## Scheduling

### Schedule Rules
- **Weekly**: Every Monday
- **Monthly**: 1st of each month
- **90-Day**: At journey milestones (day 30, 60, 90)

### Integration with successScheduler
```typescript
import { shouldRunTouchpoints, runScheduledTouchpoints } from '@/lib/storytelling/storyTouchpointScheduler';

// In cron job
const check = shouldRunTouchpoints();
if (check.should_run) {
  const results = runScheduledTouchpoints();
  // Log results
}
```

---

## Freshness Tracking

Touchpoint freshness is calculated based on timeframe:

| Timeframe | Fresh | Stale | Expired |
|-----------|-------|-------|---------|
| Weekly | ≤7 days | 8-14 days | >14 days |
| Monthly | ≤30 days | 31-45 days | >45 days |
| 90-Day | ≤90 days | 91-120 days | >120 days |

---

## Email Digest Format

### Client Email
```
Subject: Weekly Story Update: Your 30-Day Journey

Summary
[Executive summary paragraph]

Key Metrics
| Metric | Value | Trend |
...

Key Wins
• Win 1
• Win 2

Next Steps
1. Step 1
2. Step 2

[View Full Story in Dashboard]
```

### Founder Digest
```
Subject: Weekly Client Story Digest - 4 Clients

Summary Stats
- Total: 4
- Complete: 2
- Needs Attention: 1

Client Stories
[Alpha Construction] [Complete]
Excerpt...

[Beta Balustrades] [Partial]
Excerpt...

[View All Stories in Dashboard]
```

---

## Files Created

### Library Files
- `src/lib/storytelling/storyTouchpointEngine.ts` (~280 lines)
- `src/lib/storytelling/storyTouchpointScheduler.ts` (~180 lines)
- `src/lib/storytelling/storyNotificationBridge.ts` (~300 lines)

### API Routes
- `src/app/api/storytelling/run/route.ts` (~170 lines)
- `src/app/api/storytelling/touchpoints/route.ts` (~150 lines)

### UI Components
- `src/ui/components/StoryTouchpointCard.tsx` (~200 lines)
- `src/ui/components/StoryTouchpointList.tsx` (~220 lines)

### Dashboard Pages
- `src/app/client/dashboard/touchpoints/page.tsx` (~200 lines)
- `src/app/founder/dashboard/story-touchpoints/page.tsx` (~350 lines)

### Modified Files
- `src/app/client/dashboard/stories/page.tsx` - Added touchpoints link
- `src/app/founder/dashboard/client-stories/page.tsx` - Added touchpoints link

---

## Truth Layer Compliance

1. **Explicit timeframe labeling**: Every touchpoint shows exact time window
2. **Data status transparency**: Complete/partial/limited clearly marked
3. **No causality claims**: Only correlation and factual sequencing
4. **Insufficient data handling**: Clear messaging when data is sparse
5. **No future promises**: No predictions or guarantees about results

---

## Safety Constraints

- **No new database migrations**: In-memory generation only
- **No auth changes**: Uses existing auth patterns
- **No billing changes**: No payment integrations
- **Read-only integration**: Only reads from existing data
- **Cron integration opt-in**: Manual triggers only in this phase
- **Rollback available**: Can remove without data impact

---

## Usage Examples

### Generate Weekly Touchpoint
```typescript
import { generateWeeklyTouchpointForClient } from '@/lib/storytelling/storyTouchpointEngine';

const touchpoint = generateWeeklyTouchpointForClient(
  'ws_123',
  'client_456',
  'Alpha Construction'
);
```

### Run Batch for All Clients
```typescript
import { runWeeklyTouchpoints, getSoftLaunchClients } from '@/lib/storytelling/storyTouchpointScheduler';

const clients = getSoftLaunchClients();
const result = runWeeklyTouchpoints(clients);

console.log(`${result.success_count} succeeded, ${result.failed_count} failed`);
```

### Build Email Digest
```typescript
import { buildFounderDigestEmailBody } from '@/lib/storytelling/storyNotificationBridge';

const email = buildFounderDigestEmailBody(touchpoints, 'Weekly');
// email.subject, email.body, email.plain_text
```

---

## Next Steps

1. Connect to real client data (currently using mock data)
2. Integrate with email service for actual delivery
3. Add touchpoint persistence to database
4. Implement webhook triggers for external schedulers
5. Add touchpoint analytics and tracking
6. Create touchpoint templates for different industries
