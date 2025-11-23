/**
 * Visual Concept Pack Service
 * Phase 33: Honest Visual Playground
 *
 * Generates honest preview packs with transparent limitations
 * All outputs labeled as AI-generated concepts
 */

import { getSupabaseServer } from "@/lib/supabase";
import { getDisclaimer } from "@/lib/content/pillars-config";

export type ConceptType = "wireframe" | "layout" | "copy" | "voice" | "video";
export type ConceptStatus = "draft" | "generated" | "reviewed" | "archived";

export interface ConceptItem {
  id: string;
  packId: string;
  type: ConceptType;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  disclaimer: string;
  generatedBy: string;
  status: ConceptStatus;
  createdAt: string;
}

export interface ConceptPack {
  id: string;
  workspaceId: string;
  pillarId: string;
  subPillarId: string;
  title: string;
  description: string;
  status: ConceptStatus;
  items: ConceptItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new concept pack
 */
export async function createConceptPack(
  workspaceId: string,
  pillarId: string,
  subPillarId: string,
  title: string,
  description: string
): Promise<ConceptPack> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("visual_concept_packs")
    .insert({
      workspace_id: workspaceId,
      pillar_id: pillarId,
      sub_pillar_id: subPillarId,
      title,
      description,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    pillarId: data.pillar_id,
    subPillarId: data.sub_pillar_id,
    title: data.title,
    description: data.description,
    status: data.status,
    items: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Add concept item to pack
 */
export async function addConceptItem(
  packId: string,
  type: ConceptType,
  title: string,
  content: string,
  generatedBy: string,
  metadata: Record<string, unknown> = {}
): Promise<ConceptItem> {
  const supabase = await getSupabaseServer();

  // Get appropriate disclaimer
  const disclaimerType =
    type === "wireframe" || type === "layout"
      ? "visual"
      : type === "copy"
        ? "copy"
        : type === "voice"
          ? "voice"
          : "video";

  const { data, error } = await supabase
    .from("visual_concept_items")
    .insert({
      pack_id: packId,
      type,
      title,
      content,
      metadata,
      disclaimer: getDisclaimer(disclaimerType),
      generated_by: generatedBy,
      status: "generated",
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    packId: data.pack_id,
    type: data.type,
    title: data.title,
    content: data.content,
    metadata: data.metadata,
    disclaimer: data.disclaimer,
    generatedBy: data.generated_by,
    status: data.status,
    createdAt: data.created_at,
  };
}

/**
 * Get concept pack with items
 */
export async function getConceptPack(packId: string): Promise<ConceptPack | null> {
  const supabase = await getSupabaseServer();

  const { data: pack, error: packError } = await supabase
    .from("visual_concept_packs")
    .select("*")
    .eq("id", packId)
    .single();

  if (packError || !pack) return null;

  const { data: items } = await supabase
    .from("visual_concept_items")
    .select("*")
    .eq("pack_id", packId)
    .order("created_at", { ascending: true });

  return {
    id: pack.id,
    workspaceId: pack.workspace_id,
    pillarId: pack.pillar_id,
    subPillarId: pack.sub_pillar_id,
    title: pack.title,
    description: pack.description,
    status: pack.status,
    items:
      items?.map(item => ({
        id: item.id,
        packId: item.pack_id,
        type: item.type,
        title: item.title,
        content: item.content,
        metadata: item.metadata,
        disclaimer: item.disclaimer,
        generatedBy: item.generated_by,
        status: item.status,
        createdAt: item.created_at,
      })) || [],
    createdAt: pack.created_at,
    updatedAt: pack.updated_at,
  };
}

/**
 * Get all concept packs for workspace
 */
export async function getWorkspaceConceptPacks(
  workspaceId: string,
  pillarId?: string
): Promise<ConceptPack[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("visual_concept_packs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (pillarId) {
    query = query.eq("pillar_id", pillarId);
  }

  const { data: packs } = await query;

  if (!packs) return [];

  // Get items for all packs
  const packIds = packs.map(p => p.id);
  const { data: allItems } = await supabase
    .from("visual_concept_items")
    .select("*")
    .in("pack_id", packIds);

  const itemsByPack = (allItems || []).reduce(
    (acc, item) => {
      if (!acc[item.pack_id]) acc[item.pack_id] = [];
      acc[item.pack_id].push(item);
      return acc;
    },
    {} as Record<string, typeof allItems>
  );

  return packs.map(pack => ({
    id: pack.id,
    workspaceId: pack.workspace_id,
    pillarId: pack.pillar_id,
    subPillarId: pack.sub_pillar_id,
    title: pack.title,
    description: pack.description,
    status: pack.status,
    items:
      itemsByPack[pack.id]?.map(item => ({
        id: item.id,
        packId: item.pack_id,
        type: item.type,
        title: item.title,
        content: item.content,
        metadata: item.metadata,
        disclaimer: item.disclaimer,
        generatedBy: item.generated_by,
        status: item.status,
        createdAt: item.created_at,
      })) || [],
    createdAt: pack.created_at,
    updatedAt: pack.updated_at,
  }));
}

/**
 * Update concept pack status
 */
export async function updatePackStatus(
  packId: string,
  status: ConceptStatus
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase
    .from("visual_concept_packs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", packId);
}

/**
 * Delete concept pack
 */
export async function deleteConceptPack(packId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  // Delete items first
  await supabase.from("visual_concept_items").delete().eq("pack_id", packId);

  // Delete pack
  await supabase.from("visual_concept_packs").delete().eq("id", packId);
}
