# Guardian Z04: Executive Reporting & Health Timeline Storyboards

**Status**: ✅ Complete (schemas, services, APIs, UI, export, tests, docs)
**Scope**: Executive-level reporting with immutable health timeline events
**Type**: Z-Series (Advisory-only, observation layer; no runtime impact)

---

## Overview

Z04 adds **Executive Reporting** and **Health Timeline** capabilities — enabling executives and operations teams to monitor Guardian health, observe trends, and plan future adoption strategically. Each report is a snapshot of current readiness, edition alignment, uplift progress, and risks; the timeline provides an immutable audit trail of all major state changes.

**Key Features**:
- ✅ Executive reports (monthly, quarterly, custom, snapshot)
- ✅ Health timeline with immutable append-only event log
- ✅ Timeline projections (forecasting next milestones)
- ✅ Section-based report structure (readiness, editions, uplift, network, gaps, risks)
- ✅ Optional AI narratives (Claude Sonnet-powered summaries and risk assessments)
- ✅ Multi-format export (JSON, CSV, Markdown)
- ✅ Advisory-only framing (no enforcement or licensing)
- ✅ Privacy-preserving (no PII, aggregated metrics only)
- ✅ Dashboard with report history and timeline visualization
- ✅ 40+ comprehensive tests
- ✅ Full RLS enforcement on tenant-scoped tables

---

## Architecture

### 1. Schema: Executive Reports

**Table: `guardian_executive_reports`**

```sql
CREATE TABLE guardian_executive_reports (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES workspaces(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'custom', 'snapshot'
  audience TEXT NOT NULL DEFAULT 'executive', -- 'executive' | 'ops' | 'board'

  -- Content
  summary JSONB NOT NULL, -- { readiness_score, edition_alignment, etc. }
  sections JSONB NOT NULL, -- Array of report sections with metrics/highlights
  narrative JSONB NOT NULL DEFAULT '{}', -- Optional AI prose

  -- Context
  edition_key TEXT NULL,
  uplift_plan_id UUID NULL,

  -- Export
  export_metadata JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);
```

**RLS**: Tenant-scoped via `tenant_id = get_current_workspace_id()`

### 2. Schema: Health Timeline

**Table: `guardian_health_timeline_points`**

```sql
CREATE TABLE guardian_health_timeline_points (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES workspaces(id),

  -- Event metadata
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT NOT NULL, -- 'readiness', 'edition_fit', 'uplift', 'network', 'qa', 'governance'
  label TEXT NOT NULL, -- Human-readable event name
  category TEXT NOT NULL, -- 'core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance', 'meta'

  -- Metrics (optional)
  metric_key TEXT NULL,
  metric_value NUMERIC NULL,

  -- Narrative (no PII)
  narrative_snippet TEXT NULL,

  -- Audit trail
  related_ids JSONB NOT NULL, -- { snapshot_id, plan_id, task_id, etc. }
  metadata JSONB DEFAULT '{}'
);
```

**RLS**: Tenant-scoped; append-only (INSERT allowed, UPDATE/DELETE denied via RLS)

---

## Services

### healthTimelineService.ts

**Timeline Point Generation**:

```typescript
generateTimelinePointsFromReadiness(tenantId, currentSnapshot, previousSnapshot)
// Detects: readiness deltas (≥5 pts), status transitions, capability milestones

generateTimelinePointsFromEditionFit(tenantId, currentFits, previousFits)
// Detects: fit score changes, status transitions, gap closures

generateTimelinePointsFromUplift(tenantId, currentPlan, currentTasks, previousTasks)
// Detects: task completions, plan status changes, completion milestones
```

**Timeline Loading**:

```typescript
loadRecentTimeline(tenantId, daysPast = 90) → HealthTimelinePoint[]
loadTimelineByCategory(tenantId, category, daysPast = 90) → HealthTimelinePoint[]
persistTimelinePoints(tenantId, points) → Promise<void>
```

**Timeline Projections** (forecasting):

```typescript
projectTimelineForward(tenantId, recentTimeline, daysForward = 30)
// Returns: [{ projectedDate, label, confidence, narrativeSnippet }]
// Predicts: readiness milestones, edition alignment, uplift completion
```

### executiveReportService.ts

**Report Assembly**:

```typescript
assembleExecutiveReportForTenant(tenantId, readiness, editions, uplift, timeline, options)
// Pulls current state from all sources, builds:
//   - summary metrics (readiness, edition alignment, risk, etc.)
//   - sections (readiness, editions, uplift, gaps, network)
//   - highlights and recommendations per section
//   - optional edition/uplift focus

persistExecutiveReport(report) → Promise<ExecutiveReport & { id }>
loadExecutiveReportsForTenant(tenantId, limit) → Promise<ExecutiveReport[]>
loadExecutiveReportById(tenantId, reportId) → Promise<ExecutiveReport | null>
```

