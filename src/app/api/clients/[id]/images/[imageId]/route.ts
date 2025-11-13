import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/clients/[id]/images/[imageId]
 * Get a specific image by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: clientId, imageId } = await params;

    if (!clientId || !imageId) {
      return NextResponse.json(
        { error: "Client ID and Image ID are required" },
        { status: 400 }
      );
    }

    // Fetch image from Convex
    const image = await convex.query("imageConcepts:getById" as any, { id: imageId as any });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Verify image belongs to client
    if (image.clientId !== clientId) {
      return NextResponse.json(
        { error: "Image does not belong to this client" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error: any) {
    console.error("Fetch image error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch image" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]/images/[imageId]
 * Delete a specific image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: clientId, imageId } = await params;

    if (!clientId || !imageId) {
      return NextResponse.json(
        { error: "Client ID and Image ID are required" },
        { status: 400 }
      );
    }

    // Fetch image to verify ownership
    const image = await convex.query("imageConcepts:getById" as any, { id: imageId as any });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Verify image belongs to client
    if (image.clientId !== clientId) {
      return NextResponse.json(
        { error: "Image does not belong to this client" },
        { status: 403 }
      );
    }

    // Delete image from Convex
    await convex.mutation("imageConcepts:deleteImage" as any, { id: imageId as any });

    // TODO: Also delete from cloud storage if needed
    // await deleteFromCloudStorage(image.imageUrl);

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete image" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/[id]/images/[imageId]
 * Update image metadata (mark as used, update recommendations, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: clientId, imageId } = await params;
    const updates = await request.json();

    if (!clientId || !imageId) {
      return NextResponse.json(
        { error: "Client ID and Image ID are required" },
        { status: 400 }
      );
    }

    // Fetch image to verify ownership
    const image = await convex.query("imageConcepts:getById" as any, { id: imageId as any });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Verify image belongs to client
    if (image.clientId !== clientId) {
      return NextResponse.json(
        { error: "Image does not belong to this client" },
        { status: 403 }
      );
    }

    // Update image in Convex
    await convex.mutation("imageConcepts:update" as any, {
      id: imageId as any,
      ...updates,
    });

    // Fetch updated image
    const updatedImage = await convex.query("imageConcepts:getById" as any, {
      id: imageId as any,
    });

    return NextResponse.json({
      success: true,
      image: updatedImage,
    });
  } catch (error: any) {
    console.error("Update image error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update image" },
      { status: 500 }
    );
  }
}
