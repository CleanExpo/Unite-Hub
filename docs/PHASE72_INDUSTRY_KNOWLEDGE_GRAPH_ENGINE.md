# Phase 72 - Industry Knowledge Graph Engine (IKGE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase72-industry-knowledge-graph-engine`

## Executive Summary

Phase 72 creates a unified knowledge graph across all industry terms, procedures, job roles, equipment, compliance, psychrometrics, AI datasets, and market patterns. Powers search, automation, academy, chatbot, and reporting.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Semantic Search | Yes |
| Relationship Mapping | Yes |
| Multi-Source Integration | Yes |
| Auto-Generation Support | Yes |
| Domain Knowledge | Yes |

## Database Schema

### Migration 124: Industry Knowledge Graph Engine

```sql
-- 124_industry_knowledge_graph_engine.sql

-- Knowledge graph nodes table
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_type TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Node type check
  CONSTRAINT knowledge_graph_nodes_type_check CHECK (
    node_type IN (
      'procedure', 'skill', 'equipment', 'compliance_rule',
      'location', 'weather', 'model_dataset', 'academy_topic',
      'brand_term', 'benchmark', 'other'
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_type ON knowledge_graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_name ON knowledge_graph_nodes(name);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_created ON knowledge_graph_nodes(created_at DESC);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_search ON knowledge_graph_nodes USING gin(to_tsvector('english', name));

-- Enable RLS
ALTER TABLE knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read)
CREATE POLICY knowledge_graph_nodes_select ON knowledge_graph_nodes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY knowledge_graph_nodes_insert ON knowledge_graph_nodes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY knowledge_graph_nodes_update ON knowledge_graph_nodes
  FOR UPDATE TO authenticated
  USING (true);

-- Comment
COMMENT ON TABLE knowledge_graph_nodes IS 'Knowledge graph nodes (Phase 72)';

-- Knowledge graph edges table
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_node_id UUID NOT NULL,
  to_node_id UUID NOT NULL,
  relationship TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence check
  CONSTRAINT knowledge_graph_edges_confidence_check CHECK (
    confidence >= 0 AND confidence <= 100
  ),

  -- Foreign keys
  CONSTRAINT knowledge_graph_edges_from_fk
    FOREIGN KEY (from_node_id) REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  CONSTRAINT knowledge_graph_edges_to_fk
    FOREIGN KEY (to_node_id) REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_from ON knowledge_graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_to ON knowledge_graph_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_relationship ON knowledge_graph_edges(relationship);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_created ON knowledge_graph_edges(created_at DESC);

-- Enable RLS
ALTER TABLE knowledge_graph_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read)
CREATE POLICY knowledge_graph_edges_select ON knowledge_graph_edges
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY knowledge_graph_edges_insert ON knowledge_graph_edges
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE knowledge_graph_edges IS 'Knowledge graph relationships (Phase 72)';
```

## Knowledge Graph Engine Service

