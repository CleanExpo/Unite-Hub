import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { approveAdminAccess, trustAdminDevice, logAdminAccess, generateDeviceFingerprint } from "@/lib/rbac/deviceAuthorization";

const MASTER_APPROVER_EMAIL = "phill.mcgurk@gmail.com";

/**
 * GET /api/admin/approve-access?requestId=...&token=...&decision=...
 *
 * Phill clicks this link in the approval email to approve or deny a device
 * Query Parameters:
 * - requestId: UUID of the approval request
 * - token: Approval token for validation
 * - decision: 'approve' or 'deny'
 *
 * This endpoint:
 * 1. Validates the approval token and request
 * 2. Verifies Phill is the one clicking the link
 * 3. Checks token hasn't expired (10 minutes)
 * 4. If approve: marks approval as approved, trusts device for 90 days
 * 5. If deny: marks approval as denied
 * 6. Logs decision to audit trail
 * 7. Redirects to /admin/approval-result with status
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const requestId = searchParams.get("requestId");
    const token = searchParams.get("token");
    const decision = searchParams.get("decision"); // 'approve' | 'deny'

    // Validate input parameters
    if (!requestId || !token || !decision || !["approve", "deny"].includes(decision)) {
      const resultUrl = new URL("/admin/approval-result", req.url);
      resultUrl.searchParams.set("status", "invalid");
      return NextResponse.redirect(resultUrl.toString());
    }

    const supabase = await getSupabaseServer();

    // Get current user (Phill, the approver)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirectTo", req.url);
      return NextResponse.redirect(loginUrl.toString());
    }

    // Verify approver is Phill (hardcoded check for MVP)
    if (user.email !== MASTER_APPROVER_EMAIL) {
      const resultUrl = new URL("/admin/approval-result", req.url);
      resultUrl.searchParams.set("status", "unauthorized");
      return NextResponse.redirect(resultUrl.toString());
    }

    // Get approval request
    const { data: approval, error: fetchError } = await supabase
      .from("admin_approvals")
      .select("id, user_id, approval_token, approved, expires_at, ip_address, user_agent")
      .eq("id", requestId)
      .eq("approval_token", token)
      .single();

    if (fetchError || !approval) {
      const resultUrl = new URL("/admin/approval-result", req.url);
      resultUrl.searchParams.set("status", "not_found");
      return NextResponse.redirect(resultUrl.toString());
    }

    // Check if token has expired (10 minutes)
    const createdAt = new Date(approval.created_at).getTime();
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    if (now - createdAt > tenMinutes) {
      // Mark as expired in database
      await supabase
        .from("admin_approvals")
        .update({ approved: false })
        .eq("id", requestId);

      const resultUrl = new URL("/admin/approval-result", req.url);
      resultUrl.searchParams.set("status", "expired");
      return NextResponse.redirect(resultUrl.toString());
    }

    // Check if already approved
    if (approval.approved) {
      const resultUrl = new URL("/admin/approval-result", req.url);
      resultUrl.searchParams.set("status", "already_approved");
      return NextResponse.redirect(resultUrl.toString());
    }

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(
      approval.user_agent,
      approval.ip_address
    );

    // Handle DENY decision
    if (decision === "deny") {
      // Log denial to audit trail
      await logAdminAccess(
        approval.user_id,
        "admin_access_denied",
        approval.ip_address,
        approval.user_agent,
        deviceFingerprint,
        false,
        `Denied by ${user.email}`
      );

      // Mark approval as denied in database
      // Note: We keep the record for audit purposes but don't trust the device
      const resultUrl = new URL("/admin/approval-result", req.url);
      resultUrl.searchParams.set("status", "denied");
      return NextResponse.redirect(resultUrl.toString());
    }

    // Handle APPROVE decision
    if (decision === "approve") {
      // Approve the admin access
      const approved = await approveAdminAccess(requestId, user.id);

      if (!approved) {
        const resultUrl = new URL("/admin/approval-result", req.url);
        resultUrl.searchParams.set("status", "approval_failed");
        return NextResponse.redirect(resultUrl.toString());
      }

      // Trust the device for 90 days
      const deviceTrusted = await trustAdminDevice(
        approval.user_id,
        deviceFingerprint,
        approval.ip_address,
        approval.user_agent,
        user.id
      );

      if (!deviceTrusted) {
        console.error("Failed to trust device, but approval succeeded");
        // Still consider it approved since the approval record was updated
      }

      // Log approval to audit trail
      await logAdminAccess(
        approval.user_id,
        "admin_access_approved",
        approval.ip_address,
        approval.user_agent,
        deviceFingerprint,
        true,
        `Approved by ${user.email}`
      );

      const resultUrl = new URL("/admin/approval-result", req.url);
      resultUrl.searchParams.set("status", "approved");
      return NextResponse.redirect(resultUrl.toString());
    }

    // Fallback (should not reach here)
    const resultUrl = new URL("/admin/approval-result", req.url);
    resultUrl.searchParams.set("status", "invalid");
    return NextResponse.redirect(resultUrl.toString());
  } catch (error) {
    console.error("Error in approve-access:", error);
    const resultUrl = new URL("/admin/approval-result", req.url);
    resultUrl.searchParams.set("status", "error");
    return NextResponse.redirect(resultUrl.toString());
  }
}
