/**
 * Strategy Client - API utilities and formatters for the hierarchical strategy system
 * Provides client-side wrappers for strategy API endpoints and formatting utilities
 * for displaying strategy data in the UI
 */

import type {
  StrategyHierarchy,
  StrategyValidation,
  DecompositionMetrics,
  HistoricalStrategy,
  AgentValidation,
  StrategyConflict,
} from './index';

// ============================================================================
// API CLIENT UTILITIES
// ============================================================================

export interface StrategyCreateRequest {
  workspaceId: string;
  coalitionId: string;
  objectiveTitle: string;
  objectiveDescription?: string;
  context?: string;
  successCriteria?: string[];
  constraints?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface StrategyCreateResponse {
  success: boolean;
  strategy: {
    id: string;
    objectiveId: string;
    hierarchyScore: number;
    status: string;
    decomposition: {
      l1Count: number;
      l2Count: number;
      l3Count: number;
      l4Count: number;
    };
    estimatedEffort: {
      totalHours: number;
      criticalPathLength: number;
    };
    decompositionQuality: DecompositionMetrics;
    validation: {
      validationScore: number;
      overallStatus: string;
      consensusLevel: number;
      agentCount: number;
    };
    conflicts: {
      count: number;
      byType: Record<string, number>;
    };
    recommendations: string[];
  };
}

export interface StrategyStatusResponse {
  success: boolean;
  strategy: {
    id: string;
    status: string;
    hierarchyScore: number;
    createdAt: string;
    validatedAt?: string;
  };
  objective: {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
  } | null;
  decomposition: {
    levels: { l1: number; l2: number; l3: number; l4: number };
    totalItems: number;
    ratios: { l2ToL1: number; l3ToL2: number; l4ToL3: number };
  };
  effort: {
    totalHours: number;
    byLevel: { l2: number; l3: number; l4: number };
  };
  riskProfile: {
    byLevel: { low: number; medium: number; high: number; critical: number };
    totalCritical: number;
    totalHigh: number;
    healthScore: number;
  };
  validation: {
    validationScore: number | null;
    overallStatus: string;
    consensusLevel: number | null;
    agentCount: number;
    recommendations: string[];
    conflicts: { count: number; details: StrategyConflict[] };
    validatedAt: string | null;
  };
}

export interface StrategyHistoryResponse {
  success: boolean;
  analytics: {
    totalStrategies: number;
    totalArchives: number;
    successRate: number;
    avgHierarchyScore: number;
    avgExecutionHours: number;
    byStatus: {
      draft: number;
      validated: number;
      executing: number;
      completed: number;
    };
  };
  recentStrategies: Array<{
    id: string;
    objectiveId: string;
    status: string;
    hierarchyScore: number;
    decomposition: {
      l1: number;
      l2: number;
      l3: number;
      l4: number;
      total: number;
    };
    estimatedHours: number;
    createdAt: string;
    validatedAt?: string;
    completedAt?: string;
  }>;
  completedStrategies: Array<{
    id: string;
    strategyId: string;
    outcome: string;
    completionRate: number;
    timeEfficiency: number;
    costEfficiency: number;
    patterns: string[];
    insights: string[];
    archivedAt: string;
  }>;
  patterns: Array<{
    name: string;
    type: string;
    description: string;
    frequency: number;
    successRate: number;
    efficacy: number;
  }>;
}

/**
 * Create a new strategy hierarchy from an objective
 */
export async function createStrategy(
  request: StrategyCreateRequest,
  token?: string
): Promise<StrategyCreateResponse> {
  const url = new URL('/api/strategy/create', window.location.origin);
  url.searchParams.set('workspaceId', request.workspaceId);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      coalitionId: request.coalitionId,
      objectiveTitle: request.objectiveTitle,
      objectiveDescription: request.objectiveDescription,
      context: request.context,
      successCriteria: request.successCriteria,
      constraints: request.constraints,
      priority: request.priority || 'medium',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create strategy');
  }

  return response.json();
}

/**
 * Fetch current strategy status and validation results
 */
