'use client'

import { useCallback, useEffect, useState } from 'react'

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

const STATUS_ORDER = ['ready', 'running', 'blocked', 'todo', 'scheduled', 'done']

export function HermesKanbanStatus() {
  const [data, setData] = useState<HermesKanbanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)

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
