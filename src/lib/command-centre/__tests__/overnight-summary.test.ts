import { describe, it, expect } from 'vitest'
import { buildOvernightDigest, digestToMarkdown } from '@/lib/command-centre/overnight-summary'
import type { CommandCentreTask, TaskStatus } from '@/lib/command-centre/tasks'
import type { ExecutionSession, SessionStatus } from '@/lib/command-centre/sessions'

function task(status: TaskStatus): CommandCentreTask {
  return {
    id: 't', founder_id: 'f', external_ref: null, queue_id: null, project_id: null, project_key: null,
    title: 'x', objective: '', priority: 'P2', status, agent_owner: null, risk_level: 'low',
    execution_mode: 'advisory', origin: 'idea', dependencies: [], human_approval_required: true,
    evidence_path: null, validation_required: [], linear_id: null, preview_url: null, metadata: {},
    created_at: 'now', updated_at: 'now',
  }
}
function sess(status: SessionStatus): ExecutionSession {
  return { id: 's', founder_id: 'f', task_id: 't', surface: 'local', status, logs_ref: null, started_at: 'now', ended_at: null }
}

const AT = '2026-06-09T19:30:00Z'

describe('buildOvernightDigest', () => {
  it('counts tasks by status and computes needsDecision', () => {
    const tasks = [task('proposed'), task('awaiting_approval'), task('queued'), task('queued'), task('done')]
    const d = buildOvernightDigest(tasks, [], AT)
    expect(d.tasks.total).toBe(5)
    expect(d.tasks.byStatus.queued).toBe(2)
    expect(d.tasks.needsDecision).toBe(2) // proposed + awaiting_approval
    expect(d.tasks.done).toBe(1)
    expect(d.generatedAt).toBe(AT)
  })

  it('summarises sessions by status', () => {
    const d = buildOvernightDigest([], [sess('running'), sess('failed'), sess('failed'), sess('done')], AT)
    expect(d.sessions.total).toBe(4)
    expect(d.sessions.byStatus.failed).toBe(2)
    expect(d.sessions.byStatus.running).toBe(1)
  })

  it('surfaces attention items (decisions, blocked, failed sessions)', () => {
    const tasks = [task('proposed'), task('blocked')]
    const d = buildOvernightDigest(tasks, [sess('failed')], AT)
    expect(d.attention).toContain('1 task awaiting your decision')
    expect(d.attention).toContain('1 task blocked')
    expect(d.attention).toContain('1 session failed overnight')
  })

  it('clear board ⇒ no attention items', () => {
    const d = buildOvernightDigest([task('queued'), task('done')], [sess('done')], AT)
    expect(d.attention).toEqual([])
  })

  it('empty queue headline', () => {
    const d = buildOvernightDigest([], [], AT)
    expect(d.headline).toMatch(/No tasks/)
  })
})

describe('digestToMarkdown', () => {
  it('includes the headline and attention items', () => {
    const d = buildOvernightDigest([task('proposed')], [], AT)
    const md = digestToMarkdown(d)
    expect(md).toContain('## Morning digest')
    expect(md).toContain('Needs your attention')
    expect(md).toContain('1 task awaiting your decision')
  })

  it('says board is clear when nothing needs attention', () => {
    const d = buildOvernightDigest([task('done')], [], AT)
    expect(digestToMarkdown(d)).toContain('the board is clear')
  })
})
