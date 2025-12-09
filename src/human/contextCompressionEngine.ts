/**
 * Phase 11 – Context Compression Engine
 *
 * Converts micro-window voice transcripts into compressed context packets for cheap cloud reasoning.
 * - Event tagging (task, idea, reminder, advisor query)
 * - 8-domain classification (business, product, finance…)
 * - Priority scoring (internal triage)
 * - Summaries < 200 chars for low cost
 * - Phase 9 advisor-ready formatting
 *
 * Integration: Receives raw WakeWindowEvent from wakeWindowEngine
 * Output: CompressedContextPacket ready for microReasoningRouter
 * Cost target: <$0.001 per compression (token minimization)
 */

import type { WakeWindowEvent, ContextPacket } from './wakeWindowEngine';
import type { CognitiveState } from './cognitiveStateEngine';
import type { LifeSignal } from './lifeSignalIngestor';

// ============================================================================
// COMPRESSION TYPES
// ============================================================================

export type EventTag = 'task' | 'idea' | 'reminder' | 'advisor_query' | 'goal_update' | 'decision_needed' | 'status_check' | 'urgent_alert';

export type CompressionDomain =
  | 'business'
  | 'product'
  | 'finance'
  | 'operations'
  | 'marketing'
  | 'people'
  | 'personal_development'
  | 'strategic';

export interface CompressedContextPacket {
  // Identity & Metadata
  packet_id: string;
  timestamp: string;
  wake_window_id: string;

  // Compression Results
  event_tag: EventTag;
  domain: CompressionDomain;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Minimal Context (Ultra-Compressed)
  summary: string; // < 200 chars
  key_entities: string[]; // Names, projects, metrics mentioned
  implicit_action?: string; // What Phill implicitly wants to happen
  advisor_routing?: string; // Which advisor (business_advisor, etc.)

  // Cognitive Context (Phase 10 Integration)
  cognitive_state?: CognitiveState;
  energy_cost?: 'low' | 'medium' | 'high'; // Is this request suited to current state?

  // Reasoning Hints (For microReasoningRouter)
  complexity_level: 'simple' | 'moderate' | 'complex'; // Determines local vs. cloud
  requires_context?: boolean; // Needs historical data?
  multi_step?: boolean; // Is this multi-turn reasoning?

  // Quality Metrics
  confidence: number; // 0-1, compression quality confidence
  compression_ratio: number; // Original tokens / compressed tokens

  // Original Reference
  original_transcript: string;
  original_duration_ms: number;
}

export interface CompressionMetrics {
  total_events_processed: number;
  avg_compression_ratio: number;
  total_tokens_saved: number;
  by_domain: Record<CompressionDomain, { count: number; avg_ratio: number }>;
  by_tag: Record<EventTag, number>;
}

// ============================================================================
// DOMAIN CLASSIFICATION
// ============================================================================

const DOMAIN_KEYWORDS: Record<CompressionDomain, string[]> = {
  business: ['revenue', 'sales', 'customer', 'market', 'deal', 'contract', 'partnership', 'acquisition'],
  product: ['feature', 'build', 'design', 'user experience', 'roadmap', 'release', 'iteration', 'prototype'],
  finance: ['budget', 'cost', 'profit', 'margin', 'investment', 'burn rate', 'runway', 'pricing'],
  operations: ['process', 'workflow', 'system', 'efficiency', 'automation', 'tool', 'integration', 'infrastructure'],
  marketing: ['campaign', 'content', 'messaging', 'brand', 'positioning', 'launch', 'social', 'reach'],
  people: ['team', 'hiring', 'compensation', 'culture', 'feedback', 'retention', 'engagement', 'morale'],
  personal_development: ['learning', 'skill', 'growth', 'habit', 'health', 'balance', 'wellbeing', 'goal'],
  strategic: ['vision', 'strategy', 'direction', 'pivot', 'opportunity', 'threat', 'innovation', 'partnership'],
};

/**
 * Classify transcript into compression domain
 */
function classifyDomain(transcript: string): CompressionDomain {
  const lowerTranscript = transcript.toLowerCase();
  const scores: Record<CompressionDomain, number> = {
    business: 0,
    product: 0,
    finance: 0,
    operations: 0,
    marketing: 0,
    people: 0,
    personal_development: 0,
    strategic: 0,
  };

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerTranscript.includes(keyword)) {
        scores[domain as CompressionDomain]++;
      }
    }
  }

  const sortedDomains = Object.entries(scores).sort(([, a], [, b]) => b - a);
  return (sortedDomains[0]?.[0] as CompressionDomain) || 'business';
}

