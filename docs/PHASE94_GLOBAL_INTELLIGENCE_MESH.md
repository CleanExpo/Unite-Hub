# Phase 94: Global Intelligence Mesh (GIM)

**Date**: 2025-11-24
**Status**: Complete

## Overview

Phase 94 implements the Global Intelligence Mesh - a unified intelligence fabric that connects all signals across Unite-Hub's engines (Early Warning, Performance Reality, Creative Intelligence, Compliance, Scaling) into a coherent graph structure for cross-region reasoning and founder-level insights.

## Architecture

### Core Concepts

**Intelligence Nodes**: Represent signals, events, or entities from any engine
- Types: signal, region, tenant, engine, composite, early_warning, performance, compliance, creative, scaling
- Properties: weight, confidence, label, tags, payload, metadata
- Source tracking: Linked to originating table/record

**Intelligence Edges**: Represent relationships between nodes
- Types: influences, conflicts, reinforces, depends_on, aggregates, causes, correlates, precedes, follows
- Properties: strength, confidence, bidirectional flag
- Enable graph traversal and reasoning

**Mesh Snapshots**: Periodic captures of mesh state for trend analysis
- Types: hourly, daily, weekly
- Include node/edge counts and average confidence

## Database Schema

### Tables Created (Migration 137)

```sql
-- Intelligence nodes
intelligence_nodes (
  id UUID PRIMARY KEY,
  node_type TEXT NOT NULL,
  source_table TEXT,
  source_id UUID,
  region_id UUID REFERENCES regions(id),
  tenant_id UUID REFERENCES agencies(id),
  weight FLOAT DEFAULT 1.0,
  confidence FLOAT DEFAULT 0.5,
  label TEXT,
  tags TEXT[],
  payload JSONB,
  metadata JSONB,
  created_at, updated_at
)

-- Intelligence edges
intelligence_edges (
  id UUID PRIMARY KEY,
  from_node_id UUID REFERENCES intelligence_nodes(id),
  to_node_id UUID REFERENCES intelligence_nodes(id),
  relationship TEXT NOT NULL,
  strength FLOAT NOT NULL,
  confidence FLOAT NOT NULL,
  is_bidirectional BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at
)

-- Mesh snapshots
intelligence_mesh_snapshots (
  id UUID PRIMARY KEY,
  snapshot_type TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  node_count INTEGER,
  edge_count INTEGER,
  avg_confidence FLOAT,
  created_at
)
```

### Indexes

- Nodes: node_type, region_id, tenant_id, source lookup
- Edges: from_node_id, to_node_id, relationship
- Snapshots: snapshot_type, created_at

### Database Functions

- `find_connected_nodes(p_node_id, p_max_depth)` - Graph traversal with depth limiting

## Backend Services

### Location: `src/lib/intelligenceMesh/`

1. **meshTypes.ts** - Type definitions for nodes, edges, insights
2. **intelligenceNodeService.ts** - Node CRUD operations, filtering, top nodes
3. **intelligenceEdgeService.ts** - Edge management, strongest edges
4. **meshAggregationService.ts** - Global overview, health metrics, distributions
5. **meshInsightService.ts** - AI-powered insight generation with Truth Layer
6. **meshSnapshotService.ts** - Periodic snapshot capture and retrieval
7. **index.ts** - Module exports

### Key Functions

```typescript
// Node operations
createNode(data: Omit<IntelligenceNode, 'id' | 'createdAt' | 'updatedAt'>)
getNodeById(nodeId: string)
listNodes(options: { nodeType?, regionId?, tenantId?, limit?, offset? })
getTopWeightedNodes(limit: number)

// Edge operations
createEdge(data: Omit<IntelligenceEdge, 'id' | 'createdAt'>)
listEdgesForNode(nodeId: string)
getStrongestEdges(limit: number)

// Aggregation
globalMeshOverview()
getMeshHealth()

// Insights (Truth Layer compliant)
generateFounderInsights()

// Snapshots
captureSnapshot(type: 'hourly' | 'daily' | 'weekly')
```

## API Routes

### GET /api/mesh/overview

Returns global mesh statistics, health metrics, and optional insights.

**Query Parameters**:
- `includeInsights=true` - Include AI-generated insights
- `includeTopNodes=true` - Include top weighted nodes and strongest edges

