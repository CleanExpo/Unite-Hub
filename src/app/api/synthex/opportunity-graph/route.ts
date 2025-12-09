/**
 * Synthex Opportunity Graph Engine API
 *
 * GET - Nodes, edges, paths, clusters, analyses, stats
 * POST - Create/update nodes, edges, paths, clusters, run analyses
 *
 * Phase: D30 - Unified Opportunity Graph Engine
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as graphService from "@/lib/synthex/opportunityGraphService";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const type = searchParams.get("type") || "stats";

    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing required param: tenantId" },
        { status: 400 }
      );
    }

    switch (type) {
      case "stats": {
        const stats = await graphService.getGraphStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "nodes": {
        const filters = {
          node_type: searchParams.get("node_type") as graphService.NodeType | undefined,
          status: searchParams.get("status") as graphService.NodeStatus | undefined,
          min_opportunity_score: searchParams.get("min_opportunity_score")
            ? parseFloat(searchParams.get("min_opportunity_score")!)
            : undefined,
          min_influence_score: searchParams.get("min_influence_score")
            ? parseFloat(searchParams.get("min_influence_score")!)
            : undefined,
          tags: searchParams.get("tags")?.split(",").filter(Boolean),
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
          offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
        };
        const nodes = await graphService.listNodes(tenantId, filters);
        return NextResponse.json({ success: true, nodes });
      }

      case "node": {
        const nodeId = searchParams.get("nodeId");
        if (!nodeId) {
          return NextResponse.json(
            { error: "nodeId is required" },
            { status: 400 }
          );
        }
        const node = await graphService.getNode(nodeId);
        return NextResponse.json({ success: true, node });
      }

      case "node_connections": {
        const nodeId = searchParams.get("nodeId");
        if (!nodeId) {
          return NextResponse.json(
            { error: "nodeId is required" },
            { status: 400 }
          );
        }
        const connections = await graphService.getNodeConnections(tenantId, nodeId);
        return NextResponse.json({ success: true, connections });
      }

      case "edges": {
        const filters = {
          source_node_id: searchParams.get("source_node_id") || undefined,
          target_node_id: searchParams.get("target_node_id") || undefined,
          edge_type: searchParams.get("edge_type") as graphService.EdgeType | undefined,
          is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
          min_weight: searchParams.get("min_weight")
            ? parseFloat(searchParams.get("min_weight")!)
            : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const edges = await graphService.listEdges(tenantId, filters);
        return NextResponse.json({ success: true, edges });
      }

      case "paths": {
        const filters = {
          start_node_id: searchParams.get("start_node_id") || undefined,
          end_node_id: searchParams.get("end_node_id") || undefined,
          is_optimal: searchParams.get("is_optimal") === "true" ? true : undefined,
          min_conversion_probability: searchParams.get("min_conversion_probability")
            ? parseFloat(searchParams.get("min_conversion_probability")!)
            : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const paths = await graphService.listPaths(tenantId, filters);
        return NextResponse.json({ success: true, paths });
      }

      case "find_path": {
        const startNodeId = searchParams.get("start_node_id");
        const endNodeId = searchParams.get("end_node_id");
        if (!startNodeId || !endNodeId) {
          return NextResponse.json(
            { error: "start_node_id and end_node_id are required" },
            { status: 400 }
          );
        }
        const maxDepth = searchParams.get("max_depth")
          ? parseInt(searchParams.get("max_depth")!)
          : 10;
        const shortestPaths = await graphService.findShortestPath(
          tenantId,
          startNodeId,
          endNodeId,
          maxDepth
        );
        return NextResponse.json({ success: true, paths: shortestPaths });
      }

      case "clusters": {
        const filters = {
          cluster_type: searchParams.get("cluster_type") as graphService.ClusterType | undefined,
          is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
          min_member_count: searchParams.get("min_member_count")
            ? parseInt(searchParams.get("min_member_count")!)
            : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const clusters = await graphService.listClusters(tenantId, filters);
        return NextResponse.json({ success: true, clusters });
      }

      case "cluster_members": {
        const clusterId = searchParams.get("cluster_id");
        if (!clusterId) {
          return NextResponse.json(
            { error: "cluster_id is required" },
            { status: 400 }
          );
        }
        const members = await graphService.getClusterMembers(tenantId, clusterId);
        return NextResponse.json({ success: true, members });
      }

      case "analyses": {
        const filters = {
          analysis_type: searchParams.get("analysis_type") as graphService.AnalysisType | undefined,
          status: searchParams.get("status") || undefined,
          min_score: searchParams.get("min_score")
            ? parseFloat(searchParams.get("min_score")!)
            : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const analyses = await graphService.listAnalyses(tenantId, filters);
        return NextResponse.json({ success: true, analyses });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[opportunity-graph GET] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, action, ...data } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      // =====================================================
      // Node Actions
      // =====================================================
      case "create_node": {
        if (!data.node_type || !data.node_name) {
          return NextResponse.json(
            { error: "node_type and node_name are required" },
            { status: 400 }
          );
        }
        const node = await graphService.createNode(
          tenantId,
          {
            node_type: data.node_type,
            node_name: data.node_name,
            node_label: data.node_label,
            external_id: data.external_id,
            external_type: data.external_type,
            status: data.status,
            opportunity_score: data.opportunity_score,
            influence_score: data.influence_score,
            potential_value: data.potential_value,
            properties: data.properties,
            tags: data.tags,
          },
          user.id
        );
        return NextResponse.json({ success: true, node });
      }

      case "update_node": {
        if (!data.node_id) {
          return NextResponse.json(
            { error: "node_id is required" },
            { status: 400 }
          );
        }
        const node = await graphService.updateNode(data.node_id, data.updates);
        return NextResponse.json({ success: true, node });
      }

      case "delete_node": {
        if (!data.node_id) {
          return NextResponse.json(
            { error: "node_id is required" },
            { status: 400 }
          );
        }
        const success = await graphService.deleteNode(data.node_id);
        return NextResponse.json({ success });
      }

      case "link_external": {
        if (!data.external_type || !data.external_id || !data.node_name) {
          return NextResponse.json(
            { error: "external_type, external_id, and node_name are required" },
            { status: 400 }
          );
        }
        const node = await graphService.linkExternalEntity(tenantId, {
          external_type: data.external_type,
          external_id: data.external_id,
          node_name: data.node_name,
          properties: data.properties,
        });
        return NextResponse.json({ success: true, node });
      }

      case "calculate_metrics": {
        if (!data.node_id) {
          return NextResponse.json(
            { error: "node_id is required" },
            { status: 400 }
          );
        }
        const metrics = await graphService.calculateNodeMetrics(tenantId, data.node_id);
        return NextResponse.json({ success: true, metrics });
      }

      // =====================================================
      // Edge Actions
      // =====================================================
      case "create_edge": {
        if (!data.source_node_id || !data.target_node_id || !data.edge_type) {
          return NextResponse.json(
            { error: "source_node_id, target_node_id, and edge_type are required" },
            { status: 400 }
          );
        }
        const edge = await graphService.createEdge(tenantId, {
          source_node_id: data.source_node_id,
          target_node_id: data.target_node_id,
          edge_type: data.edge_type,
          edge_label: data.edge_label,
          weight: data.weight,
          strength: data.strength,
          confidence: data.confidence,
          is_bidirectional: data.is_bidirectional,
          properties: data.properties,
        });
        return NextResponse.json({ success: true, edge });
      }

      case "update_edge": {
        if (!data.edge_id) {
          return NextResponse.json(
            { error: "edge_id is required" },
            { status: 400 }
          );
        }
        const edge = await graphService.updateEdge(data.edge_id, data.updates);
        return NextResponse.json({ success: true, edge });
      }

      case "delete_edge": {
        if (!data.edge_id) {
          return NextResponse.json(
            { error: "edge_id is required" },
            { status: 400 }
          );
        }
        const success = await graphService.deleteEdge(data.edge_id);
        return NextResponse.json({ success });
      }

      case "bulk_create_edges": {
        if (!data.edges || !Array.isArray(data.edges)) {
          return NextResponse.json(
            { error: "edges array is required" },
            { status: 400 }
          );
        }
        const edges = await graphService.bulkCreateEdges(tenantId, data.edges);
        return NextResponse.json({ success: true, edges, count: edges.length });
      }

      // =====================================================
      // Path Actions
      // =====================================================
      case "create_path": {
        if (!data.path_name || !data.start_node_id || !data.end_node_id || !data.node_sequence) {
          return NextResponse.json(
            { error: "path_name, start_node_id, end_node_id, and node_sequence are required" },
            { status: 400 }
          );
        }
        const path = await graphService.createPath(tenantId, {
          path_name: data.path_name,
          path_description: data.path_description,
          start_node_id: data.start_node_id,
          end_node_id: data.end_node_id,
          node_sequence: data.node_sequence,
          edge_sequence: data.edge_sequence,
        });
        return NextResponse.json({ success: true, path });
      }

      // =====================================================
      // Cluster Actions
      // =====================================================
      case "create_cluster": {
        if (!data.cluster_type || !data.cluster_name) {
          return NextResponse.json(
            { error: "cluster_type and cluster_name are required" },
            { status: 400 }
          );
        }
        const cluster = await graphService.createCluster(tenantId, {
          cluster_type: data.cluster_type,
          cluster_name: data.cluster_name,
          cluster_description: data.cluster_description,
          member_node_ids: data.member_node_ids,
          centroid_node_id: data.centroid_node_id,
        });
        return NextResponse.json({ success: true, cluster });
      }

      case "update_cluster": {
        if (!data.cluster_id) {
          return NextResponse.json(
            { error: "cluster_id is required" },
            { status: 400 }
          );
        }
        const cluster = await graphService.updateCluster(data.cluster_id, data.updates);
        return NextResponse.json({ success: true, cluster });
      }

      case "add_to_cluster": {
        if (!data.cluster_id || !data.node_id) {
          return NextResponse.json(
            { error: "cluster_id and node_id are required" },
            { status: 400 }
          );
        }
        const success = await graphService.addNodeToCluster(
          tenantId,
          data.cluster_id,
          data.node_id
        );
        return NextResponse.json({ success });
      }

      case "remove_from_cluster": {
        if (!data.cluster_id || !data.node_id) {
          return NextResponse.json(
            { error: "cluster_id and node_id are required" },
            { status: 400 }
          );
        }
        const success = await graphService.removeNodeFromCluster(
          tenantId,
          data.cluster_id,
          data.node_id
        );
        return NextResponse.json({ success });
      }

      // =====================================================
      // Analysis Actions
      // =====================================================
      case "run_analysis": {
        if (!data.analysis_type || !data.analysis_name) {
          return NextResponse.json(
            { error: "analysis_type and analysis_name are required" },
            { status: 400 }
          );
        }
        const analysis = await graphService.runAnalysis(
          tenantId,
          {
            analysis_type: data.analysis_type,
            analysis_name: data.analysis_name,
            target_node_ids: data.target_node_ids,
            target_cluster_ids: data.target_cluster_ids,
            target_path_ids: data.target_path_ids,
            forecast_horizon: data.forecast_horizon,
          },
          user.id
        );
        return NextResponse.json({ success: true, analysis });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[opportunity-graph POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
