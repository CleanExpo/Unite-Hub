import { describe, it, expect } from 'vitest'
import { getOperatorLanes, getGatewayStatus, OPERATOR_LANES } from '../lanes'

describe('model operator gateway lane registry', () => {
  it('exposes the six starter lanes', () => {
    const ids = getOperatorLanes().map((l) => l.laneId).sort()
    expect(ids).toEqual(
      [
        'agentic_nexus_skill_exec',
        'claude_code_max_primary',
        'claude_code_max_secondary',
        'cursor_cli',
        'hermes_local',
        'openai_codex_max',
      ].sort(),
    )
  })

  it('has NO API-key lane (no-API-key operator gateway principle)', () => {
    for (const lane of OPERATOR_LANES) {
      expect(lane.apiKeyRequired).toBe(false)
    }
    expect(getGatewayStatus().anyApiKeyLane).toBe(false)
  })

  it('defaults every lane to no external/production action', () => {
    for (const lane of OPERATOR_LANES) {
      expect(lane.externalActionAllowed).toBe(false)
      expect(lane.productionActionAllowed).toBe(false)
    }
  })

  it('marks codex/hermes/skill-exec active and claude/cursor not-yet-installed', () => {
    const status = getGatewayStatus()
    const byId = Object.fromEntries(getOperatorLanes().map((l) => [l.laneId, l]))
    expect(byId['openai_codex_max'].status).toBe('active')
    expect(byId['hermes_local'].status).toBe('active')
    expect(byId['agentic_nexus_skill_exec'].status).toBe('active')
    expect(byId['claude_code_max_primary'].status).toBe('design_only')
    expect(byId['cursor_cli'].status).toBe('not_installed')
    expect(status.activeLaneCount).toBe(3)
    expect(status.noApiKeyMode).toBe(true)
  })

  it('every active model lane requires a human operator session (not an API key)', () => {
    const codex = getOperatorLanes().find((l) => l.laneId === 'openai_codex_max')!
    expect(codex.requiresHumanSession).toBe(true)
    expect(codex.authMode).toBe('plan_session')
    expect(codex.maxPlanBased).toBe(true)
  })
})
