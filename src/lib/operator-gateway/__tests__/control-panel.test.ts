import { describe, it, expect } from 'vitest'
import {
  getHermesVersionStatus,
  getControlPanelModules,
  getControlPanelView,
  HERMES_CONTROL_PANEL_MODULES,
  CREDENTIAL_BOUNDARIES,
  HERMES_VERSION,
} from '../control-panel'

describe('hermes v0.16 control panel registry', () => {
  it('reports Hermes v0.16 version + security posture (static)', () => {
    const v = getHermesVersionStatus()
    expect(v.version).toBe('0.16.0')
    expect(HERMES_VERSION).toBe('0.16.0')
    expect(v.configFormat).toBe(27)
    expect(v.source).toBe('static_registry')
    expect(v.securityPosture.secretRedaction).toBe('on')
    expect(v.securityPosture.subprocessCredentialStripping).toBe('on')
    expect(v.securityPosture.ssrfHardening).toBe('on')
  })

  it('exposes all thirteen Surface-Release modules', () => {
    expect(getControlPanelModules()).toHaveLength(13)
    const ids = getControlPanelModules().map((m) => m.moduleId)
    expect(new Set(ids).size).toBe(13) // unique
  })

  it('reports NO live external connection (read-only foundation)', () => {
    const view = getControlPanelView()
    expect(view.liveConnections).toBe(false)
    expect(view.externalChannelsEnabled).toBe(false)
    expect(view.mcpConnected).toBe(false)
    expect(view.remoteGatewayConnected).toBe(false)
    expect(view.credentialsExposed).toBe(false)
  })

  it('keeps every high-risk external surface gated (not active/connected)', () => {
    const gatedStates = new Set([
      'design_only',
      'not_connected',
      'none_enabled',
      'available_not_installed',
    ])
    for (const m of HERMES_CONTROL_PANEL_MODULES) {
      if (m.externalActionRisk === 'high') {
        expect(gatedStates.has(m.state)).toBe(true)
        expect(m.requiresLaterApproval).toBe(true)
      }
    }
  })

  it('NVIDIA trusted tap is available but NOT installed (no auto-install)', () => {
    const tap = getControlPanelModules().find((m) => m.moduleId === 'trusted_skills_tap_registry')!
    expect(tap.state).toBe('available_not_installed')
    expect(tap.requiresLaterApproval).toBe(true)
  })

  it('credential boundary carries status strings only — no secret values', () => {
    expect(CREDENTIAL_BOUNDARIES.length).toBeGreaterThan(0)
    for (const c of CREDENTIAL_BOUNDARIES) {
      expect(typeof c.boundary).toBe('string')
      expect(typeof c.status).toBe('string')
      // status must not look like a token/secret value
      expect(c.status).not.toMatch(/sbp_|sk-|ghp_|eyJ|AKIA|-----BEGIN/)
    }
    // the OP sandbox boundary reflects the BLOCKED-OP state textually
    const op = CREDENTIAL_BOUNDARIES.find((c) => c.boundary === 'op_sandbox')!
    expect(op.status).toMatch(/BLOCKED-OP/)
  })

  it('view counts are internally consistent', () => {
    const view = getControlPanelView()
    expect(view.moduleCount).toBe(13)
    expect(view.modulesImplementableNow).toBe(13) // all surfaced now (read-only)
    expect(view.highRiskGatedCount).toBe(
      HERMES_CONTROL_PANEL_MODULES.filter((m) => m.externalActionRisk === 'high').length,
    )
  })
})
