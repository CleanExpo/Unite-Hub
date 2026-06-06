// src/app/(founder)/founder/command-centre/hermes-control-panel/page.tsx
//
// Hermes v0.16 "Surface Release" — Control Panel (READ-ONLY foundation).
// Mirrors the Hermes web admin module list inside the Unite-Group founder command-centre.
// No external connections, no MCP, no remote gateway, no messaging-channel activation,
// no secret values. Every external surface renders as inert (not connected / none enabled).
// Auth enforced by the (founder) layout.

export const dynamic = 'force-dynamic'

import { getControlPanelView } from '@/lib/operator-gateway/control-panel'

const wrap: React.CSSProperties = {
  maxWidth: 1040,
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
  verticalAlign: 'top',
}

function riskStyle(risk: string): React.CSSProperties {
  const map: Record<string, [string, string, string]> = {
    none: ['#12361f', '#3fb950', '#238636'],
    low: ['#3a300f', '#d29922', '#9e6a03'],
    high: ['#3a1d1d', '#f85149', '#da3633'],
  }
  const [bg, fg, bd] = map[risk] ?? map.none
  return {
    display: 'inline-block',
    padding: '0.1rem 0.5rem',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: bg,
    color: fg,
    border: `1px solid ${bd}`,
  }
}

export default function HermesControlPanelPage() {
  const view = getControlPanelView()
  const v = view.version

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 24, marginBottom: '0.25rem' }}>Hermes Control Panel</h1>
      <p style={{ color: '#8b949e', marginTop: 0 }}>
        Hermes Agent v{v.version} · {v.releaseName} ({v.release}) · config format {v.configFormat}
      </p>

      <div style={banner}>
        <strong>Read-only foundation.</strong> {view.note}
      </div>

      {/* ── Security / version posture ─────────────────────────────── */}
      <div style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Security &amp; version posture</h2>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: 14 }}>
          <span>Secret redaction: <b style={{ color: '#3fb950' }}>{v.securityPosture.secretRedaction}</b></span>
          <span>Subprocess cred stripping: <b style={{ color: '#3fb950' }}>{v.securityPosture.subprocessCredentialStripping}</b></span>
          <span>SSRF hardening: <b style={{ color: '#3fb950' }}>{v.securityPosture.ssrfHardening}</b></span>
          <span>CVE pinning: <b style={{ color: '#3fb950' }}>{v.securityPosture.cveSecurityPinning}</b></span>
          <span>Leaner skill set: <b>{v.securityPosture.leanerSkillSet}</b></span>
          <span>NVIDIA tap: <b>{v.securityPosture.nvidiaTap}</b></span>
        </div>
      </div>

      {/* ── Connection invariants ──────────────────────────────────── */}
      <div style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Connection state</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: 14 }}>
          <span>Live connections: <b style={{ color: '#3fb950' }}>{view.liveConnections ? 'yes' : 'no'}</b></span>
          <span>External channels enabled: <b style={{ color: '#3fb950' }}>{view.externalChannelsEnabled ? 'yes' : 'no'}</b></span>
          <span>MCP connected: <b style={{ color: '#3fb950' }}>{view.mcpConnected ? 'yes' : 'no'}</b></span>
          <span>Remote gateway connected: <b style={{ color: '#3fb950' }}>{view.remoteGatewayConnected ? 'yes' : 'no'}</b></span>
          <span>Credentials exposed: <b style={{ color: '#3fb950' }}>{view.credentialsExposed ? 'yes' : 'no'}</b></span>
        </div>
      </div>

      {/* ── Modules ────────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>
          Surface-Release modules ({view.moduleCount}) · {view.modulesImplementableNow} now ·{' '}
          {view.modulesRequiringLaterApproval} need later approval · {view.highRiskGatedCount} high-risk gated
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Module</th>
              <th style={th}>Hermes feature</th>
              <th style={th}>State</th>
              <th style={th}>Ext. risk</th>
              <th style={th}>Later approval</th>
            </tr>
          </thead>
          <tbody>
            {view.modules.map((m) => (
              <tr key={m.moduleId}>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  <div style={{ color: '#8b949e', fontSize: 12 }}>{m.note}</div>
                </td>
                <td style={td}>{m.hermesFeature}</td>
                <td style={td}>{m.state}</td>
                <td style={td}>
                  <span style={riskStyle(m.externalActionRisk)}>{m.externalActionRisk}</span>
                </td>
                <td style={td}>{m.requiresLaterApproval ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Credential boundary (status only) ──────────────────────── */}
      <div style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Credential boundary</h2>
        <p style={{ color: '#8b949e', fontSize: 13, marginTop: 0 }}>
          Boundary names and status only — no secret values are ever displayed.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Boundary</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {view.credentialBoundaries.map((c) => (
              <tr key={c.boundary}>
                <td style={td}>{c.boundary}</td>
                <td style={td}>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
