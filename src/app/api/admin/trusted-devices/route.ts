import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  generateDeviceFingerprint,
  logAdminAccess,
} from "@/lib/rbac/deviceAuthorization";

type AdminContext = {
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>;
  user: { id: string };
  email: string;
};

async function requireAdmin(): Promise<
  | { context: AdminContext }
  | { response: NextResponse }
> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      response: NextResponse.json(
        { error: "Unable to load user profile" },
        { status: 500 }
      ),
    };
  }

  if (profile.role !== "admin") {
    return {
      response: NextResponse.json(
        { error: "Only admins can manage trusted devices" },
        { status: 403 }
      ),
    };
  }

  return { context: { supabase, user, email: profile.email } };
}

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "";
  }
  return req.headers.get("x-real-ip") || "";
}

function normalizeDevice(device: any) {
  const lastUsed =
    device?.last_used ||
    device?.last_used_at ||
    device?.trusted_at ||
    device?.created_at;

  return {
    id: device.id,
    ip_address: device.ip_address ? String(device.ip_address) : "",
    user_agent: device.user_agent || device.device_name || "Unknown device",
    last_used: lastUsed,
    expires_at: device.expires_at,
    created_at: device.created_at || device.trusted_at || device.last_used_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) {
      return auth.response;
    }

    const { supabase, user } = auth.context;

    const { data, error } = await supabase
      .from("admin_trusted_devices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch trusted devices:", error);
      return NextResponse.json(
        { error: "Failed to fetch trusted devices" },
        { status: 500 }
      );
    }

    const now = Date.now();
    const devices =
      data
        ?.filter((device: any) => {
          const isTrusted =
            device?.is_trusted ??
            device?.is_active ??
            true; // Support both schema variants
          const expiresAt = device?.expires_at
            ? new Date(device.expires_at).getTime()
            : Infinity;
          return Boolean(isTrusted) && expiresAt > now;
        })
        .map(normalizeDevice) || [];

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

async function revokeDevice(req: NextRequest) {
  let deviceId =
    req.nextUrl.searchParams.get("device_id") ||
    req.nextUrl.searchParams.get("deviceId");

  if (!deviceId && req.method === "POST") {
    try {
      const body = await req.json();
      deviceId = body?.device_id || body?.deviceId || body?.id;
    } catch {
      // ignore JSON parse errors for POST without body
    }
  }

  if (!deviceId) {
    return NextResponse.json(
      { error: "device_id is required" },
      { status: 400 }
    );
  }

  const auth = await requireAdmin();
  if ("response" in auth) {
    return auth.response;
  }

  const { supabase, user } = auth.context;

  const { data: device, error: fetchError } = await supabase
    .from("admin_trusted_devices")
    .select("*")
    .eq("id", deviceId)
    .single();

  if (fetchError || !device) {
    return NextResponse.json(
      { error: "Trusted device not found" },
      { status: 404 }
    );
  }

  if (device.user_id && device.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updatePayload: Record<string, any> = {};
  if (Object.prototype.hasOwnProperty.call(device, "is_trusted")) {
    updatePayload.is_trusted = false;
  }
  if (Object.prototype.hasOwnProperty.call(device, "is_active")) {
    updatePayload.is_active = false;
  }
  if (Object.keys(updatePayload).length === 0) {
    updatePayload.is_trusted = false;
  }

  const { error: updateError } = await supabase
    .from("admin_trusted_devices")
    .update(updatePayload)
    .eq("id", deviceId);

  if (updateError) {
    console.error("Failed to revoke trusted device:", updateError);
    return NextResponse.json(
      { error: "Failed to revoke trusted device" },
      { status: 500 }
    );
  }

  const ipForLog =
    (device.ip_address && String(device.ip_address)) || getClientIp(req) || "";
  const uaForLog =
    device.user_agent || req.headers.get("user-agent") || "unknown";
  const fingerprint =
    device.device_fingerprint ||
    generateDeviceFingerprint(uaForLog, ipForLog || "unknown");

  await logAdminAccess(
    user.id,
    "admin_device_revoked",
    ipForLog,
    uaForLog,
    fingerprint,
    true,
    `Device ${deviceId} revoked`
  );

  return NextResponse.json({
    success: true,
    message: "Trusted device revoked",
  });
}

export async function DELETE(req: NextRequest) {
  try {
    return await revokeDevice(req);
  } catch (error) {
    console.error("Error in DELETE /api/admin/trusted-devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Keep POST for compatibility with older clients that used POST to revoke devices.
  try {
    return await revokeDevice(req);
  } catch (error) {
    console.error("Error in POST /api/admin/trusted-devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
