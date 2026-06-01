import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HermesKanbanStatus } from '../HermesKanbanStatus'

beforeEach(() => {
  vi.restoreAllMocks()
})

const liveBoard = {
  configured: true,
  board: 'default',
  summary: { ready: 2, running: 1, blocked: 0, todo: 0, scheduled: 0, done: 12 },
  tasks: [
    { id: 't_176bb1b0', status: 'running', assignee: 'default', title: 'Unite-Hub: keep Hermes Kanban mirrored in Founder OS' },
  ],
  lastSyncedAt: '2026-06-01T23:11:50.734Z',
}

describe('HermesKanbanStatus', () => {
  it('displays the live Hermes board status alongside task counts', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => liveBoard,
    } as unknown as Response)

    render(<HermesKanbanStatus />)

    await waitFor(() => expect(screen.getByText('Live sync')).toBeInTheDocument())
    expect(screen.getByText('Board: default')).toBeInTheDocument()
    expect(screen.getByText('Hermes Kanban')).toBeInTheDocument()
    expect(screen.getByText('Unite-Hub: keep Hermes Kanban mirrored in Founder OS')).toBeInTheDocument()
    expect(screen.getAllByText('running')).toHaveLength(2)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('shows degraded state when the Hermes board endpoint is unavailable', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({
        configured: false,
        board: 'default',
        summary: {},
        tasks: [],
        lastSyncedAt: '2026-06-01T23:11:50.734Z',
        error: 'hermes unavailable',
      }),
    } as unknown as Response)

    render(<HermesKanbanStatus />)

    await waitFor(() => expect(screen.getByText('Needs attention')).toBeInTheDocument())
    expect(screen.getByText('No open Hermes Kanban tasks on this board.')).toBeInTheDocument()
  })

  it('creates a Hermes task from the Founder OS control surface', async () => {
    const fetchMock = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => liveBoard } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: 'create',
          receipt: { stdout: '{"id":"t_new123"}' },
          board: {
            ...liveBoard,
            summary: { ...liveBoard.summary, ready: 3 },
            tasks: [
              ...liveBoard.tasks,
              { id: 't_new123', status: 'ready', assignee: 'default', title: 'Founder approved dual-board control' },
            ],
          },
        }),
      } as unknown as Response)

    render(<HermesKanbanStatus />)

    await waitFor(() => expect(screen.getByText('Live sync')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Hermes task title'), { target: { value: 'Founder approved dual-board control' } })
    fireEvent.change(screen.getByLabelText('Hermes task context'), { target: { value: 'Create from Unite-Hub control surface' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Hermes task' }))

    await waitFor(() => expect(screen.getByText('Action recorded: create')).toBeInTheDocument())
    expect(screen.getByText('Founder approved dual-board control')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/hermes/kanban', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        title: 'Founder approved dual-board control',
        body: 'Create from Unite-Hub control surface',
        assignee: 'default',
      }),
    }))
  })

  it('can block an open Hermes task from the dual-board row controls', async () => {
    const fetchMock = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => liveBoard } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: 'block',
          receipt: { stdout: 'blocked t_176bb1b0' },
          board: {
            ...liveBoard,
            summary: { ready: 2, running: 0, blocked: 1, todo: 0, scheduled: 0, done: 12 },
            tasks: [{ ...liveBoard.tasks[0], status: 'blocked' }],
          },
        }),
      } as unknown as Response)

    render(<HermesKanbanStatus />)

    await waitFor(() => expect(screen.getByText('Unite-Hub: keep Hermes Kanban mirrored in Founder OS')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Block t_176bb1b0' }))

    await waitFor(() => expect(screen.getByText('Action recorded: block')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenLastCalledWith('/api/hermes/kanban', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ action: 'block', taskId: 't_176bb1b0', note: 'Blocked from Unite-Hub dual-board controls' }),
    }))
  })

  it('links a Hermes task to Linear and surfaces the dual-board badge', async () => {
    const fetchMock = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => liveBoard } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: 'linkLinear',
          linkedIssue: { identifier: 'UNI-777', url: 'https://linear.app/unite-group/issue/UNI-777/test' },
          board: liveBoard,
        }),
      } as unknown as Response)

    render(<HermesKanbanStatus />)

    await waitFor(() => expect(screen.getByText('Unite-Hub: keep Hermes Kanban mirrored in Founder OS')).toBeInTheDocument())
    expect(screen.getByText('Hermes only')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Link Linear t_176bb1b0' }))

    await waitFor(() => expect(screen.getByText('Action recorded: linkLinear → UNI-777')).toBeInTheDocument())
    expect(screen.getByText('Linked: UNI-777')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/hermes/kanban', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        action: 'linkLinear',
        taskId: 't_176bb1b0',
        title: 'Unite-Hub: keep Hermes Kanban mirrored in Founder OS',
        body: 'Linked from Unite-Hub dual-board controls',
        teamKey: 'UNI',
      }),
    }))
  })
})
