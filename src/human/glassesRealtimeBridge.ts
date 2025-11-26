/**
 * Phase 11 – Glasses Real-Time Bridge
 *
 * Unified output/input for all smart glasses platforms with real-time advisor responses.
 * - Ray-Ban Meta, Solos, XREAL, VITURE, Android XR
 * - Voice output synthesis with low-latency audio
 * - Haptic feedback for notifications
 * - Live metrics display (cognitive state, life signals)
 * - Advisor response streaming
 *
 * Integration: Receives AdvisorResponse from realTimeAdvisorBridge
 * Output: Real-time visual + audio + haptic output to glasses
 * Latency target: <2 seconds end-to-end (wake word → advisor response on glasses)
 * Battery cost: 1-2% per advisor session
 */

import type { AdvisorResponse } from './realTimeAdvisorBridge';
import type { CognitiveState } from './cognitiveStateEngine';
import type { ContextPacket } from './wakeWindowEngine';

// ============================================================================
// GLASSES HARDWARE TYPES
// ============================================================================

export type GlassesModel = 'ray_ban_meta' | 'solos' | 'xreal' | 'viture' | 'android_xr' | 'generic';

export type AudioFormat = 'mp3' | 'aac' | 'wav' | 'opus';

export type HapticPattern = 'light_tap' | 'medium_pulse' | 'strong_alert' | 'double_tap' | 'success' | 'error' | 'warning';

export interface GlassesSession {
  // Session Identity
  session_id: string;
  glasses_model: GlassesModel;
  connected_at: string;
  is_active: boolean;

  // Device Capabilities
  has_audio_out: boolean;
  has_haptic: boolean;
  has_display: boolean;
  display_resolution?: { width: number; height: number };
  battery_percent: number;
  wifi_quality: number; // 0-100

  // Session State
  current_output?: string; // What's being displayed/spoken
  speech_rate: number; // 0.5-2.0x
  volume_level: number; // 0-100
  display_brightness: number; // 0-100
  haptic_enabled: boolean;
}

export interface GlassesOutput {
  // Output Identity
  output_id: string;
  timestamp: string;
  glasses_session_id: string;

  // Output Content
  output_type: 'advisor_response' | 'notification' | 'metric_update' | 'status_alert';
  primary_text: string; // What to say/display
  secondary_text?: string; // Additional context

  // Audio Output
  audio_enabled: boolean;
  audio_format: AudioFormat;
  audio_speed: number; // Words per minute (100-300 typical)
  audio_volume: number; // 0-100

  // Visual Output (if display available)
  visual_enabled: boolean;
  visual_layout: 'text_only' | 'text_with_metrics' | 'full_dashboard' | 'minimal_notification';
  visual_duration_seconds?: number; // How long to display

  // Haptic Feedback
  haptic_enabled: boolean;
  haptic_patterns: HapticPattern[];
  haptic_timing: string; // When to trigger haptic relative to audio

  // Output Control
  allow_interruption: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  auto_dismiss_seconds?: number; // Auto-clear after N seconds

  // Analytics
  display_time_ms: number;
  user_engagement: 'skipped' | 'partial' | 'full' | 'reread' | 'unknown';
}

export interface MetricsDisplay {
  // Cognitive & Health Display
  show_cognitive_state: boolean;
  cognitive_state?: CognitiveState;
  energy_level?: 'low' | 'medium' | 'high'; // Simplified display

  show_life_signals: boolean;
  life_signals_compact?: {
    sleep_hours?: number;
    stress_level?: number;
    calendar_load?: number;
  };

  show_time: boolean;
  show_battery: boolean;

  // Color Coding
  color_scheme: 'auto' | 'light' | 'dark' | 'high_contrast';
}

// ============================================================================
// GLASSES PLATFORM CAPABILITIES
// ============================================================================

