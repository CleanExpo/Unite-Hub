/**
 * Veo Video Generation Module
 *
 * Google Veo models for professional video generation.
 * Designed for restoration industry explainer videos, training content,
 * and educational materials.
 *
 * @see https://ai.google.dev/gemini-api/docs/video
 */

export {
  // Client
  getVeoClient,
  createVeoClient,

  // Core Functions
  generateVideo,
  generateVideoFromImage,
  extendVideo,
  interpolateVideo,

  // Utilities
  calculateVideoCost,
  validatePrompt,
  buildExplainerPrompt,

  // Types
  type VeoModel,
  type AspectRatio,
  type Resolution,
  type Duration,
  type PersonGeneration,
  type VeoReferenceImage,
  type VeoVideoOptions,
  type VeoVideoResult,
  type VeoImageToVideoOptions,
  type VeoExtendOptions,
  type VeoOperationVideo,
  type VeoOperation,
} from "./video-client";
