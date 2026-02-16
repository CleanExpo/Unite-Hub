/**
 * Combat Scheduler Service
 * Phase 88: Run combat cycles
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getReadyRounds, listRounds } from './combatRoundService';
import { listEntriesByRound, applyRealityAdjustments } from './combatEntryService';
import { determineWinner } from './combatWinnerService';
import { processIntegrations } from './combatIntegrationService';

interface CycleResult {
  roundsProcessed: number;
  winnersFound: number;
  inconclusives: number;
  integrations: {
    promoted: number;
    retired: number;
    evolved: number;
  };
  errors: string[];
}

/**
 * Run a complete combat cycle
 */
export async function runCombatCycle(workspaceId?: string): Promise<CycleResult> {
  const result: CycleResult = {
    roundsProcessed: 0,
    winnersFound: 0,
    inconclusives: 0,
    integrations: {
      promoted: 0,
      retired: 0,
      evolved: 0,
    },
    errors: [],
  };

  try {
    // Step 1: Apply reality adjustments to active entries
    await applyPendingAdjustments(workspaceId);

    // Step 2: Get rounds ready for winner determination
    const readyRounds = await getReadyRounds(workspaceId);

    // Step 3: Process each ready round
    for (const round of readyRounds) {
      try {
        // Determine winner
        const combatResult = await determineWinner(round.id);
        result.roundsProcessed++;

        if (combatResult.resultType === 'winner') {
          result.winnersFound++;

          // Process integrations
          const integrations = await processIntegrations(round.id);

          if (integrations.promoted) result.integrations.promoted++;
          if (integrations.retired) result.integrations.retired++;
          if (integrations.evolved) result.integrations.evolved++;
        } else if (combatResult.resultType === 'inconclusive') {
          result.inconclusives++;
        }
      } catch (error: unknown) {
        result.errors.push(`Round ${round.id}: ${error.message}`);
      }
    }

    return result;
  } catch (error: unknown) {
    result.errors.push(`Cycle error: ${error.message}`);
    return result;
  }
}

/**
 * Apply reality adjustments to pending entries
 */
async function applyPendingAdjustments(workspaceId?: string): Promise<number> {
  const supabase = await getSupabaseServer();

  // Get running rounds
  const rounds = await listRounds(workspaceId || '', {
    status: 'running',
    limit: 100,
  });

  let adjusted = 0;

  for (const round of rounds) {
    const entries = await listEntriesByRound(round.id);

    for (const entry of entries) {
      if (entry.entryStatus === 'pending' && entry.impressions > 0) {
        try {
          await applyRealityAdjustments(entry.id);
          adjusted++;
        } catch (error) {
          console.error(`Failed to adjust entry ${entry.id}:`, error);
        }
      }
    }
  }

  return adjusted;
}

/**
 * Check for rounds that need cleanup
 */
export async function cleanupStaleRounds(
  workspaceId: string,
  maxAgeDays: number = 30
): Promise<number> {
  const supabase = await getSupabaseServer();

  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();

  // Find stale running rounds
  const { data: staleRounds } = await supabase
    .from('combat_rounds')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('round_status', 'running')
    .lt('started_at', cutoff);

  if (!staleRounds || staleRounds.length === 0) {
    return 0;
  }

  // Mark as inconclusive
  const { error } = await supabase
    .from('combat_rounds')
    .update({
      round_status: 'inconclusive',
      completed_at: new Date().toISOString(),
      truth_notes: `Round automatically closed after ${maxAgeDays} days without conclusion`,
    })
    .in('id', staleRounds.map(r => r.id));

  if (error) {
    console.error('Failed to cleanup stale rounds:', error);
    return 0;
  }

  return staleRounds.length;
}

/**
 * Get scheduler status
 */
export async function getSchedulerStatus(workspaceId: string): Promise<{
  pendingRounds: number;
  runningRounds: number;
  readyForWinner: number;
  lastCycleAt?: string;
}> {
  const supabase = await getSupabaseServer();

  const [pending, running, ready] = await Promise.all([
    supabase
      .from('combat_rounds')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('round_status', 'pending'),

    supabase
      .from('combat_rounds')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('round_status', 'running'),

    supabase
      .from('combat_rounds')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('round_status', 'running')
      .contains('metadata', { ready_for_winner: true }),
  ]);

  return {
    pendingRounds: pending.count || 0,
    runningRounds: running.count || 0,
    readyForWinner: ready.count || 0,
  };
}
