/**
 * Phase 10 – Life Signal Ingestor
 *
 * Aggregates and normalizes life signals from multiple sources:
 * - Apple HealthKit, Samsung Health, Oura Ring, Whoop, Fitbit, etc.
 * - Calendar load and time-of-day context
 * - Manual journal entries and tags
 * - Environmental context (weather, location, etc.)
 *
 * Produces a "Phill state snapshot" that feeds into CognitiveStateEngine
 * and helps time recommendations, briefings, and interventions.
 */

// ============================================================================
// LIFE SIGNAL TYPES
// ============================================================================

export interface LifeSignal {
  signal_type: LifeSignalType;
  value: number;
  unit: string;
  timestamp: string;
  source: LifeSignalSource;
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
}

export type LifeSignalType =
  | 'sleep_hours'
  | 'sleep_quality'
  | 'heart_rate_resting'
  | 'heart_rate_variability'
  | 'body_temperature'
  | 'respiratory_rate'
  | 'steps'
  | 'active_minutes'
  | 'calories_burned'
  | 'stress_level'
  | 'recovery_percent'
  | 'calendar_load_percent'
  | 'time_of_day_hour'
  | 'location'
  | 'weather_condition';

export type LifeSignalSource =
  | 'apple_health'
  | 'samsung_health'
  | 'oura_ring'
  | 'whoop_band'
  | 'fitbit'
  | 'garmin'
  | 'calendar_api'
  | 'manual_journal'
  | 'wearable_aggregator'
  | 'inference';

export interface LifeSignalSnapshot {
  timestamp: string;
  phill_owner: string;
  signals: LifeSignal[];
  aggregate_score: number; // 0-100, overall state quality
  primary_factors: string[]; // What's driving the state
  recommendations: string[]; // What would help Phill now
}

// ============================================================================
// SIGNAL AGGREGATION
// ============================================================================

/**
 * Ingest signals from multiple sources and create a unified snapshot
 */
export async function ingestAndAggregateSignals(
  owner: string,
  sources: PartialSignalData[]
): Promise<LifeSignalSnapshot> {
  const signals: LifeSignal[] = [];
  const now = new Date().toISOString();

  // Process each source
  for (const source of sources) {
    if (source.apple_health) {
      signals.push(...normalizeAppleHealthData(source.apple_health, now));
    }
    if (source.samsung_health) {
      signals.push(...normalizeSamsungHealthData(source.samsung_health, now));
    }
    if (source.oura_ring) {
      signals.push(...normalizeOuraData(source.oura_ring, now));
    }
    if (source.calendar) {
      signals.push(...normalizeCalendarData(source.calendar, now));
    }
    if (source.manual_entry) {
      signals.push(...normalizeManualEntry(source.manual_entry, now));
    }
  }

  // Aggregate and score
  const aggregateScore = calculateAggregateScore(signals);
  const primaryFactors = identifyPrimaryFactors(signals);
  const recommendations = generateRecommendations(signals, aggregateScore);

  return {
    timestamp: now,
    phill_owner: owner,
    signals,
    aggregate_score: aggregateScore,
    primary_factors: primaryFactors,
    recommendations,
  };
}

// ============================================================================
// DATA NORMALIZATION (STUB IMPLEMENTATIONS)
// ============================================================================

/**
 * Normalize Apple HealthKit data
 */
function normalizeAppleHealthData(
  data: Record<string, unknown>,
  timestamp: string
): LifeSignal[] {
  const signals: LifeSignal[] = [];

  // Apple Health data structure normalization
  if ('sleep_hours' in data) {
    signals.push({
      signal_type: 'sleep_hours',
      value: (data.sleep_hours as number) || 0,
      unit: 'hours',
      timestamp,
      source: 'apple_health',
      confidence: 0.95,
    });
  }

  if ('heart_rate_resting' in data) {
    signals.push({
      signal_type: 'heart_rate_resting',
      value: (data.heart_rate_resting as number) || 0,
      unit: 'bpm',
      timestamp,
      source: 'apple_health',
      confidence: 0.9,
    });
  }

  if ('steps' in data) {
    signals.push({
      signal_type: 'steps',
      value: (data.steps as number) || 0,
      unit: 'count',
      timestamp,
      source: 'apple_health',
      confidence: 0.98,
    });
  }

  return signals;
}

/**
 * Normalize Samsung Health data
 */