export async function fetchStrategyStatus(
  workspaceId: string,
  strategyId: string,
  token?: string
): Promise<StrategyStatusResponse> {
  const url = new URL('/api/strategy/status', window.location.origin);
  url.searchParams.set('workspaceId', workspaceId);
  url.searchParams.set('strategyId', strategyId);

  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch strategy status');
  }

  return response.json();
}

/**
 * Fetch strategy history, archives, and patterns
 */
export async function fetchStrategyHistory(
  workspaceId: string,
  options?: { limit?: number; coalitionId?: string },
  token?: string
): Promise<StrategyHistoryResponse> {
  const url = new URL('/api/strategy/history', window.location.origin);
  url.searchParams.set('workspaceId', workspaceId);

  if (options?.limit) {
    url.searchParams.set('limit', options.limit.toString());
  }

  if (options?.coalitionId) {
    url.searchParams.set('coalitionId', options.coalitionId);
  }

  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch strategy history');
  }

  return response.json();
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format hierarchy score with color coding
 * 0-25: Red (poor), 25-50: Orange (fair), 50-75: Yellow (good), 75-100: Green (excellent)
 */
export function formatHierarchyScore(score: number): {
  formatted: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
} {
  const normalizedScore = Math.max(0, Math.min(100, score));

  let color: string;
  let backgroundColor: string;
  let borderColor: string;

  if (normalizedScore >= 75) {
    color = '#10b981'; // Green-600
    backgroundColor = '#d1fae5'; // Green-100
    borderColor = '#6ee7b7'; // Green-400
  } else if (normalizedScore >= 50) {
    color = '#f59e0b'; // Amber-500
    backgroundColor = '#fef3c7'; // Amber-100
    borderColor = '#fcd34d'; // Amber-300
  } else if (normalizedScore >= 25) {
    color = '#f97316'; // Orange-500
    backgroundColor = '#fed7aa'; // Orange-100
    borderColor = '#fb923c'; // Orange-400
  } else {
    color = '#ef4444'; // Red-500
    backgroundColor = '#fee2e2'; // Red-100
    borderColor = '#fca5a5'; // Red-400
  }

  return {
    formatted: `${normalizedScore.toFixed(1)}%`,
    color,
    backgroundColor,
    borderColor,
  };
}

/**
 * Format risk level with icon and color
 */
export function formatRiskLevel(risk: 'low' | 'medium' | 'high' | 'critical'): {
  label: string;
  color: string;
  backgroundColor: string;
  icon: string;
} {
  const config = {
    low: {
      label: 'Low Risk',
      color: '#10b981',
      backgroundColor: '#d1fae5',
      icon: '✓',
    },
    medium: {
      label: 'Medium Risk',
      color: '#f59e0b',
      backgroundColor: '#fef3c7',
      icon: '!',
    },
    high: {
      label: 'High Risk',
      color: '#f97316',
      backgroundColor: '#fed7aa',
      icon: '⚠',
    },
    critical: {
      label: 'Critical Risk',
      color: '#ef4444',
      backgroundColor: '#fee2e2',
      icon: '✕',
    },
  };

  return config[risk];
}

/**
 * Get color for validation status
 */
export function getValidationStatusColor(
  status: 'approved' | 'needs_revision' | 'rejected' | 'not_validated'
): {
  color: string;
  backgroundColor: string;
  borderColor: string;
  label: string;
} {
  const config = {
    approved: {
      color: '#10b981',
      backgroundColor: '#d1fae5',
      borderColor: '#6ee7b7',
      label: 'Approved',
    },
    needs_revision: {
      color: '#f59e0b',
      backgroundColor: '#fef3c7',
      borderColor: '#fcd34d',
      label: 'Needs Revision',
    },
    rejected: {
      color: '#ef4444',
      backgroundColor: '#fee2e2',
      borderColor: '#fca5a5',
      label: 'Rejected',
    },
    not_validated: {
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      borderColor: '#d1d5db',
      label: 'Not Validated',
    },
  };

  return config[status];
}

/**
 * Get color for decomposition quality
 */
