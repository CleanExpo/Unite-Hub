import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * POST /api/content/approve
 * Approve content and trigger deployment
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
    const { contentId, deploymentTargets } = body;

    if (!contentId) {
      return NextResponse.json({ error: "Content ID required" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get user's workspace for authorization
    const { data: userOrgs } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", userData.user.id)
      .limit(1)
      .single();

    if (!userOrgs) {
      return NextResponse.json({ error: "User has no organization" }, { status: 403 });
    }

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("org_id", userOrgs.org_id)
      .limit(1)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 403 });
    }

    // Get the content to approve - with workspace verification
    const { data: content, error: fetchError } = await supabase
      .from("generated_content")
      .select("*")
      .eq("id", contentId)
      .eq("workspace_id", workspace.id)
      .single();

    if (fetchError || !content) {
      return NextResponse.json({ error: "Content not found or access denied" }, { status: 404 });
    }

    // Update content status to approved
    const { error: updateError } = await supabase
      .from("generated_content")
      .update({
        status: "approved",
        deployed_at: new Date().toISOString(),
      })
      .eq("id", contentId);

    if (updateError) {
      console.error("Error approving content:", updateError);
      return NextResponse.json({ error: "Failed to approve content" }, { status: 500 });
    }

    // Log the approval action
    await supabase.from("execution_logs").insert({
      workspace_id: content.workspace_id,
      content_id: contentId,
      action: "approve",
      message: `Approved "${content.title}"`,
      platform: content.platform,
      status: "success",
      metadata: {
        approved_by: userData.user.id,
        deployment_targets: deploymentTargets || [content.platform],
      },
    });

    // Log deployment action
    const platforms = deploymentTargets || [content.platform];
    for (const platform of platforms) {
      await supabase.from("execution_logs").insert({
        workspace_id: content.workspace_id,
        content_id: contentId,
        action: "deploy",
        message: `Deployed to ${platform}`,
        platform: platform,
        status: "success",
        metadata: {
          content_type: content.content_type,
          title: content.title,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Content "${content.title}" approved and deployed`,
      contentId,
      deployedTo: platforms,
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
