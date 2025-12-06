/**
 * Synthex Knowledge Graph Service
 * Phase B29: Multi-Tenant Knowledge Graph Engine
 *
 * Provides semantic knowledge graph operations for connecting
 * SEO data, content, campaigns, audiences, and brand signals.
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Lazy Anthropic client initialization
let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }
  return anthropicClient;
}

// Types
export type NodeType =
  | 'keyword'
  | 'topic'
  | 'content'
  | 'campaign'
  | 'audience'
  | 'brand'
  | 'competitor'
  | 'url'
  | 'entity'
  | 'concept';

export type RelationType =
  | 'related_to'
  | 'parent_of'
  | 'child_of'
  | 'targets'
  | 'mentions'
  | 'competes_with'
  | 'similar_to'
  | 'links_to'
  | 'derived_from'
  | 'contains'
  | 'part_of'
  | 'influences'
  | 'co_occurs_with';

export interface KGNode {
  node_id: string;
  tenant_id: string;
  node_type: NodeType;
  label: string;
  properties: Record<string, unknown>;
  importance_score: number;
  source_type?: string;
  source_id?: string;
  created_at: string;
  updated_at: string;
}

export interface KGEdge {
  edge_id: string;
  tenant_id: string;
  source_node_id: string;
  target_node_id: string;
  relation: RelationType;
  weight: number;
  metadata: Record<string, unknown>;
  confidence: number;
  created_at: string;
}

export interface KGCluster {
  cluster_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  cluster_type: string;
  node_count: number;
  avg_importance: number;
  coherence_score: number;
  created_at: string;
}

export interface CreateNodeInput {
  tenant_id: string;
  node_type: NodeType;
  label: string;
  properties?: Record<string, unknown>;
  importance_score?: number;
  source_type?: string;
  source_id?: string;
}

export interface CreateEdgeInput {
  tenant_id: string;
  source_node_id: string;
  target_node_id: string;
  relation: RelationType;
  weight?: number;
  metadata?: Record<string, unknown>;
  confidence?: number;
}

export interface SearchResult {
  node: KGNode;
  similarity: number;
}

export interface TopicMapResult {
  clusters: Array<{
    name: string;
    nodes: string[];
    importance: number;
  }>;
  connections: Array<{
    from: string;
    to: string;
    strength: number;
  }>;
}

// Get Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

/**
 * Create a new knowledge graph node
 */
export async function createNode(input: CreateNodeInput): Promise<KGNode> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_kg_nodes')
    .insert({
      tenant_id: input.tenant_id,
      node_type: input.node_type,
      label: input.label,
      properties: input.properties || {},
      importance_score: input.importance_score || 0.5,
      source_type: input.source_type,
      source_id: input.source_id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating KG node:', error);
    throw new Error(`Failed to create node: ${error.message}`);
  }

  return data;
}

/**
 * Create a new knowledge graph edge
 */
export async function createEdge(input: CreateEdgeInput): Promise<KGEdge> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_kg_edges')
    .insert({
      tenant_id: input.tenant_id,
      source_node_id: input.source_node_id,
      target_node_id: input.target_node_id,
      relation: input.relation,
      weight: input.weight || 0.5,
      metadata: input.metadata || {},
      confidence: input.confidence || 1.0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating KG edge:', error);
    throw new Error(`Failed to create edge: ${error.message}`);
  }

  return data;
}

/**
 * Get a node by ID
 */
export async function getNode(tenantId: string, nodeId: string): Promise<KGNode | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_kg_nodes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('node_id', nodeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching node:', error);
    throw new Error(`Failed to get node: ${error.message}`);
  }

  return data;
}

/**
 * Get nodes by type
 */
export async function getNodesByType(
  tenantId: string,
  nodeType: NodeType,
  limit = 100
): Promise<KGNode[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_kg_nodes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('node_type', nodeType)
    .order('importance_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching nodes by type:', error);
    throw new Error(`Failed to get nodes: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all nodes for a tenant
 */
export async function getAllNodes(tenantId: string, limit = 500): Promise<KGNode[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_kg_nodes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('importance_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching all nodes:', error);
    throw new Error(`Failed to get nodes: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all edges for a tenant
 */
export async function getAllEdges(tenantId: string, limit = 1000): Promise<KGEdge[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_kg_edges')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('weight', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching all edges:', error);
    throw new Error(`Failed to get edges: ${error.message}`);
  }

  return data || [];
}

/**
 * Get neighbors of a node using the database function
 */
export async function getNeighbors(
  tenantId: string,
  nodeId: string,
  depth = 1
): Promise<Array<{ node_id: string; label: string; node_type: string; relation: string; distance: number }>> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc('get_kg_neighbors', {
    p_tenant_id: tenantId,
    p_node_id: nodeId,
    p_depth: depth,
  });

  if (error) {
    console.error('Error getting neighbors:', error);
    throw new Error(`Failed to get neighbors: ${error.message}`);
  }

  return data || [];
}

