/**
 * Phase 11 – Wake Window Engine
 *
 * Always-on wake-word detection with micro-listening windows.
 * - Detects wake word ("Hey Phill", "Phill", etc.)
 * - Captures 3-8 second audio slice around trigger
 * - Processes locally with Whisper-small
 * - Deletes raw audio immediately after transcription
 * - Returns compressed context packet for cloud reasoning
 *
 * Battery profile: 2%/hour (always-on listening)
 * Phase 8 compliance: NO continuous recording
 */

// ============================================================================
// WAKE WINDOW EVENT
// ============================================================================

export interface WakeWindowEvent {
  id: string;
  timestamp: string;
  trigger_type: 'wake_word' | 'tap_glasses' | 'manual_trigger';
  wake_word_detected: string; // "hey phill", "phill", etc.
  confidence: number; // 0-1, wake word confidence
  audio_duration_ms: number; // 3000-8000ms window
  transcript: string;
  raw_audio_deleted: boolean;
  compression_status: 'pending' | 'compressed' | 'failed';
  context_packet?: ContextPacket;
  processing_time_ms: number;
  battery_drain_percent?: number;
}

export interface ContextPacket {
  timestamp: string;
  transcript: string;
  intent_tags: string[];
  domain: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  summary: string; // < 200 chars
  cognitive_state?: string;
  life_signal_state?: Record<string, unknown>;
  embedding?: number[]; // For semantic search
  metadata: {
    wake_word: string;
    confidence: number;
    duration_ms: number;
    processing_time_ms: number;
    device_battery_percent?: number;
  };
}

// ============================================================================
// WAKE WORD DETECTION
// ============================================================================

const REGISTERED_WAKE_WORDS = [
  'hey phill',
  'phill',
  'okay phill',
  'hey buddy',
];

/**
 * Detect wake word in audio stream
 * In production: runs on-device ML model (TensorFlow Lite)
 * For MVP: keyword matching simulation
 */
export function detectWakeWord(audioChunk: Float32Array): {
  detected: boolean;
  wake_word?: string;
  confidence: number;
} {
  // In production: Use WebAudio API + on-device ML model
  // For MVP: Simulate detection
  const simulated = Math.random() > 0.95; // 5% detection rate simulation

  if (simulated) {
    return {
      detected: true,
      wake_word: REGISTERED_WAKE_WORDS[0],
      confidence: 0.92,
    };
  }

  return {
    detected: false,
    confidence: 0,
  };
}

/**
 * Capture micro-window around wake-word trigger
 * Standard: 3-8 seconds of audio
 */
export interface AudioMicroWindow {
  start_ms: number; // When capture started relative to trigger
  duration_ms: number; // 3000-8000ms
  sample_rate: number; // 16000 Hz
  audio_data: Float32Array;
  trigger_position_ms: number; // Where in the window was trigger detected
}

export function captureMicroWindow(
  trigger_time_ms: number,
  audioBuffer: Float32Array,
  sampleRate: number
): AudioMicroWindow {
  // Capture 1.5s before trigger + 4.5s after = 6s total
  const pre_trigger_samples = sampleRate * 1.5; // 1.5s before
  const post_trigger_samples = sampleRate * 4.5; // 4.5s after

  const start_sample = Math.max(0, trigger_time_ms * (sampleRate / 1000) - pre_trigger_samples);
  const end_sample = Math.min(
    audioBuffer.length,
    trigger_time_ms * (sampleRate / 1000) + post_trigger_samples
  );

  const window_data = audioBuffer.slice(start_sample, end_sample);

  return {
    start_ms: (start_sample / sampleRate) * 1000,
    duration_ms: (window_data.length / sampleRate) * 1000,
    sample_rate: sampleRate,
    audio_data: window_data,
    trigger_position_ms: (trigger_time_ms - (start_sample / sampleRate) * 1000),
  };
}

// ============================================================================
// LOCAL TRANSCRIPTION (Whisper Small)
// ============================================================================

/**
 * Transcribe audio micro-window using local Whisper-small model
 * In production: runs on device (WebAssembly or native)
 * For MVP: simulated transcription
 */
export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  language: string;
  processing_time_ms: number;
}

export async function transcribeMicroWindow(
  audioWindow: AudioMicroWindow
): Promise<TranscriptionResult> {
  const startTime = Date.now();

  // In production: Call local Whisper-small model
  // For MVP: Simulate with mock data
  const mockTranscripts = [
    'remind me to call the team about the product roadmap',
    'what are my goals for this week',
    'how am i feeling today',
    'create a draft email to investors',
    'schedule a meeting with the design team',
  ];

  const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];

  return {
    transcript,
    confidence: 0.94,
    language: 'en',
    processing_time_ms: Date.now() - startTime,
  };
}

// ============================================================================
// RAW AUDIO DELETION
// ============================================================================

