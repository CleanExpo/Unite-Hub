import { describe, it, expect } from 'vitest'
import {
  latestByGate,
  summariseValidation,
  recordValidationRun,
  listValidationRuns,
  CC_VALIDATION_RUNS_TABLE,
  DEFAULT_REQUIRED_GATES,
  type ValidationRun,
} from '@/lib/command-centre/validation'
import type { SupabaseLike } from '@/lib/command-centre/tasks'

function run(gate: string, result: ValidationRun['result'], ran_at: string): ValidationRun {
  return { id: `${gate}-${ran_at}`, founder_id: 'f1', task_id: 't1', gate, command: null, result, evidence_path: null, ran_at }
}

function makeMock(result: { data: unknown; error: { message: string } | null }) {
  const calls: Array<{ table: string; op: 'insert' | 'select'; inserted?: unknown; eqs: Array<[string, unknown]>; order?: [string, { ascending: boolean }]; limit?: number }> = []
  const client = {
    from(table: string) {
      const record: (typeof calls)[number] = { table, op: 'select', eqs: [] }
      calls.push(record)
      const single = () => Promise.resolve(result)
      const limit = (n: number) => { record.limit = n; return Promise.resolve(result) }
      const order = (c: string, o: { ascending: boolean }) => { record.order = [c, o]; return { limit } }
      const eqChain = {
        eq(c: string, v: unknown) { record.eqs.push([c, v]); return eqChain },
        order, limit, single,
      }
      return {
        insert(values: unknown) { record.op = 'insert'; record.inserted = values; return { select: () => ({ single }) } },
        select() { return { eq(c: string, v: unknown) { record.eqs.push([c, v]); return eqChain } } },
      }
    },
  }
  return { client: client as unknown as SupabaseLike, calls }
}

describe('latestByGate', () => {
  it('keeps the newest run per gate', () => {
    const runs = [
      run('test', 'fail', '2026-01-01T00:00:00Z'),
      run('test', 'pass', '2026-01-02T00:00:00Z'), // newer wins
      run('lint', 'pass', '2026-01-01T00:00:00Z'),
    ]
    expect(latestByGate(runs)).toEqual({ test: 'pass', lint: 'pass' })
  })
})

describe('summariseValidation (no fake-green)', () => {
  it('canComplete only when every required gate latest-passes', () => {
    const runs = DEFAULT_REQUIRED_GATES.map((g) => run(g, 'pass', '2026-01-01T00:00:00Z'))
    const s = summariseValidation(runs)
    expect(s.canComplete).toBe(true)
    expect(s.passed.sort()).toEqual([...DEFAULT_REQUIRED_GATES].sort())
    expect(s.failed).toEqual([])
    expect(s.pending).toEqual([])
  })

  it('a failing required gate blocks completion', () => {
    const runs = [
      run('lint', 'pass', '2026-01-01T00:00:00Z'),
      run('type-check', 'pass', '2026-01-01T00:00:00Z'),
      run('test', 'fail', '2026-01-01T00:00:00Z'),
      run('build', 'pass', '2026-01-01T00:00:00Z'),
    ]
    const s = summariseValidation(runs)
    expect(s.canComplete).toBe(false)
    expect(s.failed).toContain('test')
  })

  it('a MISSING required gate (no run) blocks completion as pending', () => {
    const runs = [run('lint', 'pass', '2026-01-01T00:00:00Z'), run('type-check', 'pass', '2026-01-01T00:00:00Z')]
    const s = summariseValidation(runs)
    expect(s.canComplete).toBe(false)
    expect(s.pending.sort()).toEqual(['build', 'test'])
  })

  it('a SKIPPED required gate is not a pass', () => {
    const runs = DEFAULT_REQUIRED_GATES.map((g) => run(g, g === 'build' ? 'skip' : 'pass', '2026-01-01T00:00:00Z'))
    const s = summariseValidation(runs)
    expect(s.canComplete).toBe(false)
    expect(s.byGate.build).toBe('skip')
    expect(s.pending).toContain('build')
  })

  it('a later pass overrides an earlier fail for the same gate', () => {
    const runs = DEFAULT_REQUIRED_GATES.flatMap((g) => [
      run(g, 'fail', '2026-01-01T00:00:00Z'),
      run(g, 'pass', '2026-01-02T00:00:00Z'),
    ])
    expect(summariseValidation(runs).canComplete).toBe(true)
  })
})

describe('recordValidationRun', () => {
  it('inserts a founder-scoped run with defaults', async () => {
    const row = { id: 'v1', founder_id: 'f1', task_id: 't1', gate: 'test', command: 'pnpm test', result: 'pass', evidence_path: null, ran_at: 'now' }
    const { client, calls } = makeMock({ data: row, error: null })
    const result = await recordValidationRun({ founderId: 'f1', taskId: 't1', gate: 'test', command: 'pnpm test', result: 'pass' }, client)
    expect(result).toEqual(row)
    expect(calls[0].table).toBe('cc_validation_runs')
    expect(calls[0].op).toBe('insert')
    expect(calls[0].inserted).toMatchObject({ founder_id: 'f1', task_id: 't1', gate: 'test', command: 'pnpm test', result: 'pass' })
  })

  it('defaults result to skip', async () => {
    const { client, calls } = makeMock({ data: { id: 'v2' }, error: null })
    await recordValidationRun({ founderId: 'f1', taskId: 't1', gate: 'build' }, client)
    expect(calls[0].inserted).toMatchObject({ result: 'skip', command: null })
  })

  it('throws a named error on insert failure', async () => {
    const { client } = makeMock({ data: null, error: { message: 'boom' } })
    await expect(recordValidationRun({ founderId: 'f1', taskId: 't1', gate: 'lint' }, client)).rejects.toThrow(/recordValidationRun failed: boom/)
  })
})

describe('listValidationRuns', () => {
  it('queries scoped by founder + task, newest first', async () => {
    const rows = [run('test', 'pass', '2026-01-02T00:00:00Z')]
    const { client, calls } = makeMock({ data: rows, error: null })
    const result = await listValidationRuns({ founderId: 'f1', taskId: 't1' }, client)
    expect(result).toEqual(rows)
    expect(calls[0].eqs).toEqual([['founder_id', 'f1'], ['task_id', 't1']])
    expect(calls[0].order).toEqual(['ran_at', { ascending: false }])
  })
})

describe('CC_VALIDATION_RUNS_TABLE', () => {
  it('is the canonical table name', () => {
    expect(CC_VALIDATION_RUNS_TABLE).toBe('cc_validation_runs')
  })
})