/**
 * Search nodes by embedding similarity (semantic search)
 */
export async function searchByEmbedding(
  tenantId: string,
  queryEmbedding: number[],
  limit = 10
): Promise<SearchResult[]> {
  const supabase = getSupabaseAdmin();

  // Use pgvector similarity search
  const { data, error } = await supabase.rpc('match_kg_embeddings', {
    p_tenant_id: tenantId,
    p_query_embedding: queryEmbedding,
    p_match_count: limit,
  });

  if (error) {
    // Function might not exist yet, fall back to basic search
    console.error('Embedding search not available:', error);
    return [];
  }

  return data || [];
}

/**
 * Connect two entities with appropriate relation
 */
export async function connectEntities(
  tenantId: string,
  sourceId: string,
  targetId: string,
  relation: RelationType,
  weight = 0.5
): Promise<KGEdge> {
  return createEdge({
    tenant_id: tenantId,
    source_node_id: sourceId,
    target_node_id: targetId,
    relation,
    weight,
    confidence: 1.0,
  });
}

/**
 * AI-powered: Auto-link content to relevant keywords
 */
export async function autoLinkContentToKeywords(
  tenantId: string,
  contentNodeId: string,
  contentText: string
): Promise<KGEdge[]> {
  const anthropic = getAnthropicClient();

  // Get existing keyword nodes
  const keywords = await getNodesByType(tenantId, 'keyword', 50);
  const keywordLabels = keywords.map((k) => k.label);

  if (keywordLabels.length === 0) {
    return [];
  }

  // Use Claude to identify relevant keywords
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Given the following content and list of keywords, identify which keywords are most relevant to the content. Return a JSON array of objects with "keyword" and "relevance" (0-1) fields.

Content:
${contentText.substring(0, 2000)}

Keywords:
${keywordLabels.join(', ')}

Return ONLY valid JSON, no explanation.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    return [];
  }

  try {
    const matches = JSON.parse(textContent.text) as Array<{ keyword: string; relevance: number }>;
    const edges: KGEdge[] = [];

    for (const match of matches) {
      if (match.relevance >= 0.5) {
        const keywordNode = keywords.find((k) => k.label.toLowerCase() === match.keyword.toLowerCase());
        if (keywordNode) {
          const edge = await createEdge({
            tenant_id: tenantId,
            source_node_id: contentNodeId,
            target_node_id: keywordNode.node_id,
            relation: 'targets',
            weight: match.relevance,
            confidence: 0.85,
          });
          edges.push(edge);
        }
      }
    }

    return edges;
  } catch {
    console.error('Failed to parse AI response for keyword linking');
    return [];
  }
}

/**
 * AI-powered: Suggest topic clusters from existing nodes
 */
export async function suggestClusters(tenantId: string): Promise<
  Array<{
    name: string;
    description: string;
    suggestedNodes: string[];
  }>
> {
  const anthropic = getAnthropicClient();

  // Get all nodes for analysis
  const nodes = await getAllNodes(tenantId, 200);

  if (nodes.length < 5) {
    return [];
  }

  const nodeList = nodes.map((n) => `- ${n.label} (${n.node_type})`).join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Analyze these knowledge graph nodes and suggest 3-5 topic clusters that group related nodes together.

Nodes:
${nodeList}

Return a JSON array with objects containing:
- "name": cluster name
- "description": brief description
- "nodes": array of node labels that belong to this cluster

Return ONLY valid JSON, no explanation.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    return [];
  }

  try {
    const clusters = JSON.parse(textContent.text);
    return clusters.map((c: { name: string; description: string; nodes: string[] }) => ({
      name: c.name,
      description: c.description,
      suggestedNodes: c.nodes,
    }));
  } catch {
    console.error('Failed to parse AI cluster suggestions');
    return [];
  }
}

/**
 * AI-powered: Generate a topic map visualization structure
 */
export async function generateTopicMap(tenantId: string): Promise<TopicMapResult> {
  const anthropic = getAnthropicClient();

  const nodes = await getAllNodes(tenantId, 100);
  const edges = await getAllEdges(tenantId, 200);

  if (nodes.length === 0) {
    return { clusters: [], connections: [] };
  }

  const nodeData = nodes.map((n) => ({
    id: n.node_id,
    label: n.label,
    type: n.node_type,
    importance: n.importance_score,
  }));

  const edgeData = edges.map((e) => ({
    source: e.source_node_id,
    target: e.target_node_id,
    relation: e.relation,
    weight: e.weight,
  }));

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Create a topic map structure for visualization from this knowledge graph data.

Nodes:
${JSON.stringify(nodeData, null, 2)}

Edges:
${JSON.stringify(edgeData, null, 2)}

Return a JSON object with:
- "clusters": array of {name, nodes: [node labels], importance: 0-1}
- "connections": array of {from: cluster name, to: cluster name, strength: 0-1}

Return ONLY valid JSON.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    return { clusters: [], connections: [] };
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    console.error('Failed to parse topic map');
    return { clusters: [], connections: [] };
  }
}

