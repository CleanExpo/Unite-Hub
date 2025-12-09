/**
 * /api/founder/webhooks
 *
 * Webhook Governance API (Phase E27)
 * GET: List endpoints, events, statistics
 * POST: Create endpoint, send event, update event status, test endpoint
 * PATCH: Update endpoint
 * DELETE: Delete endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  listWebhookEndpoints,
  getWebhookEndpoint,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  sendWebhookEvent,
  listWebhookEvents,
  updateWebhookEventStatus,
  getWebhookStatistics,
  testWebhookEndpoint,
  type WebhookEndpointStatus,
  type WebhookEventStatus,
  type WebhookEventType,
} from "@/lib/founder/webhookService";
import { hasPermission } from "@/lib/core/permissionService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");
    const endpointId = searchParams.get("endpointId");
    const status = searchParams.get("status") as WebhookEndpointStatus | WebhookEventStatus | null;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "get-endpoint") {
      if (!endpointId) {
        return NextResponse.json({ error: "endpointId required" }, { status: 400 });
      }
      const endpoint = await getWebhookEndpoint(endpointId, workspaceId);
      if (!endpoint) {
        return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
      }
      return NextResponse.json({ endpoint });
    }

    if (action === "events") {
      const events = await listWebhookEvents(
        workspaceId,
        endpointId || undefined,
        status as WebhookEventStatus | undefined,
        100
      );
      return NextResponse.json({ events, total: events.length });
    }

    if (action === "statistics") {
      const stats = await getWebhookStatistics(workspaceId);
      return NextResponse.json({ statistics: stats });
    }

    // Default: list webhook endpoints
    const endpoints = await listWebhookEndpoints(
      workspaceId,
      status as WebhookEndpointStatus | undefined
    );
    return NextResponse.json({ endpoints, total: endpoints.length });
  } catch (error: any) {
    console.error("[API] /founder/webhooks GET error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, action } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "create-endpoint") {
      const { name, url, description, secret, events, headers, retryCount, timeoutSeconds } = body;

      if (!name || !url) {
        return NextResponse.json(
          { error: "name and url are required" },
          { status: 400 }
        );
      }

      const endpointId = await createWebhookEndpoint({
        tenantId: workspaceId,
        name,
        url,
        description,
        secret,
        events,
        headers,
        retryCount,
        timeoutSeconds,
      });

      return NextResponse.json({ success: true, endpointId, message: "Webhook endpoint created" });
    }

    if (action === "send-event") {
      const { endpointId, eventType, payload } = body;

      if (!endpointId || !eventType || !payload) {
        return NextResponse.json(
          { error: "endpointId, eventType, and payload are required" },
          { status: 400 }
        );
      }

      const eventId = await sendWebhookEvent({
        endpointId,
        tenantId: workspaceId,
        eventType,
        payload,
      });

      return NextResponse.json({ success: true, eventId, message: "Webhook event queued" });
    }

    if (action === "update-event-status") {
      const { eventId, status, responseStatus, responseBody, errorMessage } = body;

      if (!eventId || !status) {
        return NextResponse.json({ error: "eventId and status required" }, { status: 400 });
      }

      await updateWebhookEventStatus(
        eventId,
        workspaceId,
        status,
        responseStatus,
        responseBody,
        errorMessage
      );

      return NextResponse.json({ success: true, message: "Event status updated" });
    }

    if (action === "test-endpoint") {
      const { endpointId } = body;

      if (!endpointId) {
        return NextResponse.json({ error: "endpointId required" }, { status: 400 });
      }

      const result = await testWebhookEndpoint(endpointId, workspaceId);

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid action. Use: create-endpoint, send-event, update-event-status, test-endpoint" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /founder/webhooks POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, endpointId, ...updates } = body;

    if (!workspaceId || !endpointId) {
      return NextResponse.json(
        { error: "workspaceId and endpointId required" },
        { status: 400 }
      );
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await updateWebhookEndpoint(endpointId, workspaceId, updates);

    return NextResponse.json({ success: true, message: "Webhook endpoint updated" });
  } catch (error: any) {
    console.error("[API] /founder/webhooks PATCH error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const endpointId = searchParams.get("endpointId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (!endpointId) {
      return NextResponse.json({ error: "endpointId required" }, { status: 400 });
    }

    await deleteWebhookEndpoint(endpointId, workspaceId);

    return NextResponse.json({ success: true, message: "Webhook endpoint deleted" });
  } catch (error: any) {
    console.error("[API] /founder/webhooks DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
