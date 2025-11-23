/**
 * Client Knowledge Service
 * Phase 36: MVP Client Truth Layer
 *
 * Manages client ideas, emails, uploads and persona profiles
 */

import { getSupabaseServer } from "@/lib/supabase";

export type SourceType = "email" | "note" | "upload" | "meeting";

export interface KnowledgeItem {
  id: string;
  client_id: string;
  source_type: SourceType;
  source_id: string | null;
  title: string | null;
  content: string | null;
  metadata: Record<string, unknown>;
  model_used: string | null;
  created_at: string;
}

export interface PersonaProfile {
  id: string;
  client_id: string;
  persona_summary: string | null;
  goals: string | null;
  constraints: string | null;
  audience: string | null;
  brand_notes: string | null;
  updated_at: string;
}

/**
 * Ingest text input as knowledge item
 */
export async function ingestTextInput(
  clientId: string,
  sourceType: SourceType,
  title: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<KnowledgeItem | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_knowledge_items")
    .insert({
      client_id: clientId,
      source_type: sourceType,
      title,
      content,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error ingesting knowledge:", error);
    return null;
  }

  return data as KnowledgeItem;
}

/**
 * Attach email summary as knowledge
 */
export async function attachEmailSummary(
  clientId: string,
  emailMeta: { id: string; subject: string; from: string },
  summary: string,
  modelUsed?: string
): Promise<KnowledgeItem | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_knowledge_items")
    .insert({
      client_id: clientId,
      source_type: "email",
      source_id: emailMeta.id,
      title: emailMeta.subject,
      content: summary,
      metadata: { from: emailMeta.from },
      model_used: modelUsed,
    })
    .select()
    .single();

  if (error) {
    console.error("Error attaching email summary:", error);
    return null;
  }

  return data as KnowledgeItem;
}

/**
 * Attach upload summary as knowledge
 */
export async function attachUploadSummary(
  clientId: string,
  fileMeta: { id: string; filename: string; type: string },
  summary: string,
  modelUsed?: string
): Promise<KnowledgeItem | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_knowledge_items")
    .insert({
      client_id: clientId,
      source_type: "upload",
      source_id: fileMeta.id,
      title: fileMeta.filename,
      content: summary,
      metadata: { fileType: fileMeta.type },
      model_used: modelUsed,
    })
    .select()
    .single();

  if (error) {
    console.error("Error attaching upload summary:", error);
    return null;
  }

  return data as KnowledgeItem;
}

/**
 * Get persona profile for client
 */
export async function getPersonaProfile(
  clientId: string
): Promise<PersonaProfile | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_persona_profiles")
    .select("*")
    .eq("client_id", clientId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching persona:", error);
  }

  return data as PersonaProfile | null;
}

/**
 * Update or create persona profile
 */
export async function updatePersonaProfile(
  clientId: string,
  profile: Partial<Omit<PersonaProfile, "id" | "client_id" | "updated_at">>
): Promise<PersonaProfile | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_persona_profiles")
    .upsert({
      client_id: clientId,
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating persona:", error);
    return null;
  }

  return data as PersonaProfile;
}

/**
 * List all knowledge items for client
 */
export async function listKnowledgeItems(
  clientId: string,
  options?: { sourceType?: SourceType; limit?: number }
): Promise<KnowledgeItem[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("client_knowledge_items")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (options?.sourceType) {
    query = query.eq("source_type", options.sourceType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error listing knowledge:", error);
    return [];
  }

  return data as KnowledgeItem[];
}
