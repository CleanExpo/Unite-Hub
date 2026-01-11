/**
 * Government & Regulatory Oversight Signal Derivation Service
 *
 * Derives governance and regulatory readiness signals from aggregate data.
 * Read-only, aggregate-only, heuristic indicators only.
 */

import type {
  AggregateGovernmentData,
  GovSignal,
  GovOversightSnapshot,
  GovernanceOverview,
  TrendDirection
} from './types';
import { createGovSignal, DEFAULT_GOV_THRESHOLDS } from './types';

/**
 * Main signal derivation function
 */
export async function deriveGovernmentSignals(
  aggregateData: AggregateGovernmentData
): Promise<GovOversightSnapshot> {
  const signals: GovSignal[] = [];
  const warnings: string[] = [];

  // Signal 1: Audit Readiness (validation + audit enabled + export available)
  const auditSignal = checkAuditReadiness(aggregateData);
  if (auditSignal) {
    signals.push(auditSignal);
  }

  // Signal 2: Policy Posture (governance controls configured appropriately)
  const postureSignal = checkPolicyPosture(aggregateData);
  if (postureSignal) {
    signals.push(postureSignal);
  }

  // Signal 3: Control Drift (rising risk despite stable volumes)
  const driftSignal = checkControlDrift(aggregateData);
  if (driftSignal) {
    signals.push(driftSignal);
  }

  // Signal 4: Validation Health (status and trend)
  const validationSignal = checkValidationHealth(aggregateData);
  if (validationSignal) {
    signals.push(validationSignal);
  }

  // Signal 5: Backup Posture (currency and readiness)
  const backupSignal = checkBackupPosture(aggregateData, warnings);
  if (backupSignal) {
    signals.push(backupSignal);
  }

  // Signal 6: Transparency Score (informational composite)
  const transparencySignal = computeTransparencyScore(aggregateData);
  if (transparencySignal) {
    signals.push(transparencySignal);
  }

  // Build governance overview
  const governance = buildGovernanceOverview(aggregateData);

  // Compute overall risk label
  const riskLabel = computeRiskLabel(aggregateData, signals.length);

  return {
    generatedAt: new Date().toISOString(),
    signals,
    totals: {
      alerts: aggregateData.alerts24h,
      incidents: aggregateData.incidents24h,
      correlations: aggregateData.correlations24h,
      riskLabel,
      riskTrend: aggregateData.riskTrend
    },
    governance,
    warnings,
    disclaimer:
      '⚠️ These are governance indicators and operational signals, not compliance certifications or regulatory guarantees. Always verify with official audit processes and regulatory frameworks.'
  };
}

/**
 * Signal 1: Audit Readiness
 * Indicator: validation passing + audit enabled + export module present
 */
function checkAuditReadiness(data: AggregateGovernmentData): GovSignal | null {
  const isReady =
    data.validationStatus === 'pass' &&
    data.auditEnabled === true &&
    data.auditExportAvailable === true;

  if (!isReady) {
    return null;
  }

  return createGovSignal(
    'audit_readiness',
    'low',
    '30d',
    1,
    undefined,
    'Validation passing, audit enabled, and export capabilities present. Audit readiness indicators are positive.',
    'Maintain current validation discipline and audit procedures.'
  );
}

/**
 * Signal 2: Policy Posture
 * Positive indicator: external sharing restricted + AI governance configured
 */
function checkPolicyPosture(data: AggregateGovernmentData): GovSignal | null {
  const hasRestrictiveSharing = data.externalSharingPolicy === 'restricted';
  const hasGovernance = data.aiAllowed === true || data.aiAllowed === false; // Explicitly configured

  if (!hasRestrictiveSharing || !hasGovernance) {
    return null;
  }

  return createGovSignal(
    'policy_posture',
    'low',
    '30d',
    1,
    undefined,
    'Governance controls are appropriately configured: sharing restricted and AI governance defined.',
    'Continue to maintain governance policies and review periodically.'
  );
}

/**
 * Signal 3: Control Drift
 * Indicator: rising risk despite stable incident volumes
 */
function checkControlDrift(data: AggregateGovernmentData): GovSignal | null {
  if (!data.currentRiskLabel || data.currentRiskLabel !== 'high') {
    return null;
  }

  if (data.riskTrend !== 'up') {
    return null;
  }

  // Check if incidents are relatively flat or stable
  const dailyIncidents30d = data.incidents30d ? data.incidents30d / 30 : 0;
  const dailyIncidents24h = data.incidents24h;
  const incidentGrowth = dailyIncidents30d > 0 ? dailyIncidents24h / dailyIncidents30d : 0;

  // Drift if risk up but incidents not proportionally increasing (< 1.2x)
  if (incidentGrowth > 1.2) {
    return null; // Incidents rising proportionally
  }

  return createGovSignal(
    'control_drift',
    'medium',
    '30d',
    1,
    undefined,
    'Risk rising despite stable incident volumes. May indicate emerging operational pressure or control degradation.',
    'Assess current operational context. Review governance controls and risk assessment criteria.'
  );
}

