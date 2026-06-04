import { describe, it, expect, vi } from 'vitest'
import {
  createPersistentRunQueueStore,
  type QueuePersistence,
  type QueuePersistEnqueue,
  type QueuePersistTransition,
} from '@/lib/command-centre/queue-bridge'
import { createRunQueueStore } from '@/lib/founder-os/run-queue'
import type { FounderContextPack, FounderTaskPacket, MachineAssignment } from '@/lib/founder-os/types'

const taskPacket: FounderTaskPacket = {
  id: 'task-bridge-1',
  originalMessage: 'Bridge the queue to cc_tasks.',
  taskType: 'code_change',
  lane: 'feature_build',
  portfolioTarget: 'unite_hub',
  riskLevel: 'medium',
  objective: 'Bridge the queue to cc_tasks.',
  requiredAgents: ['senior-fullstack'],
  doneCriteria: ['Persistence mirrored'],
  contextPackId: 'ctx-bridge-1',
  requiresLocalExecution: true,
}

const contextPack: FounderContextPack = {
  id: 'ctx-bridge-1',
  taskId: 'task-bridge-1',
  portfolioTarget: 'unite_hub',
  originalMessage: 'Bridge the queue to cc_tasks.',
  durableSummary: 'unite_hub/feature_build: bridge',
  constraints: [],
  decisions: [],
  evidenceLinks: [],
  blockers: [],
  nextRecommendedAction: 'Mirror to cc_tasks.',
  modelHistory: [],
  receiptIds: [],
  updatedAt: '2026-06-04T00:00:00.000Z',
}

const machineAssignment: MachineAssignment = {
  taskId: 'task-bridge-1',
  assignedDeviceId: 'windows-desktop',
  assignedDeviceName: 'Windows Desktop PC',
  assignedRole: 'heavy_worker',
  status: 'assigned',
  reasons: [],
  fallbackRoles: ['heavy_worker'],
}

function makeMockPersistence() {
  const enqueues: QueuePersistEnqueue[] = []
  const transitions: QueuePersistTransition[] = []
  const persistence: QueuePersistence = {
    onEnqueue: vi.fn((p: QueuePersistEnqueue) => {
      enqueues.push(p)
    }),
    onTransition: vi.fn((p: QueuePersistTransition) => {
      transitions.push(p)
    }),
  }
  return { persistence, enqueues, transitions }
}

describe('createPersistentRunQueueStore', () => {
  it('mirrors enqueue to persistence with the correct cc_tasks payload', () => {
    const { persistence, enqueues } = makeMockPersistence()
    const store = createPersistentRunQueueStore(persistence)

    const item = store.enqueue({ taskPacket, contextPack, machineAssignment, now: '2026-06-04T00:00:00.000Z' })

    expect(persistence.onEnqueue).toHaveBeenCalledTimes(1)
    expect(enqueues[0].externalRef).toBe(item.id)
    expect(enqueues[0].externalRef).toBe('run_task-bridge-1')
    expect(enqueues[0].title).toBe('Bridge the queue to cc_tasks.')
    expect(enqueues[0].status).toBe('queued')
    expect(enqueues[0].riskLevel).toBe('medium')
    expect(enqueues[0].projectKey).toBe('unite_hub')
    expect(enqueues[0].humanApprovalRequired).toBe(false)
    expect(enqueues[0].item).toBe(item)
  })

  it('mirrors each transition to persistence with action + resulting status', () => {
    const { persistence, transitions } = makeMockPersistence()
    const store = createPersistentRunQueueStore(persistence)
    const queued = store.enqueue({ taskPacket, contextPack, machineAssignment, now: '2026-06-04T00:00:00.000Z' })

    store.transition({ id: queued.id, action: 'start', actor: 'Pi-Dev-Ops', now: '2026-06-04T00:01:00.000Z' })
    store.transition({
      id: queued.id,
      action: 'complete',
      actor: 'Pi-Dev-Ops',
      evidenceLink: 'vitest:pass',
      now: '2026-06-04T00:02:00.000Z',
    })

    expect(persistence.onTransition).toHaveBeenCalledTimes(2)
    expect(transitions[0].action).toBe('start')
    expect(transitions[0].status).toBe('in_progress')
    expect(transitions[0].externalRef).toBe(queued.id)
    expect(transitions[1].action).toBe('complete')
    expect(transitions[1].status).toBe('completed')
    expect(transitions[1].evidenceLink).toBe('vitest:pass')
  })

  it('keeps in-memory semantics identical to a plain RunQueueStore', () => {
    const { persistence } = makeMockPersistence()
    const bridged = createPersistentRunQueueStore(persistence)
    const plain = createRunQueueStore()

    const a = bridged.enqueue({ taskPacket, contextPack, machineAssignment, now: '2026-06-04T00:00:00.000Z' })
    const b = plain.enqueue({ taskPacket, contextPack, machineAssignment, now: '2026-06-04T00:00:00.000Z' })

    expect(a.id).toBe(b.id)
    expect(a.status).toBe(b.status)
    expect(bridged.list()).toHaveLength(1)
    expect(bridged.get(a.id)?.status).toBe('queued')
    expect(bridged.summary()).toEqual(plain.summary())

    // complete requires evidence — same throw as the underlying store.
    const started = bridged.transition({ id: a.id, action: 'start', actor: 'x', now: '2026-06-04T00:01:00.000Z' })
    expect(started.status).toBe('in_progress')
    expect(() => bridged.transition({ id: a.id, action: 'complete', actor: 'x' })).toThrow('completion requires evidenceLink')
  })

  it('does not call persistence on read paths (get/list/summary)', () => {
    const { persistence } = makeMockPersistence()
    const store = createPersistentRunQueueStore(persistence)
    store.enqueue({ taskPacket, contextPack, machineAssignment, now: '2026-06-04T00:00:00.000Z' })
    ;(persistence.onEnqueue as ReturnType<typeof vi.fn>).mockClear()

    store.list()
    store.get('run_task-bridge-1')
    store.summary()

    expect(persistence.onEnqueue).not.toHaveBeenCalled()
    expect(persistence.onTransition).not.toHaveBeenCalled()
  })

  it('never throws from a failing persistence side-effect (best-effort durability)', () => {
    const onPersistError = vi.fn()
    const persistence: QueuePersistence = {
      onEnqueue: () => {
        throw new Error('db down')
      },
      onTransition: () => {
        throw new Error('db down')
      },
    }
    const store = createPersistentRunQueueStore(persistence, { onPersistError })

    // enqueue still returns a valid item despite persistence throwing.
    const item = store.enqueue({ taskPacket, contextPack, machineAssignment, now: '2026-06-04T00:00:00.000Z' })
    expect(item.status).toBe('queued')
    expect(store.list()).toHaveLength(1)
  })

  it('seeds the wrapped store from initialItems (recovery)', () => {
    const { persistence } = makeMockPersistence()
    const seed = createRunQueueStore()
    const existing = seed.enqueue({ taskPacket, contextPack, machineAssignment, now: '2026-06-04T00:00:00.000Z' })

    const store = createPersistentRunQueueStore(persistence, { initialItems: [existing] })
    expect(store.list()).toHaveLength(1)
    expect(store.get(existing.id)?.id).toBe(existing.id)
    // Seeding does not re-fire enqueue persistence.
    expect(persistence.onEnqueue).not.toHaveBeenCalled()
  })
})
