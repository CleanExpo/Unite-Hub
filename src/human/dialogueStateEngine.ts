/**
 * Phase 12 – Dialogue State Engine
 *
 * Tracks conversation state, context, memory fragments, turn-taking, and timing windows.
 * - Short-term conversational memory (last 5-10 turns)
 * - Emotion + tone recognition from user input
 * - Natural dialogue turn pacing (variable timing)
 * - Interrupt handling (user over-speak detection)
 * - Phase 10 cognitive state integration
 * - Phase 8 safety boundaries
 *
 * Integration: Receives user transcript from wake-window
 * Feeds: voicePersonaEngine (how to respond), realtimeDialogueOrchestrator (timing)
 * Output: DialogueTurn with context + state + memory fragments
 * Memory window: Last 5 turns + 30-second rolling context
 */

import type { CognitiveState } from './cognitiveStateEngine';

// ============================================================================
// DIALOGUE STATE TYPES
// ============================================================================

export type UserEmotion = 'calm' | 'engaged' | 'curious' | 'frustrated' | 'urgent' | 'confused';

export type AssistantTone = 'casual' | 'clarifying' | 'advising' | 'urgent' | 'warm' | 'precise';

export interface DialogueTurn {
  // Turn Identity
  turn_id: string;
  timestamp: string;
  session_id: string;

  // Speaker Info
  speaker: 'user' | 'assistant';
  transcript: string;

  // User Emotional State
  user_emotion: UserEmotion;
  user_energy_level: 'low' | 'normal' | 'high'; // From tone analysis
  user_confidence: number; // 0-1, how confident they sound

  // Assistant Context
  assistant_tone: AssistantTone;
  context_used: string[]; // Which memory/context was referenced
  confidence: number; // 0-1, response confidence

  // Timing
  latency_ms: number;
  pacing_ms: number; // How fast/slow to speak response
  natural_pause_ms?: number; // Before responding (human-like delay)

  // Safety & Governance
  safety_status: 'safe' | 'flagged' | 'blocked';
  requires_approval?: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';

  // Memory Integration
  captured_memories?: string[]; // Memory fragments to consolidate
  references_long_term?: boolean; // Used long-term memory in this turn

  // Metadata
  domain: string;
  intent: string;
}

export interface DialogueSessionState {
  // Session Identity
  session_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  is_active: boolean;

  // Current Context
  current_turn: number;
  last_user_turn_time: string;
  last_assistant_turn_time: string;

  // Session Cognitive State (from Phase 10)
  cognitive_state: CognitiveState;
  energy_level: number; // 0-100 aggregate

  // Conversation Flow
  topic_stack: string[]; // Current + previous topics
  dialogue_history: DialogueTurn[]; // Last 5-10 turns
  short_term_context: string[]; // 30-second rolling context
  interrupts_detected: number;
  backtrack_requests: number;

  // Emotional Arc
  user_sentiment_trend: 'improving' | 'stable' | 'declining';
  user_frustration_level: number; // 0-100

  // Metadata
  glasses_model?: string;
  active_advisor_type?: string;
  phase8_violations: number;
}

// ============================================================================
// EMOTION DETECTION
// ============================================================================

const EMOTION_KEYWORDS: Record<UserEmotion, string[]> = {
  calm: ['okay', 'fine', 'sure', 'understood', 'got it', 'thanks'],
  engaged: ['definitely', 'absolutely', 'love that', 'let\'s', 'excited', 'tell me more'],
  curious: ['why', 'how', 'what if', 'interesting', 'tell me', 'explain'],
  frustrated: ['ugh', 'argh', 'why doesn\'t', 'this is', 'never works', 'again'],
  urgent: ['asap', 'urgent', 'now', 'immediately', 'critical', 'emergency'],
  confused: ['what', 'huh', 'i don\'t', 'didn\'t understand', 'again', 'repeat'],
};

/**
 * Detect user emotion from transcript
 */
