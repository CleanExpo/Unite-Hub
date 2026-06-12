import { describe, it, expect } from 'vitest'
import { runOrchestratorDecompose, type WorkerProfile } from '../orchestrator-decompose'

const SAMPLE_WORKERS: WorkerProfile[] = [
  {
    worker_id: 'command-node-01',
    machine_role: 'command_node',
    allowed_agent_types: ['Senior Project Manager Agent', 'Dashboard Reporter Agent'],
    allowed_projects: ['Agentic Nexus', '2nd-brain', 'unite-group', 'unite-hub', 'synthex', 'restoreassist', 'disaster-recovery'],
    capabilities: ['queue', 'approval', 'dashboard', 'registry', 'obsidian', 'status_report'],
    limitaciones: ['no direct code execution', 'no production deploy', 'no external publishing'],
  },
  {
    worker_id: 'local-build-worker-01',
    machine_role: 'build_worker',
    allowed_agent_types: ['Principal Software Engineer Agent', 'QA/Test Agent'],
    allowed_projects: ['Agentic Nexus', 'unite-group', 'unite-hub', 'restoreassist', 'disaster-recovery', 'synthex'],
    capabilities: ['git', 'worktree', 'docker', 'node', 'python', 'test', 'build', 'playwright', 'lint', 'typecheck'],
    limitaciones: ['no production deploy without approval', 'no PR merge without approval'],
  },
  {
    worker_id: 'local-research-worker-01',
    machine_role: 'research_worker',
    allowed_agent_types: ['Context Discovery Agent', 'Research Director Agent', 'SEO/AEO/GEO Agent'],
    allowed_projects: ['Agentic Nexus', '2nd-brain', 'synthex', 'unite-group'],
    capabilities: ['obsidian', 'research', 'seo', 'aeo', 'geo', 'strategy', 'content'],
    limitaciones: ['no public publish without approval', 'no external email'],
  },
]

describe('classifyDirective (heuristic, public surface via decompose output)', () => {
  it('routes "test" / "build" / "code" to build_worker', async () => {
    const r = await runOrchestratorDecompose({
      directive: 'Add bounded tests for the AMBER providers',
      workers: SAMPLE_WORKERS,
    })
    expect(r.cards[0]?.machine_role).toBe('build_worker')
  })

  it('routes "research" / "content" / "spec" to research_worker', async () => {
    const r = await runOrchestratorDecompose({
      directive: 'Research the operator gateway and write a spec',
      workers: SAMPLE_WORKERS,
    })
    expect(r.cards[0]?.machine_role).toBe('research_worker')
  })

  it('routes "review" / "audit" / "verify" to command_node', async () => {
    const r = await runOrchestratorDecompose({
      directive: 'Review the backlog and verify the queue',
      workers: SAMPLE_WORKERS,
    })
    expect(r.cards[0]?.machine_role).toBe('command_node')
  })
})

describe('cap (count)', () => {
  it('caches count at 5 even if input is higher', async () => {
    const r = await runOrchestratorDecompose({
      directive: 'Build the bounded work',
      workers: SAMPLE_WORKERS,
      count: 99,
    })
    expect(r.cards.length).toBe(5)
  })

  it('uses count=1 if input is 0 or negative', async () => {
    const r = await runOrchestratorDecompose({
      directive: 'Build the bounded work',
      workers: SAMPLE_WORKERS,
      count: -3,
    })
    expect(r.cards.length).toBe(1)
  })
})

describe('safety (every card has all safety fields false)', () => {
  it('every card has production_db_touched=false, deployment_occurred=false, etc.', async () => {
    const r = await runOrchestratorDecompose({
      directive: 'Add bounded OAuth tests for the AMBER providers',
      workers: SAMPLE_WORKERS,
      count: 3,
    })
    for (const card of r.cards) {
      expect(card.safety.production_db_touched).toBe(false)
      expect(card.safety.deployment_occurred).toBe(false)
      expect(card.safety.secrets_accessed).toBe(false)
      expect(card.safety.external_activation).toBe(false)
      expect(card.safety.browser_or_computer_use).toBe(false)
      expect(card.safety.destructive_action).toBe(false)
    }
  })
})

describe('routing decisions (recorded in report)', () => {
  it('records matched_worker and alternative_workers per card', async () => {
    const r = await runOrchestratorDecompose({
      directive: 'Add bounded OAuth tests',
      workers: SAMPLE_WORKERS,
    })
    for (const decision of r.routing_decisions) {
      expect(decision.matched_worker).toBeTruthy()
      // Alternative workers: the other 2 workers in the registry
      expect(decision.alternative_workers.length).toBe(2)
    }
  })
})
