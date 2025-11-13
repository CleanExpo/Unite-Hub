import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/clients/[id]/images
 * Get all generated images for a client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await convex.query("clients:get" as any, { clientId });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const conceptType = searchParams.get("conceptType");
    const platform = searchParams.get("platform");
    const isUsed = searchParams.get("isUsed");

    // Build query filters
    const filters: any = { clientId };

    if (conceptType) {
      filters.conceptType = conceptType;
    }

    if (platform) {
      filters.platform = platform;
    }

    if (isUsed !== null) {
      filters.isUsed = isUsed === "true";
    }

    // Fetch images from Convex
    const images = await convex.query("imageConcepts:getByClient" as any, filters);

    // Sort by creation date (newest first)
    const sortedImages = images.sort((a: any, b: any) => b.createdAt - a.createdAt);

    return NextResponse.json({
      success: true,
      images: sortedImages,
      count: sortedImages.length,
      filters: {
        conceptType,
        platform,
        isUsed,
      },
    });
  } catch (error: any) {
    console.error("Fetch client images error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch images" },
      { status: 500 }
    );
  }
}
