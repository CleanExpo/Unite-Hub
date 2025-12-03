import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { UUIDSchema } from "@/lib/validation/schemas";
import {
  generateVideo,
  generateVideoFromImage,
  extendVideo,
  calculateVideoCost,
  validatePrompt,
  buildExplainerPrompt,
  type VeoModel,
  type AspectRatio,
  type Resolution,
  type Duration,
  type VeoOperationVideo,
} from "@/lib/veo";
import { generateImage } from "@/lib/gemini/image-client";

// ============================================
// Types
// ============================================

export interface GenerateVideoRequest {
  /** Text prompt for video generation */
  prompt: string;
  /** Contact ID for tracking */
  contactId?: string;
  /** Video model to use */
  model?: VeoModel;
  /** Aspect ratio */
  aspectRatio?: AspectRatio;
  /** Output resolution */
  resolution?: Resolution;
  /** Duration in seconds */
  durationSeconds?: Duration;
  /** What NOT to include */
  negativePrompt?: string;
  /** Use explainer prompt builder */
  explainerMode?: {
    topic: string;
    action: string;
    dialogue?: string;
    sfx?: string;
    ambient?: string;
    cameraWork?: string;
  };
}

export interface GenerateFromImageRequest extends GenerateVideoRequest {
  /** Base64 image data or URL */
  image: string;
  /** Image MIME type */
  imageMimeType?: string;
  /** Optional ending frame for interpolation */
  lastFrame?: string;
  /** Ending frame MIME type */
  lastFrameMimeType?: string;
}

export interface ExtendVideoRequest {
  /** Video reference from previous operation */
  video: VeoOperationVideo;
  /** Continuation prompt */
  prompt: string;
  /** Aspect ratio (must match original) */
  aspectRatio?: AspectRatio;
  /** What NOT to include */
  negativePrompt?: string;
}

export interface GenerateWithImageRequest extends GenerateVideoRequest {
  /** Generate starting image with this prompt */
  imagePrompt: string;
  /** Use professional image model (gemini-3-pro-image-preview) */
  professionalImage?: boolean;
}

// ============================================
// POST /api/videos/generate
// ============================================

