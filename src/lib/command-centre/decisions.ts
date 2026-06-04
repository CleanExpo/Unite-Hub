// src/lib/command-centre/decisions.ts
//
// Hand-written types + typed accessors for the Nexus Command Centre Board
// decision schema (CC-08). Backed by the cc_decisions table created in
// 20260604010000_cc_command_centre_phase2.sql.
//
// A decision records a 9-persona Senior Board verdict (APPROVED / HOLD /
// REJECTED) with rationale + per-persona detail, optionally linked to a task.
//
// No remote calls are made at import time — the Supabase server client is
// created lazily inside each accessor (matching the repo's API-route pattern).
// All rows are founder-scoped by RLS (founder_id = auth.uid()).

import { createClient } from '@/lib/supabase/server'
import type { SupabaseLike } from './tasks'

// ─── Types (hand-written; mirror the SQL schema) ──────────────────────────────

export type DecisionVerdict = 'APPROVED' | 'HOLD' | 'REJECTED'

/** A single Board persona's contribution to a deliberation. */
export interface PersonaOpinion {
  /** Persona id, e.g. 'technical-architect'. */
  persona: string
  /** This persona's vote on the idea. */
  stance: DecisionVerdict
  /** One-line rationale from this persona's lens. */
  comment: string
}

/** A durable Board decision row (cc_decisions). */
export interface CommandCentreDecision {
  id: string
  founder_id: string
  task_id: string | null
  subject: string
  verdict: DecisionVerdict
  rationale: string
  personas: Record<string, unknown>
  wiki_path: string | null
  at: string
}

// ─── Insert input shapes (founder_id is supplied by the accessor) ─────────────

export interface CreateDecisionInput {
  founderId: string
  subject: string
  verdict: DecisionVerdict
  rationale?: string
  /** Per-persona opinions; stored as JSONB. */
  personas?: PersonaOpinion[] | Record<string, unknown>
  taskId?: string | null
  wikiPath?: string | null
}

export interface ListDecisionsFilter {
  founderId: string
  taskId?: string
  verdict?: DecisionVerdict
  limit?: number
}

// Table name constant — single source of truth, asserted by tests.
export const CC_DECISIONS_TABLE = 'cc_decisions'

// ─── Accessors ────────────────────────────────────────────────────────────────

/**
 * Persist a Board decision. Defaults mirror the SQL column defaults. Returns the
 * inserted row. The `client` argument is for testing — production callers omit it
 * and a founder-scoped server client is created lazily.
 */
export async function createDecision(
  input: CreateDecisionInput,
  client?: SupabaseLike,
): Promise<CommandCentreDecision> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const row = {
    founder_id: input.founderId,
    task_id: input.taskId ?? null,
    subject: input.subject,
    verdict: input.verdict,
    rationale: input.rationale ?? '',
    personas: input.personas ?? {},
    wiki_path: input.wikiPath ?? null,
  }

  const { data, error } = await db.from(CC_DECISIONS_TABLE).insert(row).select('*').single()
  if (error) throw new Error(`createDecision failed: ${error.message}`)
  return data as CommandCentreDecision
}

/**
 * List founder-scoped Board decisions, newest first, optionally filtered by the
 * linked task and/or verdict. Capped at 100 rows.
 */
export async function listDecisions(
  filter: ListDecisionsFilter,
  client?: SupabaseLike,
): Promise<CommandCentreDecision[]> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 100)

  let query = db.from(CC_DECISIONS_TABLE).select('*').eq('founder_id', filter.founderId)
  if (filter.taskId) query = query.eq('task_id', filter.taskId) as never
  if (filter.verdict) query = query.eq('verdict', filter.verdict) as never

  const { data, error } = await query.order('at', { ascending: false }).limit(limit)
  if (error) throw new Error(`listDecisions failed: ${error.message}`)
  return (data as CommandCentreDecision[]) ?? []
}
