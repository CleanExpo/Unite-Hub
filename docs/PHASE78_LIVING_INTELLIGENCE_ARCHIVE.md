# Phase 78: Living Intelligence Archive

## Overview

Phase 78 creates a Living Intelligence Archive that unifies reports, stories, touchpoints, performance events, and creative/production milestones into a single chronological, queryable history for each client.

## Objectives Completed

- Created database schema for archive entries with RLS
- Built archive ingestion service for all event types
- Implemented query service with timeline and overview views
- Created timeline builder helpers for grouping
- Built UI components for filtering and display
- Created client and founder archive dashboards
- Implemented archive query API

## Architecture

### Data Model

Two tables with RLS:

```sql
-- Main entries table
archive_entries (
  id UUID PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  source_engine TEXT NOT NULL,
  category TEXT NOT NULL,
  importance_score INTEGER (0-100),
  summary TEXT NOT NULL,
  details_json JSONB,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  is_demo BOOLEAN,
  truth_completeness TEXT,
  data_sources TEXT[]
)

-- Optional tagging
archive_tags (
  id UUID PRIMARY KEY,
  archive_entry_id UUID REFERENCES archive_entries,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ
)
```

### Event Types

- `weekly_report` - Weekly report generation
- `monthly_report` - Monthly report generation
- `ninety_day_report` - 90-day report generation
- `story` - Story generation
- `touchpoint` - Client touchpoint
- `success_event` - Success milestone
- `performance_event` - Performance metric change
- `creative_event` - Creative asset event
- `vif_event` - VIF alignment event
- `production_event` - Production job completion
- `director_alert` - AI Director alert
- `governance_alert` - Governance alert

### Source Engines

- `performance` - Performance insights
- `success` - Client success
- `creative_ops` - Creative operations
- `creative_director` - Creative Director
- `vif` - Vision Impact Framework
- `production` - Production engine
- `director` - AI Director
- `governance` - Governance engine
- `reports` - Report composition
- `storytelling` - Storytelling engine
- `touchpoints` - Touchpoint engine

### Categories

- `reports` - Generated reports
- `stories` - Client stories
- `events` - Activity events
- `alerts` - System alerts
- `milestones` - Achievement milestones

## Files Created

### Database

| File | Purpose |
|------|---------|
| `supabase/migrations/122_living_intelligence_archive.sql` | Schema with RLS |

### Library (`src/lib/archive/`)

| File | Lines | Purpose |
|------|-------|---------|
| `archiveTypes.ts` | ~220 | Type definitions and display helpers |
| `archiveIngestionService.ts` | ~350 | Centralized ingestion functions |
| `archiveQueryService.ts` | ~230 | Read-only query helpers |
| `archiveTimelineBuilder.ts` | ~250 | Timeline grouping and stats |

### UI Components (`src/ui/components/`)

| File | Lines | Purpose |
|------|-------|---------|
| `ArchiveEntryCard.tsx` | ~180 | Single archive entry display |
| `ArchiveFilterBar.tsx` | ~260 | Filter controls with presets |
| `ArchiveTimelineView.tsx` | ~200 | Grouped entry timeline |

### Pages

| Path | Purpose |
|------|---------|
| `src/app/client/dashboard/archive/page.tsx` | Client archive view |
| `src/app/founder/dashboard/archive/page.tsx` | Founder archive console |

### API

| Path | Purpose |
|------|---------|
| `src/app/api/archive/query/route.ts` | Archive query endpoint |

## Key Interfaces

### ArchiveEntry

```typescript
interface ArchiveEntry {
  id: string;
  workspace_id: string;
  client_id: string;
  created_at: string;
  event_date: string;
  event_type: ArchiveEventType;
  source_engine: SourceEngine;
  category: ArchiveCategory;
  importance_score: number;
  summary: string;
  details_json: Record<string, unknown>;
  period_start?: string;
  period_end?: string;
  is_demo: boolean;
  truth_completeness: TruthCompleteness;
  data_sources: string[];
}
```

### ArchiveFilters

```typescript
interface ArchiveFilters {
  clientId?: string;
  workspaceId?: string;
  from?: string;
  to?: string;
  types?: ArchiveEventType[];
  sources?: SourceEngine[];
  categories?: ArchiveCategory[];
  importanceMin?: number;
  isDemo?: boolean;
  limit?: number;
  offset?: number;
}
```

## Usage

### Ingesting Entries