/**
 * POST /api/videos/generate
 *
 * Generate a video using Google Veo models.
 *
 * Modes:
 * - Text-to-video: Basic video from text prompt
 * - Explainer mode: Structured prompt for restoration industry content
 * - Image-to-video: Animate a provided image
 * - Generate with image: Generate image first, then animate
 * - Extend: Continue an existing video
 *
 * @example
 * // Basic text-to-video
 * POST /api/videos/generate
 * { "prompt": "A restoration technician inspecting water damage" }
 *
 * @example
 * // Explainer mode with audio cues
 * POST /api/videos/generate
 * {
 *   "explainerMode": {
 *     "topic": "moisture assessment",
 *     "action": "using a moisture meter on drywall",
 *     "dialogue": "First, we need to map the moisture intrusion",
 *     "sfx": "beeping of moisture meter",
 *     "ambient": "dehumidifier running"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Apply AI-specific rate limiting (strict - video generation is expensive)
    const rateLimitResult = await aiAgentRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabase = await getSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Determine request type based on body
    if (body.video) {
      return handleExtendVideo(body as ExtendVideoRequest, supabase, user.id);
    }

    if (body.image) {
      return handleImageToVideo(body as GenerateFromImageRequest, supabase, user.id);
    }

    if (body.imagePrompt) {
      return handleGenerateWithImage(body as GenerateWithImageRequest, supabase, user.id);
    }

    return handleTextToVideo(body as GenerateVideoRequest, supabase, user.id);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: errorMessage || "Failed to generate video" },
      { status: 500 }
    );
  }
}

// ============================================
// Handlers
// ============================================

async function handleTextToVideo(
  body: GenerateVideoRequest,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  userId: string
) {
  const {
    prompt: rawPrompt,
    contactId,
    model = "veo-3.1-generate-preview",
    aspectRatio = "16:9",
    resolution = "720p",
    durationSeconds = 8,
    negativePrompt,
    explainerMode,
  } = body;

  // Build prompt (explainer mode or raw)
  const prompt = explainerMode
    ? buildExplainerPrompt(explainerMode)
    : rawPrompt;

  if (!prompt) {
    return NextResponse.json(
      { error: "prompt or explainerMode is required" },
      { status: 400 }
    );
  }

  // Validate prompt
  const validation = validatePrompt(prompt);
  if (!validation.valid) {
    return NextResponse.json(
      { error: `Invalid prompt: ${validation.reason}` },
      { status: 400 }
    );
  }

  // Validate contact if provided
  if (contactId) {
    const contactValidation = UUIDSchema.safeParse(contactId);
    if (!contactValidation.success) {
      return NextResponse.json({ error: "Invalid contact ID format" }, { status: 400 });
    }
  }

  // Check usage limits
  const usageCheck = await checkVideoUsageLimits(supabase, userId);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { error: usageCheck.reason, limitReached: true },
      { status: 429 }
    );
  }

  // Generate video
  const result = await generateVideo(prompt, {
    model,
    aspectRatio,
    resolution,
    durationSeconds,
    negativePrompt,
  });

  // Convert video buffer to base64 for response
  const base64Video = result.video.toString("base64");
  const dataUrl = `data:${result.mimeType};base64,${base64Video}`;

  // Calculate cost
  const cost = calculateVideoCost(model, durationSeconds, resolution);

  // Track usage
  await trackVideoGeneration(supabase, userId, cost, {
    type: "text-to-video",
    model,
    durationSeconds,
    resolution,
    contactId,
  });

  return NextResponse.json({
    success: true,
    video: {
      dataUrl,
      mimeType: result.mimeType,
      durationSeconds: result.durationSeconds,
      resolution: result.resolution,
    },
    prompt,
    model,
    cost,
    metadata: result.metadata,
  });
}

async function handleImageToVideo(
  body: GenerateFromImageRequest,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  userId: string
) {
  const {
    prompt,
    image,
    imageMimeType = "image/png",
    lastFrame,
    lastFrameMimeType = "image/png",
    contactId,
    model = "veo-3.1-generate-preview",
    aspectRatio = "16:9",
    resolution = "720p",
    durationSeconds = 8,
    negativePrompt,
  } = body;

  if (!prompt || !image) {
    return NextResponse.json(
      { error: "prompt and image are required" },
      { status: 400 }
    );
  }

  // Validate prompt
  const validation = validatePrompt(prompt);
  if (!validation.valid) {
    return NextResponse.json(
      { error: `Invalid prompt: ${validation.reason}` },
      { status: 400 }
    );
  }

  // Check usage limits
  const usageCheck = await checkVideoUsageLimits(supabase, userId);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { error: usageCheck.reason, limitReached: true },
      { status: 429 }
    );
  }

  // Strip data URL prefix if present
  const imageData = image.replace(/^data:image\/\w+;base64,/, "");
  const lastFrameData = lastFrame?.replace(/^data:image\/\w+;base64,/, "");

  // Generate video from image
  const result = await generateVideoFromImage(imageData, prompt, {
    model,
    aspectRatio,
    resolution,
    durationSeconds,
    negativePrompt,
    imageMimeType,
    lastFrame: lastFrameData,
    lastFrameMimeType,
  });

  const base64Video = result.video.toString("base64");
  const dataUrl = `data:${result.mimeType};base64,${base64Video}`;
  const cost = calculateVideoCost(model, durationSeconds, resolution);

  await trackVideoGeneration(supabase, userId, cost, {
    type: "image-to-video",
    model,
    durationSeconds,
    resolution,
    contactId,
    hasLastFrame: !!lastFrame,
  });

  return NextResponse.json({
    success: true,
    video: {
      dataUrl,
      mimeType: result.mimeType,
      durationSeconds: result.durationSeconds,
      resolution: result.resolution,
    },
    prompt,
    model,
    cost,
    metadata: result.metadata,
  });
}

async function handleGenerateWithImage(
  body: GenerateWithImageRequest,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  userId: string
) {
  const {
    prompt,
    imagePrompt,
    professionalImage = true,
    contactId,
    model = "veo-3.1-generate-preview",
    aspectRatio = "16:9",
    resolution = "720p",
    durationSeconds = 8,
    negativePrompt,
  } = body;

  if (!prompt || !imagePrompt) {
    return NextResponse.json(
      { error: "prompt and imagePrompt are required" },
      { status: 400 }
    );
  }

  // Check usage limits
  const usageCheck = await checkVideoUsageLimits(supabase, userId);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { error: usageCheck.reason, limitReached: true },
      { status: 429 }
    );
  }

  // Step 1: Generate image with Nano Banana
  const imageResult = await generateImage(imagePrompt, {
    model: professionalImage ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image",
    aspectRatio: aspectRatio === "16:9" ? "16:9" : "9:16",
  });

  // Step 2: Generate video from image
  const result = await generateVideoFromImage(imageResult.image, prompt, {
    model,
    aspectRatio,
    resolution,
    durationSeconds,
    negativePrompt,
  });

  const base64Video = result.video.toString("base64");
  const dataUrl = `data:${result.mimeType};base64,${base64Video}`;
  const cost = calculateVideoCost(model, durationSeconds, resolution) + 0.04; // Add image cost

  await trackVideoGeneration(supabase, userId, cost, {
    type: "generate-with-image",
    model,
    durationSeconds,
    resolution,
    contactId,
    imageModel: professionalImage ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image",
  });

  return NextResponse.json({
    success: true,
    video: {
      dataUrl,
      mimeType: result.mimeType,
      durationSeconds: result.durationSeconds,
      resolution: result.resolution,
    },
    generatedImage: {
      dataUrl: `data:${imageResult.mimeType};base64,${imageResult.image.toString("base64")}`,
      mimeType: imageResult.mimeType,
    },
    prompt,
    imagePrompt,
    model,
    cost,
    metadata: result.metadata,
  });
}

async function handleExtendVideo(
  body: ExtendVideoRequest,
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  userId: string
) {
  const { video, prompt, aspectRatio = "16:9", negativePrompt } = body;

  if (!video || !prompt) {
    return NextResponse.json(
      { error: "video and prompt are required" },
      { status: 400 }
    );
  }

  // Check usage limits
  const usageCheck = await checkVideoUsageLimits(supabase, userId);
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { error: usageCheck.reason, limitReached: true },
      { status: 429 }
    );
  }

  const result = await extendVideo(video, prompt, {
    aspectRatio,
    negativePrompt,
  });

  const base64Video = result.video.toString("base64");
  const dataUrl = `data:${result.mimeType};base64,${base64Video}`;
  const cost = calculateVideoCost("veo-3.1-generate-preview", 8, "720p") * 0.9; // Extension slightly cheaper

  await trackVideoGeneration(supabase, userId, cost, {
    type: "extend-video",
    model: "veo-3.1-generate-preview",
    durationSeconds: 7,
    resolution: "720p",
  });

  return NextResponse.json({
    success: true,
    video: {
      dataUrl,
      mimeType: result.mimeType,
      durationSeconds: result.durationSeconds,
      resolution: result.resolution,
    },
    prompt,
    model: result.model,
    cost,
    metadata: result.metadata,
  });
}

// ============================================
// Helpers
// ============================================

async function checkVideoUsageLimits(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Get user's organization
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("org_id, organizations(plan, status)")
      .eq("user_id", userId)
      .single();

    if (!userOrg) {
      return { allowed: false, reason: "No organization found" };
    }

    const org = userOrg.organizations as { plan: string; status: string } | null;

    if (!org) {
      return { allowed: false, reason: "Organization not found" };
    }

    if (org.status === "cancelled") {
      return { allowed: false, reason: "Subscription is cancelled" };
    }

    // Video limits by tier (per month)
    const limits: Record<string, number> = {
      starter: 10,
      professional: 50,
      enterprise: 200,
    };

    const limit = limits[org.plan] || limits.starter;

    // Count videos this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("ai_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("provider", "google_veo")
      .gte("created_at", startOfMonth.toISOString());

    const currentUsage = count || 0;

    if (currentUsage >= limit) {
      return {
        allowed: false,
        reason: `Video generation limit reached (${currentUsage}/${limit}). Upgrade to generate more videos.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking video limits:", error);
    return { allowed: true }; // Fail open
  }
}

async function trackVideoGeneration(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  userId: string,
  cost: number,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("ai_usage_logs").insert({
      provider: "google_veo",
      model: metadata.model as string,
      workspace_id: null, // Could be enhanced to track by workspace
      tokens_input: 0,
      tokens_output: 0,
      cost_usd: cost,
      latency_ms: 0,
      success: true,
      metadata: {
        ...metadata,
        userId,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error tracking video generation:", error);
  }
}
