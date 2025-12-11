import { ExecutiveReport } from '@/lib/guardian/meta/executiveReportService';
import { HealthTimelinePoint } from '@/lib/guardian/meta/healthTimelineService';

/**
 * Export report to JSON format
 */
export function exportReportAsJson(report: ExecutiveReport): string {
  return JSON.stringify(
    {
      metadata: {
        title: report.title,
        reportType: report.reportType,
        audience: report.audience,
        createdAt: report.createdAt.toISOString(),
        periodStart: report.periodStart.toISOString(),
        periodEnd: report.periodEnd.toISOString(),
      },
      summary: report.summary,
      sections: report.sections,
      narrative: report.narrative,
      exportMetadata: report.exportMetadata,
      metadata: report.metadata,
    },
    null,
    2
  );
}

/**
 * Export report to CSV format
 * Flattens sections into row-based format
 */
export function exportReportAsCsv(report: ExecutiveReport): string {
  const rows: string[] = [];

  // Header with metadata
  rows.push('Guardian Executive Report - CSV Export');
  rows.push(`Title,${report.title}`);
  rows.push(`Report Type,${report.reportType}`);
  rows.push(`Audience,${report.audience}`);
  rows.push(`Created,${report.createdAt.toISOString()}`);
  rows.push(`Period,${report.periodStart.toISOString()} to ${report.periodEnd.toISOString()}`);
  rows.push('');

  // Summary section
  rows.push('SUMMARY METRICS');
  rows.push('Metric,Value');
  rows.push(`Readiness Score,${report.summary.readinessScore}/100`);
  rows.push(`Readiness Delta,${report.summary.readinessDelta > 0 ? '+' : ''}${report.summary.readinessDelta}`);
  rows.push(`Edition Alignment,${report.summary.editionAlignmentScore}/100`);
  rows.push(`Uplift Progress,${report.summary.upliftProgressPct}%`);
  rows.push(`Uplift Tasks,${report.summary.upliftTasksCompletedCount}/${report.summary.upliftTasksTotalCount}`);
  rows.push(`Network Health,${report.summary.networkHealthStatus}`);
  rows.push(`Risk Level,${report.summary.riskLevel}`);
  rows.push('');

  // Sections detail
  rows.push('SECTION DETAILS');
  rows.push('Section,Category,Priority,Metric,Value');

  report.sections.forEach((section) => {
    rows.push(
      `"${section.sectionTitle}","${section.category}","${section.priority || 'N/A'}",,`
    );

    // Add metrics for this section
    Object.entries(section.metrics).forEach(([key, value]) => {
      rows.push(`,"","",${key},"${formatCsvValue(value)}"`);
    });

    // Add highlights
    section.highlights.forEach((h) => {
      rows.push(`,"","","highlight","${h.replace(/"/g, '""')}"`);
    });

    rows.push(''); // Blank line between sections
  });

  // Narrative section (if available)
  if (report.narrative) {
    rows.push('');
    rows.push('NARRATIVE');
    if (report.narrative.introParagraph) {
      rows.push(`Intro,"${report.narrative.introParagraph.replace(/"/g, '""')}"`);
    }
    if (report.narrative.keyFindings?.length) {
      report.narrative.keyFindings.forEach((finding) => {
        rows.push(`Key Finding,"${finding.replace(/"/g, '""')}"`);
      });
    }
    if (report.narrative.recommendationsProse) {
      rows.push(
        `Recommendations,"${report.narrative.recommendationsProse.replace(/"/g, '""')}"`
      );
    }
    if (report.narrative.conclusion) {
      rows.push(`Conclusion,"${report.narrative.conclusion.replace(/"/g, '""')}"`);
    }
  }

  return rows.join('\n');
}

/**
 * Export timeline to CSV format
 */
export function exportTimelineAsCsv(timeline: HealthTimelinePoint[]): string {
  const rows: string[] = [];

  // Header
  rows.push('Guardian Health Timeline - CSV Export');
  rows.push('Date,Source,Label,Category,Metric Key,Metric Value,Narrative');

  // Timeline points
  timeline.forEach((point) => {
    rows.push(
      `"${point.occurredAt.toISOString()}","${point.source}","${point.label}","${point.category}","${point.metricKey || ''}","${point.metricValue || ''}","${(point.narrativeSnippet || '').replace(/"/g, '""')}"`
    );
  });

  return rows.join('\n');
}

