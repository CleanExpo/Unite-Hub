/**
 * Combat Winner Service
 * Phase 88: Determine winners or declare inconclusive
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  CombatResult,
  CombatEntry,
  ConfidenceBand,
  ResultType,
} from './combatTypes';
import { listEntriesByRound, updateEntryStatus } from './combatEntryService';
import { getRoundById, completeRound } from './combatRoundService';

/**
 * Determine the winner of a combat round
 */
export async function determineWinner(roundId: string): Promise<CombatResult> {
  const supabase = await getSupabaseServer();

  // Get round
  const round = await getRoundById(roundId);
  if (!round) {
    throw new Error('Round not found');
  }

  // Get entries sorted by score
  const entries = await listEntriesByRound(roundId);

  if (entries.length < 2) {
    throw new Error('Need at least 2 entries to determine winner');
  }

  // Analyze competition
  const [first, second] = entries;
  const analysis = analyzeCompetition(first, second, round.minConfidence);

  // Generate result
  const result = await createResult(roundId, analysis, entries);

  // Update entry statuses
  if (analysis.resultType === 'winner') {
    await updateEntryStatus(first.id, 'winner');
    await updateEntryStatus(second.id, 'loser');
  } else if (analysis.resultType === 'tie') {
    await updateEntryStatus(first.id, 'tied');
    await updateEntryStatus(second.id, 'tied');
  }

  // Complete round
  const roundStatus = analysis.resultType === 'inconclusive' ? 'inconclusive' : 'complete';
  await completeRound(roundId, roundStatus);

  return result;
}

/**
 * Analyze competition between top two entries
 */
function analyzeCompetition(
  first: CombatEntry,
  second: CombatEntry,
  minConfidence: number
): {
  resultType: ResultType;
  confidenceBand: ConfidenceBand;
  statisticalSignificance: number;
  scoreDifference: number;
  liftPercent: number;
  isConclusive: boolean;
} {
  const scoreDifference = first.score - second.score;
  const liftPercent = second.score > 0 ? (scoreDifference / second.score) * 100 : 0;

  // Calculate statistical significance
  const avgConfidence = (first.confidence + second.confidence) / 2;
  const statisticalSignificance = calculateSignificance(first, second);

  // Determine confidence band
  const confidenceBand = getConfidenceBand(statisticalSignificance);

  // Determine if conclusive
  const isConclusive = avgConfidence >= minConfidence && statisticalSignificance >= 0.9;

  // Determine result type
  let resultType: ResultType = 'winner';

  if (!isConclusive) {
    resultType = 'inconclusive';
  } else if (Math.abs(liftPercent) < 5) {
    // Less than 5% difference is a tie
    resultType = 'tie';
  }

  return {
    resultType,
    confidenceBand,
    statisticalSignificance,
    scoreDifference,
    liftPercent,
    isConclusive,
  };
}

/**
 * Calculate statistical significance
 */
function calculateSignificance(first: CombatEntry, second: CombatEntry): number {
  // Simplified statistical significance based on:
  // - Score difference
  // - Sample sizes
  // - Confidence levels

  const scoreDiff = Math.abs(first.score - second.score);
  const avgScore = (first.score + second.score) / 2;

  if (avgScore === 0) {
return 0;
}

  const relativeChange = scoreDiff / avgScore;

  // Factor in sample size
  const sampleFactor = Math.min(1, (first.impressions + second.impressions) / 2000);

  // Factor in confidence
  const confidenceFactor = (first.confidence + second.confidence) / 2;

  // Combine factors
  const significance = Math.min(1, relativeChange * sampleFactor * confidenceFactor * 5);

  return Math.round(significance * 1000) / 1000;
}

/**
 * Get confidence band from significance
 */
function getConfidenceBand(significance: number): ConfidenceBand {
  if (significance >= 0.95) {
return 'very_high';
}
  if (significance >= 0.85) {
return 'high';
}
  if (significance >= 0.7) {
return 'medium';
}
  return 'low';
}

/**
 * Create result record
 */
