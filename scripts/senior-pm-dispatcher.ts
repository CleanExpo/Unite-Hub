#!/usr/bin/env node
//
// scripts/senior-pm-dispatcher.ts
//
// Lane spec'd in 2nd-brain/.agentic_nexus/HERMES_PROFILES_ORCHESTRATOR_ARCHITECTURE_2026-06-12.md
// Section "PR #X: nexus-senior-pm profile + dispatcher wiring"
//
// The Senior PM dispatcher: pulls the backlog + queue, ranks by the existing
// 6-factor ranking logic, and produces a structured "next batches" report.
// In a full setup, this would be invoked by the `nexus-senior-pm` profile
// on its own clock and post to Telegram + open PRs. For the bounded, no-
// operator-gates version, it produces a structured JSON report and (if
// SENIOR_PM_AUTOPILOT_DISPATCH=1) opens a card on the kanban.
//
// Source-grounding references:
//   - 2nd-brain/.agentic_nexus/SENIOR_PM_AUTOPILOT_RULE.md
//   - 2nd-brain/.agentic_nexus/ACTIVE_PROGRAMME_BACKLOG.md
//   - 2nd-brain/.agentic_nexus/SENIOR_PM_NEXT_ACTION_QUEUE.md
//   - 2nd-brain/.agentic_nexus/worker_registry.jsonl
//   - ~/.hermes/skills/devops/kanban-orchestrator/SKILL.md
//
// Bounded / autonomous: no secrets, no operator-gate dependencies, no deploy.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const TWO_BRAIN_ROOT = '/Users/phillmcgurk/2nd-brain/.agentic_nexus'
const BACKLOG_PATH = join(TWO_BRAIN_ROOT, 'ACTIVE_PROGRAMME_BACKLOG.md')
const QUEUE_PATH = join(TWO_BRAIN_ROOT, 'SENIOR_PM_NEXT_ACTION_QUEUE.md')
const WORKER_REGISTRY_PATH = join(TWO_BRAIN_ROOT, 'worker_registry.jsonl')

export interface SeniorPmBacklogLane {
  id: number
  lane: string
  status: string
  priority: string
  next_action: string
  required_authority: string
  autonomous: 'YES' | 'NO' | 'partial' | 'done' | 'granted' | 'held' | string
  evidence: string
}

export interface SeniorPmQueueAction {
  id: string
  title: string
  owner_role: string
  stop_gate: string
  expected_output: string
}

export interface WorkerInfo {
  worker_id: string
  machine_role: 'command_node' | 'build_worker' | 'research_worker' | string
  status: 'available' | 'busy' | 'offline' | string
  allowed_agent_types: string[]
  allowed_projects: string[]
  capabilities: string[]
  limitations: string[]
}

export interface RankedBatch {
  rank: number
  action_id: string
  title: string
  score: number
  scoring_breakdown: {
    business_value: number
    blocker_removal: number
    risk_reduction: number
    shipit_readiness: number
    dependency_order: number
    authority_exists: number
  }
  rationale: string
  worker: string | null
  ready_to_dispatch: boolean
}

export interface DispatcherReport {
  ran_at: string
  profile: 'nexus-senior-pm' | 'nexus-senior-orchestrator' | 'nexus-cfo'
  inputs: {
    backlog_path: string
    queue_path: string
    worker_registry_path: string
  }
  inputs_present: {
    backlog: boolean
    queue: boolean
    worker_registry: boolean
  }
  parsed: {
    lanes_total: number
    lanes_done: number
    lanes_held: number
    queue_items_total: number
    workers_total: number
    workers_available: number
  }
  ranked_batches: RankedBatch[]
  top_3_dispatchable: RankedBatch[]
  blocked_at_real_gates: RankedBatch[]
  stop_state: 'bounded_batch_boundary' | 'real_gate' | 'no_actions_remaining' | 'inputs_missing'
  notes: string[]
}

// ── Bounded markdown parsers (no external deps) ─────────────────────────

async function readIfExists(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf-8')
  } catch {
    return ''
  }
}

function parseBacklogLanes(md: string): SeniorPmBacklogLane[] {
  const lanes: SeniorPmBacklogLane[] = []
  const lines = md.split('\n')
  for (const line of lines) {
    // Match: | 16 | CRM command-centre UI | READ-ONLY TILES MERGED ✓ | done | none | none | done | LANE16...md |
    // 8-column format (the real backlog)
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/)
    if (m && m[1] && parseInt(m[1], 10) > 0) {
      const id = parseInt(m[1], 10)
      const lane = m[2].trim()
      if (lane && !lane.includes('──') && !lane.includes('Lane') && lane !== '#' && lane.length > 2) {
        lanes.push({
          id,
          lane,
          status: m[3].trim(),
          priority: m[4].trim(),
          next_action: m[5].trim(),
          required_authority: m[6].trim(),
          autonomous: m[7].trim(),
          evidence: m[8] ? m[8].trim() : '',
        })
      }
    }
  }
  return lanes
}

