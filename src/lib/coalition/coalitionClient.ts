/**
 * Coalition API Client
 *
 * Utilities for interacting with the coalition formation system.
 * Provides functions for forming coalitions, fetching status, and retrieving history.
 */

import { CoalitionProposal, CoalitionMember, CoalitionRole, HistoricalCoalition } from '@/state/useCoalitionStore';

/**
 * Create a new coalition for a task
 * POST /api/coalition/form
 */
export async function createCoalition(data: {
  workspaceId: string;
  taskId: string;
  taskComplexity: number;
  requiredCapabilities?: string[];
  candidateAgents: Array<{
    agentId: string;
    capabilities: string[];
    successRate: number;
    riskScore: number;
    loadFactor: number;
  }>;
}) {
  try {
    const response = await fetch('/api/coalition/form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create coalition');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating coalition:', error);
    throw error;
  }
}

/**
 * Get current coalition status
 * GET /api/coalition/status?workspaceId=<id>
 */
export async function getCoalitionStatus(workspaceId: string) {
  try {
    const response = await fetch(`/api/coalition/status?workspaceId=${workspaceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch coalition status');
    }

    const data = await response.json();
    return {
      hasActiveCoalition: data.hasActiveCoalition,
      coalition: data.coalition || null,
      memberDetails: data.memberDetails || [],
      roleAssignments: data.roleAssignments || [],
      recentCoalitions: data.recentCoalitions || [],
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Error fetching coalition status:', error);
    throw error;
  }
}

/**
 * Get coalition history and analytics
 * GET /api/coalition/history?workspaceId=<id>&limit=<limit>
 */
export async function getCoalitionHistory(workspaceId: string, limit: number = 50) {
  try {
    const response = await fetch(
      `/api/coalition/history?workspaceId=${workspaceId}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch coalition history');
    }

    const data = await response.json();
    return {
      analytics: {
        totalCoalitions: data.analytics.totalCoalitions,
        successfulCoalitions: data.analytics.successfulCoalitions,
        partialCoalitions: data.analytics.partialCoalitions,
        failedCoalitions: data.analytics.failedCoalitions,
        successRate: data.analytics.successRate,
        averageDuration: data.analytics.averageDuration,
        mostEffectiveLeader: data.analytics.mostEffectiveLeader,
        leaderStats: data.analytics.leaderStats || [],
      },
      patterns: data.patterns || [],
      recentCoalitions: data.recentCoalitions || [],
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Error fetching coalition history:', error);
    throw error;
  }
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format synergy score for display
 */
export function formatSynergyScore(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * Get color for synergy level
 */
export function getSynergyColor(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
  if (score >= 65) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
}

/**
 * Get synergy status label
 */
export function getSynergyStatusLabel(score: number): string {
  if (score >= 80) return 'Excellent Synergy';
  if (score >= 65) return 'Good Synergy';
  if (score >= 50) return 'Fair Synergy';
  return 'Low Synergy';
}

/**
 * Format role for display
 */
export function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Get color for role type
 */
export function getRoleColor(role: string): string {
  switch (role) {
    case 'leader':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
    case 'planner':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'executor':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'validator':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
  }
}

/**
 * Get outcome color
 */
export function getOutcomeColor(outcome: string): string {
  switch (outcome) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
    case 'partial_success':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'failure':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
  }
}

/**
 * Format outcome for display
 */
export function formatOutcome(outcome: string): string {
  return outcome.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Get risk color
 */
export function getRiskColor(riskScore: number): string {
  if (riskScore >= 80) return 'text-red-600 dark:text-red-400';
  if (riskScore >= 65) return 'text-orange-600 dark:text-orange-400';
  if (riskScore >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format time duration
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Format timestamp
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Get time elapsed since timestamp
 */
export function getTimeElapsed(timestamp: string): string {
  const created = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Check if coalition is in progress
 */
export function isCoalitionActive(coalition: CoalitionProposal | null): boolean {
  if (!coalition) return false;
  return coalition.status === 'proposed' || coalition.status === 'accepted' || coalition.status === 'executing';
}

/**
 * Get coalition status badge color
 */
export function getCoalitionStatusColor(status: string): string {
  switch (status) {
    case 'proposed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'executing':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
  }
}

/**
 * Format coalition status label
 */
export function formatCoalitionStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
