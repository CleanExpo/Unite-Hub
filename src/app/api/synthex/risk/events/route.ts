/**
 * Synthex Risk Events API
 *
 * Phase: D47 - Risk & Incident Center
 *
 * GET - List risk events
 * POST - Create event or acknowledge event
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createRiskEvent,
  listRiskEvents,
  acknowledgeRiskEvent,
} from "@/lib/synthex/riskMonitorService";

/**
 * GET /api/synthex/risk/events
 * List risk events with filters
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id") || undefined;
    const severity = searchParams.get("severity") as any;
    const category = searchParams.get("category") as any;
    const acknowledged = searchParams.get("acknowledged");
    const limit = searchParams.get("limit");

    const events = await listRiskEvents(tenantId, {
      businessId,
      severity,
      category,
      acknowledged: acknowledged === "true" ? true : acknowledged === "false" ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ success: true, events });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Risk Events GET]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/risk/events
 * Actions: create, acknowledge
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    const user = await validateUserAuth(request);
    const tenantId = user.user_metadata?.tenant_id || user.id;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const { source_type, source_ref, severity, category, message, context, detected_by, business_id } = body;

        if (!source_type || !severity || !category || !message) {
          return NextResponse.json(
            { success: false, error: "source_type, severity, category, and message are required" },
            { status: 400 }
          );
        }

        const event = await createRiskEvent(tenantId, {
          source_type,
          source_ref,
          severity,
          category,
          message,
          context,
          detected_by,
          business_id,
        });

        return NextResponse.json({ success: true, event });
      }

      case "acknowledge": {
        const { event_id } = body;

        if (!event_id) {
          return NextResponse.json(
            { success: false, error: "event_id is required" },
            { status: 400 }
          );
        }

        await acknowledgeRiskEvent(event_id);

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: create, acknowledge" },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Synthex Risk Events POST]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
