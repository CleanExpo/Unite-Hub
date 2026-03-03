# Report Generator

> Data aggregation, multi-format report output, scheduled reporting, and template-driven document generation for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `report-generator`                                       |
| **Category**   | Communication & Reporting                                |
| **Complexity** | Medium                                                   |
| **Complements**| `metrics-collector`, `pdf-generator`, `audit-trail`      |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies report generation patterns for NodeJS-Starter-V1: section-based report composition, multi-format export (JSON, Markdown, HTML), scheduled daily reports via cron, data aggregation from multiple sources, executive summary calculation, and template-driven rendering.

---

## When to Apply

### Positive Triggers

- Generating audit reports from health checks and journey tests
- Building executive summary dashboards from aggregated metrics
- Scheduling daily or weekly report generation via cron
- Exporting data in multiple formats (JSON, Markdown, HTML, PDF)
- Creating section-based reports with severity scoring

### Negative Triggers

- Generating PDF documents (use `pdf-generator` skill)
- Real-time dashboard rendering (use `dashboard-patterns` skill)
- Logging individual events (use `structured-logging` skill)
- Audit event recording (use `audit-trail` skill)

---

## Core Principles

### The Three Laws of Report Generation

1. **Section-Based Composition**: Reports are built from independent sections. Each section has its own data source, status, and content. Sections compose into a final report — never build monolithic reports.
2. **Format Is a Presentation Concern**: The report data model is format-agnostic. JSON, Markdown, and HTML are export formats applied at the final step. Never embed format-specific logic in data aggregation.
3. **Scores Are Calculated, Not Guessed**: Overall status and scores derive from section results via deterministic formulas. Never hardcode a status — calculate it from the evidence.

---

## Pattern 1: Report Data Model (TypeScript)

### Section-Based Report Structure

```typescript
// apps/web/lib/audit/report-generator.ts

export type ReportFormat = "json" | "markdown" | "html";

export interface ReportConfig {
  format: ReportFormat;
  include_evidence: boolean;
  include_recommendations: boolean;
  include_metrics: boolean;
  summary_only: boolean;
}

export interface AuditReport {
  id: string;
  generated_at: string;
  format: ReportFormat;
  title: string;
  summary: ReportSummary;
  sections: ReportSection[];
  metadata: ReportMetadata;
}

export interface ReportSummary {
  overall_status: "pass" | "warning" | "fail" | "critical";
  overall_score: number;
  key_findings: string[];
  immediate_actions: string[];
  stats: ReportStats;
}

export interface ReportSection {
  id: string;
  title: string;
  type: SectionType;
  status: "pass" | "warning" | "fail";
  content: string;
  data?: unknown;
}

export type SectionType =
  | "health"
  | "journeys"
  | "routes"
  | "friction"
  | "verification"
  | "recommendations";
```

**Project Reference**: `apps/web/lib/audit/report-generator.ts:20-74` — the existing `AuditReport`, `ReportSummary`, `ReportSection`, and `ReportStats` interfaces define the full report data model.

---

## Pattern 2: Report Generator Class

### Multi-Source Data Aggregation

```typescript
export class ReportGenerator {
  private readonly version = "1.0.0";

  generate(
    data: {
      health?: HealthCheckResult;
      journeys?: JourneyResult[];
      routes?: RouteAuditReport;
      friction?: FrictionAnalysis;
    },
    config: Partial<ReportConfig> = {},
  ): AuditReport {
    const startTime = Date.now();
    const sections: ReportSection[] = [];
    const dataSources: string[] = [];

    // Build sections from available data sources
    if (data.health) {
      sections.push(this.buildHealthSection(data.health));
      dataSources.push("health_check");
    }

    if (data.journeys?.length) {
      sections.push(this.buildJourneysSection(data.journeys));
      dataSources.push("user_journeys");
    }

    if (data.routes) {
      sections.push(this.buildRoutesSection(data.routes));
      dataSources.push("route_audit");
    }

    // Calculate summary from section results
    const summary = this.calculateSummary(sections, data);

    return {
      id: `report_${crypto.randomUUID().slice(0, 8)}`,
      generated_at: new Date().toISOString(),
      format: config.format ?? "markdown",
      title: `Platform Audit Report - ${new Date().toLocaleDateString("en-AU")}`,
      summary,
      sections,
      metadata: {
        generator_version: this.version,
        generation_time_ms: Date.now() - startTime,
        data_sources: dataSources,
        config: { ...defaultConfig, ...config },
      },
    };
  }
}
```

**Project Reference**: `apps/web/lib/audit/report-generator.ts:87-170` — the existing `ReportGenerator.generate()` method aggregates health, journeys, routes, and friction data into a unified report.

---

## Pattern 3: Score Calculation

### Deterministic Summary from Section Evidence

```typescript
private calculateSummary(
  sections: ReportSection[],
  data: ReportData,
): ReportSummary {
  const failedSections = sections.filter((s) => s.status === "fail").length;
  const warningSections = sections.filter((s) => s.status === "warning").length;

  // Deterministic status from evidence
  let overallStatus: ReportSummary["overall_status"] = "pass";
  if (failedSections > 1) overallStatus = "critical";
  else if (failedSections === 1) overallStatus = "fail";
  else if (warningSections > 0) overallStatus = "warning";

  // Score from available data sources
  const scores: number[] = [];
  if (data.routes) scores.push(data.routes.average_score);
  if (data.friction) scores.push(100 - data.friction.metrics.friction_score);
  if (data.journeys) {
    const passed = data.journeys.filter((j) => j.status === "passed").length;
    scores.push((passed / data.journeys.length) * 100);
  }

  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 100;

  return {
    overall_status: overallStatus,
    overall_score: overallScore,
    key_findings: this.extractKeyFindings(data),
    immediate_actions: this.extractImmediateActions(data, overallStatus),
    stats: this.calculateStats(data),
  };
}
```

