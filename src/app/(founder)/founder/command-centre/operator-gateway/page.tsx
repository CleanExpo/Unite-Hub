// src/app/(founder)/founder/command-centre/operator-gateway/page.tsx
//
// Unite-Group Nexus Command Centre — operator execution surface (SANDBOX JOB CREATION MODE).
// Founder-only via the (founder) layout. This page may create sandbox planned jobs only:
// no production DB writes, no external execution, no live runner, no API keys, no web-session scraping.

export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { getCommandCentreOperatorSurfaceView } from '@/lib/operator-gateway/command-centre'
import { getOperatorJobsView, getSandboxOperatorJobsClient } from '@/lib/operator-gateway/jobs'

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '2rem 1.25rem 3rem',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  color: '#e6edf3',
}
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1rem',
}
const card: React.CSSProperties = {
  background: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: 4,
  padding: '1rem 1.25rem',
  marginBottom: '1.25rem',
}
const banner: React.CSSProperties = {
  background: '#071b24',
  border: '1px solid #00F5FF',
  borderRadius: 4,
  padding: '0.85rem 1rem',
  marginBottom: '1.5rem',
  fontSize: 14,
}
const warning: React.CSSProperties = {
  background: '#271506',
  border: '1px solid #f97316',
  borderRadius: 4,
  padding: '0.85rem 1rem',
  marginBottom: '1.25rem',
  fontSize: 14,
}
const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#8b949e',
  padding: '0.45rem 0.6rem',
  borderBottom: '1px solid #30363d',
}
const td: React.CSSProperties = {
  padding: '0.55rem 0.6rem',
  borderBottom: '1px solid #21262d',
  fontSize: 14,
  verticalAlign: 'top',
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #30363d',
  borderRadius: 4,
  background: '#050505',
  color: '#8b949e',
  padding: '0.65rem 0.75rem',
}

function pill(tone: 'green' | 'red' | 'amber' | 'blue'): React.CSSProperties {
  const tones = {
    green: ['#12361f', '#3fb950', '#238636'],
    red: ['#3a1d1d', '#f85149', '#da3633'],
    amber: ['#3a300f', '#d29922', '#9e6a03'],
    blue: ['#071b24', '#00F5FF', '#00a3b5'],
  } as const
  const [bg, fg, bd] = tones[tone]
  return {
    display: 'inline-block',
    padding: '0.12rem 0.5rem',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: bg,
    color: fg,
    border: `1px solid ${bd}`,
    whiteSpace: 'nowrap',
  }
}

function boolLabel(value: boolean, safeWhenFalse = true) {
  const safe = safeWhenFalse ? !value : value
  return <span style={pill(safe ? 'green' : 'red')}>{value ? 'yes' : 'no'}</span>
}

