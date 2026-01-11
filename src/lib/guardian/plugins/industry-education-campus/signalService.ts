/**
 * Campus Operations Signal Derivation Service
 *
 * Derives operational and environmental signals from aggregate campus data.
 * Read-only, aggregate-only, heuristic indicators only.
 */

import type {
  AggregateCampusData,
  CampusSignal,
  CampusOversightSnapshot,
  TrendDirection,
  CampusOperationsOverview
} from './types';
import { createCampusSignal, DEFAULT_CAMPUS_THRESHOLDS } from './types';

/**
 * Main signal derivation function
 */
export async function deriveCampusSignals(
  aggregateData: AggregateCampusData
): Promise<CampusOversightSnapshot> {
  const signals: CampusSignal[] = [];
  const warnings: string[] = [];

  // Signal 1: Operational Disruption (elevated incident volumes)
  const disruptionSignal = checkOperationalDisruption(aggregateData);
  if (disruptionSignal) {
    signals.push(disruptionSignal);
  }

  // Signal 2: Environmental Risk (facility/environment indicators)
  const envSignal = checkEnvironmentalRisk(aggregateData);
  if (envSignal) {
    signals.push(envSignal);
  }

  // Signal 3: Repeat Pattern (clustered incidents)
  const patternSignal = checkRepeatPattern(aggregateData);
  if (patternSignal) {
    signals.push(patternSignal);
  }

  // Signal 4: Response Latency (stretched resources)
  const latencySignal = checkResponseLatency(aggregateData, warnings);
  if (latencySignal) {
    signals.push(latencySignal);
  }

  // Signal 5: Afterhours Activity (off-hours stress)
  const afterhoursSignal = checkAfterhours(aggregateData);
  if (afterhoursSignal) {
    signals.push(afterhoursSignal);
  }

  // Signal 6: Stability Indicator (overall campus health)
  const stabilitySignal = checkStabilityIndicator(aggregateData);
  if (stabilitySignal) {
    signals.push(stabilitySignal);
  }

  // Build operations overview
  const overview = buildCampusOverview(aggregateData);

  // Compute overall risk label
  const riskLabel = computeRiskLabel(aggregateData, signals.length);

  return {
    generatedAt: new Date().toISOString(),
    signals,
    overview,
    warnings,
    disclaimer:
      '⚠️ These are operational indicators and campus safety signals, not institutional certifications or safety guarantees. Always verify with official campus safety protocols and institutional risk frameworks.'
  };
}

/**
 * Signal 1: Operational Disruption
 * Indicator: incident volume elevated >1.5x baseline
 */
function checkOperationalDisruption(data: AggregateCampusData): CampusSignal | null {
  if (!data.incidents24h || !data.incidents7d) {
    return null;
  }

  const dailyBaseline = data.incidents7d / 7;
  const currentDaily = data.incidents24h;
  const disruptionRatio = dailyBaseline > 0 ? currentDaily / dailyBaseline : 0;

  if (disruptionRatio < DEFAULT_CAMPUS_THRESHOLDS.disruptionIncidentRatio) {
    return null;
  }

  const severity = disruptionRatio > 2 ? 'high' : 'medium';

  return createCampusSignal(
    'operational_disruption',
    severity,
    '24h',
    Math.round(currentDaily),
    disruptionRatio > dailyBaseline ? 'up' : 'stable',
    `Incident volume elevated ${(disruptionRatio * 100).toFixed(0)}% above 7-day baseline. Current: ${currentDaily} incidents/day vs. baseline: ${dailyBaseline.toFixed(1)}.`,
    'Assess current operational pressures. Review incident categorization and response protocols.'
  );
}

/**
 * Signal 2: Environmental Risk
 * Indicator: facility/environment alerts elevated
 */
function checkEnvironmentalRisk(data: AggregateCampusData): CampusSignal | null {
  if (!data.facilityIssues24h || !data.facilityIssues7d) {
    return null;
  }

  const dailyBaseline = data.facilityIssues7d / 7;
  const currentDaily = data.facilityIssues24h;
  const riskRatio = dailyBaseline > 0 ? currentDaily / dailyBaseline : 0;

  if (riskRatio < DEFAULT_CAMPUS_THRESHOLDS.environmentalRiskRatio) {
    return null;
  }

  return createCampusSignal(
    'environmental_risk',
    'high',
    '24h',
    currentDaily,
    riskRatio > dailyBaseline ? 'up' : 'stable',
    `Environmental/facility risk elevated. Current: ${currentDaily} facility issues/day vs. baseline: ${dailyBaseline.toFixed(1)}.`,
    'Escalate facility issues to facilities management. Implement preventive measures.'
  );
}

/**
 * Signal 3: Repeat Pattern
 * Indicator: clustered incidents in 7d window (≥3 correlated)
 */
function checkRepeatPattern(data: AggregateCampusData): CampusSignal | null {
  if (!data.correlations24h) {
    return null;
  }

  const correlationClusterSize = data.correlations24h || 0;

  if (correlationClusterSize < DEFAULT_CAMPUS_THRESHOLDS.repeatIncidentMinCluster) {
    return null;
  }

  const severity = correlationClusterSize >= 5 ? 'high' : 'medium';

  return createCampusSignal(
    'repeat_pattern',
    severity,
    '7d',
    correlationClusterSize,
    undefined,
    `Clustered incidents detected: ${correlationClusterSize} correlated incidents in similar contexts or timeframes.`,
    'Investigate root cause of clustered pattern. Implement targeted mitigation measures.'
  );
}

