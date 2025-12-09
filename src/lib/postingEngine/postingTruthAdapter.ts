/**
 * AMPE Truth Adapter
 * Phase 85: Truth-layer notes for every posting decision
 */

import { PostingContext, PostingAttempt, SafetyCheckResults } from './postingTypes';

interface TruthNotes {
  summary: string;
  details: string[];
  disclaimers: string[];
  confidence_explanation: string;
  sources: string[];
}

/**
 * Generate truth notes for a posting decision
 */
export function generateTruthNotes(
  context: PostingContext,
  attempt: PostingAttempt,
  safetyResults: SafetyCheckResults
): TruthNotes {
  const details: string[] = [];
  const disclaimers: string[] = [];
  const sources: string[] = [];

  // Add phase disclaimer
  if (context.config.draft_mode_only) {
    disclaimers.push('Phase 85: Draft mode active - no actual publishing occurs.');
  }

  // Analyze safety check results
  const passedChecks = safetyResults.checks.filter(c => c.passed);
  const failedChecks = safetyResults.checks.filter(c => !c.passed);

  // Add safety summary
  details.push(
    `Safety evaluation: ${passedChecks.length}/${safetyResults.checks.length} checks passed.`
  );

  // Add warning details
  if (safetyResults.warnings.length > 0) {
    details.push(`Warnings: ${safetyResults.warnings.join(', ')}`);
  }

  // Add blocked reason
  if (safetyResults.blocked_by) {
    details.push(`Blocked by: ${safetyResults.blocked_by}`);
  }

  // Add channel state info
  if (context.channelState) {
    const state = context.channelState;
    details.push(
      `Channel health: fatigue ${(state.fatigue_score * 100).toFixed(0)}%, ` +
      `momentum ${(state.momentum_score * 100).toFixed(0)}%`
    );

    if (state.fatigue_score > 0.5) {
      disclaimers.push('Channel shows elevated fatigue - engagement may be reduced.');
    }
  }

  // Add early warning info
  if (context.earlyWarnings && context.earlyWarnings.length > 0) {
    const activeWarnings = context.earlyWarnings.filter(w => w.severity !== 'low');
    if (activeWarnings.length > 0) {
      details.push(`Active warnings: ${activeWarnings.length}`);
      sources.push('Early Warning Engine');
    }
  }

  // Confidence explanation
  const confidence = attempt.confidence_score || 0.8;
  let confidenceExplanation = '';

  if (confidence >= 0.9) {
    confidenceExplanation = 'High confidence - all safety checks passed with strong signals.';
  } else if (confidence >= 0.7) {
    confidenceExplanation = 'Moderate confidence - most checks passed with reasonable signals.';
  } else if (confidence >= 0.5) {
    confidenceExplanation = 'Low confidence - some concerns identified. Review recommended.';
    disclaimers.push('Low confidence score - results may not meet expectations.');
  } else {
    confidenceExplanation = 'Very low confidence - significant concerns. Manual review required.';
    disclaimers.push('Very low confidence - posting may not be effective.');
  }

  // Add sources
  sources.push('MCOE Schedule Data');
  sources.push('Channel State Metrics');
  if (context.config.block_during_warnings) {
    sources.push('Early Warning Engine');
  }

  // Build summary
  let summary = '';
  if (attempt.status === 'published') {
    summary = `Published to ${context.schedule.channel.toUpperCase()} successfully.`;
  } else if (attempt.status === 'draft_created') {
    summary = `Draft created for ${context.schedule.channel.toUpperCase()}.`;
  } else if (attempt.status === 'blocked') {
    summary = `Blocked: ${safetyResults.blocked_by || 'Safety check failed'}.`;
  } else if (attempt.status === 'failed') {
    summary = `Failed: ${attempt.error_message || 'Unknown error'}.`;
  } else {
    summary = `Pending processing for ${context.schedule.channel.toUpperCase()}.`;
  }

  return {
    summary,
    details,
    disclaimers,
    confidence_explanation: confidenceExplanation,
    sources,
  };
}

/**
 * Attach truth notes to a posting attempt
 */
export async function attachTruthNotes(
  attemptId: string,
  notes: TruthNotes
): Promise<void> {
  const { getSupabaseServer } = await import('@/lib/supabase');
  const supabase = await getSupabaseServer();

  const truthText = [
    notes.summary,
    '',
    'Details:',
    ...notes.details.map(d => `- ${d}`),
    '',
    'Confidence:',
    notes.confidence_explanation,
  ];

  if (notes.disclaimers.length > 0) {
    truthText.push('', 'Disclaimers:');
    notes.disclaimers.forEach(d => truthText.push(`⚠️ ${d}`));
  }

  if (notes.sources.length > 0) {
    truthText.push('', 'Sources:');
    notes.sources.forEach(s => truthText.push(`📊 ${s}`));
  }

  await supabase
    .from('posting_attempts')
    .update({
      truth_notes: truthText.join('\n'),
      truth_compliant: notes.disclaimers.length < 3, // More than 2 disclaimers = review needed
    })
    .eq('id', attemptId);
}

/**
 * Generate explanation prompt for AI
 */
export function generateExplanationPrompt(
  context: PostingContext,
  attempt: PostingAttempt
): string {
  return `
Explain to the founder/client why this post was ${attempt.status}.

Context:
- Channel: ${context.schedule.channel.toUpperCase()}
- Risk Level: ${context.schedule.risk_level}
- Confidence: ${(attempt.confidence_score * 100).toFixed(0)}%
- Status: ${attempt.status}
${attempt.error_message ? `- Error: ${attempt.error_message}` : ''}

${context.channelState ? `
Channel State:
- Fatigue: ${(context.channelState.fatigue_score * 100).toFixed(0)}%
- Momentum: ${(context.channelState.momentum_score * 100).toFixed(0)}%
- Last Post: ${context.channelState.last_post_at || 'Never'}
` : ''}

Safety Checks:
${JSON.stringify(attempt.safety_checks, null, 2)}

Requirements:
- Cite specific Early Warning or Performance Reality triggers if applicable
- State uncertainty if confidence < 0.7
- Avoid fabricated foresight or inflated predictions
- Be concise and actionable
`;
}

/**
 * Format truth notes for display
 */
export function formatTruthNotesForDisplay(notes: TruthNotes): string {
  const lines: string[] = [];

  lines.push(`📋 ${notes.summary}`);
  lines.push('');

  if (notes.details.length > 0) {
    lines.push('Details:');
    notes.details.forEach(d => lines.push(`  • ${d}`));
    lines.push('');
  }

  lines.push(`🎯 ${notes.confidence_explanation}`);

  if (notes.disclaimers.length > 0) {
    lines.push('');
    lines.push('⚠️ Disclaimers:');
    notes.disclaimers.forEach(d => lines.push(`  • ${d}`));
  }

  return lines.join('\n');
}

/**
 * Check if truth notes indicate need for review
 */
export function needsManualReview(notes: TruthNotes): boolean {
  // Review needed if:
  // - More than 2 disclaimers
  // - Contains "Very low confidence"
  // - Contains "Manual review required"

  if (notes.disclaimers.length > 2) {
return true;
}
  if (notes.confidence_explanation.includes('Very low')) {
return true;
}
  if (notes.confidence_explanation.includes('Manual review')) {
return true;
}

  return false;
}
