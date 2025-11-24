/**
 * Early Warning Engine Service
 * Phase 82: Detects risks, blindspots, and opportunities with Balanced Mode sensitivity
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  UnifiedSignalMatrix,
  WarningDetection,
  MatrixEvaluation,
  EarlyWarningFactor,
  WarningSeverity,
  WarningType,
  EngineSignal,
} from './signalMatrixTypes';

/**
 * Evaluate a signal matrix row for warnings
 */
export async function evaluateMatrixRow(
  matrixRow: UnifiedSignalMatrix
): Promise<MatrixEvaluation> {
  // Load configurable factors
  const factors = await loadWarningFactors();

  // Run all detection functions
  const warnings: WarningDetection[] = [];

  const detections = [
    detectTrendShift(matrixRow, factors),
    detectCollapseRisk(matrixRow, factors),
    detectFatigue(matrixRow, factors),
    detectOperationalStress(matrixRow, factors),
    detectStoryStall(matrixRow, factors),
    detectCreativeDrift(matrixRow, factors),
    detectScalingPressure(matrixRow, factors),
    detectPerformanceConflict(matrixRow, factors),
    detectDataGap(matrixRow, factors),
    detectBlindspots(matrixRow, factors),
  ];

  for (const detection of detections) {
    if (detection.detected) {
      warnings.push(detection);
    }
  }

  // Calculate overall risk
  const overallRisk = calculateOverallRisk(warnings, factors);
  const riskLevel = getRiskLevel(overallRisk);
  const primaryConcern = warnings.length > 0
    ? warnings.sort((a, b) => b.score - a.score)[0].type
    : 'none';

  return {
    warnings,
    overall_risk: overallRisk,
    risk_level: riskLevel,
    primary_concern: primaryConcern,
    completeness: matrixRow.completeness_score,
  };
}

/**
 * Load warning factors from database
 */
async function loadWarningFactors(): Promise<Map<WarningType, EarlyWarningFactor>> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('early_warning_factors')
    .select('*')
    .eq('active', true);

  const factorMap = new Map<WarningType, EarlyWarningFactor>();

  if (data) {
    for (const row of data) {
      factorMap.set(row.factor_name as WarningType, row as EarlyWarningFactor);
    }
  }

  return factorMap;
}

/**
 * Detect trend shifts across engines
 */
function detectTrendShift(
  matrix: UnifiedSignalMatrix,
  factors: Map<WarningType, EarlyWarningFactor>
): WarningDetection {
  const factor = factors.get('trend_shift');
  const threshold = factor?.threshold || 0.65;

  const score = matrix.trend_shift_score;
  const detected = score >= threshold;

  // Collect signals that are shifting
  const shiftingSignals: EngineSignal[] = [];
  const signalJson = matrix.signal_json;

  Object.entries(signalJson)
    .filter(([key]) => key !== 'errors')
    .forEach(([, cat]) => {
      const category = cat as { signals: EngineSignal[]; trend: string };
      if (category.trend !== 'stable') {
        shiftingSignals.push(...category.signals);
      }
    });

  return {
    detected,
    type: 'trend_shift',
    severity: getSeverityFromScore(score),
    score,
    confidence: matrix.confidence_score,
    signals: shiftingSignals.slice(0, 5),
    reason: detected
      ? `${Math.round(score * 100)}% of signals showing trend movement`
      : 'Trends stable',
  };
}

/**
 * Detect collapse risk
 */
function detectCollapseRisk(
  matrix: UnifiedSignalMatrix,
  factors: Map<WarningType, EarlyWarningFactor>
): WarningDetection {
  const factor = factors.get('collapse_risk');
  const threshold = factor?.threshold || 0.75;

  // Collapse risk = high anomaly + downward trends + low confidence
  const anomalyComponent = matrix.anomaly_score * 0.4;
  const trendComponent = matrix.fatigue_score * 0.3;
  const confidenceComponent = (1 - matrix.confidence_score) * 0.3;

  const score = anomalyComponent + trendComponent + confidenceComponent;
  const detected = score >= threshold;

  return {
    detected,
    type: 'collapse_risk',
    severity: getSeverityFromScore(score),
    score,
    confidence: matrix.confidence_score,
    signals: [],
    reason: detected
      ? `Collapse risk indicators at ${Math.round(score * 100)}%`
      : 'No collapse risk detected',
  };
}

