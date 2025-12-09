import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    const componentId = params.id;
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: component } = await supabase
      .from("marketplace_components")
      .select("id, favorite_count")
      .eq("id", componentId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("component_favorites")
      .select("id")
      .eq("component_id", componentId)
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    let isFavorited = false;

    if (existing) {
      await supabase
        .from("component_favorites")
        .delete()
        .eq("id", existing.id);

      await supabase
        .from("marketplace_components")
        .update({ favorite_count: Math.max(0, (component.favorite_count || 1) - 1) })
        .eq("id", componentId);
    } else {
      const { error } = await supabase
        .from("component_favorites")
        .insert({
          component_id: componentId,
          user_id: user.id,
          workspace_id: workspaceId,
        });

      if (error) {
        console.error("Error adding favorite:", error);
        return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
      }

      isFavorited = true;

      await supabase
        .from("marketplace_components")
        .update({ favorite_count: (component.favorite_count || 0) + 1 })
        .eq("id", componentId);
    }

    const { data: updated } = await supabase
      .from("marketplace_components")
      .select("favorite_count")
      .eq("id", componentId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      isFavorited,
      favorite_count: updated?.favorite_count || 0,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
