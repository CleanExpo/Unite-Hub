import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { UUIDSchema } from "@/lib/validation/schemas";
import {
  generateImage,
  calculateImageCost,
  validatePrompt,
  convertDalleSizeToAspectRatio,
  getResolutionDimensions,
  type GeminiImageModel,
  type AspectRatio,
  type ImageSize,
} from "@/lib/gemini/image-client";
import {
  engineerPrompt,
  PromptContext,
  PlatformSpecs,
  ConceptType,
  extractKeywords,
} from "@/lib/dalle/prompts";
import { recommendStyleForIndustry } from "@/lib/dalle/styles";

export interface GenerateImageRequest {
  contactId?: string;
  clientId?: string; // Legacy support
  conceptType: ConceptType;
  platform?: "facebook" | "instagram" | "tiktok" | "linkedin" | "general";
  customPrompt?: string;
  style?: string;
  /** Legacy DALL-E size - converted to aspectRatio */
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  /** New: Gemini aspect ratio */
  aspectRatio?: AspectRatio;
  /** New: Gemini image size (1K, 2K, 4K) */
  imageSize?: ImageSize;
  /** New: Use professional model with grounding */
  professional?: boolean;
  /** Legacy - ignored (Gemini doesn't have quality setting) */
  quality?: "standard" | "hd";
  variationCount?: number; // 3 for Starter, 5 for Professional
}

/**
 * POST /api/images/generate
 * Generate Gemini image concepts for a contact
 *
 * @description Replaced DALL-E with Gemini image models for better text rendering,
 * grounding, and higher resolution output.
 *
 * Models used:
 * - gemini-2.5-flash-image: Fast, high-volume generation
 * - gemini-3-pro-image-preview: Professional quality with grounding
 */
