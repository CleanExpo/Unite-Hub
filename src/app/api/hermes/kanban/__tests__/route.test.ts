import { describe, expect, it } from 'vitest'
import { __test__ } from '../route'

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
})
