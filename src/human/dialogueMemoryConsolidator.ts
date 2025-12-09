/**
 * Phase 12 – Dialogue Memory Consolidator
 *
 * Long-term memory consolidation from dialogue sessions into unified memory fabric.
 * - Extract memory fragments from dialogue turns
 * - Score importance (emotional salience, decision impact, goal relevance)
 * - Tag by domain and emotion
 * - Consolidate into persistent agent memory (Phase 5)
 * - Update unified_agent_memory with bidirectional sync
 *
 * Integration: Receives DialogueSessionState + interactions from realtimeDialogueOrchestrator
 * Feeds: unified_agent_memory table in Supabase + cognitive state engine
 * Output: ConsolidatedMemory with tags + importance scores
 */

import type { DialogueTurn, DialogueSessionState } from './dialogueStateEngine';
import type { DialogueInteraction } from './realtimeDialogueOrchestrator';

// ============================================================================
// MEMORY CONSOLIDATION TYPES
// ============================================================================

export type MemoryDomain =
  | 'business'
  | 'personal'
  | 'financial'
  | 'relationship'
  | 'health'
  | 'learning'
  | 'goal'
  | 'decision'
  | 'strategy';

export type MemoryEmotionalValence = 'positive' | 'neutral' | 'negative';

export interface MemoryFragment {
  // Fragment Identity
  fragment_id: string;
  timestamp: string;

  // Content
  content: string; // The actual memory text
  source_turn_id: string; // Which dialogue turn
  source_session_id: string;

  // Metadata
  domain: MemoryDomain;
  emotional_valence: MemoryEmotionalValence;
  involves_person: boolean;
  involves_decision: boolean;
  involves_goal: boolean;

  // Importance Score (0-100)
  importance_score: number; // Calculated from recency, emotion, impact

  // Consolidation Status
  consolidated: boolean;
  consolidated_at?: string;
  unified_memory_id?: string; // Link to unified_agent_memory
}

export interface ConsolidatedMemory {
  // Memory Identity
  memory_id: string;
  created_at: string;
  updated_at: string;

  // Consolidated Fragments
  fragments: MemoryFragment[];
  consolidated_fragment_count: number;

  // Aggregated Metadata
  dominant_domain: MemoryDomain;
  dominant_emotion: MemoryEmotionalValence;

  // Importance Metrics
  average_importance: number;
  peak_importance: number;

  // Unified Memory Reference
  unified_memory_id?: string;
  sync_status: 'pending' | 'synced' | 'error';

  // Statistics
  person_mentions: string[]; // Names of people mentioned
  decision_points: string[]; // Key decisions made
  goal_references: string[]; // Goals discussed
  topic_tags: string[];

  // Bidirectional Sync
  last_sync_at: string;
  requires_bidirectional_update: boolean;
}

// ============================================================================
// MEMORY EXTRACTION
// ============================================================================

/**
 * Extract memory fragments from a dialogue session
 */
export function extractMemoryFromSession(input: {
  session: DialogueSessionState;
  interactions: DialogueInteraction[];
}): MemoryFragment[] {
  const fragments: MemoryFragment[] = [];

  // Iterate through dialogue turns
  for (const turn of input.session.dialogue_history) {
    const turnFragments = extractMemoryFromTurn(turn, input.session);
    fragments.push(...turnFragments);
  }

  // Deduplicate by content
  const uniqueFragments = new Map<string, MemoryFragment>();
  for (const fragment of fragments) {
    if (!uniqueFragments.has(fragment.content)) {
      uniqueFragments.set(fragment.content, fragment);
    }
  }

  const result: MemoryFragment[] = [];
  uniqueFragments.forEach((value) => {
    result.push(value);
  });
  return result;
}

/**
 * Extract memory fragments from a single turn
 */
