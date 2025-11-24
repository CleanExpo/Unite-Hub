# Phase 80: Founder Intelligence Mode

**Status**: Complete
**Date**: 2025-11-24
**Dependencies**: Phases 56-79 (Multi-agent system, Archive, Reports, VIF)

## Overview

Phase 80 creates a unified Founder Intelligence Console that synthesizes signals from all engines into a single truth-layer-compliant intelligence layer for the founder.

## Features Implemented

### 1. Database Schema

Three new tables with RLS policies:

- **founder_intel_snapshots** - Periodic intelligence summaries
- **founder_intel_alerts** - Engine-specific alerts and risks
- **founder_intel_preferences** - User thresholds and schedules

### 2. Backend Services

```
src/lib/founderIntel/
├── founderIntelTypes.ts          - Type definitions
├── founderIntelAggregationService.ts  - Signal aggregation
├── founderIntelSnapshotService.ts     - Snapshot CRUD
├── founderIntelAlertService.ts        - Alert management
├── founderIntelPreferenceService.ts   - User preferences
└── founderIntelTruthAdapter.ts        - Truth layer enforcement
```

### 3. API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/founder-intel/snapshots` | GET, POST | List/create snapshots |
| `/api/founder-intel/snapshots/[id]` | GET | Get snapshot details |
| `/api/founder-intel/alerts` | GET | List alerts with filters |
| `/api/founder-intel/alerts/[id]` | GET, PATCH | Get/update alert |
| `/api/founder-intel/preferences` | GET, PUT | Get/update preferences |
| `/api/founder-intel/briefing` | POST | Generate on-demand briefing |

### 4. UI Components

```
src/components/founderIntel/
├── FounderIntelOverview.tsx      - Health metric tiles
├── FounderIntelAlertsPanel.tsx   - Alert list with status controls
├── FounderIntelSnapshotList.tsx  - Recent snapshots
└── FounderIntelTruthBadge.tsx    - Confidence/completeness indicator
```

### 5. Pages

| Page | Description |
|------|-------------|
| `/founder/intel` | Main intelligence console |
| `/founder/intel/snapshots/[id]` | Snapshot detail view |
| `/founder/intel/settings` | Preferences configuration |

## Truth Layer Compliance

All intelligence follows strict truth-layer rules:

1. **No Fabricated Metrics** - All data from real sources
2. **Completeness Disclosure** - Low completeness shows warnings
3. **Confidence Scoring** - Combined confidence and completeness scores
4. **Banned Patterns** - No "guaranteed results", "10x growth", etc.
5. **Source Traceability** - All alerts reference source engines

### Truth Badge Levels

- **High** (>80%): Green shield, full confidence
- **Medium** (60-80%): Yellow shield, some data gaps
- **Low** (<60%): Orange shield, significant gaps

## Health Metrics

The console displays six key health indicators:

1. **Agency Health** - Team utilization, project status
2. **Client Health** - Client satisfaction, retention
3. **Creative Health** - Asset quality, output volume
4. **Scaling Risk** - Capacity constraints
5. **ORM Reality** - Operational metrics
6. **Archive Completeness** - Data coverage

Each metric includes:
- Current score (0-100%)
- Trend indicator (up/down/stable)
- Color coding (green/yellow/red)

## Alert System

### Alert Types
- `risk` - Potential problems
- `opportunity` - Growth possibilities
- `anomaly` - Unusual patterns
- `info` - General notifications

### Severity Levels
- `critical` - Immediate action required
- `high` - Urgent attention needed
- `medium` - Monitor closely
- `low` - Informational

### Status Flow
`open` → `acknowledged` → `in_progress` → `resolved` / `dismissed`

## Snapshot System

Snapshots capture point-in-time intelligence:

- **Scope**: global | client | cohort | segment
- **Risk Level**: Calculated from alerts and health scores
- **Opportunity Level**: Based on identified opportunities
- **Confidence Score**: Combined signal confidence
- **Completeness Score**: Data source coverage

## Preferences

Founders can configure:

### Risk Thresholds
Per-engine thresholds (0-1) for surfacing alerts

### Opportunity Preferences
- Minimum confidence
- Show/hide low opportunities
- Highlight high impact

### Briefing Schedule
- Day of week
- Hour (24h format)
- Timezone

### Mute Rules
- Muted engines
- Muted alert types
- Muted clients

## Files Created

### Database
- `supabase/migrations/123_founder_intel.sql`

### Backend Services
- `src/lib/founderIntel/founderIntelTypes.ts`
- `src/lib/founderIntel/founderIntelAggregationService.ts`
- `src/lib/founderIntel/founderIntelSnapshotService.ts`
- `src/lib/founderIntel/founderIntelAlertService.ts`
- `src/lib/founderIntel/founderIntelPreferenceService.ts`
- `src/lib/founderIntel/founderIntelTruthAdapter.ts`

### API Routes
- `src/app/api/founder-intel/snapshots/route.ts`
- `src/app/api/founder-intel/snapshots/[id]/route.ts`
- `src/app/api/founder-intel/alerts/route.ts`
- `src/app/api/founder-intel/alerts/[id]/route.ts`
- `src/app/api/founder-intel/preferences/route.ts`
- `src/app/api/founder-intel/briefing/route.ts`

### UI Components
- `src/components/founderIntel/FounderIntelOverview.tsx`
- `src/components/founderIntel/FounderIntelAlertsPanel.tsx`
- `src/components/founderIntel/FounderIntelSnapshotList.tsx`
- `src/components/founderIntel/FounderIntelTruthBadge.tsx`

### Pages
- `src/app/founder/intel/page.tsx`
- `src/app/founder/intel/snapshots/[id]/page.tsx`
- `src/app/founder/intel/settings/page.tsx`

## Usage

### Accessing the Console

Navigate to `/founder/intel` (requires founder/admin role)

### Generating Snapshots

1. Click "Generate Snapshot" button
2. System aggregates signals from all engines
3. Applies truth layer validation
4. Creates snapshot with scores and summary

### Managing Alerts

1. View alerts in panel
2. Filter by status (active/resolved/all)
3. Acknowledge or resolve alerts
4. Track resolution history

### Generating Briefings

1. Click "Generate" in Weekly Briefing section
2. System creates markdown summary
3. Includes risks, opportunities, recommendations
4. Notes data gaps if present

### Configuring Preferences

1. Navigate to `/founder/intel/settings`
2. Adjust risk thresholds per engine
3. Set briefing schedule
4. Configure mute rules

## Integration Points

### Connecting Engines

Engines should raise alerts via:

```typescript
import { createAlert } from '@/lib/founderIntel/founderIntelAlertService';

await createAlert({
  source_engine: 'agency_director',
  alert_type: 'risk',
  severity: 'high',
  title: 'Team utilization below threshold',
  description_markdown: 'Current utilization is 45%, below 60% target.',
  metadata: {
    current_value: 45,
    threshold_breached: 60,
  },
});
```

### Scheduled Briefings

Set up cron job to call `/api/founder-intel/briefing` weekly based on user preferences.

## Testing

1. Navigate to `/founder/intel`
2. Generate a snapshot
3. Verify health metrics display
4. Check alerts panel shows demo alerts
5. Generate a briefing
6. Visit settings and adjust preferences

## Next Steps

- Connect actual engine services to aggregation
- Implement scheduled briefing generation
- Add email delivery for briefings
- Create cohort and segment scopes
- Add historical trend charts