```typescript
import {
  logReportEntry,
  logStoryEntry,
  logTouchpointEntry,
  logPerformanceEvent,
  logSuccessEvent,
} from '@/lib/archive/archiveIngestionService';

// Log a report
await logReportEntry(
  { workspaceId: 'ws_123', clientId: 'contact_456' },
  {
    reportId: 'rpt_789',
    reportType: 'weekly',
    title: 'Weekly Report',
    timeframe: { start: '2025-01-01', end: '2025-01-07', label: 'Jan 1-7' },
    sectionsIncluded: ['performance', 'success'],
    sectionsOmitted: ['creative'],
    dataSources: ['performance', 'success'],
  },
  85 // completeness
);

// Log a success event
await logSuccessEvent(
  { workspaceId: 'ws_123', clientId: 'contact_456' },
  {
    eventId: 'evt_123',
    successType: 'milestone',
    title: 'First Lead Generated',
    description: 'Client received their first qualified lead',
    impact: 'High',
  }
);
```

### Querying Entries

```typescript
import {
  getClientArchiveTimeline,
  getFounderArchiveOverview,
} from '@/lib/archive/archiveQueryService';

// Get client timeline
const result = await getClientArchiveTimeline({
  workspaceId: 'ws_123',
  clientId: 'contact_456',
  from: '2025-01-01',
  types: ['weekly_report', 'success_event'],
  limit: 50,
});

// Get founder overview
const overview = await getFounderArchiveOverview({
  from: '2025-01-01',
});
```

### Building Timelines

```typescript
import {
  buildDailyTimeline,
  buildPhaseTimeline,
  buildClientNarrativeSummary,
} from '@/lib/archive/archiveTimelineBuilder';

// Group by day
const dailyGroups = buildDailyTimeline(entries);

// Group by 90-day phases
const phaseGroups = buildPhaseTimeline(entries, journeyStartDate);

// Get client summary
const summary = buildClientNarrativeSummary(entries, clientId);
```

### API Usage

```bash
# Query timeline
curl -X POST http://localhost:3008/api/archive/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "client_id": "contact_456",
    "workspace_id": "ws_123",
    "from": "2025-01-01",
    "types": ["weekly_report", "success_event"],
    "view": "timeline"
  }'

# Query overview
curl -X POST http://localhost:3008/api/archive/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "view": "overview"
  }'
```

## Client vs Founder Views

### Client Archive

- Shows only their own workspace entries
- Simplified filters (timeframe, category)
- Truth notice about real data only
- Links to view entry context

### Founder Archive

- Cross-client view with client selector
- Timeline and Overview tabs
- Client activity breakdown
- Event type distribution
- Full filter controls

## Importance Scores

| Score | Label | Use Case |
|-------|-------|----------|
| 0-39 | Routine | Daily operations |
| 40-59 | Notable | Standard events |
| 60-79 | Significant | Important milestones |
| 80-100 | Critical | Urgent alerts |

## Truth-Layer Compliance

### Every Entry Must Include

1. **Timeframe** - event_date or period_start/period_end
2. **Source** - source_engine identifying origin
3. **Reference** - details_json with artifact ID
4. **Completeness** - truth_completeness status

### Transparency Features

- Demo entries clearly marked with is_demo flag
- Truth notice in both dashboards
- Completeness indicator on entries
- No fabricated or projected data

## Future Enhancements

### Ingestion Hooks (Follow-up Task)

Add archive logging to existing engines:

- `reportCompositionEngine.ts` - Log on report generation
- `storytellingEngine.ts` - Log on story generation
- `storyTouchpointEngine.ts` - Log on touchpoint creation
- `performanceInsightsService.ts` - Log on performance cycle
- `clientSuccessService.ts` - Log on success events
- `productionEngine.ts` - Log on job completion
- `aiDirectorEngine.ts` - Log on director alerts

### Additional Features

1. **Search** - Full-text search across entries
2. **Export** - Export timeline to PDF/CSV
3. **Notifications** - Alert on high-importance entries
4. **Trends** - Activity trend charts
5. **Comparisons** - Compare clients over time

## Testing

### Manual Testing

1. Navigate to `/client/dashboard/archive`
2. Apply filters (timeframe, types, categories)
3. Verify entries display with correct icons and colors
4. Check truth notice is visible

5. Navigate to `/founder/dashboard/archive`
6. Switch between Timeline and Overview tabs
7. Filter by client
8. Verify cross-client data in overview

### API Testing

```bash
# Get endpoint info
curl http://localhost:3008/api/archive/query

# Query with filters
curl -X POST http://localhost:3008/api/archive/query \
  -H "Content-Type: application/json" \
  -d '{"view": "timeline", "limit": 10}'
```

## Database Migration

Run migration 122 in Supabase SQL Editor:

```sql
-- See supabase/migrations/122_living_intelligence_archive.sql
```

## Related Documentation

- [Phase 76: Client Report Center](./PHASE76_CLIENT_REPORT_CENTER.md)
- [Phase 77: Report Export Engine](./PHASE77_REPORT_EXPORT_ENGINE.md)
- [Phase 74: Client Storytelling Engine](./PHASE74_CLIENT_STORYTELLING_ENGINE.md)
