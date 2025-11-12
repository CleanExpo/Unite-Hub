import { NextRequest, NextResponse } from "next/server";
import { generateImage, calculateImageCost, validatePrompt } from "@/lib/dalle/client";
import {
  engineerPrompt,
  PromptContext,
  PlatformSpecs,
  ConceptType,
  extractKeywords,
} from "@/lib/dalle/prompts";
import { recommendStyleForIndustry } from "@/lib/dalle/styles";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface GenerateImageRequest {
  clientId: string;
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
 * Generate DALL-E image concepts for a client
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateImageRequest = await request.json();
    const {
      clientId,
      conceptType,
      platform = "general",
      customPrompt,
      style,
      size = "1024x1024",
      quality = "standard",
      variationCount = 1,
    } = body;

    // Validate required fields
    if (!clientId || !conceptType) {
      return NextResponse.json(
        { error: "clientId and conceptType are required" },
        { status: 400 }
      );
    }

    // Fetch client data from Convex
    const client = await convex.query("clients:get" as any, { clientId });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check tier-based variation limits
    const maxVariations = client.packageTier === "professional" ? 5 : 3;
    const actualVariations = Math.min(variationCount, maxVariations);

    // Fetch client assets to extract brand colors
    const assets = await convex.query("clientAssets:getByClient" as any, { clientId }) || [];
    const brandColors = extractBrandColorsFromAssets(assets);

    // Build prompt context
    const promptContext: PromptContext = {
      businessName: client.businessName,
      businessDescription: client.businessDescription,
      brandColors,
      keywords: customPrompt ? [] : extractKeywords(client.businessDescription),
    };

    // Determine style
    const recommendedStyle = style || recommendStyleForIndustry(client.businessDescription).name;

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

    // Check usage limits
    const usageCheck = await checkUsageLimits(client.orgId, actualVariations);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason, limitReached: true },
        { status: 429 }
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
        });

        // Store image in Convex
        const savedImage = await convex.mutation("imageConcepts:create" as any, {
          clientId,
          conceptType,
          platform,
          prompt: engineeredPrompt,
          imageUrl: result.url,
          dalleImageId: `dalle-${Date.now()}-${i}`,
          style: recommendedStyle,
          colorPalette: brandColors,
          dimensions: {
            width: parseInt(size.split("x")[0]),
            height: parseInt(size.split("x")[1]),
          },
          usageRecommendations: `Optimized for ${platform} - ${conceptType}`,
          isUsed: false,
        });

        generatedImages.push({
          id: savedImage,
          url: result.url,
          revisedPrompt: result.revisedPrompt,
        });
      } catch (error: any) {
        console.error(`Failed to generate variation ${i + 1}:`, error);
        errors.push({ variation: i + 1, error: error.message });
      }
    }

    // Track usage
    const cost = calculateImageCost(generatedImages.length, size, quality);
    await trackImageGeneration(client.orgId, generatedImages.length, cost);

    // Track usage metric
    await convex.mutation("usageTracking:increment" as any, {
      orgId: client.orgId,
      metricType: "images_generated",
      count: generatedImages.length,
    });

    return NextResponse.json({
      success: true,
      images: generatedImages,
      generated: generatedImages.length,
      requested: actualVariations,
      errors: errors.length > 0 ? errors : undefined,
      cost,
      prompt: engineeredPrompt,
      style: recommendedStyle,
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate images" },
      { status: 500 }
    );
  }
}

/**
 * Extract brand colors from client assets
 */
function extractBrandColorsFromAssets(assets: any[]): string[] {
  // In production, this would analyze uploaded logos/images
  // For now, return default colors
  const defaultColors = ["#2563EB", "#3B82F6", "#60A5FA"];

  // TODO: Implement image analysis to extract dominant colors
  // Could use a service like Cloudinary or a color extraction library

  return defaultColors;
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
  orgId: string,
  requestedCount: number
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Fetch organization subscription
    const subscription = await convex.query("subscriptions:getByOrg" as any, { orgId });

    if (!subscription) {
      return { allowed: false, reason: "No active subscription found" };
    }

    if (subscription.status !== "active" && subscription.status !== "trialing") {
      return { allowed: false, reason: "Subscription is not active" };
    }

    // Check usage tracking
    const usage = await convex.query("usageTracking:getByOrgAndMetric" as any, {
      orgId,
      metricType: "images_generated",
    });

    // Define limits based on tier
    const limits = {
      starter: 50, // 50 images per month
      professional: 200, // 200 images per month
    };

    const limit = limits[subscription.planTier];
    const currentUsage = usage?.count || 0;

    if (currentUsage + requestedCount > limit) {
      return {
        allowed: false,
        reason: `Image generation limit reached (${currentUsage}/${limit}). Upgrade to generate more images.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking usage limits:", error);
    // Allow on error to prevent blocking
    return { allowed: true };
  }
}

/**
 * Track image generation for cost analytics
 */
async function trackImageGeneration(
  orgId: string,
  count: number,
  cost: number
): Promise<void> {
  try {
    // In production, store this in a cost tracking table
    console.log(`Image generation tracked: ${count} images, cost: $${cost.toFixed(4)} for org: ${orgId}`);

    // TODO: Implement cost tracking in Convex
    // await convex.mutation("costTracking:create", {
    //   orgId,
    //   service: "dalle",
    //   count,
    //   cost,
    //   timestamp: Date.now(),
    // });
  } catch (error) {
    console.error("Error tracking image generation:", error);
  }
}
