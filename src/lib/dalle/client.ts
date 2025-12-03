import OpenAI from "openai";

/**
 * @deprecated This DALL-E client has been replaced with Gemini Image Generation.
 * Use `@/lib/gemini/image-client` instead for:
 * - Better text rendering in images
 * - Google Search grounding for factual accuracy
 * - Higher resolution output (up to 4K)
 * - Multi-turn image editing
 *
 * Migration guide:
 * - generateImage() → import { generateImage } from "@/lib/gemini/image-client"
 * - generateImageVariations() → Use generateImage() with loop
 * - calculateImageCost() → import { calculateImageCost } from "@/lib/gemini/image-client"
 * - validatePrompt() → import { validatePrompt } from "@/lib/gemini/image-client"
 *
 * This file is kept for backward compatibility with existing code that may
 * still reference it. New code should use the Gemini image client.
 *
 * @see src/lib/gemini/image-client.ts
 */

/**
 * DALL-E 3 Client for Unite-Hub
 * @deprecated Use @/lib/gemini/image-client instead
 *
 * Manages OpenAI DALL-E API integration for generating
 * marketing images, social media visuals, and brand concepts.
 */

let openaiClient: OpenAI | null = null;

export function getDalleClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

export interface DalleGenerateOptions {
  prompt: string;
  model?: "dall-e-3" | "dall-e-2";
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  n?: number; // Number of images (1 for DALL-E 3)
}

export interface DalleImageResult {
  url: string;
  revisedPrompt?: string;
  b64Json?: string;
}

/**
 * Generate image using DALL-E 3
 */
export async function generateImage(
  options: DalleGenerateOptions
): Promise<DalleImageResult> {
  const client = getDalleClient();

  try {
    const response = await client.images.generate({
      model: options.model || "dall-e-3",
      prompt: options.prompt,
      size: options.size || "1024x1024",
      quality: options.quality || "standard",
      style: options.style || "vivid",
      n: 1, // DALL-E 3 only supports 1
      response_format: "url",
    });

    const image = response.data[0];

    return {
      url: image.url!,
      revisedPrompt: image.revised_prompt,
    };
  } catch (error: any) {
    console.error("DALL-E generation error:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

/**
 * Generate multiple image variations
 * Uses sequential calls for DALL-E 3
 */
export async function generateImageVariations(
  basePrompt: string,
  count: number,
  options: Omit<DalleGenerateOptions, "prompt" | "n">
): Promise<DalleImageResult[]> {
  const results: DalleImageResult[] = [];

  // Add variation prompts to ensure diversity
  const variationPrompts = [
    basePrompt,
    `${basePrompt}, alternative composition`,
    `${basePrompt}, different angle`,
    `${basePrompt}, unique perspective`,
    `${basePrompt}, creative interpretation`,
  ];

  for (let i = 0; i < Math.min(count, variationPrompts.length); i++) {
    try {
      const result = await generateImage({
        ...options,
        prompt: variationPrompts[i],
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to generate variation ${i + 1}:`, error);
      // Continue generating other variations
    }
  }

  return results;
}

/**
 * Calculate cost for DALL-E image generation
 * Pricing as of 2024:
 * - DALL-E 3 Standard 1024x1024: $0.040
 * - DALL-E 3 Standard 1024x1792/1792x1024: $0.080
 * - DALL-E 3 HD 1024x1024: $0.080
 * - DALL-E 3 HD 1024x1792/1792x1024: $0.120
 */
export function calculateImageCost(
  count: number,
  size: string = "1024x1024",
  quality: string = "standard"
): number {
  let costPerImage = 0.04; // Default: standard 1024x1024

  if (quality === "hd") {
    costPerImage = size === "1024x1024" ? 0.08 : 0.12;
  } else {
    costPerImage = size === "1024x1024" ? 0.04 : 0.08;
  }

  return count * costPerImage;
}

/**
 * Validate DALL-E prompt
 * Ensures prompt meets OpenAI content policy
 */
export function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, reason: "Prompt cannot be empty" };
  }

  if (prompt.length > 4000) {
    return { valid: false, reason: "Prompt exceeds 4000 character limit" };
  }

  // Basic content filtering (OpenAI has its own filtering)
  const bannedKeywords = ["violence", "gore", "explicit", "nsfw"];
  const lowerPrompt = prompt.toLowerCase();

  for (const keyword of bannedKeywords) {
    if (lowerPrompt.includes(keyword)) {
      return { valid: false, reason: `Prompt contains prohibited content: ${keyword}` };
    }
  }

  return { valid: true };
}
