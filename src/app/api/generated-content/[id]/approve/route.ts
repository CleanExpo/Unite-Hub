import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user
    await validateUserAuth(request);

    const { id } = await params;
    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Update content status to deployed
    const { data, error } = await supabase
      .from("generated_content")
      .update({
        status: "deployed",
        deployed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error) {
      console.error("Error approving content:", error);
      return NextResponse.json(
        { error: "Failed to approve content" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Log the execution
    await supabase.from("execution_logs").insert({
      workspace_id: workspaceId,
      content_id: id,
      action: "deploy",
      message: `Deployed ${data.content_type}: ${data.title}`,
      platform: data.platform || "meta",
      status: "success",
    });

    return NextResponse.json({
      success: true,
      content: {
        id: data.id,
        title: data.title,
        type: data.content_type,
        status: data.status,
        deployedAt: data.deployed_at,
      },
    });
  } catch (error: unknown) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Approve content error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve content" },
      { status: 500 }
    );
  }
}
