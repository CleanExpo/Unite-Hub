import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";

/**
 * GET /api/campaigns
 * List all campaigns for a workspace
 */
export async function GET(req: NextRequest) {
  try {
    // Get workspace ID from query params
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId parameter is required" },
        { status: 400 }
      );
    }

    // Validate user authentication and workspace access
    await validateUserAndWorkspace(req, workspaceId);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Fetch campaigns from database
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching campaigns:", error);
      return NextResponse.json(
        { error: "Failed to fetch campaigns" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      count: campaigns?.length || 0,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Unexpected error in /api/campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      workspaceId,
      name,
      subject,
      content,
      status = "draft",
      scheduled_at,
    } = body;

    // Validation
    if (!workspaceId || !name || !subject) {
      return NextResponse.json(
        { error: "workspaceId, name, and subject are required" },
        { status: 400 }
      );
    }

    // Validate user authentication and workspace access
    const user = await validateUserAndWorkspace(req, workspaceId);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Create campaign
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        workspace_id: workspaceId,
        name,
        subject,
        content: content || "",
        status,
        scheduled_at,
        created_by: user.userId, // Track creator
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating campaign:", error);
      return NextResponse.json(
        { error: "Failed to create campaign" },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Unexpected error in POST /api/campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
