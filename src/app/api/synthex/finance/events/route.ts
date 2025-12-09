/**
 * Synthex Finance Events API
 *
 * Phase: D43 - Capital & Runway Dashboard
 *
 * GET - List transactions
 * POST - Create transaction
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createEvent,
  listEvents,
  deleteEvent,
  type FINEventType,
  type FINDirection,
} from "@/lib/synthex/financeRunwayService";

/**
 * GET /api/synthex/finance/events
 * List financial events/transactions
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const businessId = searchParams.get("businessId");
    const accountId = searchParams.get("accountId");
    const eventType = searchParams.get("eventType") as FINEventType | null;
    const direction = searchParams.get("direction") as FINDirection | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const events = await listEvents(tenantId, {
      businessId: businessId || undefined,
      accountId: accountId || undefined,
      eventType: eventType || undefined,
      direction: direction || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return NextResponse.json({ success: true, events });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/finance/events
 * Create a financial event/transaction
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId, businessId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!body.account_id) {
      return NextResponse.json({ error: "account_id is required" }, { status: 400 });
    }

    if (!body.event_date) {
      return NextResponse.json({ error: "event_date is required" }, { status: 400 });
    }

    if (body.amount === undefined) {
      return NextResponse.json({ error: "amount is required" }, { status: 400 });
    }

    const event = await createEvent(tenantId, businessId, {
      account_id: body.account_id,
      event_date: body.event_date,
      event_type: body.event_type,
      direction: body.direction,
      amount: body.amount,
      currency: body.currency,
      exchange_rate: body.exchange_rate,
      category: body.category,
      subcategory: body.subcategory,
      description: body.description,
      reference: body.reference,
      counterparty_name: body.counterparty_name,
      counterparty_id: body.counterparty_id,
      is_recurring: body.is_recurring,
      recurring_frequency: body.recurring_frequency,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, event });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating event:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/synthex/finance/events
 * Delete a financial event (with id in body)
 */
export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    await deleteEvent(eventId);

    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
