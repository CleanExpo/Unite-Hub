'use client'

// IdeaConsole — idea-intake UI for the Nexus Command Deck (CC-16).
//
// Drives the already-built loop:
//   1. POST /api/command-centre/ideas { idea, projectKey? }
//        → 201 { task, evidencePath }  (a `proposed` cc_task)
//   2. POST /api/command-centre/board { taskId }
//        → 201 { decision, verdict, personas, subtasks }
//
// Both routes are auth-gated by the founder session cookie; we send it with
// `credentials: 'include'`. Loading / error / empty states are handled
// honestly — success is only ever claimed on a 2xx response.

import { useId, useRef, useState } from 'react'
import styles from './idea-console.module.css'

// ── Mirror of the API response shapes we actually render ──────────────────────

type Verdict = 'APPROVED' | 'HOLD' | 'REJECTED'

interface IntakeTask {
  id: string
  title: string
  status: string
}

interface PersonaOpinion {
  persona: string
  stance: Verdict
  comment: string
}

interface BoardResult {
  verdict: Verdict
  personas: PersonaOpinion[]
  subtasks: IntakeTask[]
}

export interface IdeaConsoleProject {
  name: string
}

interface IdeaResponse {
  task?: IntakeTask
  error?: string
}

interface BoardResponse {
  verdict?: Verdict
  personas?: PersonaOpinion[]
  subtasks?: IntakeTask[]
  decision?: { rationale?: string | null }
  error?: string
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    if (data && typeof data.error === 'string' && data.error) return data.error
  } catch {
    // fall through to status-based message
  }
  return `${fallback} (HTTP ${res.status})`
}

export function IdeaConsole({ projects }: { projects: IdeaConsoleProject[] }) {
  const ideaFieldId = useId()
  const projectFieldId = useId()

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [idea, setIdea] = useState('')
  const [projectKey, setProjectKey] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [convening, setConvening] = useState(false)

  const [task, setTask] = useState<IntakeTask | null>(null)
  const [board, setBoard] = useState<BoardResult | null>(null)
  const [rationale, setRationale] = useState('')

  const [intakeError, setIntakeError] = useState<string | null>(null)
  const [boardError, setBoardError] = useState<string | null>(null)

  async function submitIdea(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = idea.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    setIntakeError(null)
    setBoardError(null)
    // A fresh idea supersedes any prior verdict.
    setBoard(null)
    setRationale('')

    try {
      const res = await fetch('/api/command-centre/ideas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: trimmed,
          ...(projectKey ? { projectKey } : {}),
        }),
      })

      if (!res.ok) {
        setTask(null)
        setIntakeError(await readError(res, 'Could not submit idea'))
        return
      }

      const data = (await res.json()) as IdeaResponse
      if (!data.task?.id) {
        setTask(null)
        setIntakeError('The server accepted the idea but returned no task.')
        return
      }
      setTask(data.task)
    } catch {
      setTask(null)
      setIntakeError('Network error — could not reach the intake service.')
    } finally {
      setSubmitting(false)
    }
  }

  async function conveneBoard() {
    if (!task || convening) return

    setConvening(true)
    setBoardError(null)

    try {
      const res = await fetch('/api/command-centre/board', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      })

      if (!res.ok) {
        setBoard(null)
        setRationale('')
        setBoardError(await readError(res, 'Board review failed'))
        return
      }

      const data = (await res.json()) as BoardResponse
      if (!data.verdict) {
        setBoard(null)
        setRationale('')
        setBoardError('The board responded but returned no verdict.')
        return
      }
      setBoard({
        verdict: data.verdict,
        personas: Array.isArray(data.personas) ? data.personas : [],
        subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
      })
      setRationale(typeof data.decision?.rationale === 'string' ? data.decision.rationale : '')
    } catch {
      setBoard(null)
      setRationale('')
      setBoardError('Network error — could not reach the board service.')
    } finally {
      setConvening(false)
    }
  }

  const canSubmit = idea.trim().length > 0 && !submitting
  const canConvene = task !== null && !convening && !submitting

  return (
    <div id="idea-console" className={styles.console}>
      {/* ── Intake column ──────────────────────────────────────────────── */}
      <form className={styles.intake} onSubmit={submitIdea}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={ideaFieldId}>
            Tell Hermes an idea…
          </label>
          <textarea
            ref={textareaRef}
            id={ideaFieldId}
            className={styles.textarea}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe the idea in your own words. It becomes a proposed task — nothing runs until the Board approves it."
            disabled={submitting}
            aria-describedby={intakeError ? `${ideaFieldId}-error` : undefined}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={projectFieldId}>
            Project (optional)
          </label>
          <select
            id={projectFieldId}
            className={styles.select}
            value={projectKey}
            onChange={(e) => setProjectKey(e.target.value)}
            disabled={submitting}
          >
            <option value="">Platform (unassigned)</option>
            {projects.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.submit} disabled={!canSubmit}>
            {submitting && <span className={styles.spinner} aria-hidden="true" />}
            {submitting ? 'Submitting…' : 'Submit idea'}
          </button>
          <button
            type="button"
            className={styles.board}
            onClick={conveneBoard}
            disabled={!canConvene}
            title={task ? 'Run the 9-persona Board on this idea' : 'Submit an idea first'}
          >
            {convening && <span className={styles.spinner} aria-hidden="true" />}
            {convening ? 'Convening…' : 'Convene Board'}
          </button>
        </div>

        <p className={styles.hint}>
          Ideas are recorded as proposed tasks — the Board gates promotion.
        </p>

        {intakeError && (
          <div id={`${ideaFieldId}-error`} className={styles.error} role="alert">
            {intakeError}
          </div>
        )}
      </form>

      {/* ── Readout column ─────────────────────────────────────────────── */}
      <div className={styles.readout} aria-live="polite">
        {!task && !intakeError && (
          <div className={styles.placeholder}>
            Awaiting an idea — the proposed task will appear here.
          </div>
        )}

        {task && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>{task.title}</span>
              <span className={styles.chip}>{task.status}</span>
            </div>
            <span className={styles.taskId}>id · {task.id}</span>
          </div>
        )}

        {boardError && (
          <div className={styles.error} role="alert">
            {boardError}
          </div>
        )}

        {board && (
          <div className={styles.verdict}>
            <div className={styles.verdictHead}>
              <span className={styles.verdictBadge} data-verdict={board.verdict}>
                {board.verdict}
              </span>
              <span className={styles.subhead}>Senior Board verdict</span>
            </div>

            {rationale && <p className={styles.rationale}>{rationale}</p>}

            {board.personas.length > 0 && (
              <ul className={styles.personaList}>
                {board.personas.map((p) => (
                  <li key={p.persona} className={styles.persona}>
                    <span className={styles.personaDot} data-stance={p.stance} aria-hidden="true" />
                    <span className={styles.personaBody}>
                      <span className={styles.personaName}>
                        {p.persona} · {p.stance}
                      </span>
                      <span className={styles.personaComment}>{p.comment}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {board.verdict === 'APPROVED' && (
              <>
                <span className={styles.subhead}>
                  Generated sub-tasks · {board.subtasks.length}
                </span>
                {board.subtasks.length > 0 ? (
                  <ul className={styles.subList}>
                    {board.subtasks.map((s, i) => (
                      <li key={s.id} className={styles.subItem}>
                        <span className={styles.subIndex}>{String(i + 1).padStart(2, '0')}</span>
                        <span className={styles.subTitle}>{s.title}</span>
                        <span className={styles.chip}>{s.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.personaComment}>
                    Approved, but no sub-tasks were generated.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
