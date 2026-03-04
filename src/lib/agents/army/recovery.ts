/**
 * Agent Army — Self-healing + Error Recovery utilities
 *
 * Provides exponential-backoff retry logic, dead-agent detection, and
 * automatic healing of stuck army_runs records that never completed.
 *
 * UNI-1451: Self-healing + error recovery system
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Runs older than this threshold (in minutes) that are still 'running' are considered dead. */
const DEAD_RUN_THRESHOLD_MINUTES = 10;

// ---------------------------------------------------------------------------
// Retry logic
// ---------------------------------------------------------------------------

export interface RetryOptions {
  /** Maximum number of attempts (default: 3). */
  maxAttempts?: number;
  /** Base delay in milliseconds for exponential backoff (default: 500). */
  baseDelayMs?: number;
  /** Agent ID for logging context (optional). */
  agentId?: string;
}

/**
 * Executes an async function with exponential backoff retry logic.
 *
 * Attempt delays: 0ms, 500ms, 1000ms, 2000ms, ... (doubles each retry).
 * Throws the last error if all attempts are exhausted.
 *
 * @example
 * const result = await withRetry(() => callClaudeApi(prompt), {
 *   maxAttempts: 3,
 *   baseDelayMs: 500,
 *   agentId: 'rev-lead-hunter',
 * });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 500, agentId = 'unknown' } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === maxAttempts;

      if (isLastAttempt) break;

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[army/recovery] Agent ${agentId} — attempt ${attempt}/${maxAttempts} failed. ` +
        `Retrying in ${delayMs}ms. Error: ${err instanceof Error ? err.message : String(err)}`,
      );

      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.error(
    `[army/recovery] Agent ${agentId} — all ${maxAttempts} attempts exhausted.`,
    lastError,
  );
  throw lastError;
}

// ---------------------------------------------------------------------------
// Dead-agent detection
// ---------------------------------------------------------------------------

/**
 * Detects army_runs records that have been stuck in 'running' status for
 * longer than DEAD_RUN_THRESHOLD_MINUTES.
 *
 * Returns an array of run IDs that are considered dead.
 */
export async function detectDeadRuns(supabase: SupabaseClient): Promise<string[]> {
  const threshold = new Date(
    Date.now() - DEAD_RUN_THRESHOLD_MINUTES * 60 * 1_000,
  ).toISOString();

  const { data, error } = await supabase
    .from('army_runs')
    .select('id')
    .eq('status', 'running')
    .lt('started_at', threshold);

  if (error) {
    console.error('[army/recovery] detectDeadRuns error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => row.id as string);
}

// ---------------------------------------------------------------------------
// Self-heal
// ---------------------------------------------------------------------------

/**
 * Resets all dead (stuck) runs from 'running' to 'failed' so they are
 * eligible for retry on the next cron cycle.
 *
 * Returns the number of records healed.
 */
export async function healDeadRuns(supabase: SupabaseClient): Promise<number> {
  const deadIds = await detectDeadRuns(supabase);

  if (deadIds.length === 0) return 0;

  const { error } = await supabase
    .from('army_runs')
    .update({
      status:       'failed',
      completed_at: new Date().toISOString(),
      result:       { error: 'Self-healed: run exceeded 10-minute timeout without completing.' },
    })
    .in('id', deadIds);

  if (error) {
    console.error('[army/recovery] healDeadRuns error:', error.message);
    return 0;
  }

  console.log(`[army/recovery] Healed ${deadIds.length} dead run(s).`);
  return deadIds.length;
}
