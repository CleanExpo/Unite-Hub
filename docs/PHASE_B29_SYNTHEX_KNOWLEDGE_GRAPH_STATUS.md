# Phase B29: Multi-Tenant Knowledge Graph Engine

**Status**: Complete
**Date**: 2025-12-07
**Phase**: B29 of Synthex Portal

## Overview

Phase B29 implements a comprehensive knowledge graph system that creates semantic connections between SEO data, content, campaigns, audiences, and brand signals. It uses pgvector for embedding-based similarity search and AI-powered clustering.

## Components Implemented

### 1. Database Migration (437_synthex_knowledge_graph.sql)

**Tables Created**:
- `synthex_kg_nodes` - Knowledge graph nodes with type, label, and metadata
- `synthex_kg_edges` - Relationships between nodes with typed connections
- `synthex_kg_embeddings` - Vector embeddings for semantic search (1536 dimensions)
- `synthex_kg_clusters` - AI-generated topic clusters
- `synthex_kg_cluster_members` - Node-to-cluster relationships

**Key Features**:
- pgvector extension for embedding storage and cosine similarity search
- `get_kg_neighbors` helper function for graph traversal
- Full RLS policies for multi-tenant isolation
- Cascade deletes for referential integrity

**Node Types**:
- keyword, topic, content, campaign, audience, competitor, brand, signal

**Edge Types**:
- related_to, part_of, targets, competes_with, influences, derived_from

### 2. Service Layer (knowledgeGraphService.ts)

**Core Functions**:
- `createNode(tenantId, data)` - Create knowledge graph nodes
- `createEdge(tenantId, data)` - Create relationships between nodes
- `getNode(tenantId, nodeId)` - Retrieve node with metadata
- `getNeighbors(tenantId, nodeId, depth)` - Get connected nodes
- `searchByEmbedding(tenantId, embedding, limit)` - Vector similarity search
- `connectEntities(tenantId, entity1, entity2, relationship)` - Connect by label

**AI-Powered Functions**:
- `autoLinkContentToKeywords(tenantId, contentId)` - Auto-link content to keywords
- `suggestClusters(tenantId)` - AI-suggested topic clusters
- `generateTopicMap(tenantId)` - Generate visual topic map

**Sync Functions**:
- `importSEOReportToGraph(tenantId, reportId)` - Import SEO report data
- `importAudienceToGraph(tenantId, audienceId)` - Import audience segments

### 3. API Routes

**GET/POST/PATCH/DELETE /api/synthex/knowledge/nodes**
- List, create, update, delete knowledge graph nodes
- Query params: tenantId, type (filter by node type)

**GET/POST/PUT /api/synthex/knowledge/edges**
- List and create edges between nodes
- PUT for bulk edge operations

**GET/POST /api/synthex/knowledge/search**
- GET: Search by label pattern
- POST: Semantic search with embedding vector

### 4. UI Page (/synthex/knowledge)

**Features**:
- Knowledge Nodes tab with grid display
- AI Clusters tab showing suggested clusters
- Add Node form with type selection
- Badge-based node type visualization
- Dark theme consistent with Synthex portal

## Usage Examples

### Create a Node
```typescript
const node = await createNode('tenant-123', {
  type: 'keyword',
  label: 'local seo',
  metadata: { search_volume: 5400, difficulty: 45 }
});
```

### Create an Edge
```typescript
const edge = await createEdge('tenant-123', {
  source_id: 'node-1',
  target_id: 'node-2',
  relationship: 'related_to',
  weight: 0.85
});
```

### Semantic Search
```typescript
const results = await searchByEmbedding('tenant-123', embedding, 10);
```

### AI Clustering
```typescript
const clusters = await suggestClusters('tenant-123');
```

## Dependencies

- pgvector PostgreSQL extension
- Anthropic Claude API (for AI features)
- Supabase client libraries

## Migration Notes

Run migration 435 in Supabase SQL Editor:
```sql
\i supabase/migrations/435_synthex_knowledge_graph.sql
```

## Related Phases

- B10: SEO Reports (imports data)
- B17: Audience Intelligence (imports segments)
- B25: Brand Intelligence (brand signals)
- B30: Competitor Intelligence (competitor nodes)
