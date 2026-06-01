'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'

type HermesTask = {
  id: string
  status: string
  assignee: string | null
  title: string
}

type HermesKanbanResponse = {
  configured: boolean
  board: string
  summary: Record<string, number>
  tasks: HermesTask[]
  lastSyncedAt: string
  error?: string
}

type HermesActionResponse = {
  action: string
  board?: HermesKanbanResponse
  error?: string
}

const STATUS_ORDER = ['ready', 'running', 'blocked', 'todo', 'scheduled', 'done']

export function HermesKanbanStatus() {
  const [data, setData] = useState<HermesKanbanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [actionStatus, setActionStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadHermesBoard = useCallback(async () => {
    try {
      const response = await fetch('/api/hermes/kanban')
      const payload = await response.json() as HermesKanbanResponse
      setData(payload)
      setStale(!response.ok || !payload.configured)
    } catch {
      setStale(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHermesBoard()
    const interval = setInterval(loadHermesBoard, 60_000)
    return () => clearInterval(interval)
  }, [loadHermesBoard])

  async function postHermesAction(payload: Record<string, string>) {
    setSubmitting(true)
    setActionStatus(null)
    try {
      const response = await fetch('/api/hermes/kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json() as HermesActionResponse
      if (!response.ok) throw new Error(result.error ?? 'Hermes action failed')
      if (result.board) {
        setData(result.board)
        setStale(!result.board.configured)
      }
      setActionStatus(`Action recorded: ${result.action}`)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hermes action failed'
      setActionStatus(`Action failed: ${message}`)
      return null
    } finally {
      setSubmitting(false)
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    const result = await postHermesAction({ action: 'create', title: title.trim(), body: body.trim(), assignee: 'default' })
    if (result) {
      setTitle('')
      setBody('')
    }
  }

  if (loading) {
    return (
      <section className="rounded-sm border p-4 animate-pulse" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }}>
        <div className="h-4 w-48 rounded-sm" style={{ background: 'var(--surface-elevated)' }} />
      </section>
    )
  }

  const tasks = data?.tasks ?? []
  const openTasks = tasks.filter((task) => task.status !== 'done').slice(0, 6)
  const summary = data?.summary ?? {}

  return (
    <section className="rounded-sm border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-disabled)' }}>
            Hermes Kanban
          </p>
          <h2 className="mt-1 text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Unite-Group execution board
          </h2>
          <p className="mt-1 max-w-2xl text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            Local Hermes board mirrored into the Founder OS so Linear is not the only operational truth source.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          <span className="rounded-sm border px-2 py-1" style={{ borderColor: 'var(--color-border)' }}>
            Board: {data?.board ?? 'default'}
          </span>
          <span className="rounded-sm border px-2 py-1" style={{ borderColor: stale ? 'rgba(245,158,11,0.45)' : 'var(--color-border)', color: stale ? '#f59e0b' : 'var(--color-text-muted)' }}>
            {stale ? 'Needs attention' : 'Live sync'}
          </span>
          {data?.lastSyncedAt && (
            <span className="rounded-sm border px-2 py-1" style={{ borderColor: 'var(--color-border)' }}>
              {new Date(data.lastSyncedAt).toLocaleTimeString('en-AU')}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={createTask} className="mt-4 grid gap-2 rounded-sm border p-3 lg:grid-cols-[1fr_1.5fr_auto]" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)' }}>
        <label className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Hermes task title
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-sm border bg-transparent px-2 py-2 text-[12px] outline-none" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} placeholder="Founder approved next task" />
        </label>
        <label className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Hermes task context
          <input value={body} onChange={(event) => setBody(event.target.value)} className="mt-1 w-full rounded-sm border bg-transparent px-2 py-2 text-[12px] outline-none" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} placeholder="Evidence, scope, handoff notes" />
        </label>
        <button type="submit" disabled={submitting || !title.trim()} className="self-end rounded-sm border px-3 py-2 text-[11px] font-medium disabled:opacity-40" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
          Create Hermes task
        </button>
      </form>

      {actionStatus && (
        <p className="mt-2 text-[11px]" style={{ color: actionStatus.startsWith('Action failed') ? '#f59e0b' : 'var(--color-text-muted)' }}>
          {actionStatus}
        </p>
      )}

      <div className="mt-4 grid gap-2 md:grid-cols-6">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="rounded-sm border p-2" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)' }}>
            <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-disabled)' }}>{status}</p>
            <p className="mt-1 text-[18px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{summary[status] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {openTasks.length > 0 ? openTasks.map((task) => (
          <div key={task.id} className="rounded-sm border p-3" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)' }}>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-disabled)' }}>
              <span>{task.id}</span>
              <span>{task.status}</span>
              <span>{task.assignee ?? 'unassigned'}</span>
            </div>
            <p className="mt-1 text-[12px]" style={{ color: 'var(--color-text-primary)' }}>{task.title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {task.status === 'blocked' ? (
                <button type="button" disabled={submitting} aria-label={`Unblock ${task.id}`} onClick={() => postHermesAction({ action: 'unblock', taskId: task.id })} className="rounded-sm border px-2 py-1 text-[10px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>Unblock</button>
              ) : (
                <button type="button" disabled={submitting} aria-label={`Block ${task.id}`} onClick={() => postHermesAction({ action: 'block', taskId: task.id, note: 'Blocked from Unite-Hub dual-board controls' })} className="rounded-sm border px-2 py-1 text-[10px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>Block</button>
              )}
              <button type="button" disabled={submitting} aria-label={`Complete ${task.id}`} onClick={() => postHermesAction({ action: 'complete', taskId: task.id, note: 'Completed from Unite-Hub dual-board controls' })} className="rounded-sm border px-2 py-1 text-[10px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>Complete</button>
            </div>
          </div>
        )) : (
          <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            No open Hermes Kanban tasks on this board.
          </p>
        )}
      </div>
    </section>
  )
}
