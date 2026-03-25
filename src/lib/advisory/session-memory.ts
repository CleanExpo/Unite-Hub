// src/lib/advisory/session-memory.ts
// Advisory-specific memory helpers — store debate outcomes and recall prior context.
//
// Called by debate-engine.ts:
//   • Before judge phase: recallAdvisoryContext() → inject into judge user message
//   • After case_complete: storeAdvisoryOutcome() → persist outcome for future debates
//
// All memory is scoped to the founder_id via memory-store RLS.

import {
  storeMemory,
  recallMemoriesByType,
  formatMemoriesForContext,
} from '@/lib/ai/features/memory-store'
import type { JudgeScoreSummary, FinancialContext } from './types'

const CAPABILITY_ID = 'advisory'

// ── Recall ───────────────────────────────────────────────────────────────────

/**
 * Recall all advisory memories for a founder, formatted for context injection.
 * Fetches preferences + facts + recent outcomes in parallel.
 * Returns an empty string when no memories exist — safe to conditionally append.
 */
export async function recallAdvisoryContext(founderId: string): Promise<string> {
  const [preferences, facts, outcomes] = await Promise.all([
    recallMemoriesByType(founderId, CAPABILITY_ID, 'preference', 10),
    recallMemoriesByType(founderId, CAPABILITY_ID, 'fact', 10),
    recallMemoriesByType(founderId, CAPABILITY_ID, 'outcome', 5),
  ])
  return formatMemoriesForContext([...preferences, ...facts, ...outcomes])
}

// ── Store ────────────────────────────────────────────────────────────────────

/**
 * Store the outcome of a completed advisory debate.
 * Called after judge_complete so future debates can reference prior results.
 *
 * Writes two memories:
 *   1. outcome — full case summary (winning firm, score, judge summary excerpt)
 *   2. fact    — lightweight per-business "last advised" record for quick recall
 */
export async function storeAdvisoryOutcome(
  founderId: string,
  caseTitle: string,
  caseId: string,
  scores: JudgeScoreSummary,
  financialContext: FinancialContext
): Promise<void> {
  const winner = scores.winner
  const winnerScore = scores.scores.find(s => s.firmKey === winner)

  await Promise.all([
    storeMemory({
      founderId,
      capabilityId: CAPABILITY_ID,
      memoryType: 'outcome',
      key: `case_${caseId}`,
      value: `Case "${caseTitle}" — Winner: ${winner} (${winnerScore?.weightedTotal ?? '?'}/100). ${scores.summary.slice(0, 300)}`,
      metadata: {
        caseId,
        winner,
        businessKey: financialContext.businessKey,
        firmScores: scores.scores.map(s => ({ firm: s.firmKey, total: s.weightedTotal })),
      },
    }),
    storeMemory({
      founderId,
      capabilityId: CAPABILITY_ID,
      memoryType: 'fact',
      key: `business_${financialContext.businessKey}_last_advised`,
      value: `Last advisory for ${financialContext.businessName} ran on ${financialContext.snapshotDate}. Winning strategy: ${winner}.`,
      metadata: {
        businessKey: financialContext.businessKey,
        caseId,
      },
    }),
  ])
}

/**
 * Explicitly store a founder preference derived from their behaviour.
 * E.g. after approving a low-risk strategy, the caller can record that preference.
 */
export async function storeFounderPreference(
  founderId: string,
  key: string,
  value: string
): Promise<void> {
  await storeMemory({
    founderId,
    capabilityId: CAPABILITY_ID,
    memoryType: 'preference',
    key,
    value,
  })
}
