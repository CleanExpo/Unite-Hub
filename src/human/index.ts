/**
 * Phases 11 & 12 – Wake-Window Mode + Real-Time Dialogue Layer
 *
 * Central exports for the complete autonomous AI pipeline:
 *
 * PHASE 11 – Wake-Window Mode & Real-Time Advisor Integration:
 * 1. wakeWindowEngine – Detect wake words, capture audio, transcribe locally, delete raw audio
 * 2. contextCompressionEngine – Compress transcripts to minimal context packets
 * 3. microReasoningRouter – Route to local/cloud reasoning or advisor network
 * 4. realTimeAdvisorBridge – Generate personalized advisor responses
 * 5. glassesRealtimeBridge – Output to hardware with audio/visual/haptic
 *
 * PHASE 12 – Real-Time Dialogue Layer & Memory Consolidation:
 * 1. dialogueStateEngine – Track conversation state, emotions, turns, memory
 * 2. voicePersonaEngine – Apply Phill's authentic voice + energy-aware modulation
 * 3. realtimeDialogueOrchestrator – Main loop: orchestrate user → advisor → persona → glasses
 * 4. glassesVoiceOutput – Ultra-low-latency TTS synthesis for glasses + phone
 * 5. dialogueSafetyFilter – Hard validation against Phase 8 governance + Phase 10 autonomy
 * 6. dialogueMemoryConsolidator – Long-term memory consolidation with importance scoring
 *
 * Integration points:
 * - Phase 9: personalAdvisor, businessBrain, dailyBriefingEngine
 * - Phase 10: cognitiveStateEngine, autonomyPolicyEngine, lifeSignalIngestor
 * - Phase 8: agiGovernor for governance validation
 * - Phase 5: unified_agent_memory for long-term memory
 *
 * End-to-end flow:
 * Wake word detected → Audio captured → Transcribed locally → Context compressed
 * → Routed to advisor → Response generated → Dialogue orchestrated → Voice output
 * → Safety validated → Memory consolidated → Output to glasses
 * Latency target: <2 seconds, Cost: <$0.01 per advisor call
 */

// ============================================================================
// WAKE WINDOW ENGINE
// ============================================================================

export {
  type WakeWindowEvent,
  type ContextPacket,
  type AudioMicroWindow,
  type TranscriptionResult,
  detectWakeWord,
  captureMicroWindow,
  transcribeMicroWindow,
  deleteRawAudio,
  processWakeWindow,
} from './wakeWindowEngine';

// ============================================================================
// CONTEXT COMPRESSION ENGINE
// ============================================================================

export {
  type EventTag,
  type CompressionDomain,
  type CompressedContextPacket,
  type CompressionMetrics,
  compressWakeWindowEvent,
  compressBatch,
  filterCompressedPackets,
  getHighPriorityPackets,
} from './contextCompressionEngine';

// ============================================================================
// MICRO REASONING ROUTER
// ============================================================================

export {
  type ReasoningEngine,
  type CloudModel,
  type RoutingDecision,
  canHandleLocalIntentDetection,
  canHandleLocalTaskExecution,
  selectCloudModel,
  estimateCloudCost,
  estimateLatency,
  checkGovernanceRules,
  routeCompressedPacket,
  routeBatch,
  analyzeCosts,
} from './microReasoningRouter';

// ============================================================================
// REAL-TIME ADVISOR BRIDGE
// ============================================================================

export {
  type AdvisorType,
  type AdviceType,
  type AdvisorResponse,
  type AdvisorContext,
  selectAdvisor,
  adjustAdviceForCognitiveState,
  canExecuteAutonomously,
  generateImmediateActions,
  recommendExecutionTiming,
  generateAdvisorResponse,
} from './realTimeAdvisorBridge';

// ============================================================================
// GLASSES REAL-TIME BRIDGE
// ============================================================================

export {
  type GlassesModel,
  type AudioFormat,
  type HapticPattern,
  type GlassesSession,
  type GlassesOutput,
  type MetricsDisplay,
  initializeGlassesSession,
  updateSessionBattery,
  generateAudioOutput,
  generateVisualDisplay,
  generateHapticSequence,
  composeGlassesOutput,
  composeNotificationOutput,
  composeMetricsOutput,
  endGlassesSession,
  shouldShowBatteryWarning,
  estimateSessionRuntime,
} from './glassesRealtimeBridge';

