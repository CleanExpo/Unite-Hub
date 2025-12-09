/**
 * Compliance Center Service (Phase E19)
 *
 * GDPR/CCPA data subject request management and consent tracking
 * Server-side only - never expose to client
 *
 * @module complianceService
 */

import { supabaseAdmin } from "@/lib/supabase";

export type DSRType =
  | "access"
  | "rectification"
  | "erasure"
  | "export"
  | "restriction"
  | "portability"
  | "objection"
  | "other";

export type DSRStatus = "open" | "in_progress" | "resolved" | "rejected" | "cancelled";

export type RequesterType = "user" | "contact" | "unknown";

export type ConsentChannel = "email" | "sms" | "social" | "web" | "api" | "other";

export interface DataSubjectRequest {
  id: string;
  tenant_id: string;
  requester_type: RequesterType;
  requester_identifier: string;
  type: DSRType;
  status: DSRStatus;
  received_at: string;
  resolved_at: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsentLog {
  id: string;
  tenant_id: string;
  subject_identifier: string;
  channel: ConsentChannel;
  purpose: string;
  granted: boolean;
  source: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ComplianceTask {
  id: string;
  tenant_id: string;
  dsr_id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "done" | "skipped";
  assignee: string | null;
  due_at: string | null;
  completed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Create a data subject request
 */
export async function createDataSubjectRequest(args: {
  tenantId: string;
  requesterType: RequesterType;
  requesterIdentifier: string;
  type: DSRType;
  notes?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("complianceService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("create_data_subject_request", {
      p_tenant_id: args.tenantId,
      p_requester_type: args.requesterType,
      p_requester_identifier: args.requesterIdentifier,
      p_type: args.type,
      p_notes: args.notes || null,
      p_metadata: args.metadata || {},
    });

    if (error) {
      throw new Error(`Failed to create DSR: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List data subject requests for tenant
 */
export async function listDataSubjectRequests(
  tenantId: string,
  status?: DSRStatus,
  limit: number = 100
): Promise<DataSubjectRequest[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("complianceService must only run on server");
    }

    let query = supabaseAdmin
      .from("data_subject_requests")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("received_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Compliance] Error listing DSRs:", error);
      return [];
    }

    return (data || []) as DataSubjectRequest[];
  } catch (err) {
    console.error("[Compliance] Exception in listDataSubjectRequests:", err);
    return [];
  }
}

/**
 * Get single data subject request
 */
export async function getDataSubjectRequest(
  dsrId: string,
  tenantId: string
): Promise<DataSubjectRequest | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("complianceService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("data_subject_requests")
      .select("*")
      .eq("id", dsrId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[Compliance] Error fetching DSR:", error);
      return null;
    }

    return data as DataSubjectRequest;
  } catch (err) {
    console.error("[Compliance] Exception in getDataSubjectRequest:", err);
    return null;
  }
}

/**
 * Update DSR status
 */
export async function updateDSRStatus(
  dsrId: string,
  tenantId: string,
  status: DSRStatus
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("complianceService must only run on server");
    }

    const update: any = { status };

    if (status === "resolved") {
      update.resolved_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from("data_subject_requests")
      .update(update)
      .eq("id", dsrId)
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to update DSR status: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Record consent
 */
export async function recordConsent(args: {
  tenantId: string;
  subjectIdentifier: string;
  channel: ConsentChannel;
  purpose: string;
  granted: boolean;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("complianceService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("record_consent", {
      p_tenant_id: args.tenantId,
      p_subject_identifier: args.subjectIdentifier,
      p_channel: args.channel,
      p_purpose: args.purpose,
      p_granted: args.granted,
      p_source: args.source || null,
      p_ip_address: args.ipAddress || null,
      p_user_agent: args.userAgent || null,
      p_metadata: args.metadata || {},
    });

    if (error) {
      throw new Error(`Failed to record consent: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * Get latest consent for subject/purpose
 */
export async function getLatestConsent(
  tenantId: string,
  subjectIdentifier: string,
  purpose: string
): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("complianceService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_latest_consent", {
      p_tenant_id: tenantId,
      p_subject_identifier: subjectIdentifier,
      p_purpose: purpose,
    });

    if (error) {
      console.error("[Compliance] Error getting consent:", error);
      return false;
    }

    return data as boolean;
  } catch (err) {
    console.error("[Compliance] Exception in getLatestConsent:", err);
    return false;
  }
}

/**
 * List consent logs
 */
export async function listConsentLogs(
  tenantId: string,
  subjectIdentifier?: string,
  limit: number = 100
): Promise<ConsentLog[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("complianceService must only run on server");
    }

    let query = supabaseAdmin
      .from("consent_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (subjectIdentifier) {
      query = query.eq("subject_identifier", subjectIdentifier);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Compliance] Error listing consent logs:", error);
      return [];
    }

    return (data || []) as ConsentLog[];
  } catch (err) {
    console.error("[Compliance] Exception in listConsentLogs:", err);
    return [];
  }
}

/**
 * Get DSR statistics
 */
export async function getDSRStatistics(tenantId: string): Promise<{
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  by_type: Record<string, number>;
}> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("complianceService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_dsr_statistics", {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error("[Compliance] Error getting statistics:", error);
      return {
        total: 0,
        open: 0,
        in_progress: 0,
        resolved: 0,
        by_type: {},
      };
    }

    return data as {
      total: number;
      open: number;
      in_progress: number;
      resolved: number;
      by_type: Record<string, number>;
    };
  } catch (err) {
    console.error("[Compliance] Exception in getDSRStatistics:", err);
    return {
      total: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      by_type: {},
    };
  }
}

/**
 * Create compliance task for DSR
 */
export async function createComplianceTask(args: {
  tenantId: string;
  dsrId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueAt?: Date;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("complianceService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("compliance_tasks")
      .insert({
        tenant_id: args.tenantId,
        dsr_id: args.dsrId,
        title: args.title,
        description: args.description || null,
        assignee: args.assignee || null,
        due_at: args.dueAt?.toISOString() || null,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create compliance task: ${error.message}`);
    }

    return data.id;
  } catch (err) {
    throw err;
  }
}

/**
 * List compliance tasks for DSR
 */
export async function listComplianceTasks(
  dsrId: string,
  tenantId: string
): Promise<ComplianceTask[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("complianceService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("compliance_tasks")
      .select("*")
      .eq("dsr_id", dsrId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Compliance] Error listing tasks:", error);
      return [];
    }

    return (data || []) as ComplianceTask[];
  } catch (err) {
    console.error("[Compliance] Exception in listComplianceTasks:", err);
    return [];
  }
}
