/**
 * Restoration Operations Signal Derivation Service
 *
 * Computes restoration-specific signals from Guardian aggregate data.
 * Read-only; uses only safe helpers from pluginDataAccess.
 * No identifiers, no raw records, no PII.
 */

import {
  RestorationOpsSignal,
  RestorationOpsSnapshot,
  SignalSeverity,
  DEFAULT_SIGNAL_THRESHOLDS,
  createSignal
} from './types';

/**
 * Derive restoration operations signals from Guardian aggregate data
 *
 * @param aggregateData - Aggregate metrics (counts, risk label, etc.)
 * @returns RestorationOpsSnapshot with all derived signals
 */
export async function deriveRestorationSignals(aggregateData: {
  // 24h metrics
  alerts24h: number;
  incidents24h: number;
  correlations24h: number;

  // 7d baseline
  alerts7d: number;
  incidents7d: number;

  // Risk data (if available)
  currentRiskLabel?: 'low' | 'medium' | 'high';
  riskTrend?: 'up' | 'down' | 'flat';

  // Triage queue (if H04 available)
  triageBacklogCount?: number;

  // Anomaly data (if H02 available)
  anomalyCountHigh?: number;
  anomalyCountMedium?: number;

  // Feature availability
  hasH02Anomalies?: boolean;
  hasH04Triage?: boolean;
  hasGTM06Analytics?: boolean;
}): Promise<RestorationOpsSnapshot> {
  const signals: RestorationOpsSignal[] = [];
  const warnings: string[] = [];

  // Signal 1: Water spike (alert/incident surge)
  const waterSpikeSignal = checkWaterSpike(aggregateData);
  if (waterSpikeSignal) {
    signals.push(waterSpikeSignal);
  }

  // Signal 2: Mould risk spike (anomalies + risk elevation)
  const mouldSpikeSignal = checkMouldRiskSpike(aggregateData, warnings);
  if (mouldSpikeSignal) {
    signals.push(mouldSpikeSignal);
  }

  // Signal 3: Fire event spike (incident surge)
  const fireEventSignal = checkFireEventSpike(aggregateData);
  if (fireEventSignal) {
    signals.push(fireEventSignal);
  }

  // Signal 4: SLA drift (triage backlog)
  const slaDriftSignal = checkSLADrift(aggregateData, warnings);
  if (slaDriftSignal) {
    signals.push(slaDriftSignal);
  }

  // Signal 5: Repeat incident cluster (heuristic: if same correlations recurring)
  // This would require correlation history; for now, optional
  // if (aggregateData.repeatingCorrelationPattern) { ... }

  // Compute risk label (if not provided, infer from signal severity)
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
      '⚠️ These signals are heuristic operational indicators, not compliance determinations. ' +
      'Always verify with your monitoring tools and SOPs before responding.'
  };
}

/**
 * Check for water damage spike
 * Heuristic: alert/incident count 24h vs 7d baseline
 */
function checkWaterSpike(data: {
  alerts24h: number;
  incidents24h: number;
  alerts7d: number;
  incidents7d: number;
}): RestorationOpsSignal | null {
  const alertBaseline = data.alerts7d / 7;
  const incidentBaseline = data.incidents7d / 7;

  const alertRatio = alertBaseline > 0 ? data.alerts24h / alertBaseline : 1;
  const incidentRatio = incidentBaseline > 0 ? data.incidents24h / incidentBaseline : 1;

  const maxRatio = Math.max(alertRatio, incidentRatio);

  if (maxRatio >= DEFAULT_SIGNAL_THRESHOLDS.waterSpikeRatio) {
    const severity: SignalSeverity =
      maxRatio > 3 ? 'high' : maxRatio > 2 ? 'medium' : 'low';

    return createSignal(
      'water_spike',
      severity,
      '24h',
      data.incidents24h,
      `Incident count ${Math.round(maxRatio * 100)}% above 7-day baseline. Check water damage workflows.`,
      incidentBaseline
    );
  }

  return null;
}

