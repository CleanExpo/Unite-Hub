import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { z } from "zod";

/**
 * PUT /api/calendar/[postId] - Update calendar post
 * DELETE /api/calendar/[postId] - Delete calendar post
 */

const UUIDSchema = z.string().uuid("Invalid UUID format");

const UpdatePostSchema = z.object({
  suggestedCopy: z.string().optional(),
  suggestedHashtags: z.array(z.string()).optional(),
  suggestedImagePrompt: z.string().optional(),
  callToAction: z.string().optional(),
  scheduledDate: z.string().optional(),
  platform: z.enum(['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'general']).optional(),
  postType: z.enum(['post', 'story', 'reel', 'carousel', 'video', 'article']).optional(),
  contentPillar: z.string().optional(),
  status: z.enum(['draft', 'approved', 'published', 'archived']).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    const { postId } = await params;

    // Validate post ID
    const postIdValidation = UUIDSchema.safeParse(postId);
    if (!postIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid post ID format" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = UpdatePostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get post to verify ownership
    const { data: post, error: postError } = await supabase
      .from("calendar_posts")
      .select("id, contact_id, workspace_id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Calendar post not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this workspace
    const { data: userOrg, error: userOrgError } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (validation.data.suggestedCopy !== undefined) {
      updateData.suggested_copy = validation.data.suggestedCopy;
    }
    if (validation.data.suggestedHashtags !== undefined) {
      updateData.suggested_hashtags = validation.data.suggestedHashtags;
    }
    if (validation.data.suggestedImagePrompt !== undefined) {
      updateData.suggested_image_prompt = validation.data.suggestedImagePrompt;
    }
    if (validation.data.callToAction !== undefined) {
      updateData.call_to_action = validation.data.callToAction;
    }
    if (validation.data.scheduledDate !== undefined) {
      updateData.scheduled_date = new Date(validation.data.scheduledDate).toISOString();
    }
    if (validation.data.platform !== undefined) {
      updateData.platform = validation.data.platform;
    }
    if (validation.data.postType !== undefined) {
      updateData.post_type = validation.data.postType;
    }
    if (validation.data.contentPillar !== undefined) {
      updateData.content_pillar = validation.data.contentPillar;
    }
    if (validation.data.status !== undefined) {
      updateData.status = validation.data.status;
    }

    // Update the post
    const { error: updateError } = await supabase
      .from("calendar_posts")
      .update(updateData)
      .eq("id", postId);

    if (updateError) {
      console.error("Failed to update post:", updateError);
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postId,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error updating calendar post:", error);
    return NextResponse.json(
      {
        error: "Failed to update post",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) return rateLimitResult;

    const { postId } = await params;

    // Validate post ID
    const postIdValidation = UUIDSchema.safeParse(postId);
    if (!postIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid post ID format" },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get post to verify ownership
    const { data: post, error: postError } = await supabase
      .from("calendar_posts")
      .select("id, contact_id, workspace_id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Calendar post not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this workspace
    const { data: userOrg, error: userOrgError } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from("calendar_posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Failed to delete post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error deleting calendar post:", error);
    return NextResponse.json(
      {
        error: "Failed to delete post",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