/**
 * Import SEO report data into the knowledge graph
 */
export async function importSEOReportToGraph(
  tenantId: string,
  reportId: string,
  keywords: Array<{ keyword: string; volume: number; position?: number }>
): Promise<{ nodesCreated: number; edgesCreated: number }> {
  let nodesCreated = 0;
  let edgesCreated = 0;
  const createdNodes: KGNode[] = [];

  // Create keyword nodes
  for (const kw of keywords) {
    try {
      const node = await createNode({
        tenant_id: tenantId,
        node_type: 'keyword',
        label: kw.keyword,
        properties: {
          search_volume: kw.volume,
          ranking_position: kw.position,
        },
        importance_score: Math.min(kw.volume / 10000, 1),
        source_type: 'seo_report',
        source_id: reportId,
      });
      createdNodes.push(node);
      nodesCreated++;
    } catch {
      // Node might already exist, skip
    }
  }

  // Create edges between related keywords (simple co-occurrence for now)
  for (let i = 0; i < createdNodes.length; i++) {
    for (let j = i + 1; j < createdNodes.length; j++) {
      // Check if keywords share common words
      const words1 = new Set(createdNodes[i].label.toLowerCase().split(' '));
      const words2 = new Set(createdNodes[j].label.toLowerCase().split(' '));
      const overlap = [...words1].filter((w) => words2.has(w)).length;

      if (overlap > 0) {
        try {
          await createEdge({
            tenant_id: tenantId,
            source_node_id: createdNodes[i].node_id,
            target_node_id: createdNodes[j].node_id,
            relation: 'related_to',
            weight: Math.min(overlap * 0.3, 1),
            confidence: 0.7,
          });
          edgesCreated++;
        } catch {
          // Edge might already exist
        }
      }
    }
  }

  return { nodesCreated, edgesCreated };
}

/**
 * Import audience segments into the knowledge graph
 */
export async function importAudienceToGraph(
  tenantId: string,
  audiences: Array<{ id: string; name: string; size: number; interests: string[] }>
): Promise<{ nodesCreated: number; edgesCreated: number }> {
  let nodesCreated = 0;
  let edgesCreated = 0;

  for (const audience of audiences) {
    // Create audience node
    const audienceNode = await createNode({
      tenant_id: tenantId,
      node_type: 'audience',
      label: audience.name,
      properties: {
        size: audience.size,
        interests: audience.interests,
      },
      importance_score: Math.min(audience.size / 10000, 1),
      source_type: 'audience_import',
      source_id: audience.id,
    });
    nodesCreated++;

    // Create topic nodes for interests and link them
    for (const interest of audience.interests) {
      try {
        const topicNode = await createNode({
          tenant_id: tenantId,
          node_type: 'topic',
          label: interest,
          properties: {},
          importance_score: 0.5,
        });
        nodesCreated++;

        await createEdge({
          tenant_id: tenantId,
          source_node_id: audienceNode.node_id,
          target_node_id: topicNode.node_id,
          relation: 'targets',
          weight: 0.7,
        });
        edgesCreated++;
      } catch {
        // Topic might already exist
      }
    }
  }

  return { nodesCreated, edgesCreated };
}

/**
 * Get graph statistics for a tenant
 */
export async function getGraphStats(tenantId: string): Promise<{
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  avgImportance: number;
}> {
  const supabase = getSupabaseAdmin();

  const [nodesResult, edgesResult] = await Promise.all([
    supabase
      .from('synthex_kg_nodes')
      .select('node_type, importance_score')
      .eq('tenant_id', tenantId),
    supabase
      .from('synthex_kg_edges')
      .select('edge_id')
      .eq('tenant_id', tenantId),
  ]);

  const nodes = nodesResult.data || [];
  const edges = edgesResult.data || [];

  const nodesByType: Record<string, number> = {};
  let totalImportance = 0;

  for (const node of nodes) {
    nodesByType[node.node_type] = (nodesByType[node.node_type] || 0) + 1;
    totalImportance += node.importance_score || 0;
  }

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodesByType,
    avgImportance: nodes.length > 0 ? totalImportance / nodes.length : 0,
  };
}

/**
 * Delete a node and its edges
 */
export async function deleteNode(tenantId: string, nodeId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('synthex_kg_nodes')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('node_id', nodeId);

  if (error) {
    console.error('Error deleting node:', error);
    throw new Error(`Failed to delete node: ${error.message}`);
  }
}

/**
 * Update node properties
 */
export async function updateNode(
  tenantId: string,
  nodeId: string,
  updates: Partial<Pick<KGNode, 'label' | 'properties' | 'importance_score'>>
): Promise<KGNode> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('synthex_kg_nodes')
    .update(updates)
    .eq('tenant_id', tenantId)
    .eq('node_id', nodeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating node:', error);
    throw new Error(`Failed to update node: ${error.message}`);
  }

  return data;
}
