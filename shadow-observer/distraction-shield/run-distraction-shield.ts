/**
 * Distraction Shield Orchestrator
 * Runs both distraction and focus analyzers, correlates results, generates unified report
 *
 * Non-destructive, read-only analysis module
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { analyzeDistractions, DistractionAnalysis } from './distraction-analyzer';
import { analyzeFocusSessions, FocusAnalysis } from './focus-analyzer';
import { distractionConfig } from './distraction-config';

export interface DistractionShieldReport {
  timestamp: string;
  tenantId: string;
  analysisPeriodDays: number;
  distractions: DistractionAnalysis;
  focus: FocusAnalysis;
  correlation: {
    highDistractionImpact: number;
    focusSessionsAffectedByDistractions: number;
    averageDepthDropAfterCriticalEvents: number;
  };
  overallScore: number;
  healthStatus: 'critical' | 'warning' | 'moderate' | 'good' | 'excellent';
  riskFlags: string[];
  actionPlan: string[];
  timestamp_run: string;
}

export interface DistractionShieldOptions {
  tenantId: string;
  days?: number;
  reportDir?: string;
  founderId?: string;
}

/**
 * Main orchestrator function
 * Runs distraction and focus analyzers, correlates results
 */
export async function runDistractionShieldAnalysis(
  options: DistractionShieldOptions
): Promise<DistractionShieldReport> {
  const { tenantId, days = 7, reportDir = './reports', founderId } = options;

  console.log('[Distraction Shield] Starting analysis...');
  const startTime = Date.now();

  try {
    // Ensure report directory exists
    const reportPath = resolve(reportDir);
    if (!existsSync(reportPath)) {
      mkdirSync(reportPath, { recursive: true });
    }

    // Run both analyzers in parallel
    console.log('[Distraction Shield] Analyzing distractions and focus sessions...');
    const [distractions, focus] = await Promise.all([
      analyzeDistractions(tenantId, days, founderId),
      analyzeFocusSessions(tenantId, days, founderId)
    ]);

    // Correlate results
    console.log('[Distraction Shield] Correlating distraction/focus patterns...');
    const correlation = correlateAnalyses(distractions, focus);

    // Calculate overall score
    const overallScore = calculateHealthScore(
      distractions,
      focus,
      correlation
    );

    // Determine health status
    const healthStatus = determineHealthStatus(overallScore);

    // Merge risk flags
    const riskFlags = [
      ...new Set([
        ...distractions.riskFlags,
        ...focus.riskFlags,
        ...(correlation.focusSessionsAffectedByDistractions > 50
          ? ['distractions_severely_impacting_focus']
          : []),
        ...(correlation.averageDepthDropAfterCriticalEvents > 20
          ? ['critical_events_causing_depth_loss']
          : [])
      ])
    ];

    // Generate action plan
    const actionPlan = generateActionPlan(
      distractions,
      focus,
      correlation,
      riskFlags
    );

    const report: DistractionShieldReport = {
      timestamp: new Date().toISOString(),
      tenantId,
      analysisPeriodDays: days,
      distractions,
      focus,
      correlation,
      overallScore,
      healthStatus,
      riskFlags,
      actionPlan,
      timestamp_run: new Date().toISOString()
    };

    // Save report
    const reportFileName = `DISTRACTION_SHIELD_${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.json`;
    const reportFilePath = resolve(reportPath, reportFileName);

    writeFileSync(
      reportFilePath,
      JSON.stringify(report, (key, value) => {
        if (value instanceof Map) {
          return Object.fromEntries(value);
        }
        return value;
      }, 2)
    );

    const duration = Date.now() - startTime;
    console.log(`[Distraction Shield] Analysis complete: ${(duration / 1000).toFixed(1)}s`);
    console.log(`[Distraction Shield] Report saved: ${reportFileName}`);

    return report;
  } catch (error) {
    console.error('[Distraction Shield] Analysis failed:', error);
    throw error;
  }
}

/**
 * Correlate distraction and focus analyses
 */
