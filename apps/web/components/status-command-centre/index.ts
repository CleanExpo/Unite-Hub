/**
 * Elite Production Status Visualization System
 * Command Centre aesthetic with industrial luxury design
 *
 * @module status-command-centre
 */

// Main dashboard component
export { StatusCommandCentre } from './components/StatusCommandCentre';

// Core visualisation components
export { ProgressOrb } from './components/ProgressOrb';
export { ProgressRing } from './components/ProgressRing';
export { StatusPulse } from './components/StatusPulse';
export { StatusBadge } from './components/StatusBadge';

// Activity components
export { AgentActivityCard } from './components/AgentActivityCard';
export { ActivityTimeline } from './components/ActivityTimeline';
export { AgentThinkingIndicator } from './components/AgentThinkingIndicator';

// NEW: Timeline layout components (replaces card grid)
export { AgentNode } from './components/AgentNode';
export { DataStrip } from './components/DataStrip';

// Dashboard components
export { MetricTile } from './components/MetricTile';
export { NotificationStream } from './components/NotificationStream';
export { ElapsedTimer } from './components/ElapsedTimer';

// Hooks
export { useElapsedTime, useCountdown } from './hooks/use-elapsed-time';
export { useStatusTransitions, useStatusColourTransition } from './hooks/use-status-transitions';

// Utilities
export {
  formatElapsedAU,
  formatElapsedMs,
  formatTimestampAU,
  formatDateAU,
  formatTimeAU,
  getRelativeTimeAU,
  calculateDuration,
  formatDuration,
  getAustralianTimezone,
  formatTimeWithTimezone,
  calculateETA,
  formatETA,
} from './utils/format-duration';

// Constants
export {
  STATUS_CONFIG,
  STATUS_CSS_VARS,
  ANIMATION_DURATIONS,
  ORB_SIZES,
  PULSE_SIZES,
  BADGE_SIZES,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
  ERROR_STATUSES,
  SUCCESS_STATUSES,
  isActiveStatus,
  isTerminalStatus,
  isErrorStatus,
  isSuccessStatus,
  getStatusConfig,
  getStatusCssVars,
  DEFAULTS,
  NOTIFICATION_CONFIG,
} from './constants';

// Types
export type {
  AgentRunStatus,
  StatusIntensity,
  StatusAnimation,
  AgentRun,
  ActivityStep,
  Notification,
  StatusColour,
  StatusConfig,
  StatusCommandCentreProps,
  AgentActivityCardProps,
  ProgressOrbProps,
  ProgressRingProps,
  StatusPulseProps,
  StatusBadgeProps,
  ActivityTimelineProps,
  NotificationStreamProps,
  AgentThinkingIndicatorProps,
  ElapsedTimerProps,
  MetricTileProps,
  UseElapsedTimeResult,
  UseStatusTransitionsResult,
  RealtimeEvent,
  RealtimePayload,
  ConnectionStatus,
  ConnectionState,
} from './types';
