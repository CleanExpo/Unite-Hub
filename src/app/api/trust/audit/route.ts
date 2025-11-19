/**
 * Trust Audit API - Phase 9 Week 9
 *
 * GET /api/trust/audit
 * Retrieve audit events with filtering.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get query params
    const clientId = req.nextUrl.searchParams.get("client_id");
    const actionType = req.nextUrl.searchParams.get("action_type");
    const source = req.nextUrl.searchParams.get("source");
    const actorType = req.nextUrl.searchParams.get("actor_type");
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");

    if (!clientId) {
      return NextResponse.json(
        { error: "client_id is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Build query
    let query = supabase
      .from("autonomy_audit_log")
      .select("*")
      .eq("client_id", clientId)
      .order("timestamp_utc", { ascending: false })
      .limit(limit);

    if (actionType) {
      query = query.eq("action_type", actionType);
    }

    if (source) {
      query = query.eq("source", source);
    }

    if (actorType) {
      query = query.eq("actor_type", actorType);
    }

    if (from) {
      query = query.gte("timestamp_utc", from);
    }

    if (to) {
      query = query.lte("timestamp_utc", to);
    }

    const { data: events, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events,
      count: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Audit API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
