// src/app/(founder)/founder/command-centre/BlockedLanesTile.tsx
//
// Lane 16 — CRM Command-Centre tile: Blocked Lanes.
//
// Server component. Renders the lanes from
// 2nd-brain/.agentic_nexus/ACTIVE_PROGRAMME_BACKLOG.md whose "Autonomous"
// column indicates they are blocked or gated (i.e. need a Phill grant).
//
// Read-only. If the file is missing or malformed, render a clear
// empty/error state with the file path visible.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parseMarkdownTable, findColumnIndex } from '@/lib/command-centre/markdown'

function defaultPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  return path.join(home, '2nd-brain', '.agentic_nexus', 'ACTIVE_PROGRAMME_BACKLOG.md')
}

export interface BlockedLaneRow {
  /** Lane number, parsed as integer; null if the column is missing. */
  number: number | null
  /** Lane name. */
  name: string
  /** Current status. */
  status: string
  /** The "Next action" cell. */
  next_action: string
  /** The "Required authority" cell. */
  required_authority: string
  /** The "Autonomous" cell, lowercased. */
  autonomous: string
}

export interface BlockedLanesData {
  backlog_path: string
  scanned_at: string
  total_lanes: number
  blocked_count: number
  rows: BlockedLaneRow[]
  read_error: string | null
}

/** Return true if the lane is blocked or gated (not autonomous). */
export function isBlocked(autonomous: string): boolean {
  const lower = autonomous.toLowerCase()
  return lower.startsWith('no') || lower.includes('blocked') || lower.includes('partial')
}

/** Server-side loader. NEVER throws; returns a structured result with read_error populated. */
export async function loadBlockedLanesData(
  backlogPath: string = defaultPath(),
  now: () => Date = () => new Date(),
): Promise<BlockedLanesData> {
  try {
    const raw = await readFile(backlogPath, 'utf-8')
    const t = parseMarkdownTable(raw)
    if (!t) {
      return {
        backlog_path: backlogPath,
        scanned_at: now().toISOString(),
        total_lanes: 0,
        blocked_count: 0,
        rows: [],
        read_error: 'No parseable markdown table found in the file',
      }
    }
    const idxName = findColumnIndex(t.headers, 'lane')
    const idxStatus = findColumnIndex(t.headers, 'status')
    const idxNext = findColumnIndex(t.headers, 'next action')
    const idxAuth = findColumnIndex(t.headers, 'authority')
    const idxAuto = findColumnIndex(t.headers, 'autonomous')
    const idxNum = findColumnIndex(t.headers, '#')

    if (idxName < 0 || idxAuto < 0) {
      return {
        backlog_path: backlogPath,
        scanned_at: now().toISOString(),
        total_lanes: 0,
        blocked_count: 0,
        rows: [],
        read_error: 'Required columns (Lane, Autonomous) not found in the table',
      }
    }

    const allRows = t.rows
      .map((r): BlockedLaneRow | null => {
        const name = r[idxName] ?? ''
        const autonomous = r[idxAuto] ?? ''
        if (!name) return null
        const numStr = idxNum >= 0 ? r[idxNum] ?? '' : ''
        const parsedNum = numStr.trim().length > 0 ? Number.parseInt(numStr.trim(), 10) : NaN
        return {
          number: Number.isFinite(parsedNum) ? parsedNum : null,
          name,
          status: idxStatus >= 0 ? r[idxStatus] ?? '' : '',
          next_action: idxNext >= 0 ? r[idxNext] ?? '' : '',
          required_authority: idxAuth >= 0 ? r[idxAuth] ?? '' : '',
          autonomous,
        }
      })
      .filter((r): r is BlockedLaneRow => r !== null)

    const blocked = allRows.filter((r) => isBlocked(r.autonomous))

    return {
      backlog_path: backlogPath,
      scanned_at: now().toISOString(),
      total_lanes: allRows.length,
      blocked_count: blocked.length,
      rows: blocked,
      read_error: null,
    }
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err)
    return {
      backlog_path: backlogPath,
      scanned_at: now().toISOString(),
      total_lanes: 0,
      blocked_count: 0,
      rows: [],
      read_error: reason,
    }
  }
}

export function BlockedLanesTile({ data }: { data: BlockedLanesData }) {
  if (data.read_error) {
    return (
      <p
        data-testid="blocked-lanes-tile-error"
        style={{ color: '#fb923c', fontSize: '0.85rem', margin: 0 }}
      >
        Could not read backlog at <code>{data.backlog_path}</code>: {data.read_error}
      </p>
    )
  }
  if (data.rows.length === 0) {
    return (
      <p
        data-testid="blocked-lanes-tile-empty"
        style={{ color: '#34d399', fontSize: '0.85rem', margin: 0 }}
      >
        No blocked or gated lanes — {data.total_lanes} lanes total, all autonomous or done.
      </p>
    )
  }

  return (
    <div data-testid="blocked-lanes-tile">
      <div
        style={{
          color: '#fb923c',
          fontSize: '0.72rem',
          marginBottom: '0.3rem',
        }}
      >
        {data.blocked_count} of {data.total_lanes} lanes need Phill action
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
        {data.rows.map((r) => (
          <li
            key={`${r.number}-${r.name}`}
            style={{
              border: '1px solid rgba(251, 146, 60, 0.25)',
              borderLeft: '3px solid #fb923c',
              padding: '0.4rem 0.6rem',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '2px',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
              {r.number !== null && (
                <span style={{ color: '#6f879b', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                  #{r.number}
                </span>
              )}
              <span style={{ fontWeight: 600, color: '#e6f7ff' }}>{r.name}</span>
              <span style={{ color: '#9bb0c1' }}>· {r.status}</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.66rem',
                  color: '#6f879b',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                autonomous: {r.autonomous}
              </span>
            </div>
            {(r.next_action || r.required_authority) && (
              <div
                style={{
                  marginTop: '0.3rem',
                  color: '#9bb0c1',
                  fontSize: '0.72rem',
                }}
              >
                {r.next_action && <span>Next: {r.next_action}</span>}
                {r.next_action && r.required_authority && <span> · </span>}
                {r.required_authority && <span>Authority: {r.required_authority}</span>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
