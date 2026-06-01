export type FounderDeviceRole =
  | 'always_on_host'
  | 'heavy_worker'
  | 'mobile_cockpit'
  | 'cloud_worker'

export type FounderDeviceStatus = 'online' | 'idle' | 'busy' | 'offline' | 'unknown'

export type FounderDeviceCapability =
  | 'cron'
  | 'webhooks'
  | 'queue_worker'
  | 'context_sync'
  | 'scheduled_briefs'
  | 'heavy_builds'
  | 'docker'
  | 'local_verification'
  | 'browser_automation'
  | 'playwright'
  | 'idea_capture'
  | 'approval_review'
  | 'voice_input'
  | 'mobile_review'
  | 'cloud_execution'

export type FounderTaskType =
  | 'idea_capture'
  | 'approval'
  | 'scheduled_brief'
  | 'webhook_processing'
  | 'heavy_build'
  | 'browser_task'
  | 'research'
  | 'code_change'
  | 'ui_review'
  | 'credential_grant'
  | 'model_routing'

export type FounderRiskLevel = 'low' | 'medium' | 'high' | 'human_only'

export type PortfolioTarget =
  | 'unite_hub'
  | 'pi_dev_ops'
  | 'synthex'
  | 'restoreassist'
  | 'authority_site'
  | 'ato_app'
  | 'disaster_recovery'
  | 'unknown'

export type FounderTaskLane =
  | 'product_discovery'
  | 'feature_build'
  | 'bugfix'
  | 'qa_review'
  | 'account_cleanup'
  | 'browser_automation'
  | 'finance_ops'
  | 'social_ops'
  | 'model_routing'
  | 'research'
  | 'approval_only'

export interface FounderDevice {
  id: string
  displayName: string
  role: FounderDeviceRole
  status: FounderDeviceStatus
  capabilities: FounderDeviceCapability[]
  lastSeenAt?: string
  currentLoad?: number
  maxRiskLevel: FounderRiskLevel
}

export interface FounderTaskPacket {
  id: string
  originalMessage: string
  taskType: FounderTaskType
  lane: FounderTaskLane
  portfolioTarget: PortfolioTarget
  riskLevel: FounderRiskLevel
  objective: string
  requiredAgents: string[]
  doneCriteria: string[]
  contextPackId: string
  requiresLongRunningHost?: boolean
  requiresLocalExecution?: boolean
  requiresBrowser?: boolean
  requiresHumanApproval?: boolean
  preferredCapabilities?: FounderDeviceCapability[]
}

export interface FounderContextPack {
  id: string
  taskId: string
  portfolioTarget: PortfolioTarget
  originalMessage: string
  durableSummary: string
  constraints: string[]
  decisions: string[]
  evidenceLinks: string[]
  blockers: string[]
  nextRecommendedAction: string
  modelHistory: string[]
  receiptIds: string[]
  updatedAt: string
}

export interface TaskPacketBuildResult {
  taskPacket: FounderTaskPacket
  contextPack: FounderContextPack
  routingReasons: string[]
}

export interface MachineAssignment {
  taskId: string
  assignedDeviceId: string | null
  assignedDeviceName: string | null
  assignedRole: FounderDeviceRole | null
  status: 'assigned' | 'waiting_for_device' | 'requires_human_only'
  reasons: string[]
  fallbackRoles: FounderDeviceRole[]
}