**Report Sections**:

1. **Readiness Overview** — Capability deployment status, trends
2. **Edition Alignment** — Progress toward each edition target
3. **Uplift Progress** — Plan execution, task completion %, blockers
4. **Gaps & Recommendations** — Priority gaps across editions
5. **Network Intelligence** — X-series telemetry, anomalies (if available)

### executiveReportAiHelper.ts

**Optional AI Narratives** (Claude Sonnet):

```typescript
generateExecutiveReportNarrative(report, enableAiNarrative)
// Returns: { introParagraph, keyFindings[], recommendationsProse, conclusion }
// Uses: Sonnet for business-focused language, no marketing, no PII

generateReportHighlights(report, enableAiHighlights)
// Returns: [highlight1, highlight2, highlight3]

generateRiskAssessmentNarrative(report, enableAiRiskAnalysis)
// Returns: 1-paragraph risk assessment with mitigation priorities

enrichReportWithAiNarratives(report, options)
// Batch operation: enriches report in-place with all AI features
```

**Feature Flags**: All AI features are optional, gracefully degrade on failure.

### reportExportService.ts

**Export Formats**:

```typescript
exportReportAsJson(report) → string
exportReportAsCsv(report) → string
exportReportAsMarkdown(report) → string
exportTimelineAsCsv(timeline) → string
generateAllExportFormats(report, timeline?) → Record<format, { content, mimeType, filename }>

downloadFile(content, filename, mimeType)
// Browser helper for client-side downloads
```

---

## APIs

### GET /api/guardian/meta/reports

**List executive reports for a tenant**

```
Query: workspaceId, limit (default 10), reportType (optional filter)
Response:
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "...",
        "title": "Monthly Guardian Report - January 2025",
        "reportType": "monthly",
        "audience": "executive",
        "createdAt": "2025-01-31T10:00:00Z",
        "periodStart": "2025-01-01T00:00:00Z",
        "periodEnd": "2025-01-31T23:59:59Z",
        "summary": {
          "readinessScore": 75,
          "readinessDelta": 10,
          "editionAlignmentScore": 68,
          "upliftProgressPct": 60,
          "networkHealthStatus": "healthy",
          "riskLevel": "low"
        }
      }
    ],
    "count": 5
  }
}
```

### POST /api/guardian/meta/reports

**Generate and persist a new executive report**

```
Query: workspaceId
Body: {
  "reportType": "monthly" | "quarterly" | "custom" | "snapshot",
  "audience": "executive" | "ops" | "board",
  "editionKey": "guardian_pro" (optional),
  "enableAiNarrative": true (optional),
  "title": "Custom Report Title" (optional)
}

Response:
{
  "success": true,
  "data": {
    "message": "Executive report generated successfully",
    "report": {
      "id": "report-123",
      "title": "...",
      "reportType": "monthly",
      "summary": { ... },
      "sections": [ ... ],
      "hasNarrative": true
    }
  }
}
```

### GET /api/guardian/meta/reports/[id]

**Retrieve a specific report**

```
Query: workspaceId
Params: id (report ID)

Response: Full report with all sections, narrative, metadata
```

### GET /api/guardian/meta/timeline

**Load health timeline with projections**

```
Query: workspaceId, daysPast (default 90), category (optional filter)

Response:
{
  "success": true,
  "data": {
    "timeline": [
      {
        "id": "point-1",
        "occurredAt": "2025-01-15T10:00:00Z",
        "source": "readiness",
        "label": "Readiness improved",
        "category": "core",
        "metricKey": "readiness_overall_score",
        "metricValue": 75,
        "narrativeSnippet": "Score improved from 60 to 75"
      }
    ],
    "projections": [
      {
        "projectedDate": "2025-02-15T00:00:00Z",
        "label": "Readiness target (80 - mature)",
        "category": "core",
        "confidence": 0.6,
        "narrativeSnippet": "Based on current trends, readiness should reach mature level"
      }
    ],
    "count": 42,
    "periodDays": 90
  }
}
```

---

## UI Integration

### Executive Dashboard

**Location**: `/app/guardian/admin/executive/page.tsx`

**Features**:
- ✅ Report generation button (monthly, quarterly, custom)
- ✅ Current report summary card with 5 key metrics (readiness, alignment, uplift, health, risk)
- ✅ Report sections grid with expandable details
- ✅ Health timeline sidebar (recent 8 events with icons)
- ✅ Report history list for quick navigation
- ✅ Export buttons (JSON, CSV, PDF placeholder)
- ✅ Error handling and loading states