**Response**:
```json
{
  "success": true,
  "overview": {
    "totalNodes": 150,
    "totalEdges": 340,
    "avgConfidence": 0.72,
    "avgWeight": 0.85,
    "nodesByType": { "signal": 45, "composite": 20 },
    "edgesByRelationship": { "influences": 120, "correlates": 80 }
  },
  "health": {
    "overall": "healthy",
    "metrics": {
      "coverage": 0.85,
      "connectivity": 0.70,
      "confidence": 0.72,
      "freshness": 0.90
    }
  },
  "topNodes": [...],
  "strongestEdges": [...],
  "insights": [...],
  "insightSummary": "..."
}
```

### GET /api/mesh/node/[nodeId]

Returns detailed node information with all connected edges.

**Response**:
```json
{
  "success": true,
  "node": { ... },
  "edges": [...],
  "connectedNodes": [...]
}
```

## UI Components

### Location: `src/components/mesh/`

1. **MeshInsightPanel.tsx** - Displays AI-generated insights with severity and confidence
2. **MeshNodeDetail.tsx** - Node detail view with incoming/outgoing edges

### Dashboard Page

**Location**: `src/app/founder/mesh/page.tsx`

Features:
- Health status overview (healthy/degraded/critical)
- Node/edge counts and average confidence
- Health metrics with progress bars (coverage, connectivity, confidence, freshness)
- Tabbed interface:
  - Insights tab: AI-generated warnings and opportunities
  - Top Nodes tab: Highest weighted nodes with detail view
  - Distribution tab: Nodes by type and edges by relationship

## Truth Layer Compliance

The mesh insight service adheres to Unite-Hub's Truth Layer constraints:

1. **No synthetic intelligence** - All insights derived from actual data
2. **Confidence scoring** - All insights include confidence percentages
3. **Conservative claims** - Uses hedged language ("may indicate", "could suggest")
4. **No legal/financial advice** - Compliance insights only surface patterns
5. **Source attribution** - Insights reference specific nodes/edges

## Integration Points

### Connecting Other Engines

```typescript
import { createNode, createEdge } from '@/lib/intelligenceMesh';

// When Early Warning detects an event
const warningNode = await createNode({
  nodeType: 'early_warning',
  sourceTable: 'early_warning_events',
  sourceId: event.id,
  weight: event.severity === 'critical' ? 1.0 : 0.5,
  confidence: event.confidence,
  label: event.title,
  tags: ['warning', event.type],
  payload: { eventType: event.type }
});

// Create relationship to region
await createEdge({
  fromNodeId: warningNode.id,
  toNodeId: regionNodeId,
  relationship: 'influences',
  strength: 0.8,
  confidence: 0.7
});
```

### Periodic Processing

```typescript
import { captureSnapshot } from '@/lib/intelligenceMesh';

// Hourly cron job
await captureSnapshot('hourly');

// Daily summary
await captureSnapshot('daily');
```

## Files Created

### Backend (8 files)
- `supabase/migrations/137_global_intelligence_mesh.sql`
- `src/lib/intelligenceMesh/meshTypes.ts`
- `src/lib/intelligenceMesh/intelligenceNodeService.ts`
- `src/lib/intelligenceMesh/intelligenceEdgeService.ts`
- `src/lib/intelligenceMesh/meshAggregationService.ts`
- `src/lib/intelligenceMesh/meshInsightService.ts`
- `src/lib/intelligenceMesh/meshSnapshotService.ts`
- `src/lib/intelligenceMesh/index.ts`

### API Routes (2 files)
- `src/app/api/mesh/overview/route.ts`
- `src/app/api/mesh/node/[nodeId]/route.ts`

### UI Components (3 files)
- `src/components/mesh/MeshInsightPanel.tsx`
- `src/components/mesh/MeshNodeDetail.tsx`
- `src/components/mesh/index.ts`

### Pages (1 file)
- `src/app/founder/mesh/page.tsx`

### Documentation (1 file)
- `docs/PHASE94_GLOBAL_INTELLIGENCE_MESH.md`

## Total: 15 files, ~2,500 lines

## Usage

### Access Dashboard

Navigate to `/founder/mesh` to view:
- Mesh health status
- Node and edge statistics
- AI-generated insights
- Node exploration with edge visualization

### Programmatic Access

```typescript
// Fetch mesh overview
const response = await fetch('/api/mesh/overview?includeInsights=true', {
  headers: { Authorization: `Bearer ${token}` }
});

// Get specific node
const nodeResponse = await fetch(`/api/mesh/node/${nodeId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Next Steps

1. **Phase 95+**: Consider adding:
   - Graph visualization component (D3.js or similar)
   - Real-time mesh updates via WebSocket
   - Automated edge creation from engine events
   - Cross-tenant intelligence sharing (with privacy controls)
   - Machine learning for pattern detection
