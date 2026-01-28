/**
 * Security Audit Log Service (Phase E1)
 *
 * Provides audit logging functionality for security events and compliance.
 * Immutable audit trail with tenant isolation.
 *
 * Usage:
 *   await recordAuditEvent({
 *     tenantId: 'workspace-uuid',
 *     eventType: 'auth.login',
 *     eventAction: 'success',
 *     actorType: 'user',
 *     actorId: 'user-uuid',
 *     actorEmail: 'user@example.com',
 *     ipAddress: req.ip,
 *     userAgent: req.headers['user-agent'],
 *     metadata: { loginMethod: 'password' }
 *   });
 *
 * Related to: E-Series Security & Governance Foundation
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export type ActorType = 'user' | 'system' | 'agent';

export interface AuditEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  event_action: string;
  actor_type: ActorType;
  actor_id?: string;
  actor_email?: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface RecordAuditEventInput {
  tenantId: string;
  eventType: string;
  eventAction: string;
  actorType: ActorType;
  actorId?: string;
  actorEmail?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ListAuditEventsFilters {
  eventType?: string;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  limit?: number;
  offset?: number;
}

// ============================================================================
// Audit Event Recording
// ============================================================================

/**
 * Record a security audit event
 *
 * NOTE: This function should NEVER throw errors - audit logging is telemetry
 * and should not break application flow. Errors are logged but swallowed.
 */
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<AuditEvent | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('security_audit_log')
      .insert({
        tenant_id: input.tenantId,
        event_type: input.eventType,
        event_action: input.eventAction,
        actor_type: input.actorType,
        actor_id: input.actorId || null,
        actor_email: input.actorEmail || null,
        resource_type: input.resourceType || null,
        resource_id: input.resourceId || null,
        ip_address: input.ipAddress || null,
        user_agent: input.userAgent || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to record audit event:', error.message);
      return null;
    }

    return data as AuditEvent;
  } catch (error: any) {
    console.error('Unexpected error recording audit event:', error);
    return null;
  }
}

// ============================================================================
// Audit Event Retrieval
// ============================================================================

/**
 * List audit events with filters
 */
export async function listAuditEvents(
  tenantId: string,
  filters?: ListAuditEventsFilters
): Promise<AuditEvent[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('security_audit_log')
      .select('*')
      .eq('tenant_id', tenantId);

    // Apply filters
    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }

    if (filters?.actorId) {
      query = query.eq('actor_id', filters.actorId);
    }

    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }

    if (filters?.resourceId) {
      query = query.eq('resource_id', filters.resourceId);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Pagination
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to list audit events:', error.message);
      return [];
    }

    return (data as AuditEvent[]) || [];
  } catch (error: any) {
    console.error('Unexpected error listing audit events:', error);
    return [];
  }
}

/**
 * Get a single audit event by ID
 */
export async function getAuditEvent(
  tenantId: string,
  eventId: string
): Promise<AuditEvent | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Failed to get audit event:', error.message);
      return null;
    }

    return data as AuditEvent;
  } catch (error: any) {
    console.error('Unexpected error getting audit event:', error);
    return null;
  }
}

// ============================================================================
// Convenience Functions for Common Events
// ============================================================================

/**
 * Record authentication event
 */
export async function recordAuthEvent(
  tenantId: string,
  eventAction: 'login' | 'logout' | 'failed_login' | 'password_reset',
  userId?: string,
  userEmail?: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    tenantId,
    eventType: 'auth',
    eventAction,
    actorType: userId ? 'user' : 'system',
    actorId: userId,
    actorEmail: userEmail,
    ipAddress,
    userAgent,
    metadata,
  });
}

/**
 * Record billing event
 */
export async function recordBillingEvent(
  tenantId: string,
  eventAction: string,
  userId?: string,
  userEmail?: string,
  resourceId?: string,
  metadata?: Record<string, any>
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    tenantId,
    eventType: 'billing',
    eventAction,
    actorType: userId ? 'user' : 'system',
    actorId: userId,
    actorEmail: userEmail,
    resourceType: 'subscription',
    resourceId,
    metadata,
  });
}

/**
 * Record permission change event
 */
export async function recordPermissionEvent(
  tenantId: string,
  eventAction: 'grant' | 'revoke',
  userId: string,
  userEmail: string,
  resourceType: 'role' | 'permission' | 'api_key',
  resourceId: string,
  metadata?: Record<string, any>
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    tenantId,
    eventType: 'permission',
    eventAction,
    actorType: 'user',
    actorId: userId,
    actorEmail: userEmail,
    resourceType,
    resourceId,
    metadata,
  });
}

/**
 * Record agent execution event
 */
export async function recordAgentEvent(
  tenantId: string,
  eventAction: 'start' | 'complete' | 'error',
  agentName: string,
  metadata?: Record<string, any>
): Promise<AuditEvent | null> {
  return recordAuditEvent({
    tenantId,
    eventType: 'agent',
    eventAction,
    actorType: 'agent',
    resourceType: 'agent_execution',
    metadata: {
      agentName,
      ...metadata,
    },
  });
}
