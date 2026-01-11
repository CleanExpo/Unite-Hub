/**
 * Synthex KGIM (Knowledge Graph + Insight Memory) Service
 *
 * Phase: D38 - Knowledge Graph + Insight Memory (KGIM)
 *
 * Combined service for knowledge nodes, edges, insights, and memory
 * Uses synthex_kgim_* tables from migration 467
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

export type KGIMNodeType =
  | "concept"
  | "entity"
  | "topic"
  | "skill"
  | "pattern"
  | "segment"
  | "metric"
  | "event"
  | "custom";

export type KGIMEdgeType =
  | "relates_to"
  | "causes"
  | "influences"
  | "contains"
  | "precedes"
  | "correlates"
  | "contradicts"
  | "similar_to"
  | "derived_from"
  | "custom";

export type KGIMInsightType =
  | "pattern"
  | "anomaly"
  | "trend"
  | "prediction"
  | "recommendation"
  | "correlation"
  | "opportunity"
  | "risk"
  | "custom";

export type KGIMInsightPriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "informational";

export interface KGIMNode {
  id: string;
  tenant_id: string;
  node_key: string;
  node_name: string;
  node_type: KGIMNodeType;
  description?: string;
  content: Record<string, unknown>;
  embedding?: number[];
  source?: string;
  source_id?: string;
  confidence: number;
  properties: Record<string, unknown>;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface KGIMEdge {
  id: string;
  tenant_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: KGIMEdgeType;
  edge_label?: string;
  weight: number;
  confidence: number;
  is_bidirectional: boolean;
  properties: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KGIMInsight {
  id: string;
  tenant_id: string;
  insight_key: string;
  insight_title: string;
  insight_type: KGIMInsightType;
  summary: string;
  details: Record<string, unknown>;
  priority: KGIMInsightPriority;
  impact_score: number;
  confidence: number;
  evidence: unknown[];
  source_nodes: string[];
  recommendations: unknown[];
  is_acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  is_dismissed: boolean;
  dismissed_at?: string;
  dismissed_by?: string;
  dismiss_reason?: string;
  ai_analysis: Record<string, unknown>;
  discovered_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface KGIMMemory {
  id: string;
  tenant_id: string;
  memory_key: string;
  memory_type: string;
  insight_id?: string;
  content: string;
  summary?: string;
  importance: number;
  access_count: number;
  last_accessed_at?: string;
  embedding?: number[];
  created_at: string;
  expires_at?: string;
}

export interface KGIMStats {
  total_nodes: number;
  total_edges: number;
  total_insights: number;
  active_insights: number;
  total_memories: number;
  nodes_by_type: Record<string, number>;
  insights_by_priority: Record<string, number>;
}

// =====================================================
// NODE FUNCTIONS
// =====================================================

export async function createNode(
  tenantId: string,
  data: {
    node_key: string;
    node_name: string;
    node_type?: KGIMNodeType;
    description?: string;
    content?: Record<string, unknown>;
    source?: string;
    source_id?: string;
    confidence?: number;
    properties?: Record<string, unknown>;
    tags?: string[];
  }
): Promise<KGIMNode> {
  const supabase = await createClient();

  const { data: node, error } = await supabase
    .from("synthex_kgim_nodes")
    .insert({
      tenant_id: tenantId,
      node_key: data.node_key,
      node_name: data.node_name,
      node_type: data.node_type || "concept",
      description: data.description,
      content: data.content || {},
      source: data.source,
      source_id: data.source_id,
      confidence: data.confidence ?? 1.0,
      properties: data.properties || {},
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create node: ${error.message}`);
}
  return node as KGIMNode;
}

export async function getNode(nodeId: string): Promise<KGIMNode | null> {
  const supabase = await createClient();

  const { data: node, error } = await supabase
    .from("synthex_kgim_nodes")
    .select("*")
    .eq("id", nodeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get node: ${error.message}`);
  }
  return node as KGIMNode;
}

export async function listNodes(
  tenantId: string,
  filters?: {
    node_type?: KGIMNodeType;
    is_active?: boolean;
    search?: string;
    limit?: number;
  }
): Promise<KGIMNode[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_kgim_nodes")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.node_type) {
query = query.eq("node_type", filters.node_type);
}
  if (filters?.is_active !== undefined) {
query = query.eq("is_active", filters.is_active);
}
  if (filters?.search) {
    query = query.or(`node_name.ilike.%${filters.search}%,node_key.ilike.%${filters.search}%`);
  }
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data: nodes, error } = await query;
  if (error) {
throw new Error(`Failed to list nodes: ${error.message}`);
}
  return (nodes || []) as KGIMNode[];
}

// =====================================================
// EDGE FUNCTIONS
// =====================================================

export async function createEdge(
  tenantId: string,
  data: {
    source_node_id: string;
    target_node_id: string;
    edge_type?: KGIMEdgeType;
    edge_label?: string;
    weight?: number;
    confidence?: number;
    is_bidirectional?: boolean;
    properties?: Record<string, unknown>;
  }
): Promise<KGIMEdge> {
  const supabase = await createClient();

  const { data: edge, error } = await supabase
    .from("synthex_kgim_edges")
    .insert({
      tenant_id: tenantId,
      source_node_id: data.source_node_id,
      target_node_id: data.target_node_id,
      edge_type: data.edge_type || "relates_to",
      edge_label: data.edge_label,
      weight: data.weight ?? 1.0,
      confidence: data.confidence ?? 1.0,
      is_bidirectional: data.is_bidirectional ?? false,
      properties: data.properties || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create edge: ${error.message}`);
}
  return edge as KGIMEdge;
}

export async function listEdges(
  tenantId: string,
  filters?: {
    source_node_id?: string;
    target_node_id?: string;
    edge_type?: KGIMEdgeType;
    limit?: number;
  }
): Promise<KGIMEdge[]> {
  const supabase = await createClient();

  let query = supabase.from("synthex_kgim_edges").select("*").eq("tenant_id", tenantId);

  if (filters?.source_node_id) {
query = query.eq("source_node_id", filters.source_node_id);
}
  if (filters?.target_node_id) {
query = query.eq("target_node_id", filters.target_node_id);
}
  if (filters?.edge_type) {
query = query.eq("edge_type", filters.edge_type);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data: edges, error } = await query;
  if (error) {
throw new Error(`Failed to list edges: ${error.message}`);
}
  return (edges || []) as KGIMEdge[];
}

// =====================================================
// INSIGHT FUNCTIONS
// =====================================================

export async function createInsight(
  tenantId: string,
  data: {
    insight_key: string;
    insight_title: string;
    insight_type?: KGIMInsightType;
    summary: string;
    details?: Record<string, unknown>;
    priority?: KGIMInsightPriority;
    impact_score?: number;
    confidence?: number;
    evidence?: unknown[];
    source_nodes?: string[];
    recommendations?: unknown[];
  }
): Promise<KGIMInsight> {
  const supabase = await createClient();

  const { data: insight, error } = await supabase
    .from("synthex_kgim_insights")
    .insert({
      tenant_id: tenantId,
      insight_key: data.insight_key,
      insight_title: data.insight_title,
      insight_type: data.insight_type || "pattern",
      summary: data.summary,
      details: data.details || {},
      priority: data.priority || "medium",
      impact_score: data.impact_score ?? 0.5,
      confidence: data.confidence ?? 0.5,
      evidence: data.evidence || [],
      source_nodes: data.source_nodes || [],
      recommendations: data.recommendations || [],
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create insight: ${error.message}`);
}
  return insight as KGIMInsight;
}

export async function getInsight(insightId: string): Promise<KGIMInsight | null> {
  const supabase = await createClient();

  const { data: insight, error } = await supabase
    .from("synthex_kgim_insights")
    .select("*")
    .eq("id", insightId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get insight: ${error.message}`);
  }
  return insight as KGIMInsight;
}

export async function listInsights(
  tenantId: string,
  filters?: {
    insight_type?: KGIMInsightType;
    priority?: KGIMInsightPriority;
    is_acknowledged?: boolean;
    is_dismissed?: boolean;
    search?: string;
    limit?: number;
  }
): Promise<KGIMInsight[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_kgim_insights")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("discovered_at", { ascending: false });

  if (filters?.insight_type) {
query = query.eq("insight_type", filters.insight_type);
}
  if (filters?.priority) {
query = query.eq("priority", filters.priority);
}
  if (filters?.is_acknowledged !== undefined) {
query = query.eq("is_acknowledged", filters.is_acknowledged);
}
  if (filters?.is_dismissed !== undefined) {
query = query.eq("is_dismissed", filters.is_dismissed);
}
  if (filters?.search) {
query = query.or(`insight_title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data: insights, error } = await query;
  if (error) {
throw new Error(`Failed to list insights: ${error.message}`);
}
  return (insights || []) as KGIMInsight[];
}

export async function acknowledgeInsight(insightId: string, userId: string): Promise<KGIMInsight> {
  const supabase = await createClient();

  const { data: insight, error } = await supabase
    .from("synthex_kgim_insights")
    .update({
      is_acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", insightId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to acknowledge insight: ${error.message}`);
}
  return insight as KGIMInsight;
}

export async function dismissInsight(insightId: string, userId: string, reason?: string): Promise<KGIMInsight> {
  const supabase = await createClient();

  const { data: insight, error } = await supabase
    .from("synthex_kgim_insights")
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
      dismissed_by: userId,
      dismiss_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", insightId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to dismiss insight: ${error.message}`);
}
  return insight as KGIMInsight;
}

// =====================================================
// MEMORY FUNCTIONS
// =====================================================

export async function storeMemory(
  tenantId: string,
  data: {
    memory_key: string;
    memory_type?: string;
    insight_id?: string;
    content: string;
    summary?: string;
    importance?: number;
  }
): Promise<KGIMMemory> {
  const supabase = await createClient();

  const { data: memory, error } = await supabase
    .from("synthex_kgim_memory")
    .insert({
      tenant_id: tenantId,
      memory_key: data.memory_key,
      memory_type: data.memory_type || "insight",
      insight_id: data.insight_id,
      content: data.content,
      summary: data.summary,
      importance: data.importance ?? 0.5,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to store memory: ${error.message}`);
}
  return memory as KGIMMemory;
}

export async function listMemories(
  tenantId: string,
  filters?: {
    memory_type?: string;
    min_importance?: number;
    limit?: number;
  }
): Promise<KGIMMemory[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_kgim_memory")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("importance", { ascending: false });

  if (filters?.memory_type) {
query = query.eq("memory_type", filters.memory_type);
}
  if (filters?.min_importance !== undefined) {
query = query.gte("importance", filters.min_importance);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data: memories, error } = await query;
  if (error) {
throw new Error(`Failed to list memories: ${error.message}`);
}
  return (memories || []) as KGIMMemory[];
}

// =====================================================
// STATS & GRAPH FUNCTIONS
// =====================================================

export async function getStats(tenantId: string): Promise<KGIMStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("synthex_kgim_get_stats", {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to get stats: ${error.message}`);
}
  return data as KGIMStats;
}

export async function getConnectedNodes(
  tenantId: string,
  nodeId: string,
  maxDepth: number = 2
): Promise<Array<{
  node_id: string;
  node_key: string;
  node_name: string;
  node_type: KGIMNodeType;
  edge_type: KGIMEdgeType | null;
  depth: number;
  path: string[];
}>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("synthex_kgim_get_connected_nodes", {
    p_tenant_id: tenantId,
    p_node_id: nodeId,
    p_max_depth: maxDepth,
  });

  if (error) {
throw new Error(`Failed to get connected nodes: ${error.message}`);
}
  return data || [];
}

// =====================================================
// AI FUNCTIONS
// =====================================================

export async function aiGenerateInsight(
  context: {
    data_points?: Array<{ metric: string; value: number; trend?: string }>;
    patterns?: string[];
    recent_events?: string[];
    business_context?: string;
  }
): Promise<{
  insight_title: string;
  insight_type: KGIMInsightType;
  summary: string;
  priority: KGIMInsightPriority;
  impact_score: number;
  confidence: number;
  recommendations: string[];
}> {
  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Analyze the following data and generate a business insight:

Data Points: ${JSON.stringify(context.data_points || [])}
Patterns: ${JSON.stringify(context.patterns || [])}
Recent Events: ${JSON.stringify(context.recent_events || [])}
Business Context: ${context.business_context || "N/A"}

Return JSON:
{
  "insight_title": "...",
  "insight_type": "pattern|anomaly|trend|prediction|recommendation|correlation|opportunity|risk",
  "summary": "...",
  "priority": "critical|high|medium|low|informational",
  "impact_score": 0.7,
  "confidence": 0.8,
  "recommendations": ["...", "..."]
}`,
      },
    ],
    system: "You are a business intelligence analyst. Generate actionable insights from data.",
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.type === "text" ? textContent.text : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
return JSON.parse(jsonMatch[0]);
}
  } catch {
    // Parse error
  }

  return {
    insight_title: "Unable to generate insight",
    insight_type: "pattern",
    summary: "Insufficient data",
    priority: "low",
    impact_score: 0,
    confidence: 0,
    recommendations: [],
  };
}

export async function aiExtractConcepts(
  text: string
): Promise<Array<{ name: string; type: KGIMNodeType; description: string }>> {
  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Extract key concepts from text. Return JSON array:
[{"name": "...", "type": "concept|entity|topic|skill|pattern|segment|metric|event", "description": "..."}]

Text:
${text.substring(0, 3000)}`,
      },
    ],
    system: "Extract structured concepts for a knowledge graph.",
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.type === "text" ? textContent.text : "";

  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
return JSON.parse(jsonMatch[0]);
}
  } catch {
    // Parse error
  }

  return [];
}