export function detectUserEmotion(transcript: string): UserEmotion {
  const lowerTranscript = transcript.toLowerCase();

  // Check for urgent markers first
  for (const word of EMOTION_KEYWORDS.urgent) {
    if (lowerTranscript.includes(word)) return 'urgent';
  }

  // Check frustration (negative markers)
  for (const word of EMOTION_KEYWORDS.frustrated) {
    if (lowerTranscript.includes(word)) return 'frustrated';
  }

  // Check confusion
  for (const word of EMOTION_KEYWORDS.confused) {
    if (lowerTranscript.includes(word)) return 'confused';
  }

  // Check curiosity
  for (const word of EMOTION_KEYWORDS.curious) {
    if (lowerTranscript.includes(word)) return 'curious';
  }

  // Check engagement
  for (const word of EMOTION_KEYWORDS.engaged) {
    if (lowerTranscript.includes(word)) return 'engaged';
  }

  // Default: calm
  return 'calm';
}

/**
 * Analyze user energy level from tone/pace
 */
export function analyzeUserEnergyLevel(transcript: string): 'low' | 'normal' | 'high' {
  const wordCount = transcript.split(/\s+/).length;

  // Very short responses → low energy or confusion
  if (wordCount <= 3) return 'low';

  // Very long or intense responses → high energy
  if (wordCount > 30) return 'high';

  // Check for all-caps (high energy indicator)
  const capsWords = (transcript.match(/[A-Z]{2,}/g) || []).length;
  if (capsWords > 2) return 'high';

  // Normal
  return 'normal';
}

/**
 * Analyze user confidence from markers
 */
export function analyzeUserConfidence(transcript: string): number {
  const lowerTranscript = transcript.toLowerCase();

  const uncertainMarkers = ['maybe', 'i think', 'probably', 'unsure', 'not sure', 'i guess'];
  const uncertainCount = uncertainMarkers.filter((m) => lowerTranscript.includes(m)).length;

  const confidentMarkers = ['definitely', 'certainly', 'absolutely', 'clear', 'sure'];
  const confidentCount = confidentMarkers.filter((m) => lowerTranscript.includes(m)).length;

  // Base confidence: 0.7 (neutral)
  let confidence = 0.7;

  // Adjust for markers
  confidence -= uncertainCount * 0.15;
  confidence += confidentCount * 0.15;

  return Math.max(0, Math.min(1, confidence));
}

// ============================================================================
// DIALOGUE TURN CREATION
// ============================================================================

/**
 * Create a dialogue turn from user input
 */
export function createUserTurn(input: {
  session_id: string;
  transcript: string;
  domain: string;
  intent: string;
}): DialogueTurn {
  const emotion = detectUserEmotion(input.transcript);
  const energyLevel = analyzeUserEnergyLevel(input.transcript);
  const confidence = analyzeUserConfidence(input.transcript);

  return {
    turn_id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    session_id: input.session_id,
    speaker: 'user',
    transcript: input.transcript,
    user_emotion: emotion,
    user_energy_level: energyLevel,
    user_confidence: confidence,
    assistant_tone: 'casual',
    context_used: [],
    confidence: 0,
    latency_ms: 0,
    pacing_ms: 0,
    safety_status: 'safe',
    risk_level: 'low',
    domain: input.domain,
    intent: input.intent,
  };
}

/**
 * Create an assistant turn with response
 */
