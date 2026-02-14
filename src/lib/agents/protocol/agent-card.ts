/**
 * Agent Card Specification (Agents Protocol v1.0)
 *
 * Structured manifests defining agent identity, capabilities,
 * boundaries, permissions, and delegation rules.
 *
 * Every agent in the system MUST have a registered Agent Card
 * before it can operate. Agent Cards are the single source of
 * truth for what an agent can and cannot do.
 */

// ============================================================================
// Core Types
// ============================================================================

export type AgentState =
  | 'idle'
  | 'active'
  | 'busy'
  | 'degraded'
  | 'offline'
  | 'maintenance';

export type AgentType =
  | 'orchestrator'
  | 'worker'
  | 'evaluator'
  | 'router'
  | 'hybrid';

export type ModelTier = 'opus' | 'sonnet' | 'haiku';

export type PermissionTier =
  | 'read-only'
  | 'standard'
  | 'elevated'
  | 'system'
  | 'administrative';

export type FileSystemAccess = 'none' | 'read' | 'read-write';

// ============================================================================
// Capabilities
// ============================================================================

export interface AgentCapabilityDefinition {
  /** Unique capability identifier */
  id: string;
  /** Human-readable capability name */
  name: string;
  /** Detailed description of what this capability enables */
  description: string;
  /** Keywords for capability matching (used by router) */
  keywords: string[];
  /** Self-assessed confidence for this capability (0-1) */
  confidence: number;
  /** Expected input schema (JSON Schema subset) */
  inputSchema?: Record<string, unknown>;
  /** Expected output schema (JSON Schema subset) */
  outputSchema?: Record<string, unknown>;
  /** Estimated execution time in milliseconds */
  estimatedExecutionTimeMs?: number;
}

// ============================================================================
// Boundaries & Permissions
// ============================================================================

export interface AgentBoundaries {
  /** Maximum execution time per task (ms) */
  maxExecutionTimeMs: number;
  /** Maximum tokens per AI request */
  maxTokensPerRequest: number;
  /** Rate limit: max requests per minute */
  maxRequestsPerMinute: number;
  /** Can this agent spawn sub-agents? */
  canSpawnSubAgents: boolean;
  /** Maximum concurrent sub-agents (if canSpawnSubAgents) */
  maxConcurrentSubAgents: number;
  /** File system access level */
  fileSystemAccess: FileSystemAccess;
  /** Maximum plan steps before forced pause */
  maxPlanSteps: number;
  /** Maximum retry attempts per operation */
  maxRetries: number;
}

export interface AgentPermissions {
  /** Permission tier */
  tier: PermissionTier;
  /** Can read from database */
  canReadDatabase: boolean;
  /** Can write to database */
  canWriteDatabase: boolean;
  /** Can execute external API calls */
  canCallExternalAPIs: boolean;
  /** Can send emails or messages */
  canSendMessages: boolean;
  /** Can modify files on disk */
  canModifyFiles: boolean;
  /** Can execute shell commands */
  canExecuteCommands: boolean;
  /** Requires approval for high-risk actions */
  requiresApprovalForHighRisk: boolean;
  /** Commands that require explicit approval */
  approvalRequiredCommands: string[];
  /** Commands that are completely blocked */
  blockedCommands: string[];
}

// ============================================================================
// Delegation
// ============================================================================

export type DelegationCondition =
  | 'low_confidence'
  | 'capability_mismatch'
  | 'error_threshold'
  | 'complexity_threshold'
  | 'timeout'
  | 'explicit_request';

export interface DelegationRule {
  /** Rule identifier */
  id: string;
  /** Condition that triggers delegation */
  condition: DelegationCondition;
  /** Target agent to delegate to */
  targetAgentId: string;
  /** Confidence threshold (for low_confidence condition) */
  confidenceThreshold?: number;
  /** Error count threshold (for error_threshold condition) */
  errorThreshold?: number;
  /** Complexity score threshold (for complexity_threshold) */
  complexityThreshold?: number;
  /** Whether this rule is active */
  enabled: boolean;
}

// ============================================================================
// Metrics
// ============================================================================

export interface AgentMetrics {
  /** Total task executions */
  totalExecutions: number;
  /** Successful completions */
  successfulExecutions: number;
  /** Failed executions */
  failedExecutions: number;
  /** Average execution time (ms) */
  averageExecutionTimeMs: number;
  /** Average confidence score */
  averageConfidenceScore: number;
  /** Last execution timestamp */
  lastExecutionAt?: string;
  /** Uptime percentage (0-100) */
  uptimePercentage: number;
  /** Total escalations triggered */
  totalEscalations: number;
  /** Total handoffs initiated */
  totalHandoffs: number;
}

// ============================================================================
// Agent Card (Main Interface)
// ============================================================================

export interface AgentCard {
  // --- Core Identity ---
  /** Unique agent identifier */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Semantic version */
  version: string;
  /** Agent type classification */
  type: AgentType;
  /** Primary role/purpose */
  role: string;
  /** Description of what this agent does */
  description: string;

  // --- Model Configuration ---
  /** AI model tier to use */
  modelTier: ModelTier;
  /** Whether to use Extended Thinking */
  useExtendedThinking: boolean;
  /** Extended Thinking budget (tokens, if enabled) */
  thinkingBudgetTokens?: number;
  /** Routing priority (1 = highest) */
  priority: number;

  // --- Capabilities ---
  /** What this agent CAN do */
  capabilities: AgentCapabilityDefinition[];
  /** When to use this agent (use case descriptions) */
  useCases: string[];

  // --- Boundaries & Permissions ---
  /** Operational boundaries */
  boundaries: AgentBoundaries;
  /** Access permissions */
  permissions: AgentPermissions;

