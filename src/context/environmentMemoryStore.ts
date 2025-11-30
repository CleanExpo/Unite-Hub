/**
 * Phase 13 – Environment Memory Store
 *
 * Store recurring environment patterns and location-based profiles with productivity outcomes.
 * Learn Phill's productivity patterns across different contexts.
 *
 * - Track environment signatures (office desk, home, cafe, commute, etc.)
 * - Associate with productivity metrics (focus quality, deep work time, creativity)
 * - Learn location-based patterns: "At this cafe, very productive in mornings"
 * - Store optimal conditions: "Best focus between 9-11am at home office"
 * - Provide recommendations: "Go to office for deep work; cafe for creative tasks"
 * - Decay old patterns to avoid stale learning
 *
 * Integration: Receives visual contexts from visualContextEngine + productivity signals from Phase 10
 * Feeds: contextFusionEngine for activity prediction, safetyContextFilter for recommendations
 * Output: Environment profiles with learned productivity patterns
 */

import type { VisualContext } from './visualContextEngine';

// ============================================================================
// ENVIRONMENT PROFILE TYPES
// ============================================================================

export interface EnvironmentProfile {
  // Profile identity
  profileId: string;
  environmentSignature: string; // Hash of key scene markers (desk shape, window view, etc.)
  displayName: string; // "Office desk", "Home office", "Favorite cafe"

  // Location tracking
  location?: {
    approximateAddress?: string; // "1234 Main St, City"
    coordinates?: { lat: number; lon: number };
    placeType: 'home' | 'office' | 'cafe' | 'commute' | 'outdoor' | 'other';
    confidence: number; // 0-1
  };

  // Temporal patterns
  frequentTimeOfDay: string[]; // ["morning", "afternoon"] times when Phill is here
  frequentDayType: ('weekday' | 'weekend')[];
  averageSessionDuration: number; // milliseconds
  visitFrequency: number; // times per week (averaged over last 4 weeks)

  // Productivity metrics (learned from outcomes in Phase 10)
  focusQuality: {
    average: number; // 0-100
    bestTimeWindow?: { start: string; end: string }; // "09:00-11:00"
    consistency: number; // 0-1, how stable is focus
  };

  // Activity outcomes
  deepWorkOptimal: boolean; // "Best environment for deep, focused work"
  creativeOptimal: boolean; // "Best for brainstorming, creative thinking"
  communicationOptimal: boolean; // "Good for calls, meetings"
  restOptimal: boolean; // "Comfortable for breaks"

  // Contextual conditions
  idealWeather?: string[]; // ["sunny", "cool"] conditions when productivity peaks
  distractionFactors: string[]; // ["noise", "people"] things that reduce focus here
  focusFactors: string[]; // ["quiet", "natural light"] things that help focus

  // Recommendations
  recommendedActivities: Array<{
    activity: string; // "deep work", "creative thinking", "communication"
    suitability: number; // 0-100
    optimalTimeWindow?: { start: string; end: string };
  }>;

  // Learning metadata
  sampleSize: number; // Number of observations for this profile
  lastUpdated: string;
  createdAt: string;
  confidenceScore: number; // 0-1, how confident are we in these patterns
}

export interface ProductivityOutcome {
  // Link to environment
  environmentProfileId: string;
  timestamp: string;

  // What happened
  activity: string; // "deep_work", "creative", "communication", "rest"
  durationMinutes: number;
  focusQualityRating: number; // 0-100 from cognitive state engine
  successMetric: number; // 0-100, how well did the activity go

  // Context when it happened
  timeOfDay: string;
  dayType: 'weekday' | 'weekend';
  cognitiveState?: {
    energyBefore: number; // 0-100
    energyAfter: number;
    stressLevel: 'low' | 'normal' | 'elevated';
  };

  // Factors that helped or hurt
  helpedBy: string[]; // ["quiet", "natural light"]
  hinderedBy: string[]; // ["interruptions", "notifications"]

  // Mood/satisfaction
  satisfaction: number; // 0-100
}

export interface EnvironmentMemoryStoreConfig {
  maxProfiles: number; // Stop learning new profiles at this count
  similarityThreshold: number; // 0-1, when to merge profiles
  decayFactor: number; // 0.95 = 5% weekly decay for old patterns
  minSamplesForConfidence: number; // Need at least N observations before confident
  retentionDays: number; // Delete outcomes older than this
}

// ============================================================================
// STORE INITIALIZATION
// ============================================================================

export const DEFAULT_STORE_CONFIG: EnvironmentMemoryStoreConfig = {
  maxProfiles: 20, // Learn up to 20 distinct environments
  similarityThreshold: 0.8, // 80% similar = same environment
  decayFactor: 0.95, // 5% weekly decay
  minSamplesForConfidence: 5, // Need 5+ observations
  retentionDays: 90, // Keep 3 months of outcome data
};

