/**
 * Hermes v0.16 "Surface Release" — Control Panel capability registry (static, read-only).
 *
 * Maps the Hermes Agent v0.16.0 Surface-Release feature areas to Unite-Group Control
 * Panel modules as a READ-ONLY status surface. This file performs NO external calls, opens
 * NO connections, reads NO secrets, and activates NOTHING. Every high-risk surface (remote
 * gateway, MCP catalog, messaging channels, hooks/webhooks) is represented as inert:
 * connected = false / enabled = false / status 'design_only'. Live wiring of any module is
 * a separate, explicitly-gated Board decision.
 *
 * Safety invariants enforced at the type/data level:
 *  - no module is 'active' for an external surface (externalActionRisk modules stay gated);
 *  - the credential boundary carries STATUS STRINGS ONLY — never a secret value;
 *  - externalChannelsEnabled / mcpConnected / remoteGatewayConnected are literal false.
 */

export type ModuleState =
  | 'read_only' // surfaced, no action possible
  | 'planned' // designed, not built live
  | 'design_only' // stubbed; live wiring is a later gate
  | 'available_not_installed' // capability exists but not installed/connected (operator action)
  | 'not_connected' // external surface deliberately not connected
  | 'none_enabled' // external surface deliberately has nothing enabled

export type ExternalActionRisk = 'none' | 'low' | 'high'

export interface HermesControlPanelModule {
  moduleId: string
  title: string
  hermesFeature: string
  state: ModuleState
  externalActionRisk: ExternalActionRisk
  implementableNow: boolean
  requiresLaterApproval: boolean
  note: string
}

export const HERMES_VERSION = '0.16.0'
export const HERMES_RELEASE = '2026.6.5'
export const HERMES_RELEASE_NAME = 'The Surface Release'
export const HERMES_CONFIG_FORMAT = 27

export interface HermesVersionStatus {
  source: 'static_registry'
  version: string
  release: string
  releaseName: string
  configFormat: number
  securityPosture: {
    secretRedaction: 'on'
    subprocessCredentialStripping: 'on'
    ssrfHardening: 'on'
    cveSecurityPinning: 'on'
    leanerSkillSet: 'adopted'
    nvidiaTap: 'available_not_installed'
  }
}

export function getHermesVersionStatus(): HermesVersionStatus {
  return {
    source: 'static_registry',
    version: HERMES_VERSION,
    release: HERMES_RELEASE,
    releaseName: HERMES_RELEASE_NAME,
    configFormat: HERMES_CONFIG_FORMAT,
    securityPosture: {
      secretRedaction: 'on',
      subprocessCredentialStripping: 'on',
      ssrfHardening: 'on',
      cveSecurityPinning: 'on',
      leanerSkillSet: 'adopted',
      nvidiaTap: 'available_not_installed',
    },
  }
}

