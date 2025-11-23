/**
 * Visual Orchestrator
 * Phase 38: Visual Orchestration Layer
 *
 * Top-level orchestrator for AI visual generation
 * Decides when and how to use different models
 */

import { createVisualAsset, addVariant, AssetType } from "@/lib/services/visualAssetService";
import { logEvent } from "@/lib/services/aiEventLogService";

export type OrchestrationMode = "auto_baseline" | "semi_auto_refine" | "voice_triggered";

export interface GenerationRequest {
  clientId: string;
  context: string;
  type: AssetType;
  prompt: string;
  mode: OrchestrationMode;
  style?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerationResult {
  success: boolean;
  assetId?: string;
  assetUrl?: string;
  thumbnailUrl?: string;
  modelUsed: string;
  error?: string;
  disclaimer: string;
}

// Model selection based on context and type
const MODEL_SELECTION: Record<string, Record<AssetType, string>> = {
  overview: {
    image: "nano_banana_2",
    video: "veo3",
    graph: "chartjs",
  },
  visual_playground: {
    image: "dalle_3",
    video: "veo3",
    graph: "chartjs",
  },
  roadmap: {
    image: "nano_banana_2",
    video: "veo3",
    graph: "chartjs",
  },
  enhancements: {
    image: "nano_banana_2",
    video: "veo3",
    graph: "chartjs",
  },
  default: {
    image: "nano_banana_2",
    video: "veo3",
    graph: "chartjs",
  },
};

/**
 * Select appropriate model for the request
 */
function selectModel(context: string, type: AssetType): string {
  const contextModels = MODEL_SELECTION[context] || MODEL_SELECTION.default;
  return contextModels[type];
}

/**
 * Main orchestration function
 */
export async function orchestrateVisualGeneration(
  request: GenerationRequest
): Promise<GenerationResult> {
  const { clientId, context, type, prompt, mode, style, metadata } = request;

  // Select model
  const modelUsed = selectModel(context, type);

  // Validate prompt for safety
  const validation = validatePrompt(prompt);
  if (!validation.valid) {
    return {
      success: false,
      modelUsed,
      error: validation.reason,
      disclaimer: "Generation blocked due to safety guidelines.",
    };
  }

  try {
    // Create the visual asset record
    const asset = await createVisualAsset(
      clientId,
      context,
      type,
      modelUsed,
      `${type} for ${context}`,
      prompt,
      { mode, style, ...metadata }
    );

    if (!asset) {
      return {
        success: false,
        modelUsed,
        error: "Failed to create asset record",
        disclaimer: "AI-generated concept - review required before use.",
      };
    }

    // In production, this would call the actual AI model
    // For now, we create a placeholder that indicates generation is pending
    const placeholderUrl = generatePlaceholderUrl(type, context);

    // Log the orchestration event
    await logEvent(
      clientId,
      modelUsed,
      "image_generated",
      `Visual ${type} orchestrated for ${context}`,
      {
        assetId: asset.id,
        mode,
        prompt: prompt.substring(0, 100),
      }
    );

    return {
      success: true,
      assetId: asset.id,
      assetUrl: placeholderUrl,
      thumbnailUrl: placeholderUrl,
      modelUsed,
      disclaimer: getDisclaimer(modelUsed, type),
    };
  } catch (error) {
    console.error("Orchestration error:", error);
    return {
      success: false,
      modelUsed,
      error: "Orchestration failed",
      disclaimer: "AI-generated concept - review required before use.",
    };
  }
}

/**
 * Generate variant using a different model or style
 */
export async function generateVariant(
  assetId: string,
  clientId: string,
  variantLabel: string,
  modelOverride?: string
): Promise<GenerationResult> {
  const modelUsed = modelOverride || "nano_banana_2";

  try {
    const variant = await addVariant(
      assetId,
      modelUsed,
      variantLabel,
      generatePlaceholderUrl("image", variantLabel),
      { generatedAt: new Date().toISOString() }
    );

    if (!variant) {
      return {
        success: false,
        modelUsed,
        error: "Failed to create variant",
        disclaimer: "AI-generated concept variant.",
      };
    }

    await logEvent(
      clientId,
      modelUsed,
      "image_generated",
      `Variant generated: ${variantLabel}`,
      { assetId, variantId: variant.id }
    );

    return {
      success: true,
      assetId: variant.id,
      modelUsed,
      disclaimer: getDisclaimer(modelUsed, "image"),
    };
  } catch (error) {
    console.error("Variant generation error:", error);
    return {
      success: false,
      modelUsed,
      error: "Variant generation failed",
      disclaimer: "AI-generated concept variant.",
    };
  }
}

// Validation patterns (reusing from safe engines)
const BLOCKED_PATTERNS = [
  /testimonial/i,
  /guaranteed results/i,
  /success story/i,
  /revenue increase/i,
  /profit boost/i,
  /real person/i,
  /actual client/i,
  /before and after/i,
  /trademarked/i,
  /brand logo/i,
];

function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        valid: false,
        reason: `Prompt contains blocked content: ${pattern.source}`,
      };
    }
  }
  return { valid: true };
}

function generatePlaceholderUrl(type: AssetType, context: string): string {
  // Placeholder URLs for development
  const baseUrl = "/api/visual/placeholder";
  return `${baseUrl}?type=${type}&context=${encodeURIComponent(context)}`;
}

function getDisclaimer(model: string, type: AssetType): string {
  const modelNames: Record<string, string> = {
    nano_banana_2: "Nano Banana 2",
    dalle_3: "DALL-E 3",
    veo3: "Gemini VEO 3",
    elevenlabs: "ElevenLabs",
    chartjs: "ChartJS",
  };

  const modelName = modelNames[model] || model;

  if (type === "video") {
    return `AI-generated concept video by ${modelName}. This is a preview only - not for client-facing use without approval.`;
  }

  if (type === "graph") {
    return `Data visualization generated by ${modelName}. Values are illustrative.`;
  }

  return `AI-generated concept visual by ${modelName}. This is a preview only - not for client-facing use without approval.`;
}

export default {
  orchestrateVisualGeneration,
  generateVariant,
};