export interface EnvironmentMemoryStore {
  profiles: EnvironmentProfile[];
  outcomes: ProductivityOutcome[];
  config: EnvironmentMemoryStoreConfig;
  lastUpdated: string;
}

/**
 * Initialize empty store
 */
export function initializeStore(config: Partial<EnvironmentMemoryStoreConfig> = {}): EnvironmentMemoryStore {
  return {
    profiles: [],
    outcomes: [],
    config: { ...DEFAULT_STORE_CONFIG, ...config },
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// ENVIRONMENT PROFILE CREATION & MATCHING
// ============================================================================

/**
 * Create or update environment profile from visual context
 */
export function addOrUpdateEnvironmentProfile(
  store: EnvironmentMemoryStore,
  visualContext: VisualContext,
  displayName: string
): EnvironmentProfile {
  // Generate signature hash
  const signature = generateEnvironmentSignature(visualContext);

  // Check if profile with same signature exists
  const existingProfile = store.profiles.find((p) => p.environmentSignature === signature);

  if (existingProfile) {
    // Update frequency and temporal patterns
    existingProfile.visitFrequency = Math.min(existingProfile.visitFrequency + 0.1, 5); // Cap at 5/week
    existingProfile.lastUpdated = new Date().toISOString();

    return existingProfile;
  }

  // Create new profile if under limit
  if (store.profiles.length >= store.config.maxProfiles) {
    // Find least confident/visited and replace
    const leastConfident = store.profiles.reduce((min, p) =>
      p.confidenceScore < min.confidenceScore ? p : min
    );

    if (leastConfident.confidenceScore < 0.5) {
      const index = store.profiles.indexOf(leastConfident);
      store.profiles.splice(index, 1); // Remove least confident
    } else {
      return leastConfident; // Can't add more, return best match
    }
  }

  const newProfile: EnvironmentProfile = {
    profileId: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    environmentSignature: signature,
    displayName,
    location: {
      placeType: visualContext.environmentType as 'home' | 'office' | 'cafe' | 'commute' | 'outdoor' | 'other',
      confidence: 0.7,
    },
    frequentTimeOfDay: [visualContext.timeOfDay],
    frequentDayType: ['weekday'], // Default; will be updated
    averageSessionDuration: 60 * 60 * 1000, // 1 hour default
    visitFrequency: 1,
    focusQuality: {
      average: 70,
      consistency: 0.5,
    },
    deepWorkOptimal: false,
    creativeOptimal: false,
    communicationOptimal: false,
    restOptimal: false,
    distractionFactors: [],
    focusFactors: extractFocusFactors(visualContext),
    recommendedActivities: [],
    sampleSize: 1,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    confidenceScore: 0.3, // Low confidence until more samples
  };

  store.profiles.push(newProfile);
  return newProfile;
}

/**
 * Find best matching profile for a visual context
 */
export function findMatchingProfile(
  store: EnvironmentMemoryStore,
  visualContext: VisualContext
): EnvironmentProfile | null {
  const signature = generateEnvironmentSignature(visualContext);

  // Exact match
  const exactMatch = store.profiles.find((p) => p.environmentSignature === signature);
  if (exactMatch) return exactMatch;

  // Fuzzy match on environment type
  const typeMatches = store.profiles.filter((p) => p.location?.placeType === visualContext.environmentType);
  if (typeMatches.length > 0) {
    // Return most confident match
    return typeMatches.reduce((best, p) => (p.confidenceScore > best.confidenceScore ? p : best));
  }

  return null;
}

// ============================================================================
// PRODUCTIVITY OUTCOME TRACKING
// ============================================================================

/**
 * Log productivity outcome for a profile
 */
export function recordProductivityOutcome(
  store: EnvironmentMemoryStore,
  profileId: string,
  outcome: Omit<ProductivityOutcome, 'environmentProfileId' | 'timestamp'>
): void {
  const profile = store.profiles.find((p) => p.profileId === profileId);
  if (!profile) {
    console.warn(`Profile ${profileId} not found`);
    return;
  }

  const fullOutcome: ProductivityOutcome = {
    ...outcome,
    environmentProfileId: profileId,
    timestamp: new Date().toISOString(),
  };

  store.outcomes.push(fullOutcome);

  // Update profile metrics based on outcome
  updateProfileMetrics(profile, fullOutcome, store.config.minSamplesForConfidence);
}

/**
 * Update profile metrics based on new outcome
 */
function updateProfileMetrics(
  profile: EnvironmentProfile,
  outcome: ProductivityOutcome,
  minSamples: number
): void {
  profile.sampleSize += 1;

  // Update focus quality average (exponential moving average)
  const newAverage = (profile.focusQuality.average * 0.7 + outcome.focusQualityRating * 0.3);
  profile.focusQuality.average = Math.round(newAverage);

  // Update activity outcomes
  if (outcome.activity === 'deep_work' && outcome.focusQualityRating > 75) {
    profile.deepWorkOptimal = true;
  }
  if (outcome.activity === 'creative' && outcome.focusQualityRating > 70) {
    profile.creativeOptimal = true;
  }
  if (outcome.activity === 'communication' && outcome.focusQualityRating > 65) {
    profile.communicationOptimal = true;
  }
  if (outcome.activity === 'rest' && outcome.satisfaction > 70) {
    profile.restOptimal = true;
  }

  // Increase confidence if enough samples
  if (profile.sampleSize >= minSamples) {
    profile.confidenceScore = Math.min(profile.confidenceScore + 0.1, 0.95);
  }

  // Update distraction/focus factors
  profile.distractionFactors = [...new Set([...profile.distractionFactors, ...outcome.hinderedBy])];
  profile.focusFactors = [...new Set([...profile.focusFactors, ...outcome.helpedBy])];

  // Update recommended activities
  updateRecommendedActivities(profile);

  profile.lastUpdated = new Date().toISOString();
}

/**
 * Update recommended activities for profile
 */
function updateRecommendedActivities(profile: EnvironmentProfile): void {
  const activities = [];

  if (profile.deepWorkOptimal) {
    activities.push({
      activity: 'deep work',
      suitability: Math.round(profile.focusQuality.average),
      optimalTimeWindow: profile.focusQuality.bestTimeWindow,
    });
  }

  if (profile.creativeOptimal) {
    activities.push({
      activity: 'creative thinking',
      suitability: Math.round(profile.focusQuality.average * 0.95),
    });
  }

  if (profile.communicationOptimal) {
    activities.push({
      activity: 'focused communication',
      suitability: 75,
    });
  }

  if (profile.restOptimal) {
    activities.push({
      activity: 'rest and recharge',
      suitability: 80,
    });
  }

  profile.recommendedActivities = activities;
}

// ============================================================================
// PATTERN ANALYSIS & RECOMMENDATIONS
// ============================================================================

/**
 * Get recommendations for current visual context
 */
export function getEnvironmentRecommendations(
  store: EnvironmentMemoryStore,
  visualContext: VisualContext,
  intendedActivity: string
): {
  bestProfile?: EnvironmentProfile;
  suitabilityScore: number;
  recommendations: string[];
  warnings: string[];
} {
  const matchingProfile = findMatchingProfile(store, visualContext);

  if (!matchingProfile) {
    return {
      suitabilityScore: 50,
      recommendations: ['This environment is new to Phill. Starting to learn productivity patterns here.'],
      warnings: [],
    };
  }

  const suitabilityScore = calculateSuitabilityScore(matchingProfile, intendedActivity);
  const recommendations: string[] = [];
  const warnings: string[] = [];

  // Activity-specific recommendations
  if (intendedActivity === 'deep_work') {
    if (matchingProfile.deepWorkOptimal) {
      recommendations.push(`${matchingProfile.displayName} is excellent for deep work`);
      if (matchingProfile.focusQuality.bestTimeWindow) {
        recommendations.push(`Best focus between ${matchingProfile.focusQuality.bestTimeWindow.start}-${matchingProfile.focusQuality.bestTimeWindow.end}`);
      }
    } else {
      warnings.push('This environment is not ideal for deep work based on past experience');
    }
  }

  if (intendedActivity === 'creative') {
    if (matchingProfile.creativeOptimal) {
      recommendations.push(`${matchingProfile.displayName} sparks creativity`);
    }
  }

  // Environmental tips
  if (matchingProfile.focusFactors.length > 0) {
    recommendations.push(`Consider: ${matchingProfile.focusFactors.slice(0, 3).join(', ')}`);
  }

  if (matchingProfile.distractionFactors.length > 0) {
    warnings.push(`Watch out for: ${matchingProfile.distractionFactors.slice(0, 2).join(', ')}`);
  }

  return {
    bestProfile: matchingProfile,
    suitabilityScore,
    recommendations,
    warnings,
  };
}

/**
 * Recommend best environment for an activity
 */
export function recommendBestEnvironment(
  store: EnvironmentMemoryStore,
  intendedActivity: string
): {
  profile?: EnvironmentProfile;
  suitabilityScore: number;
  rationale: string;
} {
  const candidates = store.profiles.filter((p) => {
    switch (intendedActivity) {
      case 'deep_work':
        return p.deepWorkOptimal;
      case 'creative':
        return p.creativeOptimal;
      case 'communication':
        return p.communicationOptimal;
      case 'rest':
        return p.restOptimal;
      default:
        return true;
    }
  });

  if (candidates.length === 0) {
    return {
      suitabilityScore: 0,
      rationale: `No learned environment for ${intendedActivity} yet. Try your usual places.`,
    };
  }

  // Sort by confidence × focus quality
  candidates.sort((a, b) => {
    const scoreA = a.confidenceScore * (a.focusQuality.average / 100);
    const scoreB = b.confidenceScore * (b.focusQuality.average / 100);
    return scoreB - scoreA;
  });

  const best = candidates[0];
  const suitabilityScore = calculateSuitabilityScore(best, intendedActivity);

  return {
    profile: best,
    suitabilityScore,
    rationale: `${best.displayName} is your best environment for ${intendedActivity} (${suitabilityScore}% suitable)`,
  };
}

// ============================================================================
// STORE MAINTENANCE
// ============================================================================

/**
 * Apply time-based decay to old profiles (forget stale patterns)
 */
export function applyDecay(store: EnvironmentMemoryStore): void {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const profile of store.profiles) {
    const lastUpdated = new Date(profile.lastUpdated);
    if (lastUpdated < weekAgo) {
      // Decay focus quality and confidence
      profile.focusQuality.average *= store.config.decayFactor;
      profile.confidenceScore *= store.config.decayFactor;
      profile.focusQuality.consistency *= store.config.decayFactor;

      // If confidence drops too low, mark for removal
      if (profile.confidenceScore < 0.1) {
        // Profile could be removed in cleanup
      }
    }
  }
}

/**
 * Clean up old outcomes and low-confidence profiles
 */
export function cleanupStore(store: EnvironmentMemoryStore): {
  outcomesRemoved: number;
  profilesRemoved: number;
} {
  const cutoffDate = new Date(Date.now() - store.config.retentionDays * 24 * 60 * 60 * 1000);
  const beforeOutcomes = store.outcomes.length;

  // Remove old outcomes
  store.outcomes = store.outcomes.filter((o) => new Date(o.timestamp) > cutoffDate);

  // Remove low-confidence profiles
  const beforeProfiles = store.profiles.length;
  store.profiles = store.profiles.filter((p) => p.confidenceScore > 0.1);

  return {
    outcomesRemoved: beforeOutcomes - store.outcomes.length,
    profilesRemoved: beforeProfiles - store.profiles.length,
  };
}

/**
 * Get store statistics
 */
export function getStoreStats(store: EnvironmentMemoryStore): {
  profileCount: number;
  outcomeCount: number;
  avgProfileConfidence: number;
  topProfiles: Array<{ name: string; confidence: number; focusQuality: number }>;
  recentOutcomes: number; // In last 7 days
} {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentOutcomes = store.outcomes.filter((o) => new Date(o.timestamp) > weekAgo).length;

  const avgProfileConfidence = store.profiles.length > 0
    ? store.profiles.reduce((sum, p) => sum + p.confidenceScore, 0) / store.profiles.length
    : 0;

  const topProfiles = store.profiles
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 5)
    .map((p) => ({
      name: p.displayName,
      confidence: p.confidenceScore,
      focusQuality: p.focusQuality.average,
    }));

  return {
    profileCount: store.profiles.length,
    outcomeCount: store.outcomes.length,
    avgProfileConfidence,
    topProfiles,
    recentOutcomes,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate unique signature for environment
 * Based on key visual markers (not raw image data)
 */
function generateEnvironmentSignature(visualContext: VisualContext): string {
  // Create hash from scene elements
  const markers = [
    visualContext.environmentType,
    visualContext.timeOfDay,
    visualContext.objects.map((o) => o.label).sort().join('|'),
    visualContext.tags.sort().join('|'),
  ].join(':');

  return `sig_${markers.length}_${markers.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)}`;
}

/**
 * Extract focus-helping factors from visual context
 */
function extractFocusFactors(visualContext: VisualContext): string[] {
  const factors: string[] = [];

  if (visualContext.tags.includes('quiet')) factors.push('quiet');
  if (visualContext.tags.includes('bright')) factors.push('natural light');
  if (visualContext.tags.includes('minimal')) factors.push('minimal clutter');
  if (visualContext.objects.some((o) => o.label.includes('plant'))) factors.push('plants');
  if (visualContext.tags.includes('organized')) factors.push('organized space');

  return factors;
}

/**
 * Calculate how suitable a profile is for an activity (0-100)
 */
function calculateSuitabilityScore(profile: EnvironmentProfile, activity: string): number {
  let score = profile.focusQuality.average;

  switch (activity) {
    case 'deep_work':
      score *= profile.deepWorkOptimal ? 1.1 : 0.8;
      break;
    case 'creative':
      score *= profile.creativeOptimal ? 1.15 : 0.7;
      break;
    case 'communication':
      score *= profile.communicationOptimal ? 1.05 : 0.9;
      break;
    case 'rest':
      score *= profile.restOptimal ? 1.2 : 0.6;
      break;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}
