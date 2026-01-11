/**
 * Synthex Insight Memory Service
 *
 * Phase: D38 - Knowledge Graph + Insight Memory (KGIM)
 *
 * Insights, correlations, and long-term memory storage
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

export type InsightType =
  | "pattern"
  | "anomaly"
  | "trend"
  | "prediction"
  | "recommendation"
  | "correlation"
  | "opportunity"
  | "risk"
  | "custom";

export type InsightPriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "informational";

export interface Insight {
  id: string;
  tenant_id: string;
  insight_key: string;
  insight_title: string;
  insight_type: InsightType;
  summary: string;
  details: Record<string, unknown>;
  priority: InsightPriority;
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

export interface InsightCorrelation {
  id: string;
  tenant_id: string;
  insight_a_id: string;
  insight_b_id: string;
  correlation_type: string;
  correlation_strength: number;
  is_causal: boolean;
  cause_insight_id?: string;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface InsightMemory {
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

export interface RecalledMemory {
  memory_id: string;
  memory_key: string;
  content: string;
  summary?: string;
  importance: number;
  similarity: number;
}

// =====================================================
// INSIGHT FUNCTIONS
// =====================================================

export async function createInsight(
  tenantId: string,
  data: {
    insight_key: string;
    insight_title: string;
    insight_type?: InsightType;
    summary: string;
    details?: Record<string, unknown>;
    priority?: InsightPriority;
    impact_score?: number;
    confidence?: number;
    evidence?: unknown[];
    source_nodes?: string[];
    recommendations?: unknown[];
    expires_at?: string;
  }
): Promise<Insight> {
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
      expires_at: data.expires_at,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create insight: ${error.message}`);
}
  return insight as Insight;
}

export async function updateInsight(
  insightId: string,
  updates: Partial<Omit<Insight, "id" | "tenant_id" | "created_at">>
): Promise<Insight> {
  const supabase = await createClient();

  const { data: insight, error } = await supabase
    .from("synthex_kgim_insights")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", insightId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update insight: ${error.message}`);
}
  return insight as Insight;
}

export async function getInsight(insightId: string): Promise<Insight | null> {
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
  return insight as Insight;
}

export async function listInsights(
  tenantId: string,
  filters?: {
    insight_type?: InsightType;
    priority?: InsightPriority;
    is_acknowledged?: boolean;
    is_dismissed?: boolean;
    search?: string;
    limit?: number;
  }
): Promise<Insight[]> {
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
    query = query.or(
      `insight_title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`
    );
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: insights, error } = await query;

  if (error) {
throw new Error(`Failed to list insights: ${error.message}`);
}
  return (insights || []) as Insight[];
}

export async function acknowledgeInsight(
  insightId: string,
  userId: string
): Promise<Insight> {
  return updateInsight(insightId, {
    is_acknowledged: true,
    acknowledged_at: new Date().toISOString(),
    acknowledged_by: userId,
  });
}

export async function dismissInsight(
  insightId: string,
  userId: string,
  reason?: string
): Promise<Insight> {
  return updateInsight(insightId, {
    is_dismissed: true,
    dismissed_at: new Date().toISOString(),
    dismissed_by: userId,
    dismiss_reason: reason,
  });
}

export async function getActiveInsights(
  tenantId: string,
  limit: number = 10
): Promise<Insight[]> {
  return listInsights(tenantId, {
    is_acknowledged: false,
    is_dismissed: false,
    limit,
  });
}

// =====================================================
// CORRELATION FUNCTIONS
// =====================================================

export async function createCorrelation(
  tenantId: string,
  data: {
    insight_a_id: string;
    insight_b_id: string;
    correlation_type?: string;
    correlation_strength?: number;
    is_causal?: boolean;
    cause_insight_id?: string;
    properties?: Record<string, unknown>;
  }
): Promise<InsightCorrelation> {
  const supabase = await createClient();

  const { data: correlation, error } = await supabase
    .from("synthex_kgim_correlations")
    .insert({
      tenant_id: tenantId,
      insight_a_id: data.insight_a_id,
      insight_b_id: data.insight_b_id,
      correlation_type: data.correlation_type || "related",
      correlation_strength: data.correlation_strength ?? 0.5,
      is_causal: data.is_causal ?? false,
      cause_insight_id: data.cause_insight_id,
      properties: data.properties || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create correlation: ${error.message}`);
}
  return correlation as InsightCorrelation;
}

export async function listCorrelations(
  tenantId: string,
  insightId?: string
): Promise<InsightCorrelation[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_kgim_correlations")
    .select("*")
    .eq("tenant_id", tenantId);

  if (insightId) {
    query = query.or(`insight_a_id.eq.${insightId},insight_b_id.eq.${insightId}`);
  }

  const { data: correlations, error } = await query;

  if (error) {
throw new Error(`Failed to list correlations: ${error.message}`);
}
  return (correlations || []) as InsightCorrelation[];
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
    embedding?: number[];
    expires_at?: string;
  }
): Promise<InsightMemory> {
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
      embedding: data.embedding,
      expires_at: data.expires_at,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to store memory: ${error.message}`);
}
  return memory as InsightMemory;
}

export async function getMemory(memoryId: string): Promise<InsightMemory | null> {
  const supabase = await createClient();

  const { data: memory, error } = await supabase
    .from("synthex_kgim_memory")
    .select("*")
    .eq("id", memoryId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get memory: ${error.message}`);
  }
  return memory as InsightMemory;
}

export async function listMemories(
  tenantId: string,
  filters?: {
    memory_type?: string;
    min_importance?: number;
    limit?: number;
  }
): Promise<InsightMemory[]> {
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
  return (memories || []) as InsightMemory[];
}

export async function recallMemories(
  tenantId: string,
  embedding: number[],
  limit: number = 5
): Promise<RecalledMemory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("synthex_kgim_recall_memories", {
    p_tenant_id: tenantId,
    p_embedding: embedding,
    p_limit: limit,
  });

  if (error) {
throw new Error(`Failed to recall memories: ${error.message}`);
}
  return (data || []) as RecalledMemory[];
}

export async function updateMemoryImportance(
  memoryId: string,
  importance: number
): Promise<InsightMemory> {
  const supabase = await createClient();

  const { data: memory, error } = await supabase
    .from("synthex_kgim_memory")
    .update({ importance })
    .eq("id", memoryId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update memory: ${error.message}`);
}
  return memory as InsightMemory;
}

// =====================================================
// AI FUNCTIONS
// =====================================================

export async function aiGenerateInsight(
  tenantId: string,
  context: {
    data_points?: Array<{ metric: string; value: number; trend?: string }>;
    patterns?: string[];
    recent_events?: string[];
    business_context?: string;
  }
): Promise<{
  insight_title: string;
  insight_type: InsightType;
  summary: string;
  priority: InsightPriority;
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

Generate an insight with:
- insight_title: short actionable title
- insight_type: one of (pattern, anomaly, trend, prediction, recommendation, correlation, opportunity, risk)
- summary: 2-3 sentence explanation
- priority: one of (critical, high, medium, low, informational)
- impact_score: 0-1 (business impact)
- confidence: 0-1 (how confident)
- recommendations: list of 2-4 actions

Return JSON:
{
  "insight_title": "...",
  "insight_type": "...",
  "summary": "...",
  "priority": "...",
  "impact_score": 0.7,
  "confidence": 0.8,
  "recommendations": ["...", "..."]
}`,
      },
    ],
    system:
      "You are a business intelligence analyst. Generate actionable insights from data patterns and trends.",
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
    summary: "Insufficient data to generate a meaningful insight.",
    priority: "low",
    impact_score: 0,
    confidence: 0,
    recommendations: [],
  };
}

export async function aiCorrelateInsights(
  insights: Array<{
    id: string;
    title: string;
    summary: string;
    type: string;
  }>
): Promise<
  Array<{
    insight_a_id: string;
    insight_b_id: string;
    correlation_type: string;
    strength: number;
    reason: string;
  }>
> {
  if (insights.length < 2) {
return [];
}

  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Analyze these insights and identify correlations:

${JSON.stringify(insights, null, 2)}

For each correlation found, provide:
- insight_a_id: ID of first insight
- insight_b_id: ID of second insight
- correlation_type: "causal", "related", "contradictory", "reinforcing"
- strength: 0-1 correlation strength
- reason: why these are correlated

Return JSON array:
[{"insight_a_id": "...", "insight_b_id": "...", "correlation_type": "...", "strength": 0.8, "reason": "..."}]`,
      },
    ],
    system:
      "You are an analyst expert at identifying relationships between business insights.",
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

export async function aiSummarizeForMemory(
  content: string,
  maxLength: number = 200
): Promise<string> {
  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Summarize the following content for long-term memory storage. Focus on key facts, decisions, and actionable information. Maximum ${maxLength} characters.

Content:
${content}`,
      },
    ],
    system:
      "You are a memory compression expert. Create concise, information-dense summaries.",
  });

  const textContent = response.content.find((c) => c.type === "text");
  return textContent?.type === "text"
    ? textContent.text.substring(0, maxLength)
    : content.substring(0, maxLength);
}
