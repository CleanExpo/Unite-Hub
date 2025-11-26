import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getUserTrustedDevices, revokeTrustedDevice } from "@/lib/rbac/deviceAuthorization";
import { isUserAdmin } from "@/lib/rbac/getUserRole";

/**
 * GET /api/admin/trusted-devices
 * Returns list of trusted devices for authenticated user
 *
 * Response:
 * {
 *   devices: Array<{
 *     id: string
 *     ip_address: string
 *     user_agent: string
 *     last_used: string
 *     expires_at: string
 *     created_at: string
 *   }>
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

    // Verify user is admin
    const isAdmin = await isUserAdmin(user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can view trusted devices" },
        { status: 403 }
      );
    }

    // Get trusted devices
    const devices = await getUserTrustedDevices(user.id);

    return NextResponse.json({
      success: true,
      devices,
      count: devices.length,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/trusted-devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/trusted-devices?device_id=...
 * Revokes trust for a specific device
 *
 * Query Parameters:
 * - device_id: UUID of the device to revoke
 *
 * Response:
 * {
 *   success: boolean
 *   message: string
 * }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const deviceId = searchParams.get("device_id");

    if (!deviceId) {
      return NextResponse.json(
        { error: "Missing device_id parameter" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const isAdmin = await isUserAdmin(user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can revoke devices" },
        { status: 403 }
      );
    }

    // Verify device belongs to user
    const { data: device } = await supabase
      .from("admin_trusted_devices")
      .select("id, user_id")
      .eq("id", deviceId)
      .single();

    if (!device || device.user_id !== user.id) {
      return NextResponse.json(
        { error: "Device not found or does not belong to you" },
        { status: 404 }
      );
    }

    // Revoke device
    const revoked = await revokeTrustedDevice(deviceId);

    if (!revoked) {
      return NextResponse.json(
        { error: "Failed to revoke device" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Device access revoked successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/trusted-devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
