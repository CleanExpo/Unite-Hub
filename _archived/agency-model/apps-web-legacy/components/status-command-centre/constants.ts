/**
 * Elite Production Status Visualization System - Constants
 * Command Centre aesthetic with industrial luxury design
 */

import type { AgentRunStatus, StatusConfig } from './types';

// ============================================================================
// Status Configuration - Industrial Luxury Palette
// ============================================================================

export const STATUS_CONFIG: Record<AgentRunStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    colour: {
      primary: 'hsl(220 14% 46%)',
      glow: 'hsl(220 14% 46% / 0.3)',
      background: 'hsl(220 14% 20% / 0.5)',
    },
    icon: 'Clock',
    animation: 'pulse',
    intensity: 'idle',
  },
  in_progress: {
    label: 'In Progress',
    colour: {
      primary: 'hsl(217 91% 60%)',
      glow: 'hsl(217 91% 60% / 0.4)',
      background: 'hsl(217 91% 60% / 0.1)',
    },
    icon: 'Activity',
    animation: 'spin',
    intensity: 'active',
  },
  awaiting_verification: {
    label: 'Awaiting Verification',
    colour: {
      primary: 'hsl(38 92% 50%)',
      glow: 'hsl(38 92% 50% / 0.4)',
      background: 'hsl(38 92% 50% / 0.1)',
    },
    icon: 'Eye',
    animation: 'pulse',
    intensity: 'active',
  },
  verification_in_progress: {
    label: 'Verifying',
    colour: {
      primary: 'hsl(38 92% 50%)',
      glow: 'hsl(38 92% 50% / 0.4)',
      background: 'hsl(38 92% 50% / 0.1)',
    },
    icon: 'ScanLine',
    animation: 'spin',
    intensity: 'active',
  },
  verification_passed: {
    label: 'Verified',
    colour: {
      primary: 'hsl(142 76% 36%)',
      glow: 'hsl(142 76% 36% / 0.4)',
      background: 'hsl(142 76% 36% / 0.1)',
    },
    icon: 'CheckCircle',
    animation: 'none',
    intensity: 'idle',
  },
  verification_failed: {
    label: 'Verification Failed',
    colour: {
      primary: 'hsl(0 84% 60%)',
      glow: 'hsl(0 84% 60% / 0.4)',
      background: 'hsl(0 84% 60% / 0.1)',
    },
    icon: 'XCircle',
    animation: 'pulse',
    intensity: 'urgent',
  },
  completed: {
    label: 'Completed',
    colour: {
      primary: 'hsl(142 76% 36%)',
      glow: 'hsl(142 76% 36% / 0.4)',
      background: 'hsl(142 76% 36% / 0.1)',
    },
    icon: 'CheckCircle2',
    animation: 'none',
    intensity: 'idle',
  },
  failed: {
    label: 'Failed',
    colour: {
      primary: 'hsl(0 84% 60%)',
      glow: 'hsl(0 84% 60% / 0.5)',
      background: 'hsl(0 84% 60% / 0.15)',
    },
    icon: 'XCircle',
    animation: 'pulse',
    intensity: 'urgent',
  },
  blocked: {
    label: 'Blocked',
    colour: {
      primary: 'hsl(25 95% 53%)',
      glow: 'hsl(25 95% 53% / 0.4)',
      background: 'hsl(25 95% 53% / 0.1)',
    },
    icon: 'AlertTriangle',
    animation: 'pulse',
    intensity: 'urgent',
  },
  escalated_to_human: {
    label: 'Escalated',
    colour: {
      primary: 'hsl(262 83% 58%)',
      glow: 'hsl(262 83% 58% / 0.4)',
      background: 'hsl(262 83% 58% / 0.1)',
    },
    icon: 'UserCheck',
    animation: 'pulse',
    intensity: 'urgent',
  },
};

// ============================================================================
// CSS Custom Properties for Status Colours
// ============================================================================

