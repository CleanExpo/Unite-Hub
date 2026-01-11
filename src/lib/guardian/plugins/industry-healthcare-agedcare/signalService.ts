/**
 * Guardian Industry Pack: Healthcare & Aged Care Oversight
 * Signal derivation service (read-only, aggregate-only)
 *
 * Derives healthcare operational signals from Guardian aggregate data.
 * No patient, resident, or staff identifiers. Heuristic indicators only.
 */

import {
  HealthcareSignal,
  HealthcareSnapshot,
  SignalSeverity,
  DEFAULT_SIGNAL_THRESHOLDS,
  createSignal
} from './types';

/**
 * Derive healthcare operations signals from Guardian aggregate data
 *
 * @param aggregateData - Aggregate metrics (counts, risk label, etc.)
 * @returns HealthcareSnapshot with all derived signals
 */
export async function deriveHealthcareSignals(aggregateData: {
  // 24h metrics
  alerts24h: number;
  incidents24h: number;
  correlations24h: number;

  // 7d/30d baseline
  alerts7d: number;
  incidents7d: number;
  alerts30d?: number;
  incidents30d?: number;

  // Risk data (if available)
  currentRiskLabel?: 'low' | 'medium' | 'high';
  riskTrend?: 'up' | 'down' | 'flat';

  // Triage queue (if H04 available)
  triageBacklogCount?: number;

  // Feature availability
  hasH02Anomalies?: boolean;
  hasH04Triage?: boolean;
}): Promise<HealthcareSnapshot> {
  const signals: HealthcareSignal[] = [];
  const warnings: string[] = [];

  // Signal 1: Environmental Risk Spike (alert/incident surge + rising risk)
  const envRiskSignal = checkEnvironmentalRiskSpike(aggregateData);
  if (envRiskSignal) {
signals.push(envRiskSignal);
}

  // Signal 2: Repeat Incident Pattern (recurring correlations)
  const repeatSignal = checkRepeatIncidentPattern(aggregateData);
  if (repeatSignal) {
signals.push(repeatSignal);
}

  // Signal 3: Response Latency (triage backlog if available)
  const latencySignal = checkResponseLatency(aggregateData, warnings);
  if (latencySignal) {
signals.push(latencySignal);
}

  // Signal 4: Afterhours Event Rate (elevated off-hours activity - estimate from aggregates)
  const afterhoursSignal = checkAfterhours(aggregateData);
  if (afterhoursSignal) {
signals.push(afterhoursSignal);
}

  // Signal 5: Care Environment Stability (flat volumes + declining risk = positive)
  const stabilitySignal = checkCareStability(aggregateData);
  if (stabilitySignal) {
signals.push(stabilitySignal);
}

  // Signal 6: Escalation Pressure (risk rising while volumes steady)
  const escalationSignal = checkEscalationPressure(aggregateData);
  if (escalationSignal) {
signals.push(escalationSignal);
}

  // Compute overall risk label
  const riskLabel = computeRiskLabel(aggregateData, signals.length);

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
    disclaimer: '⚠️ These signals are heuristic operational indicators for care environment oversight, ' +
                'not clinical guidance, patient safety determinations, or regulatory compliance assessments. ' +
                'Always verify with your operational monitoring systems and care protocols before responding.'
  };
}

/**
 * Check for environmental risk spike: alert/incident surge combined with rising risk
 */
function checkEnvironmentalRiskSpike(data: {
  alerts24h: number;
  alerts7d: number;
  incidents24h: number;
  incidents7d: number;
  currentRiskLabel?: string;
}): HealthcareSignal | undefined {
  const baselineAlertsPerDay = data.alerts7d / 7;
  const baselineIncidentsPerDay = data.incidents7d / 7;

  const alertRatio = baselineAlertsPerDay > 0 ? data.alerts24h / baselineAlertsPerDay : 1;
  const incidentRatio = baselineIncidentsPerDay > 0 ? data.incidents24h / baselineIncidentsPerDay : 1;

  const combined = (alertRatio + incidentRatio) / 2;

  if (combined >= DEFAULT_SIGNAL_THRESHOLDS.environmentalRiskRatio) {
    const severity: SignalSeverity = combined >= 3 ? 'high' : combined >= 2 ? 'medium' : 'low';

    return createSignal(
      'environmental_risk_spike',
      severity,
      '7d',
      {
        count: data.alerts24h + data.incidents24h,
        previousCount: (data.alerts7d + data.incidents7d) / 7,
        rationale: `Alert and incident volume ${(combined * 100).toFixed(0)}% above 7-day baseline. ` +
                  `Monitor environment and resource utilization closely.`,
        suggestedAction: 'Review recent facility changes, staffing levels, and care protocols. ' +
                        'Assess for facility-wide patterns versus isolated incidents.'
      }
    );
  }

  return undefined;
}

/**
 * Check for repeat incident pattern: recurring correlation clusters
 */
function checkRepeatIncidentPattern(data: {
  correlations24h: number;
  alerts7d: number;
  incidents7d: number;
}): HealthcareSignal | undefined {
  // Estimate recurring patterns from high correlation count
  // If 24h correlations are high relative to incident count, likely repeat issues
  const estimatedPatterns = data.correlations24h;

  if (estimatedPatterns >= DEFAULT_SIGNAL_THRESHOLDS.repeatIncidentMinCluster) {
    const severity: SignalSeverity = estimatedPatterns >= 8 ? 'high' : estimatedPatterns >= 5 ? 'medium' : 'low';

    return createSignal(
      'repeat_incident_pattern',
      severity,
      '30d',
      {
        count: estimatedPatterns,
        rationale: `${estimatedPatterns} correlated incidents detected. ` +
                  'Pattern suggests systemic care environment factor or repeated triggering condition.',
        suggestedAction: 'Identify root cause of repeated incidents. Consider preventive protocol adjustments. ' +
                        'Review care pathways for similar patient presentations.'
      }
    );
  }

  return undefined;
}

