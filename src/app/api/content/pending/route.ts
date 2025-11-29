import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * GET /api/content/pending
 * Fetch pending content for approval cards
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const supabase = await getSupabaseServer();
    let workspaceId = req.nextUrl.searchParams.get("workspaceId");

    // If token provided, validate user
    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);

      if (authError || !userData.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get user's workspace if not provided
      if (!workspaceId) {
        const { data: userOrgs } = await supabase
          .from("user_organizations")
          .select("org_id")
          .eq("user_id", userData.user.id)
          .limit(1)
          .single();

        if (userOrgs) {
          const { data: workspace } = await supabase
            .from("workspaces")
            .select("id")
            .eq("org_id", userOrgs.org_id)
            .limit(1)
            .single();

          workspaceId = workspace?.id;
        }
      }
    }

    // Fetch pending content with workspace filter
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
    }

    const { data: content, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending content:", error);
      return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
    }

    // Transform to match UI expectations
    const transformedContent = (content || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.content_type,
      platform: item.platform,
      thumbnailUrl: item.thumbnail_url,
      previewText: item.preview_text,
      status: item.status,
      createdAt: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      content: transformedContent,
      count: transformedContent.length,
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
