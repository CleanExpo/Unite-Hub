/**
 * Personal Context Engine
 *
 * Collects and integrates personal context: sleep, diet, stress, calendar load, cognitive state.
 * Sources: Apple Health, Samsung Health, Oura Ring, manual voice logs, calendar integration.
 * Drives personalized advice, timing, and communication preferences.
 */

export type HealthMetric = 'sleep_hours' | 'sleep_quality' | 'steps' | 'heart_rate' | 'hrv' | 'body_temperature' | 'stress_level';
export type CognitiveState = 'optimal' | 'good' | 'adequate' | 'fatigued' | 'overwhelmed';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'vigorous';
export type DietPattern = 'intermittent_fasting' | 'keto' | 'balanced' | 'plant_based' | 'flexible';

export interface PersonalMetric {
  id: string;
  owner: string; // 'phill' or email
  metricType: HealthMetric;
  value: number;
  unit: string;
  source: 'apple_health' | 'samsung_health' | 'oura' | 'manual' | 'whoop' | 'garmin';
  timestamp: string; // ISO datetime
}

export interface PersonalContext {
  id: string;
  owner: string; // 'phill'
  lastUpdated: string;

  // Sleep & Recovery
  sleepHours?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  sleepConsistency?: number; // 0-1, based on regularity
  napsToday?: number;

  // Stress & Wellbeing
  stressLevel?: 'low' | 'moderate' | 'high' | 'critical';
  energyLevel?: 'low' | 'moderate' | 'high';
  cognitiveState?: CognitiveState;
  moodScore?: number; // 0-10

  // Activity
  activity?: ActivityLevel;
  stepsToday?: number;
  exerciseMinutes?: number;
  heartRate?: number;
  hrv?: number; // Heart rate variability (higher = better recovery)

  // Diet & Nutrition
  dietPattern?: DietPattern;
  mealsToday?: number;
  waterIntake?: number; // liters
  supplementsToday?: string[];
  lastMealTime?: string; // ISO time
  fastingHours?: number;

  // Productivity & Attention
  deepWorkHours?: number; // Uninterrupted focus time
  meetingsCount?: number;
  calendarLoadPercent?: number; // 0-100
  focusMode?: 'off' | 'light' | 'deep';

  // Context Notes
  notes?: string; // Manual voice log or text
  goals?: string[]; // Today's primary goals
  concerns?: string[]; // Challenges or worries
  wins?: string[]; // Accomplishments

  // Derived State
  recommendedActions?: string[];
  warningFlags?: string[];
  focusTimeOptimal?: boolean;
  advisoryPriority?: 'routine' | 'important' | 'urgent';
}

// In-memory storage (wire to Supabase for persistence)
const contextSnapshots: PersonalContext[] = [];
const healthMetrics: PersonalMetric[] = [];

/**
 * Record health metric
 */
export function recordHealthMetric(input: Omit<PersonalMetric, 'id'>): PersonalMetric {
  const metric: PersonalMetric = {
    id: crypto.randomUUID(),
    ...input
  };

  healthMetrics.push(metric);
  return metric;
}

/**
 * Get recent health metrics
 */
export function getRecentHealthMetrics(owner: string, metricType?: HealthMetric, hours = 24): PersonalMetric[] {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  return healthMetrics.filter(m => {
    if (m.owner !== owner) {
return false;
}
    if (metricType && m.metricType !== metricType) {
return false;
}
    return m.timestamp >= cutoff;
  });
}

/**
 * Update personal context snapshot
 */
export function updatePersonalContext(owner: string, update: Partial<Omit<PersonalContext, 'id' | 'owner' | 'lastUpdated'>>): PersonalContext {
  // Find or create context
  let ctx = contextSnapshots.find(c => c.owner === owner);

  if (!ctx) {
    ctx = {
      id: crypto.randomUUID(),
      owner,
      lastUpdated: new Date().toISOString()
    };
    contextSnapshots.push(ctx);
  }

  // Update fields
  Object.assign(ctx, update);
  ctx.lastUpdated = new Date().toISOString();

  // Derive state
  deriveContextState(ctx);

  return ctx;
}

/**
 * Get current personal context
 */
export function getPersonalContext(owner: string): PersonalContext | null {
  return contextSnapshots.find(c => c.owner === owner) || null;
}

/**
 * Derive cognitive and advisory state from metrics
 */
