/**
 * SLA & Uptime Reporting Service (Phase E31)
 * Server-side only service for managing SLAs, uptime checks, incidents, and reports
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

// =====================================================
// TYPES
// =====================================================

export type SLATargetType = "uptime" | "response_time" | "resolution_time" | "availability" | "performance" | "other";
export type UptimeCheckStatus = "up" | "down" | "degraded" | "maintenance";
export type SLAIncidentSeverity = "low" | "medium" | "high" | "critical";
export type SLAIncidentStatus = "open" | "investigating" | "identified" | "monitoring" | "resolved";

export interface SLADefinition {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  target_type: SLATargetType;
  target_value: number;
  target_unit?: string;
  measurement_period_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UptimeCheck {
  id: string;
  tenant_id: string;
  sla_id?: string;
  service_name: string;
  status: UptimeCheckStatus;
  response_time_ms?: number;
  check_timestamp: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SLAIncident {
  id: string;
  tenant_id: string;
  sla_id: string;
  sla_name?: string;
  severity: SLAIncidentSeverity;
  status: SLAIncidentStatus;
  title: string;
  description?: string;
  started_at: string;
  resolved_at?: string;
  impact_description?: string;
  root_cause?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface SLASummary {
  sla_id: string;
  period_days: number;
  total_checks: number;
  up_checks: number;
  down_checks: number;
  degraded_checks: number;
  uptime_percent: number;
  avg_response_time_ms?: number;
  total_incidents: number;
  open_incidents: number;
  critical_incidents: number;
}

export interface UptimeOverview {
  period_days: number;
  total_checks: number;
  up_checks: number;
  down_checks: number;
  overall_uptime_percent: number;
  avg_response_time_ms?: number;
  total_slas: number;
  total_incidents: number;
  open_incidents: number;
}

// =====================================================
// SLA DEFINITION OPERATIONS
// =====================================================

export async function listSLADefinitions(tenantId: string, isActive?: boolean): Promise<SLADefinition[]> {
  if (typeof window !== "undefined") {
    throw new Error("slaService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("list_sla_definitions", {
    p_tenant_id: tenantId,
    p_is_active: isActive !== undefined ? isActive : null,
  });

  if (error) {
    throw new Error(`Failed to list SLA definitions: ${error.message}`);
  }

  return data as SLADefinition[];
}

export async function createSLADefinition(args: {
  tenantId: string;
  name: string;
  description?: string;
  targetType: SLATargetType;
  targetValue: number;
  targetUnit?: string;
  measurementPeriodDays?: number;
  isActive?: boolean;
}): Promise<string> {
  if (typeof window !== "undefined") {
    throw new Error("slaService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("create_sla_definition", {
    p_tenant_id: args.tenantId,
    p_name: args.name,
    p_description: args.description || null,
    p_target_type: args.targetType,
    p_target_value: args.targetValue,
    p_target_unit: args.targetUnit || null,
    p_measurement_period_days: args.measurementPeriodDays || 30,
    p_is_active: args.isActive !== undefined ? args.isActive : true,
  });

  if (error) {
    throw new Error(`Failed to create SLA definition: ${error.message}`);
  }

  return data as string;
}

export async function updateSLADefinition(
  slaId: string,
  updates: Partial<Omit<SLADefinition, "id" | "tenant_id" | "created_at" | "updated_at">>
): Promise<void> {
  if (typeof window !== "undefined") {
    throw new Error("slaService must only run on server");
  }

  const { error } = await supabaseAdmin.from("sla_definitions").update(updates).eq("id", slaId);

  if (error) {
    throw new Error(`Failed to update SLA definition: ${error.message}`);
  }
}

// =====================================================
// UPTIME CHECK OPERATIONS
// =====================================================

export async function recordUptimeCheck(args: {
  tenantId: string;
  slaId?: string;
  serviceName: string;
  status: UptimeCheckStatus;
  responseTimeMs?: number;
  metadata?: Record<string, any>;
}): Promise<string> {
  if (typeof window !== "undefined") {
    throw new Error("slaService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("record_uptime_check", {
    p_tenant_id: args.tenantId,
    p_sla_id: args.slaId || null,
    p_service_name: args.serviceName,
    p_status: args.status,
    p_response_time_ms: args.responseTimeMs || null,
    p_metadata: args.metadata || {},
  });

  if (error) {
    throw new Error(`Failed to record uptime check: ${error.message}`);
  }

  return data as string;
}

export async function listUptimeChecks(
  tenantId: string,
  slaId?: string,
  limit: number = 100
): Promise<UptimeCheck[]> {
  if (typeof window !== "undefined") {
    throw new Error("slaService must only run on server");
  }

  let query = supabaseAdmin
    .from("uptime_checks")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("check_timestamp", { ascending: false })
    .limit(limit);

  if (slaId) {
    query = query.eq("sla_id", slaId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list uptime checks: ${error.message}`);
  }

  return data as UptimeCheck[];
}

// =====================================================
// SLA INCIDENT OPERATIONS
// =====================================================

export async function createSLAIncident(args: {
  tenantId: string;
  slaId: string;
  severity: SLAIncidentSeverity;
  title: string;
  description?: string;
  impactDescription?: string;
}): Promise<string> {
  if (typeof window !== "undefined") {
    throw new Error("slaService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("create_sla_incident", {
    p_tenant_id: args.tenantId,
    p_sla_id: args.slaId,
    p_severity: args.severity,
    p_title: args.title,
    p_description: args.description || null,
    p_impact_description: args.impactDescription || null,
  });

  if (error) {
    throw new Error(`Failed to create SLA incident: ${error.message}`);
  }

  return data as string;
}

export async function updateSLAIncidentStatus(
  incidentId: string,
  status: SLAIncidentStatus,
  rootCause?: string,
  resolutionNotes?: string
): Promise<void> {
  if (typeof window !== "undefined") {
    throw new Error("slaService must only run on server");
  }

  const { error } = await supabaseAdmin.rpc("update_sla_incident_status", {
    p_incident_id: incidentId,
    p_status: status,
    p_root_cause: rootCause || null,
    p_resolution_notes: resolutionNotes || null,
  });

  if (error) {
    throw new Error(`Failed to update SLA incident status: ${error.message}`);
  }
}

export async function listSLAIncidents(
  tenantId: string,
  slaId?: string,
  status?: SLAIncidentStatus,
  severity?: SLAIncidentSeverity
): Promise<SLAIncident[]> {
  if (typeof window !== "undefined") {
    throw new Error("slaService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("list_sla_incidents", {
    p_tenant_id: tenantId,
    p_sla_id: slaId || null,
    p_status: status || null,
    p_severity: severity || null,
  });

  if (error) {
    throw new Error(`Failed to list SLA incidents: ${error.message}`);
  }

  return data as SLAIncident[];
}

// =====================================================
// REPORTING & SUMMARY OPERATIONS
// =====================================================

export async function getSLASummary(tenantId: string, slaId: string, days: number = 30): Promise<SLASummary> {
  if (typeof window !== "undefined") {
    throw new Error("slaService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("get_sla_summary", {
    p_tenant_id: tenantId,
    p_sla_id: slaId,
    p_days: days,
  });

  if (error) {
    throw new Error(`Failed to get SLA summary: ${error.message}`);
  }

  return data as SLASummary;
}

export async function getUptimeOverview(tenantId: string, days: number = 7): Promise<UptimeOverview> {
  if (typeof window !== "undefined") {
    throw new Error("slaService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("get_uptime_overview", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) {
    throw new Error(`Failed to get uptime overview: ${error.message}`);
  }

  return data as UptimeOverview;
}
