/**
 * Phase 12 – Real-Time Dialogue Orchestrator
 *
 * Main loop that ties together wake windows, dialogue state, persona, advisor output,
 * and glasses bridge into a single conversational flow.
 *
 * - Start new dialogue sessions when wakeWindowEngine fires with advisor intent
 * - Use dialogueStateEngine for turn tracking, short-term memory, session summary
 * - Call personalAdvisor/businessBrain for reasoning via realTimeAdvisorBridge
 * - Select tone and style via voicePersonaEngine (calm, strategic, structured)
 * - Deliver outputs to glassesRealtimeBridge and/or iPhone speaker
 * - Support interrupt handling (user talks over response)
 * - Log each turn into in-memory buffer and DB
 *
 * Integration: Receives compressed packets from Phase 11 wake-window pipeline
 * Output: Real-time speech + glasses output + session logs
 * Latency target: <2 seconds user → speech start
 */

import type { CompressedContextPacket } from './contextCompressionEngine';
import type { RoutingDecision } from './microReasoningRouter';
import type { AdvisorResponse } from './realTimeAdvisorBridge';
import type { DialogueSessionState, DialogueTurn, UserEmotion } from './dialogueStateEngine';
import type { PersonalizedResponse } from './voicePersonaEngine';
import type { GlassesSession, GlassesOutput } from './glassesRealtimeBridge';
import type { CognitiveState } from './cognitiveStateEngine';

// ============================================================================
// DIALOGUE SESSION TYPES
// ============================================================================

export interface DialogueOrchestrationConfig {
  // Persona Mode
  persona_mode: 'calm_strategic_advisor' | 'energetic_executor' | 'precise_analyst';

  // Interaction Parameters
  max_turn_duration_ms: number; // How long to wait for user response
  interrupt_detection_enabled: boolean;
  backtrack_support_enabled: boolean;
  memory_consolidation_enabled: boolean;

  // Output Routing
  output_targets: ('glasses' | 'speaker' | 'haptic')[];
  glasses_model?: 'ray_ban_meta' | 'solos' | 'xreal' | 'viture' | 'android_xr';

  // Safety & Governance
  require_safety_filter: boolean;
  phase8_enabled: boolean;
  log_all_turns: boolean;
}

export interface DialogueInteraction {
  // Flow Identity
  interaction_id: string;
  timestamp: string;
  session_id: string;

  // Input
  user_turn: DialogueTurn;

  // Processing
  compressed_packet: CompressedContextPacket;
  routing_decision: RoutingDecision;
  advisor_response?: AdvisorResponse;

  // Output
  assistant_turn: DialogueTurn;
  personalized_response: PersonalizedResponse;
  glasses_output?: GlassesOutput;

  // Timing
  total_latency_ms: number;
  components: {
    compression_ms: number;
    routing_ms: number;
    advisor_ms: number;
    persona_ms: number;
    safety_ms: number;
    output_ms: number;
  };

