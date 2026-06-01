import { describe, expect, it, vi } from 'vitest'
import { POST, __test__ } from '../route'

describe('Hermes Kanban route parsing', () => {
  it('parses assigned Hermes task rows', () => {
    const task = __test__.parseTaskLine('✓ t_cae06971  done      default               RA continuation: reconcile Linear + dirty repo lanes')

    expect(task).toEqual({
      id: 't_cae06971',
      status: 'done',
      assignee: 'default',
      title: 'RA continuation: reconcile Linear + dirty repo lanes',
    })
  })

  it('parses unassigned ready rows', () => {
    const task = __test__.parseTaskLine('▶ t_01f3c9ea  ready     (unassigned)         [pi-ceo]  [CFO@restoreassist] debate — ship today')

    expect(task).toEqual({
      id: 't_01f3c9ea',
      status: 'ready',
      assignee: null,
      title: '[pi-ceo]  [CFO@restoreassist] debate — ship today',
    })
  })

  it('summarises tasks by status for the Founder cockpit', () => {
    expect(__test__.summarise([
      { id: 't_1', status: 'ready', assignee: null, title: 'one' },
      { id: 't_2', status: 'ready', assignee: 'default', title: 'two' },
      { id: 't_3', status: 'done', assignee: 'default', title: 'three' },
    ])).toEqual({ ready: 2, done: 1 })
  })

  it('maps safe Founder OS actions to Hermes Kanban CLI commands', () => {
    expect(__test__.buildHermesActionCommand({ action: 'create', title: 'Dual-board follow-up', body: 'Wire Linear later', assignee: 'default' })).toEqual([
      'kanban',
      'create',
      'Dual-board follow-up',
      '--body',
      'Wire Linear later',
      '--assignee',
      'default',
      '--created-by',
      'unite-hub',
      '--json',
    ])

    expect(__test__.buildHermesActionCommand({ action: 'complete', taskId: 't_abc123', note: 'Verified in Unite-Hub' })).toEqual([
      'kanban',
      'complete',
      't_abc123',
      '--result',
      'Verified in Unite-Hub',
    ])
  })

  it('rejects unsafe Hermes Kanban action payloads before shell execution', () => {
    expect(() => __test__.buildHermesActionCommand({ action: 'create', title: '' })).toThrow('title is required')
    expect(() => __test__.buildHermesActionCommand({ action: 'complete', taskId: 'not-a-task' })).toThrow('valid taskId is required')
    expect(() => __test__.buildHermesActionCommand({ action: 'delete', taskId: 't_abc123' })).toThrow('unsupported action')
  })

  it('executes a safe Hermes Kanban action and returns a refreshed command receipt', async () => {
    const execMock = vi.fn()
      .mockResolvedValueOnce({ stdout: '{"id":"t_new123","status":"ready"}\n', stderr: '' })
      .mockResolvedValueOnce({ stdout: 'Current board: default\n', stderr: '' })
      .mockResolvedValueOnce({ stdout: '▶ t_new123  ready     default               Dual-board follow-up\n', stderr: '' })
    __test__.setExecFileForTest(execMock)

    const response = await POST(new Request('http://localhost/api/hermes/kanban', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', title: 'Dual-board follow-up', assignee: 'default' }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.action).toBe('create')
    expect(payload.receipt.stdout).toContain('t_new123')
    expect(payload.board.tasks).toHaveLength(1)
    expect(execMock).toHaveBeenCalledWith('hermes', [
      'kanban',
      'create',
      'Dual-board follow-up',
      '--assignee',
      'default',
      '--created-by',
      'unite-hub',
      '--json',
    ], expect.any(Object))
  })
})
