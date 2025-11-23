# Phase 76: Client Report Center

## Overview

Phase 76 implements a unified Client Report Center that assembles honest, data-driven reports from all existing Unite-Hub engines. The system produces structured report documents in HTML and Markdown formats with strict truth-layer compliance.

## Objectives Completed

- Created Report Composition Engine producing structured report documents
- Built client and founder dashboards for browsing weekly, monthly, and 90-day reports
- Implemented founder review workflow before client sharing
- Maintained strict truth-layer compliance: real data only, no fabricated metrics

## Architecture

### Report Types

| Type | Sections | Purpose |
|------|----------|---------|
| `weekly` | 6 | Sprint-level progress updates |
| `monthly` | 9 | Comprehensive monthly review |
| `ninety_day` | 12 | Full journey assessment |

### Data Sources

Reports aggregate data from 8 existing engines:

1. **performance** - Website traffic, conversion metrics
2. **success** - Client wins and achievements
3. **creative** - Content and asset production
4. **vif** - Vision Impact Framework alignment
5. **production** - Delivery and task completion
6. **journey** - First Client Journey progress
7. **touchpoints** - Client interaction timeline
8. **alignment** - Cross-dimensional alignment scores

### Section Configuration

Each section defines:
- `id` - Unique identifier
- `title` - Display name
- `description` - What the section covers
- `data_source` - Which engine provides data
- `required_signals` - Data keys needed for completeness
- `optional` - Can be omitted if no data
- `order` - Display sequence

### Data Status Levels

- **complete** - All required signals present
- **partial** - Some signals present
- **limited** - Minimal data available
- **omitted** - Section excluded due to insufficient data

## Files Created

### Library (`src/lib/reports/`)

| File | Lines | Purpose |
|------|-------|---------|
| `reportSectionsConfig.ts` | ~280 | Section definitions for all report types |
| `reportCompositionEngine.ts` | ~380 | Orchestrates report generation |
| `reportLayoutTemplates.ts` | ~120 | HTML/Markdown layout helpers |
| `reportExportComposer.ts` | ~300 | Export to JSON/HTML/Markdown |

### UI Components (`src/ui/components/`)

| File | Lines | Purpose |
|------|-------|---------|
| `ReportSummaryCard.tsx` | ~170 | Report overview card with actions |
| `ReportSectionBlock.tsx` | ~180 | Renders individual report sections |
| `ReportTimelineList.tsx` | ~190 | Chronological report history |

### Dashboards

| Path | Purpose |
|------|---------|
| `src/app/client/dashboard/reports-center/page.tsx` | Client-facing report browser |
| `src/app/founder/dashboard/reports-center/page.tsx` | Founder review with notes |

### API

| Path | Purpose |
|------|---------|
| `src/app/api/reports/preview/route.ts` | Generate report previews |

## Key Interfaces

### ComposedReport

```typescript
interface ComposedReport {
  report_id: string;
  report_type: ReportType;
  title: string;
  subtitle: string;
  client_id: string;
  client_name: string;
  workspace_id: string;
  timeframe: {
    start: string;
    end: string;
    label: string;
  };
  sections: ReportSection[];
  generated_at: string;
  data_completeness: number;
  omitted_sections: string[];
  meta: {
    total_sections: number;
    complete_sections: number;
    partial_sections: number;
    omitted_sections: number;
    data_sources_used: string[];
  };
}
```

### ReportSection

```typescript
interface ReportSection {
  section_id: string;
  title: string;
  description: string;
  order: number;
  data_status: 'complete' | 'partial' | 'limited' | 'omitted';
  blocks: ReportBlock[];
  omission_reason?: string;
}
```

### ReportBlock Types

```typescript
type ReportBlock = {
  block_id: string;
  type: 'text' | 'metric' | 'list' | 'table' | 'callout';
  content: TextContent | MetricContent | ListContent | TableContent | CalloutContent;
};
```

## Usage

### Building a Client Report

