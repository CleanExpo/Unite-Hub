/**
 * ElevenLabs Bridge
 * Phase 38: Visual Orchestration Layer
 *
 * Provide optional AI voice-over for explainer content
 */

export interface ElevenLabsRequest {
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  metadata?: Record<string, unknown>;
}

export interface ElevenLabsResult {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  error?: string;
  disclaimer: string;
}

// Blocked content patterns
const BLOCKED_PATTERNS = [
  /impersonation/i,
  /real person/i,
  /celebrity/i,
  /testimonial/i,
  /guarantee/i,
  /results claim/i,
  /revenue/i,
  /profit/i,
  /customer said/i,
  /client review/i,
];

// Allowed voice-over types
const ALLOWED_CONTENT_TYPES = [
  "introduction",
  "explanation",
  "navigation",
  "tutorial",
  "overview",
  "welcome",
];

/**
 * Validate text for safe content
 */
function validateText(text: string): { valid: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        valid: false,
        reason: `Voice content blocked: ${pattern.source}`,
      };
    }
  }
  return { valid: true };
}

/**
 * Generate voice-over audio
 */
export async function generateVoiceOver(
  request: ElevenLabsRequest
): Promise<ElevenLabsResult> {
  const { text, voiceId = "default", stability = 0.5, similarityBoost = 0.75 } = request;

  // Validate
  const validation = validateText(text);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason,
      disclaimer: "Voice generation blocked due to content safety.",
    };
  }

  // Estimate duration (rough: ~150 words per minute)
  const wordCount = text.split(/\s+/).length;
  const estimatedDuration = Math.ceil((wordCount / 150) * 60);

  // In production, this would call the ElevenLabs API
  // For now, return a placeholder
  const placeholderUrl = `/api/visual/placeholder?model=elevenlabs&voice=${voiceId}`;

  return {
    success: true,
    audioUrl: placeholderUrl,
    duration: estimatedDuration,
    disclaimer: `AI-generated voice by ElevenLabs. This is a synthetic voice - not a real person. For internal preview only.`,
  };
}

/**
 * Generate introduction voice-over
 */
export async function generateIntroduction(
  text: string,
  voiceId?: string
): Promise<ElevenLabsResult> {
  const introText = `Welcome. ${text}`;
  return generateVoiceOver({
    text: introText,
    voiceId,
    stability: 0.6,
    similarityBoost: 0.8,
  });
}

/**
 * Generate tutorial narration
 */
export async function generateTutorialNarration(
  steps: string[],
  voiceId?: string
): Promise<ElevenLabsResult> {
  const narrationText = steps
    .map((step, i) => `Step ${i + 1}: ${step}`)
    .join(". ");

  return generateVoiceOver({
    text: narrationText,
    voiceId,
    stability: 0.7,
    similarityBoost: 0.7,
  });
}

export default {
  generateVoiceOver,
  generateIntroduction,
  generateTutorialNarration,
};
