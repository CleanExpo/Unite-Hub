/**
 * Early Warning Founder Bridge
 * Phase 82: Integrates Early Warning Engine with Founder Intelligence Console
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  EarlyWarningEvent,
  MatrixEvaluation,
  UnifiedSignalMatrix,
  getWarningTypeLabel,
} from './signalMatrixTypes';
import { listWarningEvents, getOpenWarningCount, getWarningsBySeverity } from './earlyWarningSnapshotService';
import { evaluateMatrixRow } from './earlyWarningEngineService';
import { getLatestMatrix } from './signalMatrixCollectorService';

/**
 * Founder Intel alert from Early Warning
 */
export interface FounderEarlyWarningAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alert_type: 'risk' | 'opportunity' | 'anomaly' | 'info';
  source_engine: 'early_warning';
  metadata: Record<string, unknown>;
}

/**
 * Inject warnings into Founder Intel alerts
 */
export async function generateFounderAlertsFromWarnings(): Promise<FounderEarlyWarningAlert[]> {
  const { events } = await listWarningEvents({
    status: 'open',
    limit: 10,
  });

  return events.map(event => ({
    id: `ew-${event.id}`,
    title: event.title,
    description: event.description_markdown.split('\n\n')[1] || event.title,
    severity: event.severity === 'high' ? 'high' : event.severity === 'medium' ? 'medium' : 'low',
    alert_type: mapWarningTypeToAlertType(event.warning_type),
    source_engine: 'early_warning' as const,
    metadata: {
      warning_type: event.warning_type,
      confidence: event.confidence,
      signals: event.source_signals,
      created_at: event.created_at,
    },
  }));
}

/**
 * Map warning type to alert type
 */
function mapWarningTypeToAlertType(warningType: string): 'risk' | 'opportunity' | 'anomaly' | 'info' {
  switch (warningType) {
    case 'collapse_risk':
    case 'operational_stress':
    case 'scaling_pressure':
      return 'risk';
    case 'trend_shift':
    case 'performance_conflict':
      return 'anomaly';
    case 'data_gap':
    case 'blindspot':
      return 'info';
    default:
      return 'risk';
  }
}

/**
 * Early warning summary for Founder Intel overview
 */
export interface EarlyWarningSummary {
  total_open: number;
  by_severity: {
    high: number;
    medium: number;
    low: number;
  };
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  primary_concern: string;
  completeness: number;
}

/**
 * Get early warning summary for Founder Intel
 */
export async function getEarlyWarningSummary(): Promise<EarlyWarningSummary> {
  const openCount = await getOpenWarningCount();
  const bySeverity = await getWarningsBySeverity();

  // Get latest matrix for evaluation
  const matrix = await getLatestMatrix('global');
  let evaluation: MatrixEvaluation | null = null;

  if (matrix) {
    evaluation = await evaluateMatrixRow(matrix);
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (bySeverity.high > 2 || openCount > 10) {
    riskLevel = 'critical';
  } else if (bySeverity.high > 0 || bySeverity.medium > 3) {
    riskLevel = 'high';
  } else if (bySeverity.medium > 0 || openCount > 5) {
    riskLevel = 'medium';
  }

  return {
    total_open: openCount,
    by_severity: bySeverity,
    risk_level: evaluation?.risk_level || riskLevel,
    primary_concern: evaluation?.primary_concern || 'none',
    completeness: evaluation?.completeness || 0,
  };
}

/**
 * Get signal for Founder Intel aggregation
 */
export interface EarlyWarningSignal {
  key: string;
  value: number;
  label: string;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

/**
 * Get early warning signals for Founder Intel
 */
export async function getEarlyWarningSignals(): Promise<EarlyWarningSignal[]> {
  const summary = await getEarlyWarningSummary();
  const signals: EarlyWarningSignal[] = [];

  // Open warnings signal
  signals.push({
    key: 'open_warnings',
    value: summary.total_open,
    label: 'Open Warnings',
    trend: summary.total_open > 5 ? 'up' : 'stable',
    confidence: 0.9,
  });

  // High severity signal
  signals.push({
    key: 'high_severity',
    value: summary.by_severity.high,
    label: 'High Severity',
    trend: summary.by_severity.high > 0 ? 'up' : 'stable',
    confidence: 0.9,
  });

  // Risk level signal
  const riskValue = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 100,
  }[summary.risk_level];

  signals.push({
    key: 'risk_level',
    value: riskValue,
    label: 'Overall Risk',
    trend: riskValue > 50 ? 'up' : 'stable',
    confidence: 0.8,
  });

  return signals;
}

/**
 * Get weekly briefing content for Early Warning
 */
export async function getEarlyWarningBriefingContent(): Promise<string> {
  const summary = await getEarlyWarningSummary();
  const { events } = await listWarningEvents({
    status: ['open', 'acknowledged'],
    limit: 5,
  });

  let briefing = `## Early Warning Status\n\n`;

  // Risk level summary
  const riskEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴',
  }[summary.risk_level];

  briefing += `Overall Risk: ${riskEmoji} **${summary.risk_level.toUpperCase()}**\n\n`;

  // Warning counts
  briefing += `### Open Warnings: ${summary.total_open}\n\n`;
  briefing += `- High: ${summary.by_severity.high}\n`;
  briefing += `- Medium: ${summary.by_severity.medium}\n`;
  briefing += `- Low: ${summary.by_severity.low}\n\n`;

  // Primary concern
  if (summary.primary_concern !== 'none') {
    briefing += `**Primary Concern**: ${getWarningTypeLabel(summary.primary_concern as any)}\n\n`;
  }

  // Recent warnings
  if (events.length > 0) {
    briefing += `### Recent Warnings\n\n`;
    for (const event of events) {
      const emoji = {
        high: '🔴',
        medium: '🟡',
        low: '🔵',
      }[event.severity];
      briefing += `${emoji} **${event.title}** (${Math.round(event.confidence * 100)}% confidence)\n`;
    }
  }

  // Data quality
  briefing += `\n### Data Quality\n\n`;
  briefing += `- Completeness: ${Math.round(summary.completeness * 100)}%\n`;

  return briefing;
}

/**
 * Create founder intel snapshot from early warnings
 */
export async function createFounderIntelFromWarnings(): Promise<void> {
  const supabase = await getSupabaseServer();
  const summary = await getEarlyWarningSummary();

  // Determine risk level for founder intel
  const riskLevel = summary.risk_level === 'critical' ? 'critical' : summary.risk_level;
  const opportunityLevel = summary.risk_level === 'low' ? 'medium' : 'none';

  await supabase.from('founder_intel_snapshots').insert({
    scope: 'global',
    title: 'Early Warning System Summary',
    summary_markdown: await getEarlyWarningBriefingContent(),
    intelligence_json: {
      total_warnings: summary.total_open,
      by_severity: summary.by_severity,
      primary_concern: summary.primary_concern,
      metrics: {
        open_warnings: summary.total_open,
        high_severity: summary.by_severity.high,
        risk_score: summary.risk_level,
      },
      sources: ['early_warning_engine', 'unified_signal_matrix'],
    },
    risk_level: riskLevel,
    opportunity_level: opportunityLevel,
    confidence_score: summary.completeness,
    data_completeness_score: summary.completeness,
  });
}
