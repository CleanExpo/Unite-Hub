/**
 * Synthex Opportunity Graph Service
 *
 * Phase: D30 - Unified Opportunity Graph Engine
 *
 * Graph-based opportunity tracking with nodes, edges,
 * paths, clusters, and AI-powered analysis
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// LAZY ANTHROPIC CLIENT
// =====================================================

let anthropicClient: Anthropic | null = null;
let clientCreatedAt: number = 0;
const CLIENT_TTL_MS = 60_000; // 60-second circuit breaker

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

export type NodeType =
  | "contact"
  | "company"
  | "deal"
  | "campaign"
  | "content"
  | "event"
  | "channel"
  | "product"
  | "segment"
  | "milestone"
  | "custom";

export type EdgeType =
  | "influences"
  | "leads_to"
  | "blocks"
  | "requires"
  | "supports"
  | "competes_with"
  | "belongs_to"
  | "triggers"
  | "converts_from"
  | "converts_to"
  | "interacts_with"
  | "custom";

export type NodeStatus =
  | "active"
  | "inactive"
  | "converted"
  | "lost"
  | "pending"
  | "archived";

export type ClusterType =
  | "conversion_path"
  | "influence_network"
  | "risk_group"
  | "opportunity_zone"
  | "competitive_arena"
  | "growth_segment"
  | "custom";

export type AnalysisType =
  | "path_optimization"
  | "bottleneck_detection"
  | "influence_scoring"
  | "conversion_prediction"
  | "risk_assessment"
  | "opportunity_ranking"
  | "cluster_analysis"
  | "network_health";

export interface OpportunityNode {
  id: string;
  tenant_id: string;
  node_type: NodeType;
  node_name: string;
  node_label?: string;
  external_id?: string;
  external_type?: string;
  status: NodeStatus;
  opportunity_score: number;
  influence_score: number;
  conversion_probability: number;
  risk_score: number;
  potential_value: number;
  realized_value: number;
  lifetime_value: number;
  in_degree: number;
  out_degree: number;
  betweenness_centrality: number;
  pagerank: number;
  clustering_coefficient: number;
  position_x?: number;
  position_y?: number;
  position_z?: number;
  properties: Record<string, unknown>;
  tags: string[];
  first_seen_at: string;
  last_activity_at: string;
  converted_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface OpportunityEdge {
  id: string;
  tenant_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: EdgeType;
  edge_label?: string;
  weight: number;
  strength: number;
  confidence: number;
  is_bidirectional: boolean;
  flow_volume: number;
  conversion_rate: number;
  avg_time_to_traverse?: string;
  frequency: number;
  properties: Record<string, unknown>;
  is_active: boolean;
  last_activated_at: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityPath {
  id: string;
  tenant_id: string;
  path_name: string;
  path_description?: string;
  start_node_id: string;
  end_node_id: string;
  node_sequence: string[];
  edge_sequence: string[];
  path_length: number;
  total_weight: number;
  avg_weight: number;
  conversion_probability: number;
  avg_traversal_time?: string;
  min_traversal_time?: string;
  max_traversal_time?: string;
  total_traversals: number;
  successful_traversals: number;
  abandoned_traversals: number;
  avg_value_generated: number;
  total_value_generated: number;
  is_optimal: boolean;
  optimization_score: number;
  bottleneck_node_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_analyzed_at?: string;
}

export interface OpportunityCluster {
  id: string;
  tenant_id: string;
  cluster_type: ClusterType;
  cluster_name: string;
  cluster_description?: string;
  member_node_ids: string[];
  member_count: number;
  centroid_node_id?: string;
  cohesion_score: number;
  separation_score: number;
  silhouette_score: number;
  density: number;
  total_opportunity_score: number;
  avg_opportunity_score: number;
  total_potential_value: number;
  avg_conversion_probability: number;
  risk_level: string;
  risk_factors: unknown[];
  growth_rate: number;
  momentum_score: number;
  ai_summary?: string;
  ai_recommendations: unknown[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_analyzed_at?: string;
}

export interface OpportunityAnalysis {
  id: string;
  tenant_id: string;
  analysis_type: AnalysisType;
  analysis_name: string;
  target_node_ids: string[];
  target_cluster_ids: string[];
  target_path_ids: string[];
  overall_score: number;
  confidence: number;
  key_findings: unknown[];
  opportunities: unknown[];
  risks: unknown[];
  bottlenecks: unknown[];
  recommendations: unknown[];
  action_items: unknown[];
  priority_ranking: unknown[];
  predictions: Record<string, unknown>;
  forecast_horizon?: string;
  ai_model?: string;
  ai_prompt_tokens: number;
  ai_completion_tokens: number;
  ai_reasoning?: string;
  status: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  created_by?: string;
}

export interface GraphStats {
  total_nodes: number;
  total_edges: number;
  total_paths: number;
  total_clusters: number;
  total_analyses: number;
  avg_degree: number;
  graph_density: number;
  total_potential_value: number;
  avg_opportunity_score: number;
}

// =====================================================
// NODE FUNCTIONS
// =====================================================

export async function createNode(
  tenantId: string,
  data: {
    node_type: NodeType;
    node_name: string;
    node_label?: string;
    external_id?: string;
    external_type?: string;
    status?: NodeStatus;
    opportunity_score?: number;
    influence_score?: number;
    potential_value?: number;
    properties?: Record<string, unknown>;
    tags?: string[];
  },
  userId?: string
): Promise<OpportunityNode> {
  const supabase = await createClient();

  const { data: node, error } = await supabase
    .from("synthex_library_opportunity_nodes")
    .insert({
      tenant_id: tenantId,
      node_type: data.node_type,
      node_name: data.node_name,
      node_label: data.node_label,
      external_id: data.external_id,
      external_type: data.external_type,
      status: data.status || "active",
      opportunity_score: data.opportunity_score || 0,
      influence_score: data.influence_score || 0,
      potential_value: data.potential_value || 0,
      properties: data.properties || {},
      tags: data.tags || [],
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create node: ${error.message}`);
}
  return node as OpportunityNode;
}

export async function updateNode(
  nodeId: string,
  updates: Partial<Omit<OpportunityNode, "id" | "tenant_id" | "created_at">>
): Promise<OpportunityNode> {
  const supabase = await createClient();

  const { data: node, error } = await supabase
    .from("synthex_library_opportunity_nodes")
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
  return node as OpportunityNode;
}

export async function getNode(nodeId: string): Promise<OpportunityNode | null> {
  const supabase = await createClient();

  const { data: node, error } = await supabase
    .from("synthex_library_opportunity_nodes")
    .select("*")
    .eq("id", nodeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get node: ${error.message}`);
  }
  return node as OpportunityNode;
}

export async function listNodes(
  tenantId: string,
  filters?: {
    node_type?: NodeType;
    status?: NodeStatus;
    min_opportunity_score?: number;
    min_influence_score?: number;
    tags?: string[];
    limit?: number;
    offset?: number;
  }
): Promise<OpportunityNode[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_opportunity_nodes")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("opportunity_score", { ascending: false });

  if (filters?.node_type) {
    query = query.eq("node_type", filters.node_type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.min_opportunity_score !== undefined) {
    query = query.gte("opportunity_score", filters.min_opportunity_score);
  }
  if (filters?.min_influence_score !== undefined) {
    query = query.gte("influence_score", filters.min_influence_score);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 50) - 1
    );
  }

  const { data: nodes, error } = await query;

  if (error) {
throw new Error(`Failed to list nodes: ${error.message}`);
}
  return (nodes || []) as OpportunityNode[];
}

export async function deleteNode(nodeId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_opportunity_nodes")
    .delete()
    .eq("id", nodeId);

  if (error) {
throw new Error(`Failed to delete node: ${error.message}`);
}
  return true;
}

// =====================================================
// EDGE FUNCTIONS
// =====================================================

export async function createEdge(
  tenantId: string,
  data: {
    source_node_id: string;
    target_node_id: string;
    edge_type: EdgeType;
    edge_label?: string;
    weight?: number;
    strength?: number;
    confidence?: number;
    is_bidirectional?: boolean;
    properties?: Record<string, unknown>;
  }
): Promise<OpportunityEdge> {
  const supabase = await createClient();

  const { data: edge, error } = await supabase
    .from("synthex_library_opportunity_edges")
    .insert({
      tenant_id: tenantId,
      source_node_id: data.source_node_id,
      target_node_id: data.target_node_id,
      edge_type: data.edge_type,
      edge_label: data.edge_label,
      weight: data.weight || 1.0,
      strength: data.strength || 1.0,
      confidence: data.confidence || 1.0,
      is_bidirectional: data.is_bidirectional || false,
      properties: data.properties || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create edge: ${error.message}`);
}
  return edge as OpportunityEdge;
}

export async function updateEdge(
  edgeId: string,
  updates: Partial<Omit<OpportunityEdge, "id" | "tenant_id" | "created_at">>
): Promise<OpportunityEdge> {
  const supabase = await createClient();

  const { data: edge, error } = await supabase
    .from("synthex_library_opportunity_edges")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", edgeId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update edge: ${error.message}`);
}
  return edge as OpportunityEdge;
}

export async function listEdges(
  tenantId: string,
  filters?: {
    source_node_id?: string;
    target_node_id?: string;
    edge_type?: EdgeType;
    is_active?: boolean;
    min_weight?: number;
    limit?: number;
  }
): Promise<OpportunityEdge[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_opportunity_edges")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("weight", { ascending: false });

  if (filters?.source_node_id) {
    query = query.eq("source_node_id", filters.source_node_id);
  }
  if (filters?.target_node_id) {
    query = query.eq("target_node_id", filters.target_node_id);
  }
  if (filters?.edge_type) {
    query = query.eq("edge_type", filters.edge_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.min_weight !== undefined) {
    query = query.gte("weight", filters.min_weight);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: edges, error } = await query;

  if (error) {
throw new Error(`Failed to list edges: ${error.message}`);
}
  return (edges || []) as OpportunityEdge[];
}

export async function deleteEdge(edgeId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_opportunity_edges")
    .delete()
    .eq("id", edgeId);

  if (error) {
throw new Error(`Failed to delete edge: ${error.message}`);
}
  return true;
}

export async function getNodeConnections(
  tenantId: string,
  nodeId: string
): Promise<{ incoming: OpportunityEdge[]; outgoing: OpportunityEdge[] }> {
  const supabase = await createClient();

  const [incomingResult, outgoingResult] = await Promise.all([
    supabase
      .from("synthex_library_opportunity_edges")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("target_node_id", nodeId)
      .eq("is_active", true),
    supabase
      .from("synthex_library_opportunity_edges")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("source_node_id", nodeId)
      .eq("is_active", true),
  ]);

  if (incomingResult.error) {
throw new Error(`Failed to get incoming edges: ${incomingResult.error.message}`);
}
  if (outgoingResult.error) {
throw new Error(`Failed to get outgoing edges: ${outgoingResult.error.message}`);
}

  return {
    incoming: (incomingResult.data || []) as OpportunityEdge[],
    outgoing: (outgoingResult.data || []) as OpportunityEdge[],
  };
}

// =====================================================
// PATH FUNCTIONS
// =====================================================

export async function createPath(
  tenantId: string,
  data: {
    path_name: string;
    path_description?: string;
    start_node_id: string;
    end_node_id: string;
    node_sequence: string[];
    edge_sequence?: string[];
  }
): Promise<OpportunityPath> {
  const supabase = await createClient();

  const { data: path, error } = await supabase
    .from("synthex_library_opportunity_paths")
    .insert({
      tenant_id: tenantId,
      path_name: data.path_name,
      path_description: data.path_description,
      start_node_id: data.start_node_id,
      end_node_id: data.end_node_id,
      node_sequence: data.node_sequence,
      edge_sequence: data.edge_sequence || [],
      path_length: data.node_sequence.length - 1,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create path: ${error.message}`);
}
  return path as OpportunityPath;
}

export async function listPaths(
  tenantId: string,
  filters?: {
    start_node_id?: string;
    end_node_id?: string;
    is_optimal?: boolean;
    min_conversion_probability?: number;
    limit?: number;
  }
): Promise<OpportunityPath[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_opportunity_paths")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("conversion_probability", { ascending: false });

  if (filters?.start_node_id) {
    query = query.eq("start_node_id", filters.start_node_id);
  }
  if (filters?.end_node_id) {
    query = query.eq("end_node_id", filters.end_node_id);
  }
  if (filters?.is_optimal !== undefined) {
    query = query.eq("is_optimal", filters.is_optimal);
  }
  if (filters?.min_conversion_probability !== undefined) {
    query = query.gte("conversion_probability", filters.min_conversion_probability);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: paths, error } = await query;

  if (error) {
throw new Error(`Failed to list paths: ${error.message}`);
}
  return (paths || []) as OpportunityPath[];
}

export async function findShortestPath(
  tenantId: string,
  startNodeId: string,
  endNodeId: string,
  maxDepth: number = 10
): Promise<{ path_nodes: string[]; path_length: number; total_weight: number }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("find_opportunity_path", {
    p_tenant_id: tenantId,
    p_start_node_id: startNodeId,
    p_end_node_id: endNodeId,
    p_max_depth: maxDepth,
  });

  if (error) {
throw new Error(`Failed to find path: ${error.message}`);
}
  return data || [];
}

// =====================================================
// CLUSTER FUNCTIONS
// =====================================================

export async function createCluster(
  tenantId: string,
  data: {
    cluster_type: ClusterType;
    cluster_name: string;
    cluster_description?: string;
    member_node_ids?: string[];
    centroid_node_id?: string;
  }
): Promise<OpportunityCluster> {
  const supabase = await createClient();

  const { data: cluster, error } = await supabase
    .from("synthex_library_opportunity_clusters")
    .insert({
      tenant_id: tenantId,
      cluster_type: data.cluster_type,
      cluster_name: data.cluster_name,
      cluster_description: data.cluster_description,
      member_node_ids: data.member_node_ids || [],
      member_count: (data.member_node_ids || []).length,
      centroid_node_id: data.centroid_node_id,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create cluster: ${error.message}`);
}
  return cluster as OpportunityCluster;
}

export async function updateCluster(
  clusterId: string,
  updates: Partial<Omit<OpportunityCluster, "id" | "tenant_id" | "created_at">>
): Promise<OpportunityCluster> {
  const supabase = await createClient();

  const { data: cluster, error } = await supabase
    .from("synthex_library_opportunity_clusters")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clusterId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update cluster: ${error.message}`);
}
  return cluster as OpportunityCluster;
}

export async function listClusters(
  tenantId: string,
  filters?: {
    cluster_type?: ClusterType;
    is_active?: boolean;
    min_member_count?: number;
    limit?: number;
  }
): Promise<OpportunityCluster[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_opportunity_clusters")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("total_potential_value", { ascending: false });

  if (filters?.cluster_type) {
    query = query.eq("cluster_type", filters.cluster_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.min_member_count !== undefined) {
    query = query.gte("member_count", filters.min_member_count);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: clusters, error } = await query;

  if (error) {
throw new Error(`Failed to list clusters: ${error.message}`);
}
  return (clusters || []) as OpportunityCluster[];
}

export async function addNodeToCluster(
  tenantId: string,
  clusterId: string,
  nodeId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("add_node_to_cluster", {
    p_tenant_id: tenantId,
    p_cluster_id: clusterId,
    p_node_id: nodeId,
  });

  if (error) {
throw new Error(`Failed to add node to cluster: ${error.message}`);
}
  return data as boolean;
}

export async function removeNodeFromCluster(
  tenantId: string,
  clusterId: string,
  nodeId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("remove_node_from_cluster", {
    p_tenant_id: tenantId,
    p_cluster_id: clusterId,
    p_node_id: nodeId,
  });

  if (error) {
throw new Error(`Failed to remove node from cluster: ${error.message}`);
}
  return data as boolean;
}

export async function getClusterMembers(
  tenantId: string,
  clusterId: string
): Promise<OpportunityNode[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_cluster_members", {
    p_tenant_id: tenantId,
    p_cluster_id: clusterId,
  });

  if (error) {
throw new Error(`Failed to get cluster members: ${error.message}`);
}
  return (data || []) as OpportunityNode[];
}

// =====================================================
// ANALYSIS FUNCTIONS
// =====================================================

export async function runAnalysis(
  tenantId: string,
  data: {
    analysis_type: AnalysisType;
    analysis_name: string;
    target_node_ids?: string[];
    target_cluster_ids?: string[];
    target_path_ids?: string[];
    forecast_horizon?: string;
  },
  userId?: string
): Promise<OpportunityAnalysis> {
  const supabase = await createClient();

  // Get context data for AI analysis
  const contextData = await gatherAnalysisContext(tenantId, data);

  // Run AI analysis
  const aiResult = await performAIAnalysis(data.analysis_type, contextData);

  // Store analysis results
  const { data: analysis, error } = await supabase
    .from("synthex_library_opportunity_analysis")
    .insert({
      tenant_id: tenantId,
      analysis_type: data.analysis_type,
      analysis_name: data.analysis_name,
      target_node_ids: data.target_node_ids || [],
      target_cluster_ids: data.target_cluster_ids || [],
      target_path_ids: data.target_path_ids || [],
      overall_score: aiResult.overall_score,
      confidence: aiResult.confidence,
      key_findings: aiResult.key_findings,
      opportunities: aiResult.opportunities,
      risks: aiResult.risks,
      bottlenecks: aiResult.bottlenecks,
      recommendations: aiResult.recommendations,
      action_items: aiResult.action_items,
      priority_ranking: aiResult.priority_ranking,
      predictions: aiResult.predictions,
      forecast_horizon: data.forecast_horizon,
      ai_model: "claude-sonnet-4-5-20250514",
      ai_prompt_tokens: aiResult.prompt_tokens,
      ai_completion_tokens: aiResult.completion_tokens,
      ai_reasoning: aiResult.reasoning,
      status: "completed",
      completed_at: new Date().toISOString(),
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to store analysis: ${error.message}`);
}
  return analysis as OpportunityAnalysis;
}

async function gatherAnalysisContext(
  tenantId: string,
  data: {
    analysis_type: AnalysisType;
    target_node_ids?: string[];
    target_cluster_ids?: string[];
    target_path_ids?: string[];
  }
): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const context: Record<string, unknown> = {};

  // Get graph stats
  const { data: stats } = await supabase.rpc("get_opportunity_graph_stats", {
    p_tenant_id: tenantId,
  });
  context.graph_stats = stats;

  // Get target nodes if specified
  if (data.target_node_ids && data.target_node_ids.length > 0) {
    const { data: nodes } = await supabase
      .from("synthex_library_opportunity_nodes")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("id", data.target_node_ids);
    context.target_nodes = nodes;
  }

  // Get target clusters if specified
  if (data.target_cluster_ids && data.target_cluster_ids.length > 0) {
    const { data: clusters } = await supabase
      .from("synthex_library_opportunity_clusters")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("id", data.target_cluster_ids);
    context.target_clusters = clusters;
  }

  // Get target paths if specified
  if (data.target_path_ids && data.target_path_ids.length > 0) {
    const { data: paths } = await supabase
      .from("synthex_library_opportunity_paths")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("id", data.target_path_ids);
    context.target_paths = paths;
  }

  // Get top nodes by opportunity score
  const { data: topNodes } = await supabase
    .from("synthex_library_opportunity_nodes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("opportunity_score", { ascending: false })
    .limit(20);
  context.top_opportunity_nodes = topNodes;

  // Get high-influence nodes
  const { data: influentialNodes } = await supabase
    .from("synthex_library_opportunity_nodes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("influence_score", { ascending: false })
    .limit(20);
  context.high_influence_nodes = influentialNodes;

  return context;
}

async function performAIAnalysis(
  analysisType: AnalysisType,
  context: Record<string, unknown>
): Promise<{
  overall_score: number;
  confidence: number;
  key_findings: unknown[];
  opportunities: unknown[];
  risks: unknown[];
  bottlenecks: unknown[];
  recommendations: unknown[];
  action_items: unknown[];
  priority_ranking: unknown[];
  predictions: Record<string, unknown>;
  reasoning: string;
  prompt_tokens: number;
  completion_tokens: number;
}> {
  const anthropic = getAnthropicClient();

  const analysisPrompts: Record<AnalysisType, string> = {
    path_optimization:
      "Analyze the opportunity paths and identify optimization opportunities. Focus on reducing friction, improving conversion rates, and shortening path length.",
    bottleneck_detection:
      "Identify bottlenecks in the opportunity graph. Look for nodes with high in-degree but low conversion, edges with low flow, and paths with high abandonment.",
    influence_scoring:
      "Analyze node influence patterns. Identify key influencers, influence cascades, and opportunities to leverage influence for conversion.",
    conversion_prediction:
      "Predict conversion probabilities based on graph structure and node attributes. Identify factors that increase or decrease conversion likelihood.",
    risk_assessment:
      "Assess risks across the opportunity graph. Identify at-risk nodes, unstable clusters, and paths with declining performance.",
    opportunity_ranking:
      "Rank opportunities based on potential value, conversion probability, and strategic importance. Provide actionable prioritization.",
    cluster_analysis:
      "Analyze cluster cohesion, growth patterns, and inter-cluster relationships. Identify emerging clusters and cluster health issues.",
    network_health:
      "Evaluate overall network health including connectivity, balance, growth trends, and structural stability.",
  };

  const systemPrompt = `You are an AI analyst specializing in opportunity graph analysis for business intelligence.
Your task is to perform a ${analysisType.replace(/_/g, " ")} analysis.

${analysisPrompts[analysisType]}

Provide your analysis in a structured JSON format with the following fields:
- overall_score: A score from 0-100 indicating the health/quality related to this analysis
- confidence: Your confidence level from 0-1
- key_findings: Array of key findings (strings)
- opportunities: Array of opportunities identified (objects with title, description, impact, effort)
- risks: Array of risks identified (objects with title, description, severity, mitigation)
- bottlenecks: Array of bottlenecks if any (objects with node_id, description, impact)
- recommendations: Array of actionable recommendations (strings)
- action_items: Array of specific actions to take (objects with action, priority, expected_impact)
- priority_ranking: Ordered array of items by priority (objects with item_id, item_type, priority_score, reason)
- predictions: Object with predictions (keys are prediction types, values are prediction objects)
- reasoning: Your reasoning process (string)`;

  const userPrompt = `Analyze this opportunity graph data:

${JSON.stringify(context, null, 2)}

Provide your ${analysisType.replace(/_/g, " ")} analysis.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const textContent = response.content.find((c) => c.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      overall_score: parsed.overall_score || 50,
      confidence: parsed.confidence || 0.7,
      key_findings: parsed.key_findings || [],
      opportunities: parsed.opportunities || [],
      risks: parsed.risks || [],
      bottlenecks: parsed.bottlenecks || [],
      recommendations: parsed.recommendations || [],
      action_items: parsed.action_items || [],
      priority_ranking: parsed.priority_ranking || [],
      predictions: parsed.predictions || {},
      reasoning: parsed.reasoning || "",
      prompt_tokens: response.usage?.input_tokens || 0,
      completion_tokens: response.usage?.output_tokens || 0,
    };
  } catch (error) {
    console.error("[opportunityGraphService] AI analysis error:", error);
    return {
      overall_score: 0,
      confidence: 0,
      key_findings: ["Analysis failed"],
      opportunities: [],
      risks: [{ title: "Analysis Error", description: String(error), severity: "high", mitigation: "Retry analysis" }],
      bottlenecks: [],
      recommendations: ["Retry analysis with different parameters"],
      action_items: [],
      priority_ranking: [],
      predictions: {},
      reasoning: `Analysis failed: ${error}`,
      prompt_tokens: 0,
      completion_tokens: 0,
    };
  }
}

export async function listAnalyses(
  tenantId: string,
  filters?: {
    analysis_type?: AnalysisType;
    status?: string;
    min_score?: number;
    limit?: number;
  }
): Promise<OpportunityAnalysis[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_opportunity_analysis")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.analysis_type) {
    query = query.eq("analysis_type", filters.analysis_type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.min_score !== undefined) {
    query = query.gte("overall_score", filters.min_score);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: analyses, error } = await query;

  if (error) {
throw new Error(`Failed to list analyses: ${error.message}`);
}
  return (analyses || []) as OpportunityAnalysis[];
}

// =====================================================
// STATS FUNCTIONS
// =====================================================

export async function getGraphStats(tenantId: string): Promise<GraphStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_opportunity_graph_stats", {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to get graph stats: ${error.message}`);
}
  return data as GraphStats;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function calculateNodeMetrics(
  tenantId: string,
  nodeId: string
): Promise<Record<string, unknown>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("calculate_node_graph_metrics", {
    p_tenant_id: tenantId,
    p_node_id: nodeId,
  });

  if (error) {
throw new Error(`Failed to calculate metrics: ${error.message}`);
}
  return data as Record<string, unknown>;
}

export async function linkExternalEntity(
  tenantId: string,
  data: {
    external_type: "contact" | "deal" | "campaign" | "content";
    external_id: string;
    node_name: string;
    properties?: Record<string, unknown>;
  }
): Promise<OpportunityNode> {
  const supabase = await createClient();

  // Check if node already exists for this external entity
  const { data: existing } = await supabase
    .from("synthex_library_opportunity_nodes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("external_type", data.external_type)
    .eq("external_id", data.external_id)
    .single();

  if (existing) {
    return existing as OpportunityNode;
  }

  // Create new node
  const nodeType: NodeType =
    data.external_type === "contact"
      ? "contact"
      : data.external_type === "deal"
        ? "deal"
        : data.external_type === "campaign"
          ? "campaign"
          : "content";

  return createNode(tenantId, {
    node_type: nodeType,
    node_name: data.node_name,
    external_type: data.external_type,
    external_id: data.external_id,
    properties: data.properties,
  });
}

export async function bulkCreateEdges(
  tenantId: string,
  edges: Array<{
    source_node_id: string;
    target_node_id: string;
    edge_type: EdgeType;
    weight?: number;
  }>
): Promise<OpportunityEdge[]> {
  const supabase = await createClient();

  const edgeData = edges.map((e) => ({
    tenant_id: tenantId,
    source_node_id: e.source_node_id,
    target_node_id: e.target_node_id,
    edge_type: e.edge_type,
    weight: e.weight || 1.0,
  }));

  const { data: createdEdges, error } = await supabase
    .from("synthex_library_opportunity_edges")
    .insert(edgeData)
    .select();

  if (error) {
throw new Error(`Failed to bulk create edges: ${error.message}`);
}
  return (createdEdges || []) as OpportunityEdge[];
}
