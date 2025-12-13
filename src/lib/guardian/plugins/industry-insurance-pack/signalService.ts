/**
 * Guardian Industry Pack: Insurance & Claims Oversight
 * Signal derivation service
 *
 * Reads aggregate Guardian metrics and derives heuristic insurance operational signals
 * Gracefully degrades when optional features (H02, H04) unavailable
 */

import {
  InsuranceOpsSignal,
  InsuranceOpsSnapshot,
  SignalSeverity,
  DEFAULT_SIGNAL_THRESHOLDS,
  createSignal
} from './types';

/**
 * Main signal derivation function
 * Accepts aggregate data (no PII), returns snapshot with signals
 */
export async function deriveInsuranceSignals(aggregateData: {
  alerts24h: number;
  incidents24h: number;
  correlations24h: number;
  alerts7d: number;
  incidents7d: number;
  currentRiskLabel?: 'low' | 'medium' | 'high';
  riskTrend?: 'up' | 'down' | 'flat';
  triageBacklogCount?: number;
  anomalyCountHigh?: number;
  anomalyCountMedium?: number;
  hasH02Anomalies?: boolean;
  hasH04Triage?: boolean;
  hasGTM06Analytics?: boolean;
}): Promise<InsuranceOpsSnapshot> {
  const signals: InsuranceOpsSignal[] = [];
  const warnings: string[] = [];

  // Signal 1: Claims velocity spike (incident surge)
  const velocitySignal = checkClaimsVelocitySpike(aggregateData);
  if (velocitySignal) {
signals.push(velocitySignal);
}

  // Signal 2: Fraud risk cluster (anomalies + risk elevation)
  const fraudSignal = checkFraudRiskCluster(aggregateData, warnings);
  if (fraudSignal) {
signals.push(fraudSignal);
}

  // Signal 3: Adjuster load overload (triage backlog proxy)
  const loadSignal = checkAdjusterLoadOverload(aggregateData, warnings);
  if (loadSignal) {
signals.push(loadSignal);
}

  // Signal 4: SLA breach pattern (backlog duration proxy)
  const slaSignal = checkSLABreachPattern(aggregateData, warnings);
  if (slaSignal) {
signals.push(slaSignal);
}

  // Signal 5: Severity drift (risk trending upward)
  const severitySignal = checkSeverityDrift(aggregateData);
  if (severitySignal) {
signals.push(severitySignal);
}

  const riskLabel = computeRiskLabel(aggregateData, signals);

  return {
    generatedAt: new Date().toISOString(),
    signals,
    totals: {
      alerts: aggregateData.alerts24h,
      incidents: aggregateData.incidents24h,
      correlations: aggregateData.correlations24h,
      riskLabel
    },
    warnings: warnings.length > 0 ? warnings : undefined,
    disclaimer:
      '⚠️ These signals are heuristic operational indicators for claims oversight, not claim decisions or compliance determinations. ' +
      'Always verify with your claims management system and SOPs before acting.'
  };
}

/**
 * Signal 1: Claims Velocity Spike
 * Detects incident surge relative to 7-day baseline
 * Use case: Capacity planning, intake workflow alerts
 */
function checkClaimsVelocitySpike(data: {
  incidents24h: number;
  incidents7d: number;
}): InsuranceOpsSignal | null {
  const dailyBaseline = data.incidents7d / 7;
  const ratio = dailyBaseline > 0 ? data.incidents24h / dailyBaseline : 1;

  if (ratio >= DEFAULT_SIGNAL_THRESHOLDS.claimsVelocityRatio) {
    const severity: SignalSeverity =
      ratio > 3 ? 'high' : ratio > 2 ? 'medium' : 'low';

    return createSignal(
      'claims_velocity_spike',
      severity,
      '24h',
      data.incidents24h,
      `Claims intake ${Math.round(ratio * 100)}% above 7-day baseline. Review processing capacity.`,
      dailyBaseline,
      'Check adjuster availability and intake workflows'
    );
  }

  return null;
}

/**
 * Signal 2: Fraud Risk Cluster
 * Detects anomaly surge indicating potential fraud patterns
 * Requires H02 anomaly detection feature
 * Use case: Fraud investigation team escalation
 */
function checkFraudRiskCluster(
  data: { anomalyCountHigh?: number; currentRiskLabel?: string; hasH02Anomalies?: boolean },
  warnings: string[]
): InsuranceOpsSignal | null {
  if (!data.hasH02Anomalies) {
    warnings.push('Anomaly detection (H02) not available; fraud risk signal limited');
    return null;
  }

  const highAnomalies = data.anomalyCountHigh || 0;

  if (highAnomalies >= DEFAULT_SIGNAL_THRESHOLDS.fraudClusterMinCount) {
    const isRiskElevated = data.currentRiskLabel === 'high' || data.currentRiskLabel === 'medium';
    const severity: SignalSeverity =
      highAnomalies > 10 && isRiskElevated
        ? 'high'
        : highAnomalies > 5
          ? 'medium'
          : 'low';

    return createSignal(
      'fraud_risk_cluster',
      severity,
      '24h',
      highAnomalies,
      `${highAnomalies} high-severity anomalies detected. Review for potential fraud patterns.`,
      undefined,
      'Escalate to fraud investigation team'
    );
  }

  return null;
}

