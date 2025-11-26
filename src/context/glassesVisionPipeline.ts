/**
 * Phase 13 – Glasses Vision Pipeline
 *
 * Coordinate event-based vision capture from smart glasses (Ray-Ban Meta, XREAL, etc.)
 * with trigger modes: tap, voice command, scheduled checks.
 *
 * - Support multiple glasses models (Ray-Ban Meta, XREAL, Solos, etc.)
 * - Implement trigger modes: tap (double-tap), voice ("capture"), scheduled (every 5 min)
 * - Manage capture queue and battery constraints
 * - Route frames to visualContextEngine for analysis
 * - Deduplication using scene hashing to avoid redundant analysis
 * - Track capture history and patterns
 *
 * Integration: Receives capture events from glasses hardware bridge
 * Outputs: Visual frames → visualContextEngine → surroundingsReasoner → contextFusionEngine
 * Cost constraint: <$0.05 per vision API call (image analysis), <$1/day total
 */

import type { VisualContext } from './visualContextEngine';

// ============================================================================
// GLASSES VISION PIPELINE TYPES
// ============================================================================

export type GlassesModel = 'ray_ban_meta' | 'xreal' | 'solos' | 'viture' | 'android_xr';
export type TriggerMode = 'tap' | 'voice' | 'scheduled' | 'manual' | 'adaptive';
export type CaptureStatus = 'pending' | 'capturing' | 'processing' | 'complete' | 'failed';

export interface CaptureEvent {
  // Event identity
  eventId: string;
  timestamp: string;
  glassesModel: GlassesModel;

  // Trigger information
  triggerMode: TriggerMode;
  triggerReason?: string; // e.g., "tap detected", "voice: capture", "scheduled check"

  // Capture result
  status: CaptureStatus;
  frameId?: string;
  imageData?: {
    width: number;
    height: number;
    format: 'jpeg' | 'webp'; // Compressed formats only, no raw data
    sizeBytes: number;
    captureTimestamp: string; // When frame was actually captured
  };

  // Processing
  visualContextId?: string;
  analysisComplete: boolean;
  analysisError?: string;

  // Cost tracking
  estimatedCost?: number; // USD per API call
  successfulAnalysis: boolean;

  // Metadata
  batteryPercent: number;
  signalQuality: number; // 0-1 for connectivity
  userConsent: boolean; // Privacy: user must consent to capture
}

export interface GlassesVisionConfig {
  // Hardware
  glassesModel: GlassesModel;
  maxCapturesPerDay: number; // Cost-control limit
  batteryThresholdPercent: number; // Don't capture below this

  // Triggers
  enableTapDetection: boolean;
  enableVoiceDetection: boolean;
  enableScheduledCapture: boolean;
  scheduledCaptureIntervalSeconds: number; // Default: 300 (5 min)

  // Processing
  deduplicationEnabled: boolean;
  similarityThreshold: number; // 0-1, scenes more similar are deduplicated
  maxConcurrentCaptures: number; // Queue management

  // Cost control
  dailyBudgetUSD: number; // e.g., 1.0 for $1/day
  apiProvider: 'claude_vision' | 'google_vision' | 'openai_vision'; // Which vision API to use

  // Privacy
  rawImageRetentionSeconds: number; // How long to keep image files before deletion
  storeSemanticOnly: boolean; // If true, discard raw images after processing
}

export interface VisionPipelineState {
  // Configuration
  config: GlassesVisionConfig;

  // Capture history
  captureHistory: CaptureEvent[];
  lastCaptureTime: string;
  capturesInCurrentDay: number;
  spentInCurrentDay: number; // USD

  // Deduplication
  lastAnalyzedSceneHash: string;
  lastSceneAnalysisTime: string;

  // Queue management
  pendingCaptures: CaptureEvent[];
  processingCaptures: Map<string, CaptureEvent>;

  // Session
  isActive: boolean;
  glassesConnected: boolean;
}

// ============================================================================
// PIPELINE INITIALIZATION
// ============================================================================

export const DEFAULT_VISION_CONFIG: GlassesVisionConfig = {
  glassesModel: 'ray_ban_meta',
  maxCapturesPerDay: 60, // Max 60 captures/day at ~$0.01 per capture = $0.60/day
  batteryThresholdPercent: 10, // Don't capture if below 10%

  enableTapDetection: true,
  enableVoiceDetection: true,
  enableScheduledCapture: true,
  scheduledCaptureIntervalSeconds: 300, // 5 minutes

  deduplicationEnabled: true,
  similarityThreshold: 0.85, // Skip if >85% similar to last
  maxConcurrentCaptures: 3,

  dailyBudgetUSD: 1.0,
  apiProvider: 'claude_vision',

  rawImageRetentionSeconds: 300, // 5 minutes
  storeSemanticOnly: true,
};

