import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * POST /api/approvals/[id]/approve
 * Approve an approval request
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    const { id } = await context.params;
    const body = await request.json();
    const { reviewedById } = body;

    const supabase = await getSupabaseServer();
    const { data: approval, error } = await supabase
      .from("approvals")
      .update({
        status: "approved",
        reviewed_by_id: reviewedById || null,
        reviewed_at: new Date().toISOString(),
        decline_reason: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error approving approval:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ approval });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
