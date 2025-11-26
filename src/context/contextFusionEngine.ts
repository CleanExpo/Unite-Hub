/**
 * Phase 13 – Context Fusion Engine
 *
 * Fuse multiple context streams (visual, audio, calendar, location, cognitive state)
 * into a single 'situation snapshot' that Parallel Phill can use for reasoning.
 *
 * - Combine: visual context, wake-window transcript, calendar events, life signals, cognitive state
 * - Produce: SituationSnapshot with environment summary, activity guess, risk/opportunity flags
 * - Support: Time-based decay (older signals weighted lower)
 * - Graceful degradation: Works without visual context (audio + calendar + life signals)
 *
 * Integration: Receives outputs from Phase 11, 10, 13 engines
 * Feeds: dialogueOrchestrator, realTimeAdvisorBridge, schedulingEngine, safetyContextFilter
 * Output: SituationSnapshot with consolidated reasoning ready for downstream consumption
 */

import type { VisualContext, EnvironmentType } from './visualContextEngine';
import type { SurroundingsInsight } from './surroundingsReasoner';

// ============================================================================
// SITUATION SNAPSHOT TYPES
// ============================================================================

export interface SituationSnapshot {
  // Snapshot identity
  snapshotId: string;
  timestamp: string;

  // Source data freshness
  visualContextAge: number; // milliseconds since VisualContext generated
  audioContextAge: number; // milliseconds since last wake-window transcript
  calendarAge: number; // milliseconds since last calendar refresh
  cognitiveStateAge: number; // milliseconds since last cognitive state update

  // Environment summary
  environmentType: EnvironmentType;
  environmentDescription: string; // Human-readable (e.g., "Office at morning. Working at desk.")
  environmentConfidence: number; // 0-1, based on source recency

  // Activity inference
  likelyActivity: string; // "working", "commuting", "meeting", "exercising", etc.
  activityConfidence: number; // 0-1, based on visual + calendar + life signals agreement
  currentCalendarEvent?: {
    title: string;
    timeUntilStart: number; // ms, negative if ongoing
    duration: number; // ms
  };

  // Time context
  timeOfDay: string; // "early_morning", "morning", "midday", "afternoon", "evening", "night"
  dayType: 'weekday' | 'weekend' | 'holiday';
  urgencyFromCalendar: 'low' | 'medium' | 'high'; // Based on upcoming events

  // Risk assessment
  riskFlags: {
    type: 'safety' | 'distraction' | 'energy' | 'autonomy' | 'social';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }[];

  // Opportunity assessment
  opportunityFlags: {
    type: 'focus' | 'creative' | 'social' | 'rest' | 'exercise' | 'learning';
    suitability: 'ideal' | 'good' | 'fair' | 'poor';
    description: string;
    actionableWindow: number; // milliseconds until opportunity expires
  }[];

  // Safety scores (weighted from visual context)
  safetyScore: number; // 0-100
  focusScore: number; // 0-100
  socialPressureScore: number; // 0-100

  // Interaction recommendations (from surrounding reasoner + cognitive state)
  recommendedInteractionStyle: {
    responseLength: 'very_brief' | 'brief' | 'normal' | 'detailed';
    pace: 'very_fast' | 'fast' | 'normal' | 'slow';
    complexity: 'minimal' | 'simple' | 'normal' | 'complex';
    reasoning: string;
  };

  // Recent context (audio + text)
  recentTranscript?: string; // Last wake-window transcript
  recentEntities: string[]; // Extracted key entities from recent audio/visual

  // Cognitive & physiological context
  cognitiveLoad: 'low' | 'moderate' | 'high' | 'overloaded';
  energyLevel: 'sharp' | 'good' | 'tired' | 'fatigued' | 'overloaded';
  emotionalState: string; // e.g., "calm", "engaged", "frustrated"

  // Fusion quality metrics
  completeness: number; // 0-1, how many context streams are available
  consistency: number; // 0-1, agreement between independent sources
  confidence: number; // 0-1, overall confidence in snapshot
}

// ============================================================================
// INPUT TYPES FROM UPSTREAM PHASES
// ============================================================================

export interface ContextInputs {
  // Phase 13: Visual context (optional, may be null if no recent capture)
  visualContext?: VisualContext;
  surroundingsInsight?: SurroundingsInsight;

  // Phase 11: Recent wake-window transcript (optional)
  recentTranscript?: string;
  transcriptTimestamp?: string;

