/**
 * Phase 13 – Real-World Context Layer
 *
 * Central exports for visual & situational awareness:
 *
 * Phase 13 – Real-World Context Layer (Visual & Situational Awareness):
 * 1. visualContextEngine – Process visual frames into semantic scene descriptions
 * 2. surroundingsReasoner – Reason about immediate surroundings and derive insights
 * 3. contextFusionEngine – Fuse multiple context streams into situation snapshot
 * 4. glassesVisionPipeline – Coordinate event-based vision capture from smart glasses
 * 5. environmentMemoryStore – Store recurring environment patterns and productivity outcomes
 * 6. safetyContextFilter – Prevent unsafe suggestions based on real-world context
 *
 * Integration points:
 * - Phase 11: wakeWindowEngine for recent transcript context
 * - Phase 10: cognitiveStateEngine and lifeSignalIngestor for state/signals
 * - Phase 9: personalAdvisor and calendar events
 * - Phase 8: agiGovernor for governance validation
 *
 * End-to-end flow:
 * Glasses tap/voice → Capture frame → Visual analysis → Surroundings reasoning
 * → Fuse with context → Check safety → Filter suggestions → Output to dialogue
 *
 * Privacy-first: Semantic descriptions only, no raw image persistence
 * Cost-controlled: <$1/day for vision API calls
 */

// ============================================================================
// VISUAL CONTEXT ENGINE
// ============================================================================

export {
  type VisualContext,
  type EnvironmentType,
  type VisualObject,
  type TextElement,
  type SafetyMarkers,
  analyzeScene,
  quickSceneCheck,
  generateSceneHash,
  compareScenes,
} from './visualContextEngine';

// ============================================================================
// SURROUNDINGS REASONER
// ============================================================================

export {
  type SurroundingsInsight,
  type LifeSignalSnapshot,
  type CognitiveState,
  reasonAboutSurroundings,
  summarizeInsight,
} from './surroundingsReasoner';

// ============================================================================
// CONTEXT FUSION ENGINE
// ============================================================================

export {
  type SituationSnapshot,
  type ContextInputs,
  generateSituationSnapshot,
  cacheLatestSnapshot,
  getLatestSnapshot,
  clearSnapshotCache,
  getSnapshotAge,
  isSnapshotStale,
  summarizeSituation,
} from './contextFusionEngine';

// ============================================================================
// GLASSES VISION PIPELINE
// ============================================================================

export {
  type GlassesModel,
  type TriggerMode,
  type CaptureStatus,
  type CaptureEvent,
  type GlassesVisionConfig,
  type VisionPipelineState,
  DEFAULT_VISION_CONFIG,
  initializeVisionPipeline,
  processCaptureRequest,
  executeNextCapture,
  completeCapture,
  shouldAnalyzeScene,
  getDeduplicationStatus,
  shouldRunScheduledCapture,
  getNextScheduledCaptureTime,
  getPipelineStatus,
  getCaptureHistorySummary,
  resetDailyBudget,
} from './glassesVisionPipeline';

// ============================================================================
// ENVIRONMENT MEMORY STORE
// ============================================================================

export {
  type EnvironmentProfile,
  type ProductivityOutcome,
  type EnvironmentMemoryStoreConfig,
  type EnvironmentMemoryStore,
  DEFAULT_STORE_CONFIG,
  initializeStore,
  addOrUpdateEnvironmentProfile,
  findMatchingProfile,
  recordProductivityOutcome,
  getEnvironmentRecommendations,
  recommendBestEnvironment,
  applyDecay,
  cleanupStore,
  getStoreStats,
} from './environmentMemoryStore';

// ============================================================================
// SAFETY CONTEXT FILTER
// ============================================================================

export {
  type SafetyBlockReason,
  type SafetyCheckResult,
  checkSafetyInContext,
  filterAdvisorSuggestions,
  canExecuteAutonomouslyNow,
  shouldWaitForBetterTiming,
  isAppropriateInterruption,
  createAuditEntry,
} from './safetyContextFilter';
