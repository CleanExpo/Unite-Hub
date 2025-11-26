/**
 * Goal Engine
 *
 * Implements structured business and personal goal definition, tracking, and decomposition.
 * Supports hierarchical goals (annual → quarterly → monthly → weekly).
 * Integrates with business brain for real-time progress tracking.
 */

export type GoalDomain = 'leads' | 'revenue' | 'operations' | 'profit' | 'health' | 'learning' | 'relationships';
export type GoalFrequency = 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'daily';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'abandoned' | 'at-risk';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface BusinessGoal {
  id: string;
  domain: GoalDomain;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  frequency: GoalFrequency;
  deadline: string; // ISO date
  priority: GoalPriority;
  status: GoalStatus;
  owner: string; // 'phill' or team member email
  parentGoalId?: string; // For hierarchical goals
  keyResults?: KeyResult[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number; // 0-1, should sum to 1.0 across KRs
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
}

export interface GoalProgress {
  goalId: string;
  progressPercent: number; // 0-100
  isOnTrack: boolean;
  daysRemaining: number;
  velocityPerDay: number;
  estimatedCompletion: string; // ISO date
  riskLevel: 'safe' | 'medium' | 'at-risk' | 'critical';
}

// In-memory storage (wire to database in production)
let goals: BusinessGoal[] = [];

/**
 * Register a new goal
 */
export function registerGoal(input: Omit<BusinessGoal, 'id' | 'createdAt' | 'updatedAt' | 'status'>): BusinessGoal {
  const goal: BusinessGoal = {
    id: crypto.randomUUID(),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...input
  };

  goals.push(goal);
  return goal;
}

/**
 * List goals filtered by domain or status
 */
export function listGoals(filters?: { domain?: GoalDomain; status?: GoalStatus; owner?: string }): BusinessGoal[] {
  return goals.filter(g => {
    if (filters?.domain && g.domain !== filters.domain) return false;
    if (filters?.status && g.status !== filters.status) return false;
    if (filters?.owner && g.owner !== filters.owner) return false;
    return true;
  });
}

/**
 * Get goal by ID
 */
export function getGoal(id: string): BusinessGoal | null {
  return goals.find(g => g.id === id) || null;
}

/**
 * Update goal progress
 */
export function updateGoalProgress(id: string, currentValue: number): BusinessGoal | null {
  const goal = goals.find(g => g.id === id);
  if (!goal) return null;

  goal.currentValue = currentValue;
  goal.updatedAt = new Date().toISOString();

  // Auto-update status based on progress
  const evaluation = evaluateGoalProgress(goal);
  if (evaluation.progressPercent >= 100) {
    goal.status = 'completed';
    goal.completedAt = new Date().toISOString();
  } else if (!evaluation.isOnTrack) {
    goal.status = 'at-risk';
  } else if (goal.status === 'at-risk') {
    goal.status = 'active'; // Recovered
  }

  return goal;
}

/**
 * Update key result
 */
export function updateKeyResult(goalId: string, krId: string, currentValue: number): BusinessGoal | null {
  const goal = goals.find(g => g.id === goalId);
  if (!goal || !goal.keyResults) return null;

  const kr = goal.keyResults.find(k => k.id === krId);
  if (!kr) return null;

  kr.currentValue = currentValue;

  // Determine KR status
  const krProgress = currentValue / kr.targetValue;
  if (krProgress >= 1) {
    kr.status = 'completed';
  } else if (krProgress >= 0.5) {
    kr.status = 'in_progress';
  } else if (krProgress >= 0.25) {
    kr.status = 'at_risk';
  } else {
    kr.status = 'not_started';
  }

  goal.updatedAt = new Date().toISOString();
  return goal;
}

/**
 * Evaluate goal progress
 */
export function evaluateGoalProgress(goal: BusinessGoal): GoalProgress {
  const progressPercent = goal.targetValue === 0 ? 0 : Math.min(100, (goal.currentValue / goal.targetValue) * 100);
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

  const velocityPerDay = goal.currentValue / daysElapsed;
  const remainingValue = goal.targetValue - goal.currentValue;
  const daysNeeded = velocityPerDay > 0 ? Math.ceil(remainingValue / velocityPerDay) : Infinity;

  const isOnTrack = daysNeeded <= daysRemaining;

  // Risk level based on progress and time
  let riskLevel: GoalProgress['riskLevel'] = 'safe';
  if (progressPercent >= 90) {
    riskLevel = 'safe';
  } else if (progressPercent >= 70 && isOnTrack) {
    riskLevel = 'safe';
  } else if (progressPercent >= 50 && isOnTrack) {
    riskLevel = 'medium';
  } else if (progressPercent >= 25) {
    riskLevel = 'at-risk';
  } else {
    riskLevel = 'critical';
  }

  const estimatedCompletion = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    goalId: goal.id,
    progressPercent: Math.round(progressPercent),
    isOnTrack,
    daysRemaining,
    velocityPerDay: Math.round(velocityPerDay * 100) / 100,
    estimatedCompletion,
    riskLevel
  };
}

/**
 * Get domain goals with progress
 */
export function getGoalsByDomain(domain: GoalDomain): (BusinessGoal & { progress: GoalProgress })[] {
  return listGoals({ domain }).map(goal => ({
    ...goal,
    progress: evaluateGoalProgress(goal)
  }));
}

/**
 * Complete goal manually
 */
export function completeGoal(id: string, notes?: string): BusinessGoal | null {
  const goal = goals.find(g => g.id === id);
  if (!goal) return null;

  goal.status = 'completed';
  goal.completedAt = new Date().toISOString();
  goal.currentValue = goal.targetValue;
  goal.updatedAt = goal.completedAt;

  return goal;
}

/**
 * Pause goal
 */
export function pauseGoal(id: string): BusinessGoal | null {
  const goal = goals.find(g => g.id === id);
  if (!goal) return null;

  goal.status = 'paused';
  goal.updatedAt = new Date().toISOString();

  return goal;
}

/**
 * Resume goal
 */
export function resumeGoal(id: string): BusinessGoal | null {
  const goal = goals.find(g => g.id === id);
  if (!goal) return null;

  goal.status = 'active';
  goal.updatedAt = new Date().toISOString();

  return goal;
}

/**
 * Get all goals with risk assessment
 */
export function getAllGoalsWithRiskAssessment(): (BusinessGoal & { progress: GoalProgress })[] {
  return goals.map(goal => ({
    ...goal,
    progress: evaluateGoalProgress(goal)
  }));
}

/**
 * Get critical/at-risk goals
 */
export function getCriticalGoals(): (BusinessGoal & { progress: GoalProgress })[] {
  return getAllGoalsWithRiskAssessment().filter(g => g.progress.riskLevel === 'critical' || g.progress.riskLevel === 'at-risk');
}

/**
 * Clear all goals (for testing)
 */
export function clearGoals(): void {
  goals = [];
}