  // Status
  success: boolean;
  safety_status: 'safe' | 'flagged' | 'blocked';
  interrupted: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_CONFIG: DialogueOrchestrationConfig = {
  persona_mode: 'calm_strategic_advisor',
  max_turn_duration_ms: 8000, // 8 seconds to wait for next user input
  interrupt_detection_enabled: true,
  backtrack_support_enabled: true,
  memory_consolidation_enabled: true,
  output_targets: ['glasses', 'speaker'],
  require_safety_filter: true,
  phase8_enabled: true,
  log_all_turns: true,
};

// ============================================================================
// SESSION INITIALIZATION
// ============================================================================

/**
 * Start a new dialogue session from wake-window event
 */
export function initiateDialogueSession(input: {
  compressed_packet: CompressedContextPacket;
  cognitive_state: CognitiveState;
  glasses_model?: string;
  config: DialogueOrchestrationConfig;
}): {
  session_id: string;
  session_state: DialogueSessionState;
  config: DialogueOrchestrationConfig;
} {
  const { initializeDialogueSession } = require('./dialogueStateEngine');

  const session_id = `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const session_state = initializeDialogueSession({
    session_id,
    cognitive_state: input.cognitive_state,
    glasses_model: input.glasses_model,
  });

  return {
    session_id,
    session_state,
    config: input.config,
  };
}

// ============================================================================
// MAIN DIALOGUE LOOP
// ============================================================================

/**
 * Process a single user input through the complete dialogue pipeline
 */
export async function processDialogueInteraction(input: {
  user_transcript: string;
  session: DialogueSessionState;
  compressed_packet: CompressedContextPacket;
  routing_decision: RoutingDecision;
  config: DialogueOrchestrationConfig;
  glasses_session?: GlassesSession;
}): Promise<DialogueInteraction> {
  const startTime = Date.now();
  const timings: Record<string, number> = {};

  // Step 1: Create user turn
  const {
    createUserTurn,
    updateSessionAfterUserTurn,
  } = require('./dialogueStateEngine');

  const userTurn = createUserTurn({
    session_id: input.session.session_id,
    transcript: input.user_transcript,
    domain: input.compressed_packet.domain,
    intent: input.compressed_packet.event_tag,
  });

  const compressionStart = Date.now();
  const updatedSession = updateSessionAfterUserTurn(input.session, userTurn);
  timings.compression_ms = Date.now() - compressionStart;

  // Step 2: Advisor response (if routing to cloud/advisor)
  let advisorResponse: AdvisorResponse | undefined;
  const routingStart = Date.now();

  if (input.routing_decision.primary_engine !== 'local_intent') {
    // Would call generateAdvisorResponse from realTimeAdvisorBridge
    // For now: mock response
    advisorResponse = {
      response_id: `ar_${Date.now()}`,
      timestamp: new Date().toISOString(),
      packet_id: input.compressed_packet.packet_id,
      advisor_type: (input.compressed_packet.advisor_routing || 'business_advisor') as any,
      advice_type: 'immediate_action',
      primary_recommendation: `I can help with ${input.compressed_packet.domain}. Here's what I suggest...`,
      supporting_reasoning: 'Based on your current state and goals.',
      confidence: 0.85,
      immediate_actions: ['Action 1', 'Action 2'],
      considers_cognitive_state: true,
      considers_life_signals: false,
      considers_business_metrics: false,
      considers_autonomy_policy: true,
      suggested_execution_time: 'immediate',
      reason_for_timing: 'Current state is suitable.',
      risk_level: 'low',
      requires_founder_approval: false,
      advisor_confidence: 0.85,
      can_execute_autonomously: true,
      processing_time_ms: Date.now() - routingStart,
      tokens_used: 150,
    };
  }

  timings.routing_ms = Date.now() - routingStart;

  // Step 3: Personalize response via voice persona
  const {
    selectAppropriateTone,
    personalizeResponse,
    modulateByCognitiveState,
  } = require('./voicePersonaEngine');

  const personaStart = Date.now();

  const tone = selectAppropriateTone({
    user_emotion: userTurn.user_emotion as UserEmotion,
    cognitive_state: updatedSession.cognitive_state,
    interaction_type: input.routing_decision.primary_engine.includes('advisor') ? 'advice' : 'casual',
  });

  const baseResponse = advisorResponse?.primary_recommendation || `Let me help with that.`;
  let personalizedResponse = personalizeResponse({
    base_response: baseResponse,
    user_tone: userTurn.user_emotion as UserEmotion,
    cognitive_state: updatedSession.cognitive_state,
    assistant_tone: tone,
    confidence: advisorResponse?.confidence || 0.7,
    interaction_type: 'advice',
  });

  // Modulate by cognitive state
  personalizedResponse = modulateByCognitiveState(personalizedResponse, updatedSession.cognitive_state);

  timings.persona_ms = Date.now() - personaStart;

  // Step 4: Safety filter (would call dialogueSafetyFilter)
  const safetyStart = Date.now();
  let safety_status: 'safe' | 'flagged' | 'blocked' = 'safe';

  if (input.config.require_safety_filter) {
    // Check against Phase 8 governance
    if (userTurn.domain === 'finance' && userTurn.intent.includes('execute')) {
      safety_status = 'flagged';
    }
  }

  timings.safety_ms = Date.now() - safetyStart;

  // Step 5: Create assistant turn
  const {
    createAssistantTurn,
    updateSessionAfterAssistantTurn,
  } = require('./dialogueStateEngine');

  const assistantTurn = createAssistantTurn({
    session_id: input.session.session_id,
    user_turn: userTurn,
    response_text: personalizedResponse.text,
    tone: personalizedResponse.tone as any,
    latency_ms: Date.now() - startTime,
    confidence: personalizedResponse.confidence,
    context_used: [],
    safety_status,
    captured_memories: [],
  });

  const finalSession = updateSessionAfterAssistantTurn(updatedSession, assistantTurn);

  // Step 6: Output to glasses
  const outputStart = Date.now();
  let glasses_output: GlassesOutput | undefined;

  if (input.glasses_session && input.config.output_targets.includes('glasses')) {
    // Would call composeGlassesOutput from glassesRealtimeBridge
    // For now: mock output
    glasses_output = {
      output_id: `go_${Date.now()}`,
      timestamp: new Date().toISOString(),
      glasses_session_id: input.glasses_session.session_id,
      output_type: 'advisor_response',
      primary_text: personalizedResponse.text,
      secondary_text: personalizedResponse.text.substring(0, 100),
      audio_enabled: true,
      audio_format: 'opus',
      audio_speed: 150,
      audio_volume: 75,
      visual_enabled: input.glasses_session.has_display,
      visual_layout: 'text_with_metrics',
      visual_duration_seconds: 10,
      haptic_enabled: input.glasses_session.has_haptic,
      haptic_patterns: [],
      haptic_timing: 'start',
      allow_interruption: true,
      priority: (safety_status as string) === 'blocked' ? 'critical' : 'medium',
      auto_dismiss_seconds: 10,
      display_time_ms: 0,
      user_engagement: 'unknown',
    };
  }

  timings.output_ms = Date.now() - outputStart;

  const totalLatency = Date.now() - startTime;

  return {
    interaction_id: `di_${Date.now()}`,
    timestamp: new Date().toISOString(),
    session_id: input.session.session_id,
    user_turn: userTurn,
    compressed_packet: input.compressed_packet,
    routing_decision: input.routing_decision,
    advisor_response: advisorResponse,
    assistant_turn: assistantTurn,
    personalized_response: personalizedResponse,
    glasses_output,
    total_latency_ms: totalLatency,
    components: {
      compression_ms: timings.compression_ms,
      routing_ms: timings.routing_ms,
      advisor_ms: advisorResponse?.processing_time_ms || 0,
      persona_ms: timings.persona_ms,
      safety_ms: timings.safety_ms,
      output_ms: timings.output_ms,
    },
    success: totalLatency < 2000,
    safety_status,
    interrupted: false,
  };
}