export function getDecompositionQualityColor(
  quality: 'excellent' | 'good' | 'fair' | 'poor'
): {
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: string;
} {
  const config = {
    excellent: {
      color: '#059669',
      backgroundColor: '#d1fae5',
      borderColor: '#6ee7b7',
      icon: '★★★★★',
    },
    good: {
      color: '#10b981',
      backgroundColor: '#d1fae5',
      borderColor: '#6ee7b7',
      icon: '★★★★☆',
    },
    fair: {
      color: '#f59e0b',
      backgroundColor: '#fef3c7',
      borderColor: '#fcd34d',
      icon: '★★★☆☆',
    },
    poor: {
      color: '#ef4444',
      backgroundColor: '#fee2e2',
      borderColor: '#fca5a5',
      icon: '★☆☆☆☆',
    },
  };

  return config[quality];
}

/**
 * Get color for pattern type
 */
export function getPatternColor(
  patternType: string
): {
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: string;
} {
  const colorMap: Record<
    string,
    { color: string; backgroundColor: string; borderColor: string; icon: string }
  > = {
    high_quality_strategy: {
      color: '#10b981',
      backgroundColor: '#d1fae5',
      borderColor: '#6ee7b7',
      icon: '⭐',
    },
    efficient_hierarchy: {
      color: '#0ea5e9',
      backgroundColor: '#cffafe',
      borderColor: '#7dd3fc',
      icon: '⚡',
    },
    risky_strategy: {
      color: '#f97316',
      backgroundColor: '#fed7aa',
      borderColor: '#fb923c',
      icon: '⚠',
    },
    overcomplicated_strategy: {
      color: '#f59e0b',
      backgroundColor: '#fef3c7',
      borderColor: '#fcd34d',
      icon: '🔀',
    },
    effective_decomposition: {
      color: '#8b5cf6',
      backgroundColor: '#ede9fe',
      borderColor: '#d8b4fe',
      icon: '✓',
    },
  };

  return colorMap[patternType] || {
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    icon: '•',
  };
}

/**
 * Get color for conflict type
 */