/**
 * Securely delete raw audio buffer
 * Ensures Phase 8 compliance: no continuous recording
 */
export function deleteRawAudio(audioBuffer: Float32Array): boolean {
  try {
    // Overwrite with zeros before deletion
    for (let i = 0; i < audioBuffer.length; i++) {
      audioBuffer[i] = 0;
    }
    // In production: notify OS to securely erase memory
    return true;
  } catch (error) {
    console.error('Failed to delete raw audio:', error);
    return false;
  }
}

// ============================================================================
// WAKE WINDOW EVENT CREATION
// ============================================================================

/**
 * Create a complete wake window event from trigger to context packet
 */
export async function processWakeWindow(input: {
  trigger_type: 'wake_word' | 'tap_glasses' | 'manual_trigger';
  wake_word_detected: string;
  wake_word_confidence: number;
  audio_micro_window: AudioMicroWindow;
}): Promise<WakeWindowEvent> {
  const startProcessing = Date.now();

  // Step 1: Transcribe
  const transcription = await transcribeMicroWindow(input.audio_micro_window);

  // Step 2: Delete raw audio
  const deleted = deleteRawAudio(input.audio_micro_window.audio_data);

  // Step 3: Extract intent tags
  const intentTags = extractIntentTags(transcription.transcript);

  // Step 4: Classify domain
  const domain = classifyDomain(transcription.transcript);

  // Step 5: Score priority
  const priority = scorePriority(transcription.transcript, intentTags);

  // Step 6: Create summary
  const summary = createSummary(transcription.transcript);

  // Step 7: Create context packet
  const contextPacket: ContextPacket = {
    timestamp: new Date().toISOString(),
    transcript: transcription.transcript,
    intent_tags: intentTags,
    domain,
    priority,
    summary,
    metadata: {
      wake_word: input.wake_word_detected,
      confidence: input.wake_word_confidence,
      duration_ms: input.audio_micro_window.duration_ms,
      processing_time_ms: Date.now() - startProcessing,
    },
  };

  return {
    id: `wake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    trigger_type: input.trigger_type,
    wake_word_detected: input.wake_word_detected,
    confidence: input.wake_word_confidence,
    audio_duration_ms: input.audio_micro_window.duration_ms,
    transcript: transcription.transcript,
    raw_audio_deleted: deleted,
    compression_status: 'compressed',
    context_packet: contextPacket,
    processing_time_ms: Date.now() - startProcessing,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractIntentTags(transcript: string): string[] {
  const lowerTranscript = transcript.toLowerCase();
  const tags: string[] = [];

  // Intent detection
  if (lowerTranscript.includes('remind')) {
tags.push('reminder');
}
  if (lowerTranscript.includes('remind') || lowerTranscript.includes('email')) {
tags.push('task');
}
  if (lowerTranscript.includes('what') || lowerTranscript.includes('how')) {
tags.push('query');
}
  if (lowerTranscript.includes('create') || lowerTranscript.includes('draft')) {
tags.push('draft');
}
  if (lowerTranscript.includes('schedule') || lowerTranscript.includes('meeting')) {
tags.push('schedule');
}
  if (lowerTranscript.includes('goal') || lowerTranscript.includes('progress')) {
tags.push('goal_check');
}

  return tags.length > 0 ? tags : ['general'];
}

function classifyDomain(transcript: string): string {
  const lowerTranscript = transcript.toLowerCase();

  if (lowerTranscript.includes('product') || lowerTranscript.includes('feature')) {
return 'product';
}
  if (lowerTranscript.includes('budget') || lowerTranscript.includes('spend')) {
return 'financial';
}
  if (lowerTranscript.includes('team') || lowerTranscript.includes('hiring')) {
return 'operational';
}
  if (lowerTranscript.includes('goal') || lowerTranscript.includes(' okr')) {
return 'strategic';
}
  if (lowerTranscript.includes('health') || lowerTranscript.includes('feeling')) {
return 'personal';
}
  if (lowerTranscript.includes('email') || lowerTranscript.includes('message')) {
return 'communication';
}

  return 'general';
}

function scorePriority(
  transcript: string,
  intentTags: string[]
): 'low' | 'medium' | 'high' | 'critical' {
  const lowerTranscript = transcript.toLowerCase();

  if (lowerTranscript.includes('urgent') || lowerTranscript.includes('asap')) {
return 'critical';
}
  if (intentTags.includes('reminder') || intentTags.includes('task')) {
return 'high';
}
  if (intentTags.includes('query') || intentTags.includes('draft')) {
return 'medium';
}

  return 'low';
}

function createSummary(transcript: string): string {
  // Truncate to <200 chars and make summary-like
  if (transcript.length <= 200) {
return transcript;
}
  return transcript.substring(0, 197) + '...';
}
