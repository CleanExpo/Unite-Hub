/**
 * Early Warning Truth Adapter
 * Phase 82: Enforces Truth Layer compliance on warnings
 */

import {
  EarlyWarningEvent,
  WarningDetection,
  UnifiedSignalMatrix,
} from './signalMatrixTypes';

/**
 * Truth-adapted warning with disclosures
 */
export interface TruthAdaptedWarning {
  original: EarlyWarningEvent;
  truth_compliant: boolean;
  disclaimers: string[];
  confidence_label: string;
  completeness_label: string;
  uncertainty_note: string | null;
}

/**
 * Validate warning integrity
 */
export function validateWarningIntegrity(
  detection: WarningDetection,
  matrix: UnifiedSignalMatrix
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check minimum confidence
  if (detection.confidence < 0.3) {
    issues.push('Confidence below minimum threshold (30%)');
  }

  // Check for supporting signals
  if (detection.signals.length === 0 && detection.type !== 'data_gap' && detection.type !== 'blindspot') {
    issues.push('No supporting signals for this warning');
  }

  // Check data completeness
  if (matrix.completeness_score < 0.2) {
    issues.push('Insufficient data for reliable warning');
  }

  // Check for plausible score
  if (detection.score < 0 || detection.score > 1) {
    issues.push('Score outside valid range');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Adapt warning for truth-compliant display
 */
export function adaptWarningForTruth(
  event: EarlyWarningEvent,
  matrix?: UnifiedSignalMatrix
): TruthAdaptedWarning {
  const disclaimers: string[] = [];

  // Confidence disclaimer
  if (event.confidence < 0.5) {
    disclaimers.push(
      `Low confidence (${Math.round(event.confidence * 100)}%): This warning is based on limited or uncertain data.`
    );
  } else if (event.confidence < 0.7) {
    disclaimers.push(
      `Moderate confidence (${Math.round(event.confidence * 100)}%): Some uncertainty exists in this assessment.`
    );
  }

  // Completeness disclaimer if matrix provided
  if (matrix && matrix.completeness_score < 0.6) {
    disclaimers.push(
      `Data completeness: ${Math.round(matrix.completeness_score * 100)}%. Some signal sources may be missing.`
    );
  }

  // Signal count disclaimer
  if (event.source_signals.length === 0) {
    disclaimers.push(
      'This warning is based on aggregate patterns rather than specific signals.'
    );
  }

  // Balanced mode disclaimer
  disclaimers.push(
    'This warning uses Balanced Mode thresholds to minimize false positives while surfacing genuine risks.'
  );

  // Get labels
  const confidenceLabel = getConfidenceLabel(event.confidence);
  const completenessLabel = matrix
    ? getCompletenessLabel(matrix.completeness_score)
    : 'Unknown';

  // Uncertainty note
  const uncertaintyNote = event.confidence < 0.85
    ? `This assessment has ${Math.round((1 - event.confidence) * 100)}% uncertainty. Consider additional verification.`
    : null;

  return {
    original: event,
    truth_compliant: event.confidence >= 0.3 && event.source_signals.length >= 0,
    disclaimers,
    confidence_label: confidenceLabel,
    completeness_label: completenessLabel,
    uncertainty_note: uncertaintyNote,
  };
}

/**
 * Annotate warning summary for founder display
 */
export function annotateWarningSummary(event: EarlyWarningEvent): string {
  let summary = '';

  // Severity indicator
  const severityEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🔵',
  }[event.severity];

  summary += `${severityEmoji} **${event.title}**\n\n`;

  // Core message
  summary += event.description_markdown.split('###')[0];

  // Truth annotations
  if (event.confidence < 0.7) {
    summary += `\n\n⚠️ *Confidence: ${Math.round(event.confidence * 100)}%*`;
  }

  if (event.source_signals.length > 0) {
    summary += `\n\n📊 Based on ${event.source_signals.length} signal(s)`;
  }

  return summary;
}

/**
 * Check if warning meets truth standards
 */
export function meetsMinimumTruthStandards(event: EarlyWarningEvent): {
  meets: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Minimum confidence
  if (event.confidence < 0.2) {
    issues.push('Confidence too low for reliable warning');
  }

  // Title and description required
  if (!event.title || event.title.length < 5) {
    issues.push('Warning title missing or too short');
  }

  if (!event.description_markdown || event.description_markdown.length < 20) {
    issues.push('Warning description missing or too short');
  }

  // Valid severity
  if (!['low', 'medium', 'high'].includes(event.severity)) {
    issues.push('Invalid severity level');
  }

  return {
    meets: issues.length === 0,
    issues,
  };
}

/**
 * Get confidence label
 */
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) {
return 'High';
}
  if (confidence >= 0.7) {
return 'Good';
}
  if (confidence >= 0.5) {
return 'Moderate';
}
  if (confidence >= 0.3) {
return 'Low';
}
  return 'Very Low';
}

/**
 * Get completeness label
 */
function getCompletenessLabel(completeness: number): string {
  if (completeness >= 0.85) {
return 'Excellent';
}
  if (completeness >= 0.7) {
return 'Good';
}
  if (completeness >= 0.5) {
return 'Moderate';
}
  if (completeness >= 0.3) {
return 'Limited';
}
  return 'Minimal';
}
