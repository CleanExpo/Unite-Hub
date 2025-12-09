/**
 * Founder Intel Aggregation Service
 * Phase 80: Aggregate signals from all engines
 */

import {
  AggregatedSignals,
  IntelSignal,
  HealthMetric,
  CreateSnapshotInput,
  BriefingOptions,
  FounderIntelSnapshot,
} from './founderIntelTypes';
import { createSnapshotFromSignals } from './founderIntelSnapshotService';
import { listAlerts, createAlert } from './founderIntelAlertService';
import {
  validateSignalsAgainstTruthLayer,
  computeConfidenceScore,
  computeCompletenessScore,
  annotateSummaryWithTruthDisclaimers,
} from './founderIntelTruthAdapter';

/**
 * Build a global snapshot aggregating all engines
 */
export async function buildGlobalSnapshot(
  timeframe: { start: string; end: string },
  options?: { userId?: string }
): Promise<FounderIntelSnapshot | null> {
  // Aggregate signals from all engines
  const signals = await aggregateSignalsFromEngines(timeframe);

  // Validate against truth layer
  const validation = validateSignalsAgainstTruthLayer(signals.signals);
  if (!validation.isValid) {
    console.warn('Truth layer validation warnings:', validation.warnings);
  }

  // Compute scores
  const completenessScore = computeCompletenessScore(signals);
  const confidenceScore = computeConfidenceScore(signals, {
    has_archive_data: signals.archive_completeness.score > 0,
    has_performance_data: signals.agency_health.score > 0,
    has_client_data: signals.client_health.score > 0,
    data_age_days: calculateDataAgeDays(timeframe.end),
  });

  // Generate summary
  const summary = generateGlobalSummary(signals);

  // Annotate with disclaimers
  const annotatedSummary = annotateSummaryWithTruthDisclaimers(summary, {
    confidence_score: confidenceScore,
    completeness_score: completenessScore,
    missing_data: getMissingDataSources(signals),
    data_age_days: calculateDataAgeDays(timeframe.end),
  });

  // Create snapshot
  const input: CreateSnapshotInput = {
    scope: 'global',
    title: `Global Intelligence - ${formatDateRange(timeframe.start, timeframe.end)}`,
    timeframe_start: timeframe.start,
    timeframe_end: timeframe.end,
    created_by_user_id: options?.userId,
  };

  return createSnapshotFromSignals(
    input,
    signals,
    annotatedSummary,
    confidenceScore,
    completenessScore
  );
}

/**
 * Build a client-specific snapshot
 */
export async function buildClientSnapshot(
  clientId: string,
  timeframe: { start: string; end: string },
  options?: { userId?: string }
): Promise<FounderIntelSnapshot | null> {
  // Aggregate signals for specific client
  const signals = await aggregateSignalsForClient(clientId, timeframe);

  const completenessScore = computeCompletenessScore(signals);
  const confidenceScore = computeConfidenceScore(signals, {
    has_archive_data: signals.archive_completeness.score > 0,
    has_performance_data: signals.agency_health.score > 0,
    has_client_data: true,
    data_age_days: calculateDataAgeDays(timeframe.end),
  });

  const summary = generateClientSummary(clientId, signals);
  const annotatedSummary = annotateSummaryWithTruthDisclaimers(summary, {
    confidence_score: confidenceScore,
    completeness_score: completenessScore,
    missing_data: getMissingDataSources(signals),
    data_age_days: calculateDataAgeDays(timeframe.end),
  });

  const input: CreateSnapshotInput = {
    scope: 'client',
    client_id: clientId,
    title: `Client Intelligence - ${formatDateRange(timeframe.start, timeframe.end)}`,
    timeframe_start: timeframe.start,
    timeframe_end: timeframe.end,
    created_by_user_id: options?.userId,
  };

  return createSnapshotFromSignals(
    input,
    signals,
    annotatedSummary,
    confidenceScore,
    completenessScore
  );
}

/**
 * Summarize signals for briefing
 */
