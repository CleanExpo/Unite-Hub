/**
 * Report Generator - Autonomous Platform Audit System
 *
 * Generates comprehensive audit reports in multiple formats:
 * - JSON (for programmatic access)
 * - Markdown (for documentation)
 * - HTML (for web display)
 */

import { v4 as uuidv4 } from 'uuid';
import type { JourneyResult } from './user-journey-runner';
import type { FrictionAnalysis } from './ux-friction-detector';
import type { AuditReport as RouteAuditReport } from './api-route-auditor';
import type { ScheduledAuditResult, HealthCheckResult } from './scheduled-audit-runner';

// ============================================================================
// Types
// ============================================================================

export interface ReportConfig {
  format: ReportFormat;
  include_evidence: boolean;
  include_recommendations: boolean;
  include_metrics: boolean;
  summary_only: boolean;
}

export type ReportFormat = 'json' | 'markdown' | 'html';

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
  overall_status: 'pass' | 'warning' | 'fail' | 'critical';
  overall_score: number;
  key_findings: string[];
  immediate_actions: string[];
  stats: ReportStats;
}

export interface ReportStats {
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
}

export interface ReportSection {
  id: string;
  title: string;
  type: SectionType;
  status: 'pass' | 'warning' | 'fail';
  content: string;
  data?: unknown;
}

export type SectionType =
  | 'health'
  | 'journeys'
  | 'routes'
  | 'friction'
  | 'verification'
  | 'recommendations';

export interface ReportMetadata {
  generator_version: string;
  generation_time_ms: number;
  data_sources: string[];
  config: ReportConfig;
}

// ============================================================================
// Report Generator
// ============================================================================

export class ReportGenerator {
  private readonly generatorId: string;
  private readonly version = '1.0.0';

  constructor() {
    this.generatorId = `report_generator_${uuidv4().slice(0, 8)}`;
  }

  getGeneratorId(): string {
    return this.generatorId;
  }

  /**
   * Generate a comprehensive audit report
   */
  generate(
    data: {
      health?: HealthCheckResult;
      journeys?: JourneyResult[];
      routes?: RouteAuditReport;
      friction?: FrictionAnalysis;
      scheduled?: ScheduledAuditResult[];
    },
    config: Partial<ReportConfig> = {}
  ): AuditReport {
    const startTime = Date.now();
    const fullConfig: ReportConfig = {
      format: 'markdown',
      include_evidence: true,
      include_recommendations: true,
      include_metrics: true,
      summary_only: false,
      ...config,
    };

    const sections: ReportSection[] = [];
    const dataSources: string[] = [];

    // Build sections based on available data
    if (data.health) {
      sections.push(this.buildHealthSection(data.health));
      dataSources.push('health_check');
    }

    if (data.journeys && data.journeys.length > 0) {
      sections.push(this.buildJourneysSection(data.journeys));
      dataSources.push('user_journeys');
    }

    if (data.routes) {
      sections.push(this.buildRoutesSection(data.routes));
      dataSources.push('route_audit');
    }

    if (data.friction) {
      sections.push(this.buildFrictionSection(data.friction));
      dataSources.push('friction_analysis');
    }

    // Add recommendations section
    if (fullConfig.include_recommendations) {
      sections.push(this.buildRecommendationsSection(data));
    }

    // Calculate summary
    const summary = this.calculateSummary(sections, data);

    const report: AuditReport = {
      id: `report_${uuidv4().slice(0, 8)}`,
      generated_at: new Date().toISOString(),
      format: fullConfig.format,
      title: `Platform Audit Report - ${new Date().toLocaleDateString()}`,
      summary,
      sections,
      metadata: {
        generator_version: this.version,
        generation_time_ms: Date.now() - startTime,
        data_sources: dataSources,
        config: fullConfig,
      },
    };

    return report;
  }

  /**
   * Build health check section
   */
  private buildHealthSection(health: HealthCheckResult): ReportSection {
    const passedChecks = health.checks.filter((c) => c.status === 'pass').length;
    const totalChecks = health.checks.length;

    let content = `## Health Check Results\n\n`;
    content += `**Status:** ${this.formatStatus(health.status)}\n\n`;
    content += `**Checks:** ${passedChecks}/${totalChecks} passed\n\n`;
    content += `| Check | Status | Latency |\n`;
    content += `|-------|--------|----------|\n`;

    for (const check of health.checks) {
      const statusIcon = check.status === 'pass' ? '✅' : '❌';
      content += `| ${check.name} | ${statusIcon} | ${check.latency_ms}ms |\n`;
    }

    return {
      id: 'health',
      title: 'System Health',
      type: 'health',
      status:
        health.status === 'healthy' ? 'pass' : health.status === 'degraded' ? 'warning' : 'fail',
      content,
      data: health,
    };
  }

