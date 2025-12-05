/**
 * Veo Video Generation Client
 *
 * Google Veo models for video generation:
 * - Restoration industry explainer videos
 * - Educational content with native audio
 * - Training materials for NRPG contractors
 *
 * Models:
 * - veo-3.1-generate-preview: Best quality, native audio, 720p/1080p
 * - veo-3.1-fast-generate-preview: Speed-optimized for iteration
 * - veo-3.0-generate-preview: Stable fallback with native audio
 * - veo-2.0-generate-001: GA model, no audio, lower cost
 *
 * @see https://ai.google.dev/gemini-api/docs/video
 */

import { GoogleGenAI } from "@google/genai";

// ============================================
// Types
// ============================================

export type VeoModel =
  | "veo-3.1-generate-preview"
  | "veo-3.1-fast-generate-preview"
  | "veo-3.0-generate-preview"
  | "veo-2.0-generate-001";

export type AspectRatio = "16:9" | "9:16";
export type Resolution = "720p" | "1080p";
export type Duration = 4 | 6 | 8;
export type PersonGeneration = "allow_all" | "allow_adult" | "dont_allow";

export interface VeoReferenceImage {
  /** Image data (base64 or Buffer) */
  image: string | Buffer;
  /** MIME type of the image */
  mimeType?: string;
  /** Reference type - currently only 'asset' is supported */
  referenceType?: "asset";
}

export interface VeoVideoOptions {
  /** Model to use */
  model?: VeoModel;
  /** Aspect ratio: 16:9 (default) or 9:16 for vertical */
  aspectRatio?: AspectRatio;
  /** Output resolution: 720p (default) or 1080p (8s only) */
  resolution?: Resolution;
  /** Duration in seconds: 4, 6, or 8 */
  durationSeconds?: Duration;
  /** What NOT to include in the video */
  negativePrompt?: string;
  /** Person generation policy */
  personGeneration?: PersonGeneration;
  /** Reference images for content guidance (Veo 3.1 only, max 3) */
  referenceImages?: VeoReferenceImage[];
  /** Number of videos to generate (default 1) */
  numberOfVideos?: number;
}

export interface VeoVideoResult {
  /** Video data as Buffer */
  video: Buffer;
  /** MIME type of the video */
  mimeType: string;
  /** Duration in seconds */
  durationSeconds: number;
  /** Resolution */
  resolution: Resolution;
  /** Model used */
  model: VeoModel;
  /** Operation metadata */
  metadata?: Record<string, unknown>;
}

export interface VeoImageToVideoOptions extends VeoVideoOptions {
  /** Starting image (base64 or Buffer) */
  image: string | Buffer;
  /** MIME type of the starting image */
  imageMimeType?: string;
  /** Optional ending image for interpolation */
  lastFrame?: string | Buffer;
  /** MIME type of the ending image */
  lastFrameMimeType?: string;
}

export interface VeoExtendOptions extends Omit<VeoVideoOptions, "durationSeconds"> {
  /** The video to extend (from previous operation) */
  video: VeoOperationVideo;
}

export interface VeoOperationVideo {
  /** Video file reference from Veo operation */
  name?: string;
  uri?: string;
  mimeType?: string;
}

export interface VeoOperation {
  /** Operation name/ID */
  name: string;
  /** Whether the operation is complete */
  done: boolean;
  /** Response when done */
  response?: {
    generatedVideos: Array<{
      video: VeoOperationVideo;
    }>;
  };
  /** Error if failed */
  error?: {
    code: number;
    message: string;
  };
}

// ============================================
// Client
// ============================================

let veoClient: GoogleGenAI | null = null;

/**
 * Get or create the Veo client
 */
export function getVeoClient(): GoogleGenAI {
  if (!veoClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable is not set"
      );
    }

    veoClient = new GoogleGenAI({ apiKey });
  }

  return veoClient;
}

/**
 * Create a new Veo client instance
 */