/**
 * Detect fatigue
 */
function detectFatigue(
  matrix: UnifiedSignalMatrix,
  factors: Map<WarningType, EarlyWarningFactor>
): WarningDetection {
  const factor = factors.get('fatigue');
  const threshold = factor?.threshold || 0.60;

  const score = matrix.fatigue_score;
  const detected = score >= threshold;

  // Collect declining signals
  const fatigueSignals: EngineSignal[] = [];
  const categories = ['creative', 'performance', 'campaign'] as const;

  for (const catName of categories) {
    const cat = matrix.signal_json[catName];
    if (cat.trend === 'down') {
      fatigueSignals.push(...cat.signals);
    }
  }

  return {
    detected,
    type: 'fatigue',
    severity: getSeverityFromScore(score),
    score,
    confidence: matrix.confidence_score,
    signals: fatigueSignals.slice(0, 5),
    reason: detected
      ? `Fatigue indicators at ${Math.round(score * 100)}%`
      : 'No significant fatigue',
  };
}

/**
 * Detect operational stress
 */
function detectOperationalStress(
  matrix: UnifiedSignalMatrix,
  factors: Map<WarningType, EarlyWarningFactor>
): WarningDetection {
  const factor = factors.get('operational_stress');
  const threshold = factor?.threshold || 0.70;

  // Check ORM and scaling signals
  const ormScore = matrix.signal_json.orm.score;
  const scalingScore = matrix.signal_json.scaling.score;

  // High scaling + low ORM = stress
  const score = scalingScore > 0.7 && ormScore < 0.5
    ? 0.8
    : scalingScore > 0.5 && ormScore < 0.3
    ? 0.6
    : 0.3;

  const detected = score >= threshold;

  return {
    detected,
    type: 'operational_stress',
    severity: getSeverityFromScore(score),
    score,
    confidence: Math.min(matrix.signal_json.orm.confidence, matrix.signal_json.scaling.confidence),
    signals: [...matrix.signal_json.orm.signals, ...matrix.signal_json.scaling.signals].slice(0, 5),
    reason: detected
      ? 'Operations under stress from scaling demands'
      : 'Operations stable',
  };
}

/**
 * Detect story stall
 */
function detectStoryStall(
  matrix: UnifiedSignalMatrix,
  factors: Map<WarningType, EarlyWarningFactor>
): WarningDetection {
  const factor = factors.get('story_stall');
  const threshold = factor?.threshold || 0.55;

  const storyScore = matrix.signal_json.story.score;
  const score = 1 - storyScore; // Low story = high stall

  const detected = score >= threshold && matrix.signal_json.story.signals.length > 0;

  return {
    detected,
    type: 'story_stall',
    severity: getSeverityFromScore(score),
    score,
    confidence: matrix.signal_json.story.confidence,
    signals: matrix.signal_json.story.signals,
    reason: detected
      ? 'Narrative momentum stalled'
      : 'Story progression normal',
  };
}

/**
 * Detect creative drift
 */
function detectCreativeDrift(
  matrix: UnifiedSignalMatrix,
  factors: Map<WarningType, EarlyWarningFactor>
): WarningDetection {
  const factor = factors.get('creative_drift');
  const threshold = factor?.threshold || 0.60;

  // Creative drift = declining creative + diverging VIF
  const creativeScore = matrix.signal_json.creative.score;
  const vifScore = matrix.signal_json.vif.score;

  const divergence = Math.abs(creativeScore - vifScore);
  const score = divergence > 0.3 ? 0.7 : divergence > 0.2 ? 0.5 : 0.3;

  const detected = score >= threshold;

  return {
    detected,
    type: 'creative_drift',
    severity: getSeverityFromScore(score),
    score,
    confidence: Math.min(matrix.signal_json.creative.confidence, matrix.signal_json.vif.confidence),
    signals: [...matrix.signal_json.creative.signals, ...matrix.signal_json.vif.signals].slice(0, 5),
    reason: detected
      ? 'Creative output diverging from brand standards'
      : 'Creative aligned',
  };
}

/**
 * Detect scaling pressure
 */