// ============================================================================
// DIALOGUE STATE ENGINE (Phase 12)
// ============================================================================

export {
  type UserEmotion,
  type AssistantTone,
  type DialogueTurn,
  type DialogueSessionState,
  detectUserEmotion,
  analyzeUserEnergyLevel,
  analyzeUserConfidence,
  createUserTurn,
  createAssistantTurn,
  initializeDialogueSession,
  updateSessionAfterUserTurn,
  updateSessionAfterAssistantTurn,
  getShortTermContext,
  extractMemoryFragments,
  detectInterrupt,
  detectBacktrackRequest,
  endDialogueSession,
  getSessionSummary,
} from './dialogueStateEngine';

// ============================================================================
// VOICE PERSONA ENGINE (Phase 12)
// ============================================================================

export {
  type PhillPersona,
  type PersonalizedResponse,
  type VoiceProfile,
  PHILL_PERSONA,
  selectAppropriateTone,
  personalizeResponse,
  applyCrisisMode,
  modulateByCognitiveState,
  validatePersonaAlignment,
  generateSpeakingParameters,
} from './voicePersonaEngine';

// ============================================================================
// REAL-TIME DIALOGUE ORCHESTRATOR (Phase 12)
// ============================================================================

export {
  type DialogueOrchestrationConfig,
  type DialogueInteraction,
  DEFAULT_CONFIG,
  initiateDialogueSession,
  processDialogueInteraction,
  handleInterrupt,
  handleBacktrack,
  concludeDialogueSession,
  processConversationFlow,
} from './realtimeDialogueOrchestrator';

// ============================================================================
// GLASSES VOICE OUTPUT (Phase 12)
// ============================================================================

export {
  type TTSParams,
  type AudioOutput,
  type VoiceOutputConfig,
  type AudioChunk,
  type UserVoicePreferences,
  DEFAULT_VOICE_OUTPUT_CONFIG,
  DEFAULT_USER_VOICE_PREFERENCES,
  selectVoiceProfile,
  speakQuick,
  speakAdvisory,
  speakAlert,
  streamAudioOutput,
  modulateVoiceByEmotion,
  adjustForAccessibility,
  calculateVoiceMetrics,
} from './glassesVoiceOutput';

// ============================================================================
// DIALOGUE SAFETY FILTER (Phase 12)
// ============================================================================

export {
  type SafetyStatus,
  type BlockReason,
  type SafetyCheckResult,
  type DialogueSafetyConfig,
  type SafetyPolicy,
  DEFAULT_SAFETY_CONFIG,
  validateDialogueSafety,
  validateBatchSafety,
  createCustomSafetyPolicy,
} from './dialogueSafetyFilter';

// ============================================================================
// DIALOGUE MEMORY CONSOLIDATOR (Phase 12)
// ============================================================================

export {
  type MemoryDomain,
  type MemoryEmotionalValence,
  type MemoryFragment,
  type ConsolidatedMemory,
  type UnifiedMemorySync,
  type MemoryRetentionPolicy,
  DEFAULT_MEMORY_RETENTION_POLICY,
  extractMemoryFromSession,
  scoreMemoryImportance,
  consolidateMemory,
  prepareForUnifiedSync,
  handleBidirectionalUpdate,
  pruneMemoriesByRetentionPolicy,
} from './dialogueMemoryConsolidator';

// ============================================================================
// RE-EXPORT PHASE 10 TYPES FOR CONVENIENCE
// ============================================================================

export type { CognitiveState } from './cognitiveStateEngine';
export type { LifeSignal, LifeSignalSnapshot } from './lifeSignalIngestor';
export type { ThoughtEntry } from './thoughtLogEngine';
export type { AutonomyDecision } from './autonomyPolicyEngine';