export function getConflictTypeColor(
  conflictType: string
): {
  color: string;
  backgroundColor: string;
  borderColor: string;
} {
  const colorMap: Record<string, { color: string; backgroundColor: string; borderColor: string }> = {
    contradiction: { color: '#ef4444', backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
    circular_dependency: {
      color: '#f97316',
      backgroundColor: '#fed7aa',
      borderColor: '#fb923c',
    },
    resource_conflict: {
      color: '#f59e0b',
      backgroundColor: '#fef3c7',
      borderColor: '#fcd34d',
    },
    timing_conflict: { color: '#0ea5e9', backgroundColor: '#cffafe', borderColor: '#7dd3fc' },
    capability_mismatch: {
      color: '#8b5cf6',
      backgroundColor: '#ede9fe',
      borderColor: '#d8b4fe',
    },
  };

  return colorMap[conflictType] || {
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  };
}

/**
 * Get severity color
 */
export function getSeverityColor(
  severity: 'low' | 'medium' | 'high' | 'critical'
): {
  color: string;
  backgroundColor: string;
  borderColor: string;
} {
  const config = {
    low: { color: '#10b981', backgroundColor: '#d1fae5', borderColor: '#6ee7b7' },
    medium: { color: '#f59e0b', backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
    high: { color: '#f97316', backgroundColor: '#fed7aa', borderColor: '#fb923c' },
    critical: { color: '#ef4444', backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  };

  return config[severity];
}

/**
 * Get status color for strategies
 */
export function getStrategyStatusColor(
  status: 'draft' | 'validated' | 'executing' | 'completed'
): {
  color: string;
  backgroundColor: string;
  borderColor: string;
  label: string;
} {
  const config = {
    draft: {
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      borderColor: '#d1d5db',
      label: 'Draft',
    },
    validated: {
      color: '#0ea5e9',
      backgroundColor: '#cffafe',
      borderColor: '#7dd3fc',
      label: 'Validated',
    },
    executing: {
      color: '#8b5cf6',
      backgroundColor: '#ede9fe',
      borderColor: '#d8b4fe',
      label: 'Executing',
    },
    completed: {
      color: '#10b981',
      backgroundColor: '#d1fae5',
      borderColor: '#6ee7b7',
      label: 'Completed',
    },
  };

  return config[status];
}

/**
 * Get outcome color for archived strategies
 */
export function getOutcomeColor(
  outcome: 'successful' | 'partial_success' | 'failed'
): {
  color: string;
  backgroundColor: string;
  borderColor: string;
  label: string;
  icon: string;
} {
  const config = {
    successful: {
      color: '#10b981',
      backgroundColor: '#d1fae5',
      borderColor: '#6ee7b7',
      label: 'Successful',
      icon: '✓',
    },
    partial_success: {
      color: '#f59e0b',
      backgroundColor: '#fef3c7',
      borderColor: '#fcd34d',
      label: 'Partial Success',
      icon: '~',
    },
    failed: {
      color: '#ef4444',
      backgroundColor: '#fee2e2',
      borderColor: '#fca5a5',
      label: 'Failed',
      icon: '✕',
    },
  };

  return config[outcome];
}

/**
 * Alternative export name (used in timeline component)
 */
export function formatOutcomeColor(
  outcome: 'successful' | 'partial_success' | 'failed'
): {
  color: string;
  backgroundColor: string;
  borderColor: string;
  label: string;
  icon: string;
} {
  return getOutcomeColor(outcome);
}

// ============================================================================
// HIERARCHY ANALYSIS UTILITIES
// ============================================================================

/**
 * Calculate L2:L1 ratio (should be 3-5)
 */
export function getL2ToL1Ratio(l1Count: number, l2Count: number): {
  ratio: number;
  isBalanced: boolean;
  recommendation: string;
} {
  const ratio = l1Count > 0 ? l2Count / l1Count : 0;

  return {
    ratio: parseFloat(ratio.toFixed(2)),
    isBalanced: ratio >= 3 && ratio <= 5,
    recommendation:
      ratio < 3
        ? `Add ${Math.ceil(3 * l1Count - l2Count)} more L2 pillars (target 3-5 per objective)`
        : ratio > 5
          ? `Consolidate ${Math.ceil(l2Count - 5 * l1Count)} L2 pillars (target 3-5 per objective)`
          : 'L2 pillar count is well-balanced',
  };
}

/**
 * Calculate L3:L2 ratio (should be 2-4)
 */
export function getL3ToL2Ratio(l2Count: number, l3Count: number): {
  ratio: number;
  isBalanced: boolean;
  recommendation: string;
} {
  const ratio = l2Count > 0 ? l3Count / l2Count : 0;

  return {
    ratio: parseFloat(ratio.toFixed(2)),
    isBalanced: ratio >= 2 && ratio <= 4,
    recommendation:
      ratio < 2
        ? `Add ${Math.ceil(2 * l2Count - l3Count)} more L3 tactics (target 2-4 per pillar)`
        : ratio > 4
          ? `Consolidate ${Math.ceil(l3Count - 4 * l2Count)} L3 tactics (target 2-4 per pillar)`
          : 'L3 tactic count is well-balanced',
  };
}

/**
 * Calculate L4:L3 ratio (should be 2-3)
 */
export function getL4ToL3Ratio(l3Count: number, l4Count: number): {
  ratio: number;
  isBalanced: boolean;
  recommendation: string;
} {
  const ratio = l3Count > 0 ? l4Count / l3Count : 0;

  return {
    ratio: parseFloat(ratio.toFixed(2)),
    isBalanced: ratio >= 2 && ratio <= 3,
    recommendation:
      ratio < 2
        ? `Add ${Math.ceil(2 * l3Count - l4Count)} more L4 tasks (target 2-3 per tactic)`
        : ratio > 3
          ? `Consolidate ${Math.ceil(l4Count - 3 * l3Count)} L4 tasks (target 2-3 per tactic)`
          : 'L4 task count is well-balanced',
  };
}

/**
 * Get overall hierarchy balance assessment
 */
export function getDecompositionRatio(l2: number, l3: number, l4: number): {
  l2ToL1: number;
  l3ToL2: number;
  l4ToL3: number;
  isWellBalanced: boolean;
  recommendations: string[];
} {
  const l2Ratio = getL2ToL1Ratio(1, l2);
  const l3Ratio = getL3ToL2Ratio(l2, l3);
  const l4Ratio = getL4ToL3Ratio(l3, l4);

  const recommendations: string[] = [];
  if (!l2Ratio.isBalanced) recommendations.push(l2Ratio.recommendation);
  if (!l3Ratio.isBalanced) recommendations.push(l3Ratio.recommendation);
  if (!l4Ratio.isBalanced) recommendations.push(l4Ratio.recommendation);

  return {
    l2ToL1: l2Ratio.ratio,
    l3ToL2: l3Ratio.ratio,
    l4ToL3: l4Ratio.ratio,
    isWellBalanced: l2Ratio.isBalanced && l3Ratio.isBalanced && l4Ratio.isBalanced,
    recommendations,
  };
}

/**
 * Calculate total items across all levels
 */
export function getTotalItems(l1: number, l2: number, l3: number, l4: number): number {
  return l1 + l2 + l3 + l4;
}

/**
 * Assess complexity based on item count
 */
export function assessComplexity(totalItems: number): {
  level: 'simple' | 'moderate' | 'complex' | 'very_complex';
  description: string;
} {
  if (totalItems < 10)
    return { level: 'simple', description: 'Simple strategy with few moving parts' };
  if (totalItems < 25)
    return { level: 'moderate', description: 'Moderate complexity with manageable scope' };
  if (totalItems < 50)
    return { level: 'complex', description: 'Complex strategy requiring careful coordination' };
  return {
    level: 'very_complex',
    description: 'Very complex strategy with significant execution risk',
  };
}

/**
 * Format effort estimate for display
 */
export function formatEffortEstimate(hours: number): {
  formatted: string;
  days: number;
  weeks: number;
} {
  const days = Math.ceil(hours / 8);
  const weeks = Math.ceil(days / 5);

  let formatted = '';
  if (hours < 8) {
    formatted = `${hours.toFixed(1)} hours`;
  } else if (days < 5) {
    formatted = `${days} day${days > 1 ? 's' : ''}`;
  } else {
    formatted = `${weeks} week${weeks > 1 ? 's' : ''}`;
  }

  return { formatted, days, weeks };
}

/**
 * Format efficiency score with assessment
 */
export function formatEfficiencyScore(
  score: number,
  type: 'time' | 'cost'
): {
  formatted: string;
  assessment: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
} {
  const normalizedScore = Math.max(0, Math.min(100, score));

  let assessment: 'excellent' | 'good' | 'fair' | 'poor';
  let color: string;

  if (normalizedScore >= 90) {
    assessment = 'excellent';
    color = '#10b981';
  } else if (normalizedScore >= 75) {
    assessment = 'good';
    color = '#f59e0b';
  } else if (normalizedScore >= 60) {
    assessment = 'fair';
    color = '#f97316';
  } else {
    assessment = 'poor';
    color = '#ef4444';
  }

  const typeLabel = type === 'time' ? ' time efficiency' : ' cost efficiency';

  return {
    formatted: `${normalizedScore.toFixed(0)}%${typeLabel}`,
    assessment,
    color,
  };
}

/**
 * Format consensus level with interpretation
 */
export function formatConsensusLevel(consensus: number): {
  formatted: string;
  interpretation: 'strong' | 'moderate' | 'weak' | 'none';
  color: string;
} {
  const normalizedConsensus = Math.max(0, Math.min(100, consensus));

  let interpretation: 'strong' | 'moderate' | 'weak' | 'none';
  let color: string;

  if (normalizedConsensus >= 80) {
    interpretation = 'strong';
    color = '#10b981';
  } else if (normalizedConsensus >= 60) {
    interpretation = 'moderate';
    color = '#f59e0b';
  } else if (normalizedConsensus >= 40) {
    interpretation = 'weak';
    color = '#f97316';
  } else {
    interpretation = 'none';
    color = '#ef4444';
  }

  return {
    formatted: `${normalizedConsensus.toFixed(0)}% consensus`,
    interpretation,
    color,
  };
}

/**
 * Get health score assessment with detailed breakdown
 */
export function assessHealthScore(
  score: number
): {
  score: number;
  assessment: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
  color: string;
  backgroundColor: string;
  description: string;
} {
  const normalizedScore = Math.max(0, Math.min(100, score));

  let assessment: 'critical' | 'poor' | 'fair' | 'good' | 'excellent';
  let color: string;
  let backgroundColor: string;
  let description: string;

  if (normalizedScore >= 80) {
    assessment = 'excellent';
    color = '#059669';
    backgroundColor = '#d1fae5';
    description = 'Strategy is well-structured with minimal risk';
  } else if (normalizedScore >= 60) {
    assessment = 'good';
    color = '#10b981';
    backgroundColor = '#d1fae5';
    description = 'Strategy is sound with manageable risk';
  } else if (normalizedScore >= 40) {
    assessment = 'fair';
    color = '#f59e0b';
    backgroundColor = '#fef3c7';
    description = 'Strategy has notable risks that should be addressed';
  } else if (normalizedScore >= 20) {
    assessment = 'poor';
    color = '#f97316';
    backgroundColor = '#fed7aa';
    description = 'Strategy has significant risks requiring revision';
  } else {
    assessment = 'critical';
    color = '#ef4444';
    backgroundColor = '#fee2e2';
    description = 'Strategy is at critical risk and requires major revision';
  }

  return {
    score: normalizedScore,
    assessment,
    color,
    backgroundColor,
    description,
  };
}

/**
 * Format completion rate
 */
export function formatCompletionRate(rate: number): {
  formatted: string;
  color: string;
  assessment: string;
} {
  const normalizedRate = Math.max(0, Math.min(100, rate));

  let color: string;
  let assessment: string;

  if (normalizedRate >= 90) {
    color = '#10b981';
    assessment = 'Excellent completion';
  } else if (normalizedRate >= 70) {
    color = '#f59e0b';
    assessment = 'Good completion';
  } else if (normalizedRate >= 50) {
    color = '#f97316';
    assessment = 'Fair completion';
  } else {
    color = '#ef4444';
    assessment = 'Poor completion';
  }

  return {
    formatted: `${normalizedRate.toFixed(0)}% complete`,
    color,
    assessment,
  };
}

/**
 * Format success rate
 */
export function formatSuccessRate(rate: number): {
  formatted: string;
  color: string;
} {
  const normalizedRate = Math.max(0, Math.min(100, rate));

  let color: string;

  if (normalizedRate >= 75) {
    color = '#10b981';
  } else if (normalizedRate >= 50) {
    color = '#f59e0b';
  } else if (normalizedRate >= 25) {
    color = '#f97316';
  } else {
    color = '#ef4444';
  }

  return {
    formatted: `${normalizedRate.toFixed(0)}% successful`,
    color,
  };
}

/**
 * Get agent type label and icon
 */
export function getAgentInfo(agentId: string): {
  label: string;
  description: string;
  icon: string;
  color: string;
} {
  const agentMap: Record<
    string,
    { label: string; description: string; icon: string; color: string }
  > = {
    'executor-agent': {
      label: 'Executor',
      description: 'Evaluates feasibility and resource requirements',
      icon: '⚙',
      color: '#0ea5e9',
    },
    'validator-agent': {
      label: 'Validator',
      description: 'Assesses quality and correctness',
      icon: '✓',
      color: '#10b981',
    },
    'planner-agent': {
      label: 'Planner',
      description: 'Verifies alignment with objectives',
      icon: '📋',
      color: '#8b5cf6',
    },
    'leader-agent': {
      label: 'Leader',
      description: 'Reviews resource allocation and strategy',
      icon: '👤',
      color: '#f59e0b',
    },
  };

  return agentMap[agentId] || {
    label: 'Unknown Agent',
    description: 'Agent type not recognized',
    icon: '?',
    color: '#6b7280',
  };
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return 'Not yet';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Get all formatting utilities as a single export for convenience
 */
export const strategyFormatters = {
  formatHierarchyScore,
  formatRiskLevel,
  getValidationStatusColor,
  getDecompositionQualityColor,
  getPatternColor,
  getConflictTypeColor,
  getSeverityColor,
  getStrategyStatusColor,
  getOutcomeColor,
  getDecompositionRatio,
  getTotalItems,
  assessComplexity,
  formatEffortEstimate,
  formatEfficiencyScore,
  formatConsensusLevel,
  assessHealthScore,
  formatCompletionRate,
  formatSuccessRate,
  getAgentInfo,
  formatTimestamp,
};
