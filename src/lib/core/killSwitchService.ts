/**
 * Kill-Switch Service (Phase E18)
 *
 * Safety controls for high-risk autonomous features
 * Server-side only - never expose to client
 *
 * Note: Uses kill_switch_* tables (not feature_flags from E12)
 *
 * @module killSwitchService
 */

import { supabaseAdmin } from "@/lib/supabase";

export type KillSwitchCategory =
  | "delivery"
  | "automation"
  | "ai"
  | "integrations"
  | "experimental"
  | "safety";

export interface KillSwitchFlag {
  id: string;
  tenant_id: string | null;
  key: string;
  name: string;
  description: string | null;
  category: KillSwitchCategory;
  enabled: boolean;
  is_kill_switch: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface KillSwitchOverride {
  id: string;
  tenant_id: string;
  flag_key: string;
  enabled: boolean;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
}

/**
 * Check if a kill-switch is enabled for a tenant
 *
 * @param tenantId - Tenant UUID
 * @param flagKey - Kill-switch key
 * @returns True if enabled, false otherwise (fail-safe)
 */
export async function isKillSwitchEnabled(
  tenantId: string,
  flagKey: string
): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("killSwitchService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("check_feature_flag", {
      p_tenant_id: tenantId,
      p_flag_key: flagKey,
    });

    if (error) {
      console.error("[KillSwitch] Error checking flag:", error);
      return false;
    }

    return data as boolean;
  } catch (err) {
    console.error("[KillSwitch] Exception in isKillSwitchEnabled:", err);
    return false;
  }
}

/**
 * Require a kill-switch to be enabled (throw error if disabled)
 *
 * @param tenantId - Tenant UUID
 * @param flagKey - Kill-switch key
 * @throws Error if feature is disabled
 */
export async function requireKillSwitch(
  tenantId: string,
  flagKey: string
): Promise<void> {
  const enabled = await isKillSwitchEnabled(tenantId, flagKey);

  if (!enabled) {
    throw new Error(
      `Feature '${flagKey}' is not enabled. Enable it in settings or contact support.`
    );
  }
}

/**
 * Enable a kill-switch for a tenant
 */
export async function enableKillSwitch(
  tenantId: string,
  flagKey: string,
  reason?: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("killSwitchService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("enable_feature_flag", {
      p_tenant_id: tenantId,
      p_flag_key: flagKey,
      p_reason: reason || null,
    });

    if (error) {
      throw new Error(`Failed to enable kill-switch: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Disable a kill-switch for a tenant (KILL-SWITCH ACTIVATION)
 */
export async function disableKillSwitch(
  tenantId: string,
  flagKey: string,
  reason?: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("killSwitchService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("disable_feature_flag", {
      p_tenant_id: tenantId,
      p_flag_key: flagKey,
      p_reason: reason || null,
    });

    if (error) {
      throw new Error(`Failed to disable kill-switch: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Set tenant-specific override
 */
export async function setKillSwitchOverride(args: {
  tenantId: string;
  flagKey: string;
  enabled: boolean;
  reason?: string;
  createdBy?: string;
  expiresAt?: Date;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("killSwitchService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("set_feature_override", {
      p_tenant_id: args.tenantId,
      p_flag_key: args.flagKey,
      p_enabled: args.enabled,
      p_reason: args.reason || null,
      p_created_by: args.createdBy || null,
      p_expires_at: args.expiresAt?.toISOString() || null,
    });

    if (error) {
      throw new Error(`Failed to set override: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List all kill-switches
 */
export async function listKillSwitches(
  tenantId?: string,
  category?: KillSwitchCategory
): Promise<KillSwitchFlag[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("killSwitchService must only run on server");
    }

    let query = supabaseAdmin
      .from("kill_switch_flags")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (tenantId !== undefined) {
      if (tenantId === null) {
        query = query.is("tenant_id", null);
      } else {
        query = query.eq("tenant_id", tenantId);
      }
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[KillSwitch] Error listing flags:", error);
      return [];
    }

    return (data || []) as KillSwitchFlag[];
  } catch (err) {
    console.error("[KillSwitch] Exception in listKillSwitches:", err);
    return [];
  }
}

/**
 * List kill-switch overrides for a tenant
 */
export async function listKillSwitchOverrides(
  tenantId: string
): Promise<KillSwitchOverride[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("killSwitchService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("kill_switch_overrides")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return (data || []) as KillSwitchOverride[];
  } catch (err) {
    return [];
  }
}

/**
 * Get high-risk kill-switches
 */
export async function getHighRiskKillSwitches(): Promise<KillSwitchFlag[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("killSwitchService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("kill_switch_flags")
      .select("*")
      .eq("is_kill_switch", true)
      .is("tenant_id", null)
      .order("category", { ascending: true });

    if (error) {
      return [];
    }

    return (data || []) as KillSwitchFlag[];
  } catch (err) {
    return [];
  }
}

/**
 * Get kill-switch statistics
 */
export async function getKillSwitchStats(tenantId: string): Promise<{
  total_switches: number;
  enabled_switches: number;
  disabled_switches: number;
  high_risk_active: number;
  active_overrides: number;
}> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("killSwitchService must only run on server");
    }

    const { data: flags } = await supabaseAdmin
      .from("kill_switch_flags")
      .select("enabled, is_kill_switch")
      .eq("tenant_id", tenantId);

    const { data: globalFlags } = await supabaseAdmin
      .from("kill_switch_flags")
      .select("enabled, is_kill_switch")
      .is("tenant_id", null);

    const { data: overrides } = await supabaseAdmin
      .from("kill_switch_overrides")
      .select("id")
      .eq("tenant_id", tenantId)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString());

    const allFlags = [...(flags || []), ...(globalFlags || [])];

    return {
      total_switches: allFlags.length,
      enabled_switches: allFlags.filter((f) => f.enabled).length,
      disabled_switches: allFlags.filter((f) => !f.enabled).length,
      high_risk_active: allFlags.filter(
        (f) => f.is_kill_switch && f.enabled
      ).length,
      active_overrides: overrides?.length || 0,
    };
  } catch (err) {
    return {
      total_switches: 0,
      enabled_switches: 0,
      disabled_switches: 0,
      high_risk_active: 0,
      active_overrides: 0,
    };
  }
}
