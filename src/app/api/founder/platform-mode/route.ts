import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  isAdmin,
  getAllServiceModes,
  setServiceMode,
  ServiceModes,
  PlatformMode,
} from "@/lib/platform/platformMode";

/**
 * GET /api/founder/platform-mode
 * Returns current service modes and admin status
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = isAdmin(user.email);

    // Always return modes (visible to all authenticated users)
    const modes = await getAllServiceModes();

    return NextResponse.json({
      modes,
      isAdmin: userIsAdmin,
      user: {
        email: user.email,
        id: user.id,
      },
    });
  } catch (error) {
    console.error("Error in platform-mode GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform modes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/founder/platform-mode
 * Toggle service mode (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { error: "Only platform administrators can modify service modes" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { service, mode, reason } = body as {
      service: keyof ServiceModes;
      mode: PlatformMode;
      reason?: string;
    };

    // Validate service
    const validServices: Array<keyof ServiceModes> = [
      "stripe",
      "dataforseo",
      "semrush",
      "ai",
    ];
    if (!validServices.includes(service)) {
      return NextResponse.json(
        { error: `Invalid service: ${String(service)}` },
        { status: 400 }
      );
    }

    // Validate mode
    if (mode !== "test" && mode !== "live") {
      return NextResponse.json(
        { error: `Invalid mode: ${mode}` },
        { status: 400 }
      );
    }

    // Update mode
    const result = await setServiceMode(service, mode, user.id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update mode" },
        { status: 500 }
      );
    }

    // Return updated modes
    const modes = await getAllServiceModes();

    return NextResponse.json({
      success: true,
      modes,
      changed: { service, oldMode: mode === "live" ? "test" : "live", newMode: mode },
    });
  } catch (error) {
    console.error("Error in platform-mode POST:", error);
    return NextResponse.json(
      { error: "Failed to update platform mode" },
      { status: 500 }
    );
  }
}