  /**
   * Build journeys section
   */
  private buildJourneysSection(journeys: JourneyResult[]): ReportSection {
    const passed = journeys.filter((j) => j.status === 'passed').length;
    const failed = journeys.filter((j) => j.status === 'failed' || j.status === 'error').length;

    let content = `## User Journey Results\n\n`;
    content += `**Total Journeys:** ${journeys.length}\n`;
    content += `**Passed:** ${passed} | **Failed:** ${failed}\n\n`;

    for (const journey of journeys) {
      const statusIcon = this.getStatusIcon(journey.status);
      content += `### ${statusIcon} ${journey.journey_name}\n\n`;
      content += `- **Status:** ${journey.status}\n`;
      content += `- **Duration:** ${journey.duration_ms}ms\n`;
      content += `- **Steps:** ${journey.steps_passed}/${journey.steps_total} passed\n\n`;

      if (journey.summary.friction_points.length > 0) {
        content += `**Friction Points:**\n`;
        for (const fp of journey.summary.friction_points) {
          content += `- [${fp.severity.toUpperCase()}] ${fp.description}\n`;
        }
        content += `\n`;
      }
    }

    return {
      id: 'journeys',
      title: 'User Journeys',
      type: 'journeys',
      status: failed > 0 ? 'fail' : 'pass',
      content,
      data: journeys,
    };
  }

  /**
   * Build routes section
   */
  private buildRoutesSection(routes: RouteAuditReport): ReportSection {
    let content = `## API Route Audit\n\n`;
    content += `**Total Routes:** ${routes.total_routes}\n`;
    content += `**Passed:** ${routes.routes_passed} | **Failed:** ${routes.routes_failed} | **Warnings:** ${routes.routes_warning}\n`;
    content += `**Average Score:** ${routes.average_score}/100\n\n`;

    // Top issues
    if (routes.summary.top_issues.length > 0) {
      content += `### Top Issues\n\n`;
      for (const issue of routes.summary.top_issues.slice(0, 5)) {
        const icon = this.getSeverityIcon(issue.severity);
        content += `${icon} **${issue.title}** (${issue.category})\n`;
        content += `   ${issue.description}\n\n`;
      }
    }

    // Routes by score (lowest first)
    content += `### Routes by Score\n\n`;
    content += `| Route | Score |\n`;
    content += `|-------|-------|\n`;
    for (const route of routes.summary.routes_by_score.slice(0, 10)) {
      const scoreColor = route.score >= 80 ? '🟢' : route.score >= 60 ? '🟡' : '🔴';
      content += `| ${route.route} | ${scoreColor} ${route.score} |\n`;
    }

    return {
      id: 'routes',
      title: 'API Routes',
      type: 'routes',
      status: routes.routes_failed > 0 ? 'fail' : routes.routes_warning > 0 ? 'warning' : 'pass',
      content,
      data: routes,
    };
  }

  /**
   * Build friction section
   */
  private buildFrictionSection(friction: FrictionAnalysis): ReportSection {
    let content = `## UX Friction Analysis\n\n`;
    content += `**Friction Score:** ${friction.metrics.friction_score}/100 (lower is better)\n`;
    content += `**Total Friction Points:** ${friction.metrics.total_friction_points}\n`;
    content += `**Estimated Resolution Time:** ${friction.metrics.average_resolution_time_estimate}\n\n`;

    // Severity distribution
    content += `### Severity Distribution\n\n`;
    content += `- 🚫 Blocking: ${friction.severity_distribution.blocking}\n`;
    content += `- 😤 Frustrating: ${friction.severity_distribution.frustrating}\n`;
    content += `- 😕 Annoying: ${friction.severity_distribution.annoying}\n`;
    content += `- ℹ️ Minor: ${friction.severity_distribution.minor}\n\n`;

    // Top friction points
    if (friction.friction_points.length > 0) {
      content += `### Friction Points\n\n`;
      for (const fp of friction.friction_points.slice(0, 10)) {
        const icon = this.getSeverityIcon(fp.severity);
        content += `${icon} **${fp.category}** - ${fp.description}\n`;
        if (fp.suggestion) {
          content += `   💡 ${fp.suggestion}\n`;
        }
        content += `\n`;
      }
    }

    return {
      id: 'friction',
      title: 'UX Friction',
      type: 'friction',
      status:
        friction.metrics.friction_score > 50
          ? 'fail'
          : friction.metrics.friction_score > 25
            ? 'warning'
            : 'pass',
      content,
      data: friction,
    };
  }

