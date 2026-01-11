/**
 * Event Bus Service (Phase E08)
 *
 * Unified event system for audit trails, webhooks, and async job processing.
 * Integrates with automation engine and attribution system.
 *
 * @module eventBus
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type EventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "content.created"
  | "content.updated"
  | "content.published"
  | "content.deleted"
  | "campaign.created"
  | "campaign.launched"
  | "campaign.paused"
  | "campaign.completed"
  | "audience.segment_created"
  | "audience.scored"
  | "automation.triggered"
  | "automation.completed"
  | "payment.succeeded"
  | "payment.failed"
  | "system.error"
  | "system.warning"
  | "system.info";

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface EventPayload {
  event_type: EventType;
  event_name: string;
  actor_id?: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  context?: Record<string, any>;
  severity?: "info" | "warning" | "error";
}

export interface AsyncJob {
  id: string;
  tenant_id: string;
  job_type: string;
  payload: Record<string, any>;
  status: JobStatus;
  priority: number;
  scheduled_for: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  result?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EventSubscription {
  id: string;
  tenant_id: string;
  event_pattern: string;
  handler_type: string;
  handler_config: Record<string, any>;
  enabled: boolean;
  retry_policy: { max_attempts: number; backoff_ms: number };
  last_triggered_at?: string;
  total_triggers: number;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Publish an event to the system event bus
 *
 * @param tenantId - Tenant UUID
 * @param payload - Event payload
 * @returns Event ID
 */
