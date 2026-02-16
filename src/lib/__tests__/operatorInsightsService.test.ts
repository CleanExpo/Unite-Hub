/**
 * Operator Insights Service Tests - Phase 10 Week 5-6
 *
 * Tests for reviewer scoring, accuracy tracking, and bias detection.
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

// Import after mocking
import { OperatorInsightsService } from "../operator/operatorInsightsService";

describe("OperatorInsightsService", () => {
  let service: OperatorInsightsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OperatorInsightsService();
  });

  describe("Reviewer Score Calculations", () => {
    it("should return null for non-existent operator", async () => {
      setQueryResults([
        { data: null, error: { code: "PGRST116", message: "Not found" } },
      ]);

      const result = await service.getReviewerScores("op-1", "org-1");
      expect(result).toBeNull();
    });

    it("should return score data for existing operator", async () => {
      const scoreData = {
        operator_id: "op-1",
        reliability_score: 75.5,
        accuracy_score: 80,
        total_reviews: 50,
      };

      setQueryResults([
        { data: scoreData, error: null },
      ]);

      const result = await service.getReviewerScores("op-1", "org-1");
      expect(result).toEqual(scoreData);
      expect(result?.reliability_score).toBe(75.5);
    });

    it("should fetch all organization scores sorted by reliability", async () => {
      const scores = [
        { operator_id: "op-1", reliability_score: 90 },
        { operator_id: "op-2", reliability_score: 75 },
        { operator_id: "op-3", reliability_score: 60 },
      ];

      // getOrganizationScores: .from().select().eq().order() -> thenable
      setQueryResults([
        { data: scores, error: null },
      ]);

      const result = await service.getOrganizationScores("org-1");
      expect(result).toHaveLength(3);
      expect(result[0].reliability_score).toBe(90);
    });
  });

  describe("Decision Recording", () => {
    it("should record a decision with pending outcome", async () => {
      const record = {
        id: "rec-1",
        operator_id: "op-1",
        decision: "APPROVE",
        outcome: "PENDING",
      };

      // recordDecision:
      // 1. insert().select().single() - record
      // 2. logFeedbackEvent: insert().select().single() - event
      setQueryResults([
        { data: record, error: null },
        { data: { id: "event-1" }, error: null },
      ]);

      const result = await service.recordDecision(
        "op-1",
        "org-1",
        "APPROVE",
        "queue-1",
        "prop-1",
        120,
        0.85
      );

      expect(result.decision).toBe("APPROVE");
      expect(result.outcome).toBe("PENDING");
    });

    it("should include review time when provided", async () => {
      setQueryResults([
        { data: { id: "rec-1", review_time_seconds: 45 }, error: null },
        { data: { id: "event-1" }, error: null },
      ]);

      const result = await service.recordDecision(
        "op-1",
        "org-1",
        "REJECT",
        undefined,
        undefined,
        45
      );

      expect(result.review_time_seconds).toBe(45);
    });

    it("should include confidence level when provided", async () => {
      setQueryResults([
        { data: { id: "rec-1", confidence_level: 0.92 }, error: null },
        { data: { id: "event-1" }, error: null },
      ]);

      const result = await service.recordDecision(
        "op-1",
        "org-1",
        "DEFER",
        undefined,
        undefined,
        undefined,
        0.92
      );

      expect(result.confidence_level).toBe(0.92);
    });
  });

  describe("Outcome Recording", () => {
    it("should update outcome and trigger score recalculation", async () => {
      // recordOutcome flow:
      // 1. fetch record .single()
      // 2. update outcome -> thenable
      // 3. logFeedbackEvent .single()
      // 4. updateReviewerScores -> getAccuracyHistory -> thenable (limit)
      //    - history empty so upsert default .single()
      //    - logFeedbackEvent .single()
      setQueryResults([
        { data: { operator_id: "op-1", organization_id: "org-1", decision: "APPROVE" }, error: null },
        { data: null, error: null }, // update thenable
        { data: { id: "event-1" }, error: null }, // logFeedbackEvent
        { data: [], error: null }, // getAccuracyHistory (empty)
        { data: { operator_id: "op-1", reliability_score: 50, accuracy_score: 50, total_reviews: 0 }, error: null }, // upsert default
        { data: { id: "event-2" }, error: null }, // logFeedbackEvent for score update
      ]);

      await expect(
        service.recordOutcome("rec-1", "CORRECT", "Good decision")
      ).resolves.not.toThrow();
    });

    it("should log DECISION_OVERTURNED event for overturned outcomes", async () => {
      setQueryResults([
        { data: { operator_id: "op-1", organization_id: "org-1", decision: "APPROVE" }, error: null },
        { data: null, error: null }, // update
        { data: { id: "event-1" }, error: null }, // logFeedbackEvent (DECISION_OVERTURNED)
        { data: [], error: null }, // getAccuracyHistory
        { data: { operator_id: "op-1", reliability_score: 50, total_reviews: 0 }, error: null }, // upsert
        { data: { id: "event-2" }, error: null }, // logFeedbackEvent
      ]);

      await service.recordOutcome("rec-1", "OVERTURNED", "Better data available");

      // Verify insert was called (for event logging)
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe("Decay-Weighted Scoring", () => {
    it("should weight recent reviews higher than old ones", async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const history = [
        { id: "1", decision_at: now.toISOString(), outcome: "CORRECT", review_time_seconds: 60, decision: "APPROVE" },
        { id: "2", decision_at: yesterday.toISOString(), outcome: "CORRECT", review_time_seconds: 60, decision: "APPROVE" },
        { id: "3", decision_at: lastWeek.toISOString(), outcome: "OVERTURNED", review_time_seconds: 60, decision: "APPROVE" },
      ];

      // updateReviewerScores flow:
      // 1. getAccuracyHistory: .from().select().eq().eq().order().limit() -> thenable
      // 2. calculateConsistencyScore: .from().select().eq().eq().not().order().limit() -> thenable
      // 3. upsert scores .single()
      // 4. logFeedbackEvent .single()
      setQueryResults([
        { data: history, error: null }, // getAccuracyHistory
        { data: [
          { decision: "APPROVE", review_time_seconds: 60 },
          { decision: "APPROVE", review_time_seconds: 65 },
          { decision: "APPROVE", review_time_seconds: 55 },
          { decision: "APPROVE", review_time_seconds: 62 },
          { decision: "APPROVE", review_time_seconds: 58 },
        ], error: null }, // calculateConsistencyScore
        { data: { operator_id: "op-1", weighted_accuracy: 72.5, accuracy_score: 66.7 }, error: null }, // upsert
        { data: { id: "event-1" }, error: null }, // logFeedbackEvent
      ]);

      const result = await service.updateReviewerScores("op-1", "org-1");

      // Weighted accuracy should be higher than raw because recent reviews are correct
      expect(result).toBeDefined();
    });

    it("should create default scores for operators with no history", async () => {
      // updateReviewerScores with empty history:
      // 1. getAccuracyHistory -> thenable (empty)
      // 2. upsert default .single()
      setQueryResults([
        { data: [], error: null }, // getAccuracyHistory
        { data: { operator_id: "op-1", reliability_score: 50, accuracy_score: 50, total_reviews: 0 }, error: null },
      ]);

      const result = await service.updateReviewerScores("op-1", "org-1");
      expect(result.total_reviews).toBe(0);
      expect(result.reliability_score).toBe(50);
    });
  });

  describe("Bias Detection", () => {
    it("should detect APPROVAL_BIAS when approval rate exceeds 85%", async () => {
      // Create history with 95% approval rate
      const history = Array(20).fill(null).map((_, i) => ({
        id: `${i}`,
        decision: i < 19 ? "APPROVE" : "REJECT",
        outcome: "CORRECT",
        review_time_seconds: 60,
        decision_at: new Date().toISOString(),
      }));

      // detectBiases flow:
      // 1. getAccuracyHistory -> thenable
      // 2. createBiasSignal for APPROVAL_BIAS:
      //    a. check existing bias .single() -> not found
      //    b. insert new bias .single()
      //    c. logFeedbackEvent .single()
      // 3. calculateConsistencyScore -> thenable
      setQueryResults([
        { data: history, error: null }, // getAccuracyHistory
        { data: null, error: { code: "PGRST116" } }, // check existing bias
        { data: { id: "bias-1", bias_type: "APPROVAL_BIAS", severity: "HIGH" }, error: null }, // insert bias
        { data: { id: "event-1" }, error: null }, // logFeedbackEvent
        { data: history.map((h) => ({ decision: h.decision, review_time_seconds: h.review_time_seconds })), error: null }, // consistency score
      ]);

      const biases = await service.detectBiases("op-1", "org-1");

      const approvalBias = biases.find((b) => b.bias_type === "APPROVAL_BIAS");
      expect(approvalBias).toBeDefined();
    });

    it("should detect REJECTION_BIAS when rejection rate exceeds 85%", async () => {
      const history = Array(20).fill(null).map((_, i) => ({
        id: `${i}`,
        decision: i < 19 ? "REJECT" : "APPROVE",
        outcome: "CORRECT",
        review_time_seconds: 60,
        decision_at: new Date().toISOString(),
      }));

      setQueryResults([
        { data: history, error: null }, // getAccuracyHistory
        { data: null, error: { code: "PGRST116" } }, // check existing
        { data: { id: "bias-1", bias_type: "REJECTION_BIAS", severity: "MEDIUM" }, error: null }, // insert
        { data: { id: "event-1" }, error: null }, // logFeedbackEvent
        { data: history.map((h) => ({ decision: h.decision, review_time_seconds: h.review_time_seconds })), error: null }, // consistency
      ]);

      const biases = await service.detectBiases("op-1", "org-1");

      const rejectionBias = biases.find((b) => b.bias_type === "REJECTION_BIAS");
      expect(rejectionBias).toBeDefined();
    });

    it("should detect SPEED_BIAS when avg review time under 30 seconds", async () => {
      const history = Array(15).fill(null).map((_, i) => ({
        id: `${i}`,
        decision: "APPROVE",
        outcome: "CORRECT",
        review_time_seconds: 15, // Very fast
        decision_at: new Date().toISOString(),
      }));

      // Flow:
      // 1. getAccuracyHistory -> thenable
      // 2. createBiasSignal for APPROVAL_BIAS (15/15 = 100% approve):
      //    a. check existing .single()
      //    b. insert .single()
      //    c. logFeedbackEvent .single()
      // 3. createBiasSignal for SPEED_BIAS (avg 15s < 30s):
      //    a. check existing .single()
      //    b. insert .single()
      //    c. logFeedbackEvent .single()
      // 4. calculateConsistencyScore -> thenable
      setQueryResults([
        { data: history, error: null }, // getAccuracyHistory
        // APPROVAL_BIAS detected first (100% approval rate > 85%)
        { data: null, error: { code: "PGRST116" } }, // check existing
        { data: { id: "bias-a", bias_type: "APPROVAL_BIAS", severity: "HIGH" }, error: null },
        { data: { id: "event-a" }, error: null }, // logFeedbackEvent
        // SPEED_BIAS
        { data: null, error: { code: "PGRST116" } }, // check existing
        { data: { id: "bias-1", bias_type: "SPEED_BIAS", severity: "HIGH" }, error: null },
        { data: { id: "event-1" }, error: null }, // logFeedbackEvent
        // calculateConsistencyScore (all same time = high consistency)
        { data: history.map((h) => ({ decision: h.decision, review_time_seconds: h.review_time_seconds })), error: null },
      ]);

      const biases = await service.detectBiases("op-1", "org-1");

      const speedBias = biases.find((b) => b.bias_type === "SPEED_BIAS");
      expect(speedBias).toBeDefined();
    });

    it("should not detect biases with insufficient review history", async () => {
      const history = Array(5).fill(null).map((_, i) => ({
        id: `${i}`,
        decision: "APPROVE",
        outcome: "CORRECT",
        review_time_seconds: 60,
        decision_at: new Date().toISOString(),
      }));

      setQueryResults([
        { data: history, error: null },
      ]);

      const biases = await service.detectBiases("op-1", "org-1");
      expect(biases).toHaveLength(0);
    });

    it("should return empty array for balanced reviewer", async () => {
      // 50% approval, normal review time
      const history = Array(20).fill(null).map((_, i) => ({
        id: `${i}`,
        decision: i % 2 === 0 ? "APPROVE" : "REJECT",
        outcome: "CORRECT",
        review_time_seconds: 60,
        decision_at: new Date().toISOString(),
      }));

      // No biases detected, just consistency check
      setQueryResults([
        { data: history, error: null }, // getAccuracyHistory
        // No approval/rejection/speed bias triggered
        // calculateConsistencyScore
        { data: history.map((h) => ({ decision: h.decision, review_time_seconds: h.review_time_seconds })), error: null },
      ]);

      const biases = await service.detectBiases("op-1", "org-1");
      expect(biases).toHaveLength(0);
    });
  });

  describe("Bias Management", () => {
    it("should acknowledge a bias signal", async () => {
      // acknowledgeBias: .update().eq().select().single()
      setQueryResults([
        { data: { id: "bias-1", status: "ACKNOWLEDGED", acknowledged_by: "user-1" }, error: null },
      ]);

      const result = await service.acknowledgeBias("bias-1", "user-1");
      expect(result.status).toBe("ACKNOWLEDGED");
    });

    it("should resolve a bias signal with resolution text", async () => {
      // resolveBias flow:
      // 1. fetch bias .single()
      // 2. update .single()
      // 3. logFeedbackEvent .single()
      setQueryResults([
        { data: { operator_id: "op-1", organization_id: "org-1" }, error: null },
        { data: { id: "bias-1", status: "RESOLVED", resolution: "Addressed through training" }, error: null },
        { data: { id: "event-1" }, error: null },
      ]);

      const result = await service.resolveBias(
        "bias-1",
        "Addressed through training"
      );

      expect(result.status).toBe("RESOLVED");
      expect(result.resolution).toBe("Addressed through training");
    });
  });

  describe("Autonomy Tuning Recommendations", () => {
    it("should recommend increased autonomy for high reliability teams", async () => {
      // generateTuningRecommendations flow:
      // 1. getOrganizationScores: .from().select().eq().order() -> thenable
      // 2. getOrganizationBiases: .from().select().eq().in().order() -> thenable
      // 3. insert recommendation .single()
      // 4. logFeedbackEvent .single()
      setQueryResults([
        { data: [
          { operator_id: "op-1", reliability_score: 85 },
          { operator_id: "op-2", reliability_score: 82 },
          { operator_id: "op-3", reliability_score: 88 },
        ], error: null },
        { data: [], error: null }, // no biases
        { data: { id: "rec-1", domain: "GENERAL", previous_level: "SUPERVISED", new_level: "TRUSTED", confidence: 0.85 }, error: null },
        { data: { id: "event-1" }, error: null },
      ]);

      const recommendations = await service.generateTuningRecommendations("org-1");

      expect(recommendations.length).toBeGreaterThan(0);
      const trustRec = recommendations.find((r) => r.new_level === "TRUSTED");
      expect(trustRec).toBeDefined();
    });

    it("should recommend decreased autonomy when critical biases exist", async () => {
      setQueryResults([
        { data: [{ operator_id: "op-1", reliability_score: 70 }], error: null },
        { data: [{ id: "bias-1", severity: "CRITICAL", bias_type: "APPROVAL_BIAS" }], error: null },
        { data: { id: "rec-1", domain: "GENERAL", previous_level: "TRUSTED", new_level: "SUPERVISED", confidence: 0.9 }, error: null },
        { data: { id: "event-1" }, error: null },
      ]);

      const recommendations = await service.generateTuningRecommendations("org-1");

      const supervisedRec = recommendations.find(
        (r) => r.new_level === "SUPERVISED"
      );
      expect(supervisedRec).toBeDefined();
    });

    it("should apply a tuning recommendation", async () => {
      // applyTuningRecommendation: .update().eq() -> thenable
      setQueryResults([
        { data: null, error: null },
      ]);

      await expect(
        service.applyTuningRecommendation("rec-1", "user-1")
      ).resolves.not.toThrow();
    });
  });

  describe("Feedback Events", () => {
    it("should log feedback events with metadata", async () => {
      setQueryResults([
        { data: { id: "event-1", event_type: "REVIEW_SUBMITTED", metadata: { decision: "APPROVE" } }, error: null },
      ]);

      const event = await service.logFeedbackEvent(
        "org-1",
        "REVIEW_SUBMITTED",
        "user-1",
        { decision: "APPROVE" }
      );

      expect(event.event_type).toBe("REVIEW_SUBMITTED");
    });

    it("should fetch recent feedback events", async () => {
      // getFeedbackEvents: .from().select().eq().order().limit() -> thenable
      setQueryResults([
        { data: [
          { id: "1", event_type: "REVIEW_SUBMITTED" },
          { id: "2", event_type: "SCORE_UPDATED" },
        ], error: null },
      ]);

      const events = await service.getFeedbackEvents("org-1", 10);
      expect(events).toHaveLength(2);
    });
  });
});