function extractMemoryFromTurn(turn: DialogueTurn, session: DialogueSessionState): MemoryFragment[] {
  const fragments: MemoryFragment[] = [];

  // Skip assistant turns in memory extraction (only user input becomes memory)
  if (turn.speaker !== 'user') {
    return fragments;
  }

  // Extract different types of memory fragments
  const emotionalFragment = extractEmotionalMemory(turn);
  if (emotionalFragment) {
fragments.push(emotionalFragment);
}

  const decisionFragment = extractDecisionMemory(turn);
  if (decisionFragment) {
fragments.push(decisionFragment);
}

  const goalFragment = extractGoalMemory(turn);
  if (goalFragment) {
fragments.push(goalFragment);
}

  const businessFragment = extractBusinessMemory(turn);
  if (businessFragment) {
fragments.push(businessFragment);
}

  return fragments;
}

/**
 * Extract emotional/sentiment memory
 */
function extractEmotionalMemory(turn: DialogueTurn): MemoryFragment | null {
  // Extract if user expressed strong emotion
  const emotionalMarkers: Record<string, boolean> = {
    positive: ['love', 'happy', 'excited', 'grateful', 'proud', 'amazed'].some((w) =>
      turn.transcript.toLowerCase().includes(w)
    ),
    negative: ['frustrated', 'angry', 'sad', 'disappointed', 'concerned', 'worried'].some((w) =>
      turn.transcript.toLowerCase().includes(w)
    ),
  };

  if (!emotionalMarkers.positive && !emotionalMarkers.negative) {
    return null;
  }

  const valence =
    turn.user_emotion === 'calm' || turn.user_emotion === 'curious' ? 'positive' : turn.user_emotion === 'frustrated' || turn.user_emotion === 'confused' ? 'negative' : 'neutral';

  return {
    fragment_id: `mf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: turn.timestamp,
    content: `Phill was ${turn.user_emotion} about: "${turn.transcript.substring(0, 100)}..."`,
    source_turn_id: turn.turn_id,
    source_session_id: turn.session_id,
    domain: 'personal',
    emotional_valence: valence as MemoryEmotionalValence,
    involves_person: false,
    involves_decision: false,
    involves_goal: false,
    importance_score: 60, // Emotional moments are moderately important
    consolidated: false,
  };
}

/**
 * Extract decision-related memory
 */
function extractDecisionMemory(turn: DialogueTurn): MemoryFragment | null {
  const decisionMarkers = ['decided', 'choose', 'will go', 'going to', 'plan to', 'commit', 'decided to'];

  const hasDecision = decisionMarkers.some((marker) => turn.transcript.toLowerCase().includes(marker));

  if (!hasDecision) {
    return null;
  }

  return {
    fragment_id: `mf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: turn.timestamp,
    content: `Decision: ${turn.transcript.substring(0, 150)}`,
    source_turn_id: turn.turn_id,
    source_session_id: turn.session_id,
    domain: turn.domain.includes('business') ? 'business' : 'personal',
    emotional_valence: 'neutral',
    involves_person: false,
    involves_decision: true,
    involves_goal: false,
    importance_score: 85, // Decisions are highly important
    consolidated: false,
  };
}

/**
 * Extract goal-related memory
 */