// ============================================================================
// INTERRUPT HANDLING
// ============================================================================

/**
 * Handle user interruption (talking over assistant response)
 */
export function handleInterrupt(input: {
  interaction: DialogueInteraction;
  interrupt_transcript: string;
  session: DialogueSessionState;
}): {
  truncated_interaction: DialogueInteraction;
  recovery_message: string;
} {
  // Truncate response mid-speech
  const truncated = {
    ...input.interaction,
    interrupted: true,
    assistant_turn: {
      ...input.interaction.assistant_turn,
      transcript: input.interaction.assistant_turn.transcript.substring(0, 50) + '... (interrupted)',
    },
  };

  // Generate recovery message
  const recovery = `Got it. You mentioned "${input.interrupt_transcript.substring(0, 30)}...". Tell me more.`;

  return {
    truncated_interaction: truncated,
    recovery_message: recovery,
  };
}

// ============================================================================
// BACKTRACK HANDLING
// ============================================================================

/**
 * Handle user backtrack request (repeat, clarification)
 */
export function handleBacktrack(input: {
  session: DialogueSessionState;
  backtrack_type: 'repeat' | 'clarify' | 'rephrase';
}): {
  clarification_message: string;
  previous_context: string;
} {
  const lastTurns = input.session.dialogue_history.slice(-3);
  const lastAssistantTurn = lastTurns.find((t) => t.speaker === 'assistant');

  let clarification = '';

  switch (input.backtrack_type) {
    case 'repeat':
      clarification = lastAssistantTurn ? lastAssistantTurn.transcript : 'Let me start over...';
      break;

    case 'clarify':
      clarification = lastAssistantTurn
        ? `What I meant was: ${lastAssistantTurn.transcript.substring(0, 50)}. Let me explain differently.`
        : 'What would you like me to clarify?';
      break;

    case 'rephrase':
      clarification = `In simpler terms: let me try again.`;
      break;
  }

  const previousContext = input.session.short_term_context.join(' | ').substring(0, 200);

  return {
    clarification_message: clarification,
    previous_context: previousContext,
  };
}