// Import types for convenience functions
import type { CognitiveState } from './cognitiveStateEngine';
import type { LifeSignal } from './lifeSignalIngestor';
import type { AdvisorContext } from './realTimeAdvisorBridge';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Complete end-to-end pipeline: wake word → advisor response → glasses output
 */
export async function processWakeWindowToGlassesOutput(input: {
  // Wake Window Detection
  trigger_type: 'wake_word' | 'tap_glasses' | 'manual_trigger';
  wake_word_detected: string;
  wake_word_confidence: number;
  audio_data: Float32Array;
  sample_rate: number;
  trigger_time_ms: number;

  // Context
  cognitive_state?: string;
  life_signals?: Record<string, unknown>;

  // Glasses
  glasses_model: 'ray_ban_meta' | 'solos' | 'xreal' | 'viture' | 'android_xr';
}): Promise<{
  context_packet: any; // CompressedContextPacket
  routing: any; // RoutingDecision
  advisor_response: any; // AdvisorResponse
  glasses_output: any; // GlassesOutput
  total_latency_ms: number;
  estimated_cost: number;
}> {
  const startTime = Date.now();
  const { processWakeWindow } = await import('./wakeWindowEngine');
  const { captureMicroWindow } = await import('./wakeWindowEngine');
  const { compressWakeWindowEvent } = await import('./contextCompressionEngine');
  const { routeCompressedPacket } = await import('./microReasoningRouter');
  const { generateAdvisorResponse } = await import('./realTimeAdvisorBridge');
  const { initializeGlassesSession, composeGlassesOutput } = await import('./glassesRealtimeBridge');

  // Step 1: Capture and process wake window
  const audioWindow = captureMicroWindow(input.trigger_time_ms, input.audio_data, input.sample_rate);
  const wakeEvent = await processWakeWindow({
    trigger_type: input.trigger_type,
    wake_word_detected: input.wake_word_detected,
    wake_word_confidence: input.wake_word_confidence,
    audio_micro_window: audioWindow,
  });

  // Step 2: Compress context
  const contextPacket = compressWakeWindowEvent(wakeEvent, input.cognitive_state as any);

  // Step 3: Route to reasoning engine
  const routing = routeCompressedPacket(contextPacket);

  // Step 4: Generate advisor response
  const advisorContext: AdvisorContext = {
    cognitive_state: (input.cognitive_state as CognitiveState) || undefined,
    life_signals: (input.life_signals as unknown as LifeSignal[]) || undefined,
  };
  const advisorResponse = await generateAdvisorResponse(contextPacket, routing, advisorContext);

  // Step 5: Send to glasses
  const glassesSession = initializeGlassesSession(input.glasses_model as any);
  const glassesOutput = composeGlassesOutput(advisorResponse, glassesSession);

  const totalLatency = Date.now() - startTime;

  return {
    context_packet: contextPacket,
    routing,
    advisor_response: advisorResponse,
    glasses_output: glassesOutput,
    total_latency_ms: totalLatency,
    estimated_cost: routing.estimated_cost,
  };
}

/**
 * Quick routing decision without full processing
 */
export function quickRoute(
  transcript: string,
  domain: string,
  complexity: 'simple' | 'moderate' | 'complex'
): any {
  // Import types inline to avoid circular dependencies
  const { routeCompressedPacket } = require('./microReasoningRouter');

  const quickPacket = {
    packet_id: 'quick_' + Date.now(),
    timestamp: new Date().toISOString(),
    event_tag: 'advisor_query' as any,
    domain: domain as any,
    priority: 'medium' as any,
    summary: transcript,
    key_entities: [],
    confidence: 0.8,
    compression_ratio: 1,
    original_transcript: transcript,
    original_duration_ms: 0,
    complexity_level: complexity,
    requires_context: false,
    multi_step: false,
  };

  return routeCompressedPacket(quickPacket);
}

/**
 * Cost analysis helper
 */
export function analyzePipelineCost(events: any[]): any {
  const { analyzeCosts } = require('./microReasoningRouter');
  const { routeCompressedPacket } = require('./microReasoningRouter');

  const routingDecisions = events.map((e) => routeCompressedPacket(e));
  return analyzeCosts(routingDecisions);
}