export async function publishEvent(
  tenantId: string,
  payload: EventPayload
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc("publish_event", {
      p_tenant_id: tenantId,
      p_event_type: payload.event_type,
      p_event_name: payload.event_name,
      p_actor_id: payload.actor_id || null,
      p_resource_type: payload.resource_type || null,
      p_resource_id: payload.resource_id || null,
      p_metadata: payload.metadata || {},
      p_context: payload.context || {},
      p_severity: payload.severity || "info",
    });

    if (error) {
      console.error("[EventBus] Error publishing event:", error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error("[EventBus] Exception in publishEvent:", err);
    return null;
  }
}

/**
 * Queue an async job for background processing
 *
 * @param tenantId - Tenant UUID
 * @param jobType - Job type (e.g., 'send_email', 'generate_content')
 * @param payload - Job-specific payload
 * @param priority - Priority (1=high, 10=low, default=5)
 * @param scheduledFor - When to run (default=now)
 * @param maxRetries - Max retry attempts (default=3)
 * @returns Job ID
 */
export async function queueJob(
  tenantId: string,
  jobType: string,
  payload: Record<string, any> = {},
  priority: number = 5,
  scheduledFor?: Date,
  maxRetries: number = 3
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc("queue_job", {
      p_tenant_id: tenantId,
      p_job_type: jobType,
      p_payload: payload,
      p_priority: priority,
      p_scheduled_for: scheduledFor?.toISOString() || new Date().toISOString(),
      p_max_retries: maxRetries,
    });

    if (error) {
      console.error("[EventBus] Error queueing job:", error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error("[EventBus] Exception in queueJob:", err);
    return null;
  }
}

/**
 * Subscribe to events matching a pattern
 *
 * @param tenantId - Tenant UUID
 * @param eventPattern - Event pattern (e.g., "campaign.*", "content.published")
 * @param handlerType - Handler type ('webhook', 'automation', 'function')
 * @param handlerConfig - Handler-specific configuration (URL, automation ID, etc.)
 * @param retryPolicy - Retry policy for failed handlers
 * @returns Subscription ID
 */
export async function subscribe(
  tenantId: string,
  eventPattern: string,
  handlerType: string,
  handlerConfig: Record<string, any>,
  retryPolicy: { max_attempts: number; backoff_ms: number } = {
    max_attempts: 3,
    backoff_ms: 1000,
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("event_subscriptions")
      .insert({
        tenant_id: tenantId,
        event_pattern: eventPattern,
        handler_type: handlerType,
        handler_config: handlerConfig,
        retry_policy: retryPolicy,
        enabled: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[EventBus] Error creating subscription:", error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error("[EventBus] Exception in subscribe:", err);
    return null;
  }
}

/**
 * Unsubscribe from events
 *
 * @param subscriptionId - Subscription UUID
 * @param tenantId - Tenant UUID (for authorization)
 */
export async function unsubscribe(
  subscriptionId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("event_subscriptions")
      .delete()
      .eq("id", subscriptionId)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("[EventBus] Error deleting subscription:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[EventBus] Exception in unsubscribe:", err);
    return false;
  }
}

/**
 * Get audit trail (recent events)
 *
 * @param tenantId - Tenant UUID
 * @param limit - Max events to return (default=100)
 * @param eventType - Filter by event type
 * @param resourceId - Filter by resource ID
 * @returns Array of events
 */
export async function getAuditTrail(
  tenantId: string,
  limit: number = 100,
  eventType?: EventType,
  resourceId?: string
): Promise<any[]> {
  try {
    let query = supabaseAdmin
      .from("system_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (resourceId) {
      query = query.eq("resource_id", resourceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[EventBus] Error fetching audit trail:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[EventBus] Exception in getAuditTrail:", err);
    return [];
  }
}

/**
 * Get next job from queue (for worker processes)
 *
 * @param workerId - Worker identifier (default='default')
 * @returns Next job to process
 */
export async function getNextJob(
  workerId: string = "default"
): Promise<AsyncJob | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc("get_next_job", {
      p_worker_id: workerId,
    });

    if (error) {
      console.error("[EventBus] Error getting next job:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0] as AsyncJob;
  } catch (err) {
    console.error("[EventBus] Exception in getNextJob:", err);
    return null;
  }
}

/**
 * Mark job as completed
 *
 * @param jobId - Job UUID
 * @param result - Job result data
 */
export async function completeJob(
  jobId: string,
  result?: Record<string, any>
): Promise<void> {
  try {
    await supabaseAdmin.rpc("complete_job", {
      p_job_id: jobId,
      p_result: result || null,
    });
  } catch (err) {
    console.error("[EventBus] Exception in completeJob:", err);
  }
}

/**
 * Mark job as failed
 *
 * @param jobId - Job UUID
 * @param errorMessage - Error description
 * @param retry - Whether to retry (default=true)
 */
export async function failJob(
  jobId: string,
  errorMessage: string,
  retry: boolean = true
): Promise<void> {
  try {
    await supabaseAdmin.rpc("fail_job", {
      p_job_id: jobId,
      p_error_message: errorMessage,
      p_retry: retry,
    });
  } catch (err) {
    console.error("[EventBus] Exception in failJob:", err);
  }
}

/**
 * Get job status
 *
 * @param jobId - Job UUID
 * @param tenantId - Tenant UUID (for authorization)
 * @returns Job record
 */
export async function getJobStatus(
  jobId: string,
  tenantId: string
): Promise<AsyncJob | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("async_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      console.error("[EventBus] Error fetching job status:", error);
      return null;
    }

    return data as AsyncJob;
  } catch (err) {
    console.error("[EventBus] Exception in getJobStatus:", err);
    return null;
  }
}

/**
 * List subscriptions for a tenant
 *
 * @param tenantId - Tenant UUID
 * @returns Array of subscriptions
 */
export async function listSubscriptions(
  tenantId: string
): Promise<EventSubscription[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("event_subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[EventBus] Error listing subscriptions:", error);
      return [];
    }

    return (data || []) as EventSubscription[];
  } catch (err) {
    console.error("[EventBus] Exception in listSubscriptions:", err);
    return [];
  }
}

/**
 * Helper: Emit event and queue related automation
 *
 * @param tenantId - Tenant UUID
 * @param eventType - Event type
 * @param resourceType - Resource type
 * @param resourceId - Resource ID
 * @param metadata - Event metadata
 */
export async function emitAndDispatch(
  tenantId: string,
  eventType: EventType,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  await publishEvent(tenantId, {
    event_type: eventType,
    event_name: `${resourceType} ${eventType.split(".")[1]}`,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
}
