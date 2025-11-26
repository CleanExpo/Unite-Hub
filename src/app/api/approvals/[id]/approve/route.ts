import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

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

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();
    const { reviewedById } = body;

    // Get approval to verify org ownership
    const supabase = await getSupabaseServer();
    const { data: existingApproval, error: fetchError } = await supabase
      .from("approvals")
      .select("org_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingApproval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    // Verify org ownership
    if (existingApproval.org_id !== user.orgId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: approval, error } = await supabase
      .from("approvals")
      .update({
        status: "approved",
        reviewed_by_id: reviewedById || user.userId,
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
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
