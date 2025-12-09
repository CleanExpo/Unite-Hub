/**
 * Evidence Pack Builder Service (Phase E32)
 * Server-side only service for creating and managing evidence packs
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type EvidencePackStatus = "draft" | "pending_review" | "approved" | "exported" | "archived";
export type EvidenceItemType = "audit_log" | "policy_document" | "incident_report" | "sla_report" |
  "compliance_certificate" | "security_scan" | "backup_record" | "access_log" |
  "data_retention_record" | "webhook_log" | "risk_assessment" | "other";

export interface EvidencePack {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  purpose?: string;
  status: EvidencePackStatus;
  created_by: string;
  item_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface EvidencePackItem {
  id: string;
  pack_id: string;
  item_type: EvidenceItemType;
  item_id?: string;
  item_title: string;
  item_summary?: string;
  attached_file_url?: string;
  item_order: number;
  created_at: string;
}

export async function listEvidencePacks(tenantId: string, status?: EvidencePackStatus, purpose?: string): Promise<EvidencePack[]> {
  if (typeof window !== "undefined") throw new Error("evidencePackService must only run on server");
  const { data, error } = await supabaseAdmin.rpc("list_evidence_packs", {
    p_tenant_id: tenantId,
    p_status: status || null,
    p_purpose: purpose || null,
  });
  if (error) throw new Error(`Failed to list evidence packs: ${error.message}`);
  return data as EvidencePack[];
}

export async function createEvidencePack(args: {
  tenantId: string;
  name: string;
  description?: string;
  purpose?: string;
  createdBy?: string;
  periodStart?: string;
  periodEnd?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  if (typeof window !== "undefined") throw new Error("evidencePackService must only run on server");
  const { data, error } = await supabaseAdmin.rpc("create_evidence_pack", {
    p_tenant_id: args.tenantId,
    p_name: args.name,
    p_description: args.description || null,
    p_purpose: args.purpose || null,
    p_created_by: args.createdBy || null,
    p_period_start: args.periodStart || null,
    p_period_end: args.periodEnd || null,
    p_metadata: args.metadata || {},
  });
  if (error) throw new Error(`Failed to create evidence pack: ${error.message}`);
  return data as string;
}

export async function addPackItem(args: {
  packId: string;
  itemType: EvidenceItemType;
  itemId?: string;
  itemTitle: string;
  itemSummary?: string;
  itemData?: Record<string, any>;
  attachedFileUrl?: string;
  itemOrder?: number;
}): Promise<string> {
  if (typeof window !== "undefined") throw new Error("evidencePackService must only run on server");
  const { data, error } = await supabaseAdmin.rpc("add_evidence_pack_item", {
    p_pack_id: args.packId,
    p_item_type: args.itemType,
    p_item_id: args.itemId || null,
    p_item_title: args.itemTitle,
    p_item_summary: args.itemSummary || null,
    p_item_data: args.itemData || {},
    p_attached_file_url: args.attachedFileUrl || null,
    p_item_order: args.itemOrder || 0,
  });
  if (error) throw new Error(`Failed to add pack item: ${error.message}`);
  return data as string;
}

export async function updatePackStatus(
  packId: string,
  status: EvidencePackStatus,
  reviewedBy?: string,
  exportFormat?: string,
  exportUrl?: string
): Promise<void> {
  if (typeof window !== "undefined") throw new Error("evidencePackService must only run on server");
  const { error } = await supabaseAdmin.rpc("update_evidence_pack_status", {
    p_pack_id: packId,
    p_status: status,
    p_reviewed_by: reviewedBy || null,
    p_export_format: exportFormat || null,
    p_export_url: exportUrl || null,
  });
  if (error) throw new Error(`Failed to update pack status: ${error.message}`);
}

export async function getPackSummary(packId: string): Promise<any> {
  if (typeof window !== "undefined") throw new Error("evidencePackService must only run on server");
  const { data, error } = await supabaseAdmin.rpc("get_evidence_pack_summary", { p_pack_id: packId });
  if (error) throw new Error(`Failed to get pack summary: ${error.message}`);
  return data;
}

export async function listPackItems(packId: string): Promise<EvidencePackItem[]> {
  if (typeof window !== "undefined") throw new Error("evidencePackService must only run on server");
  const { data, error } = await supabaseAdmin.rpc("list_pack_items", { p_pack_id: packId });
  if (error) throw new Error(`Failed to list pack items: ${error.message}`);
  return data as EvidencePackItem[];
}
