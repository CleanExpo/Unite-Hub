/**
 * Incident Response Service (Phase E21)
 *
 * Track outages, data breaches, delivery failures with timeline updates
 * Server-side only - never expose to client
 *
 * @module incidentService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type IncidentType =
  | "outage"
  | "performance_degradation"
  | "data_breach"
  | "security_incident"
  | "delivery_failure"
  | "integration_failure"
  | "compliance_violation"
  | "api_error"
  | "payment_failure"
  | "email_bounce"
  | "spam_complaint"
  | "user_complaint"
  | "other";

export type IncidentStatus =
  | "open"
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved"
  | "closed"
  | "cancelled";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentActionStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Incident {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  type: IncidentType;
  status: IncidentStatus;
  severity: IncidentSeverity;
  detected_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  assigned_to: string | null;
  affected_resource: string | null;
  affected_resource_id: string | null;
  impact_description: string | null;
  root_cause: string | null;
  resolution_notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  tenant_id: string;
  author_id: string | null;
  update_text: string;
  status_change: IncidentStatus | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface IncidentAction {
  id: string;
  incident_id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: IncidentActionStatus;
  assignee: string | null;
  due_at: string | null;
  completed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface IncidentStatistics {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  critical: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
}

/**
 * Create incident
 */
export async function createIncident(args: {
  tenantId: string;
  title: string;
  description?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  assignedTo?: string;
  affectedResource?: string;
  affectedResourceId?: string;
  impactDescription?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("create_incident", {
      p_tenant_id: args.tenantId,
      p_title: args.title,
      p_description: args.description || null,
      p_type: args.type,
      p_severity: args.severity,
      p_assigned_to: args.assignedTo || null,
      p_affected_resource: args.affectedResource || null,
      p_affected_resource_id: args.affectedResourceId || null,
      p_impact_description: args.impactDescription || null,
      p_metadata: args.metadata || {},
    });

    if (error) {
      throw new Error(`Failed to create incident: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List incidents
 */
export async function listIncidents(
  tenantId: string,
  status?: IncidentStatus,
  severity?: IncidentSeverity,
  limit: number = 100
): Promise<Incident[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    let query = supabaseAdmin
      .from("incidents")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("detected_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    if (severity) {
      query = query.eq("severity", severity);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Incidents] Error listing incidents:", error);
      return [];
    }

    return (data || []) as Incident[];
  } catch (err) {
    console.error("[Incidents] Exception in listIncidents:", err);
    return [];
  }
}

/**
 * Get single incident
 */
export async function getIncident(
  incidentId: string,
  tenantId: string
): Promise<Incident | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("incidents")
      .select("*")
      .eq("id", incidentId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[Incidents] Error fetching incident:", error);
      return null;
    }

    return data as Incident;
  } catch (err) {
    console.error("[Incidents] Exception in getIncident:", err);
    return null;
  }
}

/**
 * Update incident status
 */
export async function updateIncidentStatus(
  incidentId: string,
  tenantId: string,
  status: IncidentStatus
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("update_incident_status", {
      p_incident_id: incidentId,
      p_tenant_id: tenantId,
      p_status: status,
    });

    if (error) {
      throw new Error(`Failed to update incident status: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Add incident update
 */
export async function addIncidentUpdate(args: {
  incidentId: string;
  tenantId: string;
  authorId?: string;
  updateText: string;
  statusChange?: IncidentStatus;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("add_incident_update", {
      p_incident_id: args.incidentId,
      p_tenant_id: args.tenantId,
      p_author_id: args.authorId || null,
      p_update_text: args.updateText,
      p_status_change: args.statusChange || null,
      p_metadata: args.metadata || {},
    });

    if (error) {
      throw new Error(`Failed to add incident update: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List incident updates
 */
export async function listIncidentUpdates(
  incidentId: string,
  tenantId: string
): Promise<IncidentUpdate[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("incident_updates")
      .select("*")
      .eq("incident_id", incidentId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Incidents] Error listing updates:", error);
      return [];
    }

    return (data || []) as IncidentUpdate[];
  } catch (err) {
    console.error("[Incidents] Exception in listIncidentUpdates:", err);
    return [];
  }
}

/**
 * Create incident action
 */
export async function createIncidentAction(args: {
  incidentId: string;
  tenantId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueAt?: Date;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("create_incident_action", {
      p_incident_id: args.incidentId,
      p_tenant_id: args.tenantId,
      p_title: args.title,
      p_description: args.description || null,
      p_assignee: args.assignee || null,
      p_due_at: args.dueAt?.toISOString() || null,
    });

    if (error) {
      throw new Error(`Failed to create incident action: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List incident actions
 */
export async function listIncidentActions(
  incidentId: string,
  tenantId: string
): Promise<IncidentAction[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("incident_actions")
      .select("*")
      .eq("incident_id", incidentId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Incidents] Error listing actions:", error);
      return [];
    }

    return (data || []) as IncidentAction[];
  } catch (err) {
    console.error("[Incidents] Exception in listIncidentActions:", err);
    return [];
  }
}

/**
 * Update incident action status
 */
export async function updateIncidentActionStatus(
  actionId: string,
  tenantId: string,
  status: IncidentActionStatus
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    const { error } = await supabaseAdmin
      .from("incident_actions")
      .update({ status })
      .eq("id", actionId)
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to update action status: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Get incident statistics
 */
export async function getIncidentStatistics(tenantId: string): Promise<IncidentStatistics> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_incident_statistics", {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error("[Incidents] Error getting statistics:", error);
      return {
        total: 0,
        open: 0,
        investigating: 0,
        resolved: 0,
        critical: 0,
        by_type: {},
        by_severity: {},
      };
    }

    return data as IncidentStatistics;
  } catch (err) {
    console.error("[Incidents] Exception in getIncidentStatistics:", err);
    return {
      total: 0,
      open: 0,
      investigating: 0,
      resolved: 0,
      critical: 0,
      by_type: {},
      by_severity: {},
    };
  }
}

/**
 * Update incident details
 */
export async function updateIncident(
  incidentId: string,
  tenantId: string,
  updates: {
    title?: string;
    description?: string;
    severity?: IncidentSeverity;
    assignedTo?: string;
    rootCause?: string;
    resolutionNotes?: string;
    impactDescription?: string;
  }
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("incidentService must only run on server");
    }

    const updateData: any = {};
    if (updates.title !== undefined) {
updateData.title = updates.title;
}
    if (updates.description !== undefined) {
updateData.description = updates.description;
}
    if (updates.severity !== undefined) {
updateData.severity = updates.severity;
}
    if (updates.assignedTo !== undefined) {
updateData.assigned_to = updates.assignedTo;
}
    if (updates.rootCause !== undefined) {
updateData.root_cause = updates.rootCause;
}
    if (updates.resolutionNotes !== undefined) {
updateData.resolution_notes = updates.resolutionNotes;
}
    if (updates.impactDescription !== undefined) {
updateData.impact_description = updates.impactDescription;
}

    const { error } = await supabaseAdmin
      .from("incidents")
      .update(updateData)
      .eq("id", incidentId)
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to update incident: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}