// ============================================================================
// EVENT TAGGING
// ============================================================================

const EVENT_TAG_PATTERNS: Record<EventTag, string[]> = {
  task: ['remind', 'schedule', 'email', 'send', 'reach out', 'follow up', 'action item'],
  idea: ['idea', 'thought', 'consider', 'think about', 'maybe', 'what if', 'explore'],
  reminder: ['reminder', 'don\'t forget', 'alert', 'notification', 'urgent', 'asap'],
  advisor_query: ['what', 'how', 'should', 'opinion', 'advice', 'thoughts', 'recommendation'],
  goal_update: ['goal', 'okr', 'milestone', 'target', 'progress', 'achieve', 'accomplish'],
  decision_needed: ['decide', 'choice', 'option', 'dilemma', 'tradeoff', 'alternative'],
  status_check: ['status', 'update', 'check', 'how are', 'progress', 'where are we'],
  urgent_alert: ['urgent', 'critical', 'emergency', 'asap', 'right now', 'immediately'],
};

/**
 * Detect primary event tag from transcript
 */
function detectEventTag(transcript: string): EventTag {
  const lowerTranscript = transcript.toLowerCase();
  const scores: Record<EventTag, number> = {
    task: 0,
    idea: 0,
    reminder: 0,
    advisor_query: 0,
    goal_update: 0,
    decision_needed: 0,
    status_check: 0,
    urgent_alert: 0,
  };

  // Check for urgent patterns first (highest priority)
  for (const pattern of EVENT_TAG_PATTERNS.urgent_alert) {
    if (lowerTranscript.includes(pattern)) {
      return 'urgent_alert';
    }
  }

  // Check other patterns
  for (const [tag, patterns] of Object.entries(EVENT_TAG_PATTERNS)) {
    if (tag === 'urgent_alert') {
continue;
}

    for (const pattern of patterns) {
      if (lowerTranscript.includes(pattern)) {
        scores[tag as EventTag]++;
      }
    }
  }

  const sortedTags = Object.entries(scores).sort(([, a], [, b]) => b - a);
  return (sortedTags[0]?.[0] as EventTag) || 'advisor_query';
}

// ============================================================================
// PRIORITY SCORING
// ============================================================================

/**
 * Score priority based on content signals
 */
function scorePriority(transcript: string, eventTag: EventTag): 'low' | 'medium' | 'high' | 'critical' {
  const lowerTranscript = transcript.toLowerCase();

  // Critical indicators
  const criticalWords = ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'right now', 'down', 'broken', 'failed'];
  if (criticalWords.some((word) => lowerTranscript.includes(word))) {
    return 'critical';
  }

  // High priority by tag
  if (eventTag === 'urgent_alert' || eventTag === 'reminder') {
    return 'high';
  }

  // High priority by urgency markers
  const highWords = ['important', 'soon', 'this week', 'deadline', 'decision needed', 'needed', 'need to'];
  if (highWords.some((word) => lowerTranscript.includes(word))) {
    return 'high';
  }

  // Medium priority
  if (eventTag === 'task' || eventTag === 'decision_needed') {
    return 'medium';
  }

  // Low priority for ideas and status checks
  if (eventTag === 'idea' || eventTag === 'status_check') {
    return 'low';
  }

  return 'medium';
}

// ============================================================================
// ENTITY EXTRACTION
// ============================================================================

/**
 * Extract key entities (names, projects, metrics) from transcript
 */
function extractKeyEntities(transcript: string): string[] {
  const entities: string[] = [];

  // Pattern: Capitalized words (names, project names)
  const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const matches = transcript.match(capitalizedPattern);
  if (matches) {
    entities.push(...matches.slice(0, 3)); // Top 3 entities
  }

  // Pattern: Metrics (e.g., "50%", "$100k", "500 users")
  const metricPattern = /\$?[\d.]+[kMB%]?|\d+\s+(percent|users|contacts|leads)/gi;
  const metricMatches = transcript.match(metricPattern);
  if (metricMatches) {
    entities.push(...metricMatches.slice(0, 2)); // Top 2 metrics
  }

  // Remove duplicates and limit
  return Array.from(new Set(entities)).slice(0, 5);
}

// ============================================================================
// IMPLICIT ACTION EXTRACTION
// ============================================================================

/**
 * Infer what Phill implicitly wants to happen
 */
