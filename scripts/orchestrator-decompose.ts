#!/usr/bin/env node
//
// scripts/orchestrator-decompose.ts
//
// Lane spec'd in 2nd-brain/.agentic_nexus/HERMES_PROFILES_ORCHESTRATOR_ARCHITECTURE_2026-06-12.md
// Section "PR #X+1: nexus-senior-orchestrator profile + decomposition harness"
//
// The Senior Orchestrator decompose harness: takes a Phill directive (or a
// queue item) and produces 3-5 kanban-card-shaped work items, each routed
// to one of the 3 local workers (command-node / build / research).
//
// Bounded: no secrets, no operator gates, no deploy, no writes to remote.
// Outputs JSON to stdout (or to a path under 2nd-brain/.agentic_nexus/ when
// ORCHESTRATOR_DECOMPOSE_OUTPUT=1).
//
// Pattern source: the kanban-orchestrator skill + the existing decompose.ts
// in src/lib/command-centre/ (which is for the in-app command-centre).

import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const OUTPUT_DIR = '/Users/phillmcgurk/2nd-brain/.agentic_nexus/outputs/orchestrator-decompose'

export interface WorkerProfile {
  worker_id: string
  machine_role: 'command_node' | 'build_worker' | 'research_worker' | string
  allowed_agent_types: string[]
  allowed_projects: string[]
  capabilities: string[]
  limitaciones: string[]
}

export interface DecomposeInput {
  directive: string
  project?: string
  /** Optional: a specific lane to decompose. If absent, the directive drives routing. */
  lane?: string
  /** Number of cards to produce. Default: 3. Capped: 5. */
  count?: number
  workers: WorkerProfile[]
}

export interface DecomposeCard {
  id: string
  title: string
  description: string
  assignee: string
  worker_id: string
  machine_role: string
  allowed_agent_types: string[]
  blocked_by: string[]
  expected_output: string
  stop_gate: 'real_gate' | 'bounded_batch_boundary' | 'operator_action'
  rationale: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  safety: {
    production_db_touched: false
    deployment_occurred: false
    secrets_accessed: false
    external_activation: false
    browser_or_computer_use: false
    destructive_action: false
  }
}

export interface DecomposeReport {
  ran_at: string
  profile: 'nexus-senior-orchestrator'
  input: { directive: string; project?: string; lane?: string; count: number }
  workers_consulted: number
  cards: DecomposeCard[]
  routing_decisions: Array<{
    card_id: string
    matched_worker: string
    matched_capability: string
    alternative_workers: string[]
  }>
  notes: string[]
}

// ── Capability-routing helpers (bounded) ────────────────────────────────

const CAPABILITY_KEYWORDS: Array<{ kw: RegExp; capability: string; worker_role: 'command_node' | 'build_worker' | 'research_worker' }> = [
  { kw: /(read|review|audit|evidence|check|verify|inspect|status|report|compliance)/i, capability: 'status_report', worker_role: 'command_node' },
  { kw: /(test|build|code|pr|commit|push|merge|implement|fix|tdd|script|develop|engineer)/i, capability: 'coding', worker_role: 'build_worker' },
  { kw: /(research|content|seo|aeo|geo|discover|scan|write|document|spec)/i, capability: 'research', worker_role: 'research_worker' },
  { kw: /(orchestrat|decompos|route|dispatch|fanout|kanban|board)/i, capability: 'coordination', worker_role: 'command_node' },
  { kw: /(dashboard|widget|ui|tile|view|page|surface)/i, capability: 'queue_visibility', worker_role: 'command_node' },
]

function classifyDirective(directive: string): 'command_node' | 'build_worker' | 'research_worker' {
  let best: 'command_node' | 'build_worker' | 'research_worker' = 'build_worker' // safe default
  let bestScore = 0
  for (const { kw, worker_role } of CAPABILITY_KEYWORDS) {
    const matches = (directive.match(kw) || []).length
    if (matches > bestScore) {
      bestScore = matches
      best = worker_role
    }
  }
  return bestScore > 0 ? best : 'build_worker'
}

function pickWorker(
  workers: WorkerProfile[],
  desiredRole: 'command_node' | 'build_worker' | 'research_worker',
  project?: string,
): { worker: WorkerProfile; matched_capability: string; alternative_workers: string[] } {
  // Filter by role and project
  const candidates = workers.filter(
    (w) => w.machine_role === desiredRole && (!project || w.allowed_projects.includes(project) || w.allowed_projects.includes('Agentic Nexus')),
  )
  const fallback = workers.filter((w) => w.machine_role === desiredRole)
  const pool = candidates.length > 0 ? candidates : fallback
  const chosen = pool[0] || workers[0]!
  // Alternative workers: the OTHER workers in the registry (not just the
  // same role). This is the "what if we re-route" view that the orchestrator
  // surface cares about — even if all 3 workers in the same role are
  // dispatched in parallel, the alternatives are the cross-role options.
  const alternatives = workers.filter((w) => w.worker_id !== chosen.worker_id).map((w) => w.worker_id)
  // Pick the capability that matches the role
  const matched_capability =
    desiredRole === 'command_node'
      ? 'coordination'
      : desiredRole === 'build_worker'
        ? 'coding'
        : 'research'
  return { worker: chosen, matched_capability, alternative_workers: alternatives }
}

