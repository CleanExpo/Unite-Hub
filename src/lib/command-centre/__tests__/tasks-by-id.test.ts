import { describe, it, expect } from 'vitest'
import { getTaskById, updateTaskStatus, CC_TASKS_TABLE, type SupabaseLike } from '@/lib/command-centre/tasks'

function makeMock(result: { data: unknown; error: { message: string } | null }) {
  const calls: Array<{ table: string; op: 'select' | 'update'; inserted?: unknown; eqs: Array<[string, unknown]> }> = []

  const client = {
    from(table: string) {
      const record: (typeof calls)[number] = { table, op: 'select', eqs: [] }
      calls.push(record)
      const single = () => Promise.resolve(result)
      const eqChain = {
        eq(column: string, value: unknown) {
          record.eqs.push([column, value])
          return eqChain
        },
        single,
        order: () => ({ limit: () => Promise.resolve(result) }),
        limit: () => Promise.resolve(result),
      }
      return {
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

describe('getTaskById', () => {
  it('selects a founder-scoped task by id and returns it', async () => {
    const row = { id: 't1', founder_id: 'f1', title: 'X', status: 'proposed' }
    const { client, calls } = makeMock({ data: row, error: null })

    const result = await getTaskById({ founderId: 'f1', taskId: 't1' }, client)

    expect(result).toEqual(row)
    expect(calls[0].table).toBe(CC_TASKS_TABLE)
    expect(calls[0].eqs).toEqual([['founder_id', 'f1'], ['id', 't1']])
  })

  it('returns null when no row matches (PGRST116)', async () => {
    const { client } = makeMock({ data: null, error: { message: 'No rows' } })
    const result = await getTaskById({ founderId: 'f1', taskId: 'missing' }, client)
    expect(result).toBeNull()
  })
})

describe('updateTaskStatus', () => {
  it('updates status by (founder_id, id) and returns the row', async () => {
    const row = { id: 't1', founder_id: 'f1', status: 'queued' }
    const { client, calls } = makeMock({ data: row, error: null })

    const result = await updateTaskStatus({ founderId: 'f1', taskId: 't1', status: 'queued' }, client)

    expect(result).toEqual(row)
    expect(calls[0].op).toBe('update')
    expect(calls[0].inserted).toEqual({ status: 'queued' })
    expect(calls[0].eqs).toEqual([['founder_id', 'f1'], ['id', 't1']])
  })

  it('returns null when no row matches', async () => {
    const { client } = makeMock({ data: null, error: { message: 'No rows' } })
    const result = await updateTaskStatus({ founderId: 'f1', taskId: 'missing', status: 'failed' }, client)
    expect(result).toBeNull()
  })
})
