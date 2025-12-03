/**
 * Gemini Image Generation Module
 *
 * Provides image generation capabilities using Google Gemini models.
 * Replaces DALL-E for better text rendering, grounding, and higher resolution.
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */

export {
  // Client
  getGeminiImageClient,
  createGeminiImageClient,

  // Core Functions
  generateImage,
  editImage,
  generateWithGrounding,
  startImageChat,

  // Utilities
  calculateImageCost,
  validatePrompt,
  convertDalleSizeToAspectRatio,
  getResolutionDimensions,

  // Types
  type GeminiImageModel,
  type AspectRatio,
  type ImageSize,
  type GeminiImageOptions,
  type GeminiImageResult,
  type GeminiEditOptions,
  type GeminiImageChat,
} from "./image-client";
