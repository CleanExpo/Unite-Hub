import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id } = await params;
    const supabase = await getSupabaseServer();

    // Get current usage count
    const { data: template, error: fetchError } = await supabase
      .from("social_templates")
      .select("usage_count")
      .eq("id", id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Increment usage count
    const newUsageCount = (template.usage_count || 0) + 1;

    const { error: updateError } = await supabase
      .from("social_templates")
      .update({
        usage_count: newUsageCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error tracking usage:", updateError);
      return NextResponse.json(
        { error: "Failed to track usage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, usageCount: newUsageCount });
  } catch (error) {
    console.error("Error tracking usage:", error);
    return NextResponse.json(
      { error: "Failed to track usage" },
      { status: 500 }
    );
  }
}
