// src/lib/command-centre/approvals.test.ts
//
// Unit tests for recordApproval. Supabase is mocked via the injected `client`
// argument — no network, no real DB. Each decision must:
//   - write a cc_approvals row (mapped fields)
//   - append a cc_task_events audit event
//   - transition the task status (approve→queued, reject→blocked, defer→proposed)

import { describe, it, expect, vi } from 'vitest'
import {
  recordApproval,
  statusForDecision,
  CC_APPROVALS_TABLE,
  type ApprovalDecision,
} from './approvals'
import {
  CC_TASK_EVENTS_TABLE,
  CC_TASKS_TABLE,
  type SupabaseLike,
} from './tasks'

const FOUNDER = '22222222-2222-2222-2222-222222222222'
const TASK = '33333333-3333-3333-3333-333333333333'

interface Recorder {
  approvals: Record<string, unknown>[]
  events: Record<string, unknown>[]
  updates: { values: Record<string, unknown>; eqs: [string, unknown][] }[]
}

/**
 * Build a mock Supabase client that records every insert (cc_approvals,
 * cc_task_events) and every update (cc_tasks status transition), dispatching by
 * table name.
 */
function makeClient() {
  const rec: Recorder = { approvals: [], events: [], updates: [] }

  const client = {
    from(table: string) {
      return {
        insert(values: Record<string, unknown>) {
          if (table === CC_APPROVALS_TABLE) {
            rec.approvals.push(values)
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({ data: { id: 'approval-1', ...values }, error: null }),
              }),
            }
          }
          if (table === CC_TASK_EVENTS_TABLE) {
            rec.events.push(values)
            return {
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'event-1', ...values }, error: null }),
              }),
            }
          }
          throw new Error(`unexpected insert into ${table}`)
        },
        update(values: Record<string, unknown>) {
          const eqs: [string, unknown][] = []
          const chain = {
            eq(col: string, val: unknown) {
              eqs.push([col, val])
              return {
                eq(col2: string, val2: unknown) {
                  eqs.push([col2, val2])
                  return {
                    select: () => ({
                      single: () => {
                        if (table === CC_TASKS_TABLE) {
                          rec.updates.push({ values, eqs })
                          return Promise.resolve({
                            data: { id: TASK, founder_id: FOUNDER, ...values },
                            error: null,
                          })
                        }
                        throw new Error(`unexpected update on ${table}`)
                      },
                    }),
                  }
                },
              }
            },
          }
          return chain as unknown as ReturnType<ReturnType<SupabaseLike['from']>['update']>
        },
      }
    },
  } as unknown as SupabaseLike

  return { client, rec }
}

const CASES: { decision: ApprovalDecision; status: string }[] = [
  { decision: 'approve', status: 'queued' },
  { decision: 'reject', status: 'blocked' },
  { decision: 'defer', status: 'proposed' },
]

describe('recordApproval', () => {
  for (const { decision, status } of CASES) {
    it(`${decision} → writes cc_approvals + event + transitions task to ${status}`, async () => {
      const { client, rec } = makeClient()

      const result = await recordApproval(
        { founderId: FOUNDER, taskId: TASK, decision, note: 'a note' },
        client,
      )

      // 1. cc_approvals row
      expect(rec.approvals).toHaveLength(1)
      expect(rec.approvals[0]).toMatchObject({
        founder_id: FOUNDER,
        task_id: TASK,
        decision,
        note: 'a note',
      })

      // 2. cc_task_events audit event
      expect(rec.events).toHaveLength(1)
      expect(rec.events[0]).toMatchObject({
        founder_id: FOUNDER,
        task_id: TASK,
      })
      expect((rec.events[0].payload as Record<string, unknown>).decision).toBe(decision)
      expect((rec.events[0].payload as Record<string, unknown>).status).toBe(status)

      // 3. task status transition (founder-scoped)
      expect(rec.updates).toHaveLength(1)
      expect(rec.updates[0].values).toEqual({ status })
      expect(rec.updates[0].eqs).toEqual([
        ['founder_id', FOUNDER],
        ['id', TASK],
      ])

      // returned shape
      expect(result.approval.id).toBe('approval-1')
      expect(result.task?.status).toBe(status)
    })
  }

  it('defaults the approver to "founder" and a null note', async () => {
    const { client, rec } = makeClient()
    await recordApproval({ founderId: FOUNDER, taskId: TASK, decision: 'approve' }, client)
    expect(rec.approvals[0].approver).toBe('founder')
    expect(rec.approvals[0].note).toBeNull()
  })

  it('throws when the cc_approvals insert errors', async () => {
    const client = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'denied' } }),
          }),
        }),
      }),
    } as unknown as SupabaseLike
    await expect(
      recordApproval({ founderId: FOUNDER, taskId: TASK, decision: 'approve' }, client),
    ).rejects.toThrow(/recordApproval failed: denied/)
  })
})

describe('statusForDecision', () => {
  it('maps each decision to its target status', () => {
    expect(statusForDecision('approve')).toBe('queued')
    expect(statusForDecision('reject')).toBe('blocked')
    expect(statusForDecision('defer')).toBe('proposed')
    expect(statusForDecision('edit')).toBe('awaiting_approval')
  })
})
