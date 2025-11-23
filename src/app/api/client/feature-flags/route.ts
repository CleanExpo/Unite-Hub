/**
 * Client Feature Flags API
 * Phase 34: Client Honest Experience Integration
 *
 * GET: Check if a feature flag is set
 * POST: Set a feature flag value
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Get auth token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get flag name from query
    const flag = req.nextUrl.searchParams.get("flag");

    if (!flag) {
      return NextResponse.json(
        { error: "Flag parameter required" },
        { status: 400 }
      );
    }

    // Query the flag
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("client_feature_flags")
      .select("value")
      .eq("user_id", userId)
      .eq("flag", flag)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      console.error("Error fetching feature flag:", error);
      return NextResponse.json(
        { error: "Failed to fetch flag" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      flag,
      value: data?.value ?? false,
    });
  } catch (error) {
    console.error("Feature flag GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get auth token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get flag and value from body
    const body = await req.json();
    const { flag, value } = body;

    if (!flag || typeof value !== "boolean") {
      return NextResponse.json(
        { error: "Flag and boolean value required" },
        { status: 400 }
      );
    }

    // Upsert the flag
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("client_feature_flags")
      .upsert(
        {
          user_id: userId,
          flag,
          value,
        },
        {
          onConflict: "user_id,flag",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error setting feature flag:", error);
      return NextResponse.json(
        { error: "Failed to set flag" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flag: data.flag,
      value: data.value,
    });
  } catch (error) {
    console.error("Feature flag POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
