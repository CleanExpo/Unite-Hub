import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";
import { UUIDSchema } from "@/lib/validation/schemas";
import { generateImage, validatePrompt, calculateImageCost } from "@/lib/dalle/client";

export interface RegenerateImageRequest {
  imageId: string;
  newPrompt?: string; // Optional - if not provided, use original prompt
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
}

/**
 * POST /api/images/regenerate
 * Regenerate an existing image with a new prompt or same prompt
 */
export async function POST(request: NextRequest) {
  try {
    // Apply AI-specific rate limiting (20 req/15min)
    const rateLimitResult = await aiAgentRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    const supabase = await getSupabaseServer();
    const body: RegenerateImageRequest = await request.json();

    const {
      imageId,
      newPrompt,
      size,
      quality,
    } = body;

    // Validate required fields
    if (!imageId) {
      return NextResponse.json(
        { error: "imageId is required" },
        { status: 400 }
      );
    }

    // Validate image ID
    const imageIdValidation = UUIDSchema.safeParse(imageId);
    if (!imageIdValidation.success) {
      return NextResponse.json({ error: "Invalid image ID format" }, { status: 400 });
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch original image
    const { data: originalImage, error: imageError } = await supabase
      .from("generated_images")
      .select("id, workspace_id, contact_id, prompt, size, quality, revision_number, parent_image_id")
      .eq("id", imageId)
      .single();

    if (imageError || !originalImage) {
      return NextResponse.json(
        { error: "Original image not found" },
        { status: 404 }
      );
    }

    // Get workspace and verify access
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, org_id")
      .eq("id", originalImage.workspace_id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify user has access to workspace
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("org_id", workspace.org_id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get organization for subscription check
    const { data: organization } = await supabase
      .from("organizations")
      .select("id, plan, status, trial_ends_at")
      .eq("id", workspace.org_id)
      .single();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check subscription status
    if (organization.status === "cancelled") {
      return NextResponse.json(
        { error: "Subscription is cancelled" },
        { status: 403 }
      );
    }

    if (organization.status === "trial" && organization.trial_ends_at) {
      const trialEnd = new Date(organization.trial_ends_at);
      if (trialEnd < new Date()) {
        return NextResponse.json(
          { error: "Trial period has ended. Please upgrade to continue." },
          { status: 403 }
        );
      }
    }

    // Use new prompt or fall back to original
    const finalPrompt = newPrompt || originalImage.prompt;
    const finalSize = size || originalImage.size;
    const finalQuality = quality || originalImage.quality;

    // Validate prompt
    const validation = validatePrompt(finalPrompt);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid prompt: ${validation.reason}` },
        { status: 400 }
      );
    }

    // Generate new image
    const result = await generateImage({
      prompt: finalPrompt,
      size: finalSize as "1024x1024" | "1792x1024" | "1024x1792",
      quality: finalQuality as "standard" | "hd",
      style: "vivid",
      model: "dall-e-3",
    });

    // Create new image record (as a regeneration)
    const newRevisionNumber = (originalImage.revision_number || 1) + 1;
    const parentImageId = originalImage.parent_image_id || originalImage.id;

    const { data: regeneratedImage, error: insertError } = await supabase
      .from("generated_images")
      .insert({
        workspace_id: originalImage.workspace_id,
        contact_id: originalImage.contact_id,
        prompt: finalPrompt,
        image_url: result.url,
        provider: "dall-e",
        model: "dall-e-3",
        size: finalSize,
        quality: finalQuality,
        style: "vivid",
        additional_params: {
          revisedPrompt: result.revisedPrompt,
          regeneratedFrom: imageId,
        },
        generation_cost: calculateImageCost(1, finalSize, finalQuality),
        revision_number: newRevisionNumber,
        parent_image_id: parentImageId,
        status: "completed",
      })
      .select()
      .single();

    if (insertError || !regeneratedImage) {
      console.error("Failed to save regenerated image:", insertError);
      return NextResponse.json(
        { error: "Failed to save regenerated image" },
        { status: 500 }
      );
    }

    // Track usage
    const cost = calculateImageCost(1, finalSize, finalQuality);
    await trackImageGeneration(supabase, organization.id, 1, cost);

    return NextResponse.json({
      success: true,
      image: {
        id: regeneratedImage.id,
        url: result.url,
        prompt: finalPrompt,
        revisedPrompt: result.revisedPrompt,
        revisionNumber: newRevisionNumber,
        parentImageId,
      },
    });
  } catch (error: any) {
    console.error("Image regeneration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to regenerate image" },
      { status: 500 }
    );
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
    console.log(`Image regeneration tracked: ${count} images, cost: $${cost.toFixed(4)} for org: ${orgId}`);

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
  } catch (error) {
    console.error("Error tracking image generation:", error);
  }
}
