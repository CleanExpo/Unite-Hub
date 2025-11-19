/**
 * Anomaly Detector Unit Tests - Phase 8 Week 23
 *
 * 20 unit tests for anomaly detection functionality.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnomalyDetector } from "../seo/anomalyDetector";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  getSupabaseServer: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

describe("AnomalyDetector", () => {
  let detector: AnomalyDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new AnomalyDetector();
  });

  describe("Health Score Detection", () => {
    it("should detect HEALTH_SCORE_DROP when score drops significantly", () => {
      const anomaly = (detector as any).checkHealthScore(
        "client-123",
        80, // previous
        60  // current - 25% drop
      );

      expect(anomaly).not.toBeNull();
      expect(anomaly.anomaly_type).toBe("HEALTH_SCORE_DROP");
      expect(anomaly.severity).toBe("MEDIUM");
      expect(anomaly.change_percent).toBeLessThan(0);
    });

    it("should detect CRITICAL severity for 50%+ drop", () => {
      const anomaly = (detector as any).checkHealthScore(
        "client-123",
        80,
        40 // 50% drop
      );

      expect(anomaly).not.toBeNull();
      expect(anomaly.severity).toBe("CRITICAL");
    });

    it("should detect HIGH severity for 30-50% drop", () => {
      const anomaly = (detector as any).checkHealthScore(
        "client-123",
        100,
        65 // 35% drop
      );

      expect(anomaly).not.toBeNull();
      expect(anomaly.severity).toBe("HIGH");
    });

    it("should detect HEALTH_SCORE_SPIKE for unusual increase", () => {
      const anomaly = (detector as any).checkHealthScore(
        "client-123",
        40,
        65 // 62.5% increase
      );

      expect(anomaly).not.toBeNull();
      expect(anomaly.anomaly_type).toBe("HEALTH_SCORE_SPIKE");
      expect(anomaly.severity).toBe("LOW");
    });

    it("should return null for normal changes", () => {
      const anomaly = (detector as any).checkHealthScore(
        "client-123",
        75,
        72 // 4% drop - within threshold
      );

      expect(anomaly).toBeNull();
    });

    it("should handle zero previous value", () => {
      const anomaly = (detector as any).checkHealthScore(
        "client-123",
        0,
        50
      );

      // Should not crash, percentage change is 0 when previous is 0
      expect(anomaly).toBeNull();
    });
  });

  describe("Backlink Detection", () => {
    it("should detect BACKLINKS_LOST for significant drop", () => {
      const anomaly = (detector as any).checkBacklinks(
        "client-123",
        80, // previous
        50  // current - 37.5% drop
      );

      expect(anomaly).not.toBeNull();
      expect(anomaly.anomaly_type).toBe("BACKLINKS_LOST");
    });

    it("should detect BACKLINKS_SPIKE for sudden increase", () => {
      const anomaly = (detector as any).checkBacklinks(
        "client-123",
        30, // previous
        90  // current - 200% increase
      );

      expect(anomaly).not.toBeNull();
      expect(anomaly.anomaly_type).toBe("BACKLINKS_SPIKE");
      expect(anomaly.severity).toBe("HIGH");
    });

    it("should return null for normal backlink changes", () => {
      const anomaly = (detector as any).checkBacklinks(
        "client-123",
        70,
        65 // 7% drop - within threshold
      );

      expect(anomaly).toBeNull();
    });
  });

  describe("Delta Summary Detection", () => {
    it("should detect POSITION_DROP when many keywords lost", () => {
      const anomalies = (detector as any).checkDeltaSummary("client-123", {
        keywords_lost: 12,
        keywords_improved: 2,
      });

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].anomaly_type).toBe("POSITION_DROP");
      expect(anomalies[0].severity).toBe("HIGH");
    });

    it("should detect MEDIUM severity for 5-10 keywords lost", () => {
      const anomalies = (detector as any).checkDeltaSummary("client-123", {
        keywords_lost: 7,
      });

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].severity).toBe("MEDIUM");
    });

    it("should return empty for small keyword losses", () => {
      const anomalies = (detector as any).checkDeltaSummary("client-123", {
        keywords_lost: 3,
      });

      expect(anomalies.length).toBe(0);
    });
  });

  describe("Severity Classification", () => {
    it("should return CRITICAL for 50%+ drops", () => {
      const severity = (detector as any).getSeverityForDrop(55);
      expect(severity).toBe("CRITICAL");
    });

    it("should return HIGH for 30-50% drops", () => {
      const severity = (detector as any).getSeverityForDrop(35);
      expect(severity).toBe("HIGH");
    });

    it("should return MEDIUM for 20-30% drops", () => {
      const severity = (detector as any).getSeverityForDrop(25);
      expect(severity).toBe("MEDIUM");
    });

    it("should return LOW for under 20% drops", () => {
      const severity = (detector as any).getSeverityForDrop(15);
      expect(severity).toBe("LOW");
    });
  });

  describe("Recommendations", () => {
    it("should provide basic recommendations for small drops", () => {
      const recs = (detector as any).getHealthScoreDropRecommendations(-20);

      expect(recs.length).toBeGreaterThan(0);
      expect(recs).toContain("Run a full technical SEO audit");
    });

    it("should add critical recommendations for large drops", () => {
      const recs = (detector as any).getHealthScoreDropRecommendations(-40);

      expect(recs.length).toBeGreaterThan(3);
      expect(recs).toContain("Check for manual penalties in Search Console");
    });
  });

  describe("Custom Thresholds", () => {
    it("should use custom thresholds when provided", () => {
      const customDetector = new AnomalyDetector({
        health_score_drop: 5, // More sensitive
      });

      const anomaly = (customDetector as any).checkHealthScore(
        "client-123",
        80,
        74 // 7.5% drop - would not trigger default 15%
      );

      expect(anomaly).not.toBeNull();
      expect(anomaly.anomaly_type).toBe("HEALTH_SCORE_DROP");
    });

    it("should merge custom with default thresholds", () => {
      const customDetector = new AnomalyDetector({
        health_score_drop: 10,
        // Other thresholds should use defaults
      });

      expect((customDetector as any).thresholds.health_score_drop).toBe(10);
      expect((customDetector as any).thresholds.traffic_drop).toBe(30); // default
    });
  });

  describe("Edge Cases", () => {
    it("should handle negative values", () => {
      const anomaly = (detector as any).checkHealthScore(
        "client-123",
        50,
        -10 // Invalid but should not crash
      );

      // Should still detect as anomaly due to large change
      expect(anomaly).not.toBeNull();
    });

    it("should handle equal values", () => {
      const anomaly = (detector as any).checkHealthScore(
        "client-123",
        75,
        75
      );

      expect(anomaly).toBeNull();
    });
  });
});
