// src/lib/advisory/debate-engine.ts
// Orchestrates the 5-round competitive debate between AI accounting firms.
// Returns an AsyncGenerator<DebateEvent> for real-time streaming.

import { createServiceClient } from '@/lib/supabase/service'
import type {
  FirmKey,
  RoundType,
  DebateEvent,
  FirmProposalData,
  FinancialContext,
  AdvisoryCase,
} from './types'
import { FIRM_KEYS, ROUND_LABELS, FIRM_META } from './types'
import {
  getFirmAgentConfigs,
  buildFirmUserMessage,
  callFirmAgent,
  buildJudgeUserMessage,
  callJudgeAgent,
} from './agents'
import { extractCitations } from './evidence-extractor'
import { notify } from '@/lib/notifications'

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3
const RETRY_BASE_MS = 1000

// ── Types ────────────────────────────────────────────────────────────────────

interface ProposalRecord {
  firm: FirmKey
  rawContent: string
  structured: FirmProposalData
  inputTokens: number
  outputTokens: number
  model: string
}

/** Per-round collection of raw proposal content keyed by firm. */
type RoundProposals = Record<FirmKey, string>

// ── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Run the full 5-round debate for an advisory case.
 *
 * Yields DebateEvent objects for real-time streaming to the frontend.
 * Writes all proposals, evidence, and scores to Supabase as the debate progresses.
 *
 * The generator catches individual firm failures so the debate can continue
 * with remaining firms. Only a total failure (all firms down) aborts.
 */
