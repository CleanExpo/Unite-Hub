/**
 * Guardrail Policy Service Tests - Phase 10 Week 7-8
 *
 * Tests for guardrail evaluation, sandbox simulations, and playbook rules.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a fully chainable mock for Supabase
// Key insight: the root supabase object must NOT be thenable (no .then),
// otherwise Promise.resolve(supabase) will try to resolve it as a thenable.
// Instead, .from() returns a query chain that IS thenable.
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
    // Make query chain thenable for `const { data } = await supabase.from(...).select(...).eq(...)`
    chain.then = vi.fn().mockImplementation((resolve: any, reject?: any) => {
      const result = queryResults[queryIndex] || { data: [], error: null };
      queryIndex++;
      return Promise.resolve(result).then(resolve, reject);
    });
    return chain;
  };

  // Root supabase object - must NOT have .then so Promise.resolve() works
  const queryChain = createQueryChain();
  const mock: any = {
    from: vi.fn().mockReturnValue(queryChain),
  };
  // Expose chain methods on root for test assertions (e.g. mockSupabase.eq)
  // but explicitly exclude 'then' so root is NOT thenable
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
    setQueryResults([]);
    service = new GuardrailPolicyService();
  });

  // Helper: set up results for evaluateGuardrails flow
  // The source does these queries in order:
  // 1. .single() -> operator profile (role)
  // 2. .then() -> playbook assignments (via or())
  // 3. .then() -> active playbooks (via or())
  // 4. .then() -> playbook rules (via order())
  // 5. .then() -> log evaluation (insert, thenable)
  function setupEvalResults(opts: {
    profile?: any;
    assignments?: any[];
    playbooks?: any[];
    rules?: any[];
  }) {
    setQueryResults([
      // 1. operator profile .single()
      { data: opts.profile || { role: "ANALYST" }, error: null },
      // 2. playbook_assignments .or() -> thenable
      { data: opts.assignments || [], error: null },
      // 3. operator_playbooks .or() -> thenable
      { data: opts.playbooks || [], error: null },
      // 4. playbook_rules .order() -> thenable
      { data: opts.rules || [], error: null },
      // 5. guardrail_evaluations .insert() -> thenable
      { data: null, error: null },
    ]);
  }

  describe("Guardrail Evaluation", () => {
    it("should return ALLOW when no rules match", async () => {
      setupEvalResults({
        assignments: [], // no assignments -> returns early
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
      });

      expect(result.action).toBe("ALLOW");
      expect(result.evaluatedRules).toHaveLength(0);
    });

    it("should apply BLOCK action when rule conditions match", async () => {
      setupEvalResults({
        profile: { role: "ANALYST" },
        assignments: [{ playbook_id: "pb-1" }],
        playbooks: [{ id: "pb-1" }],
        rules: [
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
      setupEvalResults({
        profile: { role: "MANAGER" },
        assignments: [{ playbook_id: "pb-1" }],
        playbooks: [{ id: "pb-1" }],
        rules: [
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
      setupEvalResults({
        profile: { role: "ANALYST" },
        assignments: [{ playbook_id: "pb-1" }],
        playbooks: [{ id: "pb-1" }],
        rules: [
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
      setupEvalResults({
        profile: { role: "MANAGER" },
        assignments: [{ playbook_id: "pb-1" }],
        playbooks: [{ id: "pb-1" }],
        rules: [
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
      setupEvalResults({
        assignments: [], // no assignments -> ALLOW
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
      setupEvalResults({
        profile: { role: "ANALYST" },
        assignments: [{ playbook_id: "pb-1" }],
        playbooks: [{ id: "pb-1" }],
        rules: [
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
      setupEvalResults({
        profile: { role: "ANALYST" },
        assignments: [{ playbook_id: "pb-1" }],
        playbooks: [{ id: "pb-1" }],
        rules: [
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
      setupEvalResults({
        profile: { role: "MANAGER" },
        assignments: [{ playbook_id: "pb-1" }],
        playbooks: [{ id: "pb-1" }],
        rules: [
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
      });

      const result = await service.evaluateGuardrails({
        operatorId: "op-1",
        organizationId: "org-1",
        domain: "SEO",
      });

      expect(result.action).toBe("REQUIRE_QUORUM");
    });

    it("should not match when domain differs", async () => {
      setupEvalResults({
        profile: { role: "MANAGER" },
        assignments: [{ playbook_id: "pb-1" }],
        playbooks: [{ id: "pb-1" }],
        rules: [
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
      setQueryResults([
        // 1. sandbox_executions insert().select().single()
        { data: { id: "sim-1" }, error: null },
        // 2. feedback_events insert() -> thenable
        { data: null, error: null },
      ]);

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
      setQueryResults([
        { data: { id: "sim-1" }, error: null },
        { data: null, error: null },
      ]);

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
      setQueryResults([
        { data: { id: "sim-1" }, error: null },
        { data: null, error: null },
      ]);

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
      setQueryResults([
        { data: { id: "sim-1" }, error: null },
        { data: null, error: null },
      ]);

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
      setQueryResults([
        // 1. getCoachingHints -> reviewer_scores .single()
        { data: { reliability_score: 60, accuracy_score: 55 }, error: null },
        // 2-5: evaluateGuardrails inner calls (profile, assignments, playbooks, rules, log)
        { data: { role: "ANALYST" }, error: null },
        { data: [], error: null }, // no assignments -> early return
        // 6. logEvaluation thenable
        { data: null, error: null },
      ]);

      const hints = await service.getCoachingHints(
        "org-1",
        "op-1",
        "APPROVAL_QUEUE"
      );

      expect(Array.isArray(hints)).toBe(true);
    });

    it("should record hint feedback", async () => {
      setQueryResults([
        // recordHintFeedback -> .update().eq() -> thenable
        { data: null, error: null },
      ]);

      await expect(
        service.recordHintFeedback("hint-1", true, "Very helpful!")
      ).resolves.not.toThrow();
    });
  });

  describe("Sandbox History", () => {
    it("should fetch sandbox history for organization", async () => {
      setQueryResults([
        // getSandboxHistory -> thenable
        {
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
        },
      ]);

      const history = await service.getSandboxHistory("org-1");

      expect(history).toHaveLength(1);
      expect(history[0].wouldHaveSucceeded).toBe(true);
    });

    it("should filter history by operator", async () => {
      setQueryResults([
        { data: [], error: null },
      ]);

      await service.getSandboxHistory("org-1", "op-1", 10);

      expect(mockSupabase.eq).toHaveBeenCalledWith("operator_id", "op-1");
    });
  });

  describe("Rule Precedence", () => {
    it("should skip inactive rules", async () => {
      setupEvalResults({
        profile: { role: "ANALYST" },
        assignments: [{ playbook_id: "pb-1" }],
        playbooks: [{ id: "pb-1" }],
        rules: [
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