/**
 * Export report to markdown format (for documentation/sharing)
 */
export function exportReportAsMarkdown(report: ExecutiveReport): string {
  const md: string[] = [];

  // Title and metadata
  md.push(`# ${report.title}`);
  md.push('');
  md.push(
    `**Report Type:** ${report.reportType} | **Audience:** ${report.audience} | **Created:** ${report.createdAt.toLocaleDateString()}`
  );
  md.push(
    `**Period:** ${report.periodStart.toLocaleDateString()} - ${report.periodEnd.toLocaleDateString()}`
  );
  md.push('');

  // Executive Summary
  md.push('## Executive Summary');
  md.push('');
  if (report.narrative?.introParagraph) {
    md.push(report.narrative.introParagraph);
    md.push('');
  }

  // Key Metrics
  md.push('## Key Metrics');
  md.push('');
  md.push('| Metric | Value |');
  md.push('|--------|-------|');
  md.push(`| Readiness Score | ${report.summary.readinessScore}/100 |`);
  md.push(
    `| Readiness Trend | ${report.summary.readinessDelta > 0 ? '📈 ' : '📉 '} ${report.summary.readinessDelta > 0 ? '+' : ''}${report.summary.readinessDelta} |`
  );
  md.push(`| Edition Alignment | ${report.summary.editionAlignmentScore}/100 |`);
  md.push(`| Uplift Progress | ${report.summary.upliftProgressPct}% |`);
  md.push(`| Network Health | ${report.summary.networkHealthStatus} |`);
  md.push(`| Risk Level | **${report.summary.riskLevel.toUpperCase()}** |`);
  md.push('');

  // Sections
  report.sections.forEach((section) => {
    md.push(`## ${section.sectionTitle}`);
    md.push('');
    md.push(`**Category:** ${section.category}`);
    md.push('');

    // Highlights
    if (section.highlights.length > 0) {
      md.push('### Key Highlights');
      md.push('');
      section.highlights.forEach((h) => {
        md.push(`- ${h}`);
      });
      md.push('');
    }

    // Recommendations
    if (section.recommendations.length > 0) {
      md.push('### Recommendations');
      md.push('');
      section.recommendations.forEach((r) => {
        md.push(`- ${r}`);
      });
      md.push('');
    }
  });

  // Narrative section
  if (report.narrative) {
    md.push('## Narrative Analysis');
    md.push('');

    if (report.narrative.keyFindings?.length) {
      md.push('### Key Findings');
      md.push('');
      report.narrative.keyFindings.forEach((finding) => {
        md.push(`- ${finding}`);
      });
      md.push('');
    }

    if (report.narrative.recommendationsProse) {
      md.push('### Strategic Recommendations');
      md.push('');
      md.push(report.narrative.recommendationsProse);
      md.push('');
    }

    if (report.narrative.conclusion) {
      md.push('### Conclusion');
      md.push('');
      md.push(report.narrative.conclusion);
      md.push('');
    }
  }

  // Footer
  md.push('---');
  md.push(
    `*Generated by Guardian Z04 Executive Reporting | ${new Date().toISOString()}*`
  );

  return md.join('\n');
}

/**
 * Format CSV cell value properly
 */
function formatCsvValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
  if (typeof value === 'string') return value.replace(/"/g, '""');
  return String(value);
}

/**
 * Download file to user's browser
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Batch export: Generate all formats for a report
 */
export function generateAllExportFormats(
  report: ExecutiveReport,
  timeline?: HealthTimelinePoint[]
): Record<string, { content: string; mimeType: string; filename: string }> {
  const timestamp = report.createdAt.toISOString().split('T')[0];

  return {
    json: {
      content: exportReportAsJson(report),
      mimeType: 'application/json',
      filename: `report_${timestamp}.json`,
    },
    csv: {
      content: exportReportAsCsv(report),
      mimeType: 'text/csv',
      filename: `report_${timestamp}.csv`,
    },
    markdown: {
      content: exportReportAsMarkdown(report),
      mimeType: 'text/markdown',
      filename: `report_${timestamp}.md`,
    },
    ...(timeline && {
      timeline_csv: {
        content: exportTimelineAsCsv(timeline),
        mimeType: 'text/csv',
        filename: `timeline_${timestamp}.csv`,
      },
    }),
  };
}