function normalizeSamsungHealthData(
  data: Record<string, unknown>,
  timestamp: string
): LifeSignal[] {
  const signals: LifeSignal[] = [];

  // Samsung Health data structure normalization
  if ('sleepTime' in data) {
    signals.push({
      signal_type: 'sleep_hours',
      value: ((data.sleepTime as number) || 0) / 60, // Convert minutes to hours
      unit: 'hours',
      timestamp,
      source: 'samsung_health',
      confidence: 0.93,
    });
  }

  if ('heartRate' in data) {
    signals.push({
      signal_type: 'heart_rate_resting',
      value: (data.heartRate as number) || 0,
      unit: 'bpm',
      timestamp,
      source: 'samsung_health',
      confidence: 0.88,
    });
  }

  return signals;
}

/**
 * Normalize Oura Ring data
 */
function normalizeOuraData(
  data: Record<string, unknown>,
  timestamp: string
): LifeSignal[] {
  const signals: LifeSignal[] = [];

  // Oura Ring data structure normalization
  if ('sleep' in data) {
    const sleepData = data.sleep as Record<string, number>;
    if (sleepData.duration) {
      signals.push({
        signal_type: 'sleep_hours',
        value: sleepData.duration / 3600, // Convert seconds to hours
        unit: 'hours',
        timestamp,
        source: 'oura_ring',
        confidence: 0.97,
      });
    }
  }

  if ('readiness' in data) {
    const readinessData = data.readiness as Record<string, number>;
    if (readinessData.score) {
      // Oura readiness is 0-100
      signals.push({
        signal_type: 'recovery_percent',
        value: readinessData.score,
        unit: 'percent',
        timestamp,
        source: 'oura_ring',
        confidence: 0.95,
      });
    }
  }

  if ('activity' in data) {
    const activityData = data.activity as Record<string, number>;
    if (activityData.active_calories) {
      signals.push({
        signal_type: 'calories_burned',
        value: activityData.active_calories,
        unit: 'kcal',
        timestamp,
        source: 'oura_ring',
        confidence: 0.85,
      });
    }
  }

  return signals;
}

/**
 * Normalize calendar data to get calendar load
 */
function normalizeCalendarData(
  data: Record<string, unknown>,
  timestamp: string
): LifeSignal[] {
  const signals: LifeSignal[] = [];

  if ('meetings_today' in data && 'working_hours' in data) {
    const meetingsMinutes = ((data.meetings_today as number) || 0);
    const workingHours = ((data.working_hours as number) || 8) * 60;
    const loadPercent = Math.min(100, (meetingsMinutes / workingHours) * 100);

    signals.push({
      signal_type: 'calendar_load_percent',
      value: loadPercent,
      unit: 'percent',
      timestamp,
      source: 'calendar_api',
      confidence: 0.92,
    });
  }

  // Add time of day
  const now = new Date();
  signals.push({
    signal_type: 'time_of_day_hour',
    value: now.getHours(),
    unit: 'hour',
    timestamp,
    source: 'inference',
    confidence: 1.0,
  });

  return signals;
}

/**
 * Normalize manual journal entry
 */
function normalizeManualEntry(
  data: Record<string, unknown>,
  timestamp: string
): LifeSignal[] {
  const signals: LifeSignal[] = [];

  if ('mood' in data) {
    // Convert mood to stress level (inverse)
    const moodValue = (data.mood as number) || 5; // 0-10 scale
    signals.push({
      signal_type: 'stress_level',
      value: 10 - moodValue, // Higher mood = lower stress
      unit: 'level',
      timestamp,
      source: 'manual_journal',
      confidence: 0.7,
      metadata: { original_mood: moodValue },
    });
  }

  if ('stress_level' in data) {
    signals.push({
      signal_type: 'stress_level',
      value: (data.stress_level as number) || 5,
      unit: 'level',
      timestamp,
      source: 'manual_journal',
      confidence: 0.75,
    });
  }

  if ('notes' in data) {
    signals.push({
      signal_type: 'location',
      value: 0, // Placeholder
      unit: 'string',
      timestamp,
      source: 'manual_journal',
      confidence: 0.5,
      metadata: { notes: data.notes },
    });
  }

  return signals;
}

// ============================================================================
// AGGREGATE SCORING
// ============================================================================

/**
 * Calculate overall aggregate score (0-100) from signals
 *
 * Factors:
 * - Sleep (weight: 0.35) – most important
 * - Recovery/Readiness (weight: 0.25)
 * - Stress level (weight: 0.20, inverse)
 * - Activity (weight: 0.15)
 * - Calendar load (weight: 0.05, inverse)
 */
