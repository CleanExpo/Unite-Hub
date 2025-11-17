import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { UUIDSchema } from "@/lib/validation/schemas";
import { generateImage, calculateImageCost, validatePrompt } from "@/lib/dalle/client";
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
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  variationCount?: number; // 3 for Starter, 5 for Professional
}

/**
 * POST /api/images/generate
 * Generate DALL-E image concepts for a contact
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
      quality = "standard",
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

    // Build platform specs
    const platformSpecs: PlatformSpecs = {
      platform,
      aspectRatio: getAspectRatioFromSize(size),
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

    // Generate images
    const generatedImages = [];
    const errors = [];

    for (let i = 0; i < actualVariations; i++) {
      try {
        const variation = i === 0 ? engineeredPrompt : `${engineeredPrompt}, variation ${i + 1}`;

        const result = await generateImage({
          prompt: variation,
          size,
          quality,
          style: "vivid",
          model: "dall-e-3",
        });

        // Store image in Supabase
        const { data: savedImage, error: saveError } = await supabase
          .from("generated_images")
          .insert({
            workspace_id: workspace.id,
            contact_id: finalContactId,
            prompt: engineeredPrompt,
            image_url: result.url,
            provider: "dall-e",
            model: "dall-e-3",
            size,
            quality,
            style: "vivid",
            brand_colors: brandColors,
            additional_params: {
              conceptType,
              platform,
              revisedPrompt: result.revisedPrompt,
              variationNumber: i + 1,
            },
            generation_cost: calculateImageCost(1, size, quality),
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
          url: result.url,
          revisedPrompt: result.revisedPrompt,
        });
      } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error(`Failed to generate variation ${i + 1}:`, error);
        errors.push({ variation: i + 1, error: error.message });
      }
    }

    // Calculate total cost
    const totalCost = calculateImageCost(generatedImages.length, size, quality);

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
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate images" },
      { status: 500 }
    );
  }
}

/**
 * Extract brand colors from contact custom fields
 */
function extractBrandColors(customFields: any): string[] {
  // Check if custom fields contain brand colors
  if (customFields && customFields.brandColors && Array.isArray(customFields.brandColors)) {
    return customFields.brandColors;
  }

  // Default brand colors
  return ["#2563EB", "#3B82F6", "#60A5FA"];
}

/**
 * Get aspect ratio from size string
 */
function getAspectRatioFromSize(size: string): "1:1" | "4:5" | "9:16" | "16:9" {
  if (size === "1024x1024") return "1:1";
  if (size === "1024x1792") return "9:16";
  if (size === "1792x1024") return "16:9";
  return "1:1";
}

/**
 * Check usage limits for organization
 */
async function checkUsageLimits(
  supabase: any,
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

    // Define limits based on tier
    const limits: Record<string, number> = {
      starter: 50, // 50 images per month
      professional: 200, // 200 images per month
      enterprise: 1000, // 1000 images per month
    };

    const limit = limits[plan] || limits.starter;

    if (currentUsage + requestedCount > limit) {
      return {
        allowed: false,
        reason: `Image generation limit reached (${currentUsage}/${limit}). Upgrade to generate more images.`,
      };
    }

    return { allowed: true };
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
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
  supabase: any,
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
      const customFields = org.custom_fields || {};
      const usageTracking = customFields.usageTracking || {};

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
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error tracking image generation:", error);
  }
}
