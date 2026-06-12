// src/app/(founder)/founder/command-centre/OperatingHealthTile.tsx
//
// Lane 16 — CRM Command-Centre tile: Operating System Health.
//
// Server component (no 'use client'). Renders a compact status card per
// latest_*.json file in 2nd-brain/.agentic_nexus/dashboard/.
//
// Read-only. Surfaces the source path on every card so a missing or
// malformed JSON is visible, not hidden (per the NorthStar "200 != real"
// doctrine — never fall back to mock data).

import type { DashboardSummary, DashboardSummaryResult } from '@/lib/command-centre/dashboard-summary'

function statusColor(s: DashboardSummary['status']): string {
  switch (s) {
    case 'RED':
      return '#f87171'
    case 'AMBER':
      return '#fbbf24'
    case 'GREEN':
    case 'PASS':
      return '#34d399'
    case 'DRAFT_FOR_REVIEW':
      return '#a78bfa'
    default:
      return '#6f879b'
  }
}

function severityLabel(s: DashboardSummary['severity']): string {
  return s === 'unknown' ? '' : s
}

function shortPath(p: string): string {
  // Trim to last 2 path segments for compactness in the card footer.
  const parts = p.split('/')
  return parts.length <= 2 ? p : `…/${parts.slice(-2).join('/')}`
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return ''
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.round(hr / 24)
  return `${d}d ago`
}

export function OperatingHealthTile({ data }: { data: DashboardSummaryResult }) {
  const sorted = [...data.entries].sort((a, b) => {
    // RED first, then AMBER, then GREEN/PASS, then unknown/error. Within
    // each bucket, sort alphabetically by id.
    const rank = (s: DashboardSummary['status'], err: string | null): number => {
      if (err) return 4
      if (s === 'RED') return 0
      if (s === 'AMBER') return 1
      if (s === 'GREEN' || s === 'PASS') return 2
      if (s === 'DRAFT_FOR_REVIEW') return 3
      return 4
    }
    const ra = rank(a.status, a.read_error)
    const rb = rank(b.status, b.read_error)
    if (ra !== rb) return ra - rb
    return a.id.localeCompare(b.id)
  })

  return (
    <div
      data-testid="operating-health-tile"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '0.5rem',
      }}
    >
      {sorted.map((e) => {
        const color = statusColor(e.status)
        const sev = severityLabel(e.severity)
        return (
          <article
            key={e.id}
            data-status={e.status}
            data-severity={e.severity}
            data-read-error={e.read_error ?? ''}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: `3px solid ${color}`,
              padding: '0.5rem 0.6rem',
              fontSize: '0.78rem',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '2px',
            }}
          >
            <header style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600, color: '#e6f7ff' }}>{e.title}</span>
            </header>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '0.25rem',
                color: '#9bb0c1',
                fontSize: '0.7rem',
              }}
            >
              <span>{e.status}</span>
              {sev && <span>· {sev}</span>}
              <span>· {relativeTime(e.updated_at) || 'unknown'}</span>
            </div>
            {e.read_error && (
              <p
                style={{
                  marginTop: '0.3rem',
                  color: '#fb923c',
                  fontSize: '0.7rem',
                  wordBreak: 'break-word',
                }}
              >
                read error: {e.read_error}
              </p>
            )}
            <footer
              title={e.source_path}
              style={{
                marginTop: '0.3rem',
                color: '#6f879b',
                fontSize: '0.66rem',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {shortPath(e.source_path)}
            </footer>
          </article>
        )
      })}
    </div>
  )
}
