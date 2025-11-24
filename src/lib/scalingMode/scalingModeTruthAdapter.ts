/**
 * Scaling Mode Truth Adapter
 * Phase 86: Truth-layer enforcement for scaling narratives
 */

import {
  ScalingModeConfig,
  ScalingHealthInputs,
  ScalingHealthScores,
  ScalingModeDecision,
} from './scalingModeTypes';
import { getModeDisplayName } from './scalingModeConfigService';
import { getRecommendationText } from './scalingModeDecisionService';

interface TruthCheckResult {
  valid: boolean;
  warnings: string[];
  missing_data: string[];
}

/**
 * Validate scaling inputs for completeness
 */
export function validateScalingInputs(
  inputs: ScalingHealthInputs
): TruthCheckResult {
  const warnings: string[] = [];
  const missingData: string[] = [];

  // Check data completeness
  Object.entries(inputs.data_completeness).forEach(([key, complete]) => {
    if (!complete) {
      missingData.push(key);
    }
  });

  // Add warnings for missing critical data
  if (!inputs.data_completeness.active_clients) {
    warnings.push('Active client count unavailable - capacity calculations may be inaccurate.');
  }

  if (!inputs.data_completeness.warnings) {
    warnings.push('Warning data unavailable - risk assessment incomplete.');
  }

  if (!inputs.data_completeness.infra_metrics) {
    warnings.push('Infrastructure metrics unavailable - health score may be inaccurate.');
  }

  return {
    valid: missingData.length < 3, // Allow up to 2 missing fields
    warnings,
    missing_data: missingData,
  };
}

/**
 * Generate truth-compliant snapshot summary
 */
export function generateSnapshotSummary(
  config: ScalingModeConfig,
  inputs: ScalingHealthInputs,
  scores: ScalingHealthScores,
  decision: ScalingModeDecision,
  safeCapacity: number,
  confidence: number
): string {
  const lines: string[] = [];
  const modeName = getModeDisplayName(config.current_mode);

  // Header
  lines.push(`## Scaling Health Snapshot`);
  lines.push('');

  // Current state
  lines.push(`**Current Mode:** ${modeName}`);
  lines.push(`**Active Clients:** ${inputs.active_clients}`);
  lines.push(`**Safe Capacity:** ${safeCapacity}`);
  lines.push(`**Utilisation:** ${safeCapacity > 0 ? Math.round((inputs.active_clients / safeCapacity) * 100) : 0}%`);
  lines.push('');

  // Health scores
  lines.push(`### Health Scores`);
  lines.push(`- Infrastructure Health: ${scores.infra_health_score.toFixed(0)}/100`);
  lines.push(`- AI Cost Pressure: ${scores.ai_cost_pressure_score.toFixed(0)}/100 ${scores.ai_cost_pressure_score > 70 ? '⚠️' : ''}`);
  lines.push(`- Warning Density: ${scores.warning_density_score.toFixed(0)}/100 ${scores.warning_density_score > 30 ? '⚠️' : ''}`);
  lines.push(`- Churn Risk: ${scores.churn_risk_score.toFixed(0)}/100 ${scores.churn_risk_score > 20 ? '⚠️' : ''}`);
  lines.push(`- **Overall Health: ${scores.overall_scaling_health_score.toFixed(0)}/100**`);
  lines.push('');

  // Recommendation
  lines.push(`### Recommendation`);
  lines.push(`**${getRecommendationText(decision.recommendation)}** (Confidence: ${(decision.confidence * 100).toFixed(0)}%)`);
  lines.push('');

  // Reasons
  if (decision.reasons.length > 0) {
    lines.push('**Rationale:**');
    decision.reasons.forEach(reason => {
      lines.push(`- ${reason}`);
    });
    lines.push('');
  }

  // Truth layer disclaimers
  const validation = validateScalingInputs(inputs);

  if (validation.warnings.length > 0 || confidence < 0.7) {
    lines.push('### ⚠️ Data Quality Notes');

    if (confidence < 0.7) {
      lines.push(`- Data completeness: ${(confidence * 100).toFixed(0)}% - some inputs unavailable.`);
    }

    validation.warnings.forEach(warning => {
      lines.push(`- ${warning}`);
    });

    if (validation.missing_data.length > 0) {
      lines.push(`- Missing: ${validation.missing_data.join(', ')}`);
    }

    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`*Generated: ${new Date().toISOString()}*`);

  return lines.join('\n');
}

/**
 * Generate investor-facing narrative from history
 */
export function generateInvestorNarrative(
  snapshots: any[],
  history: any[]
): string {
  const lines: string[] = [];

  lines.push('## Scaling Journey');
  lines.push('');

  if (snapshots.length === 0) {
    lines.push('No scaling data available yet.');
    return lines.join('\n');
  }

  const latest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];

  // Summary
  lines.push('### Current State');
  lines.push(`- Mode: **${getModeDisplayName(latest.current_mode)}**`);
  lines.push(`- Clients: ${latest.active_clients}`);
  lines.push(`- Capacity: ${latest.safe_capacity}`);
  lines.push(`- Health: ${latest.overall_scaling_health_score.toFixed(0)}/100`);
  lines.push('');

  // Mode changes
  const modeChanges = history.filter(h => h.event_type === 'mode_change');
  if (modeChanges.length > 0) {
    lines.push('### Mode Transitions');
    modeChanges.slice(0, 5).forEach(change => {
      const date = new Date(change.created_at).toLocaleDateString();
      lines.push(`- **${date}**: ${change.old_mode || 'initial'} → ${change.new_mode}`);
      lines.push(`  ${change.reason_markdown.split('\n')[0]}`);
    });
    lines.push('');
  }

  // Key metrics
  lines.push('### Key Metrics');
  lines.push('All numbers are derived from actual system telemetry and cost data.');
  lines.push('');

  // Truth layer notice
  lines.push('---');
  lines.push('*This narrative is generated from verified system data. ');
  lines.push('No metrics are estimated or projected by AI.*');

  return lines.join('\n');
}

/**
 * Check if recommendation should be blocked by truth layer
 */
export function shouldBlockRecommendation(
  decision: ScalingModeDecision,
  inputs: ScalingHealthInputs
): { blocked: boolean; reason?: string } {
  const validation = validateScalingInputs(inputs);

  // Block increase recommendations if data is incomplete
  if (decision.recommendation === 'increase_mode' && !validation.valid) {
    return {
      blocked: true,
      reason: 'Cannot recommend scaling up with incomplete data.',
    };
  }

  // Block if confidence is too low
  if (decision.recommendation === 'increase_mode' && decision.confidence < 0.6) {
    return {
      blocked: true,
      reason: 'Confidence too low for scaling recommendation.',
    };
  }

  return { blocked: false };
}
