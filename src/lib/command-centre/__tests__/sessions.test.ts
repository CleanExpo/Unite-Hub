import { describe, it, expect } from 'vitest'
import {
  actionToStatus,
  canApply,
  isTerminal,
  startSession,
  listSessionsForTask,
  getSessionById,
  applySessionAction,
  CC_EXECUTION_SESSIONS_TABLE,
  type ExecutionSession,
} from '@/lib/command-centre/sessions'
import type { SupabaseLike } from '@/lib/command-centre/tasks'

function session(status: ExecutionSession['status']): ExecutionSession {
  return { id: 's1', founder_id: 'f1', task_id: 't1', surface: 'local', status, logs_ref: null, started_at: 'now', ended_at: null }
}

function makeMock(result: { data: unknown; error: { message: string } | null }) {
  const calls: Array<{ table: string; op: 'insert' | 'select' | 'update'; inserted?: unknown; eqs: Array<[string, unknown]>; order?: [string, { ascending: boolean }]; limit?: number }> = []
  const client = {
    from(table: string) {
      const record: (typeof calls)[number] = { table, op: 'select', eqs: [] }
      calls.push(record)
      const single = () => Promise.resolve(result)
      const limit = (n: number) => { record.limit = n; return Promise.resolve(result) }
      const order = (c: string, o: { ascending: boolean }) => { record.order = [c, o]; return { limit } }
      const eqChain = { eq(c: string, v: unknown) { record.eqs.push([c, v]); return eqChain }, order, limit, single }
      return {
        insert(values: unknown) { record.op = 'insert'; record.inserted = values; return { select: () => ({ single }) } },
        update(values: unknown) {
          record.op = 'update'; record.inserted = values
          return { eq(c1: string, v1: unknown) { record.eqs.push([c1, v1]); return { eq(c2: string, v2: unknown) { record.eqs.push([c2, v2]); return { select: () => ({ single }) } } } } }
        },
        select() { return { eq(c: string, v: unknown) { record.eqs.push([c, v]); return eqChain } } },
      }
    },
  }
  return { client: client as unknown as SupabaseLike, calls }
}

describe('session state machine', () => {
  it('actionToStatus maps correctly', () => {
    expect(actionToStatus('pause')).toBe('paused')
    expect(actionToStatus('resume')).toBe('running')
    expect(actionToStatus('complete')).toBe('done')
    expect(actionToStatus('fail')).toBe('failed')
  })

  it('canApply enforces valid transitions', () => {
    expect(canApply('pause', 'running')).toBe(true)
    expect(canApply('pause', 'paused')).toBe(false)
    expect(canApply('resume', 'paused')).toBe(true)
    expect(canApply('resume', 'running')).toBe(false)
    expect(canApply('complete', 'running')).toBe(true)
    expect(canApply('complete', 'paused')).toBe(true)
    expect(canApply('fail', 'paused')).toBe(true)
  })

  it('terminal states accept no transitions', () => {
    for (const action of ['pause', 'resume', 'complete', 'fail'] as const) {
      expect(canApply(action, 'done')).toBe(false)
      expect(canApply(action, 'failed')).toBe(false)
    }
    expect(isTerminal('done')).toBe(true)
    expect(isTerminal('failed')).toBe(true)
    expect(isTerminal('running')).toBe(false)
  })
})

describe('startSession', () => {
  it('inserts a running session with surface default local', async () => {
    const row = session('running')
    const { client, calls } = makeMock({ data: row, error: null })
    const result = await startSession({ founderId: 'f1', taskId: 't1' }, client)
    expect(result).toEqual(row)
    expect(calls[0].table).toBe('cc_execution_sessions')
    expect(calls[0].inserted).toMatchObject({ founder_id: 'f1', task_id: 't1', surface: 'local', status: 'running' })
  })
})

describe('listSessionsForTask', () => {
  it('queries scoped by founder + task, newest first', async () => {
    const { client, calls } = makeMock({ data: [session('running')], error: null })
    await listSessionsForTask({ founderId: 'f1', taskId: 't1' }, client)
    expect(calls[0].eqs).toEqual([['founder_id', 'f1'], ['task_id', 't1']])
    expect(calls[0].order).toEqual(['started_at', { ascending: false }])
  })
})

describe('getSessionById', () => {
  it('returns null when no row matches', async () => {
    const { client } = makeMock({ data: null, error: { message: 'No rows' } })
    expect(await getSessionById({ founderId: 'f1', sessionId: 'missing' }, client)).toBeNull()
  })
})

describe('applySessionAction', () => {
  it('not_found when the session does not exist', async () => {
    const { client } = makeMock({ data: null, error: { message: 'No rows' } })
    const out = await applySessionAction({ founderId: 'f1', sessionId: 'x', action: 'pause' }, client)
    expect(out).toEqual({ ok: false, reason: 'not_found' })
  })

  it('invalid_transition (pause a paused session) and does NOT update', async () => {
    const { client, calls } = makeMock({ data: session('paused'), error: null })
    const out = await applySessionAction({ founderId: 'f1', sessionId: 's1', action: 'pause' }, client)
    expect(out).toEqual({ ok: false, reason: 'invalid_transition', from: 'paused' })
    expect(calls.some((c) => c.op === 'update')).toBe(false)
  })

  it('pause a running session updates status to paused', async () => {
    const { client, calls } = makeMock({ data: session('running'), error: null })
    const out = await applySessionAction({ founderId: 'f1', sessionId: 's1', action: 'pause' }, client)
    expect(out.ok).toBe(true)
    const update = calls.find((c) => c.op === 'update')
    expect(update?.inserted).toMatchObject({ status: 'paused' })
  })

  it('complete sets ended_at', async () => {
    const { client, calls } = makeMock({ data: session('running'), error: null })
    await applySessionAction({ founderId: 'f1', sessionId: 's1', action: 'complete' }, client)
    const update = calls.find((c) => c.op === 'update')
    expect(update?.inserted).toMatchObject({ status: 'done' })
    expect((update?.inserted as Record<string, unknown>).ended_at).toBeTruthy()
  })
})

describe('CC_EXECUTION_SESSIONS_TABLE', () => {
  it('is the canonical table name', () => {
    expect(CC_EXECUTION_SESSIONS_TABLE).toBe('cc_execution_sessions')
  })
})
