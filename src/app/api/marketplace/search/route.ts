import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    const query = request.nextUrl.searchParams.get("query");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ data: [], error: null });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchTerm = `%${query}%`;
    const { data: components, error } = await supabase
      .from("marketplace_components")
      .select("*")
      .eq("workspace_id", workspaceId)
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(100);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to search components" }, { status: 500 });
    }

    const { data: favorites } = await supabase
      .from("component_favorites")
      .select("component_id")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId);

    const favSet = new Set(favorites?.map(f => f.component_id) || []);
    const enriched = components?.map(c => ({ ...c, isFavorited: favSet.has(c.id) })) || [];

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
