import { getControlPanelView } from './control-panel'
import { getOperatorJobsFallbackView, type OperatorJobsView } from './jobs'
import { getGatewayStatus, getOperatorLanes, type OperatorLane } from './lanes'
import {
  getSpecializedSkillMeshStatus,
  routeBusinessMission,
  type MissionRouteResult,
} from './specialized-skill-mesh'
import { getSkillEvolutionStatus } from './skill-evolution'

export interface CommandCentreLaneView extends OperatorLane {
  visibleInCommandCentre: true
  displayName: string
  capabilityClass: 'max_plan_operator_session' | 'local_runtime' | 'skill_runtime'
  blockedReason: string | null
  safetyLabel: string
}

export interface CommandCentreOperatorSurfaceView {
  source: 'static_registry'
  surface: 'command_centre_operator_execution_surface'
  founderOnly: true
  noApiKeyMode: true
  externalExecutionEnabled: false
  productionActionsGated: true
  lanes: CommandCentreLaneView[]
  jobQueue: {
    source: 'static_registry' | 'not_connected' | 'sandbox_select' | 'production'
    connected: boolean
    liveExecution: false
    jobCount: number
    note: string
  }
  controlledLocalExecution: {
    mode: 'controlled_real_local_foundation'
    status: 'local_foundation_ready'
    endpoint: '/api/hermes/operator-gateway/jobs/local-execution'
    enabled: boolean
    dispatchEnabled: false
    externalExecutionEnabled: false
    liveRunnerEnabled: false
    productionConnected: false
    activeLanes: string[]
    pendingLanes: string[]
    disabledReason: string
  }
  dryRunExecution: {
    mode: 'sandbox_dry_run_only'
    enabled: boolean
    canExecuteExternally: false
    liveRunnerEnabled: false
    productionConnected: false
    endpoint: '/api/hermes/operator-gateway/jobs/dry-run'
    label: 'Dry-run only'
    disabledReason: string
  }
  jobSubmission: {
    mode: 'disabled_safe_mock' | 'sandbox_persist_only'
    enabled: boolean
    canPersist: boolean
    canExecute: false
    defaultExternalActionRequested: false
    defaultProductionActionRequested: false
    defaultApiKeyRequested: false
    allowedTaskTypes: string[]
    disabledReason: string
  }
  evidencePointers: { label: string; href: string; source: 'agentic_nexus' | 'crm_route' | 'static_registry' }[]
  blockedGates: { gateId: string; status: 'blocked' | 'needs_board_grant' | 'operator_action_required'; reason: string }[]
  dailyOps: {
    source: 'local_dashboard_snapshot'
    status: 'read_only'
    externalDispatchEnabled: false
    panels: string[]
    note: string
  }
  seniorPmQueue: {
    source: 'local_dashboard_snapshot'
    items: { id: string; title: string; status: 'ready' | 'blocked_gate' | 'completed' | 'waiting_input'; nextAction: string }[]
  }
  boardDecisionPanel: {
    currentDecision: 'build_unite_group_specialized_skill_mesh_and_business_mission_router'
    reviewer: 'Phill McGurk'
    status: 'local_foundation_ready'
    nextBoardGate: string
  }
  skillMesh: ReturnType<typeof getSpecializedSkillMeshStatus>
  skillEvolution: ReturnType<typeof getSkillEvolutionStatus>
  missionRouter: {
    source: 'static_registry'
    status: 'static_local_router_ready'
    sampleObjective: string
    sampleRoute: MissionRouteResult
    externalExecutionEnabled: false
    liveRunnerEnabled: false
  }
  safetyStatus: {
    apiKeyMode: false
    maxPlansAsBackendCredentials: false
    webSessionScraping: false
    browserAutomation: false
    computerUse: false
    productionDbTouched: false
    deploymentOccurred: false
    externalExecutionEnabled: false
  }
}

function capabilityClassFor(lane: OperatorLane): CommandCentreLaneView['capabilityClass'] {
  if (lane.laneId === 'agentic_nexus_skill_exec') return 'skill_runtime'
  if (lane.authMode === 'local_runtime') return 'local_runtime'
  return 'max_plan_operator_session'
}

function displayNameFor(lane: OperatorLane): string {
  const labels: Record<string, string> = {
    openai_codex_max: 'Codex CLI / ChatGPT Max plan lane',
    claude_code_max_primary: 'Claude Code / Claude Max primary lane',
    claude_code_max_secondary: 'Claude Code / Claude Max secondary lane',
    cursor_cli: 'Cursor CLI operator lane',
    hermes_local: 'Hermes local orchestration lane',
    agentic_nexus_skill_exec: 'Agentic Nexus registered skill-exec lane',
  }
  return labels[lane.laneId] ?? lane.laneId
}