export async function summariseSignalsForBriefing(
  scope: 'global' | 'client',
  timeframe: { start: string; end: string },
  options?: BriefingOptions
): Promise<string> {
  const signals = scope === 'global'
    ? await aggregateSignalsFromEngines(timeframe)
    : await aggregateSignalsFromEngines(timeframe); // Would need clientId for client scope

  const sections: string[] = [];

  sections.push('# Weekly Intelligence Briefing\n');
  sections.push(`**Period:** ${formatDateRange(timeframe.start, timeframe.end)}\n`);

  // Executive Summary
  sections.push('## Executive Summary\n');
  sections.push(generateExecutiveSummary(signals));

  // Key Risks
  if (options?.include_risks !== false) {
    sections.push('\n## Key Risks\n');
    const risks = signals.alerts.filter(a => a.alert_type === 'risk');
    if (risks.length > 0) {
      risks.slice(0, 5).forEach(risk => {
        sections.push(`- **${risk.title}** (${risk.severity}): ${risk.description_markdown.slice(0, 100)}...`);
      });
    } else {
      sections.push('No significant risks identified this period.');
    }
  }

  // Opportunities
  if (options?.include_opportunities !== false) {
    sections.push('\n## Opportunities\n');
    const opps = signals.opportunities;
    if (opps.length > 0) {
      opps.slice(0, 5).forEach(opp => {
        sections.push(`- **${opp.label}** (confidence: ${(opp.confidence * 100).toFixed(0)}%)`);
      });
    } else {
      sections.push('No new opportunities identified this period.');
    }
  }

  // Recommendations
  if (options?.include_recommendations !== false) {
    sections.push('\n## Recommended Actions\n');
    sections.push(generateRecommendations(signals));
  }

  // Data gaps
  const missing = getMissingDataSources(signals);
  if (missing.length > 0) {
    sections.push('\n## Data Gaps\n');
    missing.forEach(gap => {
      sections.push(`- ${gap}`);
    });
  }

  return sections.join('\n');
}

/**
 * Aggregate signals from all engines (demo implementation)
 */
async function aggregateSignalsFromEngines(
  timeframe: { start: string; end: string }
): Promise<AggregatedSignals> {
  // In production, this would call actual engine services
  // For now, return demo data structure

  const signals: IntelSignal[] = [];
  const opportunities: IntelSignal[] = [];

  // Get existing alerts
  const alerts = await listAlerts({
    status: ['open', 'acknowledged', 'in_progress'],
    limit: 20,
  });

  // Generate demo health metrics
  const agencyHealth = generateDemoHealthMetric('Agency Health', 72);
  const clientHealth = generateDemoHealthMetric('Client Health', 78);
  const creativeHealth = generateDemoHealthMetric('Creative Health', 65);
  const scalingRisk = generateDemoHealthMetric('Scaling Risk', 45);
  const ormReality = generateDemoHealthMetric('ORM Reality', 70);
  const archiveCompleteness = generateDemoHealthMetric('Archive Completeness', 85);

  // Add demo signals
  signals.push({
    engine: 'agency_director',
    type: 'metric',
    key: 'team_utilization',
    value: 78,
    label: 'Team Utilization',
    confidence: 0.9,
    context: 'Based on tracked project hours',
  });

  signals.push({
    engine: 'performance',
    type: 'trend',
    key: 'conversion_rate',
    value: 'up',
    label: 'Conversion Rate Trending Up',
    confidence: 0.85,
    context: '12% increase over last week',
  });

  signals.push({
    engine: 'vif',
    type: 'metric',
    key: 'assets_created',
    value: 24,
    label: 'Visual Assets Created',
    confidence: 0.95,
    context: 'Campaign assets generated this period',
  });

  // Add demo opportunities
  opportunities.push({
    engine: 'scaling_engine',
    type: 'opportunity',
    key: 'capacity_expansion',
    value: true,
    label: 'Team capacity available for new client',
    confidence: 0.75,
    context: 'Current utilization leaves room for 1-2 new accounts',
  });

  opportunities.push({
    engine: 'marketing_engine',
    type: 'opportunity',
    key: 'seasonal_campaign',
    value: true,
    label: 'Seasonal campaign opportunity',
    confidence: 0.8,
    context: 'Holiday season approaching - plan campaigns now',
  });

  return {
    agency_health: agencyHealth,
    client_health: clientHealth,
    creative_health: creativeHealth,
    scaling_risk: scalingRisk,
    orm_reality: ormReality,
    archive_completeness: archiveCompleteness,
    signals,
    alerts,
    opportunities,
  };
}

/**
 * Aggregate signals for a specific client
 */
