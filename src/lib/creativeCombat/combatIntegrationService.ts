/**
 * Combat Integration Service
 * Phase 88: Feed winners back to Orchestration + VIF evolution
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getResultByRound } from './combatWinnerService';
import { getEntryById } from './combatEntryService';
import { getRoundById } from './combatRoundService';

/**
 * Promote winning creative to orchestration pool
 */
export async function promoteWinner(roundId: string): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const result = await getResultByRound(roundId);
  if (!result || result.resultType !== 'winner' || !result.winnerEntryId) {
    return false;
  }

  const winner = await getEntryById(result.winnerEntryId);
  if (!winner) {
    return false;
  }

  const round = await getRoundById(roundId);
  if (!round) {
    return false;
  }

  // Update creative asset priority in orchestration
  // This would integrate with the MCOE asset selector
  const { error } = await supabase
    .from('combat_results')
    .update({
      winner_promoted: true,
      metadata: {
        ...result.metadata,
        promoted_at: new Date().toISOString(),
      },
    })
    .eq('id', result.id);

  if (error) {
    console.error('Failed to mark winner promoted:', error);
    return false;
  }

  // Log the promotion event
  await logIntegrationEvent(
    round.workspaceId,
    'winner_promoted',
    {
      round_id: roundId,
      entry_id: result.winnerEntryId,
      creative_id: winner.creativeAssetId,
      score: winner.score,
      lift_percent: result.scoreLiftPercent,
    }
  );

  return true;
}

/**
 * Retire losing creative from rotation
 */
export async function retireLoser(roundId: string): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const result = await getResultByRound(roundId);
  if (!result || result.resultType !== 'winner' || !result.loserEntryId) {
    return false;
  }

  const loser = await getEntryById(result.loserEntryId);
  if (!loser) {
    return false;
  }

  const round = await getRoundById(roundId);
  if (!round) {
    return false;
  }

  // Mark creative as retired in orchestration
  const { error } = await supabase
    .from('combat_results')
    .update({
      loser_retired: true,
      metadata: {
        ...result.metadata,
        retired_at: new Date().toISOString(),
      },
    })
    .eq('id', result.id);

  if (error) {
    console.error('Failed to mark loser retired:', error);
    return false;
  }

  // Log the retirement event
  await logIntegrationEvent(
    round.workspaceId,
    'loser_retired',
    {
      round_id: roundId,
      entry_id: result.loserEntryId,
      creative_id: loser.creativeAssetId,
      score: loser.score,
    }
  );

  return true;
}

/**
 * Trigger VIF evolution based on combat results
 */
export async function triggerEvolution(roundId: string): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const result = await getResultByRound(roundId);
  if (!result || result.resultType !== 'winner') {
    return false;
  }

  const round = await getRoundById(roundId);
  if (!round) {
    return false;
  }

  // Only trigger evolution for significant wins
  if ((result.scoreLiftPercent || 0) < 10) {
    return false;
  }

  // Mark evolution triggered
  const { error } = await supabase
    .from('combat_results')
    .update({
      evolution_triggered: true,
      metadata: {
        ...result.metadata,
        evolution_triggered_at: new Date().toISOString(),
      },
    })
    .eq('id', result.id);

  if (error) {
    console.error('Failed to mark evolution triggered:', error);
    return false;
  }

  // Log evolution event
  await logIntegrationEvent(
    round.workspaceId,
    'evolution_triggered',
    {
      round_id: roundId,
      lift_percent: result.scoreLiftPercent,
      confidence_band: result.confidenceBand,
    }
  );

  return true;
}

/**
 * Process all integrations for a completed round
 */
export async function processIntegrations(roundId: string): Promise<{
  promoted: boolean;
  retired: boolean;
  evolved: boolean;
}> {
  const promoted = await promoteWinner(roundId);
  const retired = await retireLoser(roundId);
  const evolved = await triggerEvolution(roundId);

  return { promoted, retired, evolved };
}

/**
 * Get integration stats for workspace
 */
export async function getIntegrationStats(
  workspaceId: string,
  days: number = 30
): Promise<{
  winnersPromoted: number;
  losersRetired: number;
  evolutionsTriggered: number;
}> {
  const supabase = await getSupabaseServer();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('combat_results')
    .select(`
      winner_promoted,
      loser_retired,
      evolution_triggered,
      combat_rounds!inner (workspace_id)
    `)
    .eq('combat_rounds.workspace_id', workspaceId)
    .gte('created_at', since);

  const results = data || [];

  return {
    winnersPromoted: results.filter(r => r.winner_promoted).length,
    losersRetired: results.filter(r => r.loser_retired).length,
    evolutionsTriggered: results.filter(r => r.evolution_triggered).length,
  };
}

// Helper
async function logIntegrationEvent(
  workspaceId: string,
  eventType: string,
  details: Record<string, any>
): Promise<void> {
  const supabase = await getSupabaseServer();

  // Log to early warning events or a dedicated integration log
  // For now, we'll just console log
  console.log(`[Combat Integration] ${eventType}:`, {
    workspace_id: workspaceId,
    ...details,
    timestamp: new Date().toISOString(),
  });
}
