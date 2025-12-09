/**
 * Webhook Governance Service (Phase E27)
 *
 * Tenant-scoped outbound webhook endpoints and event logging
 * Server-side only - never expose to client
 *
 * @module webhookService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type WebhookEventType =
  | "contact.created"
  | "contact.updated"
  | "contact.deleted"
  | "campaign.created"
  | "campaign.updated"
  | "campaign.completed"
  | "email.sent"
  | "email.opened"
  | "email.clicked"
  | "audit.event"
  | "security.alert"
  | "incident.created"
  | "policy.triggered"
  | "rate_limit.exceeded"
  | "other";

export type WebhookEndpointStatus = "active" | "inactive" | "disabled";
export type WebhookEventStatus = "pending" | "delivered" | "failed" | "retrying";

export interface WebhookEndpoint {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  description: string | null;
  status: WebhookEndpointStatus;
  secret: string | null;
  events: WebhookEventType[];
  headers: Record<string, any>;
  retry_count: number;
  timeout_seconds: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  total_sent: number;
  total_success: number;
  total_failed: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  endpoint_id: string;
  tenant_id: string;
  event_type: WebhookEventType;
  status: WebhookEventStatus;
  payload: Record<string, any>;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  attempt_count: number;
  next_retry_at: string | null;
  delivered_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface WebhookStatistics {
  total_endpoints: number;
  active_endpoints: number;
  total_events: number;
  pending_events: number;
  delivered_events: number;
  failed_events: number;
  by_event_type: Record<string, number>;
  by_endpoint: Record<string, number>;
}

/**
 * List webhook endpoints
 */
export async function listWebhookEndpoints(
  tenantId: string,
  status?: WebhookEndpointStatus
): Promise<WebhookEndpoint[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("webhookService must only run on server");
    }

    let query = supabaseAdmin
      .from("webhook_endpoints")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Webhook] Error listing endpoints:", error);
      return [];
    }

    return (data || []) as WebhookEndpoint[];
  } catch (err) {
    console.error("[Webhook] Exception in listWebhookEndpoints:", err);
    return [];
  }
}

/**
 * Get single webhook endpoint
 */
export async function getWebhookEndpoint(
  endpointId: string,
  tenantId: string
): Promise<WebhookEndpoint | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("webhookService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("webhook_endpoints")
      .select("*")
      .eq("id", endpointId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[Webhook] Error fetching endpoint:", error);
      return null;
    }

    return data as WebhookEndpoint;
  } catch (err) {
    console.error("[Webhook] Exception in getWebhookEndpoint:", err);
    return null;
  }
}

/**
 * Create webhook endpoint
 */
export async function createWebhookEndpoint(args: {
  tenantId: string;
  name: string;
  url: string;
  description?: string;
  secret?: string;
  events?: WebhookEventType[];
  headers?: Record<string, any>;
  retryCount?: number;
  timeoutSeconds?: number;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("webhookService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("create_webhook_endpoint", {
      p_tenant_id: args.tenantId,
      p_name: args.name,
      p_url: args.url,
      p_description: args.description || null,
      p_secret: args.secret || null,
      p_events: args.events || [],
      p_headers: args.headers || {},
      p_retry_count: args.retryCount || 3,
      p_timeout_seconds: args.timeoutSeconds || 30,
      p_metadata: {},
    });

    if (error) {
      throw new Error(`Failed to create webhook endpoint: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * Update webhook endpoint
 */
export async function updateWebhookEndpoint(
  endpointId: string,
  tenantId: string,
  updates: Partial<{
    name: string;
    url: string;
    description: string;
    status: WebhookEndpointStatus;
    secret: string;
    events: WebhookEventType[];
    headers: Record<string, any>;
    retry_count: number;
    timeout_seconds: number;
  }>
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("webhookService must only run on server");
    }

    const { error } = await supabaseAdmin
      .from("webhook_endpoints")
      .update(updates)
      .eq("id", endpointId)
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to update webhook endpoint: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Delete webhook endpoint
 */
export async function deleteWebhookEndpoint(
  endpointId: string,
  tenantId: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("webhookService must only run on server");
    }

    const { error } = await supabaseAdmin
      .from("webhook_endpoints")
      .delete()
      .eq("id", endpointId)
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to delete webhook endpoint: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Send webhook event
 */
export async function sendWebhookEvent(args: {
  endpointId: string;
  tenantId: string;
  eventType: WebhookEventType;
  payload: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("webhookService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("send_webhook_event", {
      p_endpoint_id: args.endpointId,
      p_tenant_id: args.tenantId,
      p_event_type: args.eventType,
      p_payload: args.payload,
      p_metadata: {},
    });

    if (error) {
      throw new Error(`Failed to send webhook event: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List webhook events
 */
export async function listWebhookEvents(
  tenantId: string,
  endpointId?: string,
  status?: WebhookEventStatus,
  limit: number = 100
): Promise<WebhookEvent[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("webhookService must only run on server");
    }

    let query = supabaseAdmin
      .from("webhook_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (endpointId) {
      query = query.eq("endpoint_id", endpointId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Webhook] Error listing events:", error);
      return [];
    }

    return (data || []) as WebhookEvent[];
  } catch (err) {
    console.error("[Webhook] Exception in listWebhookEvents:", err);
    return [];
  }
}

/**
 * Update webhook event status
 */
export async function updateWebhookEventStatus(
  eventId: string,
  tenantId: string,
  status: WebhookEventStatus,
  responseStatus?: number,
  responseBody?: string,
  errorMessage?: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("webhookService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("update_webhook_event_status", {
      p_event_id: eventId,
      p_tenant_id: tenantId,
      p_status: status,
      p_response_status: responseStatus || null,
      p_response_body: responseBody || null,
      p_error_message: errorMessage || null,
    });

    if (error) {
      throw new Error(`Failed to update webhook event status: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Get webhook statistics
 */
export async function getWebhookStatistics(tenantId: string): Promise<WebhookStatistics> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("webhookService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_webhook_statistics", {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error("[Webhook] Error getting statistics:", error);
      return {
        total_endpoints: 0,
        active_endpoints: 0,
        total_events: 0,
        pending_events: 0,
        delivered_events: 0,
        failed_events: 0,
        by_event_type: {},
        by_endpoint: {},
      };
    }

    return data as WebhookStatistics;
  } catch (err) {
    console.error("[Webhook] Exception in getWebhookStatistics:", err);
    return {
      total_endpoints: 0,
      active_endpoints: 0,
      total_events: 0,
      pending_events: 0,
      delivered_events: 0,
      failed_events: 0,
      by_event_type: {},
      by_endpoint: {},
    };
  }
}

/**
 * Test webhook endpoint (sends test event)
 */
export async function testWebhookEndpoint(
  endpointId: string,
  tenantId: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("webhookService must only run on server");
    }

    const endpoint = await getWebhookEndpoint(endpointId, tenantId);
    if (!endpoint) {
      return { success: false, message: "Endpoint not found" };
    }

    const eventId = await sendWebhookEvent({
      endpointId,
      tenantId,
      eventType: "other",
      payload: {
        test: true,
        message: "Test webhook event",
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: `Test event queued with ID: ${eventId}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to test webhook",
    };
  }
}
