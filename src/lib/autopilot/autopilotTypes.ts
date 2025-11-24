/**
 * Autopilot Types
 * Phase 89: Founder Autopilot Mode
 */

export type AutomationProfile = 'off' | 'conservative' | 'balanced' | 'aggressive';

export type DomainLevel = 'off' | 'suggest' | 'approval_only' | 'auto';

export type ActionCategory = 'creative' | 'reporting' | 'success' | 'risk' | 'scaling' | 'housekeeping' | 'outreach' | 'optimisation';

export type SourceEngine = 'early_warning' | 'performance_reality' | 'combat' | 'scaling_mode' | 'client_agent' | 'orchestration' | 'posting_engine' | 'founder_intel' | 'archive' | 'manual';

export type RiskClass = 'low' | 'medium' | 'high';

export type ActionState = 'suggested' | 'auto_executed' | 'approved_executed' | 'rejected' | 'skipped';

export type PlaybookStatus = 'draft' | 'active' | 'archived';

// Domain levels
export interface DomainLevels {
  reporting: DomainLevel;
  creative: DomainLevel;
  posting: DomainLevel;
  outreach: DomainLevel;
  optimisation: DomainLevel;
  housekeeping: DomainLevel;
}

// Schedule preferences
export interface SchedulePrefs {
  playbookCadence: 'daily' | 'weekly';
  executionCadence: 'hourly' | 'daily';
  preferredDay: string;
  preferredHour: number;
}

// Autopilot preferences
export interface AutopilotPreferences {
  id: string;
  createdAt: string;
  updatedAt: string;
  founderUserId: string;
  workspaceId: string;
  automationProfile: AutomationProfile;
  domainLevels: DomainLevels;
  schedulePrefs: SchedulePrefs;
  metadata: Record<string, any>;
}

// Meta scores for playbook
export interface MetaScores {
  riskMix: number;
  effortTotal: number;
  impactTotal: number;
  coveragePercent: number;
}

// Autopilot playbook
export interface AutopilotPlaybook {
  id: string;
  createdAt: string;
  workspaceId: string;
  periodStart: string;
  periodEnd: string;
  status: PlaybookStatus;
  summaryMarkdown: string;
  metaScores: MetaScores;
  totalActions: number;
  autoExecuted: number;
  awaitingApproval: number;
  completed: number;
  truthComplete: boolean;
  truthNotes?: string;
  metadata: Record<string, any>;
}

// Autopilot action
export interface AutopilotAction {
  id: string;
  createdAt: string;
  playbookId: string;
  clientId?: string;
  workspaceId: string;
  category: ActionCategory;
  sourceEngine: SourceEngine;
  actionType: string;
  riskClass: RiskClass;
  impactEstimate: number;
  effortEstimate: number;
  priorityScore: number;
  state: ActionState;
  title: string;
  description?: string;
  payload: Record<string, any>;
  executionResult?: Record<string, any>;
  executedAt?: string;
  executedBy?: string;
  truthNotes?: string;
  metadata: Record<string, any>;
}

// Raw signal from engines
export interface RawAutopilotSignal {
  sourceEngine: SourceEngine;
  signalType: string;
  clientId?: string;
  severity?: string;
  data: Record<string, any>;
  timestamp: string;
}

// Input types
export interface CreatePlaybookInput {
  workspaceId: string;
  periodStart: string;
  periodEnd: string;
  actions: CreateActionInput[];
}

export interface CreateActionInput {
  clientId?: string;
  category: ActionCategory;
  sourceEngine: SourceEngine;
  actionType: string;
  riskClass: RiskClass;
  impactEstimate: number;
  effortEstimate: number;
  title: string;
  description?: string;
  payload: Record<string, any>;
  truthNotes?: string;
}

// Stats types
export interface AutopilotStats {
  totalPlaybooks: number;
  totalActions: number;
  autoExecuted: number;
  approvedExecuted: number;
  awaitingApproval: number;
}

// Execution result
export interface ExecutionResult {
  success: boolean;
  actionId: string;
  result?: any;
  error?: string;
}
