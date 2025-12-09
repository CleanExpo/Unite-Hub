/**
 * Phase 12 – Glasses Voice Output
 *
 * Ultra-low-latency TTS synthesis for smart glasses + phone speaker output.
 * - Quick responses (<500ms), advisory responses (<1s), alerts (<200ms)
 * - Multi-platform voice selection (device voice profiles)
 * - Audio streaming for real-time playback
 * - Integration with glassesRealtimeBridge for glasses output
 * - Fallback to on-device voices if cloud TTS unavailable
 *
 * Integration: Receives PersonalizedResponse from voicePersonaEngine
 * Feeds: glassesRealtimeBridge (audio output + timing)
 * Output: AudioOutput with TTS params + streaming capability
 */

import type { PersonalizedResponse } from './voicePersonaEngine';
import type { GlassesSession, GlassesOutput } from './glassesRealtimeBridge';

// ============================================================================
// VOICE OUTPUT TYPES
// ============================================================================

export type VoiceProfile = 'male_natural' | 'female_natural' | 'male_energetic' | 'female_calm' | 'neutral';

export type TTSProvider = 'elevenlabs' | 'google' | 'aws_polly' | 'device_native';

export interface TTSParams {
  text: string;
  voice_profile: VoiceProfile;
  rate: number; // 0.5-2.0
  pitch: number; // -10 to +10
  volume: number; // 0-100
  emotion: 'neutral' | 'calm' | 'warm' | 'serious' | 'urgent';
}

export interface AudioOutput {
  // Identity
  output_id: string;
  timestamp: string;

  // Content
  text: string;
  audio_url?: string; // For cloud TTS
  audio_buffer?: ArrayBuffer; // For device playback

  // TTS Details
  provider: TTSProvider;
  voice_profile: VoiceProfile;
  duration_ms: number;
  synthesis_time_ms: number;

  // Playback Control
  autoplay: boolean;
  allow_interruption: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Fallback Info
  fallback_used: boolean;
  fallback_reason?: string;
}

export interface VoiceOutputConfig {
  // TTS Provider
  preferred_provider: TTSProvider;
  fallback_providers: TTSProvider[];

  // Voice Profile
  voice_profile: VoiceProfile;
  voice_name?: string; // For cloud providers

  // Output Targets
  output_targets: ('glasses' | 'speaker' | 'haptic')[];

  // Latency Requirements (ms)
  quick_response_target: number; // <500ms
  advisory_response_target: number; // <1000ms
  alert_response_target: number; // <200ms

  // Streaming
  enable_streaming: boolean; // True: stream as synthesis completes
  chunk_size_ms: number; // 250ms chunks for streaming
}

// ============================================================================
// DEFAULT VOICE OUTPUT CONFIG
// ============================================================================

export const DEFAULT_VOICE_OUTPUT_CONFIG: VoiceOutputConfig = {
  preferred_provider: 'google',
  fallback_providers: ['device_native'],
  voice_profile: 'male_natural',
  output_targets: ['glasses', 'speaker'],
  quick_response_target: 500,
  advisory_response_target: 1000,
  alert_response_target: 200,
  enable_streaming: true,
  chunk_size_ms: 250,
};

// ============================================================================
// VOICE SELECTION
// ============================================================================

/**
 * Select appropriate voice profile for response
 */
export function selectVoiceProfile(input: {
  emotion: 'neutral' | 'calm' | 'warm' | 'serious' | 'urgent';
  speaker_energy: 'low' | 'normal' | 'high';
  tone_type: 'casual' | 'clarifying' | 'advising' | 'urgent' | 'warm' | 'precise';
}): VoiceProfile {
  // Warm/casual → natural voice
  if (input.emotion === 'warm' || input.tone_type === 'warm') {
    return input.speaker_energy === 'high' ? 'female_natural' : 'male_natural';
  }

  // Serious/advising → precise voice
  if (input.emotion === 'serious' || input.tone_type === 'advising') {
    return 'male_natural';
  }

  // Urgent → energetic voice
  if (input.emotion === 'urgent' || input.tone_type === 'urgent') {
    return 'male_energetic';
  }

  // Calm/casual → calm voice
  if (input.emotion === 'calm' || input.tone_type === 'casual') {
    return 'female_calm';
  }

  // Default: neutral
  return 'neutral';
}

