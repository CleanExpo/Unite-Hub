/**
 * Guardrail Policy Service Tests - Phase 10 Week 7-8
 *
 * Tests for guardrail evaluation, sandbox simulations, and playbook rules.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a chainable mock that properly returns itself for all methods
const createChainableMock = (finalValue: any = { data: null, error: null }) => {
  const chain: any = {
    from: vi.fn(() => chain),
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(finalValue)),
    then: vi.fn((resolve: any) => Promise.resolve(finalValue).then(resolve)),
  };
  return chain;
};

// Default mock that returns empty data
const mockSupabase = createChainableMock({ data: [], error: null });

vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn(() => Promise.resolve(mockSupabase)),
  getSupabaseAdmin: vi.fn(() => mockSupabase),
  getSupabaseServerWithAuth: vi.fn(() => mockSupabase),
  supabase: mockSupabase,
  supabaseBrowser: mockSupabase,
  supabaseAdmin: mockSupabase,
}));

// Import after mocking
import { GuardrailPolicyService } from "../operator/guardrailPolicyService";

describe("GuardrailPolicyService", () => {
  let service: GuardrailPolicyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GuardrailPolicyService();
  });

  describe("Guardrail Evaluation", () => {
    it("should return ALLOW when no rules match", async () => {
      // Mock no assignments
      mockSupabase.or.mockReturnValueOnce({
        data: [],
        error: null,
      });

      // Mock insert for evaluation log
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({ error: null }),
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
      });

      expect(result.action).toBe("ALLOW");
      expect(result.evaluatedRules).toHaveLength(0);
    });

    it("should apply BLOCK action when rule conditions match", async () => {
      // Mock operator profile
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "ANALYST" },
        error: null,
      });

      // Mock assignments
      mockSupabase.or.mockReturnValueOnce({
        data: [{ playbook_id: "pb-1" }],
        error: null,
      });

      // Mock playbooks
      mockSupabase.or.mockReturnValueOnce({
        data: [{ id: "pb-1" }],
        error: null,
      });

      // Mock rules
      mockSupabase.order.mockReturnValueOnce({
        data: [
          {
            id: "rule-1",
            playbook_id: "pb-1",
            rule_name: "Block low scores",
            rule_type: "GUARDRAIL",
            conditions: { operator_score: "<50" },
            action: "BLOCK",
            action_params: {},
            priority: 100,
            is_active: true,
          },
        ],
        error: null,
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
        operatorScore: 30,
      });

      expect(result.action).toBe("BLOCK");
      expect(result.blockingRuleId).toBe("rule-1");
    });

    it("should apply REQUIRE_QUORUM action with quorum size", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "MANAGER" },
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ playbook_id: "pb-1" }],
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ id: "pb-1" }],
        error: null,
      });

      mockSupabase.order.mockReturnValueOnce({
        data: [
          {
            id: "rule-1",
            rule_name: "Require quorum for high risk",
            rule_type: "GUARDRAIL",
            conditions: { risk_level: "HIGH_RISK" },
            action: "REQUIRE_QUORUM",
            action_params: { quorum_size: 3 },
            priority: 100,
            is_active: true,
          },
        ],
        error: null,
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
        riskLevel: "HIGH_RISK",
      });

      expect(result.action).toBe("REQUIRE_QUORUM");
      expect(result.requiresQuorum).toBe(true);
      expect(result.quorumSize).toBe(3);
    });

    it("should collect coaching hints from COACHING rules", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "ANALYST" },
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ playbook_id: "pb-1" }],
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ id: "pb-1" }],
        error: null,
      });

      mockSupabase.order.mockReturnValueOnce({
        data: [
          {
            id: "rule-1",
            rule_name: "Coach new operators",
            rule_type: "COACHING",
            conditions: {},
            action: "COACH",
            action_params: { hint_type: "TIP" },
            coaching_message: "Take your time to review carefully",
            coaching_severity: "INFO",
            priority: 50,
            is_active: true,
          },
        ],
        error: null,
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
      });

      expect(result.coachingHints).toHaveLength(1);
      expect(result.coachingHints[0].message).toBe("Take your time to review carefully");
      expect(result.coachingHints[0].type).toBe("TIP");
    });

    it("should apply more restrictive action between multiple rules", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "MANAGER" },
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ playbook_id: "pb-1" }],
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ id: "pb-1" }],
        error: null,
      });

      mockSupabase.order.mockReturnValueOnce({
        data: [
          {
            id: "rule-1",
            rule_name: "Allow normal",
            rule_type: "GUARDRAIL",
            conditions: {},
            action: "ALLOW",
            action_params: {},
            priority: 100,
            is_active: true,
          },
          {
            id: "rule-2",
            rule_name: "Simulate for testing",
            rule_type: "GUARDRAIL",
            conditions: {},
            action: "SIMULATE",
            action_params: {},
            priority: 90,
            is_active: true,
          },
        ],
        error: null,
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
      });

      // SIMULATE is more restrictive than ALLOW
      expect(result.action).toBe("SIMULATE");
      expect(result.sandboxOnly).toBe(true);
    });

    it("should set sandboxOnly when in sandbox mode", async () => {
      mockSupabase.or.mockReturnValueOnce({
        data: [],
        error: null,
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
        isSandboxMode: true,
      });

      expect(result.sandboxOnly).toBe(true);
    });
  });

  describe("Condition Evaluation", () => {
    it("should match operator_score < threshold", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "ANALYST" },
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ playbook_id: "pb-1" }],
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ id: "pb-1" }],
        error: null,
      });

      mockSupabase.order.mockReturnValueOnce({
        data: [
          {
            id: "rule-1",
            rule_name: "Block low",
            rule_type: "GUARDRAIL",
            conditions: { operator_score: "<40" },
            action: "BLOCK",
            action_params: {},
            priority: 100,
            is_active: true,
          },
        ],
        error: null,
      });

      // Score 30 < 40, should match
      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
        operatorScore: 30,
      });

      expect(result.action).toBe("BLOCK");
    });

    it("should not match when operator_score >= threshold", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "ANALYST" },
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ playbook_id: "pb-1" }],
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ id: "pb-1" }],
        error: null,
      });

      mockSupabase.order.mockReturnValueOnce({
        data: [
          {
            id: "rule-1",
            rule_name: "Block low",
            rule_type: "GUARDRAIL",
            conditions: { operator_score: "<40" },
            action: "BLOCK",
            action_params: {},
            priority: 100,
            is_active: true,
          },
        ],
        error: null,
      });

      // Score 50 >= 40, should not match
      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
        operatorScore: 50,
      });

      expect(result.action).toBe("ALLOW");
    });

    it("should match domain condition", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "MANAGER" },
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ playbook_id: "pb-1" }],
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ id: "pb-1" }],
        error: null,
      });

      mockSupabase.order.mockReturnValueOnce({
        data: [
          {
            id: "rule-1",
            rule_name: "Extra care for SEO",
            rule_type: "GUARDRAIL",
            conditions: { domain: "SEO" },
            action: "REQUIRE_QUORUM",
            action_params: { quorum_size: 2 },
            priority: 100,
            is_active: true,
          },
        ],
        error: null,
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
        domain: "SEO",
      });

      expect(result.action).toBe("REQUIRE_QUORUM");
    });

    it("should not match when domain differs", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "MANAGER" },
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ playbook_id: "pb-1" }],
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ id: "pb-1" }],
        error: null,
      });

      mockSupabase.order.mockReturnValueOnce({
        data: [
          {
            id: "rule-1",
            rule_name: "Extra care for SEO",
            rule_type: "GUARDRAIL",
            conditions: { domain: "SEO" },
            action: "BLOCK",
            action_params: {},
            priority: 100,
            is_active: true,
          },
        ],
        error: null,
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
        domain: "EMAIL",
      });

      expect(result.action).toBe("ALLOW");
    });
  });

  describe("Sandbox Simulation", () => {
    it("should simulate EMAIL_SEND execution", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "sim-1" },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({ error: null }),
      });

      const result = await service.runSandboxSimulation(
        "org-1",
        "op-1",
        "EMAIL_SEND",
        {
          recipients: ["test@example.com"],
          subject: "Test",
          body: "Test content",
        }
      );

      expect(result.wouldHaveSucceeded).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.simulatedSideEffects.length).toBeGreaterThan(0);
    });

    it("should fail EMAIL_SEND simulation when missing fields", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "sim-1" },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({ error: null }),
      });

      const result = await service.runSandboxSimulation(
        "org-1",
        "op-1",
        "EMAIL_SEND",
        {
          recipients: ["test@example.com"],
          // Missing subject and body
        }
      );

      expect(result.wouldHaveSucceeded).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should simulate CONTENT_PUBLISH with warnings", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "sim-1" },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({ error: null }),
      });

      const result = await service.runSandboxSimulation(
        "org-1",
        "op-1",
        "CONTENT_PUBLISH",
        {
          channel: "blog",
          content: "Short", // Too short
        }
      );

      expect(result.wouldHaveSucceeded).toBe(true);
      expect(result.warnings).toContain(
        "Content may be too short for optimal engagement"
      );
    });

    it("should simulate DATA_UPDATE execution", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "sim-1" },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({ error: null }),
      });

      const result = await service.runSandboxSimulation(
        "org-1",
        "op-1",
        "DATA_UPDATE",
        {
          recordCount: 5,
        }
      );

      expect(result.wouldHaveSucceeded).toBe(true);
      expect(result.simulatedSideEffects[0].type).toBe("RECORDS_MODIFIED");
    });
  });

  describe("Coaching Hints", () => {
    it("should record coaching hints when shown", async () => {
      // Mock score fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: { reliability_score: 60, accuracy_score: 55 },
        error: null,
      });

      // Mock evaluateGuardrails (simplified)
      mockSupabase.or.mockReturnValueOnce({
        data: [],
        error: null,
      });

      const hints = await service.getCoachingHints(
        "org-1",
        "op-1",
        "APPROVAL_QUEUE"
      );

      expect(Array.isArray(hints)).toBe(true);
    });

    it("should record hint feedback", async () => {
      mockSupabase.eq.mockReturnValueOnce({
        error: null,
      });

      await expect(
        service.recordHintFeedback("hint-1", true, "Very helpful!")
      ).resolves.not.toThrow();
    });
  });

  describe("Sandbox History", () => {
    it("should fetch sandbox history for organization", async () => {
      mockSupabase.limit.mockReturnValueOnce({
        data: [
          {
            id: "sim-1",
            simulated_result: { status: "SUCCESS" },
            would_have_succeeded: true,
            simulated_side_effects: [],
            insights: ["Test insight"],
            warnings: [],
          },
        ],
        error: null,
      });

      const history = await service.getSandboxHistory("org-1");

      expect(history).toHaveLength(1);
      expect(history[0].wouldHaveSucceeded).toBe(true);
    });

    it("should filter history by operator", async () => {
      mockSupabase.limit.mockReturnValueOnce({
        data: [],
        error: null,
      });

      await service.getSandboxHistory("org-1", "op-1", 10);

      expect(mockSupabase.eq).toHaveBeenCalledWith("operator_id", "op-1");
    });
  });

  describe("Rule Precedence", () => {
    it("should skip inactive rules", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "ANALYST" },
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ playbook_id: "pb-1" }],
        error: null,
      });

      mockSupabase.or.mockReturnValueOnce({
        data: [{ id: "pb-1" }],
        error: null,
      });

      mockSupabase.order.mockReturnValueOnce({
        data: [
          {
            id: "rule-1",
            rule_name: "Disabled block",
            rule_type: "GUARDRAIL",
            conditions: {},
            action: "BLOCK",
            action_params: {},
            priority: 100,
            is_active: false, // Inactive
          },
        ],
        error: null,
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
      });

      expect(result.action).toBe("ALLOW");
      expect(result.evaluatedRules).toHaveLength(0);
    });
  });
});