async function createResult(
  roundId: string,
  analysis: any,
  entries: CombatEntry[]
): Promise<CombatResult> {
  const supabase = await getSupabaseServer();

  const [winner, loser] = entries;

  // Generate summary markdown
  const summary = generateSummary(analysis, winner, loser);

  // Determine truth completeness
  const truthComplete = analysis.isConclusive && winner.confidence >= 0.6;

  const { data, error } = await supabase
    .from('combat_results')
    .insert({
      round_id: roundId,
      winner_entry_id: analysis.resultType === 'winner' ? winner.id : null,
      loser_entry_id: analysis.resultType === 'winner' ? loser.id : null,
      result_type: analysis.resultType,
      confidence_band: analysis.confidenceBand,
      statistical_significance: analysis.statisticalSignificance,
      winner_score: winner.score,
      loser_score: loser.score,
      score_difference: analysis.scoreDifference,
      score_lift_percent: analysis.liftPercent,
      summary_markdown: summary,
      truth_complete: truthComplete,
      truth_notes: truthComplete ? null : 'Insufficient confidence for conclusive result',
      metadata: {
        entries_count: entries.length,
        total_impressions: entries.reduce((sum, e) => sum + e.impressions, 0),
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create result: ${error.message}`);
  }

  return mapToResult(data);
}

/**
 * Generate summary markdown
 */
function generateSummary(
  analysis: any,
  winner: CombatEntry,
  loser: CombatEntry
): string {
  const lines: string[] = [];

  if (analysis.resultType === 'winner') {
    lines.push(`## Winner: Variant ${winner.variant}`);
    lines.push('');
    lines.push(`**Score**: ${winner.score.toFixed(2)} vs ${loser.score.toFixed(2)}`);
    lines.push(`**Lift**: +${analysis.liftPercent.toFixed(1)}%`);
    lines.push(`**Confidence**: ${analysis.confidenceBand.replace('_', ' ').toUpperCase()}`);
    lines.push('');
    lines.push('### Performance Breakdown');
    lines.push(`- Impressions: ${winner.impressions.toLocaleString()} vs ${loser.impressions.toLocaleString()}`);
    lines.push(`- Clicks: ${winner.clicks.toLocaleString()} vs ${loser.clicks.toLocaleString()}`);
    lines.push(`- Conversions: ${winner.conversions} vs ${loser.conversions}`);
  } else if (analysis.resultType === 'tie') {
    lines.push('## Result: Tie');
    lines.push('');
    lines.push('Both variants performed similarly within the margin of error.');
    lines.push(`**Score difference**: ${Math.abs(analysis.scoreDifference).toFixed(2)} (<5%)`);
  } else {
    lines.push('## Result: Inconclusive');
    lines.push('');
    lines.push('Unable to determine a clear winner due to insufficient statistical confidence.');
    lines.push(`**Statistical significance**: ${(analysis.statisticalSignificance * 100).toFixed(0)}%`);
    lines.push('');
    lines.push('**Recommendation**: Continue test with more impressions.');
  }

  // Truth disclosure
  lines.push('');
  lines.push('---');
  lines.push('*Results based on actual performance data. Past performance does not guarantee future results.*');

  return lines.join('\n');
}

/**
 * Get result by round
 */
export async function getResultByRound(roundId: string): Promise<CombatResult | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('combat_results')
    .select('*')
    .eq('round_id', roundId)
    .single();

  if (error || !data) {
return null;
}

  return mapToResult(data);
}

/**
 * List results for workspace
 */
export async function listResults(
  workspaceId: string,
  options?: {
    resultType?: ResultType;
    limit?: number;
  }
): Promise<CombatResult[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('combat_results')
    .select(`
      *,
      combat_rounds!inner (workspace_id)
    `)
    .eq('combat_rounds.workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (options?.resultType) {
    query = query.eq('result_type', options.resultType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list results:', error);
    return [];
  }

  return (data || []).map(mapToResult);
}

// Helper
function mapToResult(row: any): CombatResult {
  return {
    id: row.id,
    createdAt: row.created_at,
    roundId: row.round_id,
    winnerEntryId: row.winner_entry_id,
    loserEntryId: row.loser_entry_id,
    resultType: row.result_type,
    confidenceBand: row.confidence_band,
    statisticalSignificance: parseFloat(row.statistical_significance),
    winnerScore: row.winner_score ? parseFloat(row.winner_score) : undefined,
    loserScore: row.loser_score ? parseFloat(row.loser_score) : undefined,
    scoreDifference: row.score_difference ? parseFloat(row.score_difference) : undefined,
    scoreLiftPercent: row.score_lift_percent ? parseFloat(row.score_lift_percent) : undefined,
    summaryMarkdown: row.summary_markdown,
    truthComplete: row.truth_complete,
    truthNotes: row.truth_notes,
    winnerPromoted: row.winner_promoted,
    loserRetired: row.loser_retired,
    evolutionTriggered: row.evolution_triggered,
    metadata: row.metadata,
  };
}