```typescript
// src/lib/knowledge/knowledge-graph-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface KnowledgeNode {
  id: string;
  nodeType: string;
  name: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

interface KnowledgeEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationship: string;
  confidence: number;
  createdAt: Date;
}

interface GraphPath {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

const NODE_TYPES = [
  'procedure',
  'skill',
  'equipment',
  'compliance_rule',
  'location',
  'weather',
  'model_dataset',
  'academy_topic',
  'brand_term',
  'benchmark',
  'other',
];

export class KnowledgeGraphEngine {
  async createNode(
    nodeType: string,
    name: string,
    metadata?: Record<string, any>
  ): Promise<KnowledgeNode> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('knowledge_graph_nodes')
      .insert({
        node_type: nodeType,
        name,
        metadata: metadata || {},
      })
      .select()
      .single();

    return this.mapToNode(data);
  }

  async createEdge(
    fromNodeId: string,
    toNodeId: string,
    relationship: string,
    confidence?: number
  ): Promise<KnowledgeEdge> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('knowledge_graph_edges')
      .insert({
        from_node_id: fromNodeId,
        to_node_id: toNodeId,
        relationship,
        confidence: confidence || 100,
      })
      .select()
      .single();

    return this.mapToEdge(data);
  }

  async search(query: string): Promise<KnowledgeNode[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('knowledge_graph_nodes')
      .select('*')
      .textSearch('name', query)
      .limit(50);

    return (data || []).map(n => this.mapToNode(n));
  }

  async getRelatedNodes(nodeId: string, depth: number = 1): Promise<KnowledgeNode[]> {
    const supabase = await getSupabaseServer();

    // Get directly connected nodes
    const { data: edges } = await supabase
      .from('knowledge_graph_edges')
      .select('from_node_id, to_node_id')
      .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`);

    const relatedIds = new Set<string>();
    for (const edge of edges || []) {
      if (edge.from_node_id !== nodeId) relatedIds.add(edge.from_node_id);
      if (edge.to_node_id !== nodeId) relatedIds.add(edge.to_node_id);
    }

    if (relatedIds.size === 0) return [];

    const { data: nodes } = await supabase
      .from('knowledge_graph_nodes')
      .select('*')
      .in('id', Array.from(relatedIds));

    return (nodes || []).map(n => this.mapToNode(n));
  }

  async findPath(fromNodeId: string, toNodeId: string): Promise<GraphPath | null> {
    const supabase = await getSupabaseServer();

    // Simple BFS for shortest path
    const visited = new Set<string>();
    const queue: { nodeId: string; path: string[]; edges: string[] }[] = [
      { nodeId: fromNodeId, path: [fromNodeId], edges: [] }
    ];

    while (queue.length > 0) {
      const { nodeId, path, edges } = queue.shift()!;

      if (nodeId === toNodeId) {
        // Found path - fetch full data
        const { data: nodes } = await supabase
          .from('knowledge_graph_nodes')
          .select('*')
          .in('id', path);

        const { data: edgeData } = await supabase
          .from('knowledge_graph_edges')
          .select('*')
          .in('id', edges);

        return {
          nodes: (nodes || []).map(n => this.mapToNode(n)),
          edges: (edgeData || []).map(e => this.mapToEdge(e)),
        };
      }

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      // Get connected edges
      const { data: connectedEdges } = await supabase
        .from('knowledge_graph_edges')
        .select('id, from_node_id, to_node_id')
        .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`);

      for (const edge of connectedEdges || []) {
        const nextNode = edge.from_node_id === nodeId ? edge.to_node_id : edge.from_node_id;
        if (!visited.has(nextNode)) {
          queue.push({
            nodeId: nextNode,
            path: [...path, nextNode],
            edges: [...edges, edge.id],
          });
        }
      }
    }

    return null;
  }

  async getNodesByType(nodeType: string): Promise<KnowledgeNode[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('knowledge_graph_nodes')
      .select('*')
      .eq('node_type', nodeType)
      .order('name');

    return (data || []).map(n => this.mapToNode(n));
  }

  async getEdgesForNode(nodeId: string): Promise<KnowledgeEdge[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('knowledge_graph_edges')
      .select('*')
      .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`);

    return (data || []).map(e => this.mapToEdge(e));
  }

  async getNode(nodeId: string): Promise<KnowledgeNode> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('knowledge_graph_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    return this.mapToNode(data);
  }

  async updateNodeMetadata(
    nodeId: string,
    metadata: Record<string, any>
  ): Promise<KnowledgeNode> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('knowledge_graph_nodes')
      .update({ metadata })
      .eq('id', nodeId)
      .select()
      .single();

    return this.mapToNode(data);
  }

  async deleteNode(nodeId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('knowledge_graph_nodes')
      .delete()
      .eq('id', nodeId);
  }

  async deleteEdge(edgeId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('knowledge_graph_edges')
      .delete()
      .eq('id', edgeId);
  }

  async getStats(): Promise<{
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<string, number>;
  }> {
    const supabase = await getSupabaseServer();

    const { count: totalNodes } = await supabase
      .from('knowledge_graph_nodes')
      .select('*', { count: 'exact', head: true });

    const { count: totalEdges } = await supabase
      .from('knowledge_graph_edges')
      .select('*', { count: 'exact', head: true });

    const { data: nodes } = await supabase
      .from('knowledge_graph_nodes')
      .select('node_type');

    const nodesByType: Record<string, number> = {};
    for (const node of nodes || []) {
      nodesByType[node.node_type] = (nodesByType[node.node_type] || 0) + 1;
    }

    return {
      totalNodes: totalNodes || 0,
      totalEdges: totalEdges || 0,
      nodesByType,
    };
  }

  private mapToNode(data: any): KnowledgeNode {
    return {
      id: data.id,
      nodeType: data.node_type,
      name: data.name,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
    };
  }

  private mapToEdge(data: any): KnowledgeEdge {
    return {
      id: data.id,
      fromNodeId: data.from_node_id,
      toNodeId: data.to_node_id,
      relationship: data.relationship,
      confidence: data.confidence,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/knowledge/nodes

Create node.

### POST /api/knowledge/edges

Create edge.

### GET /api/knowledge/search

Semantic search.

### GET /api/knowledge/related/:nodeId

Get related nodes.

### GET /api/knowledge/path/:from/:to

Find path between nodes.

### GET /api/knowledge/stats

Get graph statistics.

## Implementation Tasks

- [ ] Create 124_industry_knowledge_graph_engine.sql
- [ ] Implement KnowledgeGraphEngine
- [ ] Create API endpoints
- [ ] Create KnowledgeExplorer.tsx
- [ ] Integrate with Academy and Concierge
- [ ] Add psychrometric datasets

---

*Phase 72 - Industry Knowledge Graph Engine Complete*
