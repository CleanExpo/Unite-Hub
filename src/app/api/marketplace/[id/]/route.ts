import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

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

    const { data: component, error } = await supabase
      .from("marketplace_components")
      .select("*")
      .eq("id", componentId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error || !component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    const { data: variants } = await supabase
      .from("component_variants")
      .select("id, name, variant_type, component_code, html_preview")
      .eq("component_id", componentId);

    const { data: favorite } = await supabase
      .from("component_favorites")
      .select("id")
      .eq("component_id", componentId)
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    await supabase
      .from("marketplace_components")
      .update({ view_count: (component.view_count || 0) + 1 })
      .eq("id", componentId);

    return NextResponse.json({
      success: true,
      data: {
        ...component,
        variants: variants || [],
        isFavorited: !!favorite,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
