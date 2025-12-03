/**
 * Gemini Image Generation Client
 *
 * Replaces DALL-E with Google Gemini image models for:
 * - Better text rendering in images (logos, diagrams, marketing)
 * - Google Search grounding for factual accuracy
 * - Multi-turn editing with context preservation
 * - Higher resolution output (up to 4K)
 *
 * Models:
 * - gemini-2.5-flash-image: Fast, efficient for high-volume tasks
 * - gemini-3-pro-image-preview: Professional quality with grounding
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */

import { GoogleGenAI } from "@google/genai";

// ============================================
// Types
// ============================================

export type GeminiImageModel = "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";

export type AspectRatio =
  | "1:1"
  | "2:3"
  | "3:2"
  | "3:4"
  | "4:3"
  | "4:5"
  | "5:4"
  | "9:16"
  | "16:9"
  | "21:9";

export type ImageSize = "1K" | "2K" | "4K";

export interface GeminiImageOptions {
  /** Model to use - fast or professional */
  model?: GeminiImageModel;
  /** Aspect ratio for the image */
  aspectRatio?: AspectRatio;
  /** Output resolution (professional model only) */
  imageSize?: ImageSize;
  /** Enable Google Search grounding for factual accuracy */
  enableGrounding?: boolean;
}

export interface GeminiImageResult {
  /** Base64 image data */
  image: Buffer;
  /** MIME type of the image */
  mimeType: string;
  /** Text response from the model (if any) */
  text: string | null;
  /** Grounding metadata (if grounding enabled) */
  groundingMetadata: Record<string, unknown> | null;
  /** Revised/enhanced prompt used */
  revisedPrompt?: string;
  /** Model used for generation */
  model: GeminiImageModel;
}

export interface GeminiEditOptions extends GeminiImageOptions {
  /** The original image to edit (base64 or Buffer) */
  originalImage: string | Buffer;
  /** MIME type of the original image */
  originalMimeType?: string;
}

export interface GeminiImageChat {
  /** Send a message and receive image/text response */
  sendMessage: (
    message: string,
    options?: Partial<GeminiImageOptions>
  ) => Promise<GeminiImageResult>;
  /** Get conversation history */
  getHistory: () => Array<{ role: string; content: string }>;
}

// ============================================
// Client
// ============================================

let geminiClient: GoogleGenAI | null = null;

/**
 * Get or create the Gemini client
 */
export function getGeminiImageClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable is not set"
      );
    }

    geminiClient = new GoogleGenAI({ apiKey });
  }

  return geminiClient;
}

/**
 * Create a new Gemini Image client instance
 * Useful for testing or custom configurations
 */
export function createGeminiImageClient(apiKey?: string): GoogleGenAI {
  const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!key) {
    throw new Error("API key is required");
  }

  return new GoogleGenAI({ apiKey: key });
}

// ============================================
// Core Functions
// ============================================

/**
 * Generate an image from a text prompt
 *
 * @example
 * // Basic generation with fast model
 * const result = await generateImage("A sunset over mountains");
 *
 * @example
 * // Professional quality with 4K and grounding
 * const result = await generateImage("Infographic about renewable energy in 2024", {
 *   model: "gemini-3-pro-image-preview",
 *   imageSize: "4K",
 *   aspectRatio: "16:9",
 *   enableGrounding: true
 * });
 */
export async function generateImage(
  prompt: string,
  options: GeminiImageOptions = {}
): Promise<GeminiImageResult> {
  const client = getGeminiImageClient();

  const {
    model = "gemini-2.5-flash-image",
    aspectRatio = "1:1",
    imageSize = "1K",
    enableGrounding = false,
  } = options;

  // Build config based on model
  const config: Record<string, unknown> = {
    responseModalities: ["TEXT", "IMAGE"],
  };

  // Add image config for aspect ratio and size
  if (model === "gemini-3-pro-image-preview") {
    config.imageConfig = {
      aspectRatio,
      imageSize, // Must be uppercase: 1K, 2K, 4K
    };

    // Add grounding tools for professional model
    if (enableGrounding) {
      config.tools = [{ googleSearch: {} }];
    }
  } else {
    // gemini-2.5-flash-image only supports aspect ratio
    config.imageConfig = {
      aspectRatio,
    };
  }

  try {
    const response = await client.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config,
    });

    return parseImageResponse(response, model);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Gemini image generation error:", errorMessage);
    throw new Error(`Failed to generate image: ${errorMessage}`);
  }
}

/**
 * Edit an existing image with a text instruction
 *
 * @example
 * const result = await editImage(originalImageBuffer, "Add a rainbow to the sky", {
 *   model: "gemini-2.5-flash-image"
 * });
 */