  /**
   * Build recommendations section
   */
  private buildRecommendationsSection(data: {
    health?: HealthCheckResult;
    journeys?: JourneyResult[];
    routes?: RouteAuditReport;
    friction?: FrictionAnalysis;
  }): ReportSection {
    const recommendations: string[] = [];

    // Health recommendations
    if (data.health?.status !== 'healthy') {
      recommendations.push(
        '🔧 **Fix Health Issues**: Address failing health checks before deploying'
      );
    }

    // Journey recommendations
    if (data.journeys) {
      const failedJourneys = data.journeys.filter(
        (j) => j.status === 'failed' || j.status === 'error'
      );
      if (failedJourneys.length > 0) {
        recommendations.push(
          `🚀 **Fix User Journeys**: ${failedJourneys.length} user journey(s) are failing`
        );
      }
    }

    // Route recommendations
    if (data.routes) {
      if (data.routes.summary.critical_issues > 0) {
        recommendations.push(
          `🔒 **Critical Security**: Address ${data.routes.summary.critical_issues} critical route issue(s)`
        );
      }
      if (data.routes.average_score < 70) {
        recommendations.push(
          `📝 **Improve Route Quality**: Average score is ${data.routes.average_score}. Add validation, error handling, and documentation.`
        );
      }
    }

    // Friction recommendations
    if (data.friction) {
      if (data.friction.metrics.friction_score > 50) {
        recommendations.push(
          `🎯 **Reduce Friction**: Score of ${data.friction.metrics.friction_score} indicates significant UX issues`
        );
      }
      if (data.friction.severity_distribution.blocking > 0) {
        recommendations.push(
          `🚫 **Fix Blocking Issues**: ${data.friction.severity_distribution.blocking} blocking issue(s) preventing user actions`
        );
      }
    }

    // Default recommendations if none found
    if (recommendations.length === 0) {
      recommendations.push('✅ **All Clear**: No immediate actions required');
      recommendations.push('📊 **Continue Monitoring**: Schedule regular audits');
    }

    let content = `## Recommendations\n\n`;
    content += `### Immediate Actions\n\n`;
    for (const rec of recommendations) {
      content += `${rec}\n\n`;
    }

    return {
      id: 'recommendations',
      title: 'Recommendations',
      type: 'recommendations',
      status: recommendations.some((r) => r.includes('Critical') || r.includes('blocking'))
        ? 'fail'
        : recommendations.some((r) => r.includes('Fix'))
          ? 'warning'
          : 'pass',
      content,
    };
  }

  /**
   * Calculate report summary
   */
  private calculateSummary(
    sections: ReportSection[],
    data: {
      health?: HealthCheckResult;
      journeys?: JourneyResult[];
      routes?: RouteAuditReport;
      friction?: FrictionAnalysis;
    }
  ): ReportSummary {
    const failedSections = sections.filter((s) => s.status === 'fail').length;
    const warningSections = sections.filter((s) => s.status === 'warning').length;

    let overallStatus: ReportSummary['overall_status'] = 'pass';
    if (failedSections > 0) {
      overallStatus = failedSections > 1 ? 'critical' : 'fail';
    } else if (warningSections > 0) {
      overallStatus = 'warning';
    }

    // Calculate overall score
    const scores: number[] = [];
    if (data.routes) scores.push(data.routes.average_score);
    if (data.friction) scores.push(100 - data.friction.metrics.friction_score);
    if (data.journeys) {
      const journeyScore =
        (data.journeys.filter((j) => j.status === 'passed').length / data.journeys.length) * 100;
      scores.push(journeyScore);
    }
    const overallScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;

    // Key findings
    const keyFindings: string[] = [];
    if (data.health?.status !== 'healthy') {
      keyFindings.push(`Health status: ${data.health?.status}`);
    }
    if (data.journeys) {
      const failed = data.journeys.filter((j) => j.status === 'failed').length;
      if (failed > 0) {
        keyFindings.push(`${failed} user journey(s) failing`);
      }
    }
    if (data.routes && data.routes.average_score < 70) {
      keyFindings.push(`Route quality score: ${data.routes.average_score}/100`);
    }
    if (data.friction && data.friction.metrics.friction_score > 50) {
      keyFindings.push(`High friction score: ${data.friction.metrics.friction_score}`);
    }

    // Immediate actions
    const immediateActions: string[] = [];
    if (overallStatus === 'critical' || overallStatus === 'fail') {
      immediateActions.push('Review and fix failing checks before deployment');
    }
    if (data.routes?.summary.critical_issues) {
      immediateActions.push('Address critical security issues in API routes');
    }

    // Stats
    const stats: ReportStats = {
      total_checks: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      critical_issues: data.routes?.summary.critical_issues || 0,
      high_issues: data.routes?.summary.high_issues || 0,
      medium_issues: data.routes?.summary.medium_issues || 0,
      low_issues: data.routes?.summary.low_issues || 0,
    };

    if (data.health) {
      stats.total_checks += data.health.checks.length;
      stats.passed += data.health.checks.filter((c) => c.status === 'pass').length;
      stats.failed += data.health.checks.filter((c) => c.status === 'fail').length;
    }

    if (data.routes) {
      stats.total_checks += data.routes.total_routes;
      stats.passed += data.routes.routes_passed;
      stats.failed += data.routes.routes_failed;
      stats.warnings += data.routes.routes_warning;
    }

    return {
      overall_status: overallStatus,
      overall_score: overallScore,
      key_findings: keyFindings,
      immediate_actions: immediateActions,
      stats,
    };
  }