**Rule**: Scores are always calculated from evidence, never hardcoded. The formula averages available data source scores — if a source is missing, it is excluded from the calculation rather than assumed.

---

## Pattern 4: Multi-Format Export

### Format-Agnostic Report with Pluggable Renderers

```typescript
export(report: AuditReport): string {
  switch (report.format) {
    case "json":
      return JSON.stringify(report, null, 2);
    case "markdown":
      return this.exportMarkdown(report);
    case "html":
      return this.exportHtml(report);
    default:
      return this.exportMarkdown(report);
  }
}

private exportMarkdown(report: AuditReport): string {
  let md = `# ${report.title}\n\n`;
  md += `*Generated: ${new Date(report.generated_at).toLocaleString("en-AU")}*\n\n`;

  // Executive Summary
  md += `## Executive Summary\n\n`;
  md += `**Overall Status:** ${this.formatStatus(report.summary.overall_status)}\n`;
  md += `**Overall Score:** ${report.summary.overall_score}/100\n\n`;

  // Sections
  for (const section of report.sections) {
    md += section.content;
    md += `\n---\n\n`;
  }

  // Footer
  md += `*Report ID: ${report.id}*\n`;
  md += `*Generator: v${report.metadata.generator_version}*\n`;

  return md;
}
```

**Project Reference**: `apps/web/lib/audit/report-generator.ts:501-628` — the existing `export()` method dispatches to `exportJson()`, `exportMarkdown()`, and `exportHtml()` renderers. The HTML renderer wraps converted Markdown in a styled template.

---

## Pattern 5: Scheduled Report Generation (Python)

### Cron-Triggered Daily Reports

```python
from datetime import datetime, timedelta
from src.utils import get_logger

logger = get_logger(__name__)


async def generate_daily_report() -> dict:
    """Generate daily platform audit report.

    Called by the cron scheduler — see cron-scheduler skill.
    """
    # Aggregate data from multiple sources
    health = await check_system_health()
    metrics = await get_metrics_summary(
        start=datetime.now() - timedelta(days=1),
        end=datetime.now(),
    )
    incidents = await get_recent_incidents(hours=24)

    # Build report sections
    sections = []
    if health:
        sections.append({
            "id": "health",
            "title": "System Health",
            "status": health["overall_status"],
            "content": format_health_section(health),
        })

    if metrics:
        sections.append({
            "id": "metrics",
            "title": "Daily Metrics",
            "status": "pass" if metrics["error_rate"] < 0.01 else "warning",
            "content": format_metrics_section(metrics),
        })

    # Calculate overall score
    failed = sum(1 for s in sections if s["status"] == "fail")
    overall_status = "critical" if failed > 1 else "fail" if failed else "pass"

    report = {
        "generated_at": datetime.now().isoformat(),
        "period": "daily",
        "overall_status": overall_status,
        "sections": sections,
    }

    # Store and notify
    await store_report(report)
    await notify_team(report)

    logger.info(
        "daily_report_generated",
        status=overall_status,
        sections=len(sections),
    )
    return report
```

**Complements**: `cron-scheduler` skill — triggers `generate_daily_report()` on schedule. `notification-system` skill — sends report via email and in-app channels. `metrics-collector` skill — provides metrics data for the daily summary.

---

## Pattern 6: Report API Endpoint

### On-Demand Report Generation

```typescript
// apps/web/app/api/reports/route.ts
import { ReportGenerator } from "@/lib/audit/report-generator";

export async function POST(request: Request) {
  const { format = "markdown", sources = [] } = await request.json();

  const generator = new ReportGenerator();
  const data: Record<string, unknown> = {};

  // Fetch requested data sources
  if (sources.includes("health")) {
    const res = await fetch(`${process.env.BACKEND_URL}/api/health/deep`);
    data.health = await res.json();
  }

  if (sources.includes("routes")) {
    data.routes = await auditRoutes();
  }

  const report = generator.generate(data, { format });
  const output = generator.export(report);

  const contentType =
    format === "json"
      ? "application/json"
      : format === "html"
        ? "text/html"
        : "text/markdown";

  return new Response(output, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="report-${report.id}.${format === "json" ? "json" : format === "html" ? "html" : "md"}"`,
    },
  });
}
```

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Monolithic report builder | Cannot add new sections | Section-based composition |
| Format logic in aggregation | Tightly coupled, hard to add formats | Format-agnostic data model |
| Hardcoded status | Misleading when data changes | Calculate from section evidence |
| No metadata | Cannot reproduce or audit reports | Include ID, timestamp, version, config |
| Synchronous PDF generation | Blocks API response | Background generation with queue |

---

## Checklist

Before merging report-generator changes:

- [ ] `AuditReport` with sections, summary, and metadata
- [ ] `ReportGenerator` with multi-source data aggregation
- [ ] Deterministic score calculation from section evidence
- [ ] Multi-format export (JSON, Markdown, HTML)
- [ ] Scheduled daily report generation via cron
- [ ] Report API endpoint with format selection
- [ ] Australian locale for dates and number formatting

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Report Generator Implementation

**Data Model**: [section-based / flat]
**Formats**: [JSON, Markdown, HTML, PDF]
**Scheduling**: [cron / on-demand / both]
**Data Sources**: [health, journeys, routes, metrics]
**Delivery**: [API download / email / both]
**Locale**: [en-AU / configurable]
```