  // --- Delegation ---
  /** Rules for automatic delegation */
  delegationRules: DelegationRule[];
  /** Agent IDs this agent may delegate to */
  canDelegateTo: string[];
  /** Agent IDs that may delegate to this agent */
  canReceiveDelegationFrom: string[];
  /** Agent ID to escalate to when all else fails */
  escalatesTo: string;

  // --- State ---
  /** Current operational state */
  currentState: AgentState;
  /** When state last changed */
  stateChangedAt: string;
  /** Number of currently active executions */
  activeExecutions: number;

  // --- Metadata ---
  /** File location of agent definition */
  location: string;
  /** Protocol version this card conforms to */
  protocolVersion: string;
  /** When card was created */
  createdAt: string;
  /** When card was last updated */
  updatedAt: string;
  /** Runtime metrics */
  metrics: AgentMetrics;
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createDefaultBoundaries(
  overrides?: Partial<AgentBoundaries>
): AgentBoundaries {
  return {
    maxExecutionTimeMs: 300_000, // 5 minutes
    maxTokensPerRequest: 100_000,
    maxRequestsPerMinute: 60,
    canSpawnSubAgents: false,
    maxConcurrentSubAgents: 0,
    fileSystemAccess: 'none',
    maxPlanSteps: 20,
    maxRetries: 3,
    ...overrides,
  };
}

export function createDefaultPermissions(
  overrides?: Partial<AgentPermissions>
): AgentPermissions {
  return {
    tier: 'standard',
    canReadDatabase: true,
    canWriteDatabase: false,
    canCallExternalAPIs: false,
    canSendMessages: false,
    canModifyFiles: false,
    canExecuteCommands: false,
    requiresApprovalForHighRisk: true,
    approvalRequiredCommands: ['open_app', 'close_app', 'launch_url', 'system_command'],
    blockedCommands: [
      'file_delete',
      'registry_edit',
      'network_reconfig',
      'system_shutdown',
      'execute_arbitrary_binary',
    ],
    ...overrides,
  };
}

export function createDefaultMetrics(): AgentMetrics {
  return {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTimeMs: 0,
    averageConfidenceScore: 0,
    uptimePercentage: 100,
    totalEscalations: 0,
    totalHandoffs: 0,
  };
}

const now = () => new Date().toISOString();

export function createAgentCard(
  config: Pick<AgentCard, 'id' | 'name' | 'role' | 'description' | 'type' | 'modelTier' | 'priority' | 'location'> & {
    version?: string;
    useExtendedThinking?: boolean;
    thinkingBudgetTokens?: number;
    capabilities?: AgentCapabilityDefinition[];
    useCases?: string[];
    boundaries?: Partial<AgentBoundaries>;
    permissions?: Partial<AgentPermissions>;
    delegationRules?: DelegationRule[];
    canDelegateTo?: string[];
    canReceiveDelegationFrom?: string[];
    escalatesTo?: string;
  }
): AgentCard {
  return {
    id: config.id,
    name: config.name,
    version: config.version || '1.0.0',
    type: config.type,
    role: config.role,
    description: config.description,
    modelTier: config.modelTier,
    useExtendedThinking: config.useExtendedThinking || false,
    thinkingBudgetTokens: config.thinkingBudgetTokens,
    priority: config.priority,
    capabilities: config.capabilities || [],
    useCases: config.useCases || [],
    boundaries: createDefaultBoundaries(config.boundaries),
    permissions: createDefaultPermissions(config.permissions),
    delegationRules: config.delegationRules || [],
    canDelegateTo: config.canDelegateTo || [],
    canReceiveDelegationFrom: config.canReceiveDelegationFrom || [],
    escalatesTo: config.escalatesTo || 'orchestrator',
    currentState: 'idle',
    stateChangedAt: now(),
    activeExecutions: 0,
    location: config.location,
    protocolVersion: '1.0.0',
    createdAt: now(),
    updatedAt: now(),
    metrics: createDefaultMetrics(),
  };
}

// ============================================================================
// Validation
// ============================================================================

export interface AgentCardValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAgentCard(card: AgentCard): AgentCardValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!card.id) errors.push('Missing required field: id');
  if (!card.name) errors.push('Missing required field: name');
  if (!card.role) errors.push('Missing required field: role');
  if (!card.location) errors.push('Missing required field: location');

  // Capability checks
  if (card.capabilities.length === 0) {
    warnings.push(`Agent ${card.id} has no capabilities defined`);
  }

  for (const cap of card.capabilities) {
    if (cap.confidence < 0 || cap.confidence > 1) {
      errors.push(`Capability ${cap.id}: confidence must be 0-1, got ${cap.confidence}`);
    }
    if (cap.keywords.length === 0) {
      warnings.push(`Capability ${cap.id}: no keywords defined`);
    }
  }

  // Delegation checks
  if (card.type === 'orchestrator' && !card.boundaries.canSpawnSubAgents) {
    warnings.push('Orchestrator should have canSpawnSubAgents = true');
  }

  for (const rule of card.delegationRules) {
    if (!card.canDelegateTo.includes(rule.targetAgentId)) {
      errors.push(
        `Delegation rule ${rule.id} targets ${rule.targetAgentId}, but it's not in canDelegateTo`
      );
    }
  }

  // Priority check
  if (card.type === 'orchestrator' && card.priority !== 1) {
    warnings.push('Orchestrator should have priority 1');
  }

  // Boundary sanity checks
  if (card.boundaries.maxExecutionTimeMs < 1000) {
    warnings.push('maxExecutionTimeMs is very low (< 1s)');
  }
  if (card.boundaries.maxRetries > 10) {
    warnings.push('maxRetries is very high (> 10)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
