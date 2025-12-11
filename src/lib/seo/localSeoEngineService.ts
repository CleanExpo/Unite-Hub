import { getSupabaseServer } from "@/lib/supabase";
import type {
  LocalSeoProfile,
  AiSearchVisibilityRecord,
  SchemaMarkupRecord,
  GbpQueueItem,
  ServiceContentStrategyRecord,
} from "./localSeoEngineTypes";

/**
 * Minimal service layer for the Synthex 2026 Local SEO engine.
 *
 * NOTE: This is intentionally light and workspace-scoped. As we
 * build out agents and richer dashboards we can extend this with
 * pagination, filtering by profile, date ranges, etc.
 */

export interface LocalSeoVisibilitySummary {
  profile: LocalSeoProfile | null;
  visibility: AiSearchVisibilityRecord[];
}

export interface LocalSeoSchemaSummary {
  profile: LocalSeoProfile | null;
  markup: SchemaMarkupRecord[];
}

export interface LocalSeoGbpQueueSummary {
  profile: LocalSeoProfile | null;
  queue: GbpQueueItem[];
}

export interface LocalSeoServiceContentSummary {
  profile: LocalSeoProfile | null;
  services: ServiceContentStrategyRecord[];
}

/**
 * Fetch the primary Local SEO profile for a workspace.
 *
 * For now this simply returns the most recently created profile
 * (if multiple exist). In the future we can add explicit "active"
 * flags or per-domain selection.
 */
export async function getLocalSeoProfileForWorkspace(
  workspaceId: string
): Promise<LocalSeoProfile | null> {
  if (!workspaceId) {
throw new Error("workspaceId is required");
}

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("synthex_local_seo_profiles")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("getLocalSeoProfileForWorkspace error", error);
    throw error;
  }

  if (!data || data.length === 0) {
return null;
}
  return data[0] as LocalSeoProfile;
}

/**
 * Fetch recent AI search visibility records for a workspace.
 *
 * If a profileId is provided, we scope to that profile; otherwise
 * we return all visibility rows for the workspace.
 */
export async function getAiSearchVisibilityForWorkspace(
  workspaceId: string,
  options: { profileId?: string; limit?: number } = {}
): Promise<AiSearchVisibilityRecord[]> {
  if (!workspaceId) {
throw new Error("workspaceId is required");
}

  const { profileId, limit = 50 } = options;
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("ai_search_visibility")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("checked_at", { ascending: false })
    .limit(limit);

  if (profileId) {
    query = query.eq("seo_profile_id", profileId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getAiSearchVisibilityForWorkspace error", error);
    throw error;
  }

  return (data || []) as AiSearchVisibilityRecord[];
}

/**
 * Fetch recent schema markup records for a workspace.
 *
 * If a profileId is provided, we scope to that profile; otherwise
 * we return all markup rows for the workspace.
 */
export async function getSchemaMarkupForWorkspace(
  workspaceId: string,
  options: { profileId?: string; limit?: number } = {}
): Promise<SchemaMarkupRecord[]> {
  if (!workspaceId) {
throw new Error("workspaceId is required");
}

  const { profileId, limit = 100 } = options;
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("schema_markup_generated")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (profileId) {
    query = query.eq("seo_profile_id", profileId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getSchemaMarkupForWorkspace error", error);
    throw error;
  }

  return (data || []) as SchemaMarkupRecord[];
}

/**
 * Fetch GBP management queue items for a workspace.
 */
export async function getGbpQueueForWorkspace(
  workspaceId: string,
  options: { profileId?: string; status?: string; limit?: number } = {}
): Promise<GbpQueueItem[]> {
  if (!workspaceId) {
throw new Error("workspaceId is required");
}

  const { profileId, status, limit = 100 } = options;
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("gbp_management_queue")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (profileId) {
    query = query.eq("seo_profile_id", profileId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getGbpQueueForWorkspace error", error);
    throw error;
  }

  return (data || []) as GbpQueueItem[];
}

/**
 * Fetch service-level content strategy records for a workspace.
 */
export async function getServiceContentStrategiesForWorkspace(
  workspaceId: string,
  options: { profileId?: string; status?: string; limit?: number } = {}
): Promise<ServiceContentStrategyRecord[]> {
  if (!workspaceId) {
throw new Error("workspaceId is required");
}

  const { profileId, status, limit = 100 } = options;
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("service_content_strategy")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (profileId) {
    query = query.eq("seo_profile_id", profileId);
  }

  if (status) {
    query = query.eq("content_status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getServiceContentStrategiesForWorkspace error", error);
    throw error;
  }

  return (data || []) as ServiceContentStrategyRecord[];
}

/**
 * Convenience helper that fetches the primary profile for the
 * workspace and its recent AI search visibility records.
 */
export async function getLocalSeoVisibilitySummary(
  workspaceId: string,
  options: { limit?: number } = {}
): Promise<LocalSeoVisibilitySummary> {
  const profile = await getLocalSeoProfileForWorkspace(workspaceId);
  const visibility = await getAiSearchVisibilityForWorkspace(workspaceId, {
    profileId: profile?.id,
    limit: options.limit ?? 50,
  });

  return { profile, visibility };
}

/**
 * Convenience helper that fetches the primary profile for the
 * workspace and its recent schema markup records.
 */
export async function getLocalSeoSchemaSummary(
  workspaceId: string,
  options: { limit?: number } = {}
): Promise<LocalSeoSchemaSummary> {
  const profile = await getLocalSeoProfileForWorkspace(workspaceId);
  const markup = await getSchemaMarkupForWorkspace(workspaceId, {
    profileId: profile?.id,
    limit: options.limit ?? 100,
  });

  return { profile, markup };
}

/**
 * Convenience helper that fetches the primary profile for the
 * workspace and its GBP management queue items.
 */
export async function getLocalSeoGbpQueueSummary(
  workspaceId: string,
  options: { limit?: number; status?: string } = {}
): Promise<LocalSeoGbpQueueSummary> {
  const profile = await getLocalSeoProfileForWorkspace(workspaceId);
  const queue = await getGbpQueueForWorkspace(workspaceId, {
    profileId: profile?.id,
    status: options.status,
    limit: options.limit ?? 100,
  });

  return { profile, queue };
}

/**
 * Convenience helper that fetches the primary profile for the
 * workspace and its service-level content strategy entries.
 */
export async function getLocalSeoServiceContentSummary(
  workspaceId: string,
  options: { limit?: number; status?: string } = {}
): Promise<LocalSeoServiceContentSummary> {
  const profile = await getLocalSeoProfileForWorkspace(workspaceId);
  const services = await getServiceContentStrategiesForWorkspace(workspaceId, {
    profileId: profile?.id,
    status: options.status,
    limit: options.limit ?? 100,
  });

  return { profile, services };
}
