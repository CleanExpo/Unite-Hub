import { NextRequest, NextResponse } from "next/server";
import { generateImage, validatePrompt } from "@/lib/dalle/client";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface RegenerateImageRequest {
  imageId: string;
  newPrompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
}

/**
 * POST /api/images/regenerate
 * Regenerate an existing image with a new prompt
 */
export async function POST(request: NextRequest) {
  try {
    const body: RegenerateImageRequest = await request.json();
    const {
      imageId,
      newPrompt,
      size = "1024x1024",
      quality = "standard",
    } = body;

    // Validate required fields
    if (!imageId || !newPrompt) {
      return NextResponse.json(
        { error: "imageId and newPrompt are required" },
        { status: 400 }
      );
    }

    // Validate prompt
    const validation = validatePrompt(newPrompt);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid prompt: ${validation.reason}` },
        { status: 400 }
      );
    }

    // Fetch original image
    const originalImage = await convex.query("imageConcepts:getById" as any, {
      id: imageId as any,
    });

    if (!originalImage) {
      return NextResponse.json(
        { error: "Original image not found" },
        { status: 404 }
      );
    }

    // Fetch client to check subscription
    const client = await convex.query("clients:get" as any, {
      clientId: originalImage.clientId,
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check usage limits
    const subscription = await convex.query("subscriptions:getByOrg" as any, {
      orgId: client.orgId,
    });

    if (!subscription || (subscription.status !== "active" && subscription.status !== "trialing")) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 403 }
      );
    }

    // Generate new image
    const result = await generateImage({
      prompt: newPrompt,
      size,
      quality,
      style: "vivid",
    });

    // Update the image concept in Convex
    await convex.mutation("imageConcepts:update" as any, {
      id: imageId as any,
      imageUrl: result.url,
      prompt: newPrompt,
      dalleImageId: `dalle-regen-${Date.now()}`,
    });

    // Track regeneration
    await convex.mutation("usageTracking:increment" as any, {
      orgId: client.orgId,
      metricType: "images_generated",
      count: 1,
    });

    return NextResponse.json({
      success: true,
      image: {
        id: imageId,
        url: result.url,
        prompt: newPrompt,
        revisedPrompt: result.revisedPrompt,
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
