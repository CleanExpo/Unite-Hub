import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    const featured = request.nextUrl.searchParams.get("featured") === "true";

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("component_collections")
      .select("id, name, description, theme_color, component_ids, view_count, is_featured")
      .eq("workspace_id", workspaceId);

    if (featured) {
      query = query.eq("is_featured", true);
    }

    query = query.order("order_index", { ascending: true, nullsFirst: true })
      .order("name", { ascending: true });

    const { data: collections, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }

    const enrichedCollections = await Promise.all(
      (collections || []).map(async (collection: any) => {
        if (!collection.component_ids || collection.component_ids.length === 0) {
          return { ...collection, components: [] };
        }

        const { data: componentDetails } = await supabase
          .from("marketplace_components")
          .select("id, name, category, style_tag, view_count, rating")
          .in("id", collection.component_ids)
          .limit(collection.component_ids.length);

        return { ...collection, components: componentDetails || [] };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedCollections,
      meta: { total: enrichedCollections.length },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