export async function* runDebate(
  caseId: string,
  founderId: string
): AsyncGenerator<DebateEvent> {
  const supabase = createServiceClient()

  // ── Load the case ──────────────────────────────────────────────────────
  const { data: caseRow, error: caseError } = await supabase
    .from('advisory_cases')
    .select('*')
    .eq('id', caseId)
    .eq('founder_id', founderId)
    .single()

  if (caseError || !caseRow) {
    yield { event: 'error', message: `Case not found: ${caseError?.message ?? 'unknown'}` }
    return
  }

  const advisoryCase = caseRow as AdvisoryCase

  if (advisoryCase.status !== 'draft') {
    yield { event: 'error', message: `Case status is '${advisoryCase.status}' — expected 'draft'` }
    return
  }

  const scenario = advisoryCase.scenario
  const financialContext = advisoryCase.financial_context as FinancialContext

  // ── Mark case as debating ──────────────────────────────────────────────
  await supabase
    .from('advisory_cases')
    .update({ status: 'debating', current_round: 0 })
    .eq('id', caseId)

  const firmConfigs = getFirmAgentConfigs()

  // Accumulate proposals across rounds for context injection
  const allRoundProposals: RoundProposals[] = []

  // ── Execute 5 rounds ───────────────────────────────────────────────────
  for (let round = 1; round <= 5; round++) {
    const roundInfo = ROUND_LABELS[round]
    yield { event: 'round_start', round, type: roundInfo.type }

    // Update case current_round
    await supabase
      .from('advisory_cases')
      .update({ current_round: round })
      .eq('id', caseId)

    const roundResults: ProposalRecord[] = []
    const roundRawContent: RoundProposals = {} as RoundProposals

    // ── Call 4 firms in parallel ────────────────────────────────────────
    const firmPromises = FIRM_KEYS.map(async (firmKey) => {
      const config = firmConfigs[firmKey]
      const userMessage = buildFirmUserMessage({
        round,
        roundType: roundInfo.type as RoundType,
        scenario,
        financialContext,
        firmKey,
        priorProposals: allRoundProposals.length > 0 ? allRoundProposals : undefined,
      })

      return callFirmAgentWithRetry(config, userMessage, firmKey)
    })

    // Yield firm_start events (outside the parallel promises)
    for (const firmKey of FIRM_KEYS) {
      yield { event: 'firm_start', round, firm: firmKey }
    }

    // Wait for all firms
    const results = await Promise.allSettled(firmPromises)

    for (let i = 0; i < FIRM_KEYS.length; i++) {
      const firmKey = FIRM_KEYS[i]
      const result = results[i]

      if (result.status === 'fulfilled' && result.value) {
        const { proposal, rawContent, inputTokens, outputTokens, model } = result.value

        roundResults.push({
          firm: firmKey,
          rawContent,
          structured: proposal,
          inputTokens,
          outputTokens,
          model,
        })
        roundRawContent[firmKey] = rawContent

        // Preview: first 200 chars of summary
        const preview = proposal.summary.slice(0, 200)
        yield { event: 'firm_response', round, firm: firmKey, preview }
      } else {
        const errorMsg = result.status === 'rejected'
          ? (result.reason instanceof Error ? result.reason.message : String(result.reason))
          : 'Unknown failure'
        yield { event: 'error', message: `${FIRM_META[firmKey].name} failed: ${errorMsg}`, round, firm: firmKey }
      }
    }

    // ── Check we have at least 2 firms (minimum for a meaningful debate) ─
    if (roundResults.length < 2) {
      yield { event: 'error', message: `Only ${roundResults.length} firm(s) responded in round ${round} — aborting debate` }
      await supabase
        .from('advisory_cases')
        .update({ status: 'draft', current_round: round - 1 })
        .eq('id', caseId)
      return
    }

    // ── Persist proposals + evidence to DB ──────────────────────────────
    for (const record of roundResults) {
      const proposalRow = {
        case_id: caseId,
        founder_id: founderId,
        firm_key: record.firm,
        round,
        round_type: roundInfo.type,
        content: record.rawContent,
        structured_data: record.structured,
        confidence_score: record.structured.confidenceScore,
        risk_level: deriveOverallRisk(record.structured),
        model_used: record.model,
        input_tokens: record.inputTokens,
        output_tokens: record.outputTokens,
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('advisory_proposals')
        .insert(proposalRow)
        .select('id')
        .single()

      if (insertErr) {
        console.error(`[debate-engine] Failed to insert proposal for ${record.firm} round ${round}:`, insertErr.message)
        continue
      }

      // Extract and store citations as evidence
      const allCitations = record.structured.strategies.flatMap(s => s.citations)
      if (allCitations.length > 0 && inserted) {
        const evidenceRows = extractCitations(
          inserted.id,
          caseId,
          founderId,
          allCitations
        )
        const { error: evidenceErr } = await supabase
          .from('advisory_evidence')
          .insert(evidenceRows)

        if (evidenceErr) {
          console.error(`[debate-engine] Failed to insert evidence for proposal ${inserted.id}:`, evidenceErr.message)
        }
      }
    }

    allRoundProposals.push(roundRawContent)
    yield { event: 'round_complete', round }
  }

  // ── Judge Phase ────────────────────────────────────────────────────────
  yield { event: 'judge_start' }

  const finalRoundProposals = allRoundProposals[4] // Round 5 (0-indexed = 4)
  if (!finalRoundProposals) {
    yield { event: 'error', message: 'No final round proposals found for judging' }
    return
  }

  try {
    const judgeMessage = buildJudgeUserMessage(
      scenario,
      financialContext,
      finalRoundProposals
    )

    const judgeResult = await callJudgeAgentWithRetry(judgeMessage)
    const { scores } = judgeResult

    // ── Store judge scores ───────────────────────────────────────────────
    const scoreRows = scores.scores.map(s => ({
      case_id: caseId,
      founder_id: founderId,
      firm_key: s.firmKey,
      legality_score: s.legality,
      compliance_risk_score: s.complianceRisk,
      financial_outcome_score: s.financialOutcome,
      documentation_score: s.documentation,
      ethics_score: s.ethics,
      weighted_total: s.weightedTotal,
      rationale: s.rationale,
      risk_flags: s.riskFlags,
      audit_triggers: s.auditTriggers,
    }))

    const { error: scoreErr } = await supabase
      .from('advisory_judge_scores')
      .insert(scoreRows)

    if (scoreErr) {
      console.error('[debate-engine] Failed to insert judge scores:', scoreErr.message)
    }

    // ── Create approval_queue entry ──────────────────────────────────────
    const { data: queueEntry, error: queueErr } = await supabase
      .from('approval_queue')
      .insert({
        founder_id: founderId,
        type: 'advisory_strategy',
        title: `Advisory: ${advisoryCase.title}`,
        description: scores.summary.slice(0, 500),
        payload: {
          case_id: caseId,
          winning_firm: scores.winner,
          judge_summary: scores.summary,
        },
        status: 'pending',
      })
      .select('id')
      .single()

    // ── Update case to judged ────────────────────────────────────────────
    const caseUpdate: Record<string, unknown> = {
      status: 'pending_review',
      winning_firm: scores.winner,
      judge_summary: scores.summary,
      judge_scores: scores,
    }

    if (queueEntry && !queueErr) {
      caseUpdate.approval_queue_id = queueEntry.id
    }

    await supabase
      .from('advisory_cases')
      .update(caseUpdate)
      .eq('id', caseId)

    yield { event: 'judge_complete', winner: scores.winner, scores: scores.scores }

    // Fire-and-forget notification for debate completion
    const winnerMeta = FIRM_META[scores.winner as FirmKey]
    const winnerEntry = scores.scores.find(
      (s: { firmKey: string }) => s.firmKey === scores.winner
    )
    notify({
      type: 'advisory_update',
      title: `Advisory case complete: ${advisoryCase.title}`,
      body: `Winner: ${winnerMeta?.name ?? scores.winner} (${winnerEntry?.weightedTotal ?? '—'}/100). ${scores.summary}`,
      severity: 'info',
    }).catch(() => {})
  } catch (judgeError) {
    const msg = judgeError instanceof Error ? judgeError.message : 'Unknown judge failure'
    yield { event: 'error', message: `Judge failed: ${msg}` }

    // Mark case as judged (incomplete) so it can be re-triggered
    await supabase
      .from('advisory_cases')
      .update({ status: 'judged' })
      .eq('id', caseId)
    return
  }

  yield { event: 'case_complete' }
}

// ── Retry Helpers ────────────────────────────────────────────────────────────

/**
 * Call a firm agent with exponential backoff retry.
 * Retries on network/API errors but NOT on structured output parse failures
 * (those indicate the model output is bad, retrying won't help).
 */
async function callFirmAgentWithRetry(
  config: Parameters<typeof callFirmAgent>[0],
  userMessage: string,
  firmKey: FirmKey
) {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await callFirmAgent(config, userMessage)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // Don't retry Zod validation errors — the model's output format is wrong
      if (lastError.message.includes('ZodError') || lastError.message.includes('JSON')) {
        throw lastError
      }

      // Exponential backoff: 1s, 2s, 4s
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt)
        console.warn(`[debate-engine] ${firmKey} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message)
        await sleep(delay)
      }
    }
  }

  throw lastError ?? new Error(`${firmKey} failed after ${MAX_RETRIES} attempts`)
}

async function callJudgeAgentWithRetry(userMessage: string) {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await callJudgeAgent(userMessage)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (lastError.message.includes('ZodError') || lastError.message.includes('JSON')) {
        throw lastError
      }

      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt)
        console.warn(`[debate-engine] Judge attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message)
        await sleep(delay)
      }
    }
  }

  throw lastError ?? new Error(`Judge failed after ${MAX_RETRIES} attempts`)
}

// ── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Derive the worst risk level across all strategies in a proposal.
 */
function deriveOverallRisk(
  proposal: FirmProposalData
): 'low' | 'medium' | 'high' | 'critical' {
  const levels = ['low', 'medium', 'high', 'critical'] as const
  let maxIdx = 0
  for (const strategy of proposal.strategies) {
    const idx = levels.indexOf(strategy.riskLevel)
    if (idx > maxIdx) maxIdx = idx
  }
  return levels[maxIdx]
}
