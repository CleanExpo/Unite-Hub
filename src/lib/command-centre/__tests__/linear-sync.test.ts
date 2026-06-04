import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the Linear integration so we can assert ZERO external calls in dry-run.
// BUSINESS_TO_TEAM is preserved (real mapping) so team resolution is realistic.
vi.mock('@/lib/integrations/linear', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/integrations/linear')>()
  return {
    ...actual,
    createIssue: vi.fn(async () => ({ id: 'SYN-123', url: 'https://linear.app/x/SYN-123' })),
  }
})

import {
  syncTaskToLinear,
  PI_DEV_STATE_MARKER,
  PI_DEV_LABEL_MARKER,
} from '@/lib/command-centre/linear-sync'
import { createIssue } from '@/lib/integrations/linear'
import type { CommandCentreTask } from '@/lib/command-centre/tasks'

const mockCreateIssue = createIssue as unknown as ReturnType<typeof vi.fn>

function makeTask(overrides: Partial<CommandCentreTask> = {}): CommandCentreTask {
  return {
    id: 'uuid-1',
    founder_id: 'f1',
    external_ref: 'run_task-1',
    queue_id: null,
    project_id: null,
    project_key: 'synthex',
    title: 'Ship the queue bridge',
    objective: 'Mirror queue state to cc_tasks.',
    priority: 'P1',
    status: 'queued',
    agent_owner: 'Pi-Dev-Ops',
    risk_level: 'medium',
    execution_mode: 'branch-preview',
    origin: 'board-review',
    dependencies: [],
    human_approval_required: true,
    evidence_path: null,
    validation_required: [],
    linear_id: null,
    preview_url: null,
    metadata: {},
    created_at: '2026-06-04T00:00:00.000Z',
    updated_at: '2026-06-04T00:00:00.000Z',
    ...overrides,
  }
}

const originalEnv = process.env.CC_LINEAR_LIVE

beforeEach(() => {
  mockCreateIssue.mockClear()
  delete process.env.CC_LINEAR_LIVE
})

afterEach(() => {
  if (originalEnv === undefined) delete process.env.CC_LINEAR_LIVE
  else process.env.CC_LINEAR_LIVE = originalEnv
})

describe('syncTaskToLinear — dry-run by default', () => {
  it('returns a dry-run plan and makes NO Linear API call by default', async () => {
    const result = await syncTaskToLinear(makeTask())

    expect(result.executed).toBe(false)
    expect(result.issue).toBeUndefined()
    expect(result.plan.mode).toBe('dry-run')
    expect(mockCreateIssue).not.toHaveBeenCalled()
  })

  it('uses EXACTLY the existing contract markers (no invented tags)', async () => {
    const { plan } = await syncTaskToLinear(makeTask())

    expect(plan.stateMarker).toBe('Ready for Pi-Dev')
    expect(plan.labelMarker).toBe('pi-dev:autonomous')
    expect(PI_DEV_STATE_MARKER).toBe('Ready for Pi-Dev')
    expect(PI_DEV_LABEL_MARKER).toBe('pi-dev:autonomous')
    // Description embeds the contract markers verbatim and nothing else as a tag.
    expect(plan.description).toContain('Ready for Pi-Dev · pi-dev:autonomous')
  })

  it('maps task fields into the plan (team, priority, ref, title)', async () => {
    const { plan } = await syncTaskToLinear(makeTask())
    expect(plan.teamKey).toBe('SYN') // synthex → SYN via BUSINESS_TO_TEAM
    expect(plan.priority).toBe(2) // P1 → 2
    expect(plan.taskRef).toBe('run_task-1')
    expect(plan.title).toBe('Ship the queue bridge')
  })

  it('falls back to the UNI team for unknown project keys', async () => {
    const { plan } = await syncTaskToLinear(makeTask({ project_key: 'totally-unknown' }))
    expect(plan.teamKey).toBe('UNI')
  })

  it('honours an explicit teamKey override', async () => {
    const { plan } = await syncTaskToLinear(makeTask(), { teamKey: 'DR' })
    expect(plan.teamKey).toBe('DR')
  })

  it('stays dry-run when live:true but the env flag is NOT set', async () => {
    delete process.env.CC_LINEAR_LIVE
    const result = await syncTaskToLinear(makeTask(), { live: true })
    expect(result.plan.mode).toBe('dry-run')
    expect(result.executed).toBe(false)
    expect(mockCreateIssue).not.toHaveBeenCalled()
  })

  it('stays dry-run when the env flag is set but live is NOT requested', async () => {
    process.env.CC_LINEAR_LIVE = '1'
    const result = await syncTaskToLinear(makeTask())
    expect(result.plan.mode).toBe('dry-run')
    expect(result.executed).toBe(false)
    expect(mockCreateIssue).not.toHaveBeenCalled()
  })
})

describe('syncTaskToLinear — live path (both gates required)', () => {
  it('creates an issue with the contract label ONLY when live AND env flag are set', async () => {
    process.env.CC_LINEAR_LIVE = '1'
    const result = await syncTaskToLinear(makeTask(), { live: true })

    expect(result.plan.mode).toBe('live')
    expect(result.executed).toBe(true)
    expect(result.issue).toEqual({ id: 'SYN-123', url: 'https://linear.app/x/SYN-123' })
    expect(mockCreateIssue).toHaveBeenCalledTimes(1)

    const arg = mockCreateIssue.mock.calls[0][0]
    expect(arg.teamKey).toBe('SYN')
    expect(arg.priority).toBe(2)
    expect(arg.labelNames).toEqual(['pi-dev:autonomous'])
    expect(arg.title).toBe('Ship the queue bridge')
  })
})