export async function editImage(
  image: string | Buffer,
  instructions: string,
  options: Omit<GeminiEditOptions, "originalImage"> = {}
): Promise<GeminiImageResult> {
  const client = getGeminiImageClient();

  const {
    model = "gemini-2.5-flash-image",
    aspectRatio = "1:1",
    imageSize = "1K",
    originalMimeType = "image/png",
  } = options;

  // Convert Buffer to base64 if needed
  const base64Image = Buffer.isBuffer(image) ? image.toString("base64") : image;

  // Build config
  const config: Record<string, unknown> = {
    responseModalities: ["TEXT", "IMAGE"],
  };

  if (model === "gemini-3-pro-image-preview") {
    config.imageConfig = {
      aspectRatio,
      imageSize,
    };
  } else {
    config.imageConfig = {
      aspectRatio,
    };
  }

  try {
    const response = await client.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: instructions },
            {
              inlineData: {
                mimeType: originalMimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config,
    });

    return parseImageResponse(response, model);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Gemini image edit error:", errorMessage);
    throw new Error(`Failed to edit image: ${errorMessage}`);
  }
}

/**
 * Generate image with Google Search grounding for factual accuracy
 * Only available with gemini-3-pro-image-preview
 *
 * @example
 * const result = await generateWithGrounding(
 *   "Create an infographic showing 2024 renewable energy statistics"
 * );
 */
export async function generateWithGrounding(
  prompt: string,
  options: Omit<GeminiImageOptions, "enableGrounding" | "model"> = {}
): Promise<GeminiImageResult> {
  return generateImage(prompt, {
    ...options,
    model: "gemini-3-pro-image-preview",
    enableGrounding: true,
  });
}

/**
 * Start a multi-turn image chat session
 * Maintains context across multiple edits
 *
 * @example
 * const chat = startImageChat({ model: "gemini-3-pro-image-preview" });
 * let result = await chat.sendMessage("Create a logo for TechStart company");
 * result = await chat.sendMessage("Make the colors more vibrant");
 * result = await chat.sendMessage("Add a tagline: Innovation First");
 */
export function startImageChat(options: GeminiImageOptions = {}): GeminiImageChat {
  const client = getGeminiImageClient();

  const {
    model = "gemini-3-pro-image-preview",
    aspectRatio = "1:1",
    imageSize = "1K",
    enableGrounding = false,
  } = options;

  // Build base config
  const baseConfig: Record<string, unknown> = {
    responseModalities: ["TEXT", "IMAGE"],
  };

  if (model === "gemini-3-pro-image-preview") {
    baseConfig.imageConfig = {
      aspectRatio,
      imageSize,
    };

    if (enableGrounding) {
      baseConfig.tools = [{ googleSearch: {} }];
    }
  }

  // Create chat session
  const chat = client.chats.create({
    model,
    config: baseConfig,
  });

  const history: Array<{ role: string; content: string }> = [];

  return {
    async sendMessage(
      message: string,
      messageOptions?: Partial<GeminiImageOptions>
    ): Promise<GeminiImageResult> {
      // Build message config with any overrides
      const messageConfig: Record<string, unknown> = {};

      if (messageOptions?.aspectRatio || messageOptions?.imageSize) {
        messageConfig.imageConfig = {
          aspectRatio: messageOptions.aspectRatio || aspectRatio,
          imageSize: messageOptions.imageSize || imageSize,
        };
      }

      history.push({ role: "user", content: message });

      const response = await chat.sendMessage({
        message,
        config: Object.keys(messageConfig).length > 0 ? messageConfig : undefined,
      });

      const result = parseImageResponse(response, model);

      history.push({ role: "model", content: result.text || "[Image generated]" });

      return result;
    },

    getHistory() {
      return [...history];
    },
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parse Gemini response and extract image/text data
 */
function parseImageResponse(
  response: unknown,
  model: GeminiImageModel
): GeminiImageResult {
  const typedResponse = response as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
          inlineData?: {
            mimeType: string;
            data: string;
          };
        }>;
      };
      groundingMetadata?: Record<string, unknown>;
    }>;
  };

  const candidate = typedResponse.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  let text: string | null = null;
  let image: Buffer | null = null;
  let mimeType = "image/png";

  for (const part of parts) {
    if (part.text) {
      text = part.text;
    } else if (part.inlineData) {
      image = Buffer.from(part.inlineData.data, "base64");
      mimeType = part.inlineData.mimeType;
    }
  }

  if (!image) {
    throw new Error("No image data in response");
  }

  return {
    image,
    mimeType,
    text,
    groundingMetadata: candidate?.groundingMetadata || null,
    model,
  };
}