const GLASSES_CAPABILITIES: Record<GlassesModel, { audio: boolean; haptic: boolean; display: boolean; resolution?: [number, number]; battery_hours: number }> = {
  ray_ban_meta: {
    audio: true,
    haptic: true,
    display: false, // No display, audio + haptic only
    battery_hours: 8,
  },
  solos: {
    audio: true,
    haptic: true,
    display: true,
    resolution: [800, 480],
    battery_hours: 4,
  },
  xreal: {
    audio: true,
    haptic: false,
    display: true,
    resolution: [1920, 1080],
    battery_hours: 4,
  },
  viture: {
    audio: true,
    haptic: false,
    display: true,
    resolution: [1440, 1080],
    battery_hours: 5,
  },
  android_xr: {
    audio: true,
    haptic: true,
    display: true,
    resolution: [1920, 1080],
    battery_hours: 6,
  },
  generic: {
    audio: true,
    haptic: false,
    display: true,
    resolution: [1280, 720],
    battery_hours: 4,
  },
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Initialize glasses session
 */
export function initializeGlassesSession(glassesModel: GlassesModel, batteryPercent: number = 85): GlassesSession {
  const capabilities = GLASSES_CAPABILITIES[glassesModel];

  return {
    session_id: `gs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    glasses_model: glassesModel,
    connected_at: new Date().toISOString(),
    is_active: true,
    has_audio_out: capabilities.audio,
    has_haptic: capabilities.haptic,
    has_display: capabilities.display,
    display_resolution: capabilities.resolution ? { width: capabilities.resolution[0], height: capabilities.resolution[1] } : undefined,
    battery_percent: batteryPercent,
    wifi_quality: 85,
    speech_rate: 1.0,
    volume_level: 75,
    display_brightness: 80,
    haptic_enabled: capabilities.haptic,
  };
}

/**
 * Update session battery level
 */
export function updateSessionBattery(session: GlassesSession, newBatteryPercent: number): GlassesSession {
  return {
    ...session,
    battery_percent: newBatteryPercent,
  };
}

// ============================================================================
// AUDIO OUTPUT GENERATION
// ============================================================================

/**
 * Generate audio output from advisor response
 */
export function generateAudioOutput(
  response: AdvisorResponse,
  session: GlassesSession
): {
  audio_text: string;
  audio_format: AudioFormat;
  estimated_duration_seconds: number;
  haptic_cues?: HapticPattern[];
} {
  // Build audio script from response
  const parts: string[] = [
    `${response.advisor_type.replace(/_/g, ' ')}: ${response.primary_recommendation}`,
  ];

  if (response.immediate_actions && response.immediate_actions.length > 0) {
    parts.push(`Next steps: ${response.immediate_actions.slice(0, 2).join('. ')}`);
  }

  if (response.reason_for_timing) {
    parts.push(`Timing: ${response.reason_for_timing}`);
  }

  const audioText = parts.join('. ');

  // Estimate duration (assume 150 words per minute)
  const wordCount = audioText.split(/\s+/).length;
  const estimatedSeconds = (wordCount / 150) * 60;

  // Haptic cues based on priority
  const hapticCues: HapticPattern[] = [];
  if (response.requires_founder_approval) {
    hapticCues.push('strong_alert');
  } else if (response.risk_level === 'high') {
    hapticCues.push('medium_pulse');
  } else {
    hapticCues.push('light_tap');
  }

  // Select audio format based on glasses model
  const audioFormat = selectAudioFormat(session.glasses_model);

  return {
    audio_text: audioText,
    audio_format: audioFormat,
    estimated_duration_seconds: estimatedSeconds,
    haptic_cues: hapticCues,
  };
}

/**
 * Select optimal audio format for glasses model
 */
function selectAudioFormat(glassesModel: GlassesModel): AudioFormat {
  // Opus preferred for bandwidth efficiency on mobile
  if (['ray_ban_meta', 'android_xr'].includes(glassesModel)) {
    return 'opus';
  }

  // AAC for Apple compatibility
  if (['xreal', 'viture'].includes(glassesModel)) {
    return 'aac';
  }

  // WAV fallback
  return 'wav';
}

// ============================================================================
// VISUAL DISPLAY GENERATION
// ============================================================================

/**
 * Generate visual layout for advisor response
 */
export function generateVisualDisplay(
  response: AdvisorResponse,
  session: GlassesSession,
  metricsDisplay?: MetricsDisplay
): {
  layout: GlassesOutput['visual_layout'];
  display_text: string;
  display_html?: string;
  display_duration: number;
  metrics_overlay?: Record<string, unknown>;
} {
  // Select layout based on device capabilities
  let layout: GlassesOutput['visual_layout'] = 'text_only';

  if (session.has_display) {
    layout = response.requires_founder_approval ? 'full_dashboard' : 'text_with_metrics';
  }

  // Build display text (concise for small displays)
  const displayText = response.primary_recommendation.substring(0, 200);

  // Build metrics overlay if requested
  const metricsOverlay: Record<string, unknown> = {};

  if (metricsDisplay?.show_time) {
    metricsOverlay.current_time = new Date().toLocaleTimeString();
  }

  if (metricsDisplay?.show_battery) {
    metricsOverlay.battery_percent = session.battery_percent;
  }

  if (metricsDisplay?.show_cognitive_state && metricsDisplay.cognitive_state) {
    metricsOverlay.cognitive_state = metricsDisplay.cognitive_state;
    metricsOverlay.energy_indicator = metricsDisplay.energy_level;
  }

  // Duration: show for 10 seconds or duration of audio, whichever longer
  const displayDuration = response.processing_time_ms ? Math.max(10, Math.ceil(response.processing_time_ms / 1000)) : 10;

  return {
    layout,
    display_text: displayText,
    display_duration: displayDuration,
    metrics_overlay: Object.keys(metricsOverlay).length > 0 ? metricsOverlay : undefined,
  };
}

// ============================================================================
// HAPTIC FEEDBACK
// ============================================================================

/**
 * Generate haptic pattern sequence
 */
export function generateHapticSequence(
  response: AdvisorResponse,
  timingRelativeToAudio: 'start' | 'during' | 'end'
): {
  patterns: { pattern: HapticPattern; delay_ms: number; duration_ms: number }[];
  total_duration_ms: number;
} {
  const patterns: { pattern: HapticPattern; delay_ms: number; duration_ms: number }[] = [];

  // Base delay: when to start haptic feedback relative to audio start
  let baseDelay = 0;
  if (timingRelativeToAudio === 'start') {
    baseDelay = 100; // Start 100ms into response
  } else if (timingRelativeToAudio === 'during') {
    baseDelay = Math.floor((response.processing_time_ms || 1000) / 2);
  } else {
    baseDelay = (response.processing_time_ms || 2000) - 500;
  }

  // Determine base pattern by priority
  if (response.requires_founder_approval) {
    patterns.push({ pattern: 'strong_alert', delay_ms: baseDelay, duration_ms: 200 });
    patterns.push({ pattern: 'medium_pulse', delay_ms: baseDelay + 300, duration_ms: 150 });
  } else if (response.risk_level === 'high') {
    patterns.push({ pattern: 'medium_pulse', delay_ms: baseDelay, duration_ms: 150 });
  } else if (response.risk_level === 'critical') {
    patterns.push({ pattern: 'strong_alert', delay_ms: baseDelay, duration_ms: 250 });
  } else {
    patterns.push({ pattern: 'light_tap', delay_ms: baseDelay, duration_ms: 100 });
  }

  // Add success pattern if low risk
  if (response.risk_level === 'low') {
    patterns.push({ pattern: 'success', delay_ms: baseDelay + 200, duration_ms: 100 });
  }

  // Calculate total duration
  const totalDuration = Math.max(...patterns.map((p) => p.delay_ms + p.duration_ms));

  return {
    patterns,
    total_duration_ms: totalDuration,
  };
}

// ============================================================================
// GLASSES OUTPUT COMPOSITION
// ============================================================================

/**
 * Compose complete glasses output from advisor response
 */
export function composeGlassesOutput(
  response: AdvisorResponse,
  session: GlassesSession,
  metricsDisplay?: MetricsDisplay
): GlassesOutput {
  const audioOutput = generateAudioOutput(response, session);
  const visualOutput = session.has_display ? generateVisualDisplay(response, session, metricsDisplay) : null;
  const hapticSequence = session.has_haptic ? generateHapticSequence(response, 'start') : null;

  return {
    output_id: `go_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    glasses_session_id: session.session_id,
    output_type: 'advisor_response',
    primary_text: audioOutput.audio_text,
    secondary_text: response.supporting_reasoning,
    audio_enabled: session.has_audio_out,
    audio_format: audioOutput.audio_format,
    audio_speed: 150, // Words per minute
    audio_volume: session.volume_level,
    visual_enabled: session.has_display,
    visual_layout: visualOutput?.layout || 'text_only',
    visual_duration_seconds: visualOutput?.display_duration,
    haptic_enabled: session.has_haptic && hapticSequence ? hapticSequence.patterns.length > 0 : false,
    haptic_patterns: hapticSequence?.patterns.map((p) => p.pattern) || [],
    haptic_timing: 'start',
    allow_interruption: !response.requires_founder_approval,
    priority: response.requires_founder_approval ? 'critical' : response.risk_level === 'critical' ? 'high' : 'medium',
    auto_dismiss_seconds: response.risk_level === 'critical' ? undefined : audioOutput.estimated_duration_seconds + 2,
    display_time_ms: 0,
    user_engagement: 'unknown',
  };
}

// ============================================================================
// NOTIFICATION OUTPUT (SIMPLIFIED)
// ============================================================================

/**
 * Generate lightweight notification for non-critical updates
 */
export function composeNotificationOutput(
  title: string,
  message: string,
  session: GlassesSession,
  priority: 'low' | 'medium' | 'high' = 'medium'
): GlassesOutput {
  return {
    output_id: `no_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    glasses_session_id: session.session_id,
    output_type: 'notification',
    primary_text: `${title}: ${message}`,
    audio_enabled: session.has_audio_out && priority !== 'low',
    audio_format: 'opus',
    audio_speed: 200,
    audio_volume: Math.max(50, session.volume_level - 20),
    visual_enabled: session.has_display,
    visual_layout: 'minimal_notification',
    visual_duration_seconds: 5,
    haptic_enabled: session.has_haptic,
    haptic_patterns: priority === 'high' ? ['medium_pulse'] : ['light_tap'],
    haptic_timing: 'start',
    allow_interruption: true,
    priority,
    auto_dismiss_seconds: 5,
    display_time_ms: 0,
    user_engagement: 'unknown',
  };
}

// ============================================================================
// METRICS DISPLAY
// ============================================================================

/**
 * Compose metrics display update
 */
export function composeMetricsOutput(
  session: GlassesSession,
  cognitiveState?: CognitiveState,
  lifeSignals?: Record<string, unknown>
): GlassesOutput {
  const metricsText = buildMetricsText(cognitiveState, lifeSignals);

  return {
    output_id: `me_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    glasses_session_id: session.session_id,
    output_type: 'metric_update',
    primary_text: metricsText,
    audio_enabled: false,
    audio_format: 'opus',
    audio_speed: 150,
    audio_volume: 0,
    visual_enabled: session.has_display,
    visual_layout: 'text_with_metrics',
    visual_duration_seconds: 30, // Persistent display
    haptic_enabled: false,
    haptic_patterns: [],
    haptic_timing: 'start',
    allow_interruption: true,
    priority: 'low',
    display_time_ms: 0,
    user_engagement: 'unknown',
  };
}

/**
 * Build text representation of metrics
 */
function buildMetricsText(cognitiveState?: CognitiveState, lifeSignals?: Record<string, unknown>): string {
  const parts: string[] = [];

  if (cognitiveState) {
    const stateEmoji: Record<CognitiveState, string> = {
      sharp: '⚡',
      good: '✓',
      tired: '⚠️',
      fatigued: '⚠️⚠️',
      overloaded: '🔴',
    };
    parts.push(`${stateEmoji[cognitiveState]} ${cognitiveState}`);
  }

  if (lifeSignals) {
    if (lifeSignals.sleep_hours) {
      parts.push(`💤 ${lifeSignals.sleep_hours}h`);
    }
    if (lifeSignals.stress_level) {
      parts.push(`❤️ ${lifeSignals.stress_level}`);
    }
    if (lifeSignals.calendar_load) {
      parts.push(`📅 ${lifeSignals.calendar_load}%`);
    }
  }

  return parts.join(' | ') || 'Ready';
}

// ============================================================================
// SESSION LIFECYCLE
// ============================================================================

/**
 * End glasses session gracefully
 */
export function endGlassesSession(session: GlassesSession): GlassesSession {
  return {
    ...session,
    is_active: false,
  };
}

/**
 * Check if session needs battery warning
 */
export function shouldShowBatteryWarning(session: GlassesSession): boolean {
  return session.battery_percent <= 20;
}

/**
 * Estimate session runtime remaining
 */
export function estimateSessionRuntime(session: GlassesSession, capabilities: typeof GLASSES_CAPABILITIES[GlassesModel]): {
  estimated_minutes_remaining: number;
  warning_threshold_reached: boolean;
} {
  const estimatedMinutesRemaining = (session.battery_percent / 100) * capabilities.battery_hours * 60;
  const warningThresholdReached = session.battery_percent <= 20;

  return {
    estimated_minutes_remaining: Math.floor(estimatedMinutesRemaining),
    warning_threshold_reached: warningThresholdReached,
  };
}
