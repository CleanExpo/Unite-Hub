/**
 * H04: Incident Scoring Model (v1 Heuristic)
 * Deterministic scoring of incidents based on aggregate features
 *
 * Score: 0..100 normalized severity
 * Band: 'low' | 'medium' | 'high' | 'critical'
 *
 * Model weights and thresholds tuned for typical incident patterns.
 * All outputs are PII-free and self-explanatory.
 */

import { IncidentFeatures } from './incidentFeatureBuilder';

export interface IncidentScore {
  score: number; // 0..100
  band: 'low' | 'medium' | 'high' | 'critical';
  rationale: string; // PII-free explanation
  componentScores: {
    alertBurstiness: number;
    riskDelta: number;
    correlationDensity: number;
    notificationFailures: number;
    anomalySignals: number;
    incidentAge: number;
    reopenFrequency: number;
  };
}

const WEIGHTS = {
  alertBurstiness: 0.25,
  riskDelta: 0.2,
  correlationDensity: 0.15,
  notificationFailures: 0.15,
  anomalySignals: 0.1,
  incidentAge: 0.1,
  reopenFrequency: 0.05,
};

/**
 * Score an incident based on heuristic model
 */
export function scoreIncidentHeuristic(features: IncidentFeatures): IncidentScore {
  // Component 1: Alert Burstiness (0..25)
  // High alert count in short time = high burstiness
  const alertBurstiness = Math.min(
    25,
    (features.alert_count_1h * 10 + features.alert_count_24h * 2) / (features.alert_count_24h || 1)
  );

  // Component 2: Risk Delta (0..20)
  // Positive delta = worsening; negative = improving
  const riskDelta = Math.max(0, Math.min(20, features.risk_delta_24h));

  // Component 3: Correlation Density (0..15)
  // More clusters correlated with incident = higher density
  const correlationDensity = Math.min(15, features.correlation_cluster_count * 3);

  // Component 4: Notification Failures (0..15)
  // High failure rate indicates delivery issues
  const notificationFailures = Math.min(15, features.notification_failure_rate * 30);

  // Component 5: Anomaly Signals (0..10)
  // Active anomalies during incident window
  const anomalySignals = Math.min(10, features.anomaly_event_count * 2);

  // Component 6: Incident Age (0..10)
  // Older unresolved incidents = higher concern
  // Normalize to 0..10 over 7 days
  const maxAgeMinutes = 7 * 24 * 60; // 7 days
  const incidentAge = Math.min(10, (features.incident_age_minutes / maxAgeMinutes) * 10);

  // Component 7: Reopen Frequency (0..5)
  // Multiple reopens indicate chronic issues
  const reopenFrequency = Math.min(5, features.reopen_count * 1.5);

  // Weighted sum
  const weightedSum =
    alertBurstiness * WEIGHTS.alertBurstiness +
    riskDelta * WEIGHTS.riskDelta +
    correlationDensity * WEIGHTS.correlationDensity +
    notificationFailures * WEIGHTS.notificationFailures +
    anomalySignals * WEIGHTS.anomalySignals +
    incidentAge * WEIGHTS.incidentAge +
    reopenFrequency * WEIGHTS.reopenFrequency;

  // Final score: 0..100
  const score = Math.round(Math.min(100, Math.max(0, weightedSum)));

  // Determine band
  let band: 'low' | 'medium' | 'high' | 'critical';
  if (score < 25) {
    band = 'low';
  } else if (score < 50) {
    band = 'medium';
  } else if (score < 75) {
    band = 'high';
  } else {
    band = 'critical';
  }

  // Build rationale from top contributors
  const contributors: { name: string; value: number }[] = [
    { name: 'alert burstiness', value: alertBurstiness },
    { name: 'risk trajectory', value: riskDelta },
    { name: 'correlated events', value: correlationDensity },
    { name: 'notification delivery issues', value: notificationFailures },
    { name: 'anomaly activity', value: anomalySignals },
    { name: 'incident age', value: incidentAge },
    { name: 'reopens', value: reopenFrequency },
  ];

  const topContributors = contributors
    .filter((c) => c.value > 0.5)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((c) => c.name)
    .join(', ');

  const rationale = topContributors
    ? `Score driven by: ${topContributors}. ${score >= 75 ? 'Immediate attention recommended.' : score >= 50 ? 'Monitor closely.' : 'Standard handling.'}`
    : 'No significant risk factors detected.';

  return {
    score,
    band,
    rationale,
    componentScores: {
      alertBurstiness: Math.round(alertBurstiness * 100) / 100,
      riskDelta: Math.round(riskDelta * 100) / 100,
      correlationDensity: Math.round(correlationDensity * 100) / 100,
      notificationFailures: Math.round(notificationFailures * 100) / 100,
      anomalySignals: Math.round(anomalySignals * 100) / 100,
      incidentAge: Math.round(incidentAge * 100) / 100,
      reopenFrequency: Math.round(reopenFrequency * 100) / 100,
    },
  };
}

/**
 * Validate rationale for safety (no PII, no secret keywords)
 */
export function validateScoringRationale(rationale: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check length (prevent excessively long outputs)
  if (rationale.length > 500) {
    errors.push('Rationale exceeds safe length (500 chars)');
  }

  // Check for disallowed keywords
  const disallowedPatterns = [
    /\b(email|@\w+)/i,
    /\b(password|secret|token|api[_-]?key)/i,
    /\b(webhook|url)\b/i,
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i, // IP addresses
  ];

  for (const pattern of disallowedPatterns) {
    if (pattern.test(rationale)) {
      errors.push(`Potential PII or secret detected in rationale: ${pattern}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