function deriveContextState(ctx: PersonalContext): void {
  const recommendedActions: string[] = [];
  const warningFlags: string[] = [];

  // Sleep analysis
  if (ctx.sleepHours !== undefined) {
    if (ctx.sleepHours < 6) {
      warningFlags.push('⚠️ Sleep deprivation detected. Cognitive load should be reduced.');
      recommendedActions.push('Prioritize sleep recovery tonight.');
    } else if (ctx.sleepHours > 9) {
      recommendedActions.push('Well-rested. Good day for complex decisions.');
    }
  }

  // Stress analysis
  if (ctx.stressLevel === 'critical') {
    warningFlags.push('🔴 Critical stress level. Defer non-urgent decisions.');
  } else if (ctx.stressLevel === 'high') {
    warningFlags.push('⚠️ High stress. Consider shorter work blocks.');
  }

  // Energy & cognitive state
  if (ctx.energyLevel === 'low' || ctx.cognitiveState === 'fatigued') {
    recommendedActions.push('Focus on routine tasks. Defer complex reasoning.');
    ctx.focusTimeOptimal = false;
  } else if (ctx.energyLevel === 'high' && ctx.cognitiveState === 'optimal') {
    recommendedActions.push('Ideal time for deep work and strategic thinking.');
    ctx.focusTimeOptimal = true;
  }

  // Calendar load
  if (ctx.calendarLoadPercent !== undefined) {
    if (ctx.calendarLoadPercent > 80) {
      warningFlags.push('⏰ Calendar heavily booked. Limited deep work time available.');
    }
  }

  // HRV analysis (higher = better recovery)
  if (ctx.hrv !== undefined && ctx.hrv < 30) {
    warningFlags.push('📊 Low HRV detected. Body is under stress. Recommend rest.');
  }

  // Fasting analysis
  if (ctx.fastingHours !== undefined && ctx.fastingHours > 16) {
    recommendedActions.push('Consider eating soon. Extended fasting detected.');
  }

  // Determine advisory priority
  let advisoryPriority: PersonalContext['advisoryPriority'] = 'routine';
  if (warningFlags.length > 2 || ctx.cognitiveState === 'overwhelmed') {
    advisoryPriority = 'urgent';
  } else if (warningFlags.length > 0) {
    advisoryPriority = 'important';
  }

  ctx.recommendedActions = recommendedActions;
  ctx.warningFlags = warningFlags;
  ctx.advisoryPriority = advisoryPriority;
}

/**
 * Derive cognitive state from sleep, stress, energy
 */
export function deriveCognitiveState(ctx: PersonalContext): CognitiveState {
  let score = 10; // Start at optimal

  // Sleep impact (highest factor)
  if (ctx.sleepHours) {
    if (ctx.sleepHours < 5) {
score -= 4;
} else if (ctx.sleepHours < 6) {
score -= 2;
} else if (ctx.sleepHours < 7) {
score -= 1;
} else if (ctx.sleepHours > 9) {
score -= 1;
} // Oversleep can affect focus
  }

  // Stress impact
  if (ctx.stressLevel === 'critical') {
score -= 3;
} else if (ctx.stressLevel === 'high') {
score -= 2;
} else if (ctx.stressLevel === 'moderate') {
score -= 1;
}

  // Energy impact
  if (ctx.energyLevel === 'low') {
score -= 2;
} else if (ctx.energyLevel === 'high') {
score += 1;
}

  // Calendar load
  if (ctx.calendarLoadPercent) {
    if (ctx.calendarLoadPercent > 80) {
score -= 1;
} else if (ctx.calendarLoadPercent > 60) {
score -= 0.5;
}
  }

  // Determine state
  if (score >= 9) {
return 'optimal';
}
  if (score >= 7) {
return 'good';
}
  if (score >= 5) {
return 'adequate';
}
  if (score >= 3) {
return 'fatigued';
}
  return 'overwhelmed';
}

/**
 * Get context summary for advisor
 */
export function getContextSummary(owner: string): string {
  const ctx = getPersonalContext(owner);
  if (!ctx) {
return 'No context available.';
}

  const lines: string[] = [];
  lines.push(`🧠 Cognitive State: ${ctx.cognitiveState || 'unknown'}`);

  if (ctx.sleepHours) {
lines.push(`😴 Sleep: ${ctx.sleepHours}h (${ctx.sleepQuality || 'unknown'})`);
}
  if (ctx.stressLevel) {
lines.push(`😰 Stress: ${ctx.stressLevel}`);
}
  if (ctx.energyLevel) {
lines.push(`⚡ Energy: ${ctx.energyLevel}`);
}
  if (ctx.calendarLoadPercent) {
lines.push(`📅 Calendar: ${ctx.calendarLoadPercent}% full`);
}
  if (ctx.hrv) {
lines.push(`💓 HRV: ${ctx.hrv} (recovery: ${ctx.hrv > 50 ? 'excellent' : ctx.hrv > 30 ? 'good' : 'stressed'})`);
}

  if (ctx.warningFlags?.length) {
    lines.push('\n⚠️ Flags:');
    ctx.warningFlags.forEach(flag => lines.push(`  - ${flag}`));
  }

  if (ctx.recommendedActions?.length) {
    lines.push('\n✅ Recommended:');
    ctx.recommendedActions.forEach(action => lines.push(`  - ${action}`));
  }

  return lines.join('\n');
}

/**
 * Check if user is in optimal state for specific activity
 */
export function isOptimalFor(ctx: PersonalContext, activity: 'creative' | 'analytical' | 'communication' | 'routine'): boolean {
  const state = ctx.cognitiveState || 'adequate';
  const stress = ctx.stressLevel || 'moderate';
  const energy = ctx.energyLevel || 'moderate';

  if (stress === 'critical') {
return false;
}

  switch (activity) {
    case 'creative':
      return state === 'optimal' && energy === 'high';
    case 'analytical':
      return state === 'optimal' || state === 'good';
    case 'communication':
      return energy === 'high' && stress !== 'high';
    case 'routine':
      return true; // Can do routine in any state
  }
}

/**
 * Get all context history
 */
export function getContextHistory(owner: string, days = 7): PersonalContext[] {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return contextSnapshots.filter(c => c.owner === owner && c.lastUpdated >= cutoff);
}