export const STATUS_CSS_VARS: Record<AgentRunStatus, Record<string, string>> = {
  pending: {
    '--status-primary': '220 14% 46%',
    '--status-glow': '220 14% 46%',
    '--status-bg': '220 14% 20%',
  },
  in_progress: {
    '--status-primary': '217 91% 60%',
    '--status-glow': '217 91% 60%',
    '--status-bg': '217 91% 60%',
  },
  awaiting_verification: {
    '--status-primary': '38 92% 50%',
    '--status-glow': '38 92% 50%',
    '--status-bg': '38 92% 50%',
  },
  verification_in_progress: {
    '--status-primary': '38 92% 50%',
    '--status-glow': '38 92% 50%',
    '--status-bg': '38 92% 50%',
  },
  verification_passed: {
    '--status-primary': '142 76% 36%',
    '--status-glow': '142 76% 36%',
    '--status-bg': '142 76% 36%',
  },
  verification_failed: {
    '--status-primary': '0 84% 60%',
    '--status-glow': '0 84% 60%',
    '--status-bg': '0 84% 60%',
  },
  completed: {
    '--status-primary': '142 76% 36%',
    '--status-glow': '142 76% 36%',
    '--status-bg': '142 76% 36%',
  },
  failed: {
    '--status-primary': '0 84% 60%',
    '--status-glow': '0 84% 60%',
    '--status-bg': '0 84% 60%',
  },
  blocked: {
    '--status-primary': '25 95% 53%',
    '--status-glow': '25 95% 53%',
    '--status-bg': '25 95% 53%',
  },
  escalated_to_human: {
    '--status-primary': '262 83% 58%',
    '--status-glow': '262 83% 58%',
    '--status-bg': '262 83% 58%',
  },
};

// ============================================================================
// Animation Durations
// ============================================================================

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  pulse: {
    idle: 2000,
    active: 1500,
    urgent: 800,
  },
  transition: 200,
  stagger: 50,
} as const;

// ============================================================================
// Size Configurations
// ============================================================================

export const ORB_SIZES = {
  sm: { size: 48, strokeWidth: 4, fontSize: 'text-xs' },
  md: { size: 72, strokeWidth: 6, fontSize: 'text-sm' },
  lg: { size: 96, strokeWidth: 8, fontSize: 'text-base' },
} as const;

export const PULSE_SIZES = {
  sm: { size: 8, ringCount: 2 },
  md: { size: 12, ringCount: 3 },
} as const;

export const BADGE_SIZES = {
  sm: { padding: 'px-2 py-0.5', fontSize: 'text-xs', iconSize: 12 },
  md: { padding: 'px-2.5 py-1', fontSize: 'text-sm', iconSize: 14 },
  lg: { padding: 'px-3 py-1.5', fontSize: 'text-sm', iconSize: 16 },
} as const;

// ============================================================================
// Active Status Detection
// ============================================================================

export const ACTIVE_STATUSES: AgentRunStatus[] = [
  'pending',
  'in_progress',
  'awaiting_verification',
  'verification_in_progress',
];

export const TERMINAL_STATUSES: AgentRunStatus[] = [
  'verification_passed',
  'verification_failed',
  'completed',
  'failed',
  'blocked',
  'escalated_to_human',
];

export const ERROR_STATUSES: AgentRunStatus[] = ['verification_failed', 'failed', 'blocked'];

export const SUCCESS_STATUSES: AgentRunStatus[] = ['verification_passed', 'completed'];

// ============================================================================
// Helper Functions
// ============================================================================

export function isActiveStatus(status: AgentRunStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function isTerminalStatus(status: AgentRunStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isErrorStatus(status: AgentRunStatus): boolean {
  return ERROR_STATUSES.includes(status);
}

export function isSuccessStatus(status: AgentRunStatus): boolean {
  return SUCCESS_STATUSES.includes(status);
}

export function getStatusConfig(status: AgentRunStatus): StatusConfig {
  return STATUS_CONFIG[status];
}

export function getStatusCssVars(status: AgentRunStatus): Record<string, string> {
  return STATUS_CSS_VARS[status];
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULTS = {
  maxAgents: 10,
  maxNotifications: 50,
  maxTimelineSteps: 20,
  refreshInterval: 1000, // 1 second for elapsed timer
  reconnectDelay: 3000, // 3 seconds
  maxReconnectAttempts: 5,
} as const;

// ============================================================================
// Notification Types Configuration
// ============================================================================

export const NOTIFICATION_CONFIG = {
  start: {
    colour: 'hsl(217 91% 60%)',
    icon: 'Play',
    label: 'Started',
  },
  progress: {
    colour: 'hsl(217 91% 60%)',
    icon: 'TrendingUp',
    label: 'Progress',
  },
  complete: {
    colour: 'hsl(142 76% 36%)',
    icon: 'CheckCircle2',
    label: 'Completed',
  },
  error: {
    colour: 'hsl(0 84% 60%)',
    icon: 'XCircle',
    label: 'Error',
  },
  escalation: {
    colour: 'hsl(262 83% 58%)',
    icon: 'UserCheck',
    label: 'Escalated',
  },
  verification: {
    colour: 'hsl(38 92% 50%)',
    icon: 'Eye',
    label: 'Verification',
  },
} as const;
