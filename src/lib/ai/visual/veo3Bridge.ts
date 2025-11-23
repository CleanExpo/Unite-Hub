/**
 * VEO 3 Bridge
 * Phase 38: Visual Orchestration Layer
 *
 * Generate short concept demo clips for features
 */

export interface Veo3Request {
  prompt: string;
  duration?: number; // 8-12 seconds recommended
  style?: "ui_demo" | "abstract_motion" | "explainer";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  metadata?: Record<string, unknown>;
}

export interface Veo3Result {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
  disclaimer: string;
}

// Blocked content patterns
const BLOCKED_PATTERNS = [
  /talking head/i,
  /testimonial/i,
  /real person/i,
  /celebrity/i,
  /before.?and.?after/i,
  /results claim/i,
  /revenue/i,
  /profit/i,
  /guaranteed/i,
];

/**
 * Validate prompt for safe content
 */
function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        valid: false,
        reason: `Video content blocked: ${pattern.source}`,
      };
    }
  }
  return { valid: true };
}

/**
 * Generate concept demo video
 */
export async function generateDemoVideo(
  request: Veo3Request
): Promise<Veo3Result> {
  const {
    prompt,
    duration = 10,
    style = "ui_demo",
    aspectRatio = "16:9",
  } = request;

  // Validate
  const validation = validatePrompt(prompt);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason,
      disclaimer: "Video generation blocked due to content safety.",
    };
  }

  // Ensure duration is within safe range
  const safeDuration = Math.min(Math.max(duration, 5), 15);

  // In production, this would call the Gemini VEO 3 API
  // For now, return a placeholder
  const placeholderUrl = `/api/visual/placeholder?model=veo3&style=${style}&duration=${safeDuration}`;

  return {
    success: true,
    videoUrl: placeholderUrl,
    thumbnailUrl: placeholderUrl,
    duration: safeDuration,
    disclaimer: `AI-generated concept video by Gemini VEO 3 (${safeDuration}s). This is a preview only - not for client-facing use without approval. No real people or testimonials.`,
  };
}

/**
 * Generate abstract motion graphic
 */
export async function generateMotionGraphic(
  prompt: string,
  duration?: number
): Promise<Veo3Result> {
  return generateDemoVideo({
    prompt: `Abstract motion graphic: ${prompt}. No people, no text, flowing shapes and colors.`,
    duration: duration || 8,
    style: "abstract_motion",
  });
}

/**
 * Generate UI demo clip
 */
export async function generateUIDemo(
  prompt: string,
  aspectRatio?: "16:9" | "9:16" | "1:1"
): Promise<Veo3Result> {
  return generateDemoVideo({
    prompt: `UI demonstration: ${prompt}. Clean interface, smooth transitions, no real data.`,
    duration: 12,
    style: "ui_demo",
    aspectRatio: aspectRatio || "16:9",
  });
}

export default {
  generateDemoVideo,
  generateMotionGraphic,
  generateUIDemo,
};