/**
 * Calculate cost for Gemini image generation
 *
 * Pricing (as of 2024):
 * - gemini-2.5-flash-image: ~$0.02 per image (1K)
 * - gemini-3-pro-image-preview:
 *   - 1K: ~$0.04 per image
 *   - 2K: ~$0.08 per image
 *   - 4K: ~$0.16 per image
 */
export function calculateImageCost(
  count: number,
  model: GeminiImageModel = "gemini-2.5-flash-image",
  imageSize: ImageSize = "1K"
): number {
  let costPerImage = 0.02; // Default: flash 1K

  if (model === "gemini-2.5-flash-image") {
    costPerImage = 0.02;
  } else if (model === "gemini-3-pro-image-preview") {
    switch (imageSize) {
      case "1K":
        costPerImage = 0.04;
        break;
      case "2K":
        costPerImage = 0.08;
        break;
      case "4K":
        costPerImage = 0.16;
        break;
    }
  }

  return count * costPerImage;
}

/**
 * Validate image generation prompt
 * Similar to DALL-E validation but with Gemini-specific limits
 */
export function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, reason: "Prompt cannot be empty" };
  }

  // Gemini has a ~480 token limit for image prompts
  // Roughly 4 chars per token = ~1920 chars
  if (prompt.length > 2000) {
    return { valid: false, reason: "Prompt exceeds 2000 character limit" };
  }

  // Basic content filtering (Gemini has its own filtering)
  const bannedKeywords = ["violence", "gore", "explicit", "nsfw"];
  const lowerPrompt = prompt.toLowerCase();

  for (const keyword of bannedKeywords) {
    if (lowerPrompt.includes(keyword)) {
      return { valid: false, reason: `Prompt contains prohibited content: ${keyword}` };
    }
  }

  return { valid: true };
}

/**
 * Convert legacy DALL-E size to Gemini aspect ratio
 */
export function convertDalleSizeToAspectRatio(
  size: "1024x1024" | "1792x1024" | "1024x1792"
): AspectRatio {
  switch (size) {
    case "1024x1024":
      return "1:1";
    case "1792x1024":
      return "16:9";
    case "1024x1792":
      return "9:16";
    default:
      return "1:1";
  }
}

/**
 * Get actual resolution dimensions for an aspect ratio and size
 */
export function getResolutionDimensions(
  aspectRatio: AspectRatio,
  imageSize: ImageSize
): { width: number; height: number } {
  const resolutions: Record<ImageSize, Record<AspectRatio, { width: number; height: number }>> = {
    "1K": {
      "1:1": { width: 1024, height: 1024 },
      "2:3": { width: 848, height: 1264 },
      "3:2": { width: 1264, height: 848 },
      "3:4": { width: 896, height: 1200 },
      "4:3": { width: 1200, height: 896 },
      "4:5": { width: 928, height: 1152 },
      "5:4": { width: 1152, height: 928 },
      "9:16": { width: 768, height: 1376 },
      "16:9": { width: 1376, height: 768 },
      "21:9": { width: 1584, height: 672 },
    },
    "2K": {
      "1:1": { width: 2048, height: 2048 },
      "2:3": { width: 1696, height: 2528 },
      "3:2": { width: 2528, height: 1696 },
      "3:4": { width: 1792, height: 2400 },
      "4:3": { width: 2400, height: 1792 },
      "4:5": { width: 1856, height: 2304 },
      "5:4": { width: 2304, height: 1856 },
      "9:16": { width: 1536, height: 2752 },
      "16:9": { width: 2752, height: 1536 },
      "21:9": { width: 3168, height: 1344 },
    },
    "4K": {
      "1:1": { width: 4096, height: 4096 },
      "2:3": { width: 3392, height: 5056 },
      "3:2": { width: 5056, height: 3392 },
      "3:4": { width: 3584, height: 4800 },
      "4:3": { width: 4800, height: 3584 },
      "4:5": { width: 3712, height: 4608 },
      "5:4": { width: 4608, height: 3712 },
      "9:16": { width: 3072, height: 5504 },
      "16:9": { width: 5504, height: 3072 },
      "21:9": { width: 6336, height: 2688 },
    },
  };

  return resolutions[imageSize]?.[aspectRatio] || { width: 1024, height: 1024 };
}

// ============================================
// Exports
// ============================================

export default {
  getGeminiImageClient,
  createGeminiImageClient,
  generateImage,
  editImage,
  generateWithGrounding,
  startImageChat,
  calculateImageCost,
  validatePrompt,
  convertDalleSizeToAspectRatio,
  getResolutionDimensions,
};