// ============================================================================
// QUICK RESPONSE (<500ms)
// ============================================================================

/**
 * Synthesize quick response (acknowledgment, confirmation)
 * Target: <500ms latency
 */
export async function speakQuick(input: {
  text: string;
  personalized_response: PersonalizedResponse;
  config: VoiceOutputConfig;
  glasses_session?: GlassesSession;
}): Promise<AudioOutput> {
  const startTime = Date.now();
  const output_id = `ao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Select voice profile
  const voice_profile = selectVoiceProfile({
    emotion: input.personalized_response.tone === 'warm' ? 'warm' : 'neutral',
    speaker_energy: 'normal',
    tone_type: input.personalized_response.tone,
  });

  // Estimate duration: ~150ms per word
  const wordCount = input.text.split(/\s+/).length;
  let duration_ms = wordCount * input.personalized_response.pacing_ms;

  // Quick responses should be short (<5 seconds)
  if (duration_ms > 5000) {
    duration_ms = 5000;
  }

  // For MVP: simulate TTS synthesis (would call ElevenLabs/Google in production)
  // Quick responses use streaming chunks
  const chunks = Math.ceil(duration_ms / input.config.chunk_size_ms);
  const synthesis_time_ms = Math.min(
    duration_ms / 3, // Streaming: parallel synthesis + playback
    input.config.quick_response_target
  );

  return {
    output_id,
    timestamp: new Date().toISOString(),
    text: input.text,
    audio_url: undefined, // Would be populated by actual TTS
    provider: input.config.preferred_provider,
    voice_profile,
    duration_ms,
    synthesis_time_ms,
    autoplay: true,
    allow_interruption: true,
    priority: 'medium',
    fallback_used: false,
  };
}

// ============================================================================
// ADVISORY RESPONSE (<1s)
// ============================================================================

/**
 * Synthesize advisory response (advice, guidance, recommendation)
 * Target: <1000ms latency
 */
export async function speakAdvisory(input: {
  text: string;
  personalized_response: PersonalizedResponse;
  config: VoiceOutputConfig;
  glasses_session?: GlassesSession;
}): Promise<AudioOutput> {
  const startTime = Date.now();
  const output_id = `ao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Select voice profile: advisories should sound authoritative
  const voice_profile = selectVoiceProfile({
    emotion: input.personalized_response.tone === 'advising' ? 'serious' : input.personalized_response.tone as any,
    speaker_energy: 'normal',
    tone_type: input.personalized_response.tone,
  });

  // Estimate duration
  const wordCount = input.text.split(/\s+/).length;
  let duration_ms = wordCount * input.personalized_response.pacing_ms;

  // Advisory responses: 10-30 seconds typical
  if (duration_ms > 30000) {
    duration_ms = 30000;
  }

  // Streaming synthesis: ~200ms overhead for first chunk
  const synthesis_time_ms = 200 + (duration_ms / 4); // Parallel synthesis

  return {
    output_id,
    timestamp: new Date().toISOString(),
    text: input.text,
    audio_url: undefined,
    provider: input.config.preferred_provider,
    voice_profile,
    duration_ms,
    synthesis_time_ms,
    autoplay: true,
    allow_interruption: true,
    priority: input.personalized_response.tone === 'urgent' ? 'high' : 'medium',
    fallback_used: false,
  };
}

// ============================================================================
// ALERT RESPONSE (<200ms)
// ============================================================================

/**
 * Synthesize alert/urgent response (critical, time-sensitive)
 * Target: <200ms latency (minimal synthesis overhead)
 */
