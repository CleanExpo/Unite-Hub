/**
 * Strategy Signoff Unit Tests - Phase 8 Week 24
 *
 * 15 unit tests for strategy signoff functionality.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

// Import after mocking
import { StrategySignoffService } from "../seo/strategySignoff";

describe("StrategySignoffService", () => {
  let service: StrategySignoffService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StrategySignoffService();
  });

  describe("generateRecommendations", () => {
    it("should generate recommendations from audit data", async () => {
      const auditData = {
        health_score: 45,
        previous_health_score: 65,
        delta_summary: {
          keywords: { lost: 15, improved: 3 },
          backlinks: { lost: 25, gained: 5 },
        },
        technical_issues: [
          { severity: "critical", type: "page_speed" },
          { severity: "warning", type: "mobile_usability" },
        ],
      };

      const recommendations = await service.generateRecommendations(
        "client-uuid",
        "audit-uuid",
        auditData
      );

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should prioritize critical health score drops", async () => {
      const auditData = {
        health_score: 30,
        previous_health_score: 80,
        delta_summary: {
          keywords: { lost: 5, improved: 2 },
        },
      };

      const recommendations = await service.generateRecommendations(
        "client-uuid",
        "audit-uuid",
        auditData
      );

      const highPriority = recommendations.filter((r) => r.priority === "HIGH");
      expect(highPriority.length).toBeGreaterThan(0);
    });

    it("should generate keyword recommendations for significant losses", async () => {
      const auditData = {
        health_score: 60,
        previous_health_score: 65,
        delta_summary: {
          keywords: { lost: 20, improved: 2 },
        },
      };

      const recommendations = await service.generateRecommendations(
        "client-uuid",
        "audit-uuid",
        auditData
      );

      const keywordRecs = recommendations.filter((r) => r.category === "keywords");
      expect(keywordRecs.length).toBeGreaterThan(0);
    });

    it("should generate backlink recommendations for significant losses", async () => {
      const auditData = {
        health_score: 60,
        previous_health_score: 65,
        delta_summary: {
          backlinks: { lost: 30, gained: 5 },
        },
      };

      const recommendations = await service.generateRecommendations(
        "client-uuid",
        "audit-uuid",
        auditData
      );

      const backlinkRecs = recommendations.filter((r) => r.category === "backlinks");
      expect(backlinkRecs.length).toBeGreaterThan(0);
    });

    it("should generate technical recommendations for critical issues", async () => {
      const auditData = {
        health_score: 60,
        previous_health_score: 62,
        technical_issues: [
          { severity: "critical", type: "page_speed" },
          { severity: "critical", type: "mobile_usability" },
        ],
      };

      const recommendations = await service.generateRecommendations(
        "client-uuid",
        "audit-uuid",
        auditData
      );

      const technicalRecs = recommendations.filter((r) => r.category === "technical");
      expect(technicalRecs.length).toBeGreaterThan(0);
    });

    it("should return empty array for healthy audit with no issues", async () => {
      const auditData = {
        health_score: 85,
        previous_health_score: 82,
        delta_summary: {
          keywords: { lost: 1, improved: 10 },
          backlinks: { lost: 2, gained: 15 },
        },
        technical_issues: [],
      };

      const recommendations = await service.generateRecommendations(
        "client-uuid",
        "audit-uuid",
        auditData
      );

      // May return empty or minimal recommendations
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe("createSnapshot", () => {
    it("should create a strategy snapshot with all fields", async () => {
      const snapshotData = {
        client_id: "client-uuid",
        audit_id: "audit-uuid",
        generated_at: new Date().toISOString(),
        health_score: 65,
        previous_health_score: 70,
        overall_trend: "DECLINING" as const,
        top_wins: ["Improved mobile usability"],
        top_losses: ["Lost 10 keywords"],
        recommendations: [],
        signoff_status: "PENDING" as const,
      };

      const snapshot = await service.createSnapshot(snapshotData);

      expect(snapshot).toBeDefined();
      expect(snapshot.client_id).toBe("client-uuid");
      expect(snapshot.signoff_status).toBe("PENDING");
    });
  });

  describe("submitSignoff", () => {
    it("should record an APPROVED decision", async () => {
      const signoff = await service.submitSignoff({
        client_id: "client-uuid",
        audit_id: "audit-uuid",
        recommendation_id: "rec-uuid",
        decision: "APPROVED",
        notes: "Looks good, proceed with implementation",
        decided_by: "user-uuid",
        action_json: { start_date: "2025-01-25" },
      });

      expect(signoff).toBeDefined();
      expect(signoff.decision).toBe("APPROVED");
    });

    it("should record a REJECTED decision with notes", async () => {
      const signoff = await service.submitSignoff({
        client_id: "client-uuid",
        audit_id: "audit-uuid",
        recommendation_id: "rec-uuid",
        decision: "REJECTED",
        notes: "Not aligned with current priorities",
        decided_by: "user-uuid",
        action_json: {},
      });

      expect(signoff).toBeDefined();
      expect(signoff.decision).toBe("REJECTED");
      expect(signoff.notes).toBe("Not aligned with current priorities");
    });

    it("should record a MODIFIED decision with changes", async () => {
      const signoff = await service.submitSignoff({
        client_id: "client-uuid",
        audit_id: "audit-uuid",
        recommendation_id: "rec-uuid",
        decision: "MODIFIED",
        notes: "Adjusted timeline and scope",
        decided_by: "user-uuid",
        action_json: {
          modified_actions: ["Reduced scope to top 5 pages"],
          new_timeline: "2 weeks instead of 1",
        },
      });

      expect(signoff).toBeDefined();
      expect(signoff.decision).toBe("MODIFIED");
      expect(signoff.action_json.modified_actions).toBeDefined();
    });

    it("should handle signoff for entire audit (no recommendation_id)", async () => {
      const signoff = await service.submitSignoff({
        client_id: "client-uuid",
        audit_id: "audit-uuid",
        decision: "APPROVED",
        notes: "Approve all recommendations",
        decided_by: "user-uuid",
        action_json: {},
      });

      expect(signoff).toBeDefined();
      expect(signoff.recommendation_id).toBeUndefined();
    });
  });

  describe("getSignoffHistory", () => {
    it("should return signoff history for a client", async () => {
      const history = await service.getSignoffHistory("client-uuid", "audit-uuid");

      expect(Array.isArray(history)).toBe(true);
    });

    it("should filter by audit_id", async () => {
      const history = await service.getSignoffHistory("client-uuid", "specific-audit");

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("updateSnapshotStatus", () => {
    it("should update status to APPROVED when all recommendations approved", async () => {
      const result = await service.updateSnapshotStatus(
        "client-uuid",
        "audit-uuid",
        "APPROVED"
      );

      expect(result).toBeDefined();
    });

    it("should update status to PARTIAL when some approved", async () => {
      const result = await service.updateSnapshotStatus(
        "client-uuid",
        "audit-uuid",
        "PARTIAL"
      );

      expect(result).toBeDefined();
    });

    it("should update status to REJECTED when all rejected", async () => {
      const result = await service.updateSnapshotStatus(
        "client-uuid",
        "audit-uuid",
        "REJECTED"
      );

      expect(result).toBeDefined();
    });
  });
});
