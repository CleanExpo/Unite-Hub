// src/lib/command-centre/linear-sync.ts
//
// CC-05 — Linear contract sync (DRY-RUN by default).
//
// Maps a queued Command Centre task (cc_tasks, CC-03) to a Linear issue using
// the EXISTING autonomous-work contract markers — nothing new is invented:
//   - status marker: "Ready for Pi-Dev"
//   - label marker:  "pi-dev:autonomous"
//
// SAFETY (hard guardrail):
//   - Dry-run by DEFAULT. The default path returns the *planned* operation and
//     makes ZERO external Linear API calls.
//   - The live path runs ONLY when BOTH:
//       opts.live === true   AND   process.env.CC_LINEAR_LIVE === '1'
//     are set. Either missing → dry-run.
//   - No remote calls happen at import time.

import { createIssue, BUSINESS_TO_TEAM } from '@/lib/integrations/linear'
import type { CommandCentreTask, TaskRiskLevel } from '@/lib/command-centre/tasks'

/** Existing autonomous-work contract markers. Do NOT add new tags. */
export const PI_DEV_STATE_MARKER = 'Ready for Pi-Dev' as const
export const PI_DEV_LABEL_MARKER = 'pi-dev:autonomous' as const

export interface SyncTaskToLinearOptions {
  /**
   * Opt in to a real Linear write. Even when true, a write only happens if
   * process.env.CC_LINEAR_LIVE === '1' as well. Defaults to false (dry-run).
   */
  live?: boolean
  /**
   * Override the resolved Linear team key (e.g. 'SYN'). When omitted it is
   * derived from the task's project_key via BUSINESS_TO_TEAM (fallback 'UNI').
   */
  teamKey?: string
}

/** The operation the sync intends to perform — returned verbatim in dry-run. */
export interface LinearSyncPlan {
  mode: 'dry-run' | 'live'
  /** The cc_tasks external_ref / id this plan was built from. */
  taskRef: string
  teamKey: string
  title: string
  description: string
  priority: number
  /** Existing contract markers applied to the issue. */
  stateMarker: typeof PI_DEV_STATE_MARKER
  labelMarker: typeof PI_DEV_LABEL_MARKER
}

export interface LinearSyncResult {
  plan: LinearSyncPlan
  /** Whether a real Linear API call was made. Always false in dry-run. */
  executed: boolean
  /** Present only when a live issue was created. */
  issue?: { id: string; url?: string }
}

// cc_tasks priority enum (P0..P3) → Linear priority (1=urgent .. 4=low).
const PRIORITY_TO_LINEAR: Record<CommandCentreTask['priority'], number> = {
  P0: 1,
  P1: 2,
  P2: 3,
  P3: 4,
}

// Map a project_key to a Linear team key using the existing business mapping.
function resolveTeamKey(projectKey: string | null | undefined): string {
  const key = (projectKey ?? '').trim().toLowerCase()
  return BUSINESS_TO_TEAM[key] ?? 'UNI'
}

function riskLine(risk: TaskRiskLevel): string {
  return `Risk: ${risk}`
}

/** Build the issue description, embedding the contract markers for traceability. */
function buildDescription(task: CommandCentreTask): string {
  const lines = [
    task.objective || task.title,
    '',
    `Origin: ${task.origin}`,
    riskLine(task.risk_level),
    `Execution mode: ${task.execution_mode}`,
    `Contract: ${PI_DEV_STATE_MARKER} · ${PI_DEV_LABEL_MARKER}`,
  ]
  if (task.external_ref) lines.push(`Queue ref: ${task.external_ref}`)
  return lines.join('\n')
}

/**
 * Plan (and optionally execute) syncing a queued cc_task to Linear.
 *
 * DRY-RUN by default: returns the planned operation, makes no API call.
 * LIVE only when opts.live === true AND process.env.CC_LINEAR_LIVE === '1'.
 */
export async function syncTaskToLinear(
  task: CommandCentreTask,
  opts: SyncTaskToLinearOptions = {},
): Promise<LinearSyncResult> {
  const teamKey = opts.teamKey ?? resolveTeamKey(task.project_key)
  const isLive = opts.live === true && process.env.CC_LINEAR_LIVE === '1'

  const plan: LinearSyncPlan = {
    mode: isLive ? 'live' : 'dry-run',
    taskRef: task.external_ref ?? task.id,
    teamKey,
    title: task.title,
    description: buildDescription(task),
    priority: PRIORITY_TO_LINEAR[task.priority] ?? 3,
    stateMarker: PI_DEV_STATE_MARKER,
    labelMarker: PI_DEV_LABEL_MARKER,
  }

  if (!isLive) {
    // Default, safe path — zero external calls.
    return { plan, executed: false }
  }

  // Live path — explicitly opted in via BOTH the arg and the env flag.
  const issue = await createIssue({
    title: plan.title,
    description: plan.description,
    teamKey: plan.teamKey,
    priority: plan.priority,
    labelNames: [PI_DEV_LABEL_MARKER],
  })

  return { plan, executed: true, issue }
}