function inferImplicitAction(transcript: string, eventTag: EventTag): string | undefined {
  const lowerTranscript = transcript.toLowerCase();

  // Task patterns
  if (eventTag === 'task') {
    if (lowerTranscript.includes('email')) {
return 'Draft and review email';
}
    if (lowerTranscript.includes('schedule')) {
return 'Add to calendar';
}
    if (lowerTranscript.includes('remind')) {
return 'Set reminder';
}
  }

  // Advisor query patterns
  if (eventTag === 'advisor_query') {
    if (lowerTranscript.includes('should')) {
return 'Request decision guidance';
}
    if (lowerTranscript.includes('how')) {
return 'Request process guidance';
}
    if (lowerTranscript.includes('what')) {
return 'Request information or analysis';
}
  }

  // Goal update patterns
  if (eventTag === 'goal_update') {
    if (lowerTranscript.includes('progress')) {
return 'Update goal progress';
}
    if (lowerTranscript.includes('achieve')) {
return 'Record goal completion';
}
  }

  // Idea patterns
  if (eventTag === 'idea') {
    return 'Capture for later evaluation';
  }

  return undefined;
}

// ============================================================================
// ADVISOR ROUTING
// ============================================================================

const DOMAIN_TO_ADVISOR: Record<CompressionDomain, string> = {
  business: 'business_advisor',
  product: 'product_advisor',
  finance: 'financial_advisor',
  operations: 'ops_advisor',
  marketing: 'marketing_advisor',
  people: 'people_advisor',
  personal_development: 'personal_advisor',
  strategic: 'strategic_advisor',
};

// ============================================================================
// COMPLEXITY DETECTION
// ============================================================================

/**
 * Determine if this requires local simple reasoning or cloud complex reasoning
 */
function detectComplexity(transcript: string, domain: CompressionDomain): 'simple' | 'moderate' | 'complex' {
  const wordCount = transcript.split(/\s+/).length;
  const lowerTranscript = transcript.toLowerCase();

  // Complex indicators
  const complexWords = ['analyze', 'forecast', 'strategy', 'compare', 'model', 'simulate', 'predict', 'calculate'];
  if (complexWords.some((word) => lowerTranscript.includes(word))) {
    return 'complex';
  }

  // Word count heuristic
  if (wordCount > 50) {
    return 'complex';
  }

  // Strategic and finance domains often complex
  if (domain === 'strategic' || domain === 'finance') {
    return 'moderate';
  }

  // Simple: short, straightforward requests
  if (wordCount < 15) {
    return 'simple';
  }

  return 'moderate';
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

/**
 * Generate ultra-compressed summary (<200 chars)
 */
function generateCompressedSummary(transcript: string, eventTag: EventTag, domain: CompressionDomain): string {
  // Start with action or intent
  const action = inferImplicitAction(transcript, eventTag) || eventTag.replace(/_/g, ' ');

  // Extract 1-2 key phrases from transcript
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim());
  const firstSentence = sentences[0]?.trim() || '';

  // Truncate to ~150-180 chars, leaving room for metadata
  let summary = `${action.charAt(0).toUpperCase() + action.slice(1)}: ${firstSentence}`;

  if (summary.length > 200) {
    summary = summary.substring(0, 197) + '...';
  }

  return summary;
}

// ============================================================================
// MAIN COMPRESSION FUNCTION
// ============================================================================

/**
 * Compress a WakeWindowEvent into a CompressedContextPacket
 */
