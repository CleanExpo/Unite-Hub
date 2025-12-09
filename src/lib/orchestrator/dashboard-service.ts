/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/* global fetch, URLSearchParams */

/**
 * Orchestrator Dashboard Data Service
 *
 * Provides data formatting, analysis, and utility functions for dashboard UI
 *
 * Note: This service is used by client components, so we avoid importing
 * server-only modules like winston/logger. Use browser console for debugging.
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface TaskListFilter {
  status?: 'completed' | 'failed' | 'running' | 'pending' | 'halted';
  limit?: number;
  sortBy?: 'created_at' | 'duration' | 'status';
  order?: 'asc' | 'desc';
  workspaceId: string;
}

export interface TaskForUI {
  id: string;
  objective: string;
  status: string;
  statusColor: string;
  statusIcon: string;
  createdAt: string;
  createdAtRelative: string;
  duration: number | null;
  durationFormatted: string;
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
  agentChain: string[];
  riskScore: number;
  confidenceScore: number;
}

export interface ExecutionTimelineItem {
  stepIndex: number;
  assignedAgent: string;
  status: string;
  statusColor: string;
  verified: boolean;
  verificationAttempts: number;
  startTime: number | null;
  endTime: number | null;
  duration: number | null;
  durationFormatted: string;
  outputSummary?: string;
}

export interface FailureAnalysis {
  rootCause: string;
  failureType: string;
  failedSteps: Array<{
    stepIndex: number;
    assignedAgent: string;
    error: string;
    verificationAttempts: number;
  }>;
  impactedSteps: Array<{
    stepIndex: number;
    assignedAgent: string;
    status: string;
  }>;
  recoverySuggestions: Array<{
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

// ============================================================================
// TASK LIST OPERATIONS
// ============================================================================

/**
 * Fetch task list with filters
 */
export async function getTaskList(
  filters: TaskListFilter,
  token?: string
): Promise<{ tasks: any[]; count: number }> {
  try {
    const supabase = createClient();
    const params = new URLSearchParams({
      workspaceId: filters.workspaceId,
      ...(filters.status && { status: filters.status }),
      ...(filters.limit && { limit: filters.limit.toString() }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
      ...(filters.order && { order: filters.order }),
    });

    const response = await fetch(`/api/orchestrator/dashboard/tasks?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      tasks: data.tasks || [],
      count: data.count || 0,
    };
  } catch (error) {
    console.error('Failed to fetch task list', {
      error: error instanceof Error ? error.message : String(error),
      filters,
    });
    throw error;
  }
}

/**
 * Fetch task detail with full execution trace
 */
export async function getTaskDetail(
  taskId: string,
  workspaceId: string,
  token?: string
): Promise<any> {
  try {
    const params = new URLSearchParams({ workspaceId });
    const response = await fetch(`/api/orchestrator/dashboard/tasks/${taskId}?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch task detail: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch task detail', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format task for UI display
 */
export function formatTaskForUI(task: any): TaskForUI {
  const trace = task.trace || {};
  const steps = trace.steps || [];
  const completedSteps = steps.filter((s: any) => s.status === 'completed').length;

  return {
    id: task.id,
    objective: task.objective || 'Untitled Task',
    status: task.status,
    statusColor: getStatusColor(task.status),
    statusIcon: getStatusIcon(task.status),
    createdAt: task.created_at,
    createdAtRelative: formatRelativeTime(task.created_at),
    duration: task.total_time_ms,
    durationFormatted: formatDuration(task.total_time_ms),
    completedSteps,
    totalSteps: steps.length,
    progressPercent: steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0,
    agentChain: trace.agentChain || [],
    riskScore: trace.riskScore || 0,
    confidenceScore: trace.confidenceScore || 0,
  };
}

/**
 * Get execution timeline from task
 */
export function getExecutionTimeline(task: any): ExecutionTimelineItem[] {
  const trace = task.trace || {};
  const steps = trace.steps || [];

  return steps.map((step: any, index: number) => ({
    stepIndex: index,
    assignedAgent: step.assignedAgent || 'Unknown',
    status: step.status,
    statusColor: getStatusColor(step.status),
    verified: step.verified || false,
    verificationAttempts: step.verificationAttempts || 0,
    startTime: step.startTime,
    endTime: step.endTime,
    duration: step.endTime && step.startTime ? step.endTime - step.startTime : null,
    durationFormatted: formatDuration(
      step.endTime && step.startTime ? step.endTime - step.startTime : null
    ),
    outputSummary: step.outputPayload
      ? JSON.stringify(step.outputPayload).slice(0, 100) + '...'
      : undefined,
  }));
}

/**
 * Get failure analysis (calls API)
 */
export async function getFailureAnalysis(
  taskId: string,
  workspaceId: string,
  token?: string
): Promise<FailureAnalysis | null> {
  try {
    const params = new URLSearchParams({ workspaceId });
    const response = await fetch(`/api/orchestrator/dashboard/tasks/${taskId}/failures?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch failure analysis: ${response.statusText}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Failed to fetch failure analysis', {
      taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Suggest recovery actions for failed task
 */
export function suggestRecoveryActions(task: any): Array<{
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const suggestions = [];

  const trace = task.trace || {};
  const steps = trace.steps || [];
  const failedSteps = steps.filter((s: any) => s.status === 'failed');

  // Suggest retry if attempts < 3
  if (failedSteps.some((s: any) => (s.verificationAttempts || 0) < 3)) {
    suggestions.push({
      action: 'Retry failed steps',
      description: `${failedSteps.length} step(s) failed and can be retried automatically.`,
      priority: 'high' as const,
    });
  }

  // Suggest manual review if verification failed
  if (failedSteps.some((s: any) => s.lastVerificationError)) {
    suggestions.push({
      action: 'Review verification criteria',
      description: 'Some steps failed verification. Check if criteria are correct.',
      priority: 'high' as const,
    });
  }

  // Suggest breaking down task if risk score high
  if (trace.riskScore > 0.7) {
    suggestions.push({
      action: 'Break down into smaller tasks',
      description: 'High risk score detected. Consider splitting into smaller operations.',
      priority: 'medium' as const,
    });
  }

  return suggestions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get status color for badge
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'green';
    case 'failed':
    case 'halted':
      return 'red';
    case 'running':
      return 'blue';
    case 'pending':
      return 'yellow';
    case 'paused':
      return 'orange';
    default:
      return 'gray';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'failed':
    case 'halted':
      return '❌';
    case 'running':
      return '🔄';
    case 'pending':
      return '⏳';
    case 'paused':
      return '⏸️';
    default:
      return '❓';
  }
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) {
    return 'N/A';
  }

  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format timestamp as relative time
 */
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format absolute timestamp
 */
export function formatAbsoluteTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}
