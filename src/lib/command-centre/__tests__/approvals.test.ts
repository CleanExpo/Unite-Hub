import { describe, it, expect } from 'vitest'
import {
  decisionToStatus,
  recordApproval,
  listApprovalsForTask,
  applyApproval,
  CC_APPROVALS_TABLE,
  type ApprovalDecision,
} from '@/lib/command-centre/approvals'
import { CC_TASKS_TABLE, CC_TASK_EVENTS_TABLE, type SupabaseLike } from '@/lib/command-centre/tasks'

// Recording mock supporting insert/select/update chains, with per-table results.
function makeMock(resultsByTable: Record<string, { data: unknown; error: { message: string } | null }>) {
  const calls: Array<{
    table: string
    op: 'insert' | 'select' | 'update'
    inserted?: unknown
    eqs: Array<[string, unknown]>
    order?: [string, { ascending: boolean }]
    limit?: number
  }> = []

  const resFor = (table: string) => resultsByTable[table] ?? { data: {}, error: null }

  const client = {
    from(table: string) {
      const record: (typeof calls)[number] = { table, op: 'select', eqs: [] }
      calls.push(record)
      const result = resFor(table)

      const single = () => Promise.resolve(result)
      const limit = (n: number) => {
        record.limit = n
        return Promise.resolve(result)
      }
      const order = (column: string, opts: { ascending: boolean }) => {
        record.order = [column, opts]
        return { limit }
      }
      const eqChain = {
        eq(column: string, value: unknown) {
          record.eqs.push([column, value])
          return eqChain
        },
        order,
        limit,
        single,
      }

      return {
        insert(values: unknown) {
          record.op = 'insert'
          record.inserted = values
          return { select: () => ({ single }) }
        },
        update(values: unknown) {
          record.op = 'update'
          record.inserted = values
          return {
            eq(c1: string, v1: unknown) {
              record.eqs.push([c1, v1])
              return {
                eq(c2: string, v2: unknown) {
                  record.eqs.push([c2, v2])
                  return { select: () => ({ single }) }
                },
              }
            },
          }
        },
        select() {
          return {
            eq(column: string, value: unknown) {
              record.eqs.push([column, value])
              return eqChain
            },
          }
        },
      }
    },
  }

  return { client: client as unknown as SupabaseLike, calls }
}

describe('decisionToStatus', () => {
  it('maps each decision to the right task status', () => {
    expect(decisionToStatus('approve')).toBe('queued')
    expect(decisionToStatus('reject')).toBe('failed')
    expect(decisionToStatus('defer')).toBe('blocked')
    expect(decisionToStatus('edit')).toBeNull()
  })
})

describe('recordApproval', () => {
  it('inserts a founder-scoped row into cc_approvals with defaults', async () => {
    const approvalRow = { id: 'a1', founder_id: 'f1', task_id: 't1', decision: 'approve', approver: 'founder', note: null, at: 'now' }
    const { client, calls } = makeMock({ [CC_APPROVALS_TABLE]: { data: approvalRow, error: null } })

    const result = await recordApproval({ founderId: 'f1', taskId: 't1', decision: 'approve' }, client)

    expect(result).toEqual(approvalRow)
    expect(calls[0].table).toBe('cc_approvals')
    expect(calls[0].op).toBe('insert')
    expect(calls[0].inserted).toMatchObject({ founder_id: 'f1', task_id: 't1', decision: 'approve', approver: 'founder', note: null })
  })

  it('throws a named error when the insert fails', async () => {
    const { client } = makeMock({ [CC_APPROVALS_TABLE]: { data: null, error: { message: 'boom' } } })
    await expect(recordApproval({ founderId: 'f1', taskId: 't1', decision: 'reject' }, client)).rejects.toThrow(/recordApproval failed: boom/)
  })
})

describe('listApprovalsForTask', () => {
  it('queries cc_approvals scoped by founder + task, newest first', async () => {
    const rows = [{ id: 'a2' }, { id: 'a1' }]
    const { client, calls } = makeMock({ [CC_APPROVALS_TABLE]: { data: rows, error: null } })

    const result = await listApprovalsForTask({ founderId: 'f1', taskId: 't1' }, client)

    expect(result).toEqual(rows)
    expect(calls[0].eqs).toEqual([['founder_id', 'f1'], ['task_id', 't1']])
    expect(calls[0].order).toEqual(['at', { ascending: false }])
    expect(calls[0].limit).toBe(50)
  })
})

describe('applyApproval', () => {
  it('approve → records approval, transitions task to queued, appends event', async () => {
    const approvalRow = { id: 'a1', founder_id: 'f1', task_id: 't1', decision: 'approve', approver: 'founder', note: null, at: 'now' }
    const taskRow = { id: 't1', founder_id: 'f1', status: 'queued' }
    const { client, calls } = makeMock({
      [CC_APPROVALS_TABLE]: { data: approvalRow, error: null },
      [CC_TASKS_TABLE]: { data: taskRow, error: null },
      [CC_TASK_EVENTS_TABLE]: { data: { id: 'e1' }, error: null },
    })

    const { approval, task } = await applyApproval({ founderId: 'f1', taskId: 't1', decision: 'approve' }, client)

    expect(approval).toEqual(approvalRow)
    expect(task).toEqual(taskRow)
    // cc_tasks was updated to 'queued'
    const taskUpdate = calls.find((c) => c.table === 'cc_tasks' && c.op === 'update')
    expect(taskUpdate?.inserted).toEqual({ status: 'queued' })
    // an immutable 'approved' event was appended
    const event = calls.find((c) => c.table === 'cc_task_events' && c.op === 'insert')
    expect(event?.inserted).toMatchObject({ type: 'approved', founder_id: 'f1', task_id: 't1' })
  })

  it('edit → records approval + event but does NOT transition the task', async () => {
    const { client, calls } = makeMock({
      [CC_APPROVALS_TABLE]: { data: { id: 'a1', decision: 'edit' }, error: null },
      [CC_TASK_EVENTS_TABLE]: { data: { id: 'e1' }, error: null },
    })

    const { task } = await applyApproval({ founderId: 'f1', taskId: 't1', decision: 'edit' as ApprovalDecision }, client)

    expect(task).toBeNull()
    expect(calls.some((c) => c.table === 'cc_tasks' && c.op === 'update')).toBe(false)
    expect(calls.some((c) => c.table === 'cc_task_events' && c.op === 'insert')).toBe(true)
  })
})

describe('CC_APPROVALS_TABLE', () => {
  it('is the canonical table name', () => {
    expect(CC_APPROVALS_TABLE).toBe('cc_approvals')
  })
})
