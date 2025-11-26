/**
 * Phase 11 – Wake-Window Mode & Real-Time Advisor Integration
 *
 * Central exports for the complete wake-window pipeline:
 * 1. wakeWindowEngine – Detect wake words, capture audio, transcribe locally, delete raw audio
 * 2. contextCompressionEngine – Compress transcripts to minimal context packets
 * 3. microReasoningRouter – Route to local/cloud reasoning or advisor network
 * 4. realTimeAdvisorBridge – Generate personalized advisor responses
 * 5. glassesRealtimeBridge – Output to hardware with audio/visual/haptic
 *
 * Integration points:
 * - Phase 9: personalAdvisor, businessBrain, dailyBriefingEngine
 * - Phase 10: cognitiveStateEngine, autonomyPolicyEngine, lifeSignalIngestor
 * - Phase 8: agiGovernor for governance validation
 *
 * End-to-end flow:
 * Wake word detected → Audio captured → Transcribed locally → Context compressed
 * → Routed to advisor → Response generated → Output to glasses
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
