/**
 * ElevenLabs Safe Audio Engine
 * Phase 35: Integrity Framework
 *
 * Safety-first voice generation with honesty filters
 */

export interface VoiceConceptRequest {
  text: string;
  voiceId?: string;
  voiceStyle?: "professional" | "friendly" | "energetic";
}

export interface VoiceConceptResult {
  id: string;
  status: "generated" | "failed";
  audioUrl?: string;
  duration: number;
  model: "elevenlabs";
  disclaimer: string;
  generatedAt: string;
  metadata: Record<string, unknown>;
}

// Safety rules for voice generation
const SAFETY_RULES = {
  noImpersonation: true,
  noFakeTestimonials: true,
  labelRequired: "AI-generated demo voice only",
  approvalRequired: true,
};

// Blocked content patterns for audio
const BLOCKED_PATTERNS = [
  /I am a real customer/i,
  /I personally recommend/i,
  /testimonial/i,
  /guaranteed results/i,
  /my experience with/i,
  /this product changed my life/i,
  /I made \$[\d,]+/i,
  /100% satisfaction/i,
];

/**
 * Validate text against safety rules
 */
function validateText(text: string): { valid: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        valid: false,
        reason: `Text contains blocked content: "${pattern.source}"`,
      };
    }
  }

  return { valid: true };
}

/**
 * Generate a voice concept (demo only, not production)
 */
export async function generateVoiceConcept(
  request: VoiceConceptRequest
): Promise<VoiceConceptResult> {
  // Validate text
  const validation = validateText(request.text);
  if (!validation.valid) {
    return {
      id: crypto.randomUUID(),
      status: "failed",
      duration: 0,
      model: "elevenlabs",
      disclaimer: SAFETY_RULES.labelRequired,
      generatedAt: new Date().toISOString(),
      metadata: {
        error: validation.reason,
        safetyRulesApplied: SAFETY_RULES,
      },
    };
  }

  // In production, this would call the ElevenLabs API
  // For now, return a placeholder result
  const conceptId = crypto.randomUUID();

  // Estimate duration (rough: ~150 words per minute)
  const wordCount = request.text.split(/\s+/).length;
  const estimatedDuration = Math.ceil((wordCount / 150) * 60);

  return {
    id: conceptId,
    status: "generated",
    audioUrl: `/api/audio-concepts/${conceptId}`,
    duration: estimatedDuration,
    model: "elevenlabs",
    disclaimer: SAFETY_RULES.labelRequired,
    generatedAt: new Date().toISOString(),
    metadata: {
      text: request.text,
      voiceStyle: request.voiceStyle || "professional",
      wordCount,
      safetyRulesApplied: SAFETY_RULES,
      requiresApproval: true,
    },
  };
}

/**
 * Get safety rules for display
 */
export function getSafetyRules() {
  return SAFETY_RULES;
}

/**
 * Get the required disclaimer text
 */
export function getDisclaimerText(): string {
  return SAFETY_RULES.labelRequired;
}