/**
 * Signal 4: Response Latency
 * Indicator: avg resolution time elevated (≥5 days)
 */
function checkResponseLatency(
  data: AggregateCampusData,
  warnings: string[]
): CampusSignal | null {
  if (data.avgResolutionTime === undefined) {
    warnings.push(
      'Response latency data not available. Resolution time metrics cannot be assessed.'
    );
    return null;
  }

  if (data.avgResolutionTime < DEFAULT_CAMPUS_THRESHOLDS.responseLatencyDays) {
    return null;
  }

  const severity =
    data.avgResolutionTime > 10 ? 'high' : data.avgResolutionTime > 7 ? 'medium' : 'low';

  return createCampusSignal(
    'response_latency',
    severity,
    '30d',
    Math.round(data.avgResolutionTime * 10) / 10,
    undefined,
    `Average incident resolution time: ${data.avgResolutionTime.toFixed(1)} days. Indicates resource constraints or complex issues.`,
    'Review incident prioritization and resource allocation. Assess staffing levels.'
  );
}

/**
 * Signal 5: Afterhours Activity
 * Indicator: elevated off-hours incident activity (>1.3x)
 */
function checkAfterhours(data: AggregateCampusData): CampusSignal | null {
  if (!data.afterhoursIncidents24h || !data.afterhoursIncidents7d) {
    return null;
  }

  const afterhoursDaily = data.afterhoursIncidents24h;
  const afterhoursBaseline = data.afterhoursIncidents7d / 7;
  const peakDaily = data.peakHourVolume || 5;

  const afterhoursRatio = peakDaily > 0 ? afterhoursDaily / peakDaily : 0;

  if (afterhoursRatio < DEFAULT_CAMPUS_THRESHOLDS.afterhoursElevationRatio) {
    return null;
  }

  const afterhoursPercentage = ((afterhoursDaily / (data.incidents24h || 1)) * 100).toFixed(1);

  return createCampusSignal(
    'afterhours_activity',
    'medium',
    '24h',
    afterhoursDaily,
    afterhoursRatio > 1 ? 'up' : 'stable',
    `Elevated off-hours activity: ${afterhoursPercentage}% of incidents occurring outside normal business hours.`,
    'Assess staffing coverage during off-hours. Review incident types occurring after-hours.'
  );
}

/**
 * Signal 6: Stability Indicator
 * Indicator: stable/predictable volumes + adequate resources (positive signal)
 */
function checkStabilityIndicator(data: AggregateCampusData): CampusSignal | null {
  // Positive signal: low volume + no escalation + good response time
  const hasLowVolume = (data.incidents24h || 0) <= DEFAULT_CAMPUS_THRESHOLDS.stabilitySafeVolume;
  const hasGoodResponse = (data.avgResolutionTime || 0) <= 3;
  const hasLowEscalation = (data.escalations24h || 0) <= 2;

  if (hasLowVolume && hasGoodResponse && hasLowEscalation) {
    return createCampusSignal(
      'stability_indicator',
      'low',
      '24h',
      1,
      'stable',
      'Campus operations are stable with manageable incident volume, good response times, and minimal escalations.',
      'Maintain current operational practices and resource allocation.'
    );
  }

  return null;
}

/**
 * Build campus operations overview
 */
function buildCampusOverview(data: AggregateCampusData): CampusOperationsOverview {
  const incidents24h = data.incidents24h || 0;
  const incidents7d = data.incidents7d || 0;
  const escalations24h = data.escalations24h || 0;

  const escalationRate = incidents24h > 0 ? (escalations24h / incidents24h) * 100 : 0;
  const afterhoursPercentage =
    incidents24h > 0 ? ((data.afterhoursIncidents24h || 0) / incidents24h) * 100 : 0;

  let responseStatus: 'on_track' | 'delayed' | 'critical' = 'on_track';
  if ((data.avgResolutionTime || 0) > 10) {
    responseStatus = 'critical';
  } else if ((data.avgResolutionTime || 0) > 5) {
    responseStatus = 'delayed';
  }

  let environmentalStatus: 'normal' | 'elevated' | 'critical' = 'normal';
  if ((data.facilityIssues24h || 0) > 5) {
    environmentalStatus = 'critical';
  } else if ((data.facilityIssues24h || 0) > 2) {
    environmentalStatus = 'elevated';
  }

  return {
    totalIncidents24h: incidents24h,
    totalIncidents7d: incidents7d,
    escalationRate: Math.round(escalationRate * 10) / 10,
    responseStatus,
    environmentalStatus,
    afterhoursPercentage: Math.round(afterhoursPercentage * 10) / 10
  };
}

/**
 * Compute overall risk label
 */
function computeRiskLabel(data: AggregateCampusData, signalCount: number): 'low' | 'medium' | 'high' {
  // Prefer explicit label
  if (data.currentRiskLabel === 'high' || data.currentRiskLabel === 'medium' || data.currentRiskLabel === 'low') {
    return data.currentRiskLabel;
  }

  // Infer from signal count and thresholds
  if (signalCount >= 3) {
    return 'high';
  }
  if (signalCount >= 1) {
    return 'medium';
  }
  return 'low';
}
