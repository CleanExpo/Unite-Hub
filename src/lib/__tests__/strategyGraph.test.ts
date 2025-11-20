/**
 * Strategy Graph Service Tests - Phase 11 Week 1-2
 *
 * 20 unit tests for graph construction, traversal, and objective planning.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn(() => Promise.resolve(mockSupabase)),
}));

import {
  StrategyGraphService,
  NodeType,
  EdgeType,
  RiskLevel,
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

      mockSupabase.single.mockResolvedValueOnce({ data: mockNode, error: null });

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

      mockSupabase.single.mockResolvedValueOnce({ data: mockNode, error: null });

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
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

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

      mockSupabase.single.mockResolvedValueOnce({ data: mockNode, error: null });

      const result = await service.getNode("node-1");

      expect(result?.name).toBe("Retrieved Node");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "node-1");
    });

    it("should return null for non-existent node", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

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

      mockSupabase.single.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const result = await service.updateNode("node-1", {
        progress: 50,
        status: "IN_PROGRESS",
      });

      expect(result.progress).toBe(50);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should delete a node", async () => {
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      await expect(service.deleteNode("node-1")).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith("strategy_nodes");
      expect(mockSupabase.delete).toHaveBeenCalled();
    });
  });

  describe("Edge Operations", () => {
    it("should create an edge between nodes", async () => {
      // Mock node existence checks
      mockSupabase.single
        .mockResolvedValueOnce({ data: { id: "node-1" }, error: null })
        .mockResolvedValueOnce({ data: { id: "node-2" }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: "edge-1",
            source_node_id: "node-1",
            target_node_id: "node-2",
            edge_type: "ENABLES",
          },
          error: null,
        });

      // Mock empty edges for cycle check
      mockSupabase.eq.mockReturnThis();

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
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { id: "node-2" }, error: null });

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

      mockSupabase.eq.mockResolvedValueOnce({ data: mockEdges, error: null });

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
        { id: "e1", source_node_id: "n2", target_node_id: "n1", edge_type: "ENABLES" },
      ];

      // Mock getNodes
      mockSupabase.order.mockResolvedValueOnce({ data: mockNodes, error: null });
      // Mock getEdges
      mockSupabase.eq.mockResolvedValueOnce({ data: mockEdges, error: null });

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

      mockSupabase.eq.mockResolvedValueOnce({ data: mockEdges, error: null });
      mockSupabase.in.mockResolvedValueOnce({ data: mockNodes, error: null });

      const result = await service.getDependencies("node-1");

      expect(result).toHaveLength(2);
    });

    it("should get dependents of a node", async () => {
      const mockEdges = [{ source_node_id: "dependent-1" }];
      const mockNodes = [{ id: "dependent-1", name: "Dependent Node" }];

      mockSupabase.eq.mockResolvedValueOnce({ data: mockEdges, error: null });
      mockSupabase.in.mockResolvedValueOnce({ data: mockNodes, error: null });

      const result = await service.getDependents("node-1");

      expect(result).toHaveLength(1);
    });

    it("should return empty array when no dependencies", async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null });

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

      // 2 critical signals = 30% traffic increase
      expect(result.estimatedImpact.trafficIncrease).toBe(30);
      // 2 critical signals = 20% conversion improvement
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

      mockSupabase.order.mockResolvedValueOnce({ data: mockProposals, error: null });

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

      mockSupabase.order.mockResolvedValueOnce({ data: mockProposals, error: null });

      const result = await service.getProposals("org-1", "ACTIVE");

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("ACTIVE");
    });
  });
});
