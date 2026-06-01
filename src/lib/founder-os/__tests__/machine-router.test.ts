import { describe, expect, it } from 'vitest'
import { assignMachineForTask, requiredCapabilitiesForTask } from '../machine-router'
import type { FounderDevice, FounderTaskPacket } from '../types'

const devices: FounderDevice[] = [
  {
    id: 'mac-mini',
    displayName: 'Mac mini',
    role: 'always_on_host',
    status: 'online',
    maxRiskLevel: 'high',
    currentLoad: 3,
    capabilities: ['cron', 'webhooks', 'queue_worker', 'context_sync', 'scheduled_briefs'],
  },
  {
    id: 'windows-desktop',
    displayName: 'Windows Desktop PC',
    role: 'heavy_worker',
    status: 'online',
    maxRiskLevel: 'high',
    currentLoad: 2,
    capabilities: ['heavy_builds', 'docker', 'local_verification', 'browser_automation', 'playwright'],
  },
  {
    id: 'macbook-pro',
    displayName: 'MacBook Pro',
    role: 'mobile_cockpit',
    status: 'idle',
    maxRiskLevel: 'human_only',
    currentLoad: 0,
    capabilities: ['idea_capture', 'approval_review', 'voice_input', 'mobile_review'],
  },
]

function task(overrides: Partial<FounderTaskPacket>): FounderTaskPacket {
  return {
    id: 'task-1',
    originalMessage: 'Founder idea',
    taskType: 'research',
    lane: 'research',
    portfolioTarget: 'unite_hub',
    riskLevel: 'low',
    objective: 'Founder idea',
    requiredAgents: ['project-manager'],
    doneCriteria: ['Context pack is durable'],
    contextPackId: 'ctx-1',
    ...overrides,
  }
}

describe('assignMachineForTask', () => {
  it('assigns scheduled background work to the Mac mini host', () => {
    const result = assignMachineForTask(
      task({ taskType: 'scheduled_brief', requiresLongRunningHost: true }),
      devices,
    )

    expect(result.status).toBe('assigned')
    expect(result.assignedDeviceId).toBe('mac-mini')
    expect(result.reasons.join(' ')).toContain('always-on host')
  })

  it('assigns heavy build/test work to the Windows desktop', () => {
    const result = assignMachineForTask(task({ taskType: 'heavy_build', requiresLocalExecution: true }), devices)

    expect(result.status).toBe('assigned')
    expect(result.assignedDeviceId).toBe('windows-desktop')
    expect(result.reasons.join(' ')).toContain('Heavy build/test')
  })

  it('assigns browser/computer-use work only to a Playwright capable worker', () => {
    const result = assignMachineForTask(task({ taskType: 'browser_task', requiresBrowser: true, riskLevel: 'medium' }), devices)

    expect(result.status).toBe('assigned')
    expect(result.assignedDeviceId).toBe('windows-desktop')
    expect(result.reasons.join(' ')).toContain('Playwright/browser automation')
  })

  it('routes human approval and credential grants to the mobile cockpit', () => {
    const result = assignMachineForTask(
      task({ taskType: 'credential_grant', riskLevel: 'human_only', requiresHumanApproval: true }),
      devices,
    )

    expect(result.status).toBe('assigned')
    expect(result.assignedDeviceId).toBe('macbook-pro')
    expect(result.reasons.join(' ')).toContain('human approval')
  })

  it('waits instead of assigning browser work to a non-browser device', () => {
    const result = assignMachineForTask(
      task({ taskType: 'browser_task', requiresBrowser: true }),
      devices.filter((device) => device.id !== 'windows-desktop'),
    )

    expect(result.status).toBe('waiting_for_device')
    expect(result.assignedDeviceId).toBeNull()
    expect(result.reasons.join(' ')).toContain('No online device')
  })
})

describe('requiredCapabilitiesForTask', () => {
  it('adds context sync and queue worker for long-running tasks', () => {
    const result = requiredCapabilitiesForTask(task({ taskType: 'research', requiresLongRunningHost: true }))

    expect(result).toEqual(expect.arrayContaining(['queue_worker', 'context_sync']))
  })
})
