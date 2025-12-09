/**
 * E34: Operational Debt Service
 * Track long-lived governance, security, compliance, and code debt
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("debtService must only run on server");
}

export type DebtCategory = "security" | "compliance" | "architecture" | "data" | "process" | "other";
export type DebtSeverity = "low" | "medium" | "high" | "critical";
export type DebtStatus = "open" | "in_progress" | "blocked" | "resolved";

export interface OperationalDebt {
  id: string;
  tenant_id: string;
  title: string;
  category: DebtCategory;
  severity: DebtSeverity;
  status: DebtStatus;
  owner?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface DebtUpdate {
  id: string;
  debt_id: string;
  message: string;
  author?: string;
  created_at: string;
}

/**
 * List operational debt items
 */
export async function listOperationalDebt(
  tenantId: string,
  filters?: {
    status?: DebtStatus;
    severity?: DebtSeverity;
    category?: DebtCategory;
  }
): Promise<OperationalDebt[]> {
  const { data, error } = await supabaseAdmin.rpc("list_operational_debt", {
    p_tenant_id: tenantId,
    p_status: filters?.status || null,
    p_severity: filters?.severity || null,
    p_category: filters?.category || null,
  });

  if (error) throw new Error(`Failed to list operational debt: ${error.message}`);
  return data as OperationalDebt[];
}

/**
 * Create new operational debt item
 */
export async function createOperationalDebt(args: {
  tenantId: string;
  title: string;
  category: DebtCategory;
  severity: DebtSeverity;
  description?: string;
  owner?: string;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("create_operational_debt", {
    p_tenant_id: args.tenantId,
    p_title: args.title,
    p_category: args.category,
    p_severity: args.severity,
    p_description: args.description || null,
    p_owner: args.owner || null,
  });

  if (error) throw new Error(`Failed to create operational debt: ${error.message}`);
  return data as string; // UUID
}

/**
 * Update debt status
 */
export async function updateDebtStatus(
  debtId: string,
  status: DebtStatus
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("update_debt_status", {
    p_debt_id: debtId,
    p_status: status,
  });

  if (error) throw new Error(`Failed to update debt status: ${error.message}`);
}

/**
 * Add update to debt timeline
 */
export async function addDebtUpdate(
  debtId: string,
  message: string,
  author?: string
): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("add_debt_update", {
    p_debt_id: debtId,
    p_message: message,
    p_author: author || null,
  });

  if (error) throw new Error(`Failed to add debt update: ${error.message}`);
  return data as string; // UUID
}

/**
 * Get debt summary statistics
 */
export async function getDebtSummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_debt_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get debt summary: ${error.message}`);
  return data;
}

/**
 * Get single debt item with updates
 */
export async function getDebtDetails(debtId: string): Promise<{
  debt: OperationalDebt;
  updates: DebtUpdate[];
}> {
  const [debtResult, updatesResult] = await Promise.all([
    supabaseAdmin
      .from("operational_debt")
      .select("*")
      .eq("id", debtId)
      .single(),
    supabaseAdmin
      .from("operational_debt_updates")
      .select("*")
      .eq("debt_id", debtId)
      .order("created_at", { ascending: false }),
  ]);

  if (debtResult.error) throw new Error(`Failed to get debt: ${debtResult.error.message}`);
  if (updatesResult.error) throw new Error(`Failed to get updates: ${updatesResult.error.message}`);

  return {
    debt: debtResult.data as OperationalDebt,
    updates: updatesResult.data as DebtUpdate[],
  };
}