function blockedReasonFor(lane: OperatorLane): string | null {
  if (lane.status === 'active') return null
  if (lane.laneId.startsWith('claude_code') || lane.laneId === 'cursor_cli') {
    return 'Blocked on operator install/login; plan session only, no API keys or stored credentials.'
  }
  return `Lane is ${lane.status}; activation is a separate Board/operator gate.`
}

export function getCommandCentreOperatorSurfaceView(
  options: { jobsView?: OperatorJobsView; sandboxJobCreationEnabled?: boolean } = {},
): CommandCentreOperatorSurfaceView {
  const lanes = getOperatorLanes()
  const jobsView = options.jobsView ?? getOperatorJobsFallbackView()
  const sandboxJobCreationEnabled = options.sandboxJobCreationEnabled === true && jobsView.source === 'sandbox_select'
  const gateway = getGatewayStatus()
  const control = getControlPanelView()
  const skillMesh = getSpecializedSkillMeshStatus()
  const skillEvolution = getSkillEvolutionStatus()
  const sampleObjective = 'Prepare CARSI course product launch readiness'
  const sampleRoute = routeBusinessMission(sampleObjective)

  return {
    source: 'static_registry',
    surface: 'command_centre_operator_execution_surface',
    founderOnly: true,
    noApiKeyMode: gateway.noApiKeyMode,
    externalExecutionEnabled: false,
    productionActionsGated: true,
    lanes: lanes.map((lane) => ({
      ...lane,
      visibleInCommandCentre: true,
      displayName: displayNameFor(lane),
      capabilityClass: capabilityClassFor(lane),
      blockedReason: blockedReasonFor(lane),
      safetyLabel: lane.apiKeyRequired
        ? 'UNSAFE: API key requested'
        : 'SAFE: operator-session/local lane; no API key; no external execution',
    })),
    jobQueue: {
      source: jobsView.source,
      connected: jobsView.source === 'sandbox_select' || jobsView.source === 'production',
      liveExecution: jobsView.liveExecution,
      jobCount: jobsView.jobCount,
      note: jobsView.note,
    },
    controlledLocalExecution: {
      mode: 'controlled_real_local_foundation',
      status: 'local_foundation_ready',
      endpoint: '/api/hermes/operator-gateway/jobs/local-execution',
      enabled: sandboxJobCreationEnabled,
      dispatchEnabled: false,
      externalExecutionEnabled: false,
      liveRunnerEnabled: false,
      productionConnected: false,
      activeLanes: ['hermes_local', 'openai_codex_max', 'agentic_nexus_skill_exec'],
      pendingLanes: ['claude_code_max_primary', 'claude_code_max_secondary', 'cursor_cli'],
      disabledReason: sandboxJobCreationEnabled
        ? 'Controlled real-local execution policy/types foundation is ready. It may append sandbox events and mark jobs running, but dispatch remains disabled until a later Board/ShipIt execution gate.'
        : 'Controlled real-local execution foundation is disabled until sandbox persistence/job creation is connected.',
    },
    dryRunExecution: {
      mode: 'sandbox_dry_run_only',
      enabled: sandboxJobCreationEnabled,
      canExecuteExternally: false,
      liveRunnerEnabled: false,
      productionConnected: false,
      endpoint: '/api/hermes/operator-gateway/jobs/dry-run',
      label: 'Dry-run only',
      disabledReason: sandboxJobCreationEnabled
        ? 'sandbox dry-run-only execution is enabled for safe planned jobs; it appends evidence and updates sandbox status only.'
        : 'Sandbox dry-run-only execution is disabled until sandbox persistence and job creation are connected.',
    },
    jobSubmission: {
      mode: sandboxJobCreationEnabled ? 'sandbox_persist_only' : 'disabled_safe_mock',
      enabled: sandboxJobCreationEnabled,
      canPersist: sandboxJobCreationEnabled,
      canExecute: false,
      defaultExternalActionRequested: false,
      defaultProductionActionRequested: false,
      defaultApiKeyRequested: false,
      allowedTaskTypes: [
        'feature_implementation',
        'refactor',
        'code_review',
        'test_authoring',
        'documentation',
        'orchestration',
        'planning',
        'verification',
        'evidence_audit',
        'dashboard',
        'skill_run',
      ],
      disabledReason: sandboxJobCreationEnabled
        ? 'sandbox-only job creation is enabled. Jobs are persisted as planned records only; external execution and the live runner remain disabled.'
        : jobsView.source === 'sandbox_select'
          ? 'Sandbox persistence is connected for read-only SELECT. Job creation is still disabled until approve_operator_gateway_sandbox_job_creation.'
          : 'DB write/job persistence is not approved. This form is a safe planning surface only; it cannot queue or execute jobs yet.',
    },
    evidencePointers: [
      { label: 'Operator lane registry', href: 'src/lib/operator-gateway/lanes.ts', source: 'static_registry' },
      { label: 'Operator job contract', href: 'src/lib/operator-gateway/jobs.ts', source: 'static_registry' },
      { label: 'Hermes control panel registry', href: 'src/lib/operator-gateway/control-panel.ts', source: 'static_registry' },
      { label: 'Gateway status API', href: '/api/hermes/operator-gateway/status', source: 'crm_route' },
      { label: 'Agentic Nexus dashboard summary', href: '2nd-brain/.agentic_nexus/DASHBOARD_STATUS_SUMMARY.md', source: 'agentic_nexus' },
    ],
    blockedGates: [
      {
        gateId: sandboxJobCreationEnabled
          ? 'approve_operator_gateway_sandbox_job_execution_dry_run'
          : jobsView.source === 'sandbox_select'
            ? 'approve_operator_gateway_sandbox_job_creation'
            : 'approve_operator_gateway_sandbox_apply',
        status: 'needs_board_grant',
        reason: sandboxJobCreationEnabled
          ? 'Controlled real-local execution foundation is design-ready/local-foundation-ready; actual dispatch remains disabled.'
          : jobsView.source === 'sandbox_select'
            ? 'Sandbox persistence is connected for read-only visibility; job creation remains disabled until a later Board gate.'
            : 'operator_jobs/operator_events migration remains sandbox-first and unapplied; no DB writes are allowed here.',
      },
      {
        gateId: 'install_claude_code_and_cursor_lanes',
        status: 'operator_action_required',
        reason: 'Claude Code and Cursor CLI require operator-side install/login only; no secrets exposed to CRM.',
      },
      {
        gateId: 'enable_external_operator_execution',
        status: 'needs_board_grant',
        reason: 'Launching real Codex/Claude/Cursor/Hermes jobs from CRM is deliberately disabled until a named Board gate.',
      },
      {
        gateId: 'production_db_or_deploy',
        status: 'blocked',
        reason: 'Production database writes and deployment remain explicitly prohibited in this batch.',
      },
    ],
    dailyOps: {
      source: 'local_dashboard_snapshot',
      status: 'read_only',
      externalDispatchEnabled: false,
      panels: ['daily ops status', 'senior pm autopilot', 'evidence ledger', 'blocked gates'],
      note: 'Daily ops are rendered from local Agentic Nexus/dashboard artifacts; this CRM surface does not dispatch cron or external messages.',
    },
    seniorPmQueue: {
      source: 'local_dashboard_snapshot',
      items: [
        {
          id: 'command_centre_operator_execution_surface',
          title: 'Build founder Command Centre operator surface',
          status: 'completed',
          nextAction: 'Open PR review; do not deploy.',
        },
        {
          id: sandboxJobCreationEnabled
            ? 'approve_controlled_real_local_execution_dispatch_gate'
            : jobsView.source === 'sandbox_select'
              ? 'approve_operator_gateway_sandbox_job_creation'
              : 'approve_operator_gateway_sandbox_apply',
          title: sandboxJobCreationEnabled
            ? 'Design controlled real local operator execution packet'
            : jobsView.source === 'sandbox_select'
              ? 'Approve sandbox job creation writes'
              : 'Apply operator_jobs/operator_events to sandbox',
          status: 'blocked_gate',
          nextAction: sandboxJobCreationEnabled
            ? 'Prepare controlled real local operator execution design packet; keep external execution disabled.'
            : jobsView.source === 'sandbox_select'
              ? 'Board grant required before enabling sandbox job creation writes.'
              : 'Board grant required before sandbox migration apply.',
        },
        {
          id: 'install_claude_code_and_cursor_lanes',
          title: 'Install/login Claude Code and Cursor CLI lanes',
          status: 'blocked_gate',
          nextAction: 'Operator-side install/login only; no CRM-stored credentials.',
        },
        {
          id: 'enable_external_operator_execution',
          title: 'Enable real operator execution bridge',
          status: 'blocked_gate',
          nextAction: 'Design runner handoff and evidence capture after Board gate.',
        },
      ],
    },
    boardDecisionPanel: {
      currentDecision: 'build_unite_group_specialized_skill_mesh_and_business_mission_router',
      reviewer: 'Phill McGurk',
      status: 'local_foundation_ready',
      nextBoardGate: sandboxJobCreationEnabled
        ? 'approve_controlled_real_local_execution_dispatch_gate'
        : jobsView.source === 'sandbox_select'
          ? 'approve_operator_gateway_sandbox_job_creation'
          : 'approve_operator_gateway_sandbox_apply or install_claude_code_and_cursor_lanes',
    },
    skillMesh,
    skillEvolution,
    missionRouter: {
      source: 'static_registry',
      status: 'static_local_router_ready',
      sampleObjective,
      sampleRoute,
      externalExecutionEnabled: false,
      liveRunnerEnabled: false,
    },
    safetyStatus: {
      apiKeyMode: false,
      maxPlansAsBackendCredentials: false,
      webSessionScraping: false,
      browserAutomation: false,
      computerUse: false,
      productionDbTouched: false,
      deploymentOccurred: false,
      externalExecutionEnabled: control.liveConnections,
    },
  }
}
