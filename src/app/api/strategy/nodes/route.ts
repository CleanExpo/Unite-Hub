/**
 * Strategy Nodes API - Phase 11 Week 1-2
 *
 * CRUD operations for strategy graph nodes and edges.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { StrategyGraphService, NodeType, EdgeType, RiskLevel, NodeStatus } from "@/lib/strategy/strategyGraphService";

const nodeTypeEnum = z.enum(["OBJECTIVE", "TACTIC", "ACTION", "METRIC", "MILESTONE", "CONSTRAINT"]);
const edgeTypeEnum = z.enum(["DEPENDS_ON", "ENABLES", "CONFLICTS_WITH", "REINFORCES", "MEASURES", "BLOCKS", "PARALLEL"]);
const riskLevelEnum = z.enum(["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"]);
const statusEnum = z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "BLOCKED", "CANCELLED"]);

const createNodeSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  node_type: nodeTypeEnum,
  domain: z.string(),
  priority: z.number().min(0).max(100).optional(),
  risk_level: riskLevelEnum.optional(),
  estimated_duration_hours: z.number().optional(),
  deadline: z.string().optional(),
  input_data: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  created_by: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
});

const createEdgeSchema = z.object({
  organization_id: z.string().uuid(),
  source_node_id: z.string().uuid(),
  target_node_id: z.string().uuid(),
  edge_type: edgeTypeEnum,
  weight: z.number().optional(),
  is_critical: z.boolean().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateNodeSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  priority: z.number().optional(),
  risk_level: riskLevelEnum.optional(),
  status: statusEnum.optional(),
  progress: z.number().min(0).max(100).optional(),
  estimated_duration_hours: z.number().nullable().optional(),
  actual_duration_hours: z.number().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  input_data: z.record(z.unknown()).optional(),
  output_data: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

const requestSchema = z.object({
  action: z.enum([
    "create_node",
    "create_edge",
    "update_node",
    "delete_node",
    "get_node",
    "get_dependencies",
    "get_dependents",
    "get_graph",
  ]),
  node_id: z.string().uuid().optional(),
  node: createNodeSchema.optional(),
  edge: createEdgeSchema.optional(),
  updates: updateNodeSchema.optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { action, node_id, node, edge, updates } = parsed.data;
    const graphService = new StrategyGraphService();

    switch (action) {
      case "create_node": {
        if (!node) {
          return NextResponse.json({ error: "Node data required" }, { status: 400 });
        }

        const created = await graphService.createNode({
          ...node,
          created_by: node.created_by || userId,
        });

        return NextResponse.json({ success: true, node: created });
      }

      case "create_edge": {
        if (!edge) {
          return NextResponse.json({ error: "Edge data required" }, { status: 400 });
        }

        const created = await graphService.createEdge(edge);
        return NextResponse.json({ success: true, edge: created });
      }

      case "update_node": {
        if (!node_id || !updates) {
          return NextResponse.json(
            { error: "node_id and updates required" },
            { status: 400 }
          );
        }

        const updated = await graphService.updateNode(node_id, updates);
        return NextResponse.json({ success: true, node: updated });
      }

      case "delete_node": {
        if (!node_id) {
          return NextResponse.json({ error: "node_id required" }, { status: 400 });
        }

        await graphService.deleteNode(node_id);
        return NextResponse.json({ success: true });
      }

      case "get_node": {
        if (!node_id) {
          return NextResponse.json({ error: "node_id required" }, { status: 400 });
        }

        const result = await graphService.getNode(node_id);
        if (!result) {
          return NextResponse.json({ error: "Node not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, node: result });
      }

      case "get_dependencies": {
        if (!node_id) {
          return NextResponse.json({ error: "node_id required" }, { status: 400 });
        }

        const dependencies = await graphService.getDependencies(node_id);
        return NextResponse.json({ success: true, dependencies });
      }

      case "get_dependents": {
        if (!node_id) {
          return NextResponse.json({ error: "node_id required" }, { status: 400 });
        }

        const dependents = await graphService.getDependents(node_id);
        return NextResponse.json({ success: true, dependents });
      }

      case "get_graph": {
        // Need organization_id from node or query
        const orgId = node?.organization_id;
        if (!orgId) {
          return NextResponse.json(
            { error: "organization_id required in node field" },
            { status: 400 }
          );
        }

        const graph = await graphService.getGraph(orgId);
        return NextResponse.json({ success: true, graph });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Strategy nodes error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const searchParams = req.nextUrl.searchParams;
    const organizationId = searchParams.get("organization_id");
    const domain = searchParams.get("domain");
    const nodeType = searchParams.get("node_type") as NodeType | null;
    const status = searchParams.get("status") as NodeStatus | null;

    if (!organizationId) {
      // Get from user's organization
      const supabase = await getSupabaseServer();
      const { data: userOrg } = await supabase
        .from("user_organizations")
        .select("org_id")
        .eq("user_id", userId)
        .single();

      if (!userOrg) {
        return NextResponse.json({ error: "No organization found" }, { status: 400 });
      }

      const graphService = new StrategyGraphService();
      const nodes = await graphService.getNodes(userOrg.org_id, {
        domain: domain || undefined,
        nodeType: nodeType || undefined,
        status: status || undefined,
      });

      const edges = await graphService.getEdges(
        userOrg.org_id,
        nodes.map((n) => n.id)
      );

      return NextResponse.json({ success: true, nodes, edges });
    }

    const graphService = new StrategyGraphService();
    const nodes = await graphService.getNodes(organizationId, {
      domain: domain || undefined,
      nodeType: nodeType || undefined,
      status: status || undefined,
    });

    const edges = await graphService.getEdges(
      organizationId,
      nodes.map((n) => n.id)
    );

    return NextResponse.json({ success: true, nodes, edges });
  } catch (error) {
    console.error("Strategy nodes GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}
