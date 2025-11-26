import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { createApprovalRequest, logAdminAccess, generateDeviceFingerprint } from "@/lib/rbac/deviceAuthorization";
import { sendEmail } from "@/lib/email/email-service";

/**
 * POST /api/admin/send-approval-email
 *
 * Creates an approval request and sends email to Phill
 * Called when an admin tries to access /crm from an untrusted device
 *
 * Request body:
 * {
 *   userId: string (UUID)
 *   ipAddress: string
 *   userAgent: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ipAddress, userAgent } = body;

    if (!userId || !ipAddress || !userAgent) {
      return NextResponse.json(
        { error: "Missing required fields: userId, ipAddress, userAgent" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Verify user is authenticated and admin
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", userId)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can request approval" },
        { status: 403 }
      );
    }

    // Create approval request
    const approval = await createApprovalRequest(userId, ipAddress, userAgent);

    // Get Phill's email (the approver)
    const { data: phill } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", "phill.mcgurk@gmail.com")
      .single();

    if (!phill?.email) {
      console.error("Phill not found in profiles table");
      return NextResponse.json(
        { error: "Approval system misconfigured" },
        { status: 500 }
      );
    }

    // Send approval email to Phill with both approve and deny options
    const approveLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/approve-access?requestId=${approval.approvalId}&token=${approval.approvalToken}&decision=approve`;
    const denyLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/approve-access?requestId=${approval.approvalId}&token=${approval.approvalToken}&decision=deny`;

    const emailResult = await sendEmail({
      to: phill.email,
      subject: `[Unite-Hub] Device Approval Request from ${profile?.email}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; margin-top: 0;">Device Approval Request</h2>

            <p style="color: #555; line-height: 1.6;">
              User <strong style="color: #007bff;">${profile?.email}</strong> is requesting access to the CRM system from a new device.
            </p>

            <div style="background-color: #f9f9f9; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #333;">Device Details:</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #666;">
                <li><strong>User Agent:</strong> ${userAgent}</li>
                <li><strong>IP Address:</strong> ${ipAddress}</li>
                <li><strong>Request Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Approval Expires:</strong> ${approval.expiresAt.toLocaleString()}</li>
              </ul>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 12px; margin: 20px 0; color: #856404;">
              <strong>⏱️ Action Required:</strong> The link expires in 10 minutes. Please approve or deny this request promptly.
            </div>

            <div style="margin: 30px 0; text-align: center;">
              <a href="${approveLink}" style="display: inline-block; padding: 12px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
                ✓ Approve Device
              </a>
              <a href="${denyLink}" style="display: inline-block; padding: 12px 30px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ✕ Deny Request
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated message from Unite-Hub. If you did not expect this request, please deny it. For security questions, contact your administrator.
            </p>
          </div>
        </div>
      `,
      text: `Device Approval Request\n\nUser ${profile?.email} is requesting access to the CRM system from a new device.\n\nDevice Details:\n- User Agent: ${userAgent}\n- IP Address: ${ipAddress}\n- Request Time: ${new Date().toLocaleString()}\n- Approval Expires: ${approval.expiresAt.toLocaleString()}\n\nAction Required: The link expires in 10 minutes.\n\nApprove: ${approveLink}\nDeny: ${denyLink}\n\nThis is an automated message from Unite-Hub.`,
    });

    if (!emailResult.success) {
      console.error("Failed to send approval email:", emailResult);

      // Log failure
      const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);
      await logAdminAccess(
        userId,
        "admin_approval_email_failed",
        ipAddress,
        userAgent,
        deviceFingerprint,
        false,
        `Email service failed: ${emailResult.error}`
      );

      return NextResponse.json(
        { error: "Failed to send approval email" },
        { status: 500 }
      );
    }

    // Log success
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);
    await logAdminAccess(
      userId,
      "admin_approval_requested",
      ipAddress,
      userAgent,
      deviceFingerprint,
      true
    );

    return NextResponse.json({
      success: true,
      approvalId: approval.approvalId,
      message: "Approval request sent to Phill",
      expiresAt: approval.expiresAt.toISOString(),
      emailSentTo: phill.email,
      provider: emailResult.provider,
    });
  } catch (error) {
    console.error("Error in send-approval-email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