export function createAssistantTurn(input: {
  session_id: string;
  user_turn: DialogueTurn;
  response_text: string;
  tone: AssistantTone;
  latency_ms: number;
  confidence: number;
  context_used?: string[];
  safety_status?: 'safe' | 'flagged' | 'blocked';
  captured_memories?: string[];
}): DialogueTurn {
  // Natural pause: 200-500ms (human-like delay)
  const naturalPause = 200 + Math.random() * 300;

  // Pacing: adjust based on user energy and tone
  let pacing = 150; // Base: 150ms per word
  if (input.user_turn.user_energy_level === 'high') {
    pacing = 100; // Faster response for high-energy
  } else if (input.tone === 'urgent') {
    pacing = 100; // Faster for urgent
  } else if (input.tone === 'warm' || input.tone === 'casual') {
    pacing = 150; // Normal pace for casual
  }

  return {
    turn_id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    session_id: input.session_id,
    speaker: 'assistant',
    transcript: input.response_text,
    user_emotion: input.user_turn.user_emotion,
    user_energy_level: input.user_turn.user_energy_level,
    user_confidence: input.user_turn.user_confidence,
    assistant_tone: input.tone,
    context_used: input.context_used || [],
    confidence: input.confidence,
    latency_ms: input.latency_ms,
    pacing_ms: pacing,
    natural_pause_ms: naturalPause,
    safety_status: input.safety_status || 'safe',
    risk_level: 'low',
    captured_memories: input.captured_memories,
    domain: input.user_turn.domain,
    intent: input.user_turn.intent,
  };
}

// ============================================================================
// SESSION STATE MANAGEMENT
// ============================================================================

/**
 * Initialize a new dialogue session
 */
export function initializeDialogueSession(input: {
  session_id: string;
  cognitive_state: CognitiveState;
  glasses_model?: string;
}): DialogueSessionState {
  return {
    session_id: input.session_id,
    started_at: new Date().toISOString(),
    is_active: true,
    current_turn: 0,
    last_user_turn_time: new Date().toISOString(),
    last_assistant_turn_time: new Date().toISOString(),
    cognitive_state: input.cognitive_state,
    energy_level: 70, // Default: 70/100
    topic_stack: [],
    dialogue_history: [],
    short_term_context: [],
    interrupts_detected: 0,
    backtrack_requests: 0,
    user_sentiment_trend: 'stable',
    user_frustration_level: 0,
    glasses_model: input.glasses_model,
    phase8_violations: 0,
  };
}

/**
 * Update session after user turn
 */
export function updateSessionAfterUserTurn(
  session: DialogueSessionState,
  userTurn: DialogueTurn
): DialogueSessionState {
  // Add to history (keep last 10 turns)
  const updated = {
    ...session,
    current_turn: session.current_turn + 1,
    last_user_turn_time: userTurn.timestamp,
    dialogue_history: [...session.dialogue_history, userTurn].slice(-10),
    short_term_context: [...session.short_term_context, userTurn.transcript].slice(-5),
  };

  // Update frustration level based on emotion
  if (userTurn.user_emotion === 'frustrated') {
    updated.user_frustration_level = Math.min(100, updated.user_frustration_level + 20);
  } else if (userTurn.user_emotion === 'calm' || userTurn.user_emotion === 'engaged') {
    updated.user_frustration_level = Math.max(0, updated.user_frustration_level - 10);
  }

  // Update sentiment trend
  if (updated.user_frustration_level >= 70) {
    updated.user_sentiment_trend = 'declining';
  } else if (updated.user_frustration_level <= 20) {
    updated.user_sentiment_trend = 'improving';
  } else {
    updated.user_sentiment_trend = 'stable';
  }

  // Update energy level (average of recent turns)
  const recentEmotions = updated.dialogue_history
    .filter((t) => t.speaker === 'user')
    .slice(-3)
    .map((t) => {
      if (t.user_energy_level === 'low') return 30;
      if (t.user_energy_level === 'high') return 80;
      return 60;
    });

  if (recentEmotions.length > 0) {
    updated.energy_level = Math.round(recentEmotions.reduce((a, b) => a + b, 0) / recentEmotions.length);
  }

  return updated;
}

/**
 * Update session after assistant turn
 */
export function updateSessionAfterAssistantTurn(
  session: DialogueSessionState,
  assistantTurn: DialogueTurn
): DialogueSessionState {
  return {
    ...session,
    last_assistant_turn_time: assistantTurn.timestamp,
    dialogue_history: [...session.dialogue_history, assistantTurn].slice(-10),
  };
}

// ============================================================================
// CONTEXT MANAGEMENT
// ============================================================================

