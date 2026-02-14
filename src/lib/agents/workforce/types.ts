/**
 * Workforce Engine — Shared Types (Phase 2)
 *
 * Centralizes all types shared across workforce modules to prevent
 * circular imports. Maps Claude Code concepts (skills, hooks, workstreams,
 * memory scopes) to Unite-Hub's runtime.
 *
 * @module lib/agents/workforce/types
 */

// ============================================================================
// Skill Types
// ============================================================================

/**
 * Parsed representation of a SKILL.md YAML frontmatter.
 * Mirrors the format defined in `.claude/skills/FRAMEWORK.md`.
 */
export interface SkillManifest {
  /** Unique skill identifier (kebab-case) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Skill category (context, verification, development, database, frontend, backend, ai, seo) */
  category?: string;
  /** Loading priority: 1=auto-load, 2=on-demand, 3=manual, 4=deprecated */
  priority: 1 | 2 | 3 | 4;
  /** Semantic version */
  version: string;
  /** Current status */
  status: 'active' | 'deprecated';
  /** Paths to other skills this depends on */
  dependencies: string[];
  /** Task-type keywords that trigger auto-loading */
  autoLoadFor: string[];
  /** Agent IDs that can use this skill */
  compatibleAgents: string[];
  /** Approximate context size in tokens */
  estimatedTokens: number;
}

/**
 * A loaded, runtime-ready skill with parsed content.
 */
export interface LoadedSkill {
  /** Parsed YAML frontmatter */
  manifest: SkillManifest;
  /** Raw markdown body (after frontmatter stripped) */
  content: string;
  /** Resolved file path */
  filePath: string;
  /** Whether dependencies have been resolved */
  dependenciesResolved: boolean;
  /** When this skill was loaded into cache */
  loadedAt: string;
  /** Estimated token count of content */
  tokenCount: number;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Lifecycle phases where hooks can execute.
 * Maps to Claude Code's PreToolUse/PostToolUse pattern with additional phases.
 */
export type HookPhase =
  | 'pre-tool-use'     // Before an agent invokes a tool/capability
  | 'post-tool-use'    // After a tool/capability returns
  | 'pre-execution'    // Before an agent starts a task
  | 'post-execution'   // After an agent completes a task
  | 'pre-handoff'      // Before agent-to-agent handoff
  | 'post-handoff';    // After handoff completes

/**
 * Action a hook can take on an agent operation.
 */
export type HookAction = 'allow' | 'block' | 'modify' | 'audit';

/**
 * A registered hook definition.
 */
export interface HookDefinition {
  /** Unique hook identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Lifecycle phase this hook runs at */
  phase: HookPhase;
  /** Agent IDs this hook applies to ('*' for all agents) */
  agentIds: string[];
  /** Priority (lower runs first) */
  priority: number;
  /** Whether this hook is currently active */
  enabled: boolean;
  /** The handler function */
  handler: HookHandler;
}

/**
 * Context passed to a hook handler.
 */
export interface HookContext {
  /** Agent performing the action */
  agentId: string;
  /** Workspace scope */
  workspaceId: string;
  /** The action/tool being used */
  action: string;
  /** Input parameters for the action */
  inputs: Record<string, unknown>;
  /** Results from previous hooks in the chain */
  hookChain: HookResult[];
  /** Timestamp of the hook execution */
  timestamp: string;
  /** Correlation ID for tracing across the workflow */
  correlationId: string;
}

/**
 * Result returned by a hook handler.
 */
export interface HookResult {
  /** Which hook produced this result */
  hookId: string;
  /** Action taken */
  action: HookAction;
  /** Modified inputs (only when action is 'modify') */
  modifiedInputs?: Record<string, unknown>;
  /** Reason for block/modify */
  reason?: string;
  /** How long the hook took to execute */
  executionTimeMs: number;
  /** Additional metadata for audit trail */
  metadata?: Record<string, unknown>;
}

/**
 * Hook handler function signature.
 */
export type HookHandler = (ctx: HookContext) => Promise<HookResult>;

/**
 * Aggregate result from executing all hooks for a phase.
 */
export interface HookExecutionResult {
  /** Final action (most restrictive wins: block > modify > audit > allow) */
  action: HookAction;
  /** Final inputs (after all modifications applied) */
  inputs: Record<string, unknown>;
  /** All individual hook results */
  results: HookResult[];
  /** Whether execution should proceed */
  shouldProceed: boolean;
  /** Full audit trail */
  auditTrail: HookResult[];
}

// ============================================================================
// Workflow Types
// ============================================================================

/**
 * Status of a workstream or step.
 */
export type WorkstreamStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * A single step within a workstream.
 */
export interface WorkstreamStep {
  /** Step number (1-based) */
  stepNumber: number;
  /** Action to perform */
  action: string;
  /** Input parameters */
  inputs: Record<string, unknown>;
  /** Hook IDs to run before/after this step */
  hooks?: string[];
  /** Current status */
  status: WorkstreamStatus;
  /** Result from execution */
  result?: unknown;
  /** Execution time in milliseconds */
  executionTimeMs?: number;
}

/**
 * A workstream — a sequence of steps executed by a single agent.
 * Multiple workstreams form a workflow and can run in parallel.
 */
export interface Workstream {
  /** Unique workstream identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Agent assigned to this workstream */
  agentId: string;
  /** Skill IDs required for this workstream */
  skillIds: string[];
  /** Steps in this workstream */
  steps: WorkstreamStep[];
  /** IDs of workstreams that must complete before this one starts */
  dependsOn: string[];
  /** Current status */
  status: WorkstreamStatus;
  /** When execution started */
  startedAt?: string;
  /** When execution completed */
  completedAt?: string;
  /** Output from this workstream */
  output?: unknown;
  /** Error message if failed */
  error?: string;
}

/**
 * A complete workflow definition — the top-level orchestration unit.
 * Contains one or more workstreams that may run in parallel or sequentially.
 */
export interface WorkflowDefinition {
  /** Unique workflow identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this workflow does */
  description: string;
  /** Workstreams to execute */
  workstreams: Workstream[];
  /** Workspace scope */
  workspaceId: string;
  /** The original objective that created this workflow */
  objective: string;
  /** When the workflow was created */
  createdAt: string;
  /** Overall status */
  status: WorkstreamStatus;
}

// ============================================================================
// Memory Types
// ============================================================================

/**
 * Memory persistence scopes.
 * - workspace: shared across all agents in a workspace
 * - agent: per-agent, persists across sessions
 * - session: ephemeral, expires with TTL or session end
 */
export type MemoryScope = 'workspace' | 'agent' | 'session';

/**
 * A memory entry stored by the workforce engine.
 */
export interface WorkforceMemoryEntry {
  /** Database ID (assigned on save) */
  id?: string;
  /** Persistence scope */
  scope: MemoryScope;
  /** Workspace ID (always required) */
  workspaceId: string;
  /** Agent ID (required for agent scope) */
  agentId?: string;
  /** Session ID (required for session scope) */
  sessionId?: string;
  /** Retrieval key */
  key: string;
  /** Stored value */
  value: Record<string, unknown>;
  /** Importance for recall priority (0-100) */
  importance: number;
  /** Time-to-live in milliseconds (optional, mainly for session scope) */
  ttlMs?: number;
  /** When this entry was created */
  createdAt: string;
  /** When this entry was last updated */
  updatedAt: string;
  /** When this entry expires (computed from ttlMs) */
  expiresAt?: string;
}

/**
 * Identifies a memory scope for queries.
 */
export interface ScopeIdentifier {
  workspaceId: string;
  agentId?: string;
  sessionId?: string;
}
