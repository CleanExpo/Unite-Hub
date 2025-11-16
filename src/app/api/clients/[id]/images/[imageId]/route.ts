import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { UUIDSchema } from "@/lib/validation/schemas";

/**
 * GET /api/clients/[id]/images/[imageId]
 * Get a specific image by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    // Apply rate limiting (100 req/15min - API tier)
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id: contactIdParam, imageId } = await params;

    if (!contactIdParam || !imageId) {
      return NextResponse.json(
        { error: "Contact ID and Image ID are required" },
        { status: 400 }
      );
    }

    const contactId = contactIdParam; // Support both contactId and clientId

    // Validate IDs
    const contactIdValidation = UUIDSchema.safeParse(contactId);
    const imageIdValidation = UUIDSchema.safeParse(imageId);

    if (!contactIdValidation.success || !imageIdValidation.success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch image
    const { data: image, error: imageError } = await supabase
      .from("generated_images")
      .select("*")
      .eq("id", imageId)
      .single();

    if (imageError || !image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Verify image belongs to contact
    if (image.contact_id !== contactId) {
      return NextResponse.json(
        { error: "Image does not belong to this contact" },
        { status: 403 }
      );
    }

    // Verify workspace access
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("org_id")
      .eq("id", image.workspace_id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify user has access
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("org_id", workspace.org_id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
    // Apply rate limiting (100 req/15min - API tier)
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id: contactIdParam, imageId } = await params;

    if (!contactIdParam || !imageId) {
      return NextResponse.json(
        { error: "Contact ID and Image ID are required" },
        { status: 400 }
      );
    }

    const contactId = contactIdParam;

    // Validate IDs
    const contactIdValidation = UUIDSchema.safeParse(contactId);
    const imageIdValidation = UUIDSchema.safeParse(imageId);

    if (!contactIdValidation.success || !imageIdValidation.success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch image to verify ownership
    const { data: image, error: imageError } = await supabase
      .from("generated_images")
      .select("contact_id, workspace_id")
      .eq("id", imageId)
      .single();

    if (imageError || !image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Verify image belongs to contact
    if (image.contact_id !== contactId) {
      return NextResponse.json(
        { error: "Image does not belong to this contact" },
        { status: 403 }
      );
    }

    // Verify workspace access
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("org_id")
      .eq("id", image.workspace_id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify user has access
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("org_id", workspace.org_id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only allow admin or owner to delete
    if (userOrg.role !== "owner" && userOrg.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions. Only owners and admins can delete images." },
        { status: 403 }
      );
    }

    // Delete image from Supabase
    const { error: deleteError } = await supabase
      .from("generated_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      console.error("Failed to delete image:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }

    // TODO: Also delete from cloud storage if needed
    // For now, DALL-E images are hosted by OpenAI, so no cleanup needed

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
 * Update image metadata (status, additional params)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    // Apply rate limiting (100 req/15min - API tier)
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id: contactIdParam, imageId } = await params;
    const updates = await request.json();

    if (!contactIdParam || !imageId) {
      return NextResponse.json(
        { error: "Contact ID and Image ID are required" },
        { status: 400 }
      );
    }

    const contactId = contactIdParam;

    // Validate IDs
    const contactIdValidation = UUIDSchema.safeParse(contactId);
    const imageIdValidation = UUIDSchema.safeParse(imageId);

    if (!contactIdValidation.success || !imageIdValidation.success) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch image to verify ownership
    const { data: image, error: imageError } = await supabase
      .from("generated_images")
      .select("contact_id, workspace_id, additional_params")
      .eq("id", imageId)
      .single();

    if (imageError || !image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Verify image belongs to contact
    if (image.contact_id !== contactId) {
      return NextResponse.json(
        { error: "Image does not belong to this contact" },
        { status: 403 }
      );
    }

    // Verify workspace access
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("org_id")
      .eq("id", image.workspace_id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Verify user has access
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("org_id", workspace.org_id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Build update object (only allow safe fields)
    const updateData: any = {};

    if (updates.status && ["pending", "processing", "completed", "failed"].includes(updates.status)) {
      updateData.status = updates.status;
    }

    if (updates.additional_params) {
      // Merge with existing params
      updateData.additional_params = {
        ...image.additional_params,
        ...updates.additional_params,
      };
    }

    // Update image in Supabase
    const { data: updatedImage, error: updateError } = await supabase
      .from("generated_images")
      .update(updateData)
      .eq("id", imageId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update image:", updateError);
      return NextResponse.json(
        { error: "Failed to update image" },
        { status: 500 }
      );
    }

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