**Interaction Flow**:
1. User opens Executive dashboard
2. System loads latest reports and timeline
3. User clicks "Generate Report" to create new monthly/quarterly report
4. Optional: Enable AI narrative enrichment
5. Report appears at top of list and is selected
6. User views summary metrics and expandable sections
7. User scrolls timeline sidebar to see recent events and projections
8. User clicks "Export" to download JSON/CSV/markdown
9. User clicks report in history to view previous reports

---

## Z02 & Z03 Integration

**Edition-Scoped Reports**:
- Report can focus on specific edition (e.g., "Guardian Pro Adoption Report")
- Automatically includes edition-specific fit scores and gaps
- Uplift plan linked to report for context

**Timeline Events**:
- Z02 uplift milestones (task completions, plan status)
- Z03 edition alignment changes (fit score transitions, gap closures)
- Combined with Z01 readiness changes for holistic view

---

## Testing

**Test File**: `tests/guardian/z04_executive_reports_and_timeline.test.ts`

**Coverage** (40+ tests):
- ✅ Timeline point generation (readiness, editions, uplift events)
- ✅ Status transitions and milestone detection
- ✅ Capability achievement tracking
- ✅ Timeline projections (forecasting, confidence scores)
- ✅ Report assembly (section generation, metric calculation, risk levels)
- ✅ Edition alignment scoring
- ✅ Risk level determination
- ✅ Report export (JSON, CSV, Markdown)
- ✅ Export format validity (parseable JSON, proper CSV structure)
- ✅ Timeline export with audit trail
- ✅ Batch export generation
- ✅ Privacy guardrails (no PII in narratives, advisory-only language)
- ✅ Immutability and audit trail preservation

**Run**:
```bash
npm run test -- z04_executive_reports_and_timeline
```

---

## Privacy & Security

### Non-Breaking, Advisory-Only

- ✅ Reports are descriptive observations, never enforcement
- ✅ No feature gating based on report findings
- ✅ No automatic configuration changes triggered by reports
- ✅ Tenants remain fully in control

### Privacy Guarantees

- ✅ No PII in timeline narratives or report sections
- ✅ Only aggregated metrics (counts, scores, flags)
- ✅ No raw logs, no user data, no sensitive metadata
- ✅ Generic capability keys only
- ✅ Timeline events redact personal information

### Immutable Audit Trail

- ✅ Executive reports persist as snapshots (read-only after creation)
- ✅ Health timeline append-only (no updates/deletes allowed via RLS)
- ✅ Related IDs enable tracing back to source objects
- ✅ Full compliance history for audits

### RLS Enforcement

- ✅ `guardian_executive_reports`: Tenant isolation on `tenant_id`
- ✅ `guardian_health_timeline_points`: Tenant isolation + append-only pattern
- ✅ No cross-tenant data leakage possible

---

## Deployment Checklist

- [x] Migration 599: Create `guardian_executive_reports` and `guardian_health_timeline_points`
- [x] `healthTimelineService.ts`: Timeline generation, loading, projections
- [x] `executiveReportService.ts`: Report assembly and persistence
- [x] `executiveReportAiHelper.ts`: Optional AI narratives (Claude Sonnet)
- [x] `reportExportService.ts`: JSON/CSV/Markdown export hooks
- [x] APIs: GET reports, POST reports, GET report detail, GET timeline
- [x] UI: Executive dashboard page with report generation and timeline visualization
- [x] Tests: 40+ comprehensive tests covering all functionality
- [x] Documentation: This comprehensive guide

**Deployment Order**:
1. Apply migration 599
2. Deploy timeline service
3. Deploy report assembly service
4. Deploy AI helper (optional)
5. Deploy export service
6. Deploy APIs
7. Deploy executive dashboard UI
8. Run tests to validate
9. Access `/app/guardian/admin/executive` to verify

---

## Future Enhancements

- [ ] PDF export with styled templates
- [ ] Email-based report distribution (scheduled monthly/quarterly)
- [ ] Report comparison (month-over-month, quarter-over-quarter trends)
- [ ] Custom metrics and KPI tracking
- [ ] Segment-specific reports (by team, by capability, by edition)
- [ ] Real-time dashboard (live readiness, timeline streaming)
- [ ] Alerts on critical state changes (readiness drops, risks increase)
- [ ] Integration with business intelligence tools (Tableau, Power BI)
- [ ] White-label reports for client delivery (Synthex use case)
- [ ] Timeline playback (historical state reconstruction)

---

## References

- **Z01**: Capability Manifest & Readiness Scoring
- **Z02**: Guided Uplift Planner & Adoption Playbooks
- **Z03**: Editions & Fit Scoring
- **X-Series**: Network Intelligence (telemetry, anomalies)
- **G-Series**: Core Guardian (rules, alerts, incidents)

---

*Last Updated: 2025-12-12*
*Z04 Status: Complete with migration, services, APIs, UI, export, 40+ tests, and full documentation*
