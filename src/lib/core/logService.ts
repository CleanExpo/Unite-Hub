/**
 * Unified Log Service (Phase E10)
 *
 * Centralized logging for Unite-Hub + Synthex
 * Supports multi-level logging, request tracing, and error tracking
 *
 * @module logService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";
export type LogSource =
  | "api"
  | "agent"
  | "automation"
  | "client"
  | "cron"
  | "worker"
  | "system"
  | "integration"
  | "middleware"
  | "database";

export interface LogContext {
  [key: string]: any;
}

export interface RequestTraceMetadata {
  request_id: string;
  tenant_id?: string;
  user_id?: string;
  method: string;
  path: string;
  ip_address?: string;
  user_agent?: string;
  headers?: Record<string, string>;
  query_params?: Record<string, any>;
}

export interface RequestTraceCompletion {
  request_id: string;
  status_code: number;
  duration_ms?: number;
  response_size?: number;
  error_message?: string;
}

export interface ErrorEventData {
  tenant_id?: string;
  user_id?: string;
  request_id?: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  context?: LogContext;
  source: LogSource;
  severity?: LogLevel;
}

// In-memory request context (for server-side tracing)
const requestContext = new Map<string, { tenantId?: string; userId?: string }>();

/**
 * Log info-level message
 */
export async function logInfo(
  source: LogSource,
  message: string,
  context?: LogContext,
  tenantId?: string,
  userId?: string,
  requestId?: string
): Promise<void> {
  await logEvent(source, "info", message, context, tenantId, userId, requestId);
}

/**
 * Log warning message
 */
export async function logWarn(
  source: LogSource,
  message: string,
  context?: LogContext,
  tenantId?: string,
  userId?: string,
  requestId?: string
): Promise<void> {
  await logEvent(source, "warn", message, context, tenantId, userId, requestId);
}

/**
 * Log error message
 */
export async function logError(
  source: LogSource,
  message: string,
  context?: LogContext,
  tenantId?: string,
  userId?: string,
  requestId?: string,
  stackTrace?: string
): Promise<void> {
  await logEvent(source, "error", message, context, tenantId, userId, requestId, stackTrace);

  // Also log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error(`[${source}] ${message}`, context);
  }
}

/**
 * Log critical error message
 */
export async function logCritical(
  source: LogSource,
  message: string,
  context?: LogContext,
  tenantId?: string,
  userId?: string,
  requestId?: string,
  stackTrace?: string
): Promise<void> {
  await logEvent(source, "critical", message, context, tenantId, userId, requestId, stackTrace);

  // Always log critical errors to console
  console.error(`[CRITICAL][${source}] ${message}`, context);
}

/**
 * Core log event function
 */
async function logEvent(
  source: LogSource,
  level: LogLevel,
  message: string,
  context?: LogContext,
  tenantId?: string,
  userId?: string,
  requestId?: string,
  stackTrace?: string
): Promise<void> {
  try {
    // Skip if server-side Supabase not available
    if (typeof window !== "undefined") {
      console.log(`[${level}][${source}] ${message}`, context);
      return;
    }

    await supabaseAdmin.rpc("log_event", {
      p_tenant_id: tenantId || null,
      p_user_id: userId || null,
      p_request_id: requestId || null,
      p_source: source,
      p_level: level,
      p_message: message,
      p_context: context || {},
      p_stack_trace: stackTrace || null,
    });
  } catch (err) {
    // Fail silently - don't let logging errors break the app
    console.error("[LogService] Failed to log event:", err);
  }
}

/**
 * Start request trace
 */
export async function startRequestTrace(metadata: RequestTraceMetadata): Promise<void> {
  try {
    if (typeof window !== "undefined") {
return;
}

    // Store context for later use
    if (metadata.tenant_id || metadata.user_id) {
      requestContext.set(metadata.request_id, {
        tenantId: metadata.tenant_id,
        userId: metadata.user_id,
      });
    }

    await supabaseAdmin.rpc("start_request_trace", {
      p_request_id: metadata.request_id,
      p_tenant_id: metadata.tenant_id || null,
      p_user_id: metadata.user_id || null,
      p_method: metadata.method,
      p_path: metadata.path,
      p_ip_address: metadata.ip_address || null,
      p_user_agent: metadata.user_agent || null,
      p_headers: metadata.headers || {},
      p_query_params: metadata.query_params || {},
    });
  } catch (err) {
    console.error("[LogService] Failed to start request trace:", err);
  }
}

/**
 * Complete request trace
 */
export async function completeRequestTrace(completion: RequestTraceCompletion): Promise<void> {
  try {
    if (typeof window !== "undefined") {
return;
}

    await supabaseAdmin.rpc("complete_request_trace", {
      p_request_id: completion.request_id,
      p_status_code: completion.status_code,
      p_duration_ms: completion.duration_ms || null,
      p_response_size: completion.response_size || null,
      p_error_message: completion.error_message || null,
    });

    // Clean up context
    requestContext.delete(completion.request_id);
  } catch (err) {
    console.error("[LogService] Failed to complete request trace:", err);
  }
}

/**
 * Log error event (detailed error tracking)
 */
export async function logErrorEvent(data: ErrorEventData): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      console.error(`[${data.source}] ${data.error_type}: ${data.error_message}`, data.context);
      return;
    }

    await supabaseAdmin.rpc("log_error_event", {
      p_tenant_id: data.tenant_id || null,
      p_user_id: data.user_id || null,
      p_request_id: data.request_id || null,
      p_error_type: data.error_type,
      p_error_message: data.error_message,
      p_stack_trace: data.stack_trace || null,
      p_context: data.context || {},
      p_source: data.source,
      p_severity: data.severity || "error",
    });
  } catch (err) {
    console.error("[LogService] Failed to log error event:", err);
  }
}

/**
 * Get request context (tenant/user) by request ID
 */
export function getRequestContext(requestId: string): {
  tenantId?: string;
  userId?: string;
} | null {
  return requestContext.get(requestId) || null;
}

/**
 * Query recent logs (admin only)
 */
export async function queryLogs(params: {
  tenant_id?: string;
  level?: LogLevel;
  source?: LogSource;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    let query = supabaseAdmin.from("unified_logs").select("*").order("created_at", { ascending: false });

    if (params.tenant_id) {
      query = query.eq("tenant_id", params.tenant_id);
    }

    if (params.level) {
      query = query.eq("level", params.level);
    }

    if (params.source) {
      query = query.eq("source", params.source);
    }

    if (params.start_date) {
      query = query.gte("created_at", params.start_date);
    }

    if (params.end_date) {
      query = query.lte("created_at", params.end_date);
    }

    if (params.search) {
      query = query.ilike("message", `%${params.search}%`);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[LogService] Error querying logs:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[LogService] Exception in queryLogs:", err);
    return [];
  }
}

/**
 * Query error events
 */
export async function queryErrorEvents(params: {
  tenant_id?: string;
  resolved?: boolean;
  severity?: LogLevel;
  start_date?: string;
  limit?: number;
}): Promise<any[]> {
  try {
    let query = supabaseAdmin.from("error_events").select("*").order("created_at", { ascending: false });

    if (params.tenant_id) {
      query = query.eq("tenant_id", params.tenant_id);
    }

    if (params.resolved !== undefined) {
      query = query.eq("resolved", params.resolved);
    }

    if (params.severity) {
      query = query.eq("severity", params.severity);
    }

    if (params.start_date) {
      query = query.gte("created_at", params.start_date);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[LogService] Error querying error events:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[LogService] Exception in queryErrorEvents:", err);
    return [];
  }
}
