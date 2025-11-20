/**
 * Strategy Graph Service - Phase 11 Week 1-2
 *
 * Constructs, links, and traverses strategy nodes based on autonomy domains.
 */

import { getSupabaseServer } from "@/lib/supabase";

// Types
export type NodeType = "OBJECTIVE" | "TACTIC" | "ACTION" | "METRIC" | "MILESTONE" | "CONSTRAINT";
export type EdgeType = "DEPENDS_ON" | "ENABLES" | "CONFLICTS_WITH" | "REINFORCES" | "MEASURES" | "BLOCKS" | "PARALLEL";
export type NodeStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED";
export type RiskLevel = "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK";

export interface StrategyNode {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  node_type: NodeType;
  domain: string;
  priority: number;
  risk_level: RiskLevel;
  status: NodeStatus;
  progress: number;
  estimated_duration_hours: number | null;
  actual_duration_hours: number | null;
  start_date: string | null;
  end_date: string | null;
  deadline: string | null;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  tags: string[];
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface StrategyEdge {
  id: string;
  organization_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: EdgeType;
  weight: number;
  is_critical: boolean;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateNodeRequest {
  organization_id: string;
  name: string;
  description?: string;
  node_type: NodeType;
  domain: string;
  priority?: number;
  risk_level?: RiskLevel;
  estimated_duration_hours?: number;
  deadline?: string;
  input_data?: Record<string, unknown>;
  tags?: string[];
  created_by?: string;
  assigned_to?: string;
}

export interface CreateEdgeRequest {
  organization_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: EdgeType;
  weight?: number;
  is_critical?: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphTraversalResult {
  nodes: StrategyNode[];
  edges: StrategyEdge[];
  paths: string[][];
  criticalPath: string[];
}

export class StrategyGraphService {
  /**
   * Create a new strategy node
   */
  async createNode(request: CreateNodeRequest): Promise<StrategyNode> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("strategy_nodes")
      .insert({
        organization_id: request.organization_id,
        name: request.name,
        description: request.description,
        node_type: request.node_type,
        domain: request.domain,
        priority: request.priority || 50,
        risk_level: request.risk_level || "MEDIUM_RISK",
        estimated_duration_hours: request.estimated_duration_hours,
        deadline: request.deadline,
        input_data: request.input_data || {},
        tags: request.tags || [],
        created_by: request.created_by,
        assigned_to: request.assigned_to,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create node: ${error.message}`);
    }

    return data;
  }

  /**
   * Create an edge between two nodes
   */
  async createEdge(request: CreateEdgeRequest): Promise<StrategyEdge> {
    const supabase = await getSupabaseServer();

    // Validate nodes exist
    const { data: sourceNode } = await supabase
      .from("strategy_nodes")
      .select("id")
      .eq("id", request.source_node_id)
      .single();

    const { data: targetNode } = await supabase
      .from("strategy_nodes")
      .select("id")
      .eq("id", request.target_node_id)
      .single();

    if (!sourceNode || !targetNode) {
      throw new Error("Source or target node not found");
    }

    // Check for cycles if DEPENDS_ON
    if (request.edge_type === "DEPENDS_ON") {
      const hasCycle = await this.wouldCreateCycle(
        request.source_node_id,
        request.target_node_id,
        request.organization_id
      );
      if (hasCycle) {
        throw new Error("Creating this edge would create a dependency cycle");
      }
    }

    const { data, error } = await supabase
      .from("strategy_edges")
      .insert({
        organization_id: request.organization_id,
        source_node_id: request.source_node_id,
        target_node_id: request.target_node_id,
        edge_type: request.edge_type,
        weight: request.weight || 1.0,
        is_critical: request.is_critical || false,
        description: request.description,
        metadata: request.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create edge: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a node by ID
   */
  async getNode(nodeId: string): Promise<StrategyNode | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("strategy_nodes")
      .select("*")
      .eq("id", nodeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get node: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all nodes for an organization
   */
  async getNodes(
    organizationId: string,
    options?: {
      domain?: string;
      nodeType?: NodeType;
      status?: NodeStatus;
    }
  ): Promise<StrategyNode[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("strategy_nodes")
      .select("*")
      .eq("organization_id", organizationId)
      .order("priority", { ascending: false });

    if (options?.domain) {
      query = query.eq("domain", options.domain);
    }
    if (options?.nodeType) {
      query = query.eq("node_type", options.nodeType);
    }
    if (options?.status) {
      query = query.eq("status", options.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get nodes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get edges for nodes
   */
  async getEdges(
    organizationId: string,
    nodeIds?: string[]
  ): Promise<StrategyEdge[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("strategy_edges")
      .select("*")
      .eq("organization_id", organizationId);

    if (nodeIds && nodeIds.length > 0) {
      query = query.or(
        `source_node_id.in.(${nodeIds.join(",")}),target_node_id.in.(${nodeIds.join(",")})`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get edges: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update a node
   */
  async updateNode(
    nodeId: string,
    updates: Partial<StrategyNode>
  ): Promise<StrategyNode> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("strategy_nodes")
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

    return data;
  }

  /**
   * Delete a node and its edges
   */
  async deleteNode(nodeId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from("strategy_nodes")
      .delete()
      .eq("id", nodeId);

    if (error) {
      throw new Error(`Failed to delete node: ${error.message}`);
    }
  }

  /**
   * Get the full graph for an organization
   */
  async getGraph(organizationId: string): Promise<GraphTraversalResult> {
    const nodes = await this.getNodes(organizationId);
    const edges = await this.getEdges(organizationId);

    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    nodes.forEach((n) => adjacency.set(n.id, []));

    edges
      .filter((e) => e.edge_type === "DEPENDS_ON" || e.edge_type === "ENABLES")
      .forEach((e) => {
        const targets = adjacency.get(e.source_node_id) || [];
        targets.push(e.target_node_id);
        adjacency.set(e.source_node_id, targets);
      });

    // Find all paths (simplified DFS)
    const paths: string[][] = [];
    const visited = new Set<string>();

    const findPaths = (nodeId: string, currentPath: string[]) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      currentPath.push(nodeId);
      const neighbors = adjacency.get(nodeId) || [];

      if (neighbors.length === 0) {
        paths.push([...currentPath]);
      } else {
        neighbors.forEach((neighbor) => {
          findPaths(neighbor, currentPath);
        });
      }

      currentPath.pop();
      visited.delete(nodeId);
    };

    // Start from nodes with no dependencies
    const dependentNodes = new Set(
      edges
        .filter((e) => e.edge_type === "DEPENDS_ON")
        .map((e) => e.source_node_id)
    );
    const rootNodes = nodes.filter((n) => !dependentNodes.has(n.id));

    rootNodes.forEach((root) => {
      findPaths(root.id, []);
    });

    // Find critical path (longest path with critical edges)
    const criticalPath = this.findCriticalPath(nodes, edges);

    return { nodes, edges, paths, criticalPath };
  }

  /**
   * Find critical path through the graph
   */
  private findCriticalPath(
    nodes: StrategyNode[],
    edges: StrategyEdge[]
  ): string[] {
    // Build adjacency with durations
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    nodes.forEach((n) => {
      adjacency.set(n.id, []);
      inDegree.set(n.id, 0);
    });

    edges
      .filter((e) => e.edge_type === "DEPENDS_ON" || e.is_critical)
      .forEach((e) => {
        adjacency.get(e.target_node_id)?.push(e.source_node_id);
        inDegree.set(e.source_node_id, (inDegree.get(e.source_node_id) || 0) + 1);
      });

    // Topological sort with longest path calculation
    const dist = new Map<string, number>();
    const prev = new Map<string, string | null>();
    nodes.forEach((n) => {
      dist.set(n.id, 0);
      prev.set(n.id, null);
    });

    // Start from nodes with no dependencies
    const queue: string[] = [];
    nodes.forEach((n) => {
      if (inDegree.get(n.id) === 0) {
        queue.push(n.id);
      }
    });

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodeMap.get(nodeId)!;
      const currentDist = dist.get(nodeId)! + (node.estimated_duration_hours || 1);

      const neighbors = adjacency.get(nodeId) || [];
      neighbors.forEach((neighbor) => {
        if (currentDist > dist.get(neighbor)!) {
          dist.set(neighbor, currentDist);
          prev.set(neighbor, nodeId);
        }

        const degree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, degree);
        if (degree === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Find the node with longest distance
    let maxDist = 0;
    let endNode = "";
    dist.forEach((d, nodeId) => {
      if (d > maxDist) {
        maxDist = d;
        endNode = nodeId;
      }
    });

    // Reconstruct path
    const path: string[] = [];
    let current: string | null = endNode;
    while (current) {
      path.unshift(current);
      current = prev.get(current) || null;
    }

    return path;
  }

  /**
   * Check if adding an edge would create a cycle
   */
  private async wouldCreateCycle(
    sourceId: string,
    targetId: string,
    organizationId: string
  ): Promise<boolean> {
    const edges = await this.getEdges(organizationId);
    const dependsOnEdges = edges.filter((e) => e.edge_type === "DEPENDS_ON");

    // Build reverse adjacency (from dependency to dependent)
    const reverseAdj = new Map<string, string[]>();
    dependsOnEdges.forEach((e) => {
      const deps = reverseAdj.get(e.target_node_id) || [];
      deps.push(e.source_node_id);
      reverseAdj.set(e.target_node_id, deps);
    });

    // Check if we can reach sourceId from targetId
    const visited = new Set<string>();
    const queue = [targetId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === sourceId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const deps = reverseAdj.get(current) || [];
      queue.push(...deps);
    }

    return false;
  }

  /**
   * Get dependencies of a node
   */
  async getDependencies(nodeId: string): Promise<StrategyNode[]> {
    const supabase = await getSupabaseServer();

    const { data: edges } = await supabase
      .from("strategy_edges")
      .select("target_node_id")
      .eq("source_node_id", nodeId)
      .eq("edge_type", "DEPENDS_ON");

    if (!edges || edges.length === 0) return [];

    const depIds = edges.map((e) => e.target_node_id);

    const { data: nodes, error } = await supabase
      .from("strategy_nodes")
      .select("*")
      .in("id", depIds);

    if (error) {
      throw new Error(`Failed to get dependencies: ${error.message}`);
    }

    return nodes || [];
  }

  /**
   * Get nodes that depend on this node
   */
  async getDependents(nodeId: string): Promise<StrategyNode[]> {
    const supabase = await getSupabaseServer();

    const { data: edges } = await supabase
      .from("strategy_edges")
      .select("source_node_id")
      .eq("target_node_id", nodeId)
      .eq("edge_type", "DEPENDS_ON");

    if (!edges || edges.length === 0) return [];

    const depIds = edges.map((e) => e.source_node_id);

    const { data: nodes, error } = await supabase
      .from("strategy_nodes")
      .select("*")
      .in("id", depIds);

    if (error) {
      throw new Error(`Failed to get dependents: ${error.message}`);
    }

    return nodes || [];
  }
}

export default StrategyGraphService;