/**
 * Check for response latency: triage backlog proxy
 */
function checkResponseLatency(
  data: { triageBacklogCount?: number },
  warnings: string[]
): HealthcareSignal | undefined {
  if (data.triageBacklogCount === undefined) {
    warnings.push('Triage queue (H04) not available; response latency signal limited.');
    return undefined;
  }

  const backlog = data.triageBacklogCount;

  if (backlog >= DEFAULT_SIGNAL_THRESHOLDS.responseLatencyDays) {
    const severity: SignalSeverity = backlog >= 14 ? 'high' : backlog >= 10 ? 'medium' : 'low';

    return createSignal(
      'response_latency',
      severity,
      '7d',
      {
        count: backlog,
        rationale: `Triage backlog of ${backlog} days indicates delayed response to care environment issues. ` +
                  'May impact timely escalation and care delivery.',
        suggestedAction: 'Assess triage staffing and capacity. Prioritize high-risk backlog items. ' +
                        'Consider additional resources or process streamlining.'
      }
    );
  }

  return undefined;
}

/**
 * Check for afterhours event rate: elevated off-hours activity
 * (estimated from aggregate data; would require timestamp breakdown in production)
 */
function checkAfterhours(data: {
  alerts24h: number;
  alerts7d: number;
}): HealthcareSignal | undefined {
  // Simple heuristic: if alerts spike suddenly, estimate off-hours contribution
  // In production, this would use timestamp-based breakdown
  const avgDaily = data.alerts7d / 7;
  const spike = data.alerts24h / (avgDaily > 0 ? avgDaily : 1);

  // Only alert if spike suggests afterhours activity (combined with other signals)
  if (spike >= 2 && data.alerts24h >= 20) {
    return createSignal(
      'afterhours_event_rate',
      'medium',
      '7d',
      {
        count: data.alerts24h,
        previousCount: avgDaily,
        rationale: 'Elevated alert activity observed. Combined with spike pattern, suggests ' +
                  'potential afterhours care challenges or staffing gaps.',
        suggestedAction: 'Review afterhours incident triggers. Verify adequate overnight staffing. ' +
                        'Consider preventive protocols for high-risk times.'
      }
    );
  }

  return undefined;
}

/**
 * Check for care environment stability: flat volumes + declining risk (positive indicator)
 */
function checkCareStability(data: {
  alerts24h: number;
  alerts7d: number;
  incidents24h: number;
  incidents7d: number;
  currentRiskLabel?: string;
  riskTrend?: string;
}): HealthcareSignal | undefined {
  const avgAlerts = data.alerts7d / 7;
  const avgIncidents = data.incidents7d / 7;

  const alertsFlat = Math.abs(data.alerts24h - avgAlerts) / (avgAlerts > 0 ? avgAlerts : 1) < 0.2;
  const incidentsFlat = Math.abs(data.incidents24h - avgIncidents) / (avgIncidents > 0 ? avgIncidents : 1) < 0.2;
  const riskImproving = data.currentRiskLabel === 'low' && data.riskTrend === 'down';

  if (alertsFlat && incidentsFlat && riskImproving) {
    return createSignal(
      'care_environment_stability',
      'low', // Positive signal = low severity
      '30d',
      {
        count: data.alerts24h + data.incidents24h,
        previousCount: (data.alerts7d + data.incidents7d) / 7,
        rationale: 'Care environment showing stable operations with declining risk trend. ' +
                  'Current baseline suggests effective operational management.',
        suggestedAction: 'Continue current protocols. Monitor for early warning signs of deterioration. ' +
                        'Consider this as baseline for escalation detection.'
      }
    );
  }

  return undefined;
}

/**
 * Check for escalation pressure: risk rising while volumes steady
 */
function checkEscalationPressure(data: {
  currentRiskLabel?: string;
  riskTrend?: string;
  alerts24h: number;
  alerts7d: number;
  incidents24h: number;
  incidents7d: number;
}): HealthcareSignal | undefined {
  const avgAlerts = data.alerts7d / 7;
  const avgIncidents = data.incidents7d / 7;

  const volumesFlat =
    Math.abs(data.alerts24h - avgAlerts) / (avgAlerts > 0 ? avgAlerts : 1) < 0.15 &&
    Math.abs(data.incidents24h - avgIncidents) / (avgIncidents > 0 ? avgIncidents : 1) < 0.15;

  const riskRising = data.currentRiskLabel === 'high' && data.riskTrend === 'up';

  if (volumesFlat && riskRising) {
    return createSignal(
      'escalation_pressure',
      'high',
      '7d',
      {
        count: 1, // Qualitative signal
        rationale: 'Risk level rising despite stable incident volume. Suggests internal escalation or ' +
                  'severity concentration within same care environment footprint.',
        suggestedAction: 'Review case acuity and complexity trends. Assess for hidden stressors ' +
                        'not captured in volume metrics. Consider risk mitigation protocols.'
      }
    );
  }

  return undefined;
}

/**
 * Compute overall risk label from signals and risk trend
 */
function computeRiskLabel(
  data: { currentRiskLabel?: string; riskTrend?: string },
  signalCount: number
): 'low' | 'medium' | 'high' | 'unknown' {
  // Prefer explicit Guardian label
  if (data.currentRiskLabel === 'high' || data.currentRiskLabel === 'medium' || data.currentRiskLabel === 'low') {
    return data.currentRiskLabel;
  }

  // Infer from signal count
  if (signalCount >= 3) {
return 'high';
}
  if (signalCount >= 1) {
return 'medium';
}
  return 'low';
}
