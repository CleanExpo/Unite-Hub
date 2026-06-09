import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the tasks accessors so we assert the adapter's orchestration in isolation
// (no Supabase, no DB). The adapter is the unit under test.
vi.mock('@/lib/command-centre/tasks', () => ({
  createTask: vi.fn(),
  appendTaskEvent: vi.fn(),
  updateTaskStatusByExternalRef: vi.fn(),
}))

import {
  createTask,
  appendTaskEvent,
  updateTaskStatusByExternalRef,
} from '@/lib/command-centre/tasks'
import {
  createSupabaseQueuePersistence,
  mapStatus,
  mapAction,
  mapRiskLevel,
} from '@/lib/command-centre/queue-persistence'
import type {
  QueuePersistEnqueue,
  QueuePersistTransition,
} from '@/lib/command-centre/queue-bridge'

const createTaskMock = vi.mocked(createTask)
const appendTaskEventMock = vi.mocked(appendTaskEvent)
const updateStatusMock = vi.mocked(updateTaskStatusByExternalRef)

// Minimal sentinel for the `item` field the bridge passes through; the adapter
// never reads it, so an opaque cast is fine for these tests.
const ITEM = {} as QueuePersistEnqueue['item']

function enqueuePayload(over: Partial<QueuePersistEnqueue> = {}): QueuePersistEnqueue {
  return {
    externalRef: 'run_task-1',
    title: 'Ship CC-04',
    objective: 'Wire the queue bridge to cc_tasks',
    status: 'queued',
    riskLevel: 'medium',
    projectKey: 'unite-hub',
    humanApprovalRequired: false,
    item: ITEM,
    ...over,
  }
}

function transitionPayload(over: Partial<QueuePersistTransition> = {}): QueuePersistTransition {
  return {
    externalRef: 'run_task-1',
    action: 'start',
    actor: 'Margot',
    status: 'in_progress',
    note: 'kicking off',
    evidenceLink: undefined,
    item: ITEM,
    ...over,
  }
}

describe('queue-persistence: mapping helpers', () => {
  it('mapStatus maps queue statuses to cc_tasks statuses', () => {
    expect(mapStatus('queued')).toBe('queued')
    expect(mapStatus('waiting_for_approval')).toBe('awaiting_approval')
    expect(mapStatus('waiting_for_device')).toBe('queued')
    expect(mapStatus('in_progress')).toBe('running')
    expect(mapStatus('blocked')).toBe('blocked')
    expect(mapStatus('completed')).toBe('done')
    // Unknown falls back to 'queued'.
    expect(mapStatus('nonsense' as never)).toBe('queued')
  })

  it('mapAction maps queue actions to cc_task_events types', () => {
    expect(mapAction('approve')).toBe('approved')
    expect(mapAction('start')).toBe('started')
    expect(mapAction('block')).toBe('blocked')
    expect(mapAction('complete')).toBe('completed')
    // Unknown falls back to 'status_changed'.
    expect(mapAction('nonsense' as never)).toBe('status_changed')
  })

  it('mapRiskLevel maps queue risk to cc_tasks risk (human_only -> critical)', () => {
    expect(mapRiskLevel('low')).toBe('low')
    expect(mapRiskLevel('medium')).toBe('medium')
    expect(mapRiskLevel('high')).toBe('high')
    expect(mapRiskLevel('human_only')).toBe('critical')
    expect(mapRiskLevel('nonsense' as never)).toBe('low')
  })
})

describe('createSupabaseQueuePersistence', () => {
  const client = {} as never
  const founderId = 'f1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('onEnqueue creates a cc_tasks row and appends a created event', async () => {
    createTaskMock.mockResolvedValue({ id: 't1', external_ref: 'run_task-1' } as never)
    appendTaskEventMock.mockResolvedValue({ id: 'e1' } as never)

    const persistence = createSupabaseQueuePersistence({ founderId, client })
    await persistence.onEnqueue(
      enqueuePayload({ status: 'waiting_for_approval', riskLevel: 'human_only', humanApprovalRequired: true }),
    )

    expect(createTaskMock).toHaveBeenCalledTimes(1)
    const [createArg, createClientArg] = createTaskMock.mock.calls[0]
    expect(createArg).toMatchObject({
      founderId: 'f1',
      externalRef: 'run_task-1',
      title: 'Ship CC-04',
      objective: 'Wire the queue bridge to cc_tasks',
      status: 'awaiting_approval',
      riskLevel: 'critical',
      projectKey: 'unite-hub',
      humanApprovalRequired: true,
      origin: 'idea',
    })
    expect(createClientArg).toBe(client)

    expect(appendTaskEventMock).toHaveBeenCalledTimes(1)
    const [eventArg, eventClientArg] = appendTaskEventMock.mock.calls[0]
    expect(eventArg).toMatchObject({
      founderId: 'f1',
      taskId: 't1',
      type: 'created',
      payload: { externalRef: 'run_task-1' },
    })
    expect(eventClientArg).toBe(client)
  })

  it('onEnqueue passes through a null projectKey', async () => {
    createTaskMock.mockResolvedValue({ id: 't2' } as never)
    appendTaskEventMock.mockResolvedValue({ id: 'e2' } as never)

    const persistence = createSupabaseQueuePersistence({ founderId, client })
    await persistence.onEnqueue(enqueuePayload({ projectKey: null as never }))

    expect(createTaskMock.mock.calls[0][0]).toMatchObject({ projectKey: null })
  })

  it('onTransition updates status and appends the mapped event when a row exists', async () => {
    updateStatusMock.mockResolvedValue({ id: 't1' } as never)
    appendTaskEventMock.mockResolvedValue({ id: 'e3' } as never)

    const persistence = createSupabaseQueuePersistence({ founderId, client })
    await persistence.onTransition(
      transitionPayload({ action: 'complete', status: 'completed', evidenceLink: 'wiki/CC-04.md', note: 'done' }),
    )

    expect(updateStatusMock).toHaveBeenCalledTimes(1)
    const [updateArg, updateClientArg] = updateStatusMock.mock.calls[0]
    expect(updateArg).toEqual({ founderId: 'f1', externalRef: 'run_task-1', status: 'done' })
    expect(updateClientArg).toBe(client)

    expect(appendTaskEventMock).toHaveBeenCalledTimes(1)
    expect(appendTaskEventMock.mock.calls[0][0]).toMatchObject({
      founderId: 'f1',
      taskId: 't1',
      type: 'completed',
      actor: 'Margot',
      payload: { note: 'done', evidenceLink: 'wiki/CC-04.md' },
    })
  })

  it('onTransition does not throw and appends no event for an unknown external_ref', async () => {
    updateStatusMock.mockResolvedValue(null)

    const persistence = createSupabaseQueuePersistence({ founderId, client })
    await expect(
      persistence.onTransition(transitionPayload({ externalRef: 'run_unknown' })),
    ).resolves.toBeUndefined()

    expect(updateStatusMock).toHaveBeenCalledTimes(1)
    expect(appendTaskEventMock).not.toHaveBeenCalled()
  })
})