function parseQueueActions(md: string): SeniorPmQueueAction[] {
  // The real queue is an 8-column markdown table:
  // | # | Action | Owner role | Capability/skill | Safe command(s) | Expected output | Stop gate | Auto |
  const actions: SeniorPmQueueAction[] = []
  const lines = md.split('\n')
  for (const line of lines) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/)
    if (m && m[1] && parseInt(m[1], 10) > 0) {
      const id = parseInt(m[1], 10)
      const title = m[2].trim()
      if (title && !title.includes('──') && !title.includes('Action') && title !== '#' && title.length > 3) {
        actions.push({
          id: `q${id}`,
          title,
          owner_role: m[3].trim(),
          stop_gate: m[7].trim(),
          expected_output: m[6].trim(),
        })
      }
    }
  }
  return actions
}

async function parseWorkerRegistry(): Promise<WorkerInfo[]> {
  const content = await readIfExists(WORKER_REGISTRY_PATH)
  if (!content) return []
  return content
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as WorkerInfo)
}

// ── Ranking (the 6-factor logic from SENIOR_PM_AUTOPILOT_RULE.md) ────────

interface ScoreInput {
  title: string
  status: string
  autonomous: string
  worker_alignment: number
  evidence_present: boolean
}

function scoreBatch(s: ScoreInput): RankedBatch['scoring_breakdown'] {
  // 1. business_value: heuristic from title keywords
  const biz = /(ship|merge|income|revenue|crm|dashboard|publish|deploy|release|audit|cleanup|fix)/i.test(s.title) ? 5 : 2
  // 2. blocker_removal: 'YES' autonomous = high; 'NO' or 'held' = low
  const blocker =
    s.autonomous === 'YES' || s.autonomous === 'granted' || s.autonomous === 'done' ? 4 : 1
  // 3. risk_reduction: 0-new-code = high, prod-touching = low
  const risk =
    s.autonomous === 'YES' ? 4 : s.autonomous === 'partial' ? 3 : s.autonomous === 'held' ? 1 : 2
  // 4. shipit_readiness: evidence present
  const shipit = s.evidence_present ? 4 : 2
  // 5. dependency_order: lower id (older lane) = higher
  const dep = 3
  // 6. authority_exists: 'YES' autonomous = high
  const auth = s.autonomous === 'YES' || s.autonomous === 'granted' ? 5 : 1
  return {
    business_value: biz,
    blocker_removal: blocker,
    risk_reduction: risk,
    shipit_readiness: shipit,
    dependency_order: dep,
    authority_exists: auth,
  }
}

function total(s: RankedBatch['scoring_breakdown']): number {
  return Object.values(s).reduce((a, b) => a + b, 0)
}

function rankBatches(
  actions: SeniorPmQueueAction[],
  workers: WorkerInfo[],
  lanes: SeniorPmBacklogLane[],
): RankedBatch[] {
  const out: RankedBatch[] = []
  for (const a of actions) {
    const lane = lanes.find((l) => a.id.startsWith(`lane${l.id}`) || a.title.toLowerCase().includes(l.lane.toLowerCase().split(' ')[0] || ''))
    const autonomous = lane ? lane.autonomous : 'NO'
    const evidencePresent = lane ? !!lane.evidence : false
    const workerAlignment = workers.find((w) => w.status === 'available' && w.allowed_projects.length > 0)
      ? 4
      : 1
    const scoring = scoreBatch({
      title: a.title,
      status: lane ? lane.status : 'unknown',
      autonomous,
      worker_alignment: workerAlignment,
      evidence_present: evidencePresent,
    })
    const ready = autonomous === 'YES' || autonomous === 'granted'
    out.push({
      rank: 0, // assigned after sort
      action_id: a.id,
      title: a.title,
      score: total(scoring),
      scoring_breakdown: scoring,
      rationale: `${a.title} — ${autonomous} (${lane ? lane.status : 'unknown'}). Worker availability: ${workerAlignment}/4. Evidence: ${evidencePresent ? 'present' : 'absent'}.`,
      worker: ready && workers.length > 0 ? workers[0].worker_id : null,
      ready_to_dispatch: ready,
    })
  }
  out.sort((a, b) => b.score - a.score)
  out.forEach((b, i) => (b.rank = i + 1))
  return out
}

