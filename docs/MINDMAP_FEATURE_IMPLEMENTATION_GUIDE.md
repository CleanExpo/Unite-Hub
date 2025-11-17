# Interactive Mindmap Feature - Implementation Guide

**Created:** 2025-01-17
**Status:** ✅ Database Ready | 🔄 API In Progress | ⏳ Frontend Pending
**Estimated Completion Time:** 6-8 hours with parallel work

---

## Overview

This guide provides step-by-step instructions to complete the Interactive Mindmap feature for Unite-Hub. This feature allows clients to visualize and interact with their projects as dynamic mindmaps with AI-powered suggestions.

### What's Been Completed ✅

1. **Database Migrations** ([028_mindmap_feature.sql](../supabase/migrations/028_mindmap_feature.sql))
   - ✅ 4 new tables: `project_mindmaps`, `mindmap_nodes`, `mindmap_connections`, `ai_suggestions`
   - ✅ Complete RLS policies with workspace isolation
   - ✅ Indexes for performance
   - ✅ Helper function `get_mindmap_structure()`
   - ✅ Rollback migration available

2. **AI Agent** ([src/lib/agents/mindmap-analysis.ts](../src/lib/agents/mindmap-analysis.ts))
   - ✅ MindmapAnalysisAgent with Extended Thinking
   - ✅ NodeEnrichmentAgent for auto-expanding brief nodes
   - ✅ Prompt caching enabled (20-30% cost savings)
   - ✅ Full TypeScript types

3. **API Endpoints (Partial)**
   - ✅ GET/PUT/DELETE `/api/mindmap/[mindmapId]`
   - ✅ POST `/api/mindmap/[mindmapId]/nodes`

### What Needs to Be Completed ⏳

1. **Remaining API Endpoints** (2-3 hours)
2. **Frontend Components** (4-5 hours)
3. **Testing & Integration** (1-2 hours)

---

## Step 1: Apply Database Migration

### Prerequisites
- Access to Supabase Dashboard
- Database backup recommended (optional but good practice)

### Instructions

1. **Navigate to Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Click "SQL Editor" in the left sidebar

2. **Run the migration:**
   ```sql
   -- Copy and paste the contents of:
   -- supabase/migrations/028_mindmap_feature.sql
   ```

3. **Verify tables created:**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions');
   ```
   Expected: 4 rows returned

4. **Verify RLS enabled:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
     AND tablename IN ('project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions');
   ```
   Expected: All tables show `rowsecurity = true`

---

## Step 2: Install Frontend Dependencies

```bash
# If not already installed
npm install reactflow dagre @types/dagre elkjs --save
```

**Verify installation:**
```bash
npm list reactflow dagre elkjs
```

---

## Step 3: Complete API Endpoints

### 3.1 Create Update/Delete Node Endpoint

**File:** `src/app/api/mindmap/nodes/[nodeId]/route.ts`