// ── Card-generation helper (bounded, no LLM call) ───────────────────────

function buildCard(
  index: number,
  directive: string,
  worker: WorkerProfile,
  matched_capability: string,
  count: number,
  stop_gate: DecomposeCard['stop_gate'],
): DecomposeCard {
  const id = `dec-${Date.now()}-${index}`
  return {
    id,
    title: `[decomposed ${index + 1}/${count}] ${directive.split(/\s+/).slice(0, 6).join(' ')}${directive.length > 30 ? '...' : ''}`,
    description: `Decomposed from Phill directive: "${directive}". Routed to ${worker.worker_id} (${worker.machine_role}) based on capability keyword match: ${matched_capability}.`,
    assignee: worker.machine_role,
    worker_id: worker.worker_id,
    machine_role: worker.machine_role,
    allowed_agent_types: worker.allowed_agent_types,
    blocked_by: [],
    expected_output: `Concrete deliverable per the directive (1 PR or 1 doc or 1 report).`,
    stop_gate,
    rationale: `Bounded autonomous work routed by capability match. Worker allowed_projects: ${worker.allowed_projects.join(', ')}.`,
    priority: count <= 2 ? 'P1' : 'P2',
    safety: {
      production_db_touched: false,
      deployment_occurred: false,
      secrets_accessed: false,
      external_activation: false,
      browser_or_computer_use: false,
      destructive_action: false,
    },
  }
}

// ── Main ────────────────────────────────────────────────────────────────

export async function runOrchestratorDecompose(input: DecomposeInput): Promise<DecomposeReport> {
  const count = Math.min(Math.max(input.count ?? 3, 1), 5)
  const targetRole = classifyDirective(input.directive)
  const { worker, matched_capability, alternative_workers } = pickWorker(input.workers, targetRole, input.project)

  // Generate `count` cards. First card is the primary; the rest are
  // sub-tasks (e.g. "spec", "test", "docs") that a real orchestrator
  // would emit. We emit them with the same worker but distinct titles.
  const cards: DecomposeCard[] = []
  const cardTitles: string[] = []
  if (count >= 1) cardTitles.push(input.directive)
  if (count >= 2) cardTitles.push(`Spec: ${input.directive}`)
  if (count >= 3) cardTitles.push(`Test: ${input.directive}`)
  if (count >= 4) cardTitles.push(`Docs: ${input.directive}`)
  if (count >= 5) cardTitles.push(`Audit: ${input.directive}`)

  for (let i = 0; i < cardTitles.length; i++) {
    const stop_gate: DecomposeCard['stop_gate'] = i === 0 ? 'bounded_batch_boundary' : 'bounded_batch_boundary'
    cards.push(buildCard(i, cardTitles[i]!, worker, matched_capability, count, stop_gate))
  }

  const report: DecomposeReport = {
    ran_at: new Date().toISOString(),
    profile: 'nexus-senior-orchestrator',
    input: { directive: input.directive, project: input.project, lane: input.lane, count },
    workers_consulted: input.workers.length,
    cards,
    routing_decisions: cards.map((c) => ({
      card_id: c.id,
      matched_worker: c.worker_id,
      matched_capability,
      alternative_workers,
    })),
    notes: [
      `Classified directive into role: ${targetRole}.`,
      `Selected worker: ${worker.worker_id} (allowed_projects: ${worker.allowed_projects.join(', ')}).`,
      `Generated ${cards.length} kanban cards (capped at 5 per the spec).`,
      `All cards have stop_gate=bounded_batch_boundary (no real-gate crossings; this is a bounded decomposition).`,
    ],
  }

  // Optional: write to disk (operator-controlled)
  if (process.env.ORCHESTRATOR_DECOMPOSE_OUTPUT === '1') {
    await mkdir(OUTPUT_DIR, { recursive: true })
    const path = join(OUTPUT_DIR, `${Date.now()}.json`)
    await writeFile(path, JSON.stringify(report, null, 2))
    report.notes.push(`Wrote report to: ${path}`)
  }

  return report
}

// CLI entrypoint
if (typeof process !== 'undefined' && process.env.ORCHESTRATOR_DECOMPOSE === '1') {
  const directive = process.argv[2] || ''
  if (!directive) {
    console.error('Usage: ORCHESTRATOR_DECOMPOSE=1 npx tsx scripts/orchestrator-decompose.ts "<directive>"')
    process.exit(2)
  }
  // Read workers from worker_registry.jsonl (the standard pattern)
  import('node:fs/promises').then(async (fs) => {
    const registryPath = '/Users/phillmcgurk/2nd-brain/.agentic_nexus/worker_registry.jsonl'
    let workers: WorkerProfile[] = []
    try {
      const content = await fs.readFile(registryPath, 'utf-8')
      workers = content
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => JSON.parse(l) as WorkerProfile)
    } catch (err) {
      console.error(`[orchestrator-decompose] could not read worker registry: ${err instanceof Error ? err.message : 'unknown'}`)
      process.exit(2)
    }
    const report = await runOrchestratorDecompose({ directive, workers })
    console.log(JSON.stringify(report, null, 2))
    process.exit(0)
  })
}
