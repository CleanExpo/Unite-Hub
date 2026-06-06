import { describe, expect, it, vi } from 'vitest'
import { getCommandCentreOperatorSurfaceView } from '../command-centre'
import type { OperatorJobsView } from '../jobs'

const sandboxEmptyJobsView: OperatorJobsView = {
  source: 'sandbox_select',
  noApiKeyMode: true,
  liveExecution: false,
  jobCount: 0,
  jobs: [],
  note: 'Sandbox persistence connected; 0 jobs visible.',
}

describe('command centre operator execution surface view', () => {
  it('exposes all operator-session lanes without API-key mode or external execution', () => {
    const view = getCommandCentreOperatorSurfaceView()

    expect(view.surface).toBe('command_centre_operator_execution_surface')
    expect(view.founderOnly).toBe(true)
    expect(view.noApiKeyMode).toBe(true)
    expect(view.externalExecutionEnabled).toBe(false)
    expect(view.productionActionsGated).toBe(true)
    expect(view.jobSubmission.mode).toBe('disabled_safe_mock')
    expect(view.jobQueue.connected).toBe(false)
    expect(view.jobQueue.source).toBe('not_connected')

    const laneIds = view.lanes.map((lane) => lane.laneId)
    expect(laneIds).toEqual(expect.arrayContaining([
      'openai_codex_max',
      'claude_code_max_primary',
      'cursor_cli',
      'hermes_local',
      'agentic_nexus_skill_exec',
    ]))
    expect(view.lanes.every((lane) => lane.apiKeyRequired === false)).toBe(true)
    expect(view.lanes.every((lane) => lane.externalActionAllowed === false)).toBe(true)
    expect(view.lanes.every((lane) => lane.productionActionAllowed === false)).toBe(true)
  })

  it('renders Senior PM queue, daily ops, blocked gates, and evidence pointers', () => {
    const view = getCommandCentreOperatorSurfaceView()

    expect(view.seniorPmQueue.items.length).toBeGreaterThanOrEqual(3)
    expect(view.seniorPmQueue.items[0].status).toMatch(/gate|blocked|ready|completed/)
    expect(view.dailyOps.source).toBe('local_dashboard_snapshot')
    expect(view.dailyOps.externalDispatchEnabled).toBe(false)
    expect(view.blockedGates).toEqual(expect.arrayContaining([
      expect.objectContaining({ gateId: 'approve_operator_gateway_sandbox_apply' }),
      expect.objectContaining({ gateId: 'install_claude_code_and_cursor_lanes' }),
      expect.objectContaining({ gateId: 'enable_external_operator_execution' }),
    ]))
    expect(view.evidencePointers.length).toBeGreaterThanOrEqual(4)
    expect(view.boardDecisionPanel.currentDecision).toBe('build_command_centre_operator_execution_surface')
    expect(view.boardDecisionPanel.nextBoardGate).toContain('approve')
  })

  it('keeps blocked-lane messaging honest for Max-plan operator sessions', () => {
    const view = getCommandCentreOperatorSurfaceView()
    const claude = view.lanes.find((lane) => lane.laneId === 'claude_code_max_primary')!
    const cursor = view.lanes.find((lane) => lane.laneId === 'cursor_cli')!
    const codex = view.lanes.find((lane) => lane.laneId === 'openai_codex_max')!

    expect(codex.visibleInCommandCentre).toBe(true)
    expect(codex.authMode).toBe('plan_session')
    expect(claude.visibleInCommandCentre).toBe(true)
    expect(claude.blockedReason).toContain('operator install/login')
    expect(cursor.visibleInCommandCentre).toBe(true)
    expect(cursor.blockedReason).toContain('operator install/login')
  })
})



describe('command centre sandbox job creation state', () => {
  it('enables sandbox persistence-only creation when Board gate is approved', () => {
    const view = getCommandCentreOperatorSurfaceView({ jobsView: sandboxEmptyJobsView, sandboxJobCreationEnabled: true })

    expect(view.jobSubmission.mode).toBe('sandbox_persist_only')
    expect(view.jobSubmission.enabled).toBe(true)
    expect(view.jobSubmission.canPersist).toBe(true)
    expect(view.jobSubmission.canExecute).toBe(false)
    expect(view.jobSubmission.disabledReason).toContain('sandbox-only')
    expect(view.dryRunExecution.mode).toBe('sandbox_dry_run_only')
    expect(view.dryRunExecution.enabled).toBe(true)
    expect(view.dryRunExecution.canExecuteExternally).toBe(false)
    expect(view.dryRunExecution.liveRunnerEnabled).toBe(false)
    expect(view.dryRunExecution.productionConnected).toBe(false)
    expect(view.dryRunExecution.endpoint).toBe('/api/hermes/operator-gateway/jobs/dry-run')
    expect(view.blockedGates.map((gate) => gate.gateId)).toContain('approve_operator_gateway_sandbox_job_execution_dry_run')
    expect(view.boardDecisionPanel.nextBoardGate).toBe('approve_controlled_real_local_operator_execution_design_packet')
    expect(view.safetyStatus.externalExecutionEnabled).toBe(false)
  })
})
