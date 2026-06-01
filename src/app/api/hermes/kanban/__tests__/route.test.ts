import { describe, expect, it, vi } from 'vitest'
import { GET, POST, __test__ } from '../route'

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

  it('builds a deterministic Linear issue payload from a Hermes task', () => {
    expect(__test__.buildLinearIssueInput({
      taskId: 't_176bb1b0',
      title: 'Unite-Hub: keep Hermes Kanban mirrored in Founder OS',
      body: 'Evidence loop required',
      teamKey: 'UNI',
    })).toEqual({
      teamKey: 'UNI',
      title: '[Hermes t_176bb1b0] Unite-Hub: keep Hermes Kanban mirrored in Founder OS',
      description: 'Hermes Task: t_176bb1b0\nSource: Unite-Hub dual-board controls\n\nEvidence loop required',
      priority: 3,
    })
  })

  it('links a Hermes task to a new Linear issue and records the backlink as a Hermes comment', async () => {
    const execMock = vi.fn()
      .mockResolvedValueOnce({ stdout: 'commented t_176bb1b0\n', stderr: '' })
      .mockResolvedValueOnce({ stdout: 'Current board: default\n', stderr: '' })
      .mockResolvedValueOnce({ stdout: '▶ t_176bb1b0  ready     default               Unite-Hub: keep Hermes Kanban mirrored in Founder OS\n', stderr: '' })
    __test__.setExecFileForTest(execMock)
    __test__.setCreateIssueForTest(vi.fn().mockResolvedValue({ id: 'UNI-777', url: 'https://linear.app/unite-group/issue/UNI-777/test' }))

    const response = await POST(new Request('http://localhost/api/hermes/kanban', {
      method: 'POST',
      body: JSON.stringify({
        action: 'linkLinear',
        taskId: 't_176bb1b0',
        title: 'Unite-Hub: keep Hermes Kanban mirrored in Founder OS',
        body: 'Evidence loop required',
        teamKey: 'UNI',
      }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.action).toBe('linkLinear')
    expect(payload.linkedIssue).toEqual({ identifier: 'UNI-777', url: 'https://linear.app/unite-group/issue/UNI-777/test' })
    expect(execMock).toHaveBeenCalledWith('hermes', [
      'kanban',
      'comment',
      '--author',
      'unite-hub',
      't_176bb1b0',
      'Linear link: UNI-777 https://linear.app/unite-group/issue/UNI-777/test',
    ], expect.any(Object))
  })

  it('parses Linear backlinks from Hermes task comments', () => {
    expect(__test__.parseLinearBacklink([
      { body: 'Operator note' },
      { body: 'Linear link: UNI-777 https://linear.app/unite-group/issue/UNI-777/test' },
    ])).toEqual({ identifier: 'UNI-777', url: 'https://linear.app/unite-group/issue/UNI-777/test' })
  })

  it('hydrates Linear backlinks into the board task list from Hermes show output', async () => {
    const execMock = vi.fn()
      .mockResolvedValueOnce({ stdout: 'Current board: default\n', stderr: '' })
      .mockResolvedValueOnce({ stdout: '▶ t_176bb1b0  ready     default               Unite-Hub: keep Hermes Kanban mirrored in Founder OS\n', stderr: '' })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          task: { id: 't_176bb1b0' },
          comments: [
            { body: 'Linear link: UNI-777 https://linear.app/unite-group/issue/UNI-777/test' },
          ],
        }),
        stderr: '',
      })
    __test__.setExecFileForTest(execMock)

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.tasks[0]).toMatchObject({
      id: 't_176bb1b0',
      linearLink: { identifier: 'UNI-777', url: 'https://linear.app/unite-group/issue/UNI-777/test' },
    })
    expect(execMock).toHaveBeenCalledWith('hermes', ['kanban', 'show', '--json', 't_176bb1b0'], expect.any(Object))
  })
})