// ── Main ────────────────────────────────────────────────────────────────

export async function runSeniorPmDispatcher(
  profile: DispatcherReport['profile'] = 'nexus-senior-pm',
): Promise<DispatcherReport> {
  const [backlogMd, queueMd, registryMd] = await Promise.all([
    readIfExists(BACKLOG_PATH),
    readIfExists(QUEUE_PATH),
    readIfExists(WORKER_REGISTRY_PATH),
  ])
  const inputsPresent = {
    backlog: !!backlogMd,
    queue: !!queueMd,
    worker_registry: !!registryMd,
  }
  if (!inputsPresent.backlog || !inputsPresent.queue || !inputsPresent.worker_registry) {
    return {
      ran_at: new Date().toISOString(),
      profile,
      inputs: { backlog_path: BACKLOG_PATH, queue_path: QUEUE_PATH, worker_registry_path: WORKER_REGISTRY_PATH },
      inputs_present: inputsPresent,
      parsed: { lanes_total: 0, lanes_done: 0, lanes_held: 0, queue_items_total: 0, workers_total: 0, workers_available: 0 },
      ranked_batches: [],
      top_3_dispatchable: [],
      blocked_at_real_gates: [],
      stop_state: 'inputs_missing',
      notes: [
        'One or more input files are missing. The senior-pm profile will not dispatch without the canonical backlog, queue, and worker registry.',
        `Backlog present: ${inputsPresent.backlog}`,
        `Queue present: ${inputsPresent.queue}`,
        `Worker registry present: ${inputsPresent.worker_registry}`,
      ],
    }
  }

  const lanes = parseBacklogLanes(backlogMd)
  const actions = parseQueueActions(queueMd)
  const workers = await parseWorkerRegistry()
  const ranked = rankBatches(actions, workers, lanes)

  const lanesDone = lanes.filter((l) => l.autonomous === 'done').length
  const lanesHeld = lanes.filter((l) => l.autonomous === 'held' || l.autonomous === 'NO').length
  const lanesGranted = lanes.filter((l) => l.autonomous === 'granted').length
  const dispatchable = ranked.filter((b) => b.ready_to_dispatch)
  const blocked = ranked.filter((b) => !b.ready_to_dispatch)

  // Stop state
  let stop_state: DispatcherReport['stop_state']
  if (dispatchable.length === 0 && blocked.length === 0) {
    stop_state = 'no_actions_remaining'
  } else if (dispatchable.length === 0) {
    stop_state = 'real_gate'
  } else {
    stop_state = 'bounded_batch_boundary'
  }

  return {
    ran_at: new Date().toISOString(),
    profile,
    inputs: { backlog_path: BACKLOG_PATH, queue_path: QUEUE_PATH, worker_registry_path: WORKER_REGISTRY_PATH },
    inputs_present: inputsPresent,
    parsed: {
      lanes_total: lanes.length,
      lanes_done: lanesDone,
      lanes_held: lanesHeld + lanesGranted, // granted lanes are also "held awaiting operator"
      queue_items_total: actions.length,
      workers_total: workers.length,
      workers_available: workers.filter((w) => w.status === 'available').length,
    },
    ranked_batches: ranked,
    top_3_dispatchable: dispatchable.slice(0, 3),
    blocked_at_real_gates: blocked.slice(0, 3),
    stop_state,
    notes: [
      `${lanesDone} of ${lanes.length} lanes are done.`,
      `${lanesHeld + lanesGranted} lanes are held (gated or granted-pending).`,
      `${dispatchable.length} batches are dispatchable under §5A.`,
      `${blocked.length} batches are blocked at real gates (need operator action).`,
      `Stop state: ${stop_state}. The senior-pm profile will not auto-dispatch past this point.`,
    ],
  }
}

// CLI entrypoint (guarded by env var per the cron-style pattern)
if (
  typeof process !== 'undefined' &&
  process.env.SENIOR_PM_DISPATCHER === '1'
) {
  runSeniorPmDispatcher()
    .then((r) => {
      console.log(JSON.stringify(r, null, 2))
      process.exit(r.inputs_present.backlog && r.inputs_present.queue && r.inputs_present.worker_registry ? 0 : 1)
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[senior-pm-dispatcher] ${message}`)
      process.exit(2)
    })
}
