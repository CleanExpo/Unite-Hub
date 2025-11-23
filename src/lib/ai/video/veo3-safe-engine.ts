/**
 * Veo 3 Safe Video Engine
 * Phase 35: Integrity Framework
 *
 * Safety-first video concept generation with honesty filters
 */

export interface VideoConceptRequest {
  prompt: string;
  duration?: number; // seconds
  style?: "professional" | "casual" | "cinematic";
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export interface VideoConceptResult {
  id: string;
  status: "generated" | "failed";
  conceptUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  model: "veo3";
  disclaimer: string;
  generatedAt: string;
  metadata: Record<string, unknown>;
}

// Safety rules that all video concepts must follow
const SAFETY_RULES = {
  noImpersonation: true,
  noFakeTestimonials: true,
  noFabricatedSuccessStories: true,
  labelRequired: "AI Concept Video (Not a final production)",
  approvalRequired: true,
};

// Blocked content patterns
const BLOCKED_PATTERNS = [
  /testimonial/i,
  /customer review/i,
  /case study/i,
  /guaranteed results/i,
  /real client/i,
  /actual footage/i,
  /before and after/i,
  /success story/i,
  /revenue increase/i,
  /ranking improvement/i,
];

/**
 * Validate prompt against safety rules
 */
function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        valid: false,
        reason: `Prompt contains blocked content: "${pattern.source}"`,
      };
    }
  }

  return { valid: true };
}

/**
 * Generate a video concept (concept only, not production)
 */
export async function generateVideoConcept(
  request: VideoConceptRequest
): Promise<VideoConceptResult> {
  // Validate prompt
  const validation = validatePrompt(request.prompt);
  if (!validation.valid) {
    return {
      id: crypto.randomUUID(),
      status: "failed",
      duration: 0,
      model: "veo3",
      disclaimer: SAFETY_RULES.labelRequired,
      generatedAt: new Date().toISOString(),
      metadata: {
        error: validation.reason,
        safetyRulesApplied: SAFETY_RULES,
      },
    };
  }

  // In production, this would call the Veo 3 API
  // For now, return a placeholder result
  const conceptId = crypto.randomUUID();

  return {
    id: conceptId,
    status: "generated",
    conceptUrl: `/api/video-concepts/${conceptId}`,
    thumbnailUrl: `/api/video-concepts/${conceptId}/thumbnail`,
    duration: request.duration || 15,
    model: "veo3",
    disclaimer: SAFETY_RULES.labelRequired,
    generatedAt: new Date().toISOString(),
    metadata: {
      prompt: request.prompt,
      style: request.style || "professional",
      aspectRatio: request.aspectRatio || "16:9",
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
