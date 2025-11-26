import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getPendingApprovals } from "@/lib/rbac/deviceAuthorization";

/**
 * GET /api/admin/pending-approvals
 *
 * Returns pending approval requests (only for Phill)
 * Shows all admin device approvals that are awaiting Phill's action
 *
 * Response:
 * {
 *   approvals: Array<{
 *     id: string
 *     user_id: string
 *     profiles: { email: string }
 *     ip_address: string
 *     user_agent: string
 *     approved: boolean
 *     requested_at: string
 *     expires_at: string
 *   }>
 *   count: number
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is Phill (only he can see pending approvals)
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (userProfile?.email !== "phill.mcgurk@gmail.com") {
      return NextResponse.json(
        { error: "Only Phill can view pending approvals" },
        { status: 403 }
      );
    }

    // Get pending approvals
    const approvals = await getPendingApprovals();

    // Filter out expired approvals (safety check, DB should handle this)
    const now = new Date();
    const validApprovals = approvals.filter(
      (approval: any) => new Date(approval.expires_at) > now
    );

    return NextResponse.json({
      success: true,
      approvals: validApprovals,
      count: validApprovals.length,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/pending-approvals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