export const HERMES_CONTROL_PANEL_MODULES: readonly HermesControlPanelModule[] = [
  {
    moduleId: 'desktop_session_status',
    title: 'Desktop session status',
    hermesFeature: 'Hermes Desktop app',
    state: 'read_only',
    externalActionRisk: 'none',
    implementableNow: true,
    requiresLaterApproval: false,
    note: 'Derived from the hermes_local lane (active, local_runtime). No live presence control.',
  },
  {
    moduleId: 'remote_gateway_registry',
    title: 'Remote gateway registry',
    hermesFeature: 'Remote Hermes gateway + gateway list',
    state: 'design_only',
    externalActionRisk: 'high',
    implementableNow: true,
    requiresLaterApproval: true,
    note: '0 registered workers, not connected. Connecting a remote gateway is a later named-grant gate.',
  },
  {
    moduleId: 'web_admin_console',
    title: 'Web admin console',
    hermesFeature: 'Web dashboard admin panel',
    state: 'read_only',
    externalActionRisk: 'none',
    implementableNow: true,
    requiresLaterApproval: false,
    note: 'This founder Control Panel page mirrors the Hermes web admin module list.',
  },
  {
    moduleId: 'mcp_catalog_manager',
    title: 'MCP catalog manager',
    hermesFeature: 'MCP catalog admin',
    state: 'design_only',
    externalActionRisk: 'high',
    implementableNow: true,
    requiresLaterApproval: true,
    note: 'Catalogue stub, 0 servers, not connected. Connecting an MCP server is a later gate.',
  },
  {
    moduleId: 'messaging_channels_manager',
    title: 'Messaging channels manager',
    hermesFeature: 'Channels page',
    state: 'none_enabled',
    externalActionRisk: 'high',
    implementableNow: true,
    requiresLaterApproval: true,
    note: 'No external channels enabled. Enabling any channel is a later gate.',
  },
  {
    moduleId: 'credential_boundary_dashboard',
    title: 'Credential boundary dashboard',
    hermesFeature: 'Credentials management + subprocess credential stripping',
    state: 'read_only',
    externalActionRisk: 'none',
    implementableNow: true,
    requiresLaterApproval: false,
    note: 'Boundary names + status strings only; NEVER secret values. Reflects BLOCKED-OP sandbox state textually.',
  },
  {
    moduleId: 'hooks_webhooks_manager',
    title: 'Hooks / webhooks manager',
    hermesFeature: 'Webhooks / hooks',
    state: 'none_enabled',
    externalActionRisk: 'high',
    implementableNow: true,
    requiresLaterApproval: true,
    note: '0 webhooks, 0 hooks. Creating/enabling a live hook is a later gate.',
  },
  {
    moduleId: 'memory_second_brain_sync',
    title: 'Memory / 2nd-Brain sync panel',
    hermesFeature: 'Memory configuration',
    state: 'read_only',
    externalActionRisk: 'none',
    implementableNow: true,
    requiresLaterApproval: false,
    note: 'Built-in memory; 2nd-Brain (.agentic_nexus) sync is local_only. External memory provider = new-vendor gate.',
  },
  {
    moduleId: 'model_lane_picker',
    title: 'Model / lane picker',
    hermesFeature: 'Fuzzy model picker',
    state: 'read_only',
    externalActionRisk: 'none',
    implementableNow: true,
    requiresLaterApproval: false,
    note: 'Reuses the operator lane registry. Switching a live operator model is a later gate.',
  },
  {
    moduleId: 'skill_hygiene_panel',
    title: 'Skill hygiene panel',
    hermesFeature: 'Leaner skill set + curator',
    state: 'read_only',
    externalActionRisk: 'none',
    implementableNow: true,
    requiresLaterApproval: false,
    note: 'Leaner skill set adopted; curator governs agent-created skills. Read-only posture.',
  },
  {
    moduleId: 'trusted_skills_tap_registry',
    title: 'Trusted skills tap registry',
    hermesFeature: 'Trusted NVIDIA skills tap',
    state: 'available_not_installed',
    externalActionRisk: 'low',
    implementableNow: true,
    requiresLaterApproval: true,
    note: 'Default taps only; NVIDIA trusted tap available but NOT installed (no auto-install).',
  },
  {
    moduleId: 'undo_recovery_panel',
    title: 'Undo / recovery panel',
    hermesFeature: '/undo [N] + checkpoints',
    state: 'read_only',
    externalActionRisk: 'none',
    implementableNow: true,
    requiresLaterApproval: false,
    note: 'Surfaces undo + checkpoint availability. Invoking recovery from the panel is a later gate.',
  },
  {
    moduleId: 'security_version_compliance',
    title: 'Security / version compliance panel',
    hermesFeature: 'Security hardening, SSRF, CVE pinning, Debug Share',
    state: 'read_only',
    externalActionRisk: 'none',
    implementableNow: true,
    requiresLaterApproval: false,
    note: 'Shows version 0.16.0, config format 27, and security posture flags. Display only.',
  },
] as const

export function getControlPanelModules(): readonly HermesControlPanelModule[] {
  return HERMES_CONTROL_PANEL_MODULES
}

/** Credential boundary — STATUS STRINGS ONLY. Never carries a secret value. */
export interface CredentialBoundary {
  boundary: string
  status: string
}

export const CREDENTIAL_BOUNDARIES: readonly CredentialBoundary[] = [
  { boundary: 'op_sandbox', status: 'BLOCKED-OP (1Password CLI auth not green)' },
  { boundary: 'prod_secrets', status: 'not_read' },
  { boundary: 'api_keys', status: 'none (no-API-key operator gateway principle)' },
] as const

export interface HermesControlPanelView {
  source: 'static_registry'
  liveConnections: false
  externalChannelsEnabled: false
  mcpConnected: false
  remoteGatewayConnected: false
  credentialsExposed: false
  version: HermesVersionStatus
  moduleCount: number
  modulesImplementableNow: number
  modulesRequiringLaterApproval: number
  highRiskGatedCount: number
  modules: HermesControlPanelModule[]
  credentialBoundaries: CredentialBoundary[]
  note: string
}

/**
 * Read-only Control Panel view. No external connections, no secret values, nothing active.
 */
export function getControlPanelView(): HermesControlPanelView {
  const modules = getControlPanelModules()
  return {
    source: 'static_registry',
    liveConnections: false,
    externalChannelsEnabled: false,
    mcpConnected: false,
    remoteGatewayConnected: false,
    credentialsExposed: false,
    version: getHermesVersionStatus(),
    moduleCount: modules.length,
    modulesImplementableNow: modules.filter((m) => m.implementableNow).length,
    modulesRequiringLaterApproval: modules.filter((m) => m.requiresLaterApproval).length,
    highRiskGatedCount: modules.filter((m) => m.externalActionRisk === 'high').length,
    modules: [...modules],
    credentialBoundaries: [...CREDENTIAL_BOUNDARIES],
    note: 'Hermes v0.16 Surface-Release Control Panel — read-only foundation. No live connections, no external channels, no MCP, no remote gateway, no secret values.',
  }
}