function calculateAggregateScore(signals: LifeSignal[]): number {
  let sleepScore = 50;
  let recoveryScore = 50;
  let stressScore = 50;
  let activityScore = 50;
  let calendarScore = 50;

  for (const signal of signals) {
    switch (signal.signal_type) {
      case 'sleep_hours':
        // Optimal: 7-9 hours. Score decreases outside this range.
        sleepScore = signal.value >= 7 && signal.value <= 9 ? 100 : Math.max(0, 100 - Math.abs(signal.value - 8) * 10);
        break;

      case 'recovery_percent':
        recoveryScore = signal.value; // Already 0-100
        break;

      case 'stress_level':
        // Stress 0-3 is good. 3-7 is moderate. 7+ is high.
        stressScore = signal.value <= 3 ? 100 : signal.value <= 7 ? 60 : 30;
        break;

      case 'active_minutes':
        // 30+ minutes is good
        activityScore = signal.value >= 30 ? 100 : (signal.value / 30) * 100;
        break;

      case 'calendar_load_percent':
        // Less than 50% calendar load is good
        calendarScore = signal.value <= 50 ? 100 : Math.max(30, 100 - (signal.value - 50) * 0.7);
        break;
    }
  }

  // Weighted average
  const aggregate =
    sleepScore * 0.35 +
    recoveryScore * 0.25 +
    stressScore * 0.2 +
    activityScore * 0.15 +
    calendarScore * 0.05;

  return Math.round(aggregate);
}

/**
 * Identify primary factors affecting the score
 */
function identifyPrimaryFactors(signals: LifeSignal[]): string[] {
  const factors: string[] = [];

  for (const signal of signals) {
    if (signal.signal_type === 'sleep_hours') {
      if ((signal.value as number) < 5) factors.push('Very low sleep – recovery likely impaired');
      else if ((signal.value as number) < 7) factors.push('Low sleep – some fatigue expected');
    }

    if (signal.signal_type === 'recovery_percent') {
      if ((signal.value as number) < 30) factors.push('Low recovery score – body needs rest');
    }

    if (signal.signal_type === 'stress_level') {
      if ((signal.value as number) > 7) factors.push('High stress levels – recommend stress-relief');
    }

    if (signal.signal_type === 'calendar_load_percent') {
      if ((signal.value as number) > 80) factors.push('Very high calendar load – limited focus time');
    }
  }

  return factors.length > 0 ? factors : ['Overall state appears good'];
}

/**
 * Generate recommendations based on signals
 */
function generateRecommendations(signals: LifeSignal[], aggregateScore: number): string[] {
  const recommendations: string[] = [];

  if (aggregateScore < 40) {
    recommendations.push('Consider taking a break or stepping back from high-energy tasks');
  }

  for (const signal of signals) {
    if (signal.signal_type === 'sleep_hours' && (signal.value as number) < 6) {
      recommendations.push('Prioritize sleep tonight – aim for 7-9 hours');
    }

    if (signal.signal_type === 'stress_level' && (signal.value as number) > 7) {
      recommendations.push('Try a stress-relief activity: walk, exercise, or meditation');
    }

    if (signal.signal_type === 'calendar_load_percent' && (signal.value as number) > 75) {
      recommendations.push('Block focus time this afternoon – heavy meeting load detected');
    }

    if (signal.signal_type === 'active_minutes' && (signal.value as number) < 15) {
      recommendations.push('You could benefit from a 15-20 minute walk or exercise session');
    }
  }

  return recommendations.slice(0, 3); // Return top 3
}

// ============================================================================
// PARTIAL DATA TYPES (FOR INGESTION)
// ============================================================================

export interface PartialSignalData {
  apple_health?: Record<string, unknown>;
  samsung_health?: Record<string, unknown>;
  oura_ring?: Record<string, unknown>;
  whoop?: Record<string, unknown>;
  fitbit?: Record<string, unknown>;
  calendar?: Record<string, unknown>;
  manual_entry?: Record<string, unknown>;
}

// ============================================================================
// STORAGE INTERFACE (FOR SUPABASE INTEGRATION)
// ============================================================================

export interface StoredLifeSignalSnapshot {
  id: string;
  created_at: string;
  owner: string;
  signals_json: LifeSignalSnapshot;
  aggregate_score: number;
  primary_factors: string[];
  recommendations: string[];
}
