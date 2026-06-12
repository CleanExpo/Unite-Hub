// src/app/(founder)/founder/command-centre/EvidenceStreamTile.tsx
//
// Lane 16 — CRM Command-Centre tile: Live Evidence Stream.
//
// Server component. Renders the most recent N entries from the evidence
// ledger, newest first. Read-only.

import type { EvidenceEntry, EvidenceStreamResult } from '@/lib/command-centre/evidence-stream'

function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  // Render the ISO timestamp in a compact "YYYY-MM-DD HH:MM:SS UTC" form
  // for the compact table. Truncates the trailing milliseconds and the
  // 'Z' marker. Defensive: if the ISO is malformed, return as-is.
  if (!/^\d{4}-\d{2}-\d{2}T/.test(iso)) return iso
  return iso.replace('T', ' ').replace(/\.\d+Z$/, ' UTC')
}

function shortSha(sha: string | null): string {
  if (!sha) return ''
  return sha.length > 7 ? sha.slice(0, 7) : sha
}

export function EvidenceStreamTile({ data }: { data: EvidenceStreamResult }) {
  if (data.entries.length === 0 && data.malformed_lines === 0 && data.total_lines === 0) {
    return (
      <p
        data-testid="evidence-stream-tile-empty"
        style={{ color: '#9bb0c1', fontSize: '0.85rem', margin: 0 }}
      >
        No evidence entries yet at{' '}
        <code style={{ fontSize: '0.78rem' }}>{data.ledger_path}</code>
      </p>
    )
  }

  return (
    <div data-testid="evidence-stream-tile">
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          color: '#6f879b',
          fontSize: '0.72rem',
          marginBottom: '0.4rem',
        }}
      >
        <span>{data.total_lines} total lines</span>
        <span>· {data.parsed_lines} parsed</span>
        {data.malformed_lines > 0 && (
          <span style={{ color: '#fb923c' }}>· {data.malformed_lines} malformed (skipped)</span>
        )}
        <span>· {data.entries.length} shown</span>
      </div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.78rem',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        <thead>
          <tr style={{ color: '#6f879b', textAlign: 'left' }}>
            <th style={{ padding: '0.2rem 0.4rem', fontWeight: 500 }}>timestamp</th>
            <th style={{ padding: '0.2rem 0.4rem', fontWeight: 500 }}>event</th>
            <th style={{ padding: '0.2rem 0.4rem', fontWeight: 500 }}>repo</th>
            <th style={{ padding: '0.2rem 0.4rem', fontWeight: 500 }}>ref</th>
            <th style={{ padding: '0.2rem 0.4rem', fontWeight: 500 }}>sha</th>
          </tr>
        </thead>
        <tbody>
          {data.entries.map((e: EvidenceEntry) => (
            <tr key={e.line_index} data-line-index={e.line_index}>
              <td style={{ padding: '0.2rem 0.4rem', color: '#9bb0c1' }}>{fmtTime(e.timestamp)}</td>
              <td style={{ padding: '0.2rem 0.4rem', color: '#e6f7ff' }}>{e.event ?? e.event_type ?? '—'}</td>
              <td style={{ padding: '0.2rem 0.4rem', color: '#9bb0c1' }}>{e.repo ?? '—'}</td>
              <td style={{ padding: '0.2rem 0.4rem', color: '#9bb0c1' }}>{e.head_ref ?? '—'}</td>
              <td style={{ padding: '0.2rem 0.4rem', color: '#9bb0c1' }}>{shortSha(e.head_sha) || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
