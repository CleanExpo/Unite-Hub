import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";
import { z } from "zod";

/**
 * POST /api/calendar/[postId]/approve
 * Approve a calendar post for publishing
 */

const UUIDSchema = z.string().uuid("Invalid UUID format");

export async function POST(
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
      .select("id, contact_id, workspace_id, status")
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
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (userOrgError || !userOrg) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Approve the post
    const { error: updateError } = await supabase
      .from("calendar_posts")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq("id", postId);

    if (updateError) {
      console.error("Failed to approve post:", updateError);
      return NextResponse.json(
        { error: "Failed to approve post" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postId,
      status: "approved",
    });
  } catch (error: any) {
    console.error("Error approving calendar post:", error);
    return NextResponse.json(
      {
        error: "Failed to approve post",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
