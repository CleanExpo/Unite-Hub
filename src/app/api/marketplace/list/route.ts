import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "20"), 100);
    const category = request.nextUrl.searchParams.get("category");
    const style_tag = request.nextUrl.searchParams.get("style_tag");
    const sort = request.nextUrl.searchParams.get("sort") || "newest";

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("marketplace_components")
      .select("*", { count: "exact" })
      .eq("workspace_id", workspaceId);

    if (category) {
query = query.eq("category", category);
}
    if (style_tag) {
query = query.eq("style_tag", style_tag);
}

    if (sort === "popular") {
      query = query.order("view_count", { ascending: false });
    } else if (sort === "rating") {
      query = query.order("rating", { ascending: false, nullsLast: true });
    } else if (sort === "alphabetical") {
      query = query.order("name", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const offset = (page - 1) * limit;
    const { data: components, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch components" }, { status: 500 });
    }

    const { data: favorites } = await supabase
      .from("component_favorites")
      .select("component_id")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId);

    const favSet = new Set(favorites?.map(f => f.component_id) || []);
    const enriched = components?.map(c => ({ ...c, isFavorited: favSet.has(c.id) })) || [];

    return NextResponse.json({
      success: true,
      data: enriched,
      meta: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
