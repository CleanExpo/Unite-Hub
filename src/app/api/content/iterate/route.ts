import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * POST /api/content/iterate
 * Request iteration/revision for content
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate user
    const { supabaseBrowser } = await import("@/lib/supabase");
    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);

    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contentId, feedback } = body;

    if (!contentId) {
      return NextResponse.json({ error: "Content ID required" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get the content
    const { data: content, error: fetchError } = await supabase
      .from("generated_content")
      .select("*")
      .eq("id", contentId)
      .single();

    if (fetchError || !content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Log the iteration request
    await supabase.from("execution_logs").insert({
      workspace_id: content.workspace_id,
      content_id: contentId,
      action: "iterate",
      message: `Requested iteration for "${content.title}"`,
      platform: content.platform,
      status: "pending",
      metadata: {
        requested_by: userData.user.id,
        feedback: feedback || "No specific feedback provided",
        original_content: content.preview_text,
      },
    });

    // TODO: Trigger AI regeneration with feedback
    // This would call the content generation service with the feedback

    return NextResponse.json({
      success: true,
      message: `Iteration requested for "${content.title}"`,
      contentId,
      feedback: feedback || "No specific feedback provided",
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
