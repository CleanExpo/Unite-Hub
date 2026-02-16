/**
 * Strategy Graph Service Tests - Phase 11 Week 1-2
 *
 * 20 unit tests for graph construction, traversal, and objective planning.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a fully chainable mock for Supabase
const { mockSupabase, setQueryResults } = vi.hoisted(() => {
  let queryResults: any[] = [];
  let queryIndex = 0;

  const createQueryChain = () => {
    const chain: any = {};
    const methods = [
      "select", "insert", "update", "delete", "upsert",
      "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
      "is", "in", "or", "not", "order", "limit", "range",
      "match", "filter", "contains", "containedBy", "textSearch",
    ];
    methods.forEach((m) => {
      chain[m] = vi.fn().mockReturnValue(chain);
    });
    chain.single = vi.fn().mockImplementation(() => {
      const result = queryResults[queryIndex] || { data: null, error: null };
      queryIndex++;
      return Promise.resolve(result);
    });
    chain.maybeSingle = vi.fn().mockImplementation(() => {
      const result = queryResults[queryIndex] || { data: null, error: null };
      queryIndex++;
      return Promise.resolve(result);
    });
    chain.then = vi.fn().mockImplementation((resolve: any, reject?: any) => {
      const result = queryResults[queryIndex] || { data: [], error: null };
      queryIndex++;
      return Promise.resolve(result).then(resolve, reject);
    });
    return chain;
  };

  const queryChain = createQueryChain();
  const mock: any = {
    from: vi.fn().mockReturnValue(queryChain),
  };
  const chainMethods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
    "is", "in", "or", "not", "order", "limit", "range",
    "match", "filter", "contains", "containedBy", "textSearch",
    "single", "maybeSingle",
  ];
  chainMethods.forEach((m) => {
    mock[m] = queryChain[m];
  });

  return {
    mockSupabase: mock,
    setQueryResults: (results: any[]) => {
      queryResults = results;
      queryIndex = 0;
    },
  };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import {
  StrategyGraphService,
  CreateNodeRequest,
  CreateEdgeRequest,
} from "../strategy/strategyGraphService";

import {
  StrategyPlannerService,
  AuditSignal,
  OperatorFeedback,
} from "../strategy/strategyPlannerService";

describe("StrategyGraphService", () => {
  let service: StrategyGraphService;

  beforeEach(() => {
    service = new StrategyGraphService();
    vi.clearAllMocks();
  });

  describe("Node Operations", () => {
    it("should create a node with default values", async () => {
      const mockNode = {
        id: "node-1",
        organization_id: "org-1",
        name: "Test Node",
        node_type: "ACTION",
        domain: "SEO",
        priority: 50,
        risk_level: "MEDIUM_RISK",
        status: "PLANNED",
        progress: 0,
      };

      setQueryResults([
        { data: mockNode, error: null },
      ]);

      const request: CreateNodeRequest = {
        organization_id: "org-1",
        name: "Test Node",
        node_type: "ACTION",
        domain: "SEO",
      };

      const result = await service.createNode(request);

      expect(result.name).toBe("Test Node");
      expect(mockSupabase.from).toHaveBeenCalledWith("strategy_nodes");
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it("should create a node with custom priority and risk", async () => {
      const mockNode = {
        id: "node-2",
        organization_id: "org-1",
        name: "High Priority Node",
        node_type: "OBJECTIVE",
        domain: "GEO",
        priority: 90,
        risk_level: "HIGH_RISK",
      };

      setQueryResults([
        { data: mockNode, error: null },
      ]);

      const request: CreateNodeRequest = {
        organization_id: "org-1",
        name: "High Priority Node",
        node_type: "OBJECTIVE",
        domain: "GEO",
        priority: 90,
        risk_level: "HIGH_RISK",
      };

      const result = await service.createNode(request);

      expect(result.priority).toBe(90);
      expect(result.risk_level).toBe("HIGH_RISK");
    });

    it("should throw error when node creation fails", async () => {
      setQueryResults([
        { data: null, error: { message: "Database error" } },
      ]);

      const request: CreateNodeRequest = {
        organization_id: "org-1",
        name: "Failed Node",
        node_type: "ACTION",
        domain: "SEO",
      };

      await expect(service.createNode(request)).rejects.toThrow("Failed to create node");
    });

    it("should get a node by ID", async () => {
      const mockNode = {
        id: "node-1",
        name: "Retrieved Node",
        node_type: "TACTIC",
      };

      setQueryResults([
        { data: mockNode, error: null },
      ]);

      const result = await service.getNode("node-1");

      expect(result?.name).toBe("Retrieved Node");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "node-1");
    });

    it("should return null for non-existent node", async () => {
      setQueryResults([
        { data: null, error: { code: "PGRST116" } },
      ]);

      const result = await service.getNode("non-existent");

      expect(result).toBeNull();
    });

    it("should update a node", async () => {
      const mockUpdated = {
        id: "node-1",
        name: "Updated Node",
        progress: 50,
        status: "IN_PROGRESS",
      };

      setQueryResults([
        { data: mockUpdated, error: null },
      ]);

      const result = await service.updateNode("node-1", {
        progress: 50,
        status: "IN_PROGRESS",
      });

      expect(result.progress).toBe(50);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should delete a node", async () => {
      // deleteNode: .from().delete().eq() -> thenable
      setQueryResults([
        { data: null, error: null },
      ]);

      await expect(service.deleteNode("node-1")).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith("strategy_nodes");
      expect(mockSupabase.delete).toHaveBeenCalled();
    });
  });

  describe("Edge Operations", () => {
    it("should create an edge between nodes", async () => {
      // createEdge flow:
      // 1. source node .single()
      // 2. target node .single()
      // 3. insert edge .single()
      setQueryResults([
        { data: { id: "node-1" }, error: null },
        { data: { id: "node-2" }, error: null },
        { data: { id: "edge-1", source_node_id: "node-1", target_node_id: "node-2", edge_type: "ENABLES" }, error: null },
      ]);

      const request: CreateEdgeRequest = {
        organization_id: "org-1",
        source_node_id: "node-1",
        target_node_id: "node-2",
        edge_type: "ENABLES",
      };

      const result = await service.createEdge(request);

      expect(result.edge_type).toBe("ENABLES");
    });

    it("should throw error when source node not found", async () => {
      setQueryResults([
        { data: null, error: null },
        { data: { id: "node-2" }, error: null },
      ]);

      const request: CreateEdgeRequest = {
        organization_id: "org-1",
        source_node_id: "non-existent",
        target_node_id: "node-2",
        edge_type: "DEPENDS_ON",
      };

      await expect(service.createEdge(request)).rejects.toThrow(
        "Source or target node not found"
      );
    });

    it("should get edges for organization", async () => {
      const mockEdges = [
        { id: "edge-1", source_node_id: "n1", target_node_id: "n2" },
        { id: "edge-2", source_node_id: "n2", target_node_id: "n3" },
      ];

      // getEdges: .from().select().eq() -> thenable (no nodeIds filter)
      setQueryResults([
        { data: mockEdges, error: null },
      ]);

      const result = await service.getEdges("org-1");

      expect(result).toHaveLength(2);
    });
  });

  describe("Graph Traversal", () => {
    it("should get full graph for organization", async () => {
      const mockNodes = [
        { id: "n1", name: "Node 1", node_type: "OBJECTIVE" },
        { id: "n2", name: "Node 2", node_type: "TACTIC" },
      ];
      const mockEdges = [
        { id: "e1", source_node_id: "n2", target_node_id: "n1", edge_type: "ENABLES", is_critical: false },
      ];

      // getGraph calls getNodes then getEdges:
      // 1. getNodes: .from().select().eq().order() -> thenable
      // 2. getEdges: .from().select().eq() -> thenable
      setQueryResults([
        { data: mockNodes, error: null },
        { data: mockEdges, error: null },
      ]);

      const result = await service.getGraph("org-1");

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
      expect(result.paths).toBeDefined();
      expect(result.criticalPath).toBeDefined();
    });

    it("should get dependencies of a node", async () => {
      const mockEdges = [
        { target_node_id: "dep-1" },
        { target_node_id: "dep-2" },
      ];
      const mockNodes = [
        { id: "dep-1", name: "Dependency 1" },
        { id: "dep-2", name: "Dependency 2" },
      ];

      // getDependencies:
      // 1. get edges .from().select().eq().eq() -> thenable
      // 2. get nodes .from().select().in() -> thenable
      setQueryResults([
        { data: mockEdges, error: null },
        { data: mockNodes, error: null },
      ]);

      const result = await service.getDependencies("node-1");

      expect(result).toHaveLength(2);
    });

    it("should get dependents of a node", async () => {
      const mockEdges = [{ source_node_id: "dependent-1" }];
      const mockNodes = [{ id: "dependent-1", name: "Dependent Node" }];

      // getDependents:
      // 1. get edges -> thenable
      // 2. get nodes -> thenable
      setQueryResults([
        { data: mockEdges, error: null },
        { data: mockNodes, error: null },
      ]);

      const result = await service.getDependents("node-1");

      expect(result).toHaveLength(1);
    });

    it("should return empty array when no dependencies", async () => {
      setQueryResults([
        { data: [], error: null },
      ]);

      const result = await service.getDependencies("node-1");

      expect(result).toHaveLength(0);
    });
  });
});

describe("StrategyPlannerService", () => {
  let service: StrategyPlannerService;

  beforeEach(() => {
    service = new StrategyPlannerService();
    vi.clearAllMocks();
  });

  describe("Proposal Generation", () => {
    it("should generate proposal from audit signals", async () => {
      const signals: AuditSignal[] = [
        {
          type: "SEO",
          severity: "HIGH",
          metric: "Page Speed",
          currentValue: 40,
          targetValue: 90,
          description: "Page speed needs improvement",
          domain: "TECHNICAL",
        },
      ];

      const result = await service.generateProposalFromSignals("org-1", signals);

      expect(result.id).toBeDefined();
      expect(result.organization_id).toBe("org-1");
      expect(result.objectives.length).toBeGreaterThan(0);
      expect(result.tactics.length).toBeGreaterThan(0);
      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.status).toBe("DRAFT");
    });

    it("should generate proposal with multiple signals", async () => {
      const signals: AuditSignal[] = [
        {
          type: "SEO",
          severity: "CRITICAL",
          metric: "Organic Traffic",
          currentValue: 1000,
          targetValue: 5000,
          description: "Low organic traffic",
          domain: "SEO",
        },
        {
          type: "GEO",
          severity: "HIGH",
          metric: "Local Rankings",
          currentValue: 15,
          targetValue: 3,
          description: "Poor local rankings",
          domain: "GEO",
        },
        {
          type: "CONTENT",
          severity: "MEDIUM",
          metric: "Content Quality",
          currentValue: 60,
          targetValue: 85,
          description: "Content needs optimization",
          domain: "CONTENT",
        },
      ];

      const result = await service.generateProposalFromSignals("org-1", signals);

      expect(result.objectives.length).toBe(3);
      expect(result.estimatedImpact.trafficIncrease).toBeGreaterThan(0);
    });

    it("should apply operator feedback to proposal", async () => {
      const signals: AuditSignal[] = [
        {
          type: "SEO",
          severity: "HIGH",
          metric: "Backlinks",
          currentValue: 50,
          targetValue: 200,
          description: "Need more backlinks",
          domain: "BACKLINK",
        },
      ];

      const feedback: OperatorFeedback[] = [
        {
          feedbackType: "ESCALATION",
          context: "backlinks",
          priority: 20,
        },
      ];

      const result = await service.generateProposalFromSignals("org-1", signals, feedback);

      expect(result.objectives[0].priority).toBeGreaterThanOrEqual(100);
    });

    it("should calculate impact estimate correctly", async () => {
      const signals: AuditSignal[] = [
        {
          type: "SEO",
          severity: "CRITICAL",
          metric: "Core Web Vitals",
          currentValue: 30,
          targetValue: 90,
          description: "Critical performance issue",
          domain: "TECHNICAL",
        },
        {
          type: "SEO",
          severity: "CRITICAL",
          metric: "Mobile Usability",
          currentValue: 40,
          targetValue: 95,
          description: "Mobile usability critical",
          domain: "TECHNICAL",
        },
      ];

      const result = await service.generateProposalFromSignals("org-1", signals);

      expect(result.estimatedImpact.trafficIncrease).toBe(30);
      expect(result.estimatedImpact.conversionImprovement).toBe(20);
    });

    it("should assess risks correctly", async () => {
      const signals: AuditSignal[] = [
        {
          type: "SEO",
          severity: "CRITICAL",
          metric: "Security",
          currentValue: 20,
          targetValue: 100,
          description: "Critical security issue",
          domain: "TECHNICAL",
        },
      ];

      const result = await service.generateProposalFromSignals("org-1", signals);

      expect(result.riskAssessment.overallRisk).toBe("HIGH_RISK");
      expect(result.riskAssessment.factors.length).toBeGreaterThan(0);
    });

    it("should estimate timeline based on actions", async () => {
      const signals: AuditSignal[] = [
        {
          type: "SEO",
          severity: "MEDIUM",
          metric: "Meta Tags",
          currentValue: 50,
          targetValue: 90,
          description: "Optimize meta tags",
          domain: "SEO",
        },
      ];

      const result = await service.generateProposalFromSignals("org-1", signals);

      expect(result.timeline.totalWeeks).toBeGreaterThan(0);
      expect(result.timeline.phases.length).toBeGreaterThan(0);
    });

    it("should generate appropriate proposal title", async () => {
      const signals: AuditSignal[] = [
        {
          type: "SEO",
          severity: "HIGH",
          metric: "Keyword Rankings",
          currentValue: 25,
          targetValue: 5,
          description: "Improve rankings",
          domain: "SEO",
        },
      ];

      const result = await service.generateProposalFromSignals("org-1", signals);

      expect(result.title).toContain("Improve Keyword Rankings");
    });

    it("should generate multi-domain title for multiple objectives", async () => {
      const signals: AuditSignal[] = [
        {
          type: "SEO",
          severity: "HIGH",
          metric: "Traffic",
          currentValue: 100,
          targetValue: 500,
          description: "Increase traffic",
          domain: "SEO",
        },
        {
          type: "GEO",
          severity: "HIGH",
          metric: "Local Visibility",
          currentValue: 30,
          targetValue: 80,
          description: "Improve local",
          domain: "GEO",
        },
      ];

      const result = await service.generateProposalFromSignals("org-1", signals);

      expect(result.title).toContain("Multi-Domain Strategy");
    });
  });

  describe("Proposal Management", () => {
    it("should get proposals for organization", async () => {
      const mockProposals = [
        {
          id: "p1",
          organization_id: "org-1",
          title: "SEO Strategy",
          description: "Test",
          objectives: [],
          tactics: [],
          actions: [],
          metrics: [],
          estimated_impact: {},
          risk_assessment: {},
          timeline: {},
          status: "DRAFT",
          created_at: new Date().toISOString(),
        },
      ];

      // getProposals: .from().select().eq().order() -> thenable
      setQueryResults([
        { data: mockProposals, error: null },
      ]);

      const result = await service.getProposals("org-1");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("SEO Strategy");
    });

    it("should filter proposals by status", async () => {
      const mockProposals = [
        {
          id: "p1",
          organization_id: "org-1",
          title: "Active Strategy",
          status: "ACTIVE",
          objectives: [],
          tactics: [],
          actions: [],
          metrics: [],
          estimated_impact: {},
          risk_assessment: {},
          timeline: {},
          created_at: new Date().toISOString(),
        },
      ];

      // getProposals with status: .from().select().eq().order().eq() -> thenable
      setQueryResults([
        { data: mockProposals, error: null },
      ]);

      const result = await service.getProposals("org-1", "ACTIVE");

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("ACTIVE");
    });
  });
});
