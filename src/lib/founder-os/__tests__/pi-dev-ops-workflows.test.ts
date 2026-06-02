import { describe, expect, it } from 'vitest'
import { buildPiDevOpsWorkflowState } from '../pi-dev-ops-workflows'

describe('buildPiDevOpsWorkflowState', () => {
  it('turns manifest and evidence into a Founder OS workflow control-plane state', () => {
    const state = buildPiDevOpsWorkflowState({
      manifest: {
        workflow_id: 'pi-dev-ops-dynamic-workflow-template',
        version: '1.0.0',
        intent: 'Senior engineer build loop',
        gates: ['intake', 'connection', 'bloat', 'build', 'verification', 'review', 'finalise', 'token'],
        model_routing: {
          planner: 'gpt-5.5-class',
          challenger: 'kimi-2.5-class',
          opus_ultrathink: 'explicit Claude Code OAuth/subscription only',
        },
        budgets: { max_agents: 5, max_turns_per_agent: 8, max_changed_files: 8 },
        governance: { requires_margot_review: true, allows_push: false },
        verification: { three_loop_required_for_code_changes: true },
      },
      evidence: {
        workflow_id: 'pi-dev-ops-dynamic-workflows-pathway-2026-06-02',
        request: 'Research Claude Dynamic Workflows',
        final_state: 'complete',
        actual_changed_files: ['a', 'b'],
        verification_results: [
          { command: 'node scripts/validate-pi-dev-ops-workflow.mjs', result: 'PASS' },
          { command: 'pnpm type-check', result: 'PASS' },
        ],
        connection_map: {
          portfolio_ssot: '.portfolio/PORTFOLIO.yaml',
          execution_board: 'Hermes Kanban',
          governance: 'Margot -> Pi-CEO Board',
        },
      },
    })

    expect(state.workflowId).toBe('pi-dev-ops-dynamic-workflow-template')
    expect(state.currentGate).toBe('finalise')
    expect(state.status).toBe('complete')
    expect(state.modelRoute.planner).toBe('gpt-5.5-class')
    expect(state.modelRoute.challenger).toBe('kimi-2.5-class')
    expect(state.requiresMargotReview).toBe(true)
    expect(state.changedFileCount).toBe(2)
    expect(state.verificationSummary).toContain('pnpm type-check')
    expect(state.nextAction).toContain('Surface')
  })

  it('marks blocked workflow evidence as blocked and points to blocker handling', () => {
    const state = buildPiDevOpsWorkflowState({
      manifest: {
        workflow_id: 'template',
        gates: ['intake', 'connection', 'verification', 'review', 'finalise'],
        model_routing: {},
        budgets: {},
        governance: {},
        verification: {},
      },
      evidence: {
        final_state: 'blocked',
        blockers: ['Missing Linear API key'],
        actual_changed_files: [],
        verification_results: [],
        connection_map: {},
      },
    })

    expect(state.status).toBe('blocked')
    expect(state.currentGate).toBe('verification')
    expect(state.blockers).toEqual(['Missing Linear API key'])
    expect(state.nextAction).toContain('Resolve blocker')
  })
})
