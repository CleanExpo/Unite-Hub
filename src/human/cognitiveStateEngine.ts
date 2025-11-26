/**
 * Phase 10 – Cognitive State Engine
 *
 * Converts life signals + recent workload into a cognitive state model.
 * Used to decide when Parallel Phill should push, slow down, or suggest rest.
 */

import type { LifeSignalSnapshot } from './lifeSignalIngestor';

export type CognitiveState = 'sharp' | 'good' | 'tired' | 'fatigued' | 'overloaded';

export interface CognitiveStateAssessment {
  state: CognitiveState;
  score: number; // 0-100
  factors: { factor: string; weight: number; value: number }[];
  recommendations: string[];
  task_suitability: {
    task_type: string;
    suitability: 'ideal' | 'ok' | 'difficult' | 'not_recommended';
  }[];
}

/**
 * Derive cognitive state from life signals and context
 */
export function deriveCognitiveState(
  signals: LifeSignalSnapshot,
  recentWorkload?: { tasks_completed: number; hours_focused: number }
): CognitiveStateAssessment {
  const factors: { factor: string; weight: number; value: number }[] = [];

  // Extract key signals
  let sleepHours = 7;
  let recoveryPercent = 70;
  let stressLevel = 5;
  let calendarLoadPercent = 50;
  let activeMinutes = 30;

  for (const signal of signals.signals) {
    if (signal.signal_type === 'sleep_hours') sleepHours = signal.value;
    if (signal.signal_type === 'recovery_percent') recoveryPercent = signal.value;
    if (signal.signal_type === 'stress_level') stressLevel = signal.value;
    if (signal.signal_type === 'calendar_load_percent') calendarLoadPercent = signal.value;
    if (signal.signal_type === 'active_minutes') activeMinutes = signal.value;
  }

  // Sleep factor (weight: 0.35)
  let sleepScore = sleepHours >= 7 && sleepHours <= 9 ? 100 : Math.max(0, 100 - Math.abs(sleepHours - 8) * 15);
  factors.push({ factor: 'sleep_hours', weight: 0.35, value: sleepScore });

  // Recovery factor (weight: 0.25)
  let recoveryScore = recoveryPercent;
  factors.push({ factor: 'recovery_percent', weight: 0.25, value: recoveryScore });

  // Stress factor (weight: 0.20, inverse)
  let stressScore = stressLevel <= 3 ? 100 : stressLevel <= 7 ? 60 : 30;
  factors.push({ factor: 'stress_level', weight: 0.2, value: stressScore });

  // Activity factor (weight: 0.10)
  let activityScore = activeMinutes >= 30 ? 100 : (activeMinutes / 30) * 100;
  factors.push({ factor: 'activity_level', weight: 0.1, value: activityScore });

  // Calendar load factor (weight: 0.10, inverse)
  let calendarScore = calendarLoadPercent <= 50 ? 100 : Math.max(30, 100 - (calendarLoadPercent - 50) * 0.8);
  factors.push({ factor: 'calendar_load', weight: 0.1, value: calendarScore });

  // Recent workload modifier (if provided)
  if (recentWorkload && recentWorkload.hours_focused > 6) {
    const fatiguePenalty = Math.min(30, recentWorkload.hours_focused * 3);
    factors.push({ factor: 'recent_workload', weight: 0, value: -fatiguePenalty });
  }

  // Calculate weighted score
  const cognitiveScore =
    sleepScore * 0.35 +
    recoveryScore * 0.25 +
    stressScore * 0.2 +
    activityScore * 0.1 +
    calendarScore * 0.1;

  // Determine state
  let state: CognitiveState = 'good';
  if (cognitiveScore >= 85) state = 'sharp';
  else if (cognitiveScore >= 70) state = 'good';
  else if (cognitiveScore >= 50) state = 'tired';
  else if (cognitiveScore >= 30) state = 'fatigued';
  else state = 'overloaded';

  // Generate recommendations
  const recommendations = generateCognitiveRecommendations(state, factors);

  // Task suitability
  const task_suitability = [
    { task_type: 'strategic_thinking', suitability: getTaskSuitability(state, 'strategic_thinking') as 'ideal' | 'ok' | 'difficult' | 'not_recommended' },
    { task_type: 'deep_analysis', suitability: getTaskSuitability(state, 'deep_analysis') as 'ideal' | 'ok' | 'difficult' | 'not_recommended' },
    { task_type: 'creative_work', suitability: getTaskSuitability(state, 'creative_work') as 'ideal' | 'ok' | 'difficult' | 'not_recommended' },
    { task_type: 'operational_reviews', suitability: getTaskSuitability(state, 'operational_reviews') as 'ideal' | 'ok' | 'difficult' | 'not_recommended' },
    { task_type: 'routine_emails', suitability: getTaskSuitability(state, 'routine_emails') as 'ideal' | 'ok' | 'difficult' | 'not_recommended' },
  ];

  return {
    state,
    score: Math.round(cognitiveScore),
    factors,
    recommendations,
    task_suitability,
  };
}

