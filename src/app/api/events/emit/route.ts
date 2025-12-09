/**
 * POST /api/events/emit
 *
 * Emit system events to event bus (Phase E08)
 * Triggers subscriptions, webhooks, and automation workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { publishEvent, type EventPayload } from "@/lib/core/eventBus";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: EventPayload = await req.json();

    // Validate required fields
    if (!payload.event_type || !payload.event_name) {
      return NextResponse.json(
        { error: "event_type and event_name are required" },
        { status: 400 }
      );
    }

    // Publish event
    const eventId = await publishEvent(user.id, payload);

    if (!eventId) {
      return NextResponse.json(
        { error: "Failed to publish event" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event_id: eventId,
    });
  } catch (error: any) {
    console.error("[API] /events/emit error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