  /**
   * Export report to specified format
   */
  export(report: AuditReport): string {
    switch (report.format) {
      case 'json':
        return this.exportJson(report);
      case 'markdown':
        return this.exportMarkdown(report);
      case 'html':
        return this.exportHtml(report);
      default:
        return this.exportMarkdown(report);
    }
  }

  /**
   * Export as JSON
   */
  private exportJson(report: AuditReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export as Markdown
   */
  private exportMarkdown(report: AuditReport): string {
    let md = `# ${report.title}\n\n`;
    md += `*Generated: ${new Date(report.generated_at).toLocaleString()}*\n\n`;

    // Summary
    md += `## Executive Summary\n\n`;
    md += `**Overall Status:** ${this.formatStatus(report.summary.overall_status)}\n`;
    md += `**Overall Score:** ${report.summary.overall_score}/100\n\n`;

    if (report.summary.key_findings.length > 0) {
      md += `### Key Findings\n\n`;
      for (const finding of report.summary.key_findings) {
        md += `- ${finding}\n`;
      }
      md += `\n`;
    }

    if (report.summary.immediate_actions.length > 0) {
      md += `### Immediate Actions Required\n\n`;
      for (const action of report.summary.immediate_actions) {
        md += `- ⚠️ ${action}\n`;
      }
      md += `\n`;
    }

    // Stats
    md += `### Statistics\n\n`;
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Checks | ${report.summary.stats.total_checks} |\n`;
    md += `| Passed | ${report.summary.stats.passed} |\n`;
    md += `| Failed | ${report.summary.stats.failed} |\n`;
    md += `| Warnings | ${report.summary.stats.warnings} |\n`;
    md += `| Critical Issues | ${report.summary.stats.critical_issues} |\n`;
    md += `| High Issues | ${report.summary.stats.high_issues} |\n`;
    md += `\n---\n\n`;

    // Sections
    for (const section of report.sections) {
      md += section.content;
      md += `\n---\n\n`;
    }

    // Footer
    md += `\n---\n\n`;
    md += `*Report ID: ${report.id}*\n`;
    md += `*Generator: v${report.metadata.generator_version}*\n`;
    md += `*Generation Time: ${report.metadata.generation_time_ms}ms*\n`;

    return md;
  }

  /**
   * Export as HTML
   */
  private exportHtml(report: AuditReport): string {
    const md = this.exportMarkdown(report);

    // Simple markdown to HTML conversion
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; }
    h1 { color: #1a1a2e; border-bottom: 3px solid #4a90d9; padding-bottom: 0.5rem; }
    h2 { color: #16213e; margin-top: 2rem; }
    h3 { color: #0f3460; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f5f5f5; }
    .pass { color: #22c55e; }
    .warning { color: #f59e0b; }
    .fail { color: #ef4444; }
    .critical { color: #dc2626; font-weight: bold; }
    hr { margin: 2rem 0; border: none; border-top: 1px solid #ddd; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
    code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 3px; }
  </style>
</head>
<body>
`;

    // Convert markdown to HTML (simplified)
    html += md
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^---$/gm, '<hr>')
      .replace(/✅/g, '<span class="pass">✅</span>')
      .replace(/❌/g, '<span class="fail">❌</span>')
      .replace(/⚠️/g, '<span class="warning">⚠️</span>');

    html += `
</body>
</html>`;

    return html;
  }

  /**
   * Format status for display
   */
  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pass: '✅ Pass',
      passed: '✅ Passed',
      healthy: '✅ Healthy',
      warning: '⚠️ Warning',
      degraded: '⚠️ Degraded',
      fail: '❌ Fail',
      failed: '❌ Failed',
      unhealthy: '❌ Unhealthy',
      critical: '🚨 Critical',
      error: '🚨 Error',
    };
    return statusMap[status] || status;
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      pass: '✅',
      passed: '✅',
      warning: '⚠️',
      partial: '⚠️',
      fail: '❌',
      failed: '❌',
      error: '🚨',
    };
    return iconMap[status] || '❓';
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: string): string {
    const iconMap: Record<string, string> = {
      critical: '🚨',
      high: '🔴',
      medium: '🟡',
      low: '🟢',
    };
    return iconMap[severity] || 'ℹ️';
  }
}

export default ReportGenerator;
