/**
 * Phase 13 – Surroundings Reasoner
 *
 * Reason about the immediate surroundings and derive actionable insights,
 * opportunities, or warnings for Phill.
 *
 * - Infer: hazards, focus affordances, social context
 * - Produce recommendations: "good time for deep work", "high distraction", etc.
 * - Score environment on: safety, focus, social pressure (0-100 each)
 * - Integrate with autonomyPolicyEngine to avoid unsafe prompts
 *
 * Integration: Receives VisualContext + optional life signals + cognitive state
 * Feeds: contextFusionEngine, safetyContextFilter, dialogueOrchestrator
 * Output: SurroundingsInsight with scores and recommendations
 */

import type { VisualContext, EnvironmentType } from './visualContextEngine';

export type LifeSignalSnapshot = any; // From Phase 10
export type CognitiveState = any; // From Phase 10

export interface SurroundingsInsight {
  // Insight identity
  insightId: string;
  timestamp: string;

  // Environment assessment
  environmentType: EnvironmentType;
  environmentDescription: string; // Human readable summary

  // Scored dimensions (0-100)
  safetyScore: number; // 0 = danger, 100 = very safe
  focusScore: number; // 0 = high distraction, 100 = perfect focus
  socialPressureScore: number; // 0 = alone, 100 = crowded / under observation

  // Detected context
  likelyActivity: string; // "working", "commuting", "socializing", "exercising", etc.
  socialContext: 'alone' | 'small_group' | 'crowd' | 'meeting' | 'unknown';

  // Derived insights
  hazardWarnings: {
    type: 'traffic' | 'physical' | 'machinery' | 'environmental' | 'health';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }[];

  focusOpportunities: {
    type: 'deep_work' | 'creative' | 'communication' | 'exercise' | 'rest';
    suitability: 'ideal' | 'good' | 'fair' | 'poor';
    description: string;
  }[];

  // Interaction style recommendation
  recommendedInteractionStyle: {
    responseLength: 'very_brief' | 'brief' | 'normal' | 'detailed';
    pace: 'very_fast' | 'fast' | 'normal' | 'slow';
    complexity: 'minimal' | 'simple' | 'normal' | 'complex';
    reasoning: string;
  };

  // Confidence
  confidence: number; // 0-1
}

// ============================================================================
// SAFETY SCORING
// ============================================================================

/**
 * Calculate safety score (0-100)
 * 0 = immediate danger, 100 = very safe environment
 */