function extractGoalMemory(turn: DialogueTurn): MemoryFragment | null {
  const goalMarkers = ['goal', 'want to', 'aim', 'target', 'objective', 'strive', 'vision'];

  const hasGoal = goalMarkers.some((marker) => turn.transcript.toLowerCase().includes(marker));

  if (!hasGoal) {
    return null;
  }

  return {
    fragment_id: `mf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: turn.timestamp,
    content: `Goal: ${turn.transcript.substring(0, 150)}`,
    source_turn_id: turn.turn_id,
    source_session_id: turn.session_id,
    domain: 'goal',
    emotional_valence: 'positive',
    involves_person: false,
    involves_decision: false,
    involves_goal: true,
    importance_score: 90, // Goals are critical
    consolidated: false,
  };
}

/**
 * Extract business-related memory
 */
function extractBusinessMemory(turn: DialogueTurn): MemoryFragment | null {
  const businessKeywords = ['revenue', 'growth', 'customer', 'market', 'team', 'product', 'strategy', 'business'];

  const isBusiness = businessKeywords.some((kw) => turn.transcript.toLowerCase().includes(kw)) || turn.domain === 'business';

  if (!isBusiness) {
    return null;
  }

  return {
    fragment_id: `mf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: turn.timestamp,
    content: `Business insight: ${turn.transcript.substring(0, 150)}`,
    source_turn_id: turn.turn_id,
    source_session_id: turn.session_id,
    domain: 'business',
    emotional_valence: 'neutral',
    involves_person: turn.transcript.toLowerCase().includes('team'),
    involves_decision: turn.intent.includes('decision') || turn.intent.includes('strategy'),
    involves_goal: false,
    importance_score: 75,
    consolidated: false,
  };
}

// ============================================================================
// MEMORY IMPORTANCE SCORING
// ============================================================================

/**
 * Calculate importance score for a memory fragment (0-100)
 */
export function scoreMemoryImportance(input: {
  fragment: MemoryFragment;
  time_since_capture_ms: number;
  recency_weight: number; // 0-0.3
  emotion_weight: number; // 0-0.3
  impact_weight: number; // 0-0.4
}): number {
  // Base importance from type
  let importance = input.fragment.importance_score;

  // Recency boost: recent memories slightly more important
  const daysSince = input.time_since_capture_ms / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0, 1 - daysSince / 30); // Decay over 30 days
  importance += recencyFactor * 20 * input.recency_weight;

  // Emotional boost: emotionally salient memories more important
  const emotionFactor =
    input.fragment.emotional_valence === 'positive' || input.fragment.emotional_valence === 'negative' ? 0.5 : 0;
  importance += emotionFactor * 30 * input.emotion_weight;

  // Impact boost: decision/goal memories more important
  const impactFactor = (input.fragment.involves_decision ? 0.3 : 0) + (input.fragment.involves_goal ? 0.4 : 0) + (input.fragment.involves_person ? 0.1 : 0);
  importance += impactFactor * 25 * input.impact_weight;

  return Math.min(100, Math.round(importance));
}

// ============================================================================
// MEMORY CONSOLIDATION
// ============================================================================

/**
 * Consolidate memory fragments into unified memory
 */