export default async function OperatorGatewayPage() {
  const user = await getUser()
  const jobsView = user
    ? await getOperatorJobsView({ founderId: user.id, client: getSandboxOperatorJobsClient() })
    : undefined
  const view = getCommandCentreOperatorSurfaceView({ jobsView, sandboxJobCreationEnabled: true })
  const activeLanes = view.lanes.filter((lane) => lane.status === 'active')
  const inactiveLanes = view.lanes.filter((lane) => lane.status !== 'active')

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 28, marginBottom: '0.25rem' }}>Nexus Command Centre · Operator Execution Surface</h1>
      <p style={{ color: '#8b949e', marginTop: 0 }}>
        Founder-controlled command centre for Hermes, Codex Max, Claude Code Max, Cursor CLI, and registered Agentic Nexus skills.
      </p>

      <div style={banner}>
        <strong>Operator-session lanes only.</strong> No API keys. Max/Pro plans are not backend credentials. No external execution yet.
        The CRM may show lanes, plan jobs, display evidence, and expose blocked gates — it does not run Codex/Claude/Cursor/Hermes jobs from this page.
      </div>

      <div style={warning}>
        <strong>Production actions gated.</strong> Deployment, production DB writes, sandbox migration apply, web-session scraping,
        stored subscription credentials, browser automation, payments, email, claims, and orders remain blocked unless Phill grants a later named gate.
      </div>

      <section style={grid} aria-label="safety status">
        <div style={card}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Safety status</h2>
          <p>No API-key mode: {boolLabel(view.noApiKeyMode, false)}</p>
          <p>External execution enabled: {boolLabel(view.externalExecutionEnabled)}</p>
          <p>Production DB touched: {boolLabel(view.safetyStatus.productionDbTouched)}</p>
          <p>Deployment occurred: {boolLabel(view.safetyStatus.deploymentOccurred)}</p>
          <p>Web session scraping: {boolLabel(view.safetyStatus.webSessionScraping)}</p>
        </div>
        <div style={card}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Job queue</h2>
          <p>Sandbox persistence: {boolLabel(view.jobQueue.source === 'sandbox_select', false)}</p>
          <p>Production connected: {boolLabel(view.jobQueue.source === 'production', false)}</p>
          <p>Connected: {boolLabel(view.jobQueue.connected, false)}</p>
          <p>Source: <code>{view.jobQueue.source}</code></p>
          <p>Live runner enabled: {boolLabel(false)}</p>
          <p>Live execution: {boolLabel(view.jobQueue.liveExecution)}</p>
          <p>External execution disabled: {boolLabel(false, false)}</p>
          <p>Job creation enabled: {boolLabel(view.jobSubmission.enabled, false)}</p>
          <p>Jobs visible: <b>{view.jobQueue.jobCount}</b></p>
          {view.jobQueue.source === 'sandbox_select' && view.jobQueue.jobCount === 0 ? (
            <p style={{ color: '#3fb950', fontSize: 13 }}>Sandbox connected empty state: no operator jobs recorded yet.</p>
          ) : null}
          <p style={{ color: '#8b949e', fontSize: 13 }}>{view.jobQueue.note}</p>
        </div>
        <div style={card}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Board decision</h2>
          <p><b>{view.boardDecisionPanel.currentDecision}</b></p>
          <p>Status: <span style={pill('green')}>{view.boardDecisionPanel.status}</span></p>
          <p>Reviewer: {view.boardDecisionPanel.reviewer}</p>
          <p>Next Board gate: <b>{view.boardDecisionPanel.nextBoardGate}</b></p>
        </div>
      </section>

      <section style={card} aria-label="lane selector">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Lane selector</h2>
        <p style={{ color: '#8b949e', fontSize: 14 }}>
          {activeLanes.length} active lanes · {inactiveLanes.length} inactive/blocked lanes · all lanes visible · all lanes apiKeyRequired=false.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Lane</th>
              <th style={th}>Auth</th>
              <th style={th}>Status</th>
              <th style={th}>External</th>
              <th style={th}>Production</th>
              <th style={th}>Blocked reason</th>
            </tr>
          </thead>
          <tbody>
            {view.lanes.map((lane) => (
              <tr key={lane.laneId}>
                <td style={td}>
                  <b>{lane.displayName}</b>
                  <div style={{ color: '#8b949e', fontSize: 12 }}>{lane.laneId} · {lane.tool}</div>
                  <div style={{ color: '#3fb950', fontSize: 12 }}>{lane.safetyLabel}</div>
                </td>
                <td style={td}>{lane.authMode}</td>
                <td style={td}><span style={pill(lane.status === 'active' ? 'green' : 'amber')}>{lane.status}</span></td>
                <td style={td}>{boolLabel(lane.externalActionAllowed)}</td>
                <td style={td}>{boolLabel(lane.productionActionAllowed)}</td>
                <td style={td}>{lane.blockedReason ?? 'ready for safe local planning only'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={grid}>
        <div style={card} aria-label="new sandbox job form">
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Create sandbox job · sandbox job creation enabled</h2>
          <p style={{ color: '#3fb950', fontSize: 14 }}>{view.jobSubmission.disabledReason}</p>
          <p style={{ color: '#f97316', fontSize: 13 }}>
            Hard-gate warning: production DB writes, deployment, API-key requests, payments, email, claims, orders, external execution, and live runner activation are refused.
          </p>
          <form method="post" action="/api/hermes/operator-gateway/jobs">
            <label style={{ display: 'block', marginBottom: '0.7rem' }}>
              <span style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4 }}>Lane</span>
              <select name="laneId" required style={{ ...inputStyle, color: '#e6edf3' }} defaultValue="hermes_local">
                {view.lanes.map((lane) => <option key={lane.laneId} value={lane.laneId}>{lane.laneId}</option>)}
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: '0.7rem' }}>
              <span style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4 }}>Job title</span>
              <input name="title" required minLength={3} maxLength={160} style={{ ...inputStyle, color: '#e6edf3' }} placeholder="Sandbox-only planned job" />
            </label>
            <label style={{ display: 'block', marginBottom: '0.7rem' }}>
              <span style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4 }}>Task type</span>
              <select name="taskType" required style={{ ...inputStyle, color: '#e6edf3' }} defaultValue="documentation">
                {view.jobSubmission.allowedTaskTypes.map((task) => <option key={task} value={task}>{task}</option>)}
              </select>
            </label>
            <input type="hidden" name="externalActionRequested" value="false" />
            <input type="hidden" name="productionActionRequested" value="false" />
            <input type="hidden" name="apiKeyRequested" value="false" />
            <button type="submit" style={{ ...inputStyle, color: '#3fb950', fontWeight: 700 }}>Create sandbox job</button>
          </form>
          <p style={{ color: '#8b949e', fontSize: 12 }}>
            This creates a sandbox `operator_jobs` row only. It does not execute the job and does not connect production.
          </p>
        </div>

        <div style={card} aria-label="sandbox job queue">
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Sandbox job queue</h2>
          {jobsView?.jobs.length ? jobsView.jobs.map((job) => (
            <div key={job.id} style={{ borderBottom: '1px solid #21262d', padding: '0.6rem 0' }}>
              <div><b>{job.title}</b> <span style={pill('blue')}>{job.status}</span></div>
              <div style={{ color: '#8b949e', fontSize: 13 }}>{job.laneId} · {job.taskType}</div>
              <div style={{ color: '#3fb950', fontSize: 12 }}>apiKeyRequested=false · externalExecution=false · liveRunner=false</div>
            </div>
          )) : <p style={{ color: '#8b949e', fontSize: 14 }}>No sandbox jobs visible yet. Created jobs appear here after refresh.</p>}
        </div>

        <div style={card} aria-label="senior pm next action queue">
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Senior PM next action queue</h2>
          {view.seniorPmQueue.items.map((item) => (
            <div key={item.id} style={{ borderBottom: '1px solid #21262d', padding: '0.6rem 0' }}>
              <div><b>{item.title}</b> <span style={pill(item.status === 'completed' ? 'green' : 'amber')}>{item.status}</span></div>
              <div style={{ color: '#8b949e', fontSize: 13 }}>{item.nextAction}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={grid}>
        <div style={card} aria-label="hard gates">
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Hard-gate warnings</h2>
          {view.blockedGates.map((gate) => (
            <div key={gate.gateId} style={{ marginBottom: '0.8rem' }}>
              <span style={pill(gate.status === 'blocked' ? 'red' : 'amber')}>{gate.status}</span>{' '}
              <b>{gate.gateId}</b>
              <p style={{ color: '#8b949e', fontSize: 13, margin: '0.25rem 0 0' }}>{gate.reason}</p>
            </div>
          ))}
        </div>

        <div style={card} aria-label="daily ops status">
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Daily ops panel</h2>
          <p>Source: <code>{view.dailyOps.source}</code></p>
          <p>External dispatch enabled: {boolLabel(view.dailyOps.externalDispatchEnabled)}</p>
          <ul style={{ color: '#8b949e', fontSize: 14 }}>
            {view.dailyOps.panels.map((panel) => <li key={panel}>{panel}</li>)}
          </ul>
          <p style={{ color: '#8b949e', fontSize: 13 }}>{view.dailyOps.note}</p>
        </div>
      </section>

      <section style={card} aria-label="evidence and audit links">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Evidence / audit links</h2>
        <div style={grid}>
          {view.evidencePointers.map((pointer) => (
            <div key={pointer.href} style={{ border: '1px solid #21262d', borderRadius: 4, padding: '0.75rem' }}>
              <b>{pointer.label}</b>
              <div style={{ color: '#8b949e', fontSize: 12 }}>{pointer.source}</div>
              <code style={{ fontSize: 12 }}>{pointer.href}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