// ============================================================================
// SESSION COMPLETION
// ============================================================================

/**
 * End dialogue session and generate summary
 */
export function concludeDialogueSession(input: {
  session: DialogueSessionState;
  interactions: DialogueInteraction[];
  consolidate_memory: boolean;
}): {
  session_summary: {
    total_turns: number;
    user_sentiment: 'improving' | 'stable' | 'declining';
    safety_issues: number;
    avg_latency_ms: number;
  };
  memory_to_consolidate?: string[];
} {
  const { endDialogueSession, getSessionSummary } = require('./dialogueStateEngine');

  const finalSession = endDialogueSession(input.session);
  const summary = getSessionSummary(finalSession);

  // Extract memory fragments if consolidation enabled
  const memory_to_consolidate: string[] = [];
  if (input.consolidate_memory) {
    const { extractMemoryFragments } = require('./dialogueStateEngine');

    for (const interaction of input.interactions) {
      const fragments = extractMemoryFragments(interaction.assistant_turn, finalSession);
      memory_to_consolidate.push(...fragments);
    }
  }

  const avgLatency = input.interactions.length > 0
    ? Math.round(input.interactions.reduce((sum, i) => sum + i.total_latency_ms, 0) / input.interactions.length)
    : 0;

  return {
    session_summary: {
      total_turns: summary.total_turns,
      user_sentiment: summary.user_sentiment,
      safety_issues: summary.safety_violations,
      avg_latency_ms: avgLatency,
    },
    memory_to_consolidate,
  };
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process multiple interactions in sequence (conversation flow)
 */
export async function processConversationFlow(input: {
  initial_interaction: DialogueInteraction;
  session: DialogueSessionState;
  config: DialogueOrchestrationConfig;
  glasses_session?: GlassesSession;
  max_turns?: number;
}): Promise<{
  interactions: DialogueInteraction[];
  final_session: DialogueSessionState;
  session_summary: {
    total_turns: number;
    avg_latency_ms: number;
    user_sentiment: 'improving' | 'stable' | 'declining';
  };
}> {
  const interactions: DialogueInteraction[] = [input.initial_interaction];
  const currentSession = input.session;
  const maxTurns = input.max_turns || 5;

  // In production, this would:
  // 1. Wait for next user input (with timeout)
  // 2. Process through pipeline
  // 3. Output to glasses
  // 4. Update session
  // 5. Repeat until session ends or timeout

  // For MVP: just return initial interaction
  const { getSessionSummary } = require('./dialogueStateEngine');
  const summary = getSessionSummary(currentSession);

  const avgLatency = interactions.length > 0
    ? Math.round(interactions.reduce((sum, i) => sum + i.total_latency_ms, 0) / interactions.length)
    : 0;

  return {
    interactions,
    final_session: currentSession,
    session_summary: {
      total_turns: summary.total_turns,
      avg_latency_ms: avgLatency,
      user_sentiment: summary.user_sentiment,
    },
  };
}