export function compressWakeWindowEvent(
  wakeEvent: WakeWindowEvent,
  cognitiveState?: CognitiveState
): CompressedContextPacket {
  const startTime = Date.now();

  const eventTag = detectEventTag(wakeEvent.transcript);
  const domain = classifyDomain(wakeEvent.transcript);
  const priority = scorePriority(wakeEvent.transcript, eventTag);
  const keyEntities = extractKeyEntities(wakeEvent.transcript);
  const implicitAction = inferImplicitAction(wakeEvent.transcript, eventTag);
  const summary = generateCompressedSummary(wakeEvent.transcript, eventTag, domain);
  const complexity = detectComplexity(wakeEvent.transcript, domain);

  // Estimate energy cost from cognitive state
  const energyCost: 'low' | 'medium' | 'high' = complexity === 'simple' ? 'low' : complexity === 'moderate' ? 'medium' : 'high';

  // Calculate compression ratio (rough estimate)
  const originalTokens = Math.ceil(wakeEvent.transcript.length / 4); // ~4 chars per token
  const compressedTokens = Math.ceil(summary.length / 4) + keyEntities.join('').length / 4;
  const compressionRatio = originalTokens / Math.max(compressedTokens, 1);

  // Confidence: lower for complex, higher for simple
  const confidence = complexity === 'simple' ? 0.95 : complexity === 'moderate' ? 0.85 : 0.75;

  return {
    packet_id: `ccp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    wake_window_id: wakeEvent.id,
    event_tag: eventTag,
    domain,
    priority,
    summary,
    key_entities: keyEntities,
    implicit_action: implicitAction,
    advisor_routing: DOMAIN_TO_ADVISOR[domain],
    cognitive_state: cognitiveState,
    energy_cost: energyCost,
    complexity_level: complexity,
    requires_context: eventTag === 'advisor_query' || domain === 'strategic',
    multi_step: complexity === 'complex',
    confidence,
    compression_ratio: compressionRatio,
    original_transcript: wakeEvent.transcript,
    original_duration_ms: wakeEvent.audio_duration_ms,
  };
}

// ============================================================================
// BATCH COMPRESSION
// ============================================================================

/**
 * Compress multiple events and calculate metrics
 */
export function compressBatch(
  events: WakeWindowEvent[],
  cognitiveState?: CognitiveState
): {
  compressed_packets: CompressedContextPacket[];
  metrics: CompressionMetrics;
} {
  const compressed_packets: CompressedContextPacket[] = [];
  const metrics: CompressionMetrics = {
    total_events_processed: events.length,
    avg_compression_ratio: 0,
    total_tokens_saved: 0,
    by_domain: {
      business: { count: 0, avg_ratio: 0 },
      product: { count: 0, avg_ratio: 0 },
      finance: { count: 0, avg_ratio: 0 },
      operations: { count: 0, avg_ratio: 0 },
      marketing: { count: 0, avg_ratio: 0 },
      people: { count: 0, avg_ratio: 0 },
      personal_development: { count: 0, avg_ratio: 0 },
      strategic: { count: 0, avg_ratio: 0 },
    },
    by_tag: {
      task: 0,
      idea: 0,
      reminder: 0,
      advisor_query: 0,
      goal_update: 0,
      decision_needed: 0,
      status_check: 0,
      urgent_alert: 0,
    },
  };

  for (const event of events) {
    const packet = compressWakeWindowEvent(event, cognitiveState);
    compressed_packets.push(packet);

    // Update metrics
    metrics.by_domain[packet.domain].count++;
    metrics.by_domain[packet.domain].avg_ratio += packet.compression_ratio;
    metrics.by_tag[packet.event_tag]++;

    const originalTokens = Math.ceil(packet.original_transcript.length / 4);
    const compressedTokens = Math.ceil(packet.summary.length / 4);
    metrics.total_tokens_saved += Math.max(0, originalTokens - compressedTokens);
  }

  // Finalize domain metrics
  for (const domain of Object.keys(metrics.by_domain) as CompressionDomain[]) {
    const domainCount = metrics.by_domain[domain].count;
    if (domainCount > 0) {
      metrics.by_domain[domain].avg_ratio /= domainCount;
    }
  }

  // Calculate overall compression ratio
  metrics.avg_compression_ratio =
    compressed_packets.length > 0 ? compressed_packets.reduce((sum, p) => sum + p.compression_ratio, 0) / compressed_packets.length : 0;

  return {
    compressed_packets,
    metrics,
  };
}

// ============================================================================
// QUERY & FILTERING
// ============================================================================

/**
 * Filter compressed packets by criteria
 */
export function filterCompressedPackets(
  packets: CompressedContextPacket[],
  filters: {
    domain?: CompressionDomain;
    priority?: string;
    eventTag?: EventTag;
    minimumConfidence?: number;
  }
): CompressedContextPacket[] {
  return packets.filter((packet) => {
    if (filters.domain && packet.domain !== filters.domain) {
return false;
}
    if (filters.priority && packet.priority !== filters.priority) {
return false;
}
    if (filters.eventTag && packet.event_tag !== filters.eventTag) {
return false;
}
    if (filters.minimumConfidence && packet.confidence < filters.minimumConfidence) {
return false;
}
    return true;
  });
}

/**
 * Get high-priority packets for immediate routing
 */
export function getHighPriorityPackets(packets: CompressedContextPacket[]): CompressedContextPacket[] {
  return filterCompressedPackets(packets, {
    priority: 'critical',
    minimumConfidence: 0.7,
  }).concat(
    filterCompressedPackets(packets, {
      priority: 'high',
      minimumConfidence: 0.8,
    })
  );
}