export async function POST(request: NextRequest) {
  try {
    // Apply AI-specific rate limiting (20 req/15min - expensive AI operation)
    const rateLimitResult = await aiAgentRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabase = await getSupabaseServer();
    const body: GenerateImageRequest = await request.json();

    const {
      contactId,
      clientId, // Legacy support
      conceptType,
      platform = "general",
      customPrompt,
      style,
      size = "1024x1024",
      aspectRatio: requestedAspectRatio,
      imageSize = "1K",
      professional = false,
      variationCount = 1,
    } = body;

    const finalContactId = contactId || clientId;

    // Validate required fields
    if (!finalContactId || !conceptType) {
      return NextResponse.json(
        { error: "contactId and conceptType are required" },
        { status: 400 }
      );
    }

    // Validate contact ID
    const contactIdValidation = UUIDSchema.safeParse(finalContactId);
    if (!contactIdValidation.success) {
      return NextResponse.json({ error: "Invalid contact ID format" }, { status: 400 });
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contact and verify workspace access
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, name, email, company, notes, workspace_id, custom_fields")
      .eq("id", finalContactId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Get workspace and org
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, name, org_id")
      .eq("id", contact.workspace_id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Get organization for plan check
    const { data: organization } = await supabase
      .from("organizations")
      .select("id, name, plan, status")
      .eq("id", workspace.org_id)
      .single();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Verify user has access to organization
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("org_id", workspace.org_id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check tier-based variation limits
    const maxVariations = organization.plan === "professional" || organization.plan === "enterprise" ? 5 : 3;
    const actualVariations = Math.min(variationCount, maxVariations);

    // Check usage limits
    const usageCheck = await checkUsageLimits(supabase, organization.id, organization.plan, actualVariations);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason, limitReached: true },
        { status: 429 }
      );
    }

    // Extract brand colors from contact custom fields (if available)
    const brandColors = extractBrandColors(contact.custom_fields);

    // Build prompt context
    const promptContext: PromptContext = {
      businessName: contact.company || contact.name,
      businessDescription: contact.notes || `Business contact: ${contact.name}`,
      brandColors,
      keywords: customPrompt ? [] : extractKeywords(contact.notes || ""),
    };

    // Determine style
    const recommendedStyle = style || recommendStyleForIndustry(contact.notes || "general").name;

    // Determine aspect ratio (prefer new format, fallback to legacy size conversion)
    const aspectRatio: AspectRatio = requestedAspectRatio || convertDalleSizeToAspectRatio(size);

    // Build platform specs
    const platformSpecs: PlatformSpecs = {
      platform,
      aspectRatio: aspectRatio as "1:1" | "4:5" | "9:16" | "16:9",
      style: recommendedStyle,
    };

    // Engineer the prompt
    const engineeredPrompt = customPrompt || engineerPrompt(
      conceptType,
      promptContext,
      platformSpecs
    );

    // Validate prompt
    const validation = validatePrompt(engineeredPrompt);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid prompt: ${validation.reason}` },
        { status: 400 }
      );
    }

    // Select model based on request
    const model: GeminiImageModel = professional
      ? "gemini-3-pro-image-preview"
      : "gemini-2.5-flash-image";

    // Get resolution dimensions for database storage
    const dimensions = getResolutionDimensions(aspectRatio, imageSize);

    // Generate images
    const generatedImages = [];
    const errors = [];

    for (let i = 0; i < actualVariations; i++) {
      try {
        const variation = i === 0 ? engineeredPrompt : `${engineeredPrompt}, variation ${i + 1}`;

        const result = await generateImage(variation, {
          model,
          aspectRatio,
          imageSize: model === "gemini-3-pro-image-preview" ? imageSize : undefined,
          enableGrounding: professional,
        });

        // Convert image buffer to base64 data URL for storage
        const base64Image = result.image.toString("base64");
        const dataUrl = `data:${result.mimeType};base64,${base64Image}`;

        // Store image in Supabase
        const { data: savedImage, error: saveError } = await supabase
          .from("generated_images")
          .insert({
            workspace_id: workspace.id,
            contact_id: finalContactId,
            prompt: engineeredPrompt,
            image_url: dataUrl,
            provider: "gemini",
            model: model,
            size: `${dimensions.width}x${dimensions.height}`,
            quality: professional ? "professional" : "standard",
            style: recommendedStyle,
            brand_colors: brandColors,
            additional_params: {
              conceptType,
              platform,
              aspectRatio,
              imageSize,
              revisedPrompt: result.text,
              variationNumber: i + 1,
              groundingMetadata: result.groundingMetadata,
            },
            generation_cost: calculateImageCost(1, model, imageSize),
            revision_number: 1,
            status: "completed",
          })
          .select()
          .single();

        if (saveError) {
          console.error("Failed to save image:", saveError);
          errors.push({ variation: i + 1, error: "Failed to save image to database" });
          continue;
        }

        generatedImages.push({
          id: savedImage.id,
          url: dataUrl,
          revisedPrompt: result.text,
          mimeType: result.mimeType,
          dimensions,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("Unauthorized")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (errorMessage.includes("Forbidden")) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        console.error(`Failed to generate variation ${i + 1}:`, error);
        errors.push({ variation: i + 1, error: errorMessage });
      }
    }

    // Calculate total cost
    const totalCost = calculateImageCost(generatedImages.length, model, imageSize);

    // Track usage in organization metadata
    await trackImageGeneration(supabase, organization.id, generatedImages.length, totalCost);

    return NextResponse.json({
      success: true,
      images: generatedImages,
      generated: generatedImages.length,
      requested: actualVariations,
      errors: errors.length > 0 ? errors : undefined,
      cost: totalCost,
      prompt: engineeredPrompt,
      style: recommendedStyle,
      model,
      aspectRatio,
      imageSize: model === "gemini-3-pro-image-preview" ? imageSize : "1K",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (errorMessage.includes("Forbidden")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: errorMessage || "Failed to generate images" },
      { status: 500 }
    );
  }
}

/**
 * Extract brand colors from contact custom fields
 */
function extractBrandColors(customFields: unknown): string[] {
  const fields = customFields as { brandColors?: string[] } | null;

  // Check if custom fields contain brand colors
  if (fields && fields.brandColors && Array.isArray(fields.brandColors)) {
    return fields.brandColors;
  }

  // Default brand colors (Unite-Hub accent colors)
  return ["#ff6b35", "#2563EB", "#3B82F6"];
}

/**
 * Check usage limits for organization
 */
async function checkUsageLimits(
  supabase: ReturnType<typeof getSupabaseServer> extends Promise<infer T> ? T : never,
  orgId: string,
  plan: string,
  requestedCount: number
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Check organization status
    const { data: org } = await supabase
      .from("organizations")
      .select("status, trial_ends_at")
      .eq("id", orgId)
      .single();

    if (!org) {
      return { allowed: false, reason: "Organization not found" };
    }

    // Check if trial expired
    if (org.status === "trial" && org.trial_ends_at) {
      const trialEnd = new Date(org.trial_ends_at);
      if (trialEnd < new Date()) {
        return { allowed: false, reason: "Trial period has ended. Please upgrade to continue." };
      }
    }

    if (org.status === "cancelled") {
      return { allowed: false, reason: "Subscription is cancelled" };
    }

    // Get usage this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", orgId)
      .gte("created_at", startOfMonth.toISOString());

    const currentUsage = count || 0;

    // Define limits based on tier (increased for Gemini efficiency)
    const limits: Record<string, number> = {
      starter: 100, // 100 images per month (Gemini is cheaper)
      professional: 500, // 500 images per month
      enterprise: 2000, // 2000 images per month
    };

    const limit = limits[plan] || limits.starter;

    if (currentUsage + requestedCount > limit) {
      return {
        allowed: false,
        reason: `Image generation limit reached (${currentUsage}/${limit}). Upgrade to generate more images.`,
      };
    }

    return { allowed: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("Unauthorized")) {
      throw new Error("Unauthorized");
    }
    if (errorMessage.includes("Forbidden")) {
      throw new Error("Forbidden");
    }

    console.error("Error checking usage limits:", error);
    // Allow on error to prevent blocking (fail open)
    return { allowed: true };
  }
}

/**
 * Track image generation for cost analytics
 */
async function trackImageGeneration(
  supabase: ReturnType<typeof getSupabaseServer> extends Promise<infer T> ? T : never,
  orgId: string,
  count: number,
  cost: number
): Promise<void> {
  try {
    console.log(`Image generation tracked: ${count} images, cost: $${cost.toFixed(4)} for org: ${orgId}`);

    // Update organization metadata with usage tracking
    const { data: org } = await supabase
      .from("organizations")
      .select("custom_fields")
      .eq("id", orgId)
      .single();

    if (org) {
      const customFields = (org.custom_fields as Record<string, unknown>) || {};
      const usageTracking = (customFields.usageTracking as Record<string, { imagesGenerated?: number; imageCost?: number }>) || {};

      // Track monthly usage
      const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
      usageTracking[monthKey] = {
        imagesGenerated: (usageTracking[monthKey]?.imagesGenerated || 0) + count,
        imageCost: (usageTracking[monthKey]?.imageCost || 0) + cost,
      };

      customFields.usageTracking = usageTracking;

      await supabase
        .from("organizations")
        .update({ custom_fields: customFields })
        .eq("id", orgId);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error tracking image generation:", errorMessage);
  }
}