/**
 * Initialize glasses vision pipeline
 */
export function initializeVisionPipeline(config: Partial<GlassesVisionConfig> = {}): VisionPipelineState {
  const fullConfig = { ...DEFAULT_VISION_CONFIG, ...config };

  return {
    config: fullConfig,
    captureHistory: [],
    lastCaptureTime: new Date(0).toISOString(),
    capturesInCurrentDay: 0,
    spentInCurrentDay: 0,
    lastAnalyzedSceneHash: '',
    lastSceneAnalysisTime: new Date(0).toISOString(),
    pendingCaptures: [],
    processingCaptures: new Map(),
    isActive: true,
    glassesConnected: false, // Will be set by hardware bridge
  };
}

// ============================================================================
// CAPTURE EVENT HANDLING
// ============================================================================

/**
 * Process a capture trigger (tap, voice, scheduled)
 */
export function processCaptureRequest(
  pipelineState: VisionPipelineState,
  trigger: {
    mode: TriggerMode;
    reason?: string;
    batteryPercent: number;
    signalQuality: number;
    userConsent: boolean;
  }
): {
  accepted: boolean;
  reason: string;
  captureEvent?: CaptureEvent;
} {
  // Check if glasses connected
  if (!pipelineState.glassesConnected) {
    return {
      accepted: false,
      reason: 'Glasses not connected',
    };
  }

  // Check if disabled
  if (!pipelineState.isActive) {
    return {
      accepted: false,
      reason: 'Vision pipeline disabled',
    };
  }

  // Check trigger enable status
  if (trigger.mode === 'tap' && !pipelineState.config.enableTapDetection) {
    return { accepted: false, reason: 'Tap detection disabled' };
  }
  if (trigger.mode === 'voice' && !pipelineState.config.enableVoiceDetection) {
    return { accepted: false, reason: 'Voice detection disabled' };
  }
  if (trigger.mode === 'scheduled' && !pipelineState.config.enableScheduledCapture) {
    return { accepted: false, reason: 'Scheduled capture disabled' };
  }

  // Check user consent (critical for privacy)
  if (!trigger.userConsent) {
    return {
      accepted: false,
      reason: 'No user consent',
    };
  }

  // Check battery
  if (trigger.batteryPercent < pipelineState.config.batteryThresholdPercent) {
    return {
      accepted: false,
      reason: `Battery too low (${trigger.batteryPercent}% < ${pipelineState.config.batteryThresholdPercent}%)`,
    };
  }

  // Check daily limits
  if (pipelineState.capturesInCurrentDay >= pipelineState.config.maxCapturesPerDay) {
    return {
      accepted: false,
      reason: `Daily capture limit reached (${pipelineState.config.maxCapturesPerDay})`,
    };
  }

  // Check daily budget
  const estimatedCost = estimateVisionAPICost(pipelineState.config);
  if (pipelineState.spentInCurrentDay + estimatedCost > pipelineState.config.dailyBudgetUSD) {
    return {
      accepted: false,
      reason: `Daily budget exceeded (spent $${pipelineState.spentInCurrentDay.toFixed(2)} + $${estimatedCost.toFixed(2)} > $${pipelineState.config.dailyBudgetUSD})`,
    };
  }

  // Check queue size
  if (pipelineState.pendingCaptures.length + pipelineState.processingCaptures.size >= pipelineState.config.maxConcurrentCaptures) {
    return {
      accepted: false,
      reason: 'Capture queue full',
    };
  }

  // Create capture event
  const captureEvent: CaptureEvent = {
    eventId: `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    glassesModel: pipelineState.config.glassesModel,
    triggerMode: trigger.mode,
    triggerReason: trigger.reason,
    status: 'pending',
    analysisComplete: false,
    successfulAnalysis: false,
    batteryPercent: trigger.batteryPercent,
    signalQuality: trigger.signalQuality,
    userConsent: trigger.userConsent,
    estimatedCost,
  };

  // Add to queue
  pipelineState.pendingCaptures.push(captureEvent);

  return {
    accepted: true,
    reason: 'Capture queued',
    captureEvent,
  };
}

// ============================================================================
// CAPTURE EXECUTION
// ============================================================================

/**
 * Execute next pending capture (called by glasses hardware bridge)
 * This is a mock implementation; production would call actual glasses APIs
 */
export async function executeNextCapture(pipelineState: VisionPipelineState): Promise<CaptureEvent | null> {
  if (pipelineState.pendingCaptures.length === 0) {
    return null;
  }

  const captureEvent = pipelineState.pendingCaptures.shift()!;
  captureEvent.status = 'capturing';

  // Move to processing
  pipelineState.processingCaptures.set(captureEvent.eventId, captureEvent);

  try {
    // Mock frame capture (in production, call actual glasses camera APIs)
    const frameData = await mockCaptureFrame(pipelineState.config.glassesModel);

    captureEvent.frameId = `frame_${Date.now()}`;
    captureEvent.imageData = {
      width: 1920,
      height: 1440,
      format: 'jpeg',
      sizeBytes: frameData.sizeBytes,
      captureTimestamp: new Date().toISOString(),
    };

    captureEvent.status = 'processing';
    pipelineState.lastCaptureTime = new Date().toISOString();
    pipelineState.capturesInCurrentDay += 1;

    return captureEvent;
  } catch (error) {
    captureEvent.status = 'failed';
    captureEvent.analysisError = `Capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    captureEvent.successfulAnalysis = false;
    pipelineState.processingCaptures.delete(captureEvent.eventId);
    pipelineState.captureHistory.push(captureEvent);

    return captureEvent;
  }
}