/**
 * Get short-term context (last 30 seconds of conversation)
 */
export function getShortTermContext(session: DialogueSessionState): string {
  return session.short_term_context.join(' | ');
}

/**
 * Extract memory fragments from dialogue turn
 */
export function extractMemoryFragments(turn: DialogueTurn, session: DialogueSessionState): string[] {
  const fragments: string[] = [];

  // Extract facts about Phill's state
  if (turn.speaker === 'user' && turn.user_emotion === 'frustrated') {
    fragments.push(`Phill felt frustrated about: ${turn.transcript.substring(0, 50)}`);
  }

  // Extract decisions made
  if (turn.intent.includes('decision') || turn.intent.includes('choice')) {
    fragments.push(`Decision made: ${turn.transcript.substring(0, 100)}`);
  }

  // Extract goals mentioned
  if (turn.domain.includes('goal') || turn.domain.includes('strategic')) {
    fragments.push(`Goal referenced: ${turn.transcript.substring(0, 100)}`);
  }

  // Extract emotional learnings
  if (turn.user_emotion === 'engaged' && turn.speaker === 'user') {
    fragments.push(`Phill engaged about: ${turn.transcript.substring(0, 50)}`);
  }

  return fragments;
}

// ============================================================================
// INTERRUPT & BACKTRACK DETECTION
// ============================================================================

/**
 * Detect if user is interrupting (over-speaking)
 */
export function detectInterrupt(
  currentUserTranscript: string,
  lastAssistantTurn: DialogueTurn,
  timeSinceAssistantStart: number
): boolean {
  // If user speaks before assistant finishes (within 1 second), it's an interrupt
  const wordCount = lastAssistantTurn.transcript.split(/\s+/).length;
  const estimatedSpeechTime = wordCount * (lastAssistantTurn.pacing_ms || 150);

  // User interrupted if they spoke within the estimated speech window
  if (timeSinceAssistantStart < estimatedSpeechTime + 500) {
    return true;
  }

  return false;
}

/**
 * Detect if user is asking for backtrack (clarification, repeat, correction)
 */
export function detectBacktrackRequest(transcript: string): boolean {
  const backtrackMarkers = ['wait', 'hold on', 'actually', 'no wait', 'repeat that', 'what did you say', 'i didn\'t', 'can you repeat', 'back up'];

  const lowerTranscript = transcript.toLowerCase();
  return backtrackMarkers.some((marker) => lowerTranscript.includes(marker));
}

// ============================================================================
// SESSION COMPLETION
// ============================================================================

/**
 * End dialogue session
 */
export function endDialogueSession(session: DialogueSessionState): DialogueSessionState {
  const startTime = new Date(session.started_at).getTime();
  const endTime = Date.now();
  const durationSeconds = Math.round((endTime - startTime) / 1000);

  return {
    ...session,
    is_active: false,
    ended_at: new Date().toISOString(),
    duration_seconds: durationSeconds,
  };
}

/**
 * Get session summary for logging
 */
export function getSessionSummary(session: DialogueSessionState): {
  total_turns: number;
  user_turns: number;
  assistant_turns: number;
  avg_latency_ms: number;
  user_sentiment: 'improving' | 'stable' | 'declining';
  interrupts: number;
  safety_violations: number;
} {
  const allTurns = session.dialogue_history;
  const userTurns = allTurns.filter((t) => t.speaker === 'user');
  const assistantTurns = allTurns.filter((t) => t.speaker === 'assistant');

  const avgLatency = assistantTurns.length > 0 ? Math.round(assistantTurns.reduce((sum, t) => sum + t.latency_ms, 0) / assistantTurns.length) : 0;

  return {
    total_turns: allTurns.length,
    user_turns: userTurns.length,
    assistant_turns: assistantTurns.length,
    avg_latency_ms: avgLatency,
    user_sentiment: session.user_sentiment_trend,
    interrupts: session.interrupts_detected,
    safety_violations: session.phase8_violations,
  };
}
