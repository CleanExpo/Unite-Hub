// src/lib/command-centre/validation.ts
//
// CC-12 — Validation gate reporting + enforcement. Typed accessors over the
// cc_validation_runs table (20260604010000_cc_command_centre_phase2.sql) plus a
// pure "no fake-green" summary: a task may only be completed when every REQUIRED
// gate has a latest result of 'pass'.
//
// Architecture note: the web app does NOT execute the gate commands itself
// (no shell in a serverless request — that belongs to the execution layer,
// CC-14 sessions / Pi-CEO-Dev). Gate results are REPORTED here and recorded
// append-only; this module records, summarises, and gates completion on them.
//
// No remote calls at import time — the Supabase client is created lazily inside
// each accessor. All rows are founder-scoped by RLS (founder_id = auth.uid()).

import { createClient } from '@/lib/supabase/server'
import type { SupabaseLike } from './tasks'

// ─── Types (mirror the SQL schema) ────────────────────────────────────────────

/** cc_validation_runs.result CHECK (pass/fail/skip). */
export type GateResult = 'pass' | 'fail' | 'skip'

/** A single validation-gate run row (cc_validation_runs). */
export interface ValidationRun {
  id: string
  founder_id: string
  task_id: string
  gate: string
  command: string | null
  result: GateResult
  evidence_path: string | null
  ran_at: string
}

export interface RecordValidationRunInput {
  founderId: string
  taskId: string
  gate: string
  command?: string | null
  result?: GateResult
  evidencePath?: string | null
}

export interface ListValidationRunsFilter {
  founderId: string
  taskId: string
  limit?: number
}

// Table name constant — single source of truth, asserted by tests.
export const CC_VALIDATION_RUNS_TABLE = 'cc_validation_runs'

/** The canonical gate chain required before a task can be marked `done`. */
export const DEFAULT_REQUIRED_GATES = ['lint', 'type-check', 'test', 'build'] as const

// ─── Pure summary logic (unit-tested without any DB) ──────────────────────────

/**
 * Reduce an append-only run history to the LATEST result per gate (newest
 * ran_at wins). Runs are never edited, so the most recent run is the truth.
 */
export function latestByGate(runs: ValidationRun[]): Record<string, GateResult> {
  const latestAt: Record<string, string> = {}
  const result: Record<string, GateResult> = {}
  for (const run of runs) {
    if (!(run.gate in latestAt) || run.ran_at > latestAt[run.gate]) {
      latestAt[run.gate] = run.ran_at
      result[run.gate] = run.result
    }
  }
  return result
}

export type GateState = GateResult | 'pending'

export interface ValidationSummary {
  /** Latest state for every required gate ('pending' when no run exists yet). */
  byGate: Record<string, GateState>
  passed: string[]
  failed: string[]
  pending: string[]
  /**
   * NO FAKE-GREEN: true only when every required gate's latest result is 'pass'.
   * A missing (pending) or failing required gate ⇒ false.
   */
  canComplete: boolean
}

export function summariseValidation(
  runs: ValidationRun[],
  requiredGates: readonly string[] = DEFAULT_REQUIRED_GATES,
): ValidationSummary {
  const latest = latestByGate(runs)
  const byGate: Record<string, GateState> = {}
  const passed: string[] = []
  const failed: string[] = []
  const pending: string[] = []

  for (const gate of requiredGates) {
    // 'skip' and 'pending' (no run) are both non-passing → they block completion.
    const state: GateState = latest[gate] ?? 'pending'
    byGate[gate] = state
    if (state === 'pass') passed.push(gate)
    else if (state === 'fail') failed.push(gate)
    else pending.push(gate)
  }

  const canComplete = requiredGates.length > 0 && requiredGates.every((g) => latest[g] === 'pass')
  return { byGate, passed, failed, pending, canComplete }
}

// ─── Accessors ────────────────────────────────────────────────────────────────

/** Record a single gate result (append-only). Returns the inserted row. */
export async function recordValidationRun(
  input: RecordValidationRunInput,
  client?: SupabaseLike,
): Promise<ValidationRun> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const row = {
    founder_id: input.founderId,
    task_id: input.taskId,
    gate: input.gate,
    command: input.command ?? null,
    result: input.result ?? 'skip',
    evidence_path: input.evidencePath ?? null,
  }

  const { data, error } = await db.from(CC_VALIDATION_RUNS_TABLE).insert(row).select('*').single()
  if (error) throw new Error(`recordValidationRun failed: ${error.message}`)
  return data as ValidationRun
}

/** List a task's validation runs, newest first. Capped at 100 rows. */
export async function listValidationRuns(
  filter: ListValidationRunsFilter,
  client?: SupabaseLike,
): Promise<ValidationRun[]> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 100)

  const { data, error } = await db
    .from(CC_VALIDATION_RUNS_TABLE)
    .select('*')
    .eq('founder_id', filter.founderId)
    .eq('task_id', filter.taskId)
    .order('ran_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`listValidationRuns failed: ${error.message}`)
  return (data as ValidationRun[]) ?? []
}

/** Convenience: fetch a task's runs and reduce them to a completion summary. */
export async function getValidationSummary(
  input: { founderId: string; taskId: string; requiredGates?: readonly string[] },
  client?: SupabaseLike,
): Promise<ValidationSummary> {
  const runs = await listValidationRuns({ founderId: input.founderId, taskId: input.taskId }, client)
  return summariseValidation(runs, input.requiredGates)
}
