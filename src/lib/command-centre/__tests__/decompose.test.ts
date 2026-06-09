import { describe, it, expect } from 'vitest'
import {
  decomposeApprovedIdea,
  defaultDecomposition,
} from '@/lib/command-centre/decompose'
import { CC_TASKS_TABLE, type SupabaseLike } from '@/lib/command-centre/tasks'

// A mock Supabase client whose insert echoes the inserted row back with a
// deterministic generated id (so sequential dependency linkage is observable).
function makeMockClient() {
  const inserts: Record<string, unknown>[] = []
  let counter = 0

  const client = {
    from(table: string) {
      expect(table).toBe(CC_TASKS_TABLE)
      return {
        insert(values: unknown) {
          const row = values as Record<string, unknown>
          inserts.push(row)
          counter += 1
          const id = `sub-${counter}`
          return {
            select: () => ({
              single: () => Promise.resolve({ data: { ...row, id }, error: null }),
            }),
          }
        },
      }
    },
  } as unknown as SupabaseLike

  return { client, inserts }
}

describe('defaultDecomposition', () => {
  it('produces a deterministic, stable plan from an idea', () => {
    const a = defaultDecomposition('Build a referral widget')
    const b = defaultDecomposition('Build a referral widget')
    expect(a).toEqual(b) // deterministic
    expect(a.length).toBeGreaterThanOrEqual(3)
    expect(a.every((s) => typeof s.title === 'string' && s.title.length > 0)).toBe(true)
    // Risk escalates: early steps low, implementation/validation medium.
    expect(a[0].riskLevel).toBe('low')
    expect(a.some((s) => s.riskLevel === 'medium')).toBe(true)
  })
})

describe('decomposeApprovedIdea', () => {
  it('creates N proposed, board-review-origin sub-tasks linked sequentially', async () => {
    const { client, inserts } = makeMockClient()

    const tasks = await decomposeApprovedIdea(
      {
        founderId: 'f1',
        idea: 'Build a referral widget',
        parentTaskId: 'idea-1',
        decisionId: 'dec-1',
        projectKey: 'synthex',
        projectId: 'proj-1',
      },
      client,
    )

    // One sub-task per default step.
    const expectedSteps = defaultDecomposition('Build a referral widget')
    expect(tasks).toHaveLength(expectedSteps.length)
    expect(inserts).toHaveLength(expectedSteps.length)

    // Every sub-task is a non-executing proposal of board-review origin.
    for (const row of inserts) {
      expect(row.status).toBe('proposed')
      expect(row.origin).toBe('board-review')
      expect(row.project_key).toBe('synthex')
      expect(row.project_id).toBe('proj-1')
      const meta = row.metadata as Record<string, unknown>
      expect(meta.parent_task_id).toBe('idea-1')
      expect(meta.decision_id).toBe('dec-1')
      expect(meta.sequence_total).toBe(expectedSteps.length)
    }

    // Sequential linkage: first has no deps; each later one depends on the prior id.
    expect(inserts[0].dependencies).toEqual([])
    for (let i = 1; i < inserts.length; i += 1) {
      expect(inserts[i].dependencies).toEqual([`sub-${i}`])
      expect((inserts[i].metadata as Record<string, unknown>).sequence).toBe(i + 1)
    }
  })

  it('risk-tags sub-tasks and requires human approval for non-low risk', async () => {
    const { client, inserts } = makeMockClient()

    await decomposeApprovedIdea(
      {
        founderId: 'f1',
        idea: 'X',
        parentTaskId: 'idea-1',
        decisionId: 'dec-1',
        steps: [
          { title: 'safe step', riskLevel: 'low' },
          { title: 'risky step', riskLevel: 'high' },
        ],
      },
      client,
    )

    expect(inserts[0].risk_level).toBe('low')
    expect(inserts[0].human_approval_required).toBe(false)
    expect(inserts[1].risk_level).toBe('high')
    expect(inserts[1].human_approval_required).toBe(true)
  })

  it('uses an injected step plan verbatim (no model needed)', async () => {
    const { client, inserts } = makeMockClient()

    const tasks = await decomposeApprovedIdea(
      {
        founderId: 'f1',
        idea: 'ignored when steps provided',
        parentTaskId: 'idea-1',
        decisionId: 'dec-1',
        steps: [
          { title: 'one', objective: 'do one' },
          { title: 'two', objective: 'do two' },
        ],
      },
      client,
    )

    expect(tasks).toHaveLength(2)
    expect(inserts[0].title).toBe('one')
    expect(inserts[0].objective).toBe('do one')
    expect(inserts[1].title).toBe('two')
    // Default risk for an untagged step is low.
    expect(inserts[1].risk_level).toBe('low')
  })
})
