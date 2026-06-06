// src/app/(founder)/founder/command-centre/operator-gateway/page.tsx
//
// Model Operator Gateway — founder command-centre surface (READ-ONLY foundation).
// Renders the operator lane roster + the (sandbox-first) jobs view. No mutations,
// no job runner, no tool invocation, no external calls. Auth enforced by the
// (founder) layout. The jobs table is sandbox-first and not yet applied, so the
// jobs panel shows a "not connected" state by design.

export const dynamic = 'force-dynamic'

import { getGatewayStatus, getOperatorLanes } from '@/lib/operator-gateway/lanes'
import { getOperatorJobsView } from '@/lib/operator-gateway/jobs'

const wrap: React.CSSProperties = {
  maxWidth: 980,
  margin: '0 auto',
  padding: '2rem 1.25rem',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  color: '#e6edf3',
}
const card: React.CSSProperties = {
  background: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: 10,
  padding: '1rem 1.25rem',
  marginBottom: '1.25rem',
}
const banner: React.CSSProperties = {
  background: '#15233b',
  border: '1px solid #1f6feb',
  borderRadius: 10,
  padding: '0.75rem 1rem',
  marginBottom: '1.5rem',
  fontSize: 14,
}
const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#8b949e',
  padding: '0.4rem 0.6rem',
  borderBottom: '1px solid #30363d',
}
const td: React.CSSProperties = {
  padding: '0.5rem 0.6rem',
  borderBottom: '1px solid #21262d',
  fontSize: 14,
}

function badge(active: boolean): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '0.1rem 0.5rem',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: active ? '#12361f' : '#3a1d1d',
    color: active ? '#3fb950' : '#f85149',
    border: `1px solid ${active ? '#238636' : '#da3633'}`,
  }
}

export default function OperatorGatewayPage() {
  const status = getGatewayStatus()
  const lanes = getOperatorLanes()
  const jobsView = getOperatorJobsView()

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 24, marginBottom: '0.25rem' }}>Model Operator Gateway</h1>
      <p style={{ color: '#8b949e', marginTop: 0 }}>
        Operator-side CLI / session execution lanes. No API keys, no backend credentials.
      </p>

      <div style={banner}>
        <strong>Foundation — read-only.</strong> No live operator execution. The
        operator_jobs / operator_events tables are sandbox-first and not yet applied.
        This surface records and displays; it does not run anything.
      </div>

      {/* ── Status summary ─────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Gateway status</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: 14 }}>
          <span>Lanes: <b>{status.laneCount}</b></span>
          <span>Active: <b style={{ color: '#3fb950' }}>{status.activeLaneCount}</b></span>
          <span>Blocked / unavailable: <b>{status.blockedOrUnavailableLaneCount}</b></span>
          <span>Max-plan lanes: <b>{status.maxPlanLaneCount}</b></span>
          <span>
            No-API-key mode:{' '}
            <b style={{ color: status.noApiKeyMode ? '#3fb950' : '#f85149' }}>
              {status.noApiKeyMode ? 'yes' : 'no'}
            </b>
          </span>
          <span>
            Any API-key lane:{' '}
            <b style={{ color: status.anyApiKeyLane ? '#f85149' : '#3fb950' }}>
              {status.anyApiKeyLane ? 'yes' : 'no'}
            </b>
          </span>
        </div>
      </div>

      {/* ── Lane roster ────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Lane roster</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Lane</th>
              <th style={th}>Provider</th>
              <th style={th}>Auth mode</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {lanes.map((l) => (
              <tr key={l.laneId}>
                <td style={td}>{l.laneId}</td>
                <td style={td}>{l.provider}</td>
                <td style={td}>{l.authMode}</td>
                <td style={td}>
                  <span style={badge(l.status === 'active')}>{l.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Jobs (sandbox-first; not connected) ────────────────────── */}
      <div style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Operator jobs</h2>
        <p style={{ color: '#8b949e', fontSize: 14, marginTop: 0 }}>
          Source: <code>{jobsView.source}</code> · Live execution:{' '}
          <b>{jobsView.liveExecution ? 'yes' : 'no'}</b> · Jobs: <b>{jobsView.jobCount}</b>
        </p>
        {jobsView.jobs.length === 0 ? (
          <p style={{ fontSize: 14, color: '#8b949e' }}>{jobsView.note}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Title</th>
                <th style={th}>Lane</th>
                <th style={th}>Task type</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobsView.jobs.map((j) => (
                <tr key={j.id}>
                  <td style={td}>{j.title}</td>
                  <td style={td}>{j.laneId}</td>
                  <td style={td}>{j.taskType}</td>
                  <td style={td}>{j.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