  // Phase 9: Upcoming calendar events (optional)
  upcomingEvents?: Array<{
    title: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    priority?: 'low' | 'high';
  }>;

  // Phase 10: Cognitive state (optional)
  cognitiveState?: {
    energyLevel: 'sharp' | 'good' | 'tired' | 'fatigued' | 'overloaded';
    cognitiveLoad: 'low' | 'moderate' | 'high' | 'overloaded';
    emotionalState: string;
    timestamp: string;
  };

  // Phase 10: Life signals (optional)
  lifeSignals?: {
    heartRate?: number;
    stressLevel?: 'low' | 'normal' | 'elevated';
    lastMovement?: string; // ISO timestamp
    sleepQuality?: number; // 0-1
  };
}

// ============================================================================
// SITUATION SNAPSHOT GENERATION
// ============================================================================

/**
 * Fuse multiple context streams into a single situation snapshot
 */
export async function generateSituationSnapshot(input: ContextInputs): Promise<SituationSnapshot> {
  const snapshotId = `ss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const nowTime = now.getTime();

  // Calculate source freshness
  const visualContextAge = input.visualContext ? nowTime - new Date(input.visualContext.timestamp).getTime() : Infinity;
  const audioContextAge = input.recentTranscript && input.transcriptTimestamp
    ? nowTime - new Date(input.transcriptTimestamp).getTime()
    : Infinity;
  const cognitiveStateAge = input.cognitiveState ? nowTime - new Date(input.cognitiveState.timestamp).getTime() : Infinity;

  // Determine calendar age (default to 5 minutes if no event)
  let calendarAge = 5 * 60 * 1000;
  let currentCalendarEvent: SituationSnapshot['currentCalendarEvent'] | undefined;

  if (input.upcomingEvents && input.upcomingEvents.length > 0) {
    const startTime = new Date(input.upcomingEvents[0].startTime).getTime();
    const endTime = new Date(input.upcomingEvents[0].endTime).getTime();
    const timeUntilStart = startTime - nowTime;

    // If event is currently happening
    if (timeUntilStart <= 0 && timeUntilStart + (endTime - startTime) >= 0) {
      calendarAge = 0; // Current event is fresh
      currentCalendarEvent = {
        title: input.upcomingEvents[0].title,
        timeUntilStart,
        duration: endTime - startTime,
      };
    } else if (timeUntilStart > 0) {
      calendarAge = Math.min(timeUntilStart, 5 * 60 * 1000); // Up to 5 minutes old
      currentCalendarEvent = {
        title: input.upcomingEvents[0].title,
        timeUntilStart,
        duration: endTime - startTime,
      };
    }
  }

  // Environment determination (prioritize visual context, fall back to calendar)
  let environmentType: EnvironmentType = 'unknown';
  let environmentDescription = 'Unknown environment';
  let environmentConfidence = 0;

  if (input.visualContext) {
    environmentType = input.visualContext.environmentType;
    environmentDescription = input.visualContext.summary;
    environmentConfidence = input.visualContext.overallConfidence;
  } else if (currentCalendarEvent) {
    // Infer from calendar event if no visual context
    if (currentCalendarEvent.title.toLowerCase().includes('meeting')) {
      environmentType = 'office';
      environmentDescription = 'In meeting (inferred from calendar)';
      environmentConfidence = 0.6;
    } else if (currentCalendarEvent.title.toLowerCase().includes('coffee')) {
      environmentType = 'cafe';
      environmentDescription = 'At coffee meeting (inferred from calendar)';
      environmentConfidence = 0.6;
    }
  }

  // Time context
  const timeOfDay = determineTimeOfDay(now);
  const dayType = getDayType(now);

  // Activity inference (visual > calendar > signals)
  let likelyActivity = 'unknown_activity';
  let activityConfidence = 0;

  if (input.surroundingsInsight) {
    likelyActivity = input.surroundingsInsight.likelyActivity;
    activityConfidence = 0.9; // Visual is most reliable
  } else if (currentCalendarEvent) {
    likelyActivity = inferActivityFromCalendarEvent(currentCalendarEvent.title);
    activityConfidence = 0.7;
  }

  // Safety & focus scores (from surroundings insight, with fallbacks)
  let safetyScore = 70;
  let focusScore = 70;
  let socialPressureScore = 30;

  if (input.surroundingsInsight) {
    safetyScore = input.surroundingsInsight.safetyScore;
    focusScore = input.surroundingsInsight.focusScore;
    socialPressureScore = input.surroundingsInsight.socialPressureScore;
  }

  // Risk flags (safety + energy + distraction)
  const riskFlags = generateRiskFlags({
    safetyScore,
    focusScore,
    cognitiveLoad: input.cognitiveState?.cognitiveLoad || 'moderate',
    energyLevel: input.cognitiveState?.energyLevel || 'good',
    surroundingsInsight: input.surroundingsInsight,
    stressLevel: input.lifeSignals?.stressLevel,
  });

  // Opportunity flags
  const opportunityFlags = generateOpportunityFlags({
    focusScore,
    safetyScore,
    surroundingsInsight: input.surroundingsInsight,
    likelyActivity,
    currentCalendarEvent,
  });

  // Interaction style (from surroundings + cognitive state)
  let recommendedInteractionStyle = {
    responseLength: 'normal' as const,
    pace: 'normal' as const,
    complexity: 'normal' as const,
    reasoning: 'Moderate conditions - balanced interaction style',
  };

  if (input.surroundingsInsight) {
    recommendedInteractionStyle = input.surroundingsInsight.recommendedInteractionStyle;

    // Adjust for cognitive state if available
    if (input.cognitiveState?.energyLevel === 'overloaded' || input.cognitiveState?.cognitiveLoad === 'overloaded') {
      recommendedInteractionStyle = {
        responseLength: 'brief',
        pace: 'fast',
        complexity: 'minimal',
        reasoning: 'High cognitive load detected - keep interactions brief and simple',
      };
    } else if (input.cognitiveState?.energyLevel === 'sharp' && focusScore > 80) {
      recommendedInteractionStyle = {
        responseLength: 'detailed',
        pace: 'normal',
        complexity: 'complex',
        reasoning: 'Sharp, focused state - can handle detailed, complex responses',
      };
    }
  }

  // Urgency from calendar
  const urgencyFromCalendar = calculateCalendarUrgency(input.upcomingEvents);

  // Recent entities (from transcript + visual)
  const recentEntities = extractRecentEntities(input.recentTranscript, input.visualContext);

  // Cognitive & physiological context
  const cognitiveLoad = input.cognitiveState?.cognitiveLoad || 'moderate';
  const energyLevel = input.cognitiveState?.energyLevel || 'good';
  const emotionalState = input.cognitiveState?.emotionalState || 'neutral';

  // Fusion quality metrics
  const completeness = calculateCompleteness(input);
  const consistency = calculateConsistency(input);
  const confidence = Math.max(environmentConfidence, activityConfidence, 0.5);

  return {
    snapshotId,
    timestamp: now.toISOString(),
    visualContextAge,
    audioContextAge,
    calendarAge,
    cognitiveStateAge,
    environmentType,
    environmentDescription,
    environmentConfidence,
    likelyActivity,
    activityConfidence,
    currentCalendarEvent,
    timeOfDay,
    dayType,
    urgencyFromCalendar,
    riskFlags,
    opportunityFlags,
    safetyScore,
    focusScore,
    socialPressureScore,
    recommendedInteractionStyle,
    recentTranscript: input.recentTranscript,
    recentEntities,
    cognitiveLoad,
    energyLevel,
    emotionalState,
    completeness,
    consistency,
    confidence,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine time of day from timestamp
 */
function determineTimeOfDay(date: Date): string {
  const hours = date.getHours();

  if (hours >= 5 && hours < 9) return 'early_morning';
  if (hours >= 9 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 14) return 'midday';
  if (hours >= 14 && hours < 18) return 'afternoon';
  if (hours >= 18 && hours < 21) return 'evening';
  return 'night';
}

/**
 * Determine day type (weekday, weekend, holiday)
 */
function getDayType(date: Date): 'weekday' | 'weekend' | 'holiday' {
  const day = date.getDay();

  // TODO: Integrate with holiday calendar in Phase 9
  if (day === 0 || day === 6) return 'weekend';
  return 'weekday';
}

/**
 * Infer activity from calendar event title
 */
function inferActivityFromCalendarEvent(eventTitle: string): string {
  const lower = eventTitle.toLowerCase();

  if (lower.includes('meeting') || lower.includes('standup') || lower.includes('sync')) return 'in_meeting';
  if (lower.includes('coffee') || lower.includes('lunch') || lower.includes('dinner')) return 'socializing';
  if (lower.includes('exercise') || lower.includes('gym') || lower.includes('run')) return 'exercising';
  if (lower.includes('break') || lower.includes('rest')) return 'resting';
  if (lower.includes('commute') || lower.includes('travel')) return 'commuting';

  return 'unknown_activity';
}

/**
 * Generate risk flags based on scores and state
 */
function generateRiskFlags(input: {
  safetyScore: number;
  focusScore: number;
  cognitiveLoad: string;
  energyLevel: string;
  surroundingsInsight?: SurroundingsInsight;
  stressLevel?: string;
}): SituationSnapshot['riskFlags'] {
  const flags: SituationSnapshot['riskFlags'] = [];

  // Safety risks
  if (input.safetyScore < 40) {
    flags.push({
      type: 'safety',
      severity: 'high',
      description: 'Unsafe environment detected',
      recommendation: 'Defer complex decisions; prioritize situational awareness',
    });
  } else if (input.safetyScore < 60) {
    flags.push({
      type: 'safety',
      severity: 'medium',
      description: 'Moderate safety concern',
      recommendation: 'Stay alert; avoid heavy distractions',
    });
  }

  // Distraction risks
  if (input.focusScore < 40) {
    flags.push({
      type: 'distraction',
      severity: 'high',
      description: 'High distraction environment',
      recommendation: 'Not ideal for deep work; consider finding a quieter space',
    });
  }

  // Energy risks
  if (input.energyLevel === 'overloaded' || input.energyLevel === 'fatigued') {
    flags.push({
      type: 'energy',
      severity: 'high',
      description: 'Low energy state',
      recommendation: 'Consider rest or light activity; defer complex decisions',
    });
  }

  // Stress risks
  if (input.stressLevel === 'elevated') {
    flags.push({
      type: 'autonomy',
      severity: 'medium',
      description: 'Elevated stress detected',
      recommendation: 'Suggest grounding exercises; avoid high-stakes decisions',
    });
  }

  // Include hazards from surrounding insight
  if (input.surroundingsInsight?.hazardWarnings) {
    for (const hazard of input.surroundingsInsight.hazardWarnings) {
      if (hazard.severity === 'high') {
        flags.push({
          type: 'safety',
          severity: hazard.severity,
          description: hazard.description,
          recommendation: hazard.recommendation,
        });
      }
    }
  }

  return flags;
}

/**
 * Generate opportunity flags based on scores and context
 */
function generateOpportunityFlags(input: {
  focusScore: number;
  safetyScore: number;
  surroundingsInsight?: SurroundingsInsight;
  likelyActivity: string;
  currentCalendarEvent?: SituationSnapshot['currentCalendarEvent'];
}): SituationSnapshot['opportunityFlags'] {
  const flags: SituationSnapshot['opportunityFlags'] = [];

  // Focus opportunities
  if (input.focusScore > 75) {
    flags.push({
      type: 'focus',
      suitability: 'ideal',
      description: 'Excellent conditions for deep, concentrated work',
      actionableWindow: 30 * 60 * 1000, // 30 minutes
    });
  } else if (input.focusScore > 60) {
    flags.push({
      type: 'focus',
      suitability: 'good',
      description: 'Good focus conditions; some distractions but manageable',
      actionableWindow: 20 * 60 * 1000,
    });
  }

  // Include from surrounding insight
  if (input.surroundingsInsight?.focusOpportunities) {
    for (const opp of input.surroundingsInsight.focusOpportunities.slice(0, 2)) {
      flags.push({
        type: opp.type as any,
        suitability: opp.suitability,
        description: opp.description,
        actionableWindow: 30 * 60 * 1000, // Generic 30-min window
      });
    }
  }

  // Rest/exercise opportunities during breaks
  if (input.currentCalendarEvent && input.currentCalendarEvent.timeUntilStart > 30 * 60 * 1000) {
    flags.push({
      type: 'rest',
      suitability: 'good',
      description: 'Break time available before next event',
      actionableWindow: Math.min(input.currentCalendarEvent.timeUntilStart, 15 * 60 * 1000),
    });
  }

  return flags;
}

/**
 * Calculate urgency based on upcoming calendar events
 */
function calculateCalendarUrgency(upcomingEvents?: Array<{ startTime: string }>): 'low' | 'medium' | 'high' {
  if (!upcomingEvents || upcomingEvents.length === 0) return 'low';

  const now = Date.now();
  const nextEventTime = new Date(upcomingEvents[0].startTime).getTime();
  const timeUntilEvent = nextEventTime - now;

  if (timeUntilEvent < 5 * 60 * 1000) return 'high'; // < 5 min
  if (timeUntilEvent < 15 * 60 * 1000) return 'medium'; // < 15 min
  return 'low';
}

/**
 * Extract recent entities from transcript and visual context
 */
function extractRecentEntities(transcript?: string, visualContext?: VisualContext): string[] {
  const entities: Set<string> = new Set();

  // From transcript (extract capitalized words as entity hints)
  if (transcript) {
    const words = transcript.split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && /^[A-Z]/.test(word)) {
        entities.add(word.replace(/[^\w]/g, ''));
      }
    }
  }

  // From visual context (detected objects and extracted text)
  if (visualContext) {
    for (const obj of visualContext.objects) {
      entities.add(obj.label);
    }
    for (const text of visualContext.extractedText) {
      // Add significant text elements
      if (text.content.length > 3 && text.content.length < 50) {
        entities.add(text.content);
      }
    }
  }

  return Array.from(entities).slice(0, 10); // Limit to 10 entities
}

/**
 * Calculate completeness of context inputs (0-1)
 */
function calculateCompleteness(input: ContextInputs): number {
  let score = 0;
  let maxScore = 5;

  if (input.visualContext) score += 1;
  if (input.recentTranscript) score += 1;
  if (input.upcomingEvents && input.upcomingEvents.length > 0) score += 1;
  if (input.cognitiveState) score += 1;
  if (input.lifeSignals) score += 1;

  return score / maxScore;
}

/**
 * Calculate consistency between independent sources (0-1)
 */
function calculateConsistency(input: ContextInputs): number {
  // Compare activity inference from different sources
  const activitySources: string[] = [];

  if (input.surroundingsInsight) {
    activitySources.push(input.surroundingsInsight.likelyActivity);
  }

  if (input.upcomingEvents && input.upcomingEvents.length > 0) {
    activitySources.push(inferActivityFromCalendarEvent(input.upcomingEvents[0].title));
  }

  if (activitySources.length < 2) return 0.8; // Can't calculate with < 2 sources

  // Check if activities match
  const allMatch = activitySources.every((a) => a === activitySources[0]);
  return allMatch ? 1.0 : 0.6; // High if they match, medium if they differ
}

// ============================================================================
// SITUATION SNAPSHOT QUERY API
// ============================================================================

// In-memory cache of latest snapshot per user (in production: Redis)
const snapshotCache = new Map<string, SituationSnapshot>();

/**
 * Store latest snapshot
 */
export function cacheLatestSnapshot(userId: string, snapshot: SituationSnapshot): void {
  snapshotCache.set(userId, snapshot);
}

/**
 * Fetch latest cached snapshot
 */
export function getLatestSnapshot(userId: string): SituationSnapshot | null {
  const cached = snapshotCache.get(userId);

  // Return if fresher than 1 minute
  if (cached && Date.now() - new Date(cached.timestamp).getTime() < 60 * 1000) {
    return cached;
  }

  return null;
}

/**
 * Clear cache (for testing or user logout)
 */
export function clearSnapshotCache(userId?: string): void {
  if (userId) {
    snapshotCache.delete(userId);
  } else {
    snapshotCache.clear();
  }
}

/**
 * Get snapshot age in seconds
 */
export function getSnapshotAge(snapshot: SituationSnapshot): number {
  return (Date.now() - new Date(snapshot.timestamp).getTime()) / 1000;
}

/**
 * Check if snapshot is stale (older than threshold)
 */
export function isSnapshotStale(snapshot: SituationSnapshot, thresholdSeconds: number = 300): boolean {
  return getSnapshotAge(snapshot) > thresholdSeconds;
}

/**
 * Get summary of snapshot for quick display
 */
export function summarizeSituation(snapshot: SituationSnapshot): string {
  const parts: string[] = [];

  parts.push(`At ${snapshot.environmentType} (${snapshot.timeOfDay})`);
  parts.push(`Activity: ${snapshot.likelyActivity}`);

  if (snapshot.riskFlags.length > 0) {
    parts.push(`⚠️ ${snapshot.riskFlags[0].severity.toUpperCase()}: ${snapshot.riskFlags[0].description}`);
  }

  if (snapshot.opportunityFlags.length > 0) {
    parts.push(`✓ ${snapshot.opportunityFlags[0].description}`);
  }

  if (snapshot.currentCalendarEvent) {
    const minUntil = Math.round(snapshot.currentCalendarEvent.timeUntilStart / 60 / 1000);
    parts.push(`📅 ${snapshot.currentCalendarEvent.title} in ${minUntil} min`);
  }

  return parts.join(' | ');
}