/**
 * Complete a capture's processing after visual analysis
 */
export function completeCapture(
  pipelineState: VisionPipelineState,
  captureEventId: string,
  analysisResult: {
    success: boolean;
    visualContextId?: string;
    sceneHash?: string;
    cost: number;
    error?: string;
  }
): void {
  const captureEvent = pipelineState.processingCaptures.get(captureEventId);
  if (!captureEvent) {
    console.warn(`Capture event ${captureEventId} not found in processing queue`);
    return;
  }

  captureEvent.status = 'complete';
  captureEvent.analysisComplete = true;
  captureEvent.successfulAnalysis = analysisResult.success;
  captureEvent.visualContextId = analysisResult.visualContextId;
  captureEvent.analysisError = analysisResult.error;

  // Update costs
  pipelineState.spentInCurrentDay += analysisResult.cost;

  // Update deduplication state
  if (analysisResult.success && analysisResult.sceneHash) {
    pipelineState.lastAnalyzedSceneHash = analysisResult.sceneHash;
    pipelineState.lastSceneAnalysisTime = new Date().toISOString();
  }

  // Move from processing to history
  pipelineState.processingCaptures.delete(captureEventId);
  pipelineState.captureHistory.push(captureEvent);

  // Cleanup old images (if storeSemanticOnly enabled)
  if (pipelineState.config.storeSemanticOnly && captureEvent.imageData) {
    scheduleImageCleanup(captureEventId, pipelineState.config.rawImageRetentionSeconds);
  }
}

// ============================================================================
// DEDUPLICATION & SIMILARITY
// ============================================================================

/**
 * Check if scene should be analyzed (deduplication)
 */
export function shouldAnalyzeScene(pipelineState: VisionPipelineState, sceneHash: string): boolean {
  if (!pipelineState.config.deduplicationEnabled) {
    return true;
  }

  // Always analyze if this is first capture
  if (pipelineState.lastAnalyzedSceneHash === '') {
    return true;
  }

  // Always analyze if scene is significantly different
  if (sceneHash !== pipelineState.lastAnalyzedSceneHash) {
    return true; // Hashes don't match = different scenes
  }

  // Skip if same scene analyzed recently
  const timeSinceLastAnalysis = (Date.now() - new Date(pipelineState.lastSceneAnalysisTime).getTime()) / 1000;
  if (timeSinceLastAnalysis < 60) {
    // Analyzed same scene in last minute
    return false;
  }

  return true;
}

/**
 * Get deduplication status for display
 */
export function getDeduplicationStatus(pipelineState: VisionPipelineState): {
  enabled: boolean;
  lastSceneHash: string;
  secondsSinceLastAnalysis: number;
  isDuplicateOfLast: boolean;
} {
  const secondsSinceLastAnalysis = (Date.now() - new Date(pipelineState.lastSceneAnalysisTime).getTime()) / 1000;

  return {
    enabled: pipelineState.config.deduplicationEnabled,
    lastSceneHash: pipelineState.lastAnalyzedSceneHash,
    secondsSinceLastAnalysis,
    isDuplicateOfLast: pipelineState.lastAnalyzedSceneHash !== '' && secondsSinceLastAnalysis < 300, // 5 min window
  };
}

// ============================================================================
// SCHEDULED CAPTURE MANAGEMENT
// ============================================================================

/**
 * Check if scheduled capture should run
 */
