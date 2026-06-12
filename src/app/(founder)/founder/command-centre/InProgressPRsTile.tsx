// src/app/(founder)/founder/command-centre/InProgressPRsTile.tsx
//
// Lane 16.5 — CRM Command-Centre tile: In-Progress PRs.
//
// Server component. Renders the most recent open PRs in the repo
// (across all authors), newest first. Renders honestly when the
// `gh` CLI is unavailable or the repo has no open PRs.
//
// Read-only. No mutations, no network calls beyond the lib helper.

import type { InProgressPR, InProgressPRsResult } from '@/lib/command-centre/in-progress-prs'

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return ''
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h`
  const d = Math.round(hr / 24)
  return `${d}d`
}

function hostOf(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

export function InProgressPRsTile({ data }: { data: InProgressPRsResult }) {
  if (data.entries.length === 0) {
    // Either `gh` is missing or there are genuinely no open PRs. The
    // NorthStar says surface the source; the empty state is honest.
    const tone = data.gh_available ? '#34d399' : '#fb923c'
    return (
      <p
        data-testid="in-progress-prs-tile-empty"
        style={{ color: tone, fontSize: '0.85rem', margin: 0 }}
      >
        {data.status_message} — <code style={{ fontSize: '0.78rem' }}>{data.gh_path}</code>
        {data.read_error && <span style={{ color: '#9bb0c1' }}> ({data.read_error})</span>}
      </p>
    )
  }

  return (
    <div data-testid="in-progress-prs-tile">
      <div
        style={{
          color: '#6f879b',
          fontSize: '0.72rem',
          marginBottom: '0.4rem',
        }}
      >
        {data.status_message}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.3rem' }}>
        {data.entries.map((pr: InProgressPR) => (
          <li
            key={pr.number}
            data-pr-number={pr.number}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'baseline',
              padding: '0.3rem 0.5rem',
              border: '1px solid rgba(56, 225, 255, 0.18)',
              borderLeft: '3px solid #38e1ff',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '2px',
              fontSize: '0.78rem',
            }}
          >
            <span
              style={{
                color: '#6f879b',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                minWidth: '3rem',
              }}
            >
              #{pr.number}
            </span>
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#e6f7ff', textDecoration: 'none' }}
            >
              {pr.title}
            </a>
            <span style={{ color: '#9bb0c1' }}>· @{pr.author}</span>
            <span style={{ color: '#9bb0c1' }}>· {pr.head_ref}</span>
            <span
              style={{
                marginLeft: 'auto',
                color: '#6f879b',
                fontSize: '0.7rem',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              {fmtRelative(pr.created_at)} ago · {hostOf(pr.url)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