/**
 * Signal 4: Validation Health
 * Indicator: validation status and trend
 */
function checkValidationHealth(data: AggregateGovernmentData): GovSignal | null {
  if (!data.validationStatus) {
    return null;
  }

  const status = data.validationStatus;
  const severity = status === 'pass' ? 'low' : status === 'warn' ? 'medium' : 'high';

  const rationale =
    status === 'pass'
      ? 'Validation checks are passing. System health indicators are normal.'
      : status === 'warn'
        ? 'Validation is warning. Some checks are failing. Review and remediate identified issues.'
        : 'Validation is failing. Critical issues detected. Immediate remediation required.';

  const action =
    status === 'pass'
      ? 'Maintain current validation practices.'
      : status === 'warn'
        ? 'Address validation warnings to prevent escalation.'
        : 'Investigate and resolve failing validation checks immediately.';

  return createGovSignal(
    'validation_health',
    severity,
    '30d',
    status === 'pass' ? 1 : status === 'warn' ? 0 : -1,
    undefined,
    rationale,
    action
  );
}

/**
 * Signal 5: Backup Posture
 * Indicator: backup currency (recent vs stale)
 */
function checkBackupPosture(data: AggregateGovernmentData, warnings: string[]): GovSignal | null {
  if (data.backupStatus === undefined) {
    warnings.push(
      'Backup readiness data not available. Backup posture cannot be assessed. Ensure backup systems are configured.'
    );
    return null;
  }

  const isRecent = data.backupStatus === 'recent';
  const severity = isRecent ? 'low' : 'high';
  const rationale = isRecent
    ? 'Backups are current and ready for recovery operations.'
    : 'Backup data is stale. Recovery readiness may be compromised.';
  const action = isRecent
    ? 'Maintain regular backup schedule.'
    : 'Initiate backup immediately. Review backup automation.';

  return createGovSignal(
    'backup_posture',
    severity,
    '30d',
    isRecent ? 1 : 0,
    undefined,
    rationale,
    action
  );
}

/**
 * Signal 6: Transparency Score (Informational)
 * Composite score based on governance artifact availability
 * Not a compliance metric; informational only.
 */
function computeTransparencyScore(data: AggregateGovernmentData): GovSignal | null {
  let score = 0;
  const maxScore = 100;

  // Governance configured (20 points)
  if (data.externalSharingPolicy !== undefined) {
score += 20;
}
  if (data.aiAllowed !== undefined) {
score += 20;
}

  // Validation active (20 points)
  if (data.validationStatus !== undefined) {
score += 20;
}

  // Audit export available (20 points)
  if (data.auditExportAvailable === true) {
score += 20;
}

  // Backups available (20 points)
  if (data.backupStatus !== undefined) {
score += 20;
}

  const percentage = Math.round((score / maxScore) * 100);
  const severity =
    percentage >= DEFAULT_GOV_THRESHOLDS.transparencyScoreGoodThreshold
      ? 'low'
      : percentage >= 50
        ? 'medium'
        : 'high';

  return createGovSignal(
    'transparency_score',
    severity,
    '30d',
    percentage,
    undefined,
    `Governance transparency score: ${percentage}%. Based on availability of validation, audit, backup, and governance controls. Informational only; not a compliance metric.`,
    'Review governance setup to improve transparency artifacts.'
  );
}

/**
 * Build governance overview
 */
function buildGovernanceOverview(data: AggregateGovernmentData): GovernanceOverview {
  return {
    auditEnabled: data.auditEnabled ?? false,
    aiAllowed: data.aiAllowed ?? false,
    externalSharingPolicy: data.externalSharingPolicy ?? 'restricted',
    validationStatus: data.validationStatus ?? 'not_configured',
    lastValidationAt: data.lastValidationAt,
    backupStatus: data.backupStatus,
    auditExportAvailable: data.auditExportAvailable ?? false
  };
}

/**
 * Compute overall risk label
 */
function computeRiskLabel(
  data: AggregateGovernmentData,
  signalCount: number
): 'low' | 'medium' | 'high' {
  // Prefer explicit label
  if (data.currentRiskLabel === 'high' || data.currentRiskLabel === 'medium' || data.currentRiskLabel === 'low') {
    return data.currentRiskLabel;
  }

  // Infer from signal count and validation status
  if (signalCount >= 3 || data.validationStatus === 'fail') {
    return 'high';
  }
  if (signalCount >= 1 || data.validationStatus === 'warn') {
    return 'medium';
  }
  return 'low';
}
