'use client'

// QueueBoard — kanban work-queue for the Nexus Command Deck (CC-17).
//
// Reads the founder's cc_tasks from GET /api/command-centre/tasks and renders
// them as columns: Proposed · Queued · Running · Blocked · Awaiting approval ·
// Done. Cards on "Awaiting approval" expose Approve / Reject / Defer, which POST
// /api/command-centre/tasks/{id}/approve and optimistically update + refetch.
//
// Auth is the founder session cookie (credentials: 'include'). Loading / empty /
// error states are honest — success is only ever claimed on a 2xx response.

import { useCallback, useEffect, useState } from 'react'
import styles from './queue-board.module.css'

type TaskStatus =
  | 'proposed'
  | 'queued'
  | 'running'
  | 'blocked'
  | 'awaiting_approval'
  | 'done'
  | 'failed'

type ApprovalDecision = 'approve' | 'reject' | 'defer'

// Mirror of the cc_tasks fields we actually render.
interface QueueTask {
  id: string
  title: string
  status: TaskStatus
  priority: string
  risk_level: string
}

interface TasksResponse {
  tasks?: QueueTask[]
  error?: string
}

// Visible columns, in flight order. `failed` is folded into the Blocked column.
const COLUMNS: { key: TaskStatus; label: string; col: string; statuses: TaskStatus[] }[] = [
  { key: 'proposed', label: 'Proposed', col: '#6f879b', statuses: ['proposed'] },
  { key: 'queued', label: 'Queued', col: '#38e1ff', statuses: ['queued'] },
  { key: 'running', label: 'Running', col: '#34d399', statuses: ['running'] },
  { key: 'blocked', label: 'Blocked', col: '#f87171', statuses: ['blocked', 'failed'] },
  { key: 'awaiting_approval', label: 'Awaiting approval', col: '#fbbf24', statuses: ['awaiting_approval'] },
  { key: 'done', label: 'Done', col: '#34d399', statuses: ['done'] },
]

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    if (data && typeof data.error === 'string' && data.error) return data.error
  } catch {
    // fall through
  }
  return `${fallback} (HTTP ${res.status})`
}

export function QueueBoard() {
  const [tasks, setTasks] = useState<QueueTask[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Per-task in-flight approval guard + per-task error.
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/command-centre/tasks', { credentials: 'include' })
      if (!res.ok) {
        setError(await readError(res, 'Could not load the work queue'))
        return
      }
      const data = (await res.json()) as TasksResponse
      setTasks(Array.isArray(data.tasks) ? data.tasks : [])
    } catch {
      setError('Network error — could not reach the work queue.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load('initial')
  }, [load])

  async function decide(taskId: string, decision: ApprovalDecision) {
    if (pending[taskId]) return
    setPending((p) => ({ ...p, [taskId]: true }))
    setCardErrors((e) => {
      const next = { ...e }
      delete next[taskId]
      return next
    })

    // Optimistic transition (approve→queued, reject→blocked, defer→proposed).
    const optimistic: Record<ApprovalDecision, TaskStatus> = {
      approve: 'queued',
      reject: 'blocked',
      defer: 'proposed',
    }
    const prev = tasks
    setTasks((list) =>
      list.map((t) => (t.id === taskId ? { ...t, status: optimistic[decision] } : t)),
    )

    try {
      const res = await fetch(`/api/command-centre/tasks/${encodeURIComponent(taskId)}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      if (!res.ok) {
        setTasks(prev) // roll back
        const message = await readError(res, 'Approval failed')
        setCardErrors((e) => ({ ...e, [taskId]: message }))
        return
      }
      // Reconcile with the server's authoritative state.
      await load('refresh')
    } catch {
      setTasks(prev)
      setCardErrors((e) => ({ ...e, [taskId]: 'Network error — approval not recorded.' }))
    } finally {
      setPending((p) => {
        const next = { ...p }
        delete next[taskId]
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className={styles.board}>
        <div className={styles.state}>
          <span className={styles.spinner} aria-hidden="true" />
          Loading the work queue…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.board}>
        <div className={`${styles.state} ${styles.stateError}`} role="alert">
          {error}
          <div style={{ marginTop: '0.7rem' }}>
            <button type="button" className={styles.refresh} onClick={() => void load('initial')}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.board}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarMeta}>{tasks.length} tasks in queue</span>
        <button
          type="button"
          className={styles.refresh}
          onClick={() => void load('refresh')}
          disabled={refreshing}
        >
          {refreshing && <span className={styles.spinner} aria-hidden="true" />}
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.state}>
          No tasks yet — submit an idea and convene the Board to populate the queue.
        </div>
      ) : (
        <div className={styles.columns}>
          {COLUMNS.map((column) => {
            const colTasks = tasks.filter((t) => column.statuses.includes(t.status))
            return (
              <section
                key={column.key}
                className={styles.column}
                style={{ '--col': column.col } as React.CSSProperties}
              >
                <header className={styles.colHead}>
                  <span className={styles.colTitle}>{column.label}</span>
                  <span className={styles.colCount}>{colTasks.length}</span>
                </header>
                <div className={styles.colBody}>
                  {colTasks.length === 0 ? (
                    <span className={styles.colEmpty}>empty</span>
                  ) : (
                    colTasks.map((task) => (
                      <article key={task.id} className={styles.card}>
                        <div className={styles.cardHead}>
                          <span
                            className={styles.statusLight}
                            data-status={task.status}
                            aria-hidden="true"
                          />
                          <span className={styles.cardTitle}>{task.title}</span>
                        </div>
                        <div className={styles.cardMeta}>
                          <span className={styles.tag}>{task.priority}</span>
                          <span className={styles.tag} data-risk={task.risk_level}>
                            {task.risk_level}
                          </span>
                          <span className={styles.tag}>{task.status.replace('_', ' ')}</span>
                        </div>

                        {task.status === 'awaiting_approval' && (
                          <>
                            <div className={styles.approveRow}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                data-kind="approve"
                                disabled={pending[task.id]}
                                onClick={() => void decide(task.id, 'approve')}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                data-kind="reject"
                                disabled={pending[task.id]}
                                onClick={() => void decide(task.id, 'reject')}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                data-kind="defer"
                                disabled={pending[task.id]}
                                onClick={() => void decide(task.id, 'defer')}
                              >
                                Defer
                              </button>
                            </div>
                            {cardErrors[task.id] && (
                              <span className={styles.cardError} role="alert">
                                {cardErrors[task.id]}
                              </span>
                            )}
                          </>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