function correlateAnalyses(
  distractions: DistractionAnalysis,
  focus: FocusAnalysis
): DistractionShieldReport['correlation'] {
  // Calculate high distraction impact (distractions that bypass prevention)
  const highDistractionImpact =
    distractions.totalDistractions > 0
      ? ((distractions.severity.critical + distractions.severity.high) /
          distractions.totalDistractions) *
        100
      : 0;

  // Estimate focus sessions affected (sessions with > 2 interruptions likely disrupted)
  const focusSessionsAffectedByDistractions =
    focus.totalSessions > 0
      ? (focus.totalInterruptions / (focus.totalSessions * 2)) * 100
      : 0;

  // Estimate depth drop after critical events
  // Using interruptions as proxy for critical distraction events
  const averageDepthDropAfterCriticalEvents =
    focus.avgDepthScore > 0
      ? Math.max(0, (focus.avgInterruptionsPerSession * 5) /
          focus.avgDepthScore)
      : 0;

  return {
    highDistractionImpact: Math.min(100, highDistractionImpact),
    focusSessionsAffectedByDistractions: Math.min(
      100,
      focusSessionsAffectedByDistractions
    ),
    averageDepthDropAfterCriticalEvents: Math.min(
      100,
      averageDepthDropAfterCriticalEvents
    )
  };
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(
  distractions: DistractionAnalysis,
  focus: FocusAnalysis,
  correlation: DistractionShieldReport['correlation']
): number {
  let score = 100;

  // Penalty for low prevention rate
  if (distractions.preventionRate < 80) {
    score -= (80 - distractions.preventionRate) * 0.5;
  }

  // Penalty for high recovery time
  if (distractions.avgRecoveryMins > distractionConfig.recoveryTimeWarning) {
    score -= Math.min(
      15,
      (distractions.avgRecoveryMins -
        distractionConfig.recoveryTimeWarning) * 0.2
    );
  }

  // Penalty for low depth score
  if (focus.avgDepthScore < 50) {
    score -= (50 - focus.avgDepthScore) * 0.3;
  }

  // Penalty for low completion rate
  if (focus.completionRate < 80) {
    score -= (80 - focus.completionRate) * 0.3;
  }

  // Penalty for high interruption rate
  if (focus.avgInterruptionsPerSession > 2) {
    score -= (focus.avgInterruptionsPerSession - 2) * 2;
  }

  // Penalty for correlation effects
  score -= correlation.highDistractionImpact * 0.2;
  score -= correlation.focusSessionsAffectedByDistractions * 0.15;

  return Math.max(0, Math.round(score));
}

/**
 * Determine health status based on score
 */
function determineHealthStatus(
  score: number
): DistractionShieldReport['healthStatus'] {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'moderate';
  if (score >= 30) return 'warning';
  return 'critical';
}

/**
 * Generate prioritized action plan
 */
function generateActionPlan(
  distractions: DistractionAnalysis,
  focus: FocusAnalysis,
  correlation: DistractionShieldReport['correlation'],
  riskFlags: string[]
): string[] {
  const actions: string[] = [];

  // Priority 1: Critical issues
  if (distractions.severity.critical > 0) {
    actions.push(
      `🚨 CRITICAL: ${distractions.severity.critical} critical distraction events detected. Implement immediate escalation protocols.`
    );
  }

  if (focus.completionRate < 50) {
    actions.push(
      '🚨 CRITICAL: Focus session completion rate critically low (<50%). Schedule blocking calendar review with zero-distraction mandate.'
    );
  }

  // Priority 2: High-impact issues
  if (correlation.focusSessionsAffectedByDistractions > 70) {
    actions.push(
      `⚠️ HIGH: ${Math.round(correlation.focusSessionsAffectedByDistractions)}% of focus sessions affected by distractions. Implement distraction source blocking.`
    );
  }

  if (distractions.preventionRate < 70) {
    actions.push(
      `⚠️ HIGH: Prevention rate only ${Math.round(distractions.preventionRate)}% (target: ${distractionConfig.preventionRateTarget}%). Review mitigation strategies.`
    );
  }

  // Priority 3: Moderate issues
  if (distractions.avgRecoveryMins > distractionConfig.recoveryTimeWarning * 2) {
    actions.push(
      `📋 MODERATE: Average recovery time ${Math.round(distractions.avgRecoveryMins)}min (threshold: ${distractionConfig.recoveryTimeWarning * 2}min). Implement rapid recovery techniques.`
    );
  }

  if (focus.avgDepthScore < 60) {
    actions.push(
      `📋 MODERATE: Average depth score ${Math.round(focus.avgDepthScore)}/100 (target: 70+). Increase focus block duration.`
    );
  }

  // Priority 4: Source-specific actions
  const topDistractionSource = distractions.topSources[0];
  if (topDistractionSource) {
    actions.push(
      `🎯 ACTION: Top distraction source: ${topDistractionSource.name} (${topDistractionSource.count} instances). Implement blocking rules.`
    );
  }

  const topFocusCategory = focus.topCategories[0];
  if (topFocusCategory && topFocusCategory.avgInterruptions > 2) {
    actions.push(
      `🎯 ACTION: ${topFocusCategory.name} sessions have high interruptions (${Math.round(topFocusCategory.avgInterruptions)}/session). Dedicate distraction-free time blocks.`
    );
  }

  // Priority 5: Optimization recommendations
  if (focus.totalFocusHours < distractionConfig.focusDayThreshold * 7) {
    actions.push(
      `✅ OPTIMIZE: Increase weekly focus time from ${Math.round(focus.totalFocusHours)}hrs to ${distractionConfig.focusDayThreshold * 7}hrs (${distractionConfig.focusDayThreshold}hrs/day).`
    );
  }

  if (focus.depthTrend.trend === 'declining') {
    actions.push(
      `✅ OPTIMIZE: Depth trend declining (${focus.depthTrend.twoWeeksAgo} → ${focus.depthTrend.lastWeek}). Review recent schedule changes or new distraction sources.`
    );
  }

  return actions;
}

/**
 * Export for CLI usage
 */
export async function executeDistraction Shield(options: {
  tenantId?: string;
  founderId?: string;
  days?: number;
  reportDir?: string;
}) {
  if (!options.tenantId && !options.founderId) {
    throw new Error('Either tenantId or founderId must be provided');
  }

  const report = await runDistractionShieldAnalysis({
    tenantId: options.tenantId || options.founderId || '',
    days: options.days || 7,
    reportDir: options.reportDir || './reports',
    founderId: options.founderId
  });

  return report;
}
