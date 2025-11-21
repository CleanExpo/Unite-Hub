import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user
    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const status = searchParams.get("status");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Query generated content
    let query = supabase
      .from("generated_content")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching generated content:", error);
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const content = (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.content_type,
      platform: item.platform,
      thumbnailUrl: item.thumbnail_url,
      previewText: item.preview_text,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return NextResponse.json({ content });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Generated content error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user
    await validateUserAuth(request);

    const body = await request.json();
    const { workspaceId, title, type, platform, thumbnailUrl, previewText, aiPrompt } = body;

    if (!workspaceId || !title || !type) {
      return NextResponse.json(
        { error: "workspaceId, title, and type are required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("generated_content")
      .insert({
        workspace_id: workspaceId,
        title,
        content_type: type,
        platform,
        thumbnail_url: thumbnailUrl,
        preview_text: previewText,
        ai_prompt: aiPrompt,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating content:", error);
      return NextResponse.json(
        { error: "Failed to create content" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: {
        id: data.id,
        title: data.title,
        type: data.content_type,
        platform: data.platform,
        thumbnailUrl: data.thumbnail_url,
        previewText: data.preview_text,
        status: data.status,
        createdAt: data.created_at,
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create content error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create content" },
      { status: 500 }
    );
  }
}
