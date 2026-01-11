/**
 * Synthex Omni-Channel Identity Graph Service
 *
 * Phase: D34 - OCIG (Omni-Channel Identity Graph)
 *
 * Cross-channel identity resolution with graph-based
 * relationships and AI-powered matching
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// LAZY ANTHROPIC CLIENT
// =====================================================

let anthropicClient: Anthropic | null = null;
let clientCreatedAt: number = 0;
const CLIENT_TTL_MS = 60_000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - clientCreatedAt > CLIENT_TTL_MS) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
    clientCreatedAt = now;
  }
  return anthropicClient;
}

// =====================================================
// TYPES
// =====================================================

export type IdentityChannel =
  | "email"
  | "phone"
  | "social_facebook"
  | "social_instagram"
  | "social_linkedin"
  | "social_twitter"
  | "social_tiktok"
  | "website"
  | "app_ios"
  | "app_android"
  | "crm"
  | "advertising"
  | "offline"
  | "partner"
  | "custom";

export type IdentityStatus =
  | "active"
  | "merged"
  | "deleted"
  | "suspicious"
  | "unverified";

export type IdentityRelationship =
  | "same_person"
  | "household"
  | "business"
  | "related"
  | "similar"
  | "duplicate"
  | "parent_child"
  | "alias"
  | "custom";

export type ResolutionMethod =
  | "deterministic"
  | "probabilistic"
  | "ai_powered"
  | "manual"
  | "rule_based"
  | "graph_based";

export interface IdentityNode {
  id: string;
  tenant_id: string;
  external_id?: string;
  id_channel: IdentityChannel;
  channel_identifier: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  attributes: Record<string, unknown>;
  confidence_score: number;
  match_signals: unknown[];
  verified_at?: string;
  verification_method?: string;
  id_status: IdentityStatus;
  merged_into_id?: string;
  first_seen_at: string;
  last_seen_at: string;
  interaction_count: number;
  total_value: number;
  source_system?: string;
  source_id?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IdentityEdge {
  id: string;
  tenant_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_relationship: IdentityRelationship;
  relationship_label?: string;
  weight: number;
  confidence: number;
  strength_factors: unknown[];
  is_bidirectional: boolean;
  resolution_method: ResolutionMethod;
  resolution_reasoning?: string;
  resolution_signals: unknown[];
  validated: boolean;
  validated_at?: string;
  validated_by?: string;
  first_linked_at: string;
  last_confirmed_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UnifiedProfile {
  id: string;
  tenant_id: string;
  profile_name?: string;
  primary_email?: string;
  primary_phone?: string;
  channels: string[];
  node_ids: string[];
  total_touchpoints: number;
  merged_attributes: Record<string, unknown>;
  attribute_sources: Record<string, unknown>;
  overall_confidence: number;
  profile_completeness: number;
  data_quality_score: number;
  total_value: number;
  predicted_ltv?: number;
  engagement_score: number;
  segments: string[];
  personas: string[];
  first_interaction_at?: string;
  last_interaction_at?: string;
  interaction_count: number;
  is_active: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ResolutionLog {
  id: string;
  tenant_id: string;
  request_id?: string;
  input_payload: Record<string, unknown>;
  input_channels: string[];
  resolution_result: Record<string, unknown>;
  matched_nodes: string[];
  created_nodes: string[];
  merged_profiles: string[];
  resolution_method: ResolutionMethod;
  match_count: number;
  confidence_threshold: number;
  ai_reasoning?: Record<string, unknown>;
  ai_confidence?: number;
  ai_suggestions?: Record<string, unknown>;
  processing_time_ms?: number;
  tokens_used: number;
  created_by?: string;
  created_at: string;
}

export interface MatchingRule {
  id: string;
  tenant_id?: string;
  rule_name: string;
  rule_description?: string;
  rule_type: string;
  source_channel?: IdentityChannel;
  target_channel?: IdentityChannel;
  match_fields: unknown[];
  match_conditions: Record<string, unknown>;
  base_confidence: number;
  confidence_adjustments: Record<string, unknown>;
  is_active: boolean;
  priority: number;
  total_matches: number;
  successful_matches: number;
  false_positive_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface IdentityGraphStats {
  total_nodes: number;
  active_nodes: number;
  merged_nodes: number;
  nodes_by_channel: Record<string, number>;
  total_edges: number;
  total_unified_profiles: number;
  avg_confidence: number;
  resolution_count: number;
}

// =====================================================
// NODE FUNCTIONS
// =====================================================

export async function createNode(
  tenantId: string,
  data: {
    channel: IdentityChannel;
    channel_identifier: string;
    external_id?: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string;
    attributes?: Record<string, unknown>;
    confidence_score?: number;
    source_system?: string;
    source_id?: string;
    tags?: string[];
  }
): Promise<IdentityNode> {
  const supabase = await createClient();

  const { data: node, error } = await supabase
    .from("synthex_idg_nodes")
    .insert({
      tenant_id: tenantId,
      id_channel: data.channel,
      channel_identifier: data.channel_identifier,
      external_id: data.external_id,
      first_name: data.first_name,
      last_name: data.last_name,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      attributes: data.attributes || {},
      confidence_score: data.confidence_score || 0.8,
      source_system: data.source_system,
      source_id: data.source_id,
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create node: ${error.message}`);
}
  return node as IdentityNode;
}

export async function updateNode(
  nodeId: string,
  updates: Partial<Omit<IdentityNode, "id" | "tenant_id" | "created_at">>
): Promise<IdentityNode> {
  const supabase = await createClient();

  const { data: node, error } = await supabase
    .from("synthex_idg_nodes")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", nodeId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update node: ${error.message}`);
}
  return node as IdentityNode;
}

export async function getNode(nodeId: string): Promise<IdentityNode | null> {
  const supabase = await createClient();

  const { data: node, error } = await supabase
    .from("synthex_idg_nodes")
    .select("*")
    .eq("id", nodeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get node: ${error.message}`);
  }
  return node as IdentityNode;
}

export async function findNodeByIdentifier(
  tenantId: string,
  channel: IdentityChannel,
  identifier: string
): Promise<IdentityNode | null> {
  const supabase = await createClient();

  const { data: node, error } = await supabase
    .from("synthex_idg_nodes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id_channel", channel)
    .eq("channel_identifier", identifier)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to find node: ${error.message}`);
  }
  return node as IdentityNode;
}

export async function listNodes(
  tenantId: string,
  filters?: {
    channel?: IdentityChannel;
    status?: IdentityStatus;
    min_confidence?: number;
    search?: string;
    limit?: number;
  }
): Promise<IdentityNode[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_idg_nodes")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("last_seen_at", { ascending: false });

  if (filters?.channel) {
    query = query.eq("id_channel", filters.channel);
  }
  if (filters?.status) {
    query = query.eq("id_status", filters.status);
  }
  if (filters?.min_confidence) {
    query = query.gte("confidence_score", filters.min_confidence);
  }
  if (filters?.search) {
    query = query.or(
      `channel_identifier.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
    );
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: nodes, error } = await query;

  if (error) {
throw new Error(`Failed to list nodes: ${error.message}`);
}
  return (nodes || []) as IdentityNode[];
}

// =====================================================
// EDGE FUNCTIONS
// =====================================================

export async function createEdge(
  tenantId: string,
  data: {
    source_node_id: string;
    target_node_id: string;
    relationship: IdentityRelationship;
    relationship_label?: string;
    weight?: number;
    confidence?: number;
    is_bidirectional?: boolean;
    resolution_method?: ResolutionMethod;
    resolution_reasoning?: string;
    resolution_signals?: unknown[];
  }
): Promise<IdentityEdge> {
  const supabase = await createClient();

  const { data: edge, error } = await supabase
    .from("synthex_idg_edges")
    .insert({
      tenant_id: tenantId,
      source_node_id: data.source_node_id,
      target_node_id: data.target_node_id,
      edge_relationship: data.relationship,
      relationship_label: data.relationship_label,
      weight: data.weight || 1.0,
      confidence: data.confidence || 0.8,
      is_bidirectional: data.is_bidirectional ?? true,
      resolution_method: data.resolution_method || "probabilistic",
      resolution_reasoning: data.resolution_reasoning,
      resolution_signals: data.resolution_signals || [],
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create edge: ${error.message}`);
}
  return edge as IdentityEdge;
}

export async function listEdges(
  tenantId: string,
  filters?: {
    source_node_id?: string;
    target_node_id?: string;
    relationship?: IdentityRelationship;
    min_confidence?: number;
    limit?: number;
  }
): Promise<IdentityEdge[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_idg_edges")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.source_node_id) {
    query = query.eq("source_node_id", filters.source_node_id);
  }
  if (filters?.target_node_id) {
    query = query.eq("target_node_id", filters.target_node_id);
  }
  if (filters?.relationship) {
    query = query.eq("edge_relationship", filters.relationship);
  }
  if (filters?.min_confidence) {
    query = query.gte("confidence", filters.min_confidence);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: edges, error } = await query;

  if (error) {
throw new Error(`Failed to list edges: ${error.message}`);
}
  return (edges || []) as IdentityEdge[];
}

export async function getConnectedNodes(
  nodeId: string,
  maxDepth: number = 2
): Promise<Array<{ node_id: string; depth: number; path: string[]; relationship: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("synthex_idg_get_connected_nodes", {
    p_node_id: nodeId,
    p_max_depth: maxDepth,
  });

  if (error) {
throw new Error(`Failed to get connected nodes: ${error.message}`);
}
  return data || [];
}

// =====================================================
// UNIFIED PROFILE FUNCTIONS
// =====================================================

export async function getUnifiedProfile(profileId: string): Promise<UnifiedProfile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("synthex_idg_unified_profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get unified profile: ${error.message}`);
  }
  return profile as UnifiedProfile;
}

export async function listUnifiedProfiles(
  tenantId: string,
  filters?: {
    min_confidence?: number;
    min_completeness?: number;
    has_email?: boolean;
    segment?: string;
    search?: string;
    limit?: number;
  }
): Promise<UnifiedProfile[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_idg_unified_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("last_interaction_at", { ascending: false, nullsFirst: false });

  if (filters?.min_confidence) {
    query = query.gte("overall_confidence", filters.min_confidence);
  }
  if (filters?.min_completeness) {
    query = query.gte("profile_completeness", filters.min_completeness);
  }
  if (filters?.has_email) {
    query = query.not("primary_email", "is", null);
  }
  if (filters?.segment) {
    query = query.contains("segments", [filters.segment]);
  }
  if (filters?.search) {
    query = query.or(
      `primary_email.ilike.%${filters.search}%,profile_name.ilike.%${filters.search}%`
    );
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: profiles, error } = await query;

  if (error) {
throw new Error(`Failed to list unified profiles: ${error.message}`);
}
  return (profiles || []) as UnifiedProfile[];
}

export async function updateUnifiedProfile(
  profileId: string,
  updates: Partial<Omit<UnifiedProfile, "id" | "tenant_id" | "created_at">>
): Promise<UnifiedProfile> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("synthex_idg_unified_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update unified profile: ${error.message}`);
}
  return profile as UnifiedProfile;
}

// =====================================================
// RESOLUTION FUNCTIONS
// =====================================================

export async function resolveIdentity(
  tenantId: string,
  channel: IdentityChannel,
  identifier: string,
  attributes?: Record<string, unknown>
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("synthex_idg_resolve_identity", {
    p_tenant_id: tenantId,
    p_channel: channel,
    p_identifier: identifier,
    p_attributes: attributes || {},
  });

  if (error) {
throw new Error(`Failed to resolve identity: ${error.message}`);
}
  return data as string;
}

export async function logResolution(
  tenantId: string,
  data: {
    request_id?: string;
    input_payload: Record<string, unknown>;
    input_channels?: string[];
    resolution_result: Record<string, unknown>;
    matched_nodes?: string[];
    created_nodes?: string[];
    merged_profiles?: string[];
    resolution_method: ResolutionMethod;
    match_count?: number;
    confidence_threshold?: number;
    ai_reasoning?: Record<string, unknown>;
    ai_confidence?: number;
    ai_suggestions?: Record<string, unknown>;
    processing_time_ms?: number;
    tokens_used?: number;
  },
  userId?: string
): Promise<ResolutionLog> {
  const supabase = await createClient();

  const { data: log, error } = await supabase
    .from("synthex_idg_resolution_log")
    .insert({
      tenant_id: tenantId,
      request_id: data.request_id,
      input_payload: data.input_payload,
      input_channels: data.input_channels || [],
      resolution_result: data.resolution_result,
      matched_nodes: data.matched_nodes || [],
      created_nodes: data.created_nodes || [],
      merged_profiles: data.merged_profiles || [],
      resolution_method: data.resolution_method,
      match_count: data.match_count || 0,
      confidence_threshold: data.confidence_threshold || 0.75,
      ai_reasoning: data.ai_reasoning,
      ai_confidence: data.ai_confidence,
      ai_suggestions: data.ai_suggestions,
      processing_time_ms: data.processing_time_ms,
      tokens_used: data.tokens_used || 0,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to log resolution: ${error.message}`);
}
  return log as ResolutionLog;
}

export async function listResolutionLogs(
  tenantId: string,
  filters?: {
    resolution_method?: ResolutionMethod;
    limit?: number;
  }
): Promise<ResolutionLog[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_idg_resolution_log")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.resolution_method) {
    query = query.eq("resolution_method", filters.resolution_method);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: logs, error } = await query;

  if (error) {
throw new Error(`Failed to list resolution logs: ${error.message}`);
}
  return (logs || []) as ResolutionLog[];
}

// =====================================================
// MATCHING RULE FUNCTIONS
// =====================================================

export async function listMatchingRules(
  tenantId: string,
  filters?: {
    rule_type?: string;
    is_active?: boolean;
    limit?: number;
  }
): Promise<MatchingRule[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_idg_matching_rules")
    .select("*")
    .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    .order("priority", { ascending: true });

  if (filters?.rule_type) {
    query = query.eq("rule_type", filters.rule_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: rules, error } = await query;

  if (error) {
throw new Error(`Failed to list matching rules: ${error.message}`);
}
  return (rules || []) as MatchingRule[];
}

export async function createMatchingRule(
  tenantId: string,
  data: {
    rule_name: string;
    rule_description?: string;
    rule_type?: string;
    source_channel?: IdentityChannel;
    target_channel?: IdentityChannel;
    match_fields?: unknown[];
    match_conditions?: Record<string, unknown>;
    base_confidence?: number;
    confidence_adjustments?: Record<string, unknown>;
    priority?: number;
  },
  userId?: string
): Promise<MatchingRule> {
  const supabase = await createClient();

  const { data: rule, error } = await supabase
    .from("synthex_idg_matching_rules")
    .insert({
      tenant_id: tenantId,
      rule_name: data.rule_name,
      rule_description: data.rule_description,
      rule_type: data.rule_type || "deterministic",
      source_channel: data.source_channel,
      target_channel: data.target_channel,
      match_fields: data.match_fields || [],
      match_conditions: data.match_conditions || {},
      base_confidence: data.base_confidence || 0.8,
      confidence_adjustments: data.confidence_adjustments || {},
      priority: data.priority || 100,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create matching rule: ${error.message}`);
}
  return rule as MatchingRule;
}

// =====================================================
// AI RESOLUTION FUNCTIONS
// =====================================================

export async function aiResolveIdentity(
  tenantId: string,
  inputData: {
    identifiers: Array<{
      channel: IdentityChannel;
      identifier: string;
      attributes?: Record<string, unknown>;
    }>;
    context?: Record<string, unknown>;
  }
): Promise<{
  matches: Array<{ node_id: string; confidence: number; reasoning: string }>;
  suggested_merges: Array<{ node_ids: string[]; confidence: number; reasoning: string }>;
  unified_profile_id?: string;
  ai_narrative: string;
}> {
  const startTime = Date.now();
  const supabase = await createClient();

  // Find existing nodes for each identifier
  const existingNodes: IdentityNode[] = [];
  for (const input of inputData.identifiers) {
    const node = await findNodeByIdentifier(tenantId, input.channel, input.identifier);
    if (node) {
      existingNodes.push(node);
    }
  }

  // Get all nodes for potential matching
  const allNodes = await listNodes(tenantId, { status: "active", limit: 100 });

  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Analyze these identity inputs and find matches:

Input Identifiers: ${JSON.stringify(inputData.identifiers, null, 2)}

Existing Nodes Found: ${JSON.stringify(existingNodes, null, 2)}

All Active Nodes: ${JSON.stringify(allNodes.slice(0, 50), null, 2)}

Context: ${JSON.stringify(inputData.context || {}, null, 2)}

Determine:
1. Which existing nodes match these inputs (with confidence scores)
2. Which nodes should be merged (same person across channels)
3. If a new unified profile should be created

Return JSON:
{
  "matches": [{"node_id": "uuid", "confidence": 0.95, "reasoning": "..."}],
  "suggested_merges": [{"node_ids": ["uuid1", "uuid2"], "confidence": 0.9, "reasoning": "..."}],
  "create_unified_profile": true/false,
  "ai_narrative": "Summary of identity resolution"
}`,
      },
    ],
    system:
      "You are an identity resolution expert. Analyze identifiers to find matches and merge opportunities based on shared attributes, patterns, and contextual signals.",
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.type === "text" ? textContent.text : "";

  const result = {
    matches: [] as Array<{ node_id: string; confidence: number; reasoning: string }>,
    suggested_merges: [] as Array<{ node_ids: string[]; confidence: number; reasoning: string }>,
    unified_profile_id: undefined as string | undefined,
    ai_narrative: "Could not analyze identities",
  };

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result.matches = parsed.matches || [];
      result.suggested_merges = parsed.suggested_merges || [];
      result.ai_narrative = parsed.ai_narrative || "Analysis complete";

      // Create unified profile if suggested
      if (parsed.create_unified_profile && existingNodes.length > 0) {
        const primaryEmail = existingNodes.find((n) => n.id_channel === "email")?.channel_identifier;
        const primaryPhone = existingNodes.find((n) => n.id_channel === "phone")?.channel_identifier;

        const { data: profile } = await supabase
          .from("synthex_idg_unified_profiles")
          .insert({
            tenant_id: tenantId,
            primary_email: primaryEmail,
            primary_phone: primaryPhone,
            node_ids: existingNodes.map((n) => n.id),
            channels: existingNodes.map((n) => n.id_channel),
            merged_attributes: inputData.context || {},
          })
          .select()
          .single();

        if (profile) {
          result.unified_profile_id = profile.id;
        }
      }
    }
  } catch {
    // Use default result
  }

  // Log the resolution
  await logResolution(tenantId, {
    input_payload: inputData as Record<string, unknown>,
    input_channels: inputData.identifiers.map((i) => i.channel),
    resolution_result: result,
    matched_nodes: result.matches.map((m) => m.node_id),
    merged_profiles: result.unified_profile_id ? [result.unified_profile_id] : [],
    resolution_method: "ai_powered",
    match_count: result.matches.length,
    ai_reasoning: { narrative: result.ai_narrative },
    ai_confidence: result.matches.length > 0 ? result.matches[0].confidence : 0,
    processing_time_ms: Date.now() - startTime,
    tokens_used: response.usage?.input_tokens + response.usage?.output_tokens || 0,
  });

  return result;
}

export async function suggestMerges(
  tenantId: string
): Promise<Array<{ node_ids: string[]; confidence: number; reasoning: string }>> {
  // Find potential duplicates
  const nodes = await listNodes(tenantId, { status: "active", limit: 200 });

  // Group by potential matches (same email domain, similar names, etc.)
  const emailNodes = nodes.filter((n) => n.id_channel === "email");
  const suggestions: Array<{ node_ids: string[]; confidence: number; reasoning: string }> = [];

  // Simple heuristic: same email prefix across different domains
  const emailPrefixes = new Map<string, IdentityNode[]>();
  for (const node of emailNodes) {
    const prefix = node.channel_identifier.split("@")[0].toLowerCase();
    if (!emailPrefixes.has(prefix)) {
      emailPrefixes.set(prefix, []);
    }
    emailPrefixes.get(prefix)!.push(node);
  }

  for (const [prefix, matchingNodes] of emailPrefixes) {
    if (matchingNodes.length > 1) {
      suggestions.push({
        node_ids: matchingNodes.map((n) => n.id),
        confidence: 0.7,
        reasoning: `Same email prefix "${prefix}" across ${matchingNodes.length} addresses`,
      });
    }
  }

  return suggestions;
}

// =====================================================
// STATS FUNCTIONS
// =====================================================

export async function getGraphStats(tenantId: string): Promise<IdentityGraphStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("synthex_idg_get_stats", {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to get graph stats: ${error.message}`);
}
  return data as IdentityGraphStats;
}
