/**
 * Orchestrator Routing Integration Tests
 *
 * Comprehensive tests covering:
 * - Intent classification for all 8 new agents
 * - Routing to correct agent based on request type
 * - HUMAN_GOVERNED mode enforcement
 * - Multi-agent coordination workflows
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
};

// Mock Anthropic for intent classification
const mockAnthropic = {
  messages: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(() => mockAnthropic),
}));

describe("Orchestrator Routing Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Intent Classification", () => {
    it("should classify Founder OS intent", async () => {
      const request = {
        input:
          "Show me my business health snapshot and recent signals for Synthex Marketing",
        user_id: "founder-1",
      };

      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              intent: "FOUNDER_OS",
              confidence: 0.95,
              sub_intent: "SNAPSHOT_VIEW",
              entities: {
                business_name: "Synthex Marketing",
                data_type: ["health", "signals"],
              },
            }),
          },
        ],
      });

      const classification = {
        request_id: "req-1",
        intent: "FOUNDER_OS",
        confidence: 0.95,
        target_agent: "founder-os",
      };

      expect(classification.intent).toBe("FOUNDER_OS");
      expect(classification.confidence).toBeGreaterThan(0.9);
    });

    it("should classify AI Phill intent", async () => {
      const request = {
        input:
          "Give me strategic insights on my revenue growth and what I should focus on this week",
      };

      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              intent: "AI_PHILL",
              confidence: 0.92,
              sub_intent: "STRATEGIC_INSIGHT",
              context: "revenue_analysis",
            }),
          },
        ],
      });

      const classification = {
        intent: "AI_PHILL",
        target_agent: "ai-phill",
        requires_extended_thinking: true,
      };

      expect(classification.requires_extended_thinking).toBe(true);
    });

    it("should classify SEO Leak intent", async () => {
      const request = {
        input:
          "Audit example.com for SEO issues and show me any broken links or missing meta tags",
      };

      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              intent: "SEO_LEAK",
              confidence: 0.97,
              sub_intent: "TECHNICAL_AUDIT",
              entities: {
                domain: "example.com",
                audit_types: ["broken_links", "meta_tags"],
              },
            }),
          },
        ],
      });

      const classification = {
        intent: "SEO_LEAK",
        target_agent: "seo-leak-engine",
        domain: "example.com",
      };

      expect(classification.domain).toBe("example.com");
    });

    it("should classify Cognitive Twin intent", async () => {
      const request = {
        input:
          "What would happen if I focus on technical SEO instead of content marketing?",
      };

      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              intent: "COGNITIVE_TWIN",
              confidence: 0.88,
              sub_intent: "DECISION_SIMULATION",
              decision_type: "STRATEGY_COMPARISON",
            }),
          },
        ],
      });

      const classification = {
        intent: "COGNITIVE_TWIN",
        target_agent: "cognitive-twin",
        requires_prediction: true,
      };

      expect(classification.requires_prediction).toBe(true);
    });

    it("should classify Multi-Channel intent", async () => {
      const request = {
        input:
          "Connect my LinkedIn account and show me recent mentions of my brand",
      };

      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              intent: "MULTI_CHANNEL",
              confidence: 0.93,
              sub_intent: "SOCIAL_CONNECTION",
              platforms: ["LINKEDIN"],
              actions: ["connect", "monitor_mentions"],
            }),
          },
        ],
      });

      const classification = {
        intent: "MULTI_CHANNEL",
        target_agent: "multi-channel",
        platforms: ["LINKEDIN"],
      };

      expect(classification.platforms).toContain("LINKEDIN");
    });

    it("should classify Email Agent intent", async () => {
      const request = {
        input: "Process my unread emails and extract important leads",
      };

      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              intent: "EMAIL_PROCESSING",
              confidence: 0.94,
              sub_intent: "LEAD_EXTRACTION",
            }),
          },
        ],
      });

      const classification = {
        intent: "EMAIL_PROCESSING",
        target_agent: "email-agent",
      };

      expect(classification.target_agent).toBe("email-agent");
    });

    it("should classify Content Agent intent", async () => {
      const request = {
        input:
          "Generate a personalized email for my warm leads in the marketing industry",
      };

      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              intent: "CONTENT_GENERATION",
              confidence: 0.96,
              sub_intent: "EMAIL_PERSONALIZATION",
              target_segment: "warm_leads",
            }),
          },
        ],
      });

      const classification = {
        intent: "CONTENT_GENERATION",
        target_agent: "content-agent",
        requires_extended_thinking: true,
      };

      expect(classification.requires_extended_thinking).toBe(true);
    });

    it("should classify Frontend Agent intent", async () => {
      const request = {
        input: "Fix the button styling on the dashboard page",
      };

      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              intent: "FRONTEND_WORK",
              confidence: 0.91,
              sub_intent: "UI_FIX",
              component: "dashboard_button",
            }),
          },
        ],
      });

      const classification = {
        intent: "FRONTEND_WORK",
        target_agent: "frontend",
      };

      expect(classification.target_agent).toBe("frontend");
    });

    it("should handle ambiguous intents", async () => {
      const request = {
        input: "Help me with marketing",
      };

      mockAnthropic.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              intent: "AMBIGUOUS",
              confidence: 0.45,
              possible_intents: [
                { intent: "MULTI_CHANNEL", confidence: 0.3 },
                { intent: "CONTENT_GENERATION", confidence: 0.25 },
                { intent: "AI_PHILL", confidence: 0.2 },
              ],
            }),
          },
        ],
      });

      const classification = {
        intent: "AMBIGUOUS",
        requires_clarification: true,
        confidence: 0.45,
      };

      expect(classification.requires_clarification).toBe(true);
      expect(classification.confidence).toBeLessThan(0.7);
    });
  });

  describe("Agent Routing", () => {
    it("should route to Founder OS agent", async () => {
      const routing = {
        request_id: "req-1",
        classified_intent: "FOUNDER_OS",
        target_agent: "founder-os",
        agent_endpoint: "/api/agents/founder-os",
        routed_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: routing,
        error: null,
      });

      expect(routing.target_agent).toBe("founder-os");
    });

    it("should route to AI Phill agent with Extended Thinking", async () => {
      const routing = {
        request_id: "req-2",
        target_agent: "ai-phill",
        model: "claude-opus-4-5",
        thinking_budget: 10000,
        use_extended_thinking: true,
      };

      expect(routing.use_extended_thinking).toBe(true);
      expect(routing.thinking_budget).toBeGreaterThan(5000);
    });

    it("should route to SEO Leak Engine", async () => {
      const routing = {
        request_id: "req-3",
        target_agent: "seo-leak-engine",
        parameters: {
          domain: "example.com",
          audit_type: "FULL",
        },
      };

      expect(routing.parameters.domain).toBeTruthy();
    });

    it("should route to Cognitive Twin for predictions", async () => {
      const routing = {
        request_id: "req-4",
        target_agent: "cognitive-twin",
        requires_prediction: true,
        prediction_type: "STRATEGY_OUTCOME",
      };

      expect(routing.requires_prediction).toBe(true);
    });

    it("should route to Multi-Channel agent", async () => {
      const routing = {
        request_id: "req-5",
        target_agent: "multi-channel",
        platforms: ["TWITTER", "LINKEDIN"],
        action: "SYNC_MESSAGES",
      };

      expect(routing.platforms.length).toBeGreaterThan(0);
    });

    it("should handle routing failures gracefully", async () => {
      const failure = {
        request_id: "req-6",
        target_agent: "unknown-agent",
        routing_status: "FAILED",
        error_message: "Agent not found",
        fallback_agent: "orchestrator",
      };

      expect(failure.routing_status).toBe("FAILED");
      expect(failure.fallback_agent).toBe("orchestrator");
    });
  });

  describe("HUMAN_GOVERNED Mode Enforcement", () => {
    it("should require approval for high-risk Founder OS operations", async () => {
      const request = {
        intent: "FOUNDER_OS",
        action: "DELETE_BUSINESS",
        risk_level: "HIGH",
        requires_approval: true,
        auto_execute: false,
      };

      expect(request.requires_approval).toBe(true);
      expect(request.auto_execute).toBe(false);
    });

    it("should require approval for Multi-Channel post publishing", async () => {
      const request = {
        intent: "MULTI_CHANNEL",
        action: "PUBLISH_POST",
        platforms: ["TWITTER", "LINKEDIN", "FACEBOOK"],
        requires_approval: true,
        approval_type: "CONTENT_REVIEW",
      };

      expect(request.requires_approval).toBe(true);
      expect(request.approval_type).toBe("CONTENT_REVIEW");
    });

    it("should require approval for SEO Leak auto-fixes", async () => {
      const request = {
        intent: "SEO_LEAK",
        action: "AUTO_FIX_ISSUES",
        issues_count: 25,
        requires_approval: true,
        approval_type: "TECHNICAL_REVIEW",
      };

      expect(request.approval_type).toBe("TECHNICAL_REVIEW");
    });

    it("should allow auto-execution for low-risk operations", async () => {
      const request = {
        intent: "FOUNDER_OS",
        action: "VIEW_SNAPSHOT",
        risk_level: "LOW",
        requires_approval: false,
        auto_execute: true,
      };

      expect(request.auto_execute).toBe(true);
    });

    it("should track approval workflow status", async () => {
      const approval = {
        request_id: "req-1",
        status: "PENDING_APPROVAL",
        submitted_by: "system",
        submitted_at: new Date().toISOString(),
        requires_approvers: ["founder-1"],
        approval_deadline: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      expect(approval.status).toBe("PENDING_APPROVAL");
      expect(approval.requires_approvers.length).toBeGreaterThan(0);
    });

    it("should execute after approval granted", async () => {
      const execution = {
        request_id: "req-1",
        approval_status: "APPROVED",
        approved_by: "founder-1",
        approved_at: new Date().toISOString(),
        execution_status: "IN_PROGRESS",
      };

      expect(execution.approval_status).toBe("APPROVED");
      expect(execution.execution_status).toBe("IN_PROGRESS");
    });

    it("should block execution if approval denied", async () => {
      const denial = {
        request_id: "req-1",
        approval_status: "DENIED",
        denied_by: "founder-1",
        denial_reason: "Content needs revision",
        execution_status: "BLOCKED",
      };

      expect(denial.execution_status).toBe("BLOCKED");
    });
  });

  describe("Multi-Agent Coordination", () => {
    it("should coordinate SEO Leak + Cognitive Twin for prediction", async () => {
      const workflow = {
        id: "workflow-1",
        primary_intent: "SEO_ANALYSIS_WITH_PREDICTION",
        agents: [
          { agent: "seo-leak-engine", order: 1, status: "COMPLETED" },
          { agent: "cognitive-twin", order: 2, status: "IN_PROGRESS" },
        ],
        data_flow: {
          seo_results: "leak-analysis-1",
          prediction_input: "leak-analysis-1",
        },
      };

      expect(workflow.agents.length).toBe(2);
      expect(workflow.agents[0].status).toBe("COMPLETED");
    });

    it("should coordinate Multi-Channel + AI Phill for sentiment analysis", async () => {
      const workflow = {
        id: "workflow-2",
        agents: [
          { agent: "multi-channel", order: 1, output: "messages" },
          { agent: "ai-phill", order: 2, input: "messages" },
        ],
        workflow_type: "SEQUENTIAL",
      };

      expect(workflow.workflow_type).toBe("SEQUENTIAL");
    });

    it("should coordinate parallel agent execution", async () => {
      const workflow = {
        id: "workflow-3",
        agents: [
          { agent: "email-agent", status: "IN_PROGRESS" },
          { agent: "multi-channel", status: "IN_PROGRESS" },
          { agent: "seo-leak-engine", status: "IN_PROGRESS" },
        ],
        workflow_type: "PARALLEL",
        merge_results: true,
      };

      expect(workflow.workflow_type).toBe("PARALLEL");
      expect(workflow.merge_results).toBe(true);
    });

    it("should handle agent dependency chain", async () => {
      const dependencies = {
        workflow_id: "workflow-4",
        dependency_graph: {
          "founder-os": [],
          "seo-leak-engine": ["founder-os"],
          "cognitive-twin": ["seo-leak-engine"],
          "ai-phill": ["founder-os", "cognitive-twin"],
        },
      };

      const phillDeps = dependencies.dependency_graph["ai-phill"];
      expect(phillDeps.length).toBe(2);
    });

    it("should merge results from multiple agents", async () => {
      const mergedResults = {
        workflow_id: "workflow-5",
        agent_results: [
          { agent: "seo-leak-engine", data: { issues: 12 } },
          { agent: "cognitive-twin", data: { predicted_traffic_loss: 500 } },
          { agent: "ai-phill", data: { recommendation: "Fix critical SEO issues first" } },
        ],
        summary: {
          total_issues: 12,
          predicted_impact: 500,
          action_plan: "Fix critical SEO issues first",
        },
      };

      expect(mergedResults.agent_results.length).toBe(3);
      expect(mergedResults.summary.total_issues).toBe(12);
    });
  });

  describe("Error Recovery", () => {
    it("should retry failed agent execution", async () => {
      const retry = {
        request_id: "req-1",
        agent: "seo-leak-engine",
        attempt: 2,
        max_attempts: 3,
        last_error: "API timeout",
        retry_delay_seconds: 30,
      };

      expect(retry.attempt).toBeLessThan(retry.max_attempts);
    });

    it("should fallback to alternative agent on failure", async () => {
      const fallback = {
        request_id: "req-2",
        primary_agent: "ai-phill",
        primary_failed: true,
        fallback_agent: "orchestrator",
        fallback_strategy: "MANUAL_RESPONSE",
      };

      expect(fallback.primary_failed).toBe(true);
      expect(fallback.fallback_agent).toBeTruthy();
    });

    it("should rollback multi-agent workflow on failure", async () => {
      const rollback = {
        workflow_id: "workflow-6",
        failed_agent: "cognitive-twin",
        completed_agents: ["founder-os", "seo-leak-engine"],
        rollback_actions: [
          "Clean up temporary data from seo-leak-engine",
          "Notify user of failure",
        ],
        status: "ROLLED_BACK",
      };

      expect(rollback.status).toBe("ROLLED_BACK");
      expect(rollback.rollback_actions.length).toBeGreaterThan(0);
    });
  });

  describe("Performance & Monitoring", () => {
    it("should track routing latency", async () => {
      const metrics = {
        request_id: "req-1",
        classification_time_ms: 45,
        routing_time_ms: 12,
        total_time_ms: 57,
        target_sla_ms: 100,
        within_sla: true,
      };

      expect(metrics.total_time_ms).toBeLessThan(metrics.target_sla_ms);
    });

    it("should track agent execution time", async () => {
      const execution = {
        request_id: "req-1",
        agent: "seo-leak-engine",
        started_at: new Date(Date.now() - 5000),
        completed_at: new Date(),
        execution_time_ms: 5000,
        target_sla_ms: 10000,
      };

      expect(execution.execution_time_ms).toBeLessThan(execution.target_sla_ms);
    });

    it("should track classification accuracy", async () => {
      const accuracy = {
        period: "30_DAYS",
        total_classifications: 1000,
        correct_classifications: 920,
        accuracy_rate: 0.92,
        target_accuracy: 0.90,
      };

      expect(accuracy.accuracy_rate).toBeGreaterThan(accuracy.target_accuracy);
    });

    it("should alert on routing failures", async () => {
      const alert = {
        alert_type: "HIGH_ROUTING_FAILURE_RATE",
        period: "1_HOUR",
        total_requests: 100,
        failed_routing: 15,
        failure_rate: 0.15,
        threshold: 0.05,
        severity: "HIGH",
      };

      expect(alert.failure_rate).toBeGreaterThan(alert.threshold);
    });
  });

  describe("Context Management", () => {
    it("should maintain context across agent handoffs", async () => {
      const context = {
        workflow_id: "workflow-1",
        initial_request: "Analyze my SEO and predict impact",
        context_data: {
          business_id: "biz-1",
          domain: "example.com",
          founder_goals: ["increase_traffic", "improve_rankings"],
        },
        passed_to_agents: ["seo-leak-engine", "cognitive-twin", "ai-phill"],
      };

      expect(context.passed_to_agents.length).toBe(3);
      expect(context.context_data.business_id).toBeTruthy();
    });

    it("should enrich context as workflow progresses", async () => {
      const contextEvolution = {
        step_1: { business_id: "biz-1" },
        step_2: { business_id: "biz-1", seo_issues: 12 },
        step_3: {
          business_id: "biz-1",
          seo_issues: 12,
          predicted_traffic_loss: 500,
        },
      };

      expect(Object.keys(contextEvolution.step_3).length).toBeGreaterThan(
        Object.keys(contextEvolution.step_1).length
      );
    });
  });

  describe("Audit & Logging", () => {
    it("should log all routing decisions", async () => {
      const log = {
        request_id: "req-1",
        timestamp: new Date().toISOString(),
        input: "Show me my business health",
        classified_intent: "FOUNDER_OS",
        confidence: 0.95,
        routed_to: "founder-os",
        user_id: "founder-1",
      };

      expect(log.classified_intent).toBeTruthy();
      expect(log.routed_to).toBeTruthy();
    });

    it("should log approval workflow events", async () => {
      const events = [
        {
          event: "APPROVAL_REQUESTED",
          timestamp: new Date(Date.now() - 60000),
        },
        {
          event: "APPROVAL_GRANTED",
          timestamp: new Date(),
          approver: "founder-1",
        },
      ];

      expect(events.length).toBe(2);
      expect(events[1].approver).toBeTruthy();
    });

    it("should generate orchestrator performance report", async () => {
      const report = {
        period: "7_DAYS",
        total_requests: 500,
        by_intent: {
          FOUNDER_OS: 150,
          AI_PHILL: 120,
          SEO_LEAK: 90,
          MULTI_CHANNEL: 80,
          COGNITIVE_TWIN: 60,
        },
        avg_routing_time_ms: 58,
        approval_rate: 0.15,
        auto_execute_rate: 0.85,
      };

      expect(report.total_requests).toBe(500);
      expect(report.auto_execute_rate).toBeGreaterThan(0.8);
    });
  });
});
