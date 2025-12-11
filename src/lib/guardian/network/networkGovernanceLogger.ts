/**
 * Guardian X04: Network Governance Logger
 *
 * Records governance/consent actions for X-series Network Intelligence.
 * Maintains audit trail for compliance, troubleshooting, and transparency.
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Input for logging a governance event
 */
export interface GuardianNetworkGovernanceEventInput {
  tenantId: string;
  actorId?: string;
  eventType: 'opt_in' | 'opt_out' | 'flags_changed' | 'policy_acknowledged' | 'consent_granted';
  context:
    | 'network_telemetry'
    | 'benchmarks'
    | 'anomalies'
    | 'early_warnings'
    | 'ai_hints'
    | 'cohort_metadata';
  details?: Record<string, unknown>;
}

/**
 * Log a governance event to the audit trail.
 * Ensures no PII or raw payloads are stored.
 */
export async function logNetworkGovernanceEvent(
  input: GuardianNetworkGovernanceEventInput
): Promise<void> {
  const { tenantId, actorId, eventType, context, details } = input;

  // Truncate overly large detail values
  const sanitizedDetails = sanitizeDetails(details);

  const supabase = getSupabaseServer();

  try {
    const { error } = await supabase
      .from('guardian_network_governance_events')
      .insert({
        tenant_id: tenantId,
        actor_id: actorId || null,
        event_type: eventType,
        context,
        details: sanitizedDetails,
      });

    if (error) {
      console.error('Failed to log governance event:', error);
      // Don't throw; logging failures should not block operations
    }
  } catch (error) {
    console.error('Unexpected error logging governance event:', error);
  }
}

/**
 * Sanitize details to ensure no PII or oversized fields are stored.
 */
function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> {
  if (!details) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const MAX_FIELD_SIZE = 500; // characters

  for (const [key, value] of Object.entries(details)) {
    // Skip PII-like fields
    if (
      key.toLowerCase().includes('email') ||
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('key') ||
      key.toLowerCase().includes('credential') ||
      key.toLowerCase().includes('auth') ||
      key.toLowerCase().includes('payload') ||
      key.toLowerCase().includes('raw')
    ) {
      continue;
    }

    // Truncate string fields
    if (typeof value === 'string') {
      sanitized[key] = value.substring(0, MAX_FIELD_SIZE);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null) {
      sanitized[key] = null;
    } else if (typeof value === 'object') {
      // Recursively sanitize nested objects
      if (Array.isArray(value)) {
        sanitized[key] = value.slice(0, 10); // Limit array size
      } else {
        sanitized[key] = sanitizeDetails(value as Record<string, unknown>);
      }
    }
  }

  return sanitized;
}

/**
 * Retrieve recent governance events for a tenant.
 */
export async function getNetworkGovernanceEventsForTenant(
  tenantId: string,
  options?: { limit?: number; offset?: number; eventType?: string; context?: string }
): Promise<Array<{
  id: string;
  occurredAt: string;
  eventType: string;
  context: string;
  actorId?: string;
  details: Record<string, unknown>;
}>> {
  const { limit = 50, offset = 0, eventType, context } = options || {};

  const supabase = getSupabaseServer();

  try {
    let query = supabase
      .from('guardian_network_governance_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (context) {
      query = query.eq('context', context);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      occurredAt: row.occurred_at,
      eventType: row.event_type,
      context: row.context,
      actorId: row.actor_id || undefined,
      details: row.details || {},
    }));
  } catch (error) {
    console.error(`Failed to retrieve governance events for tenant ${tenantId}:`, error);
    return [];
  }
}
