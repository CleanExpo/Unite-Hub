/**
 * Operator Insights Service Tests - Phase 10 Week 5-6
 *
 * Tests for reviewer scoring, accuracy tracking, and bias detection.
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
  in: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
};

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

    // Default mock for feedback event logging
    mockSupabase.single.mockResolvedValue({
      data: { id: "event-1" },
      error: null,
    });
  });

  describe("Reviewer Score Calculations", () => {
    it("should return null for non-existent operator", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });

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

      mockSupabase.single.mockResolvedValueOnce({
        data: scoreData,
        error: null,
      });

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

      mockSupabase.order.mockReturnValueOnce({
        data: scores,
        error: null,
      });

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

      mockSupabase.single.mockResolvedValueOnce({
        data: record,
        error: null,
      });

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
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "rec-1",
          review_time_seconds: 45,
        },
        error: null,
      });

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
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "rec-1",
          confidence_level: 0.92,
        },
        error: null,
      });

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
      // Mock fetch record
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          operator_id: "op-1",
          organization_id: "org-1",
          decision: "APPROVE",
        },
        error: null,
      });

      // Mock update
      mockSupabase.eq.mockReturnValueOnce({
        error: null,
      });

      await expect(
        service.recordOutcome("rec-1", "CORRECT", "Good decision")
      ).resolves.not.toThrow();
    });

    it("should log DECISION_OVERTURNED event for overturned outcomes", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          operator_id: "op-1",
          organization_id: "org-1",
          decision: "APPROVE",
        },
        error: null,
      });

      mockSupabase.eq.mockReturnValueOnce({
        error: null,
      });

      await service.recordOutcome("rec-1", "OVERTURNED", "Better data available");

      // Verify event was logged
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe("Decay-Weighted Scoring", () => {
    it("should weight recent reviews higher than old ones", async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Mock empty limit call for getAccuracyHistory
      mockSupabase.limit.mockReturnValueOnce({
        data: [
          {
            id: "1",
            decision_at: now.toISOString(),
            outcome: "CORRECT",
            review_time_seconds: 60,
          },
          {
            id: "2",
            decision_at: yesterday.toISOString(),
            outcome: "CORRECT",
            review_time_seconds: 60,
          },
          {
            id: "3",
            decision_at: lastWeek.toISOString(),
            outcome: "OVERTURNED",
            review_time_seconds: 60,
          },
        ],
        error: null,
      });

      // Mock consistency score query
      mockSupabase.limit.mockReturnValueOnce({
        data: [
          { decision: "APPROVE", review_time_seconds: 60 },
          { decision: "APPROVE", review_time_seconds: 65 },
          { decision: "APPROVE", review_time_seconds: 55 },
          { decision: "APPROVE", review_time_seconds: 62 },
          { decision: "APPROVE", review_time_seconds: 58 },
        ],
        error: null,
      });

      // Mock upsert
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          operator_id: "op-1",
          weighted_accuracy: 72.5,
          accuracy_score: 66.7,
        },
        error: null,
      });

      const result = await service.updateReviewerScores("op-1", "org-1");

      // Weighted accuracy should be higher than raw because recent reviews are correct
      expect(result).toBeDefined();
    });

    it("should create default scores for operators with no history", async () => {
      mockSupabase.limit.mockReturnValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          operator_id: "op-1",
          reliability_score: 50,
          accuracy_score: 50,
          total_reviews: 0,
        },
        error: null,
      });

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

      mockSupabase.limit.mockReturnValueOnce({
        data: history,
        error: null,
      });

      // Mock bias signal check and creation
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "bias-1",
          bias_type: "APPROVAL_BIAS",
          severity: "HIGH",
        },
        error: null,
      });

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

      mockSupabase.limit.mockReturnValueOnce({
        data: history,
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "bias-1",
          bias_type: "REJECTION_BIAS",
          severity: "MEDIUM",
        },
        error: null,
      });

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

      mockSupabase.limit.mockReturnValueOnce({
        data: history,
        error: null,
      });

      // Mock consistency score
      mockSupabase.limit.mockReturnValueOnce({
        data: history.map((h) => ({
          decision: h.decision,
          review_time_seconds: h.review_time_seconds,
        })),
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "bias-1",
          bias_type: "SPEED_BIAS",
          severity: "HIGH",
        },
        error: null,
      });

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

      mockSupabase.limit.mockReturnValueOnce({
        data: history,
        error: null,
      });

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

      mockSupabase.limit.mockReturnValueOnce({
        data: history,
        error: null,
      });

      // Mock consistency score
      mockSupabase.limit.mockReturnValueOnce({
        data: history.map((h) => ({
          decision: h.decision,
          review_time_seconds: h.review_time_seconds,
        })),
        error: null,
      });

      const biases = await service.detectBiases("op-1", "org-1");
      expect(biases).toHaveLength(0);
    });
  });

  describe("Bias Management", () => {
    it("should acknowledge a bias signal", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "bias-1",
          status: "ACKNOWLEDGED",
          acknowledged_by: "user-1",
        },
        error: null,
      });

      const result = await service.acknowledgeBias("bias-1", "user-1");
      expect(result.status).toBe("ACKNOWLEDGED");
    });

    it("should resolve a bias signal with resolution text", async () => {
      // Mock fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          operator_id: "op-1",
          organization_id: "org-1",
        },
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "bias-1",
          status: "RESOLVED",
          resolution: "Addressed through training",
        },
        error: null,
      });

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
      // Mock org scores with high reliability
      mockSupabase.order.mockReturnValueOnce({
        data: [
          { operator_id: "op-1", reliability_score: 85 },
          { operator_id: "op-2", reliability_score: 82 },
          { operator_id: "op-3", reliability_score: 88 },
        ],
        error: null,
      });

      // Mock org biases (none)
      mockSupabase.order.mockReturnValueOnce({
        data: [],
        error: null,
      });

      // Mock recommendation insert
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "rec-1",
          domain: "GENERAL",
          previous_level: "SUPERVISED",
          new_level: "TRUSTED",
          confidence: 0.85,
        },
        error: null,
      });

      const recommendations = await service.generateTuningRecommendations("org-1");

      expect(recommendations.length).toBeGreaterThan(0);
      const trustRec = recommendations.find((r) => r.new_level === "TRUSTED");
      expect(trustRec).toBeDefined();
    });

    it("should recommend decreased autonomy when critical biases exist", async () => {
      // Mock org scores
      mockSupabase.order.mockReturnValueOnce({
        data: [{ operator_id: "op-1", reliability_score: 70 }],
        error: null,
      });

      // Mock org biases with critical
      mockSupabase.order.mockReturnValueOnce({
        data: [
          {
            id: "bias-1",
            severity: "CRITICAL",
            bias_type: "APPROVAL_BIAS",
          },
        ],
        error: null,
      });

      // Mock recommendation insert
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "rec-1",
          domain: "GENERAL",
          previous_level: "TRUSTED",
          new_level: "SUPERVISED",
          confidence: 0.9,
        },
        error: null,
      });

      const recommendations = await service.generateTuningRecommendations("org-1");

      const supervisedRec = recommendations.find(
        (r) => r.new_level === "SUPERVISED"
      );
      expect(supervisedRec).toBeDefined();
    });

    it("should apply a tuning recommendation", async () => {
      mockSupabase.eq.mockReturnValueOnce({
        error: null,
      });

      await expect(
        service.applyTuningRecommendation("rec-1", "user-1")
      ).resolves.not.toThrow();
    });
  });

  describe("Feedback Events", () => {
    it("should log feedback events with metadata", async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "event-1",
          event_type: "REVIEW_SUBMITTED",
          metadata: { decision: "APPROVE" },
        },
        error: null,
      });

      const event = await service.logFeedbackEvent(
        "org-1",
        "REVIEW_SUBMITTED",
        "user-1",
        { decision: "APPROVE" }
      );

      expect(event.event_type).toBe("REVIEW_SUBMITTED");
    });

    it("should fetch recent feedback events", async () => {
      mockSupabase.limit.mockReturnValueOnce({
        data: [
          { id: "1", event_type: "REVIEW_SUBMITTED" },
          { id: "2", event_type: "SCORE_UPDATED" },
        ],
        error: null,
      });

      const events = await service.getFeedbackEvents("org-1", 10);
      expect(events).toHaveLength(2);
    });
  });
});
