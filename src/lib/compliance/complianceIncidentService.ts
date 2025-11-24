/**
 * Compliance Incident Service
 * Phase 93: Create and manage compliance incidents
 */

import { getSupabaseServer } from '@/lib/supabase';
import type {
  ComplianceIncident,
  IncidentSummary,
  PolicySeverity,
  IncidentStatus
} from './complianceTypes';

interface LogIncidentPayload {
  agencyId: string;
  regionId?: string;
  clientId?: string;
  platform: string;
  policyCode: string;
  severity: PolicySeverity;
  status: IncidentStatus;
  contentRef: {
    type?: string;
    id?: string;
    preview?: string;
  };
  notesMarkdown: string;
}

/**
 * Log a new compliance incident
 */
export async function logIncident(
  payload: LogIncidentPayload
): Promise<ComplianceIncident> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('compliance_incidents')
    .insert({
      agency_id: payload.agencyId,
      region_id: payload.regionId || null,
      client_id: payload.clientId || null,
      platform: payload.platform,
      policy_code: payload.policyCode,
      severity: payload.severity,
      status: payload.status,
      content_ref: payload.contentRef,
      notes_markdown: payload.notesMarkdown,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to log incident: ${error.message}`);
  }

  return mapIncidentFromDb(data);
}

/**
 * Resolve an incident
 */
export async function resolveIncident(
  id: string,
  notes?: string,
  userId?: string
): Promise<ComplianceIncident> {
  const supabase = await getSupabaseServer();

  const updates: any = {
    resolved_at: new Date().toISOString(),
  };

  if (userId) {
    updates.resolved_by = userId;
  }

  if (notes) {
    // Append resolution notes
    const { data: existing } = await supabase
      .from('compliance_incidents')
      .select('notes_markdown')
      .eq('id', id)
      .single();

    if (existing) {
      updates.notes_markdown = `${existing.notes_markdown}\n\n---\n**Resolution**: ${notes}`;
    }
  }

  const { data, error } = await supabase
    .from('compliance_incidents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to resolve incident: ${error.message}`);
  }

  return mapIncidentFromDb(data);
}

/**
 * Override an incident (mark as acceptable)
 */
export async function overrideIncident(
  id: string,
  reason: string,
  userId: string
): Promise<ComplianceIncident> {
  const supabase = await getSupabaseServer();

  const { data: existing } = await supabase
    .from('compliance_incidents')
    .select('notes_markdown')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('compliance_incidents')
    .update({
      status: 'overridden',
      notes_markdown: `${existing?.notes_markdown || ''}\n\n---\n**Override**: ${reason}`,
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to override incident: ${error.message}`);
  }

  return mapIncidentFromDb(data);
}

/**
 * List incidents for an agency
 */
export async function listIncidents(
  agencyId: string,
  filters?: {
    severity?: PolicySeverity;
    status?: IncidentStatus;
    platform?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ComplianceIncident[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('compliance_incidents')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.platform) {
    query = query.eq('platform', filters.platform);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(mapIncidentFromDb);
}

/**
 * Get incident summary for an agency
 */
export async function getIncidentSummary(
  agencyId: string
): Promise<IncidentSummary> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase.rpc('get_compliance_incident_summary', {
    p_agency_id: agencyId,
  });

  if (!data) {
    return {
      total: 0,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byStatus: { warning: 0, blocked: 0, overridden: 0 },
      unresolved: 0,
      last30Days: 0,
    };
  }

  return {
    total: data.total,
    bySeverity: data.by_severity,
    byStatus: data.by_status,
    unresolved: data.unresolved,
    last30Days: data.last_30_days,
  };
}

/**
 * Get recent critical incidents
 */
export async function getRecentCriticalIncidents(
  agencyId: string,
  limit: number = 10
): Promise<ComplianceIncident[]> {
  return listIncidents(agencyId, {
    severity: 'critical',
    limit,
  });
}

function mapIncidentFromDb(row: any): ComplianceIncident {
  return {
    id: row.id,
    createdAt: row.created_at,
    agencyId: row.agency_id,
    regionId: row.region_id,
    clientId: row.client_id,
    platform: row.platform,
    policyCode: row.policy_code,
    severity: row.severity,
    status: row.status,
    contentRef: row.content_ref || {},
    notesMarkdown: row.notes_markdown,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
  };
}
