import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      // Use browser client for implicit OAuth tokens
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      // Fallback to server-side cookies (PKCE flow)
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get Supabase instance for database operations
    const supabase = await getSupabaseServer();

    // Parse request body
    const body = await req.json();
    const {
      title,
      client_name,
      description,
      status,
      priority,
      progress,
      workspace_id,
      org_id,
    } = body;

    // Validate required fields
    if (!title || !client_name || !workspace_id || !org_id) {
      return NextResponse.json(
        { error: "Missing required fields: title, client_name, workspace_id, org_id" },
        { status: 400 }
      );
    }

    // Create project
    const { data: project, error: createError } = await supabase
      .from("projects")
      .insert({
        title,
        client_name,
        description: description || null,
        status: status || "on-track",
        priority: priority || "medium",
        progress: progress || 0,
        workspace_id,
        org_id,
        created_by: userId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating project:", createError);
      return NextResponse.json(
        { error: "Failed to create project", details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
