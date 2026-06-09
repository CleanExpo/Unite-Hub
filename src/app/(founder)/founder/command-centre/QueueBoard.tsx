'use client'

// QueueBoard — task queue visibility + approvals UI for the Command Deck (CC-17).
//
// Drives the queue/approvals APIs:
//   GET  /api/command-centre/queue                 → { tasks }
//   POST /api/command-centre/queue/[id]/approve    → { approval, task }
//
// Tasks are grouped by status. Proposed / awaiting-approval tasks expose
// Approve / Defer / Reject actions. Auth-gated by the founder session cookie
// (credentials: 'include'). Loading / error / empty states are honest — success
// is only ever claimed on a 2xx response.

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './queue-board.module.css'
import { subscribeToQueue, type RealtimeClientLike } from '@/lib/command-centre/realtime'
import { createClient } from '@/lib/supabase/client'

interface QueueTask {
  id: string
  title: string
  objective: string
  status: string
  priority: string
  risk_level: string
  origin: string
  project_key: string | null
  updated_at: string
}

type Decision = 'approve' | 'defer' | 'reject'

type GateState = 'pass' | 'fail' | 'skip' | 'pending'
interface ValidationSummary {
  byGate: Record<string, GateState>
  passed: string[]
  failed: string[]
  pending: string[]
  canComplete: boolean
}
interface ValidationCell {
  loading?: boolean
  error?: string
  summary?: ValidationSummary
}

type SessionStatus = 'running' | 'paused' | 'done' | 'failed'
type SessionAction = 'pause' | 'resume' | 'complete' | 'fail'
interface ExecutionSession {
  id: string
  surface: string
  status: SessionStatus
  started_at: string
}
interface SessionCell {
  loading?: boolean
  error?: string
  sessions?: ExecutionSession[]
}

// Which lifecycle actions are valid from each session status (mirrors the API).
const SESSION_ACTIONS_FOR: Record<SessionStatus, SessionAction[]> = {
  running: ['pause', 'complete', 'fail'],
  paused: ['resume', 'complete', 'fail'],
  done: [],
  failed: [],
}