async function aggregateSignalsForClient(
  clientId: string,
  timeframe: { start: string; end: string }
): Promise<AggregatedSignals> {
  // Similar to global but filtered by client
  const globalSignals = await aggregateSignalsFromEngines(timeframe);

  // Filter alerts by client
  const clientAlerts = globalSignals.alerts.filter(
    a => a.client_id === clientId || !a.client_id
  );

  return {
    ...globalSignals,
    alerts: clientAlerts,
  };
}

/**
 * Generate demo health metric
 */
function generateDemoHealthMetric(label: string, score: number): HealthMetric {
  const trend = score > 70 ? 'up' : score < 50 ? 'down' : 'stable';
  const color = score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';

  return {
    score,
    trend,
    label,
    color,
  };
}

/**
 * Generate global summary
 */
function generateGlobalSummary(signals: AggregatedSignals): string {
  const avgHealth = (
    signals.agency_health.score +
    signals.client_health.score +
    signals.creative_health.score +
    signals.orm_reality.score
  ) / 4;

  let summary = `## Global Intelligence Overview\n\n`;
  summary += `**Overall Health Score:** ${avgHealth.toFixed(0)}%\n\n`;

  summary += `### Key Metrics\n`;
  summary += `- Agency Health: ${signals.agency_health.score}% (${signals.agency_health.trend})\n`;
  summary += `- Client Health: ${signals.client_health.score}% (${signals.client_health.trend})\n`;
  summary += `- Creative Health: ${signals.creative_health.score}% (${signals.creative_health.trend})\n`;
  summary += `- Scaling Risk: ${signals.scaling_risk.score}%\n\n`;

  if (signals.alerts.length > 0) {
    const criticalCount = signals.alerts.filter(a => a.severity === 'critical').length;
    const highCount = signals.alerts.filter(a => a.severity === 'high').length;
    summary += `### Active Alerts\n`;
    summary += `- ${criticalCount} critical, ${highCount} high priority\n`;
  }

  if (signals.opportunities.length > 0) {
    summary += `\n### Opportunities\n`;
    summary += `- ${signals.opportunities.length} opportunities identified\n`;
  }

  return summary;
}

/**
 * Generate client summary
 */
function generateClientSummary(clientId: string, signals: AggregatedSignals): string {
  let summary = `## Client Intelligence Overview\n\n`;
  summary += `**Client ID:** ${clientId}\n\n`;
  summary += generateGlobalSummary(signals);
  return summary;
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(signals: AggregatedSignals): string {
  const avgHealth = (
    signals.agency_health.score +
    signals.client_health.score +
    signals.creative_health.score
  ) / 3;

  let status = 'stable';
  if (avgHealth >= 75) {
status = 'strong';
} else if (avgHealth < 50) {
status = 'attention needed';
}

  return `The agency is operating in **${status}** condition with an average health score of ${avgHealth.toFixed(0)}%. ` +
    `${signals.alerts.length} active alerts require attention, and ${signals.opportunities.length} opportunities have been identified.`;
}

/**
 * Generate recommendations
 */
function generateRecommendations(signals: AggregatedSignals): string {
  const recs: string[] = [];

  if (signals.scaling_risk.score < 50) {
    recs.push('- Review team capacity and consider hiring or redistribution');
  }

  if (signals.creative_health.score < 60) {
    recs.push('- Assess creative output quality and team workload');
  }

  const criticalAlerts = signals.alerts.filter(a => a.severity === 'critical');
  if (criticalAlerts.length > 0) {
    recs.push('- Address critical alerts immediately');
  }

  if (signals.opportunities.length > 2) {
    recs.push('- Review and prioritize identified opportunities');
  }

  return recs.length > 0 ? recs.join('\n') : 'No immediate actions recommended.';
}

/**
 * Get missing data sources
 */
function getMissingDataSources(signals: AggregatedSignals): string[] {
  const missing: string[] = [];

  if (signals.agency_health.score === 0) {
missing.push('Agency Director data');
}
  if (signals.creative_health.score === 0) {
missing.push('Creative Director data');
}
  if (signals.archive_completeness.score === 0) {
missing.push('Archive data');
}

  return missing;
}

/**
 * Format date range
 */
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  const endDate = new Date(end).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startDate} - ${endDate}`;
}

/**
 * Calculate data age in days
 */
function calculateDataAgeDays(endDate: string): number {
  return Math.floor((Date.now() - new Date(endDate).getTime()) / (1000 * 60 * 60 * 24));
}
