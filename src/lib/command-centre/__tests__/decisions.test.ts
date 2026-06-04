import { describe, it, expect } from 'vitest'
import {
  createDecision,
  listDecisions,
  CC_DECISIONS_TABLE,
} from '@/lib/command-centre/decisions'
import type { SupabaseLike } from '@/lib/command-centre/tasks'

// A small recording mock of the Supabase client surface used by the accessors.
// Mirrors the helper in tasks.test.ts.
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

describe('command-centre decisions accessors', () => {
  it('createDecision inserts into cc_decisions with mapped defaults and returns the row', async () => {
    const returned = { id: 'd1', founder_id: 'f1', subject: 'Ship X', verdict: 'APPROVED' }
    const { client, calls } = makeMockClient({ data: returned, error: null })

    const decision = await createDecision(
      {
        founderId: 'f1',
        subject: 'Ship X',
        verdict: 'APPROVED',
        rationale: 'Strong upside, low risk',
        personas: [{ persona: 'revenue', stance: 'APPROVED', comment: 'pays back fast' }],
        taskId: 't1',
        wikiPath: 'raw/command-centre/x/d1-decision.md',
      },
      client,
    )

    expect(decision).toEqual(returned)
    expect(calls).toHaveLength(1)
    expect(calls[0].table).toBe(CC_DECISIONS_TABLE)
    expect(calls[0].op).toBe('insert')
    const inserted = calls[0].inserted as Record<string, unknown>
    expect(inserted.founder_id).toBe('f1')
    expect(inserted.subject).toBe('Ship X')
    expect(inserted.verdict).toBe('APPROVED')
    expect(inserted.rationale).toBe('Strong upside, low risk')
    expect(inserted.task_id).toBe('t1')
    expect(inserted.wiki_path).toBe('raw/command-centre/x/d1-decision.md')
    expect(Array.isArray(inserted.personas)).toBe(true)
  })

  it('createDecision applies defaults for optional fields', async () => {
    const { client, calls } = makeMockClient({ data: { id: 'd2' }, error: null })
    await createDecision({ founderId: 'f1', subject: 'Y', verdict: 'HOLD' }, client)
    const inserted = calls[0].inserted as Record<string, unknown>
    expect(inserted.task_id).toBeNull()
    expect(inserted.rationale).toBe('')
    expect(inserted.personas).toEqual({})
    expect(inserted.wiki_path).toBeNull()
  })

  it('createDecision throws a typed error when the client reports an error', async () => {
    const { client } = makeMockClient({ data: null, error: { message: 'rls denied' } })
    await expect(
      createDecision({ founderId: 'f1', subject: 'z', verdict: 'REJECTED' }, client),
    ).rejects.toThrow(/createDecision failed: rls denied/)
  })

  it('listDecisions selects cc_decisions scoped to the founder, with filters + ordering', async () => {
    const rows = [{ id: 'd1' }, { id: 'd2' }]
    const { client, calls } = makeMockClient({ data: rows, error: null })

    const result = await listDecisions(
      { founderId: 'f1', taskId: 't1', verdict: 'APPROVED', limit: 10 },
      client,
    )

    expect(result).toEqual(rows)
    expect(calls[0].table).toBe(CC_DECISIONS_TABLE)
    expect(calls[0].op).toBe('select')
    expect(calls[0].eqs).toContainEqual(['founder_id', 'f1'])
    expect(calls[0].eqs).toContainEqual(['task_id', 't1'])
    expect(calls[0].eqs).toContainEqual(['verdict', 'APPROVED'])
    expect(calls[0].order).toEqual(['at', { ascending: false }])
    expect(calls[0].limit).toBe(10)
  })

  it('listDecisions caps the limit at 100', async () => {
    const { client, calls } = makeMockClient({ data: [], error: null })
    await listDecisions({ founderId: 'f1', limit: 9999 }, client)
    expect(calls[0].limit).toBe(100)
  })
})