```typescript
/**
 * Individual Node API - Update/Delete specific node
 * Path: /api/mindmap/nodes/[nodeId]
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function PUT(
  req: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    const { nodeId } = params;
    const body = await req.json();

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update node
    const { data: node, error: updateError } = await supabase
      .from("mindmap_nodes")
      .update({
        label: body.label,
        description: body.description,
        position_x: body.position_x,
        position_y: body.position_y,
        status: body.status,
        priority: body.priority,
        color: body.color,
        icon: body.icon,
        metadata: body.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", nodeId)
      .select()
      .single();

    if (updateError || !node) {
      return NextResponse.json(
        { error: "Failed to update node" },
        { status: 500 }
      );
    }

    // Update mindmap version
    await supabase
      .from("project_mindmaps")
      .update({
        version: supabase.rpc("increment_version", { mindmap_id: node.mindmap_id }),
        last_updated_by: user.id,
      })
      .eq("id", node.mindmap_id);

    return NextResponse.json({ node });
  } catch (error) {
    console.error("PUT /api/mindmap/nodes/[nodeId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    const { nodeId } = params;

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get node to find mindmap_id
    const { data: node } = await supabase
      .from("mindmap_nodes")
      .select("mindmap_id")
      .eq("id", nodeId)
      .single();

    // Delete node (cascade deletes children)
    const { error: deleteError } = await supabase
      .from("mindmap_nodes")
      .delete()
      .eq("id", nodeId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete node" },
        { status: 500 }
      );
    }

    // Update mindmap version
    if (node) {
      await supabase
        .from("project_mindmaps")
        .update({
          last_updated_by: user.id,
        })
        .eq("id", node.mindmap_id);
    }

    return NextResponse.json({ message: "Node deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/mindmap/nodes/[nodeId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 3.2 Create Connections Endpoint

**File:** `src/app/api/mindmap/[mindmapId]/connections/route.ts`

```typescript
/**
 * Connections API - Create connections between nodes
 * Path: /api/mindmap/[mindmapId]/connections
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { mindmapId: string } }
) {
  try {
    const { mindmapId } = params;
    const body = await req.json();

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!body.source_node_id || !body.target_node_id) {
      return NextResponse.json(
        { error: "source_node_id and target_node_id are required" },
        { status: 400 }
      );
    }

    // Create connection
    const { data: connection, error: connectionError } = await supabase
      .from("mindmap_connections")
      .insert({
        mindmap_id: mindmapId,
        source_node_id: body.source_node_id,
        target_node_id: body.target_node_id,
        connection_type: body.connection_type || "relates_to",
        label: body.label || null,
        strength: body.strength || 5,
      })
      .select()
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "Failed to create connection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ connection });
  } catch (error) {
    console.error("POST /api/mindmap/[mindmapId]/connections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 3.3 Create AI Analysis Endpoint

**File:** `src/app/api/mindmap/[mindmapId]/ai-analyze/route.ts`

```typescript
/**
 * AI Analysis API - Trigger AI analysis of mindmap
 * Path: /api/mindmap/[mindmapId]/ai-analyze
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { analyzeMindmap } from "@/lib/agents/mindmap-analysis";

export async function POST(
  req: NextRequest,
  { params }: { params: { mindmapId: string } }
) {
  try {
    const { mindmapId } = params;
    const body = await req.json();

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get mindmap structure
    const { data: mindmap } = await supabase
      .from("project_mindmaps")
      .select("*, projects(title, description)")
      .eq("id", mindmapId)
      .single();

    const { data: nodes } = await supabase
      .from("mindmap_nodes")
      .select("*")
      .eq("mindmap_id", mindmapId);

    const { data: connections } = await supabase
      .from("mindmap_connections")
      .select("*")
      .eq("mindmap_id", mindmapId);

    if (!mindmap || !nodes) {
      return NextResponse.json({ error: "Mindmap not found" }, { status: 404 });
    }

    // Run AI analysis
    const analysis = await analyzeMindmap(
      {
        mindmap_id: mindmapId,
        project_id: mindmap.project_id,
        project_title: (mindmap as any).projects?.title || "Untitled",
        nodes,
        connections: connections || [],
      },
      body.analysis_type || "full",
      body.focus_node_id
    );

    // Save suggestions to database
    if (analysis.suggestions.length > 0) {
      const suggestionsToInsert = analysis.suggestions.map((s) => ({
        mindmap_id: mindmapId,
        node_id: s.node_id || null,
        suggestion_type: s.suggestion_type,
        suggestion_text: s.suggestion_text,
        reasoning: s.reasoning,
        confidence_score: s.confidence_score,
        status: "pending",
      }));

      await supabase.from("ai_suggestions").insert(suggestionsToInsert);
    }

    return NextResponse.json({
      suggestions: analysis.suggestions,
      insights: analysis.insights,
      cache_stats: analysis.cache_stats,
    });
  } catch (error) {
    console.error("POST /api/mindmap/[mindmapId]/ai-analyze error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 3.4 Create Project Mindmap Endpoint

**File:** `src/app/api/projects/[projectId]/mindmap/route.ts`

```typescript
/**
 * Project Mindmap API - Get or create mindmap for a project
 * Path: /api/projects/[projectId]/mindmap
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create mindmap
    let { data: mindmap } = await supabase
      .from("project_mindmaps")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (!mindmap) {
      // Create new mindmap
      const { data: project } = await supabase
        .from("projects")
        .select("workspace_id, org_id")
        .eq("id", projectId)
        .single();

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const { data: newMindmap } = await supabase
        .from("project_mindmaps")
        .insert({
          project_id: projectId,
          workspace_id: project.workspace_id,
          org_id: project.org_id,
          created_by: user.id,
          last_updated_by: user.id,
        })
        .select()
        .single();

      mindmap = newMindmap;
    }

    // Get nodes, connections, suggestions
    const { data: nodes } = await supabase
      .from("mindmap_nodes")
      .select("*")
      .eq("mindmap_id", mindmap.id);

    const { data: connections } = await supabase
      .from("mindmap_connections")
      .select("*")
      .eq("mindmap_id", mindmap.id);

    const { data: suggestions } = await supabase
      .from("ai_suggestions")
      .select("*")
      .eq("mindmap_id", mindmap.id)
      .eq("status", "pending");

    return NextResponse.json({
      mindmap,
      nodes: nodes || [],
      connections: connections || [],
      suggestions: suggestions || [],
    });
  } catch (error) {
    console.error("GET /api/projects/[projectId]/mindmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Step 4: Create Frontend Components

### 4.1 Create InteractiveMindmap Component

**File:** `src/components/mindmap/InteractiveMindmap.tsx`

This is the core component using ReactFlow. Due to length, I'll provide the essential structure:

```typescript
"use client";

import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

interface InteractiveMindmapProps {
  mindmapId: string;
  initialNodes: any[];
  initialConnections: any[];
  onNodeUpdate: (nodeId: string, updates: any) => Promise<void>;
  onNodeDelete: (nodeId: string) => Promise<void>;
  onConnectionCreate: (connection: any) => Promise<void>;
}

export function InteractiveMindmap({
  mindmapId,
  initialNodes,
  initialConnections,
  onNodeUpdate,
  onNodeDelete,
  onConnectionCreate,
}: InteractiveMindmapProps) {
  // Convert database nodes to ReactFlow format
  const convertToFlowNodes = (dbNodes: any[]): Node[] => {
    return dbNodes.map((node) => ({
      id: node.id,
      type: "default",
      position: { x: node.position_x, y: node.position_y },
      data: {
        label: node.label,
        description: node.description,
        node_type: node.node_type,
        status: node.status,
        priority: node.priority,
      },
    }));
  };

  const convertToFlowEdges = (dbConnections: any[]): Edge[] => {
    return dbConnections.map((conn) => ({
      id: conn.id,
      source: conn.source_node_id,
      target: conn.target_node_id,
      label: conn.label,
      type: "default",
    }));
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(
    convertToFlowNodes(initialNodes)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    convertToFlowEdges(initialConnections)
  );

  // Auto-layout using Dagre
  const autoLayout = useCallback(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB" });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      g.setNode(node.id, { width: 150, height: 50 });
    });

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x,
          y: nodeWithPosition.y,
        },
      };
    });

    setNodes(layoutedNodes);
  }, [nodes, edges, setNodes]);

  // Handle connection creation
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        onConnectionCreate({
          source_node_id: connection.source,
          target_node_id: connection.target,
          connection_type: "relates_to",
        });
        setEdges((eds) => addEdge(connection, eds));
      }
    },
    [onConnectionCreate, setEdges]
  );

  return (
    <div className="w-full h-[600px] border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>

      <button onClick={autoLayout} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Auto Layout
      </button>
    </div>
  );
}
```

### 4.2 Create Mindmap Dashboard Page

**File:** `src/app/dashboard/projects/[projectId]/mindmap/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { InteractiveMindmap } from "@/components/mindmap/InteractiveMindmap";
import { useParams } from "next/navigation";

export default function MindmapPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [mindmapData, setMindmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMindmap();
  }, [projectId]);

  const fetchMindmap = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/mindmap`);
      const data = await response.json();
      setMindmapData(data);
    } catch (error) {
      console.error("Failed to fetch mindmap:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeUpdate = async (nodeId: string, updates: any) => {
    await fetch(`/api/mindmap/nodes/${nodeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  const handleNodeDelete = async (nodeId: string) => {
    await fetch(`/api/mindmap/nodes/${nodeId}`, {
      method: "DELETE",
    });
  };

  const handleConnectionCreate = async (connection: any) => {
    await fetch(`/api/mindmap/${mindmapData.mindmap.id}/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(connection),
    });
  };

  if (loading) return <div>Loading mindmap...</div>;
  if (!mindmapData) return <div>Mindmap not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Project Mindmap</h1>

      <InteractiveMindmap
        mindmapId={mindmapData.mindmap.id}
        initialNodes={mindmapData.nodes}
        initialConnections={mindmapData.connections}
        onNodeUpdate={handleNodeUpdate}
        onNodeDelete={handleNodeDelete}
        onConnectionCreate={handleConnectionCreate}
      />

      {mindmapData.suggestions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">AI Suggestions</h2>
          <div className="space-y-3">
            {mindmapData.suggestions.map((suggestion: any) => (
              <div key={suggestion.id} className="p-4 border rounded-lg bg-blue-50">
                <p className="font-medium">{suggestion.suggestion_text}</p>
                <p className="text-sm text-gray-600 mt-1">{suggestion.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Step 5: Testing Checklist

### Database Tests
- [ ] Run migration 028 successfully
- [ ] Verify all 4 tables exist
- [ ] Verify RLS policies active
- [ ] Test workspace isolation (create mindmap in workspace A, verify not visible in workspace B)

### API Tests
- [ ] GET /api/projects/[projectId]/mindmap creates mindmap if not exists
- [ ] POST /api/mindmap/[mindmapId]/nodes creates node
- [ ] PUT /api/mindmap/nodes/[nodeId] updates node
- [ ] DELETE /api/mindmap/nodes/[nodeId] deletes node
- [ ] POST /api/mindmap/[mindmapId]/connections creates connection
- [ ] POST /api/mindmap/[mindmapId]/ai-analyze returns suggestions

### Frontend Tests
- [ ] Mindmap renders with ReactFlow
- [ ] Can drag and reposition nodes
- [ ] Can create connections between nodes
- [ ] Auto-layout works
- [ ] AI suggestions display
- [ ] No errors in console

### Integration Tests
- [ ] Existing features still work (dashboard, contacts, campaigns)
- [ ] No performance degradation
- [ ] Authentication works correctly
- [ ] Workspace isolation maintained

---

## Step 6: Rollback Procedure (If Needed)

If you need to remove the feature:

```sql
-- Run the rollback migration:
-- supabase/migrations/028_mindmap_feature_rollback.sql
```

Then:
```bash
npm uninstall reactflow dagre @types/dagre elkjs
```

Remove created files:
- `src/lib/agents/mindmap-analysis.ts`
- `src/app/api/mindmap/**`
- `src/components/mindmap/**`
- Dashboard mindmap pages

---

## Estimated Time Breakdown

| Task | Time | Status |
|------|------|--------|
| Database migration | 30 min | ✅ Complete |
| AI agent implementation | 1 hour | ✅ Complete |
| API endpoints (remaining) | 2-3 hours | 🔄 In Progress |
| Frontend components | 4-5 hours | ⏳ Pending |
| Testing & debugging | 1-2 hours | ⏳ Pending |
| **Total** | **8-12 hours** | **~30% Complete** |

---

## Support & Next Steps

### Questions?
- Review the JSON specification provided initially
- Check existing Unite-Hub patterns in `CLAUDE.md`
- Test incrementally to catch issues early

### After Completion
1. Update `CLAUDE.md` with mindmap feature documentation
2. Add feature flag to `package.json` if desired
3. Create user documentation
4. Consider adding export functionality (PDF, PNG, JSON)
5. Add real-time collaboration (WebSockets)

---

**Created by:** Claude Code Assistant
**Date:** 2025-01-17
**Version:** 1.0
