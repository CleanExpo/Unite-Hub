/**
 * Synthex Alert by ID API
 *
 * Phase: D41 - Founder Control Tower + Cross-Business KPIs
 *
 * POST - Alert actions (acknowledge, resolve, snooze)
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  acknowledgeAlert,
  resolveAlert,
  snoozeAlert,
} from "@/lib/synthex/founderKpiService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/synthex/alerts/[id]
 * Perform alert actions
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();
    const { action, userId, notes, snoozedUntil } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    let alert;

    switch (action) {
      case "acknowledge":
        if (!userId) {
          return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }
        alert = await acknowledgeAlert(id, userId);
        break;

      case "resolve":
        if (!userId) {
          return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }
        alert = await resolveAlert(id, userId, notes);
        break;

      case "snooze":
        if (!snoozedUntil) {
          return NextResponse.json({ error: "snoozedUntil is required" }, { status: 400 });
        }
        alert = await snoozeAlert(id, snoozedUntil);
        break;

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, alert });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error processing alert action:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