function detectScalingPressure(
  matrix: UnifiedSignalMatrix,
  factors: Map<WarningType, EarlyWarningFactor>
): WarningDetection {
  const factor = factors.get('scaling_pressure');
  const threshold = factor?.threshold || 0.70;

  const scalingScore = matrix.signal_json.scaling.score;
  const score = scalingScore > 0.8 ? 0.8 : scalingScore > 0.6 ? 0.6 : 0.3;

  const detected = score >= threshold;

  return {
    detected,
    type: 'scaling_pressure',
    severity: getSeverityFromScore(score),
    score,
    confidence: matrix.signal_json.scaling.confidence,
    signals: matrix.signal_json.scaling.signals,
    reason: detected
      ? 'High scaling demand detected'
      : 'Scaling within capacity',
  };
}

/**
 * Detect performance conflict
 */
function detectPerformanceConflict(
  matrix: UnifiedSignalMatrix,
  factors: Map<WarningType, EarlyWarningFactor>
): WarningDetection {
  const factor = factors.get('performance_conflict');
  const threshold = factor?.threshold || 0.65;

  // Conflict between performance and reality
  const performanceScore = matrix.signal_json.performance.score;
  const realityScore = matrix.signal_json.reality.score;

  const conflict = Math.abs(performanceScore - realityScore);
  const score = conflict > 0.4 ? 0.8 : conflict > 0.25 ? 0.6 : 0.3;

  const detected = score >= threshold;

  return {
    detected,
    type: 'performance_conflict',
    severity: getSeverityFromScore(score),
    score,
    confidence: Math.min(matrix.signal_json.performance.confidence, matrix.signal_json.reality.confidence),
    signals: [...matrix.signal_json.performance.signals, ...matrix.signal_json.reality.signals].slice(0, 5),
    reason: detected
      ? `${Math.round(conflict * 100)}% gap between perceived and reality`
      : 'Performance aligned with reality',
  };
}

/**
 * Detect data gaps
 */
function detectDataGap(
  matrix: UnifiedSignalMatrix,
  factors: Map<WarningType, EarlyWarningFactor>
): WarningDetection {
  const factor = factors.get('data_gap');
  const threshold = factor?.threshold || 0.50;

  const score = 1 - matrix.completeness_score;
  const detected = score >= threshold;

  // Find empty categories
  const emptyCategories: string[] = [];
  Object.entries(matrix.signal_json)
    .filter(([key]) => key !== 'errors')
    .forEach(([name, cat]) => {
      if ((cat as { signals: EngineSignal[] }).signals.length === 0) {
        emptyCategories.push(name);
      }
    });

  return {
    detected,
    type: 'data_gap',
    severity: getSeverityFromScore(score),
    score,
    confidence: 0.9, // High confidence in detecting missing data
    signals: [],
    reason: detected
      ? `Missing data from: ${emptyCategories.join(', ')}`
      : 'Data completeness acceptable',
  };
}

/**
 * Detect blindspots
 */
function detectBlindspots(
  matrix: UnifiedSignalMatrix,
  factors: Map<WarningType, EarlyWarningFactor>
): WarningDetection {
  const factor = factors.get('blindspot');
  const threshold = factor?.threshold || 0.60;

  // Blindspot = low confidence across multiple categories
  const categories = Object.entries(matrix.signal_json)
    .filter(([key]) => key !== 'errors')
    .map(([, cat]) => cat as { confidence: number; signals: EngineSignal[] })
    .filter(cat => cat.signals.length > 0);

  const lowConfidence = categories.filter(cat => cat.confidence < 0.5).length;
  const score = categories.length > 0 ? lowConfidence / categories.length : 0;

  const detected = score >= threshold;

  return {
    detected,
    type: 'blindspot',
    severity: getSeverityFromScore(score),
    score,
    confidence: 0.7,
    signals: [],
    reason: detected
      ? `${lowConfidence} areas with low confidence data`
      : 'Good visibility across signals',
  };
}

/**
 * Calculate overall risk from warnings
 */
function calculateOverallRisk(
  warnings: WarningDetection[],
  factors: Map<WarningType, EarlyWarningFactor>
): number {
  if (warnings.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const warning of warnings) {
    const factor = factors.get(warning.type);
    const weight = factor?.weight || 0.1;
    weightedSum += warning.score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

/**
 * Get severity from score
 */
function getSeverityFromScore(score: number): WarningSeverity {
  if (score >= 0.7) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}
