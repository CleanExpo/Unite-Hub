import { describe, it, expect, vi } from 'vitest'
import {
  createTask,
  listTasks,
  appendTaskEvent,
  addEvidenceRecord,
  CC_TASKS_TABLE,
  CC_TASK_EVENTS_TABLE,
  CC_EVIDENCE_RECORDS_TABLE,
  type SupabaseLike,
} from '@/lib/command-centre/tasks'

// A small recording mock of the Supabase client surface used by the accessors.
// It captures the table name, the inserted row, and the chained query calls,
// and returns whatever `result` the test seeds.
function makeMockClient(result: { data: unknown; error: { message: string } | null }) {
  const calls: {
    table: string
    op: 'insert' | 'select'
    inserted?: unknown
    eqs: Array<[string, unknown]>
    order?: [string, { ascending: boolean }]
    limit?: number
  }[] = []

  const client = {
    from(table: string) {
      const record: (typeof calls)[number] = { table, op: 'select', eqs: [] }
      calls.push(record)

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
      }

      return {
        insert(values: unknown) {
          record.op = 'insert'
          record.inserted = values
          return { select: () => ({ single }) }
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
  } as unknown as SupabaseLike

  return { client, calls }
}

describe('command-centre tasks accessors', () => {
  it('createTask inserts into cc_tasks with mapped defaults and returns the row', async () => {
    const returned = { id: 't1', founder_id: 'f1', title: 'Build it', status: 'proposed' }
    const { client, calls } = makeMockClient({ data: returned, error: null })

    const task = await createTask(
      { founderId: 'f1', title: 'Build it', externalRef: 'run_task-1' },
      client,
    )

    expect(task).toEqual(returned)
    expect(calls).toHaveLength(1)
    expect(calls[0].table).toBe(CC_TASKS_TABLE)
    expect(calls[0].op).toBe('insert')
    const inserted = calls[0].inserted as Record<string, unknown>
    expect(inserted.founder_id).toBe('f1')
    expect(inserted.title).toBe('Build it')
    expect(inserted.external_ref).toBe('run_task-1')
    // Defaults mirror the SQL column defaults.
    expect(inserted.status).toBe('proposed')
    expect(inserted.priority).toBe('P2')
    expect(inserted.risk_level).toBe('low')
    expect(inserted.execution_mode).toBe('advisory')
    expect(inserted.origin).toBe('idea')
    expect(inserted.human_approval_required).toBe(true)
    expect(inserted.dependencies).toEqual([])
  })

  it('createTask throws a typed error when the client reports an error', async () => {
    const { client } = makeMockClient({ data: null, error: { message: 'rls denied' } })
    await expect(createTask({ founderId: 'f1', title: 'x' }, client)).rejects.toThrow(/createTask failed: rls denied/)
  })

  it('listTasks selects cc_tasks scoped to the founder, with filters + ordering', async () => {
    const rows = [{ id: 't1' }, { id: 't2' }]
    const { client, calls } = makeMockClient({ data: rows, error: null })

    const result = await listTasks({ founderId: 'f1', status: 'queued', projectKey: 'unite-hub', limit: 10 }, client)

    expect(result).toEqual(rows)
    expect(calls[0].table).toBe(CC_TASKS_TABLE)
    expect(calls[0].op).toBe('select')
    expect(calls[0].eqs).toContainEqual(['founder_id', 'f1'])
    expect(calls[0].eqs).toContainEqual(['status', 'queued'])
    expect(calls[0].eqs).toContainEqual(['project_key', 'unite-hub'])
    expect(calls[0].order).toEqual(['updated_at', { ascending: false }])
    expect(calls[0].limit).toBe(10)
  })

  it('listTasks caps the limit at 100', async () => {
    const { client, calls } = makeMockClient({ data: [], error: null })
    await listTasks({ founderId: 'f1', limit: 9999 }, client)
    expect(calls[0].limit).toBe(100)
  })

  it('appendTaskEvent inserts into the append-only cc_task_events table', async () => {
    const returned = { id: 'e1', task_id: 't1', type: 'status_changed' }
    const { client, calls } = makeMockClient({ data: returned, error: null })

    const event = await appendTaskEvent(
      { founderId: 'f1', taskId: 't1', type: 'status_changed', actor: 'Margot', payload: { from: 'proposed', to: 'queued' } },
      client,
    )

    expect(event).toEqual(returned)
    expect(calls[0].table).toBe(CC_TASK_EVENTS_TABLE)
    expect(calls[0].op).toBe('insert')
    const inserted = calls[0].inserted as Record<string, unknown>
    expect(inserted.founder_id).toBe('f1')
    expect(inserted.task_id).toBe('t1')
    expect(inserted.type).toBe('status_changed')
    expect(inserted.actor).toBe('Margot')
    expect(inserted.payload).toEqual({ from: 'proposed', to: 'queued' })
  })

  it('appendTaskEvent defaults actor to system and payload to {}', async () => {
    const { client, calls } = makeMockClient({ data: { id: 'e1' }, error: null })
    await appendTaskEvent({ founderId: 'f1', taskId: 't1', type: 'created' }, client)
    const inserted = calls[0].inserted as Record<string, unknown>
    expect(inserted.actor).toBe('system')
    expect(inserted.payload).toEqual({})
  })

  it('addEvidenceRecord inserts into cc_evidence_records linked to the task', async () => {
    const returned = { id: 'ev1', task_id: 't1', kind: 'validation' }
    const { client, calls } = makeMockClient({ data: returned, error: null })

    const rec = await addEvidenceRecord(
      { founderId: 'f1', taskId: 't1', kind: 'validation', wikiPath: 'raw/command-centre/_platform/CC-03.md', confidence: 'high' },
      client,
    )

    expect(rec).toEqual(returned)
    expect(calls[0].table).toBe(CC_EVIDENCE_RECORDS_TABLE)
    expect(calls[0].op).toBe('insert')
    const inserted = calls[0].inserted as Record<string, unknown>
    expect(inserted.task_id).toBe('t1')
    expect(inserted.kind).toBe('validation')
    expect(inserted.wiki_path).toBe('raw/command-centre/_platform/CC-03.md')
    expect(inserted.confidence).toBe('high')
    expect(inserted.sources).toEqual([])
  })

  it('does not touch the network at import time (lazy client)', async () => {
    // Importing the module above already happened; if it created a client at
    // import time the suite would have needed cookies(). Reaching here is proof.
    expect(typeof createTask).toBe('function')
    expect(vi.isMockFunction(createTask)).toBe(false)
  })
})