```typescript
import { buildClientReport } from '@/lib/reports/reportCompositionEngine';

const report = buildClientReport({
  workspace_id: 'ws_123',
  client_id: 'contact_456',
  client_name: 'Acme Corp',
  report_type: 'monthly',
  include_optional_sections: true,
});
```

### Building a Founder Report

```typescript
import { buildFounderReport } from '@/lib/reports/reportCompositionEngine';

const report = buildFounderReport({
  workspace_id: 'ws_123',
  client_id: 'contact_456',
  client_name: 'Acme Corp',
  report_type: 'ninety_day',
  include_optional_sections: true,
});
```

### Exporting Reports

```typescript
import {
  exportReportToJSON,
  exportReportToHTML,
  exportReportToMarkdown,
} from '@/lib/reports/reportExportComposer';

// JSON export
const json = exportReportToJSON(report);

// HTML with styling
const html = exportReportToHTML(report, 'standard_agency_report');

// Markdown for email/docs
const markdown = exportReportToMarkdown(report);
```

### API Usage

```typescript
const response = await fetch('/api/reports/preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    client_id: 'contact_456',
    workspace_id: 'ws_123',
    report_type: 'monthly',
    client_name: 'Acme Corp',
    layout_variant: 'standard_agency_report',
    view_type: 'founder',
    include_optional: true,
  }),
});

const { report, exports, meta } = await response.json();
```

## Layout Variants

### Standard Agency Report

Full formal report with:
- Cover page with branding
- Table of contents
- All sections displayed
- Professional footer with data coverage notice

### Compact Summary

Condensed version:
- No cover page
- Maximum 5 priority sections
- Ideal for quick reviews

## Truth-Layer Compliance

### Rules Enforced

1. **No fabricated data** - Only display what exists in the database
2. **Explicit omissions** - Show why sections are missing
3. **Data completeness** - Display percentage of available data
4. **Source attribution** - Track which engines provided data
5. **No future promises** - Don't project or predict

### Transparency Features

- Data completeness percentage in header
- Section status badges (complete/partial/limited)
- Omitted sections list with reasons
- Footer notice about data coverage

## Client vs Founder Views

### Client Report

- Optimistic framing
- Shows journey progress
- Highlights wins
- Omits operational details

### Founder Report

- Includes operational section
- Shows resource utilization
- Risk indicators
- Revenue/margin data
- Recommended actions

## Files Modified

- `src/app/client/dashboard/stories/page.tsx` - Added Reports button
- `src/app/founder/dashboard/client-stories/page.tsx` - Added Reports button

## Testing

### Manual Testing

1. Navigate to `/client/dashboard/reports-center`
2. Switch between Weekly/Monthly/90-Day tabs
3. Copy Markdown and verify formatting
4. Download HTML and check styling

5. Navigate to `/founder/dashboard/reports-center`
6. Select different clients
7. Review founder-specific operational section
8. Add founder notes (local only)

### API Testing

```bash
curl -X POST http://localhost:3008/api/reports/preview \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test",
    "workspace_id": "ws_test",
    "report_type": "weekly"
  }'
```

## Future Enhancements

1. **PDF Export** - Add puppeteer-based PDF generation
2. **Email Delivery** - Send reports directly to clients
3. **Report Scheduling** - Automatic weekly/monthly generation
4. **Historical Tracking** - Store generated reports in database
5. **Custom Templates** - Client-specific branding options
6. **AI Summaries** - Generate executive summaries with Claude

## Dependencies

- Existing Phase 73 alignment engine
- Existing Phase 74 storytelling engine
- Existing Phase 75 touchpoints system
- Existing first client journey config

## No Database Changes

Phase 76 does not require any database migrations. Reports are generated on-demand from existing data sources.

## Related Documentation

- [Phase 73: Alignment Engine](./PHASE73_ALIGNMENT_ENGINE.md)
- [Phase 74: Client Storytelling Engine](./PHASE74_CLIENT_STORYTELLING_ENGINE.md)
- [Phase 75: Client Story Touchpoints](./PHASE75_CLIENT_STORY_TOUCHPOINTS.md)