/**
 * Check for mould risk spike
 * Heuristic: anomalies up + risk label elevated
 */
function checkMouldRiskSpike(
  data: { anomalyCountHigh?: number; currentRiskLabel?: string; hasH02Anomalies?: boolean },
  warnings: string[]
): RestorationOpsSignal | null {
  if (!data.hasH02Anomalies) {
    warnings.push('Anomaly detection (H02) not available; mould risk signal limited');
    return null;
  }

  const highAnomalies = data.anomalyCountHigh || 0;

  if (highAnomalies >= DEFAULT_SIGNAL_THRESHOLDS.mouldRiskMinCount) {
    const isRiskElevated = data.currentRiskLabel === 'high' || data.currentRiskLabel === 'medium';
    const severity: SignalSeverity =
      highAnomalies > 10 && isRiskElevated ? 'high' : highAnomalies > 5 ? 'medium' : 'low';

    return createSignal(
      'mould_risk_spike',
      severity,
      '24h',
      highAnomalies,
      `${highAnomalies} high-severity anomalies detected. Verify containment protocols.`,
      undefined
    );
  }

  return null;
}

/**
 * Check for fire event spike
 * Heuristic: incident surge (simple threshold)
 */
function checkFireEventSpike(data: { incidents24h: number; incidents7d: number }): RestorationOpsSignal | null {
  const dailyBaseline = data.incidents7d / 7;

  if (data.incidents24h > dailyBaseline * 2) {
    const severity: SignalSeverity = data.incidents24h > dailyBaseline * 3 ? 'high' : 'medium';

    return createSignal(
      'fire_event_spike',
      severity,
      '24h',
      data.incidents24h,
      `Incident count doubled vs baseline. Check fire response workflows.`,
      dailyBaseline
    );
  }

  return null;
}

/**
 * Check for SLA drift (triage backlog)
 */
function checkSLADrift(
  data: { triageBacklogCount?: number; hasH04Triage?: boolean },
  warnings: string[]
): RestorationOpsSignal | null {
  if (!data.hasH04Triage) {
    warnings.push('Triage queue (H04) not available; SLA drift signal not computed');
    return null;
  }

  const backlog = data.triageBacklogCount || 0;

  if (backlog >= DEFAULT_SIGNAL_THRESHOLDS.slaBacklogThreshold) {
    const severity: SignalSeverity = backlog > 10 ? 'high' : backlog > 5 ? 'medium' : 'low';

    return createSignal(
      'sla_drift',
      severity,
      '24h',
      backlog,
      `${backlog} incidents awaiting triage. Review queue and adjust response capacity.`,
      undefined
    );
  }

  return null;
}

/**
 * Compute overall risk label from signals
 */
function computeRiskLabel(
  data: { currentRiskLabel?: string },
  signals: RestorationOpsSignal[]
): 'low' | 'medium' | 'high' | 'unknown' {
  // If Guardian provides a risk label, use it
  if (data.currentRiskLabel && ['low', 'medium', 'high'].includes(data.currentRiskLabel)) {
    return data.currentRiskLabel as 'low' | 'medium' | 'high';
  }

  // Otherwise, infer from signal severity
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
 * Example: Safe data collection from Guardian (simplified)
 * In production, would call proper API helpers
 */
export async function collectAggregateData(): Promise<any> {
  // This would call safe helpers from pluginDataAccess.ts
  // For now, return structure showing what would be collected
  return {
    alerts24h: 15,
    incidents24h: 3,
    correlations24h: 2,
    alerts7d: 70,
    incidents7d: 12,
    currentRiskLabel: 'medium',
    triageBacklogCount: 2,
    anomalyCountHigh: 3,
    hasH02Anomalies: true,
    hasH04Triage: true,
    hasGTM06Analytics: false
  };
}