function calculateSafetyScore(context: VisualContext): number {
  let score = 100;

  // Vehicle traffic is significant risk (-30)
  if (context.safetyMarkers.vehicleTraffic) {
    score -= 30;
  }

  // Pedestrian traffic in busy context (-15)
  if (context.safetyMarkers.pedestrianTraffic && context.tags.includes('crowded')) {
    score -= 15;
  }

  // Machinery operating (-40)
  if (context.safetyMarkers.machinery) {
    score -= 40;
  }

  // Each hazard further reduces (-10 each, max -30)
  const hazardPenalty = Math.min(context.safetyMarkers.hazards.length * 10, 30);
  score -= hazardPenalty;

  // Low lighting reduces safety (-15)
  if (context.tags.includes('dimly_lit')) {
    score -= 15;
  }

  // Unknown environment reduces safety (-20)
  if (context.environmentType === 'unknown') {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// FOCUS SCORING
// ============================================================================

/**
 * Calculate focus score (0-100)
 * 0 = maximum distraction, 100 = ideal focus environment
 */
function calculateFocusScore(context: VisualContext): number {
  let score = 100;

  // Crowded environment significantly reduces focus (-40)
  if (context.tags.includes('crowded')) {
    score -= 40;
  }

  // Quiet minimal environment boosts focus (+10)
  if (context.tags.includes('quiet') && context.tags.includes('minimal')) {
    score += 10;
  }

  // Cluttered environment reduces focus (-25)
  if (context.tags.includes('cluttered')) {
    score -= 25;
  }

  // Dynamic / moving objects reduce focus (-20)
  if (context.tags.includes('dynamic')) {
    score -= 20;
  }

  // Good lighting helps focus (+10)
  if (context.tags.includes('bright')) {
    score += 10;
  }

  // Home office is ideal for focus (+15)
  if (context.environmentType === 'office' && !context.tags.includes('crowded')) {
    score += 15;
  }

  // Traffic / commute kills focus (-35)
  if (context.environmentType === 'street' || context.environmentType === 'transit' || context.environmentType === 'car') {
    score -= 35;
  }

  // Social environments reduce focus (-20)
  if (context.environmentType === 'cafe' || context.environmentType === 'retail') {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// SOCIAL PRESSURE SCORING
// ============================================================================

/**
 * Calculate social pressure score (0-100)
 * 0 = completely alone, 100 = under heavy observation / crowded
 */
function calculateSocialPressureScore(context: VisualContext): number {
  let score = 0;

  // Count people in scene
  const people = context.objects.filter((o) => o.label === 'person');

  // Base score on person count
  if (people.length === 0) {
    score = 0; // Alone
  } else if (people.length === 1) {
    score = 20; // One other person
  } else if (people.length <= 5) {
    score = 50; // Small group
  } else if (people.length <= 15) {
    score = 75; // Medium group
  } else {
    score = 100; // Crowd
  }

  // Environment context boosts social pressure
  if (context.environmentType === 'cafe') {
    score += 20;
  }
  if (context.environmentType === 'retail') {
    score += 20;
  }
  if (context.environmentType === 'street') {
    score += 10;
  }
  if (context.environmentType === 'office') {
    score += 15;
  }

  // Crowded tag boosts it
  if (context.tags.includes('crowded')) {
    score += 25;
  }

  return Math.min(100, score);
}

// ============================================================================
// ACTIVITY INFERENCE
// ============================================================================

/**
 * Infer Phill's likely activity from environment
 */
function inferLikelyActivity(context: VisualContext): string {
  const envType = context.environmentType;
  const objects = context.objects.map((o) => o.label.toLowerCase());

  // Work-related environments
  if ((envType === 'office' || envType === 'home') && objects.some((l) => ['desk', 'computer', 'whiteboard'].includes(l))) {
    return 'working';
  }

  // Meeting
  if (objects.some((l) => ['conference table', 'whiteboard', 'presentation'].includes(l))) {
    return 'in_meeting';
  }

  // Commute
  if (envType === 'car' || envType === 'transit') {
    return 'commuting';
  }

  // Social
  if ((envType === 'cafe' || envType === 'retail') && context.objects.filter((o) => o.label === 'person').length > 0) {
    return 'socializing';
  }

  // Exercise
  if (objects.some((l) => ['treadmill', 'weights', 'bicycle'].includes(l)) || envType === 'outdoor') {
    return 'exercising';
  }

  // Rest
  if (objects.some((l) => ['bed', 'couch'].includes(l))) {
    return 'resting';
  }

  return 'unknown_activity';
}

/**
 * Determine social context
 */
function determineSocialContext(context: VisualContext): 'alone' | 'small_group' | 'crowd' | 'meeting' | 'unknown' {
  const people = context.objects.filter((o) => o.label === 'person').length;

  if (people === 0) {
    return 'alone';
  }

  // Check if meeting context (table, whiteboard, multiple people)
  const meetingIndicators = context.objects.filter((o) => ['conference table', 'whiteboard', 'presentation'].includes(o.label.toLowerCase())).length;
  if (meetingIndicators > 0 && people >= 2) {
    return 'meeting';
  }

  if (people <= 3) {
    return 'small_group';
  }

  if (people > 3) {
    return 'crowd';
  }

  return 'unknown';
}

// ============================================================================
// OPPORTUNITY & HAZARD DETECTION
// ============================================================================

/**
 * Identify hazards in the environment
 */
function identifyHazards(context: VisualContext, safetyScore: number): Array<{
  type: 'traffic' | 'physical' | 'machinery' | 'environmental' | 'health';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}> {
  const hazards: any[] = [];

  // Traffic hazards
  if (context.safetyMarkers.vehicleTraffic) {
    hazards.push({
      type: 'traffic' as const,
      severity: 'high' as const,
      description: 'Active vehicle traffic in vicinity',
      recommendation: 'Avoid screen-heavy tasks; stay alert to surroundings',
    });
  }

  // Machinery hazards
  if (context.safetyMarkers.machinery) {
    hazards.push({
      type: 'machinery' as const,
      severity: 'high' as const,
      description: 'Machinery operating in environment',
      recommendation: 'Defer complex tasks; prioritize safety',
    });
  }

  // Specific environmental hazards
  for (const hazard of context.safetyMarkers.hazards) {
    hazards.push({
      type: 'environmental' as const,
      severity: 'medium' as const,
      description: `Hazard detected: ${hazard}`,
      recommendation: 'Exercise caution; avoid distractions',
    });
  }

  // Low visibility hazard
  if (context.tags.includes('dimly_lit')) {
    hazards.push({
      type: 'environmental' as const,
      severity: 'low' as const,
      description: 'Low lighting conditions',
      recommendation: 'Be aware of movement risks; ensure good lighting if possible',
    });
  }

  return hazards;
}

/**
 * Identify focus opportunities
 */
function identifyFocusOpportunities(context: VisualContext, focusScore: number): Array<{
  type: 'deep_work' | 'creative' | 'communication' | 'exercise' | 'rest';
  suitability: 'ideal' | 'good' | 'fair' | 'poor';
  description: string;
}> {
  const opportunities: any[] = [];

  // Deep work opportunity
  if (focusScore > 75) {
    opportunities.push({
      type: 'deep_work' as const,
      suitability: 'ideal' as const,
      description: 'Excellent focus conditions for deep, concentrated work',
    });
  } else if (focusScore > 50) {
    opportunities.push({
      type: 'deep_work' as const,
      suitability: 'good' as const,
      description: 'Decent focus conditions; some distractions but manageable',
    });
  }

  // Creative work
  if (context.environmentType === 'office' || (context.environmentType === 'home' && focusScore > 60)) {
    opportunities.push({
      type: 'creative' as const,
      suitability: focusScore > 70 ? 'ideal' : 'good',
      description: 'Good environment for brainstorming and creative thinking',
    });
  }

  // Communication opportunity
  if (context.tags.includes('quiet') && focusScore > 60) {
    opportunities.push({
      type: 'communication' as const,
      suitability: 'ideal' as const,
      description: 'Quiet environment ideal for focused conversations and calls',
    });
  }

  // Exercise
  if (context.environmentType === 'outdoor' || context.objects.some((o) => ['gym', 'park', 'treadmill'].includes(o.label.toLowerCase()))) {
    opportunities.push({
      type: 'exercise' as const,
      suitability: 'ideal' as const,
      description: 'Good opportunity to incorporate physical activity',
    });
  }

  // Rest
  if (context.environmentType === 'home' && context.objects.some((o) => ['bed', 'couch'].includes(o.label.toLowerCase()))) {
    opportunities.push({
      type: 'rest' as const,
      suitability: 'ideal' as const,
      description: 'Comfortable space for rest and recharge',
    });
  }

  return opportunities;
}

// ============================================================================
// MAIN REASONING FUNCTION
// ============================================================================

/**
 * Reason about surroundings and generate insight
 */
export async function reasonAboutSurroundings(input: {
  visualContext: VisualContext;
  lifeSignals?: LifeSignalSnapshot;
  cognitiveState?: CognitiveState;
}): Promise<SurroundingsInsight> {
  const insightId = `sr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const context = input.visualContext;

  // Calculate scores
  const safetyScore = calculateSafetyScore(context);
  const focusScore = calculateFocusScore(context);
  const socialPressureScore = calculateSocialPressureScore(context);

  // Infer activity and social context
  const likelyActivity = inferLikelyActivity(context);
  const socialContext = determineSocialContext(context);

  // Identify hazards and opportunities
  const hazardWarnings = identifyHazards(context, safetyScore);
  const focusOpportunities = identifyFocusOpportunities(context, focusScore);

  // Determine recommended interaction style
  const responseLength = focusScore > 75 ? 'detailed' : focusScore > 50 ? 'normal' : socialPressureScore > 60 ? 'brief' : 'normal';
  const pace = socialPressureScore > 70 ? 'very_fast' : focusScore < 40 ? 'fast' : 'normal';
  const complexity = safetyScore < 40 ? 'minimal' : focusScore < 40 ? 'simple' : 'normal';

  const recommendedInteractionStyle = {
    responseLength: responseLength as 'very_brief' | 'brief' | 'normal' | 'detailed',
    pace: pace as 'very_fast' | 'fast' | 'normal' | 'slow',
    complexity: complexity as 'minimal' | 'simple' | 'normal' | 'complex',
    reasoning:
      safetyScore < 50
        ? 'Safety concern detected - prioritize brief, simple responses'
        : focusScore > 75
          ? 'Excellent focus conditions - can handle complex, detailed responses'
          : 'Moderate conditions - adapt to balanced interaction style',
  };

  // Environment description
  const environmentDescription = `${context.environmentType} environment at ${context.timeOfDay}. ${context.summary}`;

  return {
    insightId,
    timestamp: new Date().toISOString(),
    environmentType: context.environmentType,
    environmentDescription,
    safetyScore,
    focusScore,
    socialPressureScore,
    likelyActivity,
    socialContext,
    hazardWarnings,
    focusOpportunities,
    recommendedInteractionStyle,
    confidence: context.overallConfidence,
  };
}

/**
 * Generate human-readable summary of surroundings insight
 */
export function summarizeInsight(insight: SurroundingsInsight): string {
  const parts: string[] = [];

  // Opening
  parts.push(`At ${insight.environmentType} (${insight.likelyActivity})`);

  // Safety assessment
  if (insight.safetyScore < 40) {
    parts.push('Safety concern - prioritize caution');
  } else if (insight.safetyScore < 70) {
    parts.push(`Moderate safety (${insight.safetyScore}/100)`);
  } else {
    parts.push('Good safety conditions');
  }

  // Focus assessment
  if (insight.focusScore > 75) {
    parts.push('Excellent focus conditions');
  } else if (insight.focusScore > 50) {
    parts.push('Decent focus');
  } else {
    parts.push('High distractions');
  }

  // Social context
  if (insight.socialContext !== 'alone') {
    parts.push(`Social context: ${insight.socialContext}`);
  }

  // Top recommendation
  if (insight.hazardWarnings.length > 0) {
    parts.push(`⚠️ ${insight.hazardWarnings[0].description}`);
  } else if (insight.focusOpportunities.length > 0) {
    parts.push(`✓ ${insight.focusOpportunities[0].description}`);
  }

  return parts.join('. ');
}