export function createVeoClient(apiKey?: string): GoogleGenAI {
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
 * Generate a video from a text prompt
 *
 * @example
 * // Basic video generation
 * const result = await generateVideo(
 *   "A professional restoration technician using moisture meter on water-damaged drywall"
 * );
 *
 * @example
 * // With audio cues (Veo 3.x)
 * const result = await generateVideo(
 *   "A technician explains, 'First, we need to assess the damage.' The camera follows their hands.",
 *   { model: "veo-3.1-generate-preview", resolution: "1080p", durationSeconds: 8 }
 * );
 */
export async function generateVideo(
  prompt: string,
  options: VeoVideoOptions = {}
): Promise<VeoVideoResult> {
  const client = getVeoClient();

  const {
    model = "veo-3.1-generate-preview",
    aspectRatio = "16:9",
    resolution = "720p",
    durationSeconds = 8,
    negativePrompt,
    personGeneration = "allow_adult",
    referenceImages,
    numberOfVideos = 1,
  } = options;

  // Validate: 1080p requires 8 second duration
  if (resolution === "1080p" && durationSeconds !== 8) {
    throw new Error("1080p resolution requires 8 second duration");
  }

  // Build config
  const config: Record<string, unknown> = {
    aspectRatio,
    resolution,
    durationSeconds,
    numberOfVideos,
    personGeneration,
  };

  if (negativePrompt) {
    config.negativePrompt = negativePrompt;
  }

  // Build request
  const request: Record<string, unknown> = {
    model,
    prompt,
    config,
  };

  // Add reference images for Veo 3.1
  if (referenceImages && referenceImages.length > 0 && model === "veo-3.1-generate-preview") {
    if (referenceImages.length > 3) {
      throw new Error("Maximum 3 reference images allowed");
    }

    request.referenceImages = referenceImages.map((ref) => ({
      image: {
        imageBytes: Buffer.isBuffer(ref.image)
          ? ref.image.toString("base64")
          : ref.image,
        mimeType: ref.mimeType || "image/png",
      },
      referenceType: ref.referenceType || "asset",
    }));
  }

  try {
    // Start video generation (async operation)
    let operation = await (client.models as unknown as {
      generateVideos: (req: Record<string, unknown>) => Promise<VeoOperation>;
    }).generateVideos(request);

    // Poll until complete
    operation = await pollOperation(client, operation);

    // Download the video
    const videoFile = operation.response?.generatedVideos[0]?.video;
    if (!videoFile) {
      throw new Error("No video generated");
    }

    const videoBuffer = await downloadVideo(client, videoFile);

    return {
      video: videoBuffer,
      mimeType: videoFile.mimeType || "video/mp4",
      durationSeconds,
      resolution,
      model,
      metadata: {
        operationName: operation.name,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Veo video generation error:", errorMessage);
    throw new Error(`Failed to generate video: ${errorMessage}`);
  }
}

/**
 * Generate a video from an image (image-to-video)
 *
 * @example
 * // Animate a Nano Banana generated image
 * const imageResult = await generateImage("Restoration technician with moisture meter");
 * const videoResult = await generateVideoFromImage(
 *   imageResult.image,
 *   "The technician slowly moves the meter across the wall",
 *   { durationSeconds: 8 }
 * );
 */
export async function generateVideoFromImage(
  image: string | Buffer,
  prompt: string,
  options: Omit<VeoImageToVideoOptions, "image"> = {}
): Promise<VeoVideoResult> {
  const client = getVeoClient();

  const {
    model = "veo-3.1-generate-preview",
    aspectRatio = "16:9",
    resolution = "720p",
    durationSeconds = 8,
    negativePrompt,
    personGeneration = "allow_adult",
    imageMimeType = "image/png",
    lastFrame,
    lastFrameMimeType = "image/png",
    numberOfVideos = 1,
  } = options;

  // Validate: 1080p requires 8 second duration
  if (resolution === "1080p" && durationSeconds !== 8) {
    throw new Error("1080p resolution requires 8 second duration");
  }

  // Build config
  const config: Record<string, unknown> = {
    aspectRatio,
    resolution,
    durationSeconds,
    numberOfVideos,
    personGeneration,
  };

  if (negativePrompt) {
    config.negativePrompt = negativePrompt;
  }

  // Build request with starting image
  const request: Record<string, unknown> = {
    model,
    prompt,
    config,
    image: {
      imageBytes: Buffer.isBuffer(image) ? image.toString("base64") : image,
      mimeType: imageMimeType,
    },
  };

  // Add last frame for interpolation if provided
  if (lastFrame) {
    request.lastFrame = {
      imageBytes: Buffer.isBuffer(lastFrame)
        ? lastFrame.toString("base64")
        : lastFrame,
      mimeType: lastFrameMimeType,
    };
  }

  try {
    let operation = await (client.models as unknown as {
      generateVideos: (req: Record<string, unknown>) => Promise<VeoOperation>;
    }).generateVideos(request);

    operation = await pollOperation(client, operation);

    const videoFile = operation.response?.generatedVideos[0]?.video;
    if (!videoFile) {
      throw new Error("No video generated");
    }

    const videoBuffer = await downloadVideo(client, videoFile);

    return {
      video: videoBuffer,
      mimeType: videoFile.mimeType || "video/mp4",
      durationSeconds,
      resolution,
      model,
      metadata: {
        operationName: operation.name,
        fromImage: true,
        hasLastFrame: !!lastFrame,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Veo image-to-video error:", errorMessage);
    throw new Error(`Failed to generate video from image: ${errorMessage}`);
  }
}

/**
 * Extend an existing video (Veo 3.1 only)
 *
 * @example
 * // Generate initial video
 * const initial = await generateVideo("Scene one...");
 *
 * // Extend by 7 seconds
 * const extended = await extendVideo(
 *   { name: initial.metadata.videoName },
 *   "Continue the scene with the technician moving to the next wall"
 * );
 */
export async function extendVideo(
  video: VeoOperationVideo,
  prompt: string,
  options: Omit<VeoExtendOptions, "video"> = {}
): Promise<VeoVideoResult> {
  const client = getVeoClient();

  const {
    model = "veo-3.1-generate-preview",
    aspectRatio = "16:9",
    resolution = "720p", // Extension only supports 720p
    negativePrompt,
    // personGeneration defaults to "allow_all" (required for extension)
    numberOfVideos = 1,
  } = options;

  // Extension only available on Veo 3.1
  if (model !== "veo-3.1-generate-preview") {
    throw new Error("Video extension is only available with veo-3.1-generate-preview");
  }

  // Extension only supports 720p
  if (resolution !== "720p") {
    console.warn("Video extension only supports 720p resolution, using 720p");
  }

  const config: Record<string, unknown> = {
    aspectRatio,
    resolution: "720p",
    numberOfVideos,
    personGeneration: "allow_all",
  };

  if (negativePrompt) {
    config.negativePrompt = negativePrompt;
  }

  const request: Record<string, unknown> = {
    model,
    prompt,
    config,
    video,
  };

  try {
    let operation = await (client.models as unknown as {
      generateVideos: (req: Record<string, unknown>) => Promise<VeoOperation>;
    }).generateVideos(request);

    operation = await pollOperation(client, operation);

    const videoFile = operation.response?.generatedVideos[0]?.video;
    if (!videoFile) {
      throw new Error("No video generated");
    }

    const videoBuffer = await downloadVideo(client, videoFile);

    return {
      video: videoBuffer,
      mimeType: videoFile.mimeType || "video/mp4",
      durationSeconds: 7, // Extensions are 7 seconds
      resolution: "720p",
      model,
      metadata: {
        operationName: operation.name,
        isExtension: true,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Veo video extension error:", errorMessage);
    throw new Error(`Failed to extend video: ${errorMessage}`);
  }
}

/**
 * Generate video by interpolating between two frames
 *
 * @example
 * const result = await interpolateVideo(
 *   startFrameBuffer,
 *   endFrameBuffer,
 *   "Smooth transition between the two scenes",
 *   { durationSeconds: 8 }
 * );
 */
export async function interpolateVideo(
  firstFrame: string | Buffer,
  lastFrame: string | Buffer,
  prompt: string,
  options: Omit<VeoVideoOptions, "referenceImages"> = {}
): Promise<VeoVideoResult> {
  return generateVideoFromImage(firstFrame, prompt, {
    ...options,
    lastFrame,
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Poll an operation until complete
 */
async function pollOperation(
  client: GoogleGenAI,
  operation: VeoOperation,
  maxWaitMs: number = 600000, // 10 minutes max
  intervalMs: number = 10000 // Check every 10 seconds
): Promise<VeoOperation> {
  const startTime = Date.now();

  while (!operation.done) {
    if (Date.now() - startTime > maxWaitMs) {
      throw new Error("Video generation timed out");
    }

    console.log(`Waiting for video generation... (${Math.round((Date.now() - startTime) / 1000)}s)`);
    await sleep(intervalMs);

    operation = await (client.operations as unknown as {
      getVideosOperation: (req: { operation: VeoOperation }) => Promise<VeoOperation>;
    }).getVideosOperation({ operation });

    if (operation.error) {
      throw new Error(`Video generation failed: ${operation.error.message}`);
    }
  }

  return operation;
}

/**
 * Download video from Veo operation result
 */
async function downloadVideo(
  client: GoogleGenAI,
  video: VeoOperationVideo
): Promise<Buffer> {
  // Use the files.download method
  const response = await (client.files as unknown as {
    download: (req: { file: VeoOperationVideo }) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> }>;
  }).download({ file: video });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate estimated cost for video generation
 *
 * Pricing (estimated, as of 2024):
 * - veo-3.1-generate-preview: ~$0.50-1.00 per video
 * - veo-3.1-fast: ~$0.25-0.50 per video
 * - veo-3.0: ~$0.40-0.80 per video
 * - veo-2.0: ~$0.20-0.40 per video
 */
export function calculateVideoCost(
  model: VeoModel = "veo-3.1-generate-preview",
  durationSeconds: Duration = 8,
  resolution: Resolution = "720p"
): number {
  const baseCosts: Record<VeoModel, number> = {
    "veo-3.1-generate-preview": 0.75,
    "veo-3.1-fast-generate-preview": 0.35,
    "veo-3.0-generate-preview": 0.60,
    "veo-2.0-generate-001": 0.30,
  };

  let cost = baseCosts[model];

  // Adjust for duration
  if (durationSeconds === 4) {
cost *= 0.6;
}
  if (durationSeconds === 6) {
cost *= 0.8;
}

  // 1080p premium
  if (resolution === "1080p") {
cost *= 1.5;
}

  return cost;
}

/**
 * Validate video generation prompt
 */
export function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, reason: "Prompt cannot be empty" };
  }

  if (prompt.length > 2000) {
    return { valid: false, reason: "Prompt exceeds 2000 character limit" };
  }

  // Basic content filtering
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
 * Build a restoration industry explainer prompt with audio cues
 *
 * @example
 * const prompt = buildExplainerPrompt({
 *   topic: "moisture assessment",
 *   action: "using moisture meter on drywall",
 *   dialogue: "First, we need to map the extent of the moisture intrusion",
 *   sfx: "beeping of moisture meter",
 *   ambient: "dehumidifier humming in background"
 * });
 */
export function buildExplainerPrompt(options: {
  topic: string;
  action: string;
  dialogue?: string;
  sfx?: string;
  ambient?: string;
  cameraWork?: string;
  style?: string;
}): string {
  const {
    topic,
    action,
    dialogue,
    sfx,
    ambient,
    cameraWork = "close-up shot following hands",
    style = "professional, educational, high quality",
  } = options;

  let prompt = `Professional restoration training video about ${topic}. `;
  prompt += `A skilled technician ${action}. `;
  prompt += `${cameraWork}. `;

  if (dialogue) {
    prompt += `The technician explains, '${dialogue}' `;
  }

  if (sfx) {
    prompt += `Sound effects: ${sfx}. `;
  }

  if (ambient) {
    prompt += `Ambient audio: ${ambient}. `;
  }

  prompt += `Style: ${style}.`;

  return prompt;
}

// ============================================
// Exports
// ============================================

export default {
  getVeoClient,
  createVeoClient,
  generateVideo,
  generateVideoFromImage,
  extendVideo,
  interpolateVideo,
  calculateVideoCost,
  validatePrompt,
  buildExplainerPrompt,
};