/**
 * Signal 3: Adjuster Load Overload
 * Detects triage queue backlog indicating workload stress
 * Requires H04 triage queue feature
 * Use case: Workload balancing, temporary staffing decisions
 */
function checkAdjusterLoadOverload(
  data: { triageBacklogCount?: number; hasH04Triage?: boolean },
  warnings: string[]
): InsuranceOpsSignal | null {
  if (!data.hasH04Triage) {
    warnings.push('Triage queue (H04) not available; adjuster load signal not computed');
    return null;
  }

  const backlog = data.triageBacklogCount || 0;

  if (backlog >= DEFAULT_SIGNAL_THRESHOLDS.adjusterLoadThreshold) {
    const severity: SignalSeverity = backlog > 20 ? 'high' : backlog > 15 ? 'medium' : 'low';

    return createSignal(
      'adjuster_load_overload',
      severity,
      '24h',
      backlog,
      `${backlog} claims awaiting assignment. Review adjuster capacity.`,
      undefined,
      'Balance workload or hire temporary adjusters'
    );
  }

  return null;
}

/**
 * Signal 4: SLA Breach Pattern
 * Detects extended triage queue indicating SLA risk
 * Requires H04 triage queue feature
 * Use case: SLA compliance monitoring, escalation of delayed claims
 */
function checkSLABreachPattern(
  data: { triageBacklogCount?: number; hasH04Triage?: boolean },
  warnings: string[]
): InsuranceOpsSignal | null {
  if (!data.hasH04Triage) {
    warnings.push('Triage queue (H04) not available; SLA breach pattern not computed');
    return null;
  }

  const backlog = data.triageBacklogCount || 0;

  if (backlog >= DEFAULT_SIGNAL_THRESHOLDS.slaBreachWindow) {
    const severity: SignalSeverity = backlog > 14 ? 'high' : backlog > 7 ? 'medium' : 'low';

    return createSignal(
      'sla_breach_pattern',
      severity,
      '7d',
      backlog,
      `${backlog} claims in queue for ${DEFAULT_SIGNAL_THRESHOLDS.slaBreachWindow}+ days. SLA at risk.`,
      undefined,
      'Review SLA compliance and escalate delayed claims'
    );
  }

  return null;
}

/**
 * Signal 5: Severity Drift
 * Detects upward trend in risk label indicating increasing claim severity
 * No feature requirements
 * Use case: Reserve management, high-value claim monitoring
 */
function checkSeverityDrift(data: {
  currentRiskLabel?: string;
  riskTrend?: 'up' | 'down' | 'flat';
}): InsuranceOpsSignal | null {
  if (data.currentRiskLabel === 'high' && data.riskTrend === 'up') {
    return createSignal(
      'severity_drift',
      'high',
      '7d',
      1,
      'Risk label elevated to HIGH with upward trend. Claim severity may be increasing.',
      undefined,
      'Review recent high-value claims and adjust reserves'
    );
  }

  if (data.currentRiskLabel === 'medium' && data.riskTrend === 'up') {
    return createSignal(
      'severity_drift',
      'medium',
      '7d',
      1,
      'Risk label trending upward. Monitor claim severity patterns.',
      undefined,
      'Track claim values and reserve allocations'
    );
  }

  return null;
}

/**
 * Compute overall risk label from aggregates and detected signals
 */
function computeRiskLabel(
  data: { currentRiskLabel?: string },
  signals: InsuranceOpsSignal[]
): 'low' | 'medium' | 'high' | 'unknown' {
  // Use Guardian-provided label if available
  if (data.currentRiskLabel && ['low', 'medium', 'high'].includes(data.currentRiskLabel)) {
    return data.currentRiskLabel as 'low' | 'medium' | 'high';
  }

  // Infer from detected signals
  const highSeveritySignals = signals.filter((s) => s.severity === 'high').length;
  const mediumSeveritySignals = signals.filter((s) => s.severity === 'medium').length;

  if (highSeveritySignals > 0) {
return 'high';
}
  if (mediumSeveritySignals >= 2) {
return 'medium';
}
  if (mediumSeveritySignals > 0) {
return 'low';
}

  return 'unknown';
}

/**
 * Placeholder: Collect aggregate data from Guardian
 * In production, this would query Guardian core metrics
 */
export async function collectAggregateData(): Promise<any> {
  return {
    alerts24h: 25,
    incidents24h: 5,
    correlations24h: 3,
    alerts7d: 100,
    incidents7d: 20,
    currentRiskLabel: 'medium',
    triageBacklogCount: 8,
    anomalyCountHigh: 6,
    hasH02Anomalies: true,
    hasH04Triage: true,
    hasGTM06Analytics: false
  };
}
