/**
 * Elite Production Status Visualization System - Type Definitions
 * Command Centre aesthetic with industrial luxury design
 */

// ============================================================================
// Status Types
// ============================================================================

export type AgentRunStatus =
  | 'pending'
  | 'in_progress'
  | 'awaiting_verification'
  | 'verification_in_progress'
  | 'verification_passed'
  | 'verification_failed'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'escalated_to_human';

export type StatusIntensity = 'idle' | 'active' | 'urgent';

export type StatusAnimation = 'pulse' | 'spin' | 'none';

// ============================================================================
// Agent Run Data
// ============================================================================

export interface AgentRun {
  id: string;
  task_id: string;
  user_id: string;
  agent_name: string;
  agent_id?: string;
  status: AgentRunStatus;
  current_step: string;
  progress_percent: number;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  verification_attempts?: number;
  verification_evidence?: Array<Record<string, unknown>>;
  started_at: string;
  completed_at?: string;
  updated_at: string;
}

export interface ActivityStep {
  id: string;
  timestamp: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  duration?: number; // milliseconds
  step_type?: 'task' | 'thinking' | 'verification';
}

export interface Notification {
  id: string;
  timestamp: string;
  type: 'start' | 'progress' | 'complete' | 'error' | 'escalation' | 'verification';
  agentName: string;
  message: string;
  runId: string;
}

// ============================================================================
// Status Configuration
// ============================================================================

export interface StatusColour {
  primary: string;
  glow: string;
  background: string;
}

export interface StatusConfig {
  label: string;
  colour: StatusColour;
  icon: string;
  animation: StatusAnimation;
  intensity: StatusIntensity;
}

// ============================================================================
// Component Props
// ============================================================================

export interface StatusCommandCentreProps {
  /** Filter by specific task ID */
  taskId?: string;
  /** Filter by agent name */
  agentName?: string;
  /** Display variant */
  variant?: 'full' | 'compact' | 'minimal';
  /** Maximum agents to display */
  maxAgents?: number;
  /** Show notification stream sidebar */
  showNotifications?: boolean;
  /** Custom class for container */
  className?: string;
}

export interface AgentActivityCardProps {
  run: AgentRun;
  /** Expanded view with timeline */
  expanded?: boolean;
  /** Callback when card is clicked */
  onSelect?: (runId: string) => void;
  /** Callback when expand is toggled */
  onToggleExpand?: (runId: string) => void;
  /** Animation delay for staggered entry */
  animationDelay?: number;
}

export interface ProgressOrbProps {
  /** Progress value 0-100 */
  value: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Status for colour theming */
  status: AgentRunStatus;
  /** Show percentage label */
  showLabel?: boolean;
  /** Enable glow effect */
  glow?: boolean;
  /** Animation variant */
  animation?: StatusAnimation;
  /** Custom class */
  className?: string;
}

export interface ProgressRingProps {
  /** Progress value 0-100 */
  value: number;
  /** Ring thickness */
  strokeWidth?: number;
  /** Size in pixels */
  size?: number;
  /** Status for colour theming */
  status: AgentRunStatus;
  /** Animate the stroke */
  animated?: boolean;
  /** Show inner content */
  children?: React.ReactNode;
  /** Custom class */
  className?: string;
}

export interface StatusPulseProps {
  /** Current status */
  status: AgentRunStatus;
  /** Pulse speed based on activity */
  intensity?: StatusIntensity;
  /** Size */
  size?: 'sm' | 'md';
  /** Custom class */
  className?: string;
}

export interface StatusBadgeProps {
  /** Current status */
  status: AgentRunStatus;
  /** Show animated indicator */
  animated?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class */
  className?: string;
}

export interface ActivityTimelineProps {
  /** List of activity steps */
  steps: ActivityStep[];
  /** Maximum steps to show (scrollable) */
  maxVisible?: number;
  /** Compact single-line mode */
  compact?: boolean;
  /** Custom class */
  className?: string;
}

export interface NotificationStreamProps {
  /** Notifications to display */
  notifications: Notification[];
  /** Maximum notifications to show */
  maxItems?: number;
  /** Filter by severity */
  filter?: 'all' | 'errors' | 'warnings' | 'info';
  /** Auto-scroll to new notifications */
  autoScroll?: boolean;
  /** Callback when notification clicked */
  onNotificationClick?: (runId: string) => void;
  /** Custom class */
  className?: string;
}

export interface AgentThinkingIndicatorProps {
  /** Is agent currently thinking */
  active: boolean;
  /** Thinking phase label */
  phase?: string;
  /** Custom class */
  className?: string;
}

export interface ElapsedTimerProps {
  /** Start time (ISO string) */
  startTime: string | null;
  /** End time (ISO string) - stops timer if provided */
  endTime?: string | null;
  /** Show icon */
  showIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class */
  className?: string;
}

export interface MetricTileProps {
  /** Metric label */
  label: string;
  /** Metric value */
  value: number | string;
  /** Change from previous (percentage or absolute) */
  change?: number;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Icon name */
  icon?: string;
  /** Colour variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Custom class */
  className?: string;
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseElapsedTimeResult {
  /** Elapsed time in seconds */
  elapsed: number;
  /** Formatted elapsed time (e.g., "1m 23s") */
  formatted: string;
  /** Whether timer is running */
  isRunning: boolean;
}

export interface UseStatusTransitionsResult {
  /** Previous status before transition */
  previousStatus: AgentRunStatus | null;
  /** Whether currently transitioning */
  isTransitioning: boolean;
  /** CSS class for transition animation */
  transitionClass: string;
}

// ============================================================================
// Realtime Types
// ============================================================================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload {
  eventType: RealtimeEvent;
  new: AgentRun;
  old: AgentRun;
  errors: unknown;
}

// ============================================================================
// Connection Status
// ============================================================================

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  lastConnected?: string;
  reconnectAttempts?: number;
}