// Display order; the first two groups are the ones that need a human decision.
const STATUS_ORDER = ['proposed', 'awaiting_approval', 'queued', 'running', 'blocked', 'done', 'failed'] as const
const ACTIONABLE = new Set(['proposed', 'awaiting_approval'])
const STATUS_LABEL: Record<string, string> = {
  proposed: 'Proposed',
  awaiting_approval: 'Awaiting approval',
  queued: 'Queued',
  running: 'Running',
  blocked: 'Blocked',
  done: 'Done',
  failed: 'Failed',
}

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
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [valOpen, setValOpen] = useState<string | null>(null)
  const [valData, setValData] = useState<Record<string, ValidationCell>>({})
  const [sessOpen, setSessOpen] = useState<string | null>(null)
  const [sessData, setSessData] = useState<Record<string, SessionCell>>({})
  const [sessBusy, setSessBusy] = useState(false)
  const [live, setLive] = useState(false)
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/command-centre/queue', { credentials: 'include' })
      if (!res.ok) {
        setError(await readError(res, 'Could not load the queue'))
        return
      }
      const data = (await res.json()) as { tasks?: QueueTask[] }
      setTasks(Array.isArray(data.tasks) ? data.tasks : [])
    } catch {
      setError('Network error — could not reach the queue service.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  // Live updates: debounced refetch whenever a cc_tasks / session row the founder
  // can see changes — including cron + overnight-session writes (RLS authorises).
  useEffect(() => {
    let client: RealtimeClientLike
    try {
      client = createClient() as unknown as RealtimeClientLike
    } catch {
      return // env not ready; the static board still works without live updates
    }
    const unsub = subscribeToQueue(
      client,
      () => {
        if (reloadTimer.current) clearTimeout(reloadTimer.current)
        reloadTimer.current = setTimeout(() => void loadQueue(), 400)
      },
      (status) => setLive(status === 'SUBSCRIBED'),
    )
    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current)
      setLive(false)
      unsub()
    }
  }, [loadQueue])

  async function decide(taskId: string, decision: Decision) {
    if (busyId) return
    setBusyId(taskId)
    setError(null)
    try {
      const res = await fetch(`/api/command-centre/queue/${taskId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      if (!res.ok) {
        setError(await readError(res, `Could not ${decision} task`))
        return
      }
      // Re-read the queue so every group reflects the new status truthfully.
      await loadQueue()
    } catch {
      setError(`Network error — could not ${decision} the task.`)
    } finally {
      setBusyId(null)
    }
  }

  async function toggleValidation(taskId: string) {
    if (valOpen === taskId) {
      setValOpen(null)
      return
    }
    setValOpen(taskId)
    if (valData[taskId]?.summary) return // already loaded
    setValData((d) => ({ ...d, [taskId]: { loading: true } }))
    try {
      const res = await fetch(`/api/command-centre/queue/${taskId}/validation`, { credentials: 'include' })
      if (!res.ok) {
        const msg = await readError(res, 'Could not load validation')
        setValData((d) => ({ ...d, [taskId]: { error: msg } }))
        return
      }
      const data = (await res.json()) as { summary?: ValidationSummary }
      setValData((d) => ({ ...d, [taskId]: { summary: data.summary } }))
    } catch {
      setValData((d) => ({ ...d, [taskId]: { error: 'Network error — could not load validation.' } }))
    }
  }

  const loadSessions = useCallback(async (taskId: string) => {
    setSessData((d) => ({ ...d, [taskId]: { ...d[taskId], loading: true, error: undefined } }))
    try {
      const res = await fetch(`/api/command-centre/sessions?taskId=${encodeURIComponent(taskId)}`, { credentials: 'include' })
      if (!res.ok) {
        const msg = await readError(res, 'Could not load sessions')
        setSessData((d) => ({ ...d, [taskId]: { error: msg } }))
        return
      }
      const data = (await res.json()) as { sessions?: ExecutionSession[] }
      setSessData((d) => ({ ...d, [taskId]: { sessions: Array.isArray(data.sessions) ? data.sessions : [] } }))
    } catch {
      setSessData((d) => ({ ...d, [taskId]: { error: 'Network error — could not load sessions.' } }))
    }
  }, [])

  async function toggleSessions(taskId: string) {
    if (sessOpen === taskId) {
      setSessOpen(null)
      return
    }
    setSessOpen(taskId)
    if (!sessData[taskId]?.sessions) await loadSessions(taskId)
  }

  async function startSession(taskId: string) {
    if (sessBusy) return
    setSessBusy(true)
    try {
      const res = await fetch('/api/command-centre/sessions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })
      if (!res.ok) {
        const msg = await readError(res, 'Could not start session')
        setSessData((d) => ({ ...d, [taskId]: { ...d[taskId], error: msg } }))
        return
      }
      await loadSessions(taskId)
    } catch {
      setSessData((d) => ({ ...d, [taskId]: { ...d[taskId], error: 'Network error — could not start session.' } }))
    } finally {
      setSessBusy(false)
    }
  }

  async function sessionAction(taskId: string, sessionId: string, action: SessionAction) {
    if (sessBusy) return
    setSessBusy(true)
    try {
      const res = await fetch(`/api/command-centre/sessions/${sessionId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const msg = await readError(res, `Could not ${action} session`)
        setSessData((d) => ({ ...d, [taskId]: { ...d[taskId], error: msg } }))
        return
      }
      await loadSessions(taskId)
    } catch {
      setSessData((d) => ({ ...d, [taskId]: { ...d[taskId], error: `Network error — could not ${action} session.` } }))
    } finally {
      setSessBusy(false)
    }
  }

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: tasks.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0)

  return (
    <div className={styles.board} aria-live="polite">
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {tasks.length} task{tasks.length === 1 ? '' : 's'}
        </span>
        <span className={styles.toolbarRight}>
          <span
            className={styles.liveDot}
            data-live={live}
            title={live ? 'Live — board updates in real time' : 'Not connected to live updates'}
            aria-hidden="true"
          />
          <span className={styles.liveLabel}>{live ? 'Live' : 'Offline'}</span>
          <button type="button" className={styles.refresh} onClick={() => void loadQueue()} disabled={loading}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </span>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {!loading && tasks.length === 0 && !error && (
        <div className={styles.placeholder}>
          No tasks yet. Submit an idea and convene the Board to populate the queue.
        </div>
      )}

      {grouped.map((group) => (
        <section key={group.status} className={styles.group}>
          <div className={styles.groupHead}>
            <span className={styles.led} data-status={group.status} aria-hidden="true" />
            <span className={styles.groupName}>{STATUS_LABEL[group.status] ?? group.status}</span>
            <span className={styles.groupCount}>{group.items.length}</span>
          </div>

          <ul className={styles.list}>
            {group.items.map((task) => (
              <li key={task.id} className={styles.row} style={{ '--rail': riskRail(task.risk_level) } as React.CSSProperties}>
                <div className={styles.rowTop}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowTitle}>{task.title}</span>
                    <span className={styles.rowMeta}>
                      <span className={styles.tag}>{task.priority}</span>
                      <span className={styles.tag} data-risk={task.risk_level}>{task.risk_level}</span>
                      <span className={styles.tag}>{task.origin}</span>
                      {task.project_key && <span className={styles.tag}>{task.project_key}</span>}
                    </span>
                  </div>

                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.valToggle}
                      onClick={() => void toggleValidation(task.id)}
                      aria-expanded={valOpen === task.id}
                    >
                      {valOpen === task.id ? 'Hide gates' : 'Validation'}
                    </button>
                    <button
                      type="button"
                      className={styles.valToggle}
                      onClick={() => void toggleSessions(task.id)}
                      aria-expanded={sessOpen === task.id}
                    >
                      {sessOpen === task.id ? 'Hide sessions' : 'Sessions'}
                    </button>
                    {ACTIONABLE.has(task.status) && (
                      <>
                        <button
                          type="button"
                          className={`${styles.action} ${styles.approve}`}
                          onClick={() => void decide(task.id, 'approve')}
                          disabled={busyId !== null}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className={`${styles.action} ${styles.defer}`}
                          onClick={() => void decide(task.id, 'defer')}
                          disabled={busyId !== null}
                        >
                          Defer
                        </button>
                        <button
                          type="button"
                          className={`${styles.action} ${styles.reject}`}
                          onClick={() => void decide(task.id, 'reject')}
                          disabled={busyId !== null}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {valOpen === task.id && <ValidationView cell={valData[task.id]} />}
                {sessOpen === task.id && (
                  <SessionsView
                    cell={sessData[task.id]}
                    canStart={task.status === 'queued'}
                    busy={sessBusy}
                    onStart={() => void startSession(task.id)}
                    onAction={(sid, a) => void sessionAction(task.id, sid, a)}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ValidationView({ cell }: { cell?: ValidationCell }) {
  if (!cell || cell.loading) {
    return (
      <div className={styles.valPanel}>
        <span className={styles.valMuted}>Loading gates…</span>
      </div>
    )
  }
  if (cell.error) {
    return (
      <div className={styles.valPanel}>
        <span className={styles.valError}>{cell.error}</span>
      </div>
    )
  }
  const summary = cell.summary
  if (!summary) {
    return (
      <div className={styles.valPanel}>
        <span className={styles.valMuted}>No validation data.</span>
      </div>
    )
  }
  const gates = Object.entries(summary.byGate)
  return (
    <div className={styles.valPanel}>
      <div className={styles.valGates}>
        {gates.length === 0 ? (
          <span className={styles.valMuted}>No required gates configured.</span>
        ) : (
          gates.map(([gate, state]) => (
            <span key={gate} className={styles.gateChip} data-state={state}>
              {gate} · {state}
            </span>
          ))
        )}
      </div>
      <span className={styles.completeBadge} data-ok={summary.canComplete}>
        {summary.canComplete ? 'Ready to complete' : 'Blocked — gates not all passing'}
      </span>
    </div>
  )
}

function sessionChipState(status: SessionStatus): 'pass' | 'fail' | 'pending' {
  if (status === 'done') return 'pass'
  if (status === 'failed') return 'fail'
  return 'pending'
}

function SessionsView({
  cell,
  canStart,
  busy,
  onStart,
  onAction,
}: {
  cell?: SessionCell
  canStart: boolean
  busy: boolean
  onStart: () => void
  onAction: (sessionId: string, action: SessionAction) => void
}) {
  if (!cell || cell.loading) {
    return (
      <div className={styles.sessPanel}>
        <span className={styles.valMuted}>Loading sessions…</span>
      </div>
    )
  }
  const sessions = cell.sessions ?? []
  return (
    <div className={styles.sessPanel}>
      {cell.error && <span className={styles.valError}>{cell.error}</span>}
      {sessions.length === 0 ? (
        <span className={styles.valMuted}>No sessions yet.</span>
      ) : (
        <div className={styles.sessList}>
          {sessions.map((s) => (
            <div key={s.id} className={styles.sessRow}>
              <span className={styles.gateChip} data-state={sessionChipState(s.status)}>
                {s.surface} · {s.status}
              </span>
              <div className={styles.sessActions}>
                {SESSION_ACTIONS_FOR[s.status].map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={styles.valToggle}
                    disabled={busy}
                    onClick={() => onAction(s.id, a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {canStart && (
        <button type="button" className={`${styles.action} ${styles.approve}`} disabled={busy} onClick={onStart}>
          Start session
        </button>
      )}
      {!canStart && sessions.length === 0 && (
        <span className={styles.valMuted}>Approve the task (→ queued) to start a session.</span>
      )}
    </div>
  )
}

const RISK_RAIL: Record<string, string> = {
  low: '#34d399',
  medium: '#fbbf24',
  high: '#fb923c',
  critical: '#f87171',
}
function riskRail(risk: string): string {
  return RISK_RAIL[risk] ?? '#6f879b'
}
