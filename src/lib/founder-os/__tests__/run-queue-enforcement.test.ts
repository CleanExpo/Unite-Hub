import { describe, expect, it } from 'vitest'
import { buildContinuationEnforcement, createRunQueueStore } from '../run-queue'
import type { FounderContextPack, FounderTaskPacket, MachineAssignment } from '../types'

const baseTask: FounderTaskPacket = {
  id: 'task-enforce-1',
  originalMessage: 'Continue until all completed across Pi-Dev-Ops.',
  taskType: 'code_change',
  lane: 'feature_build',
  portfolioTarget: 'pi_dev_ops',
  riskLevel: 'medium',
  objective: 'Make continue-until-complete enforceable.',
  requiredAgents: ['planner', 'implementer', 'challenger', 'qa'],
  doneCriteria: ['Implementation is tested', 'Evidence is recorded', 'Next lane is not opened while work remains'],
  contextPackId: 'ctx-enforce-1',
  requiresLocalExecution: true,
}

const baseContext: FounderContextPack = {
  id: 'ctx-enforce-1',
  taskId: 'task-enforce-1',
  portfolioTarget: 'pi_dev_ops',
  originalMessage: baseTask.originalMessage,
  durableSummary: 'pi_dev_ops/feature_build: Continue until complete enforcement.',
  constraints: ['Do not move to the next build while open work remains.'],
  decisions: ['Completion requires evidence and all queue work closed or blocked with receipt.'],
  evidenceLinks: [],
  blockers: [],
  nextRecommendedAction: 'Execute current lane until completed or blocked with evidence.',
  modelHistory: [],
  receiptIds: [],
  updatedAt: '2026-06-02T00:00:00.000Z',
}

const baseMachine: MachineAssignment = {
  taskId: 'task-enforce-1',
  assignedDeviceId: 'windows-desktop',
  assignedDeviceName: 'Windows Desktop PC',
  assignedRole: 'heavy_worker',
  status: 'assigned',
  reasons: ['Windows Desktop PC is assigned as heavy_worker.'],
  fallbackRoles: ['heavy_worker', 'always_on_host'],
}

describe('run queue continuation enforcement', () => {
  it('reports an enforced open-work gate until every queued run is completed or blocked', () => {
    const store = createRunQueueStore()
    store.enqueue({ taskPacket: baseTask, contextPack: baseContext, machineAssignment: baseMachine, now: '2026-06-02T00:00:00.000Z' })

    const enforcement = buildContinuationEnforcement(store.list())

    expect(enforcement.mode).toBe('continue_until_complete')
    expect(enforcement.openWorkCount).toBe(1)
    expect(enforcement.canOpenNextLane).toBe(false)
    expect(enforcement.requiredAction).toContain('Complete or block 1 open Pi run')
  })

  it('allows the next lane only when queue work is completed or blocked with evidence receipts', () => {
    const store = createRunQueueStore()
    const queued = store.enqueue({ taskPacket: baseTask, contextPack: baseContext, machineAssignment: baseMachine, now: '2026-06-02T00:00:00.000Z' })
    store.transition({ id: queued.id, action: 'start', actor: 'Pi-Dev-Ops', now: '2026-06-02T00:01:00.000Z' })
    store.transition({ id: queued.id, action: 'complete', actor: 'Pi-Dev-Ops', evidenceLink: 'loop:3x-targeted-tests-typecheck-build-pass', note: 'All verification gates passed.', now: '2026-06-02T00:02:00.000Z' })

    const enforcement = buildContinuationEnforcement(store.list())

    expect(enforcement.openWorkCount).toBe(0)
    expect(enforcement.canOpenNextLane).toBe(true)
    expect(enforcement.requiredAction).toBe('All queued Pi runs are closed with receipts. Open the next gated lane only if scope remains.')
  })
})