export function shouldRunScheduledCapture(pipelineState: VisionPipelineState): boolean {
  if (!pipelineState.config.enableScheduledCapture) {
    return false;
  }

  const secondsSinceLastCapture = (Date.now() - new Date(pipelineState.lastCaptureTime).getTime()) / 1000;
  return secondsSinceLastCapture >= pipelineState.config.scheduledCaptureIntervalSeconds;
}

/**
 * Get next scheduled capture time
 */
export function getNextScheduledCaptureTime(pipelineState: VisionPipelineState): Date | null {
  if (!pipelineState.config.enableScheduledCapture) {
    return null;
  }

  const lastCapture = new Date(pipelineState.lastCaptureTime);
  const nextCapture = new Date(lastCapture.getTime() + pipelineState.config.scheduledCaptureIntervalSeconds * 1000);

  return nextCapture;
}

// ============================================================================
// PIPELINE METRICS & STATUS
// ============================================================================

/**
 * Get pipeline health status
 */
export function getPipelineStatus(pipelineState: VisionPipelineState): {
  active: boolean;
  glassesConnected: boolean;
  queueLength: number;
  capturesInCurrentDay: number;
  spentToday: number;
  budgetRemaining: number;
  budgetPercentUsed: number;
  nextScheduledCapture?: Date;
} {
  const budgetRemaining = pipelineState.config.dailyBudgetUSD - pipelineState.spentInCurrentDay;
  const budgetPercentUsed = (pipelineState.spentInCurrentDay / pipelineState.config.dailyBudgetUSD) * 100;

  return {
    active: pipelineState.isActive,
    glassesConnected: pipelineState.glassesConnected,
    queueLength: pipelineState.pendingCaptures.length + pipelineState.processingCaptures.size,
    capturesInCurrentDay: pipelineState.capturesInCurrentDay,
    spentToday: pipelineState.spentInCurrentDay,
    budgetRemaining: Math.max(0, budgetRemaining),
    budgetPercentUsed: Math.min(100, budgetPercentUsed),
    nextScheduledCapture: getNextScheduledCaptureTime(pipelineState) || undefined,
  };
}

/**
 * Get capture history summary
 */
export function getCaptureHistorySummary(
  pipelineState: VisionPipelineState,
  lastNCaptures: number = 10
): {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  recentCaptures: Array<{
    eventId: string;
    triggerMode: TriggerMode;
    status: CaptureStatus;
    cost: number;
  }>;
} {
  const recent = pipelineState.captureHistory.slice(-lastNCaptures);
  const successful = pipelineState.captureHistory.filter((c) => c.successfulAnalysis).length;
  const failed = pipelineState.captureHistory.filter((c) => c.status === 'failed').length;

  return {
    total: pipelineState.captureHistory.length,
    successful,
    failed,
    successRate: pipelineState.captureHistory.length > 0 ? successful / pipelineState.captureHistory.length : 0,
    recentCaptures: recent.map((c) => ({
      eventId: c.eventId,
      triggerMode: c.triggerMode,
      status: c.status,
      cost: c.estimatedCost || 0,
    })),
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Estimate vision API cost based on provider and image size
 */
function estimateVisionAPICost(config: GlassesVisionConfig): number {
  // Typical costs (these are averages; actual costs depend on model)
  const costPerCall: Record<typeof config.apiProvider, number> = {
    claude_vision: 0.01, // ~$0.01 per image
    google_vision: 0.0025, // ~$0.0025 per image
    openai_vision: 0.01, // ~$0.01 per image
  };

  return costPerCall[config.apiProvider];
}

/**
 * Mock frame capture (in production, calls actual glasses APIs)
 */
async function mockCaptureFrame(glassesModel: GlassesModel): Promise<{ sizeBytes: number }> {
  // Simulate capture latency
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Typical JPEG sizes: ~200-400KB for high-quality 1920x1440 image
  const sizeBytes = Math.floor(200000 + Math.random() * 200000);

  return { sizeBytes };
}

/**
 * Schedule cleanup of raw image data
 * In production: delete from cloud storage after retention period
 */
function scheduleImageCleanup(captureEventId: string, retentionSeconds: number): void {
  // This would be implemented by the backend to delete images from cloud storage
  // For MVP: just log the intent
  setTimeout(() => {
    // In production: delete image from cloud storage
  }, retentionSeconds * 1000);
}

/**
 * Daily budget reset (called at midnight UTC)
 */
export function resetDailyBudget(pipelineState: VisionPipelineState): void {
  pipelineState.capturesInCurrentDay = 0;
  pipelineState.spentInCurrentDay = 0;
}