export function consolidateMemory(input: {
  fragments: MemoryFragment[];
  session: DialogueSessionState;
  workspace_id: string;
  recency_weight?: number;
  emotion_weight?: number;
  impact_weight?: number;
}): ConsolidatedMemory {
  const weightConfig = {
    recency_weight: input.recency_weight || 0.2,
    emotion_weight: input.emotion_weight || 0.2,
    impact_weight: input.impact_weight || 0.3,
  };

  // Score all fragments
  const now = Date.now();
  const scoredFragments = input.fragments.map((fragment) => ({
    ...fragment,
    importance_score: scoreMemoryImportance({
      fragment,
      time_since_capture_ms: now - new Date(fragment.timestamp).getTime(),
      ...weightConfig,
    }),
  }));

  // Sort by importance
  const sortedFragments = scoredFragments.sort((a, b) => b.importance_score - a.importance_score);

  // Filter high-importance fragments for consolidation
  const topFragments = sortedFragments.filter((f) => f.importance_score >= 50);

  // Aggregate metadata
  const domains = topFragments.map((f) => f.domain);
  const dominantDomain: MemoryDomain =
    (domains.reduce(
      (acc, d) => {
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) as any);

  const domainKey = Object.keys(dominantDomain).reduce((a, b) => (dominantDomain[a] > dominantDomain[b] ? a : b), 'personal');

  // Extract topic tags
  const allText = topFragments.map((f) => f.content.toLowerCase()).join(' ');
  const topicTags = extractTopicTags(allText);

  // Extract people and decisions
  const personMentions = extractPersonMentions(allText);
  const decisionPoints = topFragments.filter((f) => f.involves_decision).map((f) => f.content.substring(0, 80));
  const goalReferences = topFragments.filter((f) => f.involves_goal).map((f) => f.content.substring(0, 80));

  const averageImportance = topFragments.length > 0 ? Math.round(topFragments.reduce((sum, f) => sum + f.importance_score, 0) / topFragments.length) : 0;
  const peakImportance = topFragments.length > 0 ? Math.max(...topFragments.map((f) => f.importance_score)) : 0;

  return {
    memory_id: `cm_${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    fragments: topFragments,
    consolidated_fragment_count: topFragments.length,
    dominant_domain: domainKey as MemoryDomain,
    dominant_emotion: determinantDominantEmotion(topFragments),
    average_importance: averageImportance,
    peak_importance: peakImportance,
    sync_status: 'pending',
    person_mentions: personMentions,
    decision_points: decisionPoints,
    goal_references: goalReferences,
    topic_tags: topicTags,
    last_sync_at: new Date().toISOString(),
    requires_bidirectional_update: false,
  };
}

/**
 * Extract topic tags from consolidated memory text
 */
function extractTopicTags(text: string): string[] {
  const keywords = [
    { word: 'team', tag: 'team_management' },
    { word: 'revenue', tag: 'financial_metrics' },
    { word: 'growth', tag: 'business_growth' },
    { word: 'customer', tag: 'customer_focus' },
    { word: 'product', tag: 'product_development' },
    { word: 'strategy', tag: 'strategic_planning' },
    { word: 'market', tag: 'market_analysis' },
    { word: 'goal', tag: 'goal_setting' },
    { word: 'decision', tag: 'decision_making' },
    { word: 'health', tag: 'wellness' },
  ];

  const tags: string[] = [];
  for (const { word, tag } of keywords) {
    if (text.includes(word)) {
      tags.push(tag);
    }
  }

  return [...new Set(tags)]; // Deduplicate
}

/**
 * Extract people mentioned in memory
 */
function extractPersonMentions(text: string): string[] {
  // Simple extraction: words after "team" or "person" or possession pronouns
  const personPatterns = [/with (\w+)/gi, /my (\w+)/gi, /team member (\w+)/gi];

  const mentions: string[] = [];
  for (const pattern of personPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      mentions.push(match[1]);
    }
  }

  return [...new Set(mentions)]; // Deduplicate
}

/**
 * Determine dominant emotion from fragments
 */
function determinantDominantEmotion(fragments: MemoryFragment[]): MemoryEmotionalValence {
  const counts = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };

  for (const fragment of fragments) {
    counts[fragment.emotional_valence]++;
  }

  if (counts.positive > counts.negative && counts.positive > counts.neutral) {
return 'positive';
}
  if (counts.negative > counts.positive && counts.negative > counts.neutral) {
return 'negative';
}
  return 'neutral';
}

// ============================================================================
// BIDIRECTIONAL SYNC WITH UNIFIED MEMORY
// ============================================================================

export interface UnifiedMemorySync {
  // Sync Identity
  sync_id: string;
  timestamp: string;

  // Content
  consolidated_memory_id: string;
  unified_memory_id?: string; // ID in unified_agent_memory table

  // Direction
  direction: 'consolidation->unified' | 'unified->consolidation';
  sync_type: 'full' | 'incremental' | 'conflict_resolution';

  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message?: string;

  // Metadata
  fragments_synced: number;
  fields_updated: string[];
}

/**
 * Prepare memory for sync to unified_agent_memory table
 */
export function prepareForUnifiedSync(input: {
  consolidated_memory: ConsolidatedMemory;
  workspace_id: string;
  user_id: string;
}): UnifiedMemorySync {
  return {
    sync_id: `sync_${Date.now()}`,
    timestamp: new Date().toISOString(),
    consolidated_memory_id: input.consolidated_memory.memory_id,
    direction: 'consolidation->unified',
    sync_type: 'incremental',
    status: 'pending',
    fragments_synced: input.consolidated_memory.fragments.length,
    fields_updated: ['fragments', 'importance_scores', 'topic_tags', 'decision_points', 'goal_references'],
  };
}

/**
 * Handle bidirectional updates from unified_agent_memory
 * (for when long-term memory learns something new that affects short-term dialogue)
 */
export function handleBidirectionalUpdate(input: {
  unified_memory_id: string;
  updated_at: string;
  reason: string;
}): {
  should_update_cognitive_state: boolean;
  suggested_cognitive_adjustment?: string;
  trigger_dialogue_topic?: string;
} {
  // If unified memory was updated recently, we might need to:
  // 1. Update cognitive state (if critical insight discovered)
  // 2. Suggest dialogue adjustment (if context changed)
  // 3. Trigger new dialogue topic (if new goal discovered)

  return {
    should_update_cognitive_state: false, // Default: no update
    suggested_cognitive_adjustment: undefined,
    trigger_dialogue_topic: undefined,
  };
}

// ============================================================================
// MEMORY RETENTION & PRUNING
// ============================================================================

export interface MemoryRetentionPolicy {
  // Time-Based Retention
  min_retention_days: number; // Keep memory at least this long
  max_retention_days: number; // Prune after this long (unless high importance)
  high_importance_retention_days: number; // Keep high-importance memories longer

  // Importance-Based Retention
  minimum_importance_to_retain: number; // Score 0-100

  // Type-Based Overrides
  goal_memory_min_days: number;
  decision_memory_min_days: number;
  emotional_memory_min_days: number;
}

export const DEFAULT_MEMORY_RETENTION_POLICY: MemoryRetentionPolicy = {
  min_retention_days: 7,
  max_retention_days: 90,
  high_importance_retention_days: 180,
  minimum_importance_to_retain: 40,
  goal_memory_min_days: 180, // Goals kept 6 months
  decision_memory_min_days: 90, // Decisions kept 3 months
  emotional_memory_min_days: 30, // Emotions kept 1 month
};

/**
 * Prune old memories based on retention policy
 */
export function pruneMemoriesByRetentionPolicy(input: {
  fragments: MemoryFragment[];
  policy: MemoryRetentionPolicy;
}): {
  retained_fragments: MemoryFragment[];
  pruned_fragments: MemoryFragment[];
  summary: {
    total_before: number;
    total_after: number;
    total_pruned: number;
  };
} {
  const now = new Date();
  const retained: MemoryFragment[] = [];
  const pruned: MemoryFragment[] = [];

  for (const fragment of input.fragments) {
    const createdDate = new Date(fragment.timestamp);
    const ageMs = now.getTime() - createdDate.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // Determine retention threshold based on fragment type
    let retentionDays = input.policy.max_retention_days;

    if (fragment.involves_goal) {
      retentionDays = Math.max(retentionDays, input.policy.goal_memory_min_days);
    }
    if (fragment.involves_decision) {
      retentionDays = Math.max(retentionDays, input.policy.decision_memory_min_days);
    }
    if (fragment.emotional_valence !== 'neutral') {
      retentionDays = Math.max(retentionDays, input.policy.emotional_memory_min_days);
    }

    // High importance memories kept longer
    if (fragment.importance_score >= 80) {
      retentionDays = input.policy.high_importance_retention_days;
    }

    // Decide retention
    const shouldRetain = ageDays < input.policy.min_retention_days || (ageDays < retentionDays && fragment.importance_score >= input.policy.minimum_importance_to_retain);

    if (shouldRetain) {
      retained.push(fragment);
    } else {
      pruned.push(fragment);
    }
  }

  return {
    retained_fragments: retained,
    pruned_fragments: pruned,
    summary: {
      total_before: input.fragments.length,
      total_after: retained.length,
      total_pruned: pruned.length,
    },
  };
}