/**
 * Generate recommendations based on cognitive state
 */
function generateCognitiveRecommendations(
  state: CognitiveState,
  factors: { factor: string; weight: number; value: number }[]
): string[] {
  const recommendations: string[] = [];

  const sleepFactor = factors.find((f) => f.factor === 'sleep_hours');
  const recoveryFactor = factors.find((f) => f.factor === 'recovery_percent');
  const stressFactor = factors.find((f) => f.factor === 'stress_level');

  switch (state) {
    case 'sharp':
      recommendations.push('You\'re in peak cognitive condition - ideal for strategic decisions');
      break;

    case 'good':
      recommendations.push('Cognitive state is good - tackle important tasks now');
      break;

    case 'tired':
      if (sleepFactor && sleepFactor.value < 50) {
        recommendations.push('Sleep is below optimal - prioritize rest tonight');
      }
      if (stressFactor && stressFactor.value < 50) {
        recommendations.push('Stress is elevated - consider a break or stress-relief activity');
      }
      recommendations.push('Save complex decisions for later - stick to routine tasks');
      break;

    case 'fatigued':
      recommendations.push('You\'re significantly fatigued - avoid high-stakes decisions');
      recommendations.push('Consider delegating or rescheduling non-urgent work');
      recommendations.push('Prioritize rest and recovery');
      break;

    case 'overloaded':
      recommendations.push('⚠️ Overloaded state detected - urgent intervention needed');
      recommendations.push('Stop taking on new work immediately');
      recommendations.push('Focus only on critical items');
      recommendations.push('Strongly recommend taking time off soon');
      break;
  }

  return recommendations.slice(0, 3);
}

/**
 * Determine task suitability given cognitive state
 */
function getTaskSuitability(
  state: CognitiveState,
  taskType: string
): string {
  const suitabilityMatrix: Record<CognitiveState, Record<string, string>> = {
    sharp: {
      strategic_thinking: 'ideal',
      deep_analysis: 'ideal',
      creative_work: 'ideal',
      operational_reviews: 'ok',
      routine_emails: 'ok',
    },
    good: {
      strategic_thinking: 'ok',
      deep_analysis: 'ideal',
      creative_work: 'ok',
      operational_reviews: 'ok',
      routine_emails: 'ok',
    },
    tired: {
      strategic_thinking: 'difficult',
      deep_analysis: 'difficult',
      creative_work: 'difficult',
      operational_reviews: 'ok',
      routine_emails: 'ideal',
    },
    fatigued: {
      strategic_thinking: 'not_recommended',
      deep_analysis: 'not_recommended',
      creative_work: 'not_recommended',
      operational_reviews: 'difficult',
      routine_emails: 'ok',
    },
    overloaded: {
      strategic_thinking: 'not_recommended',
      deep_analysis: 'not_recommended',
      creative_work: 'not_recommended',
      operational_reviews: 'not_recommended',
      routine_emails: 'difficult',
    },
  };

  return suitabilityMatrix[state][taskType] || 'ok';
}

/**
 * Check if a given cognitive state is suitable for a task
 */
export function isSuitableForTask(
  state: CognitiveState,
  taskType: string
): boolean {
  const suitability = getTaskSuitability(state, taskType);
  return suitability === 'ideal' || suitability === 'ok';
}
