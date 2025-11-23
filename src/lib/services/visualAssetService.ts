/**
 * Visual Asset Service
 * Phase 38: Visual Orchestration Layer
 *
 * Manages visual assets and variants with approval integration
 */

import { getSupabaseServer } from "@/lib/supabase";
import { logEvent } from "./aiEventLogService";

export type AssetType = "image" | "video" | "graph";
export type AssetStatus = "draft" | "proposed" | "approved" | "rejected";

export interface VisualAsset {
  id: string;
  client_id: string;
  context: string;
  type: AssetType;
  model_used: string;
  status: AssetStatus;
  label: string | null;
  description: string | null;
  asset_url: string | null;
  thumbnail_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface VisualAssetVariant {
  id: string;
  visual_asset_id: string;
  variant_label: string | null;
  model_used: string;
  asset_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Create a new visual asset
 */
export async function createVisualAsset(
  clientId: string,
  context: string,
  type: AssetType,
  modelUsed: string,
  label?: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<VisualAsset | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("visual_assets")
    .insert({
      client_id: clientId,
      context,
      type,
      model_used: modelUsed,
      label: label || null,
      description: description || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating visual asset:", error);
    return null;
  }

  // Log the event
  await logEvent(
    clientId,
    modelUsed,
    "image_generated",
    `${type} asset created: ${label || context}`,
    { assetId: data.id, context, type }
  );

  return data as VisualAsset;
}

/**
 * Add a variant to an existing visual asset
 */
export async function addVariant(
  visualAssetId: string,
  modelUsed: string,
  variantLabel?: string,
  assetUrl?: string,
  metadata?: Record<string, unknown>
): Promise<VisualAssetVariant | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("visual_asset_variants")
    .insert({
      visual_asset_id: visualAssetId,
      model_used: modelUsed,
      variant_label: variantLabel || null,
      asset_url: assetUrl || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding variant:", error);
    return null;
  }

  return data as VisualAssetVariant;
}

/**
 * List visual assets for a client
 */
export async function listVisualAssetsForClient(
  clientId: string,
  options?: {
    context?: string;
    type?: AssetType;
    status?: AssetStatus;
    limit?: number;
  }
): Promise<VisualAsset[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("visual_assets")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (options?.context) {
    query = query.eq("context", options.context);
  }

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error listing visual assets:", error);
    return [];
  }

  return data as VisualAsset[];
}

/**
 * Get a single visual asset with variants
 */
export async function getVisualAsset(
  id: string
): Promise<(VisualAsset & { variants: VisualAssetVariant[] }) | null> {
  const supabase = await getSupabaseServer();

  const { data: asset, error: assetError } = await supabase
    .from("visual_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (assetError || !asset) {
    console.error("Error fetching visual asset:", assetError);
    return null;
  }

  const { data: variants, error: variantsError } = await supabase
    .from("visual_asset_variants")
    .select("*")
    .eq("visual_asset_id", id)
    .order("created_at", { ascending: false });

  if (variantsError) {
    console.error("Error fetching variants:", variantsError);
  }

  return {
    ...asset,
    variants: variants || [],
  } as VisualAsset & { variants: VisualAssetVariant[] };
}

/**
 * Update asset status
 */
export async function updateStatus(
  visualAssetId: string,
  status: AssetStatus,
  clientId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("visual_assets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", visualAssetId)
    .eq("client_id", clientId);

  if (error) {
    console.error("Error updating status:", error);
    return false;
  }

  // Log the event
  const eventType = status === "approved" ? "item_approved" : "item_rejected";
  await logEvent(
    clientId,
    "system",
    eventType,
    `Visual asset ${status}`,
    { assetId: visualAssetId }
  );

  return true;
}

/**
 * Link visual asset to approval request
 */
export async function linkToApproval(
  visualAssetId: string,
  approvalId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("visual_assets")
    .update({
      metadata: { approval_id: approvalId },
      updated_at: new Date().toISOString(),
    })
    .eq("id", visualAssetId);

  if (error) {
    console.error("Error linking to approval:", error);
    return false;
  }

  return true;
}

/**
 * Update asset URL after generation
 */
export async function updateAssetUrl(
  visualAssetId: string,
  assetUrl: string,
  thumbnailUrl?: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("visual_assets")
    .update({
      asset_url: assetUrl,
      thumbnail_url: thumbnailUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", visualAssetId);

  if (error) {
    console.error("Error updating asset URL:", error);
    return false;
  }

  return true;
}