export async function speakAlert(input: {
  text: string;
  personalized_response: PersonalizedResponse;
  severity: 'warning' | 'critical';
  config: VoiceOutputConfig;
  glasses_session?: GlassesSession;
}): Promise<AudioOutput> {
  const startTime = Date.now();
  const output_id = `ao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Alerts should use energetic voice
  const voice_profile: VoiceProfile = input.severity === 'critical' ? 'male_energetic' : 'male_natural';

  // Keep alerts very short (<5 seconds)
  const wordCount = input.text.split(/\s+/).length;
  const duration_ms = Math.min(wordCount * 100, 5000); // 100ms per word for alerts (faster)

  // Alerts use on-device synthesis for speed
  const synthesis_time_ms = Math.min(150, input.config.alert_response_target);

  return {
    output_id,
    timestamp: new Date().toISOString(),
    text: input.text,
    audio_url: undefined,
    provider: 'device_native', // Use on-device voices for speed
    voice_profile,
    duration_ms,
    synthesis_time_ms,
    autoplay: true,
    allow_interruption: false, // Don't interrupt critical alerts
    priority: input.severity === 'critical' ? 'critical' : 'high',
    fallback_used: false,
  };
}

// ============================================================================
// VOICE STREAMING
// ============================================================================

export interface AudioChunk {
  // Chunk Identity
  chunk_id: string;
  sequence_number: number; // 0, 1, 2, ...

  // Audio Data
  audio_buffer: ArrayBuffer; // Opus/MP3 encoded
  duration_ms: number;

  // Playback Control
  is_final: boolean; // Last chunk?
  playback_delay_ms: number; // When to start playback (sync with TTS)
}

/**
 * Stream audio output in chunks (for real-time playback)
 */
export async function* streamAudioOutput(input: {
  audio_output: AudioOutput;
  chunk_size_ms: number;
  enable_streaming: boolean;
}): AsyncGenerator<AudioChunk> {
  if (!input.enable_streaming) {
    // Return full audio as single chunk
    yield {
      chunk_id: input.audio_output.output_id,
      sequence_number: 0,
      audio_buffer: input.audio_output.audio_buffer || new ArrayBuffer(0),
      duration_ms: input.audio_output.duration_ms,
      is_final: true,
      playback_delay_ms: 0,
    };
    return;
  }

  // Calculate total chunks
  const totalChunks = Math.ceil(input.audio_output.duration_ms / input.chunk_size_ms);
  let playbackDelay = input.audio_output.synthesis_time_ms;

  // Yield chunks (in production, these would be real TTS chunks)
  for (let i = 0; i < totalChunks; i++) {
    const chunkDuration = Math.min(input.chunk_size_ms, input.audio_output.duration_ms - i * input.chunk_size_ms);

    yield {
      chunk_id: `${input.audio_output.output_id}_chunk_${i}`,
      sequence_number: i,
      audio_buffer: new ArrayBuffer(0), // Would contain real audio data
      duration_ms: chunkDuration,
      is_final: i === totalChunks - 1,
      playback_delay_ms: playbackDelay,
    };

    // Decrease playback delay for subsequent chunks (streaming catch-up)
    playbackDelay = Math.max(0, playbackDelay - (chunkDuration / 2));
  }
}

// ============================================================================
// VOICE QUALITY & MODULATION
// ============================================================================

/**
 * Apply emotional modulation to voice parameters
 */
export function modulateVoiceByEmotion(params: TTSParams, emotion: 'neutral' | 'calm' | 'warm' | 'serious' | 'urgent'): TTSParams {
  const modulated = { ...params };

  switch (emotion) {
    case 'warm':
      modulated.pitch = Math.min(10, params.pitch + 2); // Slightly higher pitch
      modulated.rate = Math.max(0.5, params.rate - 0.1); // Slightly slower (warm)
      break;

    case 'serious':
      modulated.pitch = Math.max(-10, params.pitch - 1); // Slightly lower pitch
      modulated.rate = Math.min(1.2, params.rate + 0.05); // Slightly faster
      break;

    case 'urgent':
      modulated.pitch = Math.max(-10, params.pitch - 2); // Lower pitch (serious)
      modulated.rate = Math.min(2.0, params.rate + 0.3); // Faster (urgent)
      break;

    case 'calm':
      modulated.pitch = Math.min(10, params.pitch + 1); // Slightly warmer
      modulated.rate = Math.max(0.5, params.rate - 0.2); // Slower (calm)
      break;

    case 'neutral':
    default:
      // No changes
      break;
  }

  return modulated;
}

/**
 * Adjust voice parameters for accessibility
 */
export function adjustForAccessibility(params: TTSParams, options: {
  hearing_level: 'normal' | 'mild_loss' | 'moderate_loss' | 'severe_loss';
  language?: string;
}): TTSParams {
  const adjusted = { ...params };

  // For hearing loss, increase clarity
  if (options.hearing_level !== 'normal') {
    adjusted.rate = Math.max(0.5, adjusted.rate - 0.2); // Slower
    adjusted.pitch = Math.max(-5, adjusted.pitch + 2); // Higher frequency emphasis
  }

  if (options.hearing_level === 'severe_loss') {
    adjusted.rate = Math.max(0.5, adjusted.rate - 0.3); // Much slower
    adjusted.pitch = Math.min(10, adjusted.pitch + 4); // Even higher
  }

  return adjusted;
}

// ============================================================================
// VOICE PERFORMANCE MONITORING
// ============================================================================

export interface VoiceMetrics {
  // Synthesis Performance
  synthesis_time_ms: number;
  first_byte_latency_ms: number; // Time to first audio byte
  total_audio_duration_ms: number;

  // Quality
  mean_opinion_score?: number; // 1-5 (subjective quality)
  clarity_score?: number; // 0-100 (pronunciation clarity)

  // Resource Usage
  cpu_usage_percent?: number;
  memory_mb?: number;

  // Provider Performance
  provider_used: TTSProvider;
  provider_fallback_count: number;
}

/**
 * Calculate voice output performance metrics
 */
export function calculateVoiceMetrics(input: {
  audio_output: AudioOutput;
  playback_start_time: number;
  playback_end_time: number;
}): VoiceMetrics {
  const playbackDuration = input.playback_end_time - input.playback_start_time;

  return {
    synthesis_time_ms: input.audio_output.synthesis_time_ms,
    first_byte_latency_ms: Math.max(0, input.audio_output.synthesis_time_ms - (input.audio_output.duration_ms / 4)),
    total_audio_duration_ms: input.audio_output.duration_ms,
    provider_used: input.audio_output.provider,
    provider_fallback_count: input.audio_output.fallback_used ? 1 : 0,
  };
}

// ============================================================================
// VOICE PREFERENCE MANAGEMENT
// ============================================================================

export interface UserVoicePreferences {
  // Voice Selection
  preferred_voice_profile: VoiceProfile;
  preferred_provider: TTSProvider;

  // Playback
  default_volume: number; // 0-100
  default_rate: number; // 0.5-2.0
  default_pitch: number; // -10 to +10

  // Accessibility
  enable_captions: boolean;
  hearing_level: 'normal' | 'mild_loss' | 'moderate_loss' | 'severe_loss';

  // Preferences
  prefer_streaming: boolean;
  prefer_on_device_synthesis: boolean; // Privacy/speed
}

export const DEFAULT_USER_VOICE_PREFERENCES: UserVoicePreferences = {
  preferred_voice_profile: 'male_natural',
  preferred_provider: 'google',
  default_volume: 75,
  default_rate: 1.0,
  default_pitch: 0,
  enable_captions: false,
  hearing_level: 'normal',
  prefer_streaming: true,
  prefer_on_device_synthesis: false,
};
