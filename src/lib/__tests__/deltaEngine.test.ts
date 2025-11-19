/**
 * Delta Engine Unit Tests - Phase 8 Week 21
 *
 * 30 unit tests covering delta computation, trend detection,
 * keyword movements, GEO changes, and competitor analysis.
 */

import { describe, it, expect } from "vitest";
import { DeltaEngine, type AuditSnapshot } from "../seo/deltaEngine";

// ============================================
// Test Fixtures
// ============================================

const createMockAudit = (overrides: Partial<AuditSnapshot> = {}): AuditSnapshot => ({
  audit_id: "audit-" + Math.random().toString(36).substr(2, 9),
  client_id: "client-123",
  timestamp: new Date().toISOString(),
  health_score: 70,
  data_sources: {
    gsc: {
      queries: [],
      pages: [],
      totalClicks: 1000,
      totalImpressions: 50000,
      averageCTR: 0.02,
      averagePosition: 8.5,
    },
    bing: {
      indexedPages: 100,
      crawlErrors: 5,
      sitemapStatus: "Submitted",
    },
    dataForSEO: {
      rankedKeywords: [
        { keyword: "test keyword 1", position: 5, search_volume: 1000, competition: 0.5 },
        { keyword: "test keyword 2", position: 12, search_volume: 500, competition: 0.3 },
      ],
      competitors: [
        { domain: "competitor1.com", keywords_overlap: 50, rank_average: 6.0 },
      ],
      questions: [],
      relatedKeywords: [],
    },
    geo: {
      centerLat: -27.4698,
      centerLng: 153.0251,
      radiusKm: 10,
      targetSuburbs: ["Brisbane CBD", "South Brisbane"],
      gapSuburbs: ["Red Hill", "Spring Hill"],
      coveragePercentage: 65,
    },
  },
  ...overrides,
});

// ============================================
// Health Score Delta Tests
// ============================================

describe("DeltaEngine - Health Score", () => {
  it("should detect IMPROVING trend when health score increases significantly", async () => {
    const previous = createMockAudit({ health_score: 50, timestamp: "2025-01-01T00:00:00Z" });
    const current = createMockAudit({ health_score: 75, timestamp: "2025-01-08T00:00:00Z" });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.overall_trend).toBe("IMPROVING");
    expect(result.health_score_delta.trend).toBe("UP");
    expect(result.health_score_delta.absolute_change).toBe(25);
    expect(result.health_score_delta.significance).toBe("HIGH");
  });

  it("should detect DECLINING trend when health score decreases significantly", async () => {
    const previous = createMockAudit({ health_score: 80, timestamp: "2025-01-01T00:00:00Z" });
    const current = createMockAudit({ health_score: 55, timestamp: "2025-01-08T00:00:00Z" });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.overall_trend).toBe("DECLINING");
    expect(result.health_score_delta.trend).toBe("DOWN");
    expect(result.health_score_delta.absolute_change).toBe(-25);
  });

  it("should detect STABLE trend for small health score changes", async () => {
    const previous = createMockAudit({ health_score: 70, timestamp: "2025-01-01T00:00:00Z" });
    const current = createMockAudit({ health_score: 71, timestamp: "2025-01-08T00:00:00Z" });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.health_score_delta.trend).toBe("FLAT");
    expect(result.health_score_delta.significance).toBe("LOW");
  });

  it("should calculate correct percentage change", async () => {
    const previous = createMockAudit({ health_score: 50, timestamp: "2025-01-01T00:00:00Z" });
    const current = createMockAudit({ health_score: 60, timestamp: "2025-01-08T00:00:00Z" });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.health_score_delta.percentage_change).toBeCloseTo(20, 1);
  });
});

// ============================================
// GSC Metric Delta Tests
// ============================================

describe("DeltaEngine - GSC Metrics", () => {
  it("should compute click delta correctly", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        gsc: {
          queries: [],
          pages: [],
          totalClicks: 1000,
          totalImpressions: 50000,
          averageCTR: 0.02,
          averagePosition: 8.5,
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        gsc: {
          queries: [],
          pages: [],
          totalClicks: 1500,
          totalImpressions: 60000,
          averageCTR: 0.025,
          averagePosition: 7.0,
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const clicksDelta = result.metric_deltas.find(m => m.metric_name === "Total Clicks");
    expect(clicksDelta).toBeDefined();
    expect(clicksDelta?.absolute_change).toBe(500);
    expect(clicksDelta?.percentage_change).toBe(50);
    expect(clicksDelta?.trend).toBe("UP");
  });

  it("should handle position improvement as UP trend (inverse logic)", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        gsc: {
          queries: [],
          pages: [],
          totalClicks: 1000,
          totalImpressions: 50000,
          averageCTR: 0.02,
          averagePosition: 15.0, // Worse position
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        gsc: {
          queries: [],
          pages: [],
          totalClicks: 1000,
          totalImpressions: 50000,
          averageCTR: 0.02,
          averagePosition: 5.0, // Better position
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const positionDelta = result.metric_deltas.find(m => m.metric_name === "Average Position");
    expect(positionDelta).toBeDefined();
    expect(positionDelta?.trend).toBe("UP"); // Lower is better
  });

  it("should handle crawl errors as DOWN when increasing (inverse logic)", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        bing: {
          indexedPages: 100,
          crawlErrors: 2,
          sitemapStatus: "Submitted",
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        bing: {
          indexedPages: 100,
          crawlErrors: 20,
          sitemapStatus: "Submitted",
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const errorDelta = result.metric_deltas.find(m => m.metric_name === "Crawl Errors (Bing)");
    expect(errorDelta).toBeDefined();
    expect(errorDelta?.trend).toBe("DOWN"); // More errors is bad
  });
});

// ============================================
// Keyword Movement Tests
// ============================================

describe("DeltaEngine - Keyword Movements", () => {
  it("should detect NEW keywords", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [
            { keyword: "existing keyword", position: 10, search_volume: 1000, competition: 0.5 },
          ],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [
            { keyword: "existing keyword", position: 10, search_volume: 1000, competition: 0.5 },
            { keyword: "new keyword", position: 5, search_volume: 2000, competition: 0.3 },
          ],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const newKeyword = result.keyword_movements.find(k => k.keyword === "new keyword");
    expect(newKeyword).toBeDefined();
    expect(newKeyword?.movement_type).toBe("NEW");
  });

  it("should detect IMPROVED keywords", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [
            { keyword: "test keyword", position: 20, search_volume: 1000, competition: 0.5 },
          ],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [
            { keyword: "test keyword", position: 5, search_volume: 1000, competition: 0.5 },
          ],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const improved = result.keyword_movements.find(k => k.keyword === "test keyword");
    expect(improved).toBeDefined();
    expect(improved?.movement_type).toBe("IMPROVED");
    expect(improved?.position_change).toBe(15); // 20 - 5 = 15 positions improved
  });

  it("should detect DECLINED keywords", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [
            { keyword: "test keyword", position: 5, search_volume: 1000, competition: 0.5 },
          ],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [
            { keyword: "test keyword", position: 25, search_volume: 1000, competition: 0.5 },
          ],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const declined = result.keyword_movements.find(k => k.keyword === "test keyword");
    expect(declined).toBeDefined();
    expect(declined?.movement_type).toBe("DECLINED");
    expect(declined?.position_change).toBe(-20); // 5 - 25 = -20
  });

  it("should detect LOST keywords", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [
            { keyword: "lost keyword", position: 8, search_volume: 1000, competition: 0.5 },
          ],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [], // Keyword no longer ranking
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const lost = result.keyword_movements.find(k => k.keyword === "lost keyword");
    expect(lost).toBeDefined();
    expect(lost?.movement_type).toBe("LOST");
  });

  it("should detect STABLE keywords", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [
            { keyword: "stable keyword", position: 10, search_volume: 1000, competition: 0.5 },
          ],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [
            { keyword: "stable keyword", position: 10, search_volume: 1000, competition: 0.5 },
          ],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const stable = result.keyword_movements.find(k => k.keyword === "stable keyword");
    expect(stable).toBeDefined();
    expect(stable?.movement_type).toBe("STABLE");
  });
});

// ============================================
// GEO Change Tests
// ============================================

describe("DeltaEngine - GEO Changes", () => {
  it("should detect RADIUS_EXPANDED", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        geo: {
          centerLat: -27.4698,
          centerLng: 153.0251,
          radiusKm: 10,
          targetSuburbs: ["Brisbane CBD"],
          gapSuburbs: ["Red Hill"],
          coveragePercentage: 50,
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        geo: {
          centerLat: -27.4698,
          centerLng: 153.0251,
          radiusKm: 20,
          targetSuburbs: ["Brisbane CBD", "South Brisbane"],
          gapSuburbs: ["Red Hill", "Spring Hill"],
          coveragePercentage: 40,
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const radiusChange = result.geo_changes.find(g => g.change_type === "RADIUS_EXPANDED");
    expect(radiusChange).toBeDefined();
    expect(radiusChange?.previous_radius_km).toBe(10);
    expect(radiusChange?.current_radius_km).toBe(20);
  });

  it("should detect COVERAGE_IMPROVED", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        geo: {
          centerLat: -27.4698,
          centerLng: 153.0251,
          radiusKm: 10,
          targetSuburbs: ["Brisbane CBD"],
          gapSuburbs: ["Red Hill", "Spring Hill", "Kangaroo Point"],
          coveragePercentage: 40,
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        geo: {
          centerLat: -27.4698,
          centerLng: 153.0251,
          radiusKm: 10,
          targetSuburbs: ["Brisbane CBD", "Red Hill", "Spring Hill"],
          gapSuburbs: ["Kangaroo Point"],
          coveragePercentage: 75,
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const coverageChange = result.geo_changes.find(g => g.change_type === "COVERAGE_IMPROVED");
    expect(coverageChange).toBeDefined();
  });

  it("should detect NEW_GAPS", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        geo: {
          centerLat: -27.4698,
          centerLng: 153.0251,
          radiusKm: 10,
          targetSuburbs: ["Brisbane CBD"],
          gapSuburbs: ["Red Hill"],
          coveragePercentage: 80,
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        geo: {
          centerLat: -27.4698,
          centerLng: 153.0251,
          radiusKm: 10,
          targetSuburbs: ["Brisbane CBD"],
          gapSuburbs: ["Red Hill", "Spring Hill", "New Gap"],
          coveragePercentage: 60,
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const newGaps = result.geo_changes.find(g => g.change_type === "NEW_GAPS");
    expect(newGaps).toBeDefined();
    expect(newGaps?.new_gap_suburbs).toContain("Spring Hill");
    expect(newGaps?.new_gap_suburbs).toContain("New Gap");
  });

  it("should detect GAPS_CLOSED", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        geo: {
          centerLat: -27.4698,
          centerLng: 153.0251,
          radiusKm: 10,
          targetSuburbs: ["Brisbane CBD"],
          gapSuburbs: ["Red Hill", "Spring Hill"],
          coveragePercentage: 50,
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        geo: {
          centerLat: -27.4698,
          centerLng: 153.0251,
          radiusKm: 10,
          targetSuburbs: ["Brisbane CBD", "Red Hill"],
          gapSuburbs: ["Spring Hill"],
          coveragePercentage: 70,
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const closedGaps = result.geo_changes.find(g => g.change_type === "GAPS_CLOSED");
    expect(closedGaps).toBeDefined();
    expect(closedGaps?.closed_gap_suburbs).toContain("Red Hill");
  });
});

// ============================================
// Competitor Change Tests
// ============================================

describe("DeltaEngine - Competitor Changes", () => {
  it("should detect GAINING competitor", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [],
          competitors: [
            { domain: "competitor.com", keywords_overlap: 40, rank_average: 10.0 },
          ],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [],
          competitors: [
            { domain: "competitor.com", keywords_overlap: 60, rank_average: 5.0 },
          ],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const gaining = result.competitor_changes.find(c => c.competitor_domain === "competitor.com");
    expect(gaining).toBeDefined();
    expect(gaining?.change_type).toBe("GAINING");
  });

  it("should detect DECLINING competitor", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [],
          competitors: [
            { domain: "competitor.com", keywords_overlap: 70, rank_average: 3.0 },
          ],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [],
          competitors: [
            { domain: "competitor.com", keywords_overlap: 50, rank_average: 12.0 },
          ],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    const declining = result.competitor_changes.find(c => c.competitor_domain === "competitor.com");
    expect(declining).toBeDefined();
    expect(declining?.change_type).toBe("DECLINING");
  });
});

// ============================================
// Time Span and Summary Tests
// ============================================

describe("DeltaEngine - Time Span and Summary", () => {
  it("should calculate time span correctly", async () => {
    const previous = createMockAudit({ timestamp: "2025-01-01T00:00:00Z" });
    const current = createMockAudit({ timestamp: "2025-01-15T00:00:00Z" });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.time_span_days).toBe(14);
  });

  it("should generate summary with trend emoji", async () => {
    const previous = createMockAudit({ health_score: 50, timestamp: "2025-01-01T00:00:00Z" });
    const current = createMockAudit({ health_score: 80, timestamp: "2025-01-08T00:00:00Z" });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.summary).toContain("📈");
    expect(result.summary).toContain("IMPROVING");
  });

  it("should include top wins in summary", async () => {
    const previous = createMockAudit({ health_score: 50, timestamp: "2025-01-01T00:00:00Z" });
    const current = createMockAudit({ health_score: 80, timestamp: "2025-01-08T00:00:00Z" });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.top_wins.length).toBeGreaterThan(0);
    expect(result.top_wins[0]).toContain("Health score improved");
  });

  it("should be deterministic for same inputs", async () => {
    const previous = createMockAudit({ health_score: 60, timestamp: "2025-01-01T00:00:00Z" });
    const current = createMockAudit({ health_score: 70, timestamp: "2025-01-08T00:00:00Z" });

    const result1 = await DeltaEngine.computeDelta(previous, current);
    const result2 = await DeltaEngine.computeDelta(previous, current);

    expect(result1.overall_trend).toBe(result2.overall_trend);
    expect(result1.health_score_delta.absolute_change).toBe(result2.health_score_delta.absolute_change);
    expect(result1.summary).toBe(result2.summary);
  });
});

// ============================================
// Edge Case Tests
// ============================================

describe("DeltaEngine - Edge Cases", () => {
  it("should handle missing GSC data gracefully", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {},
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {},
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.metric_deltas.length).toBe(0);
    expect(result.overall_trend).toBeDefined();
  });

  it("should handle missing GEO data gracefully", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: { geo: undefined },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: { geo: undefined },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.geo_changes.length).toBe(0);
  });

  it("should handle zero values without division errors", async () => {
    const previous = createMockAudit({
      health_score: 0,
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        gsc: {
          queries: [],
          pages: [],
          totalClicks: 0,
          totalImpressions: 0,
          averageCTR: 0,
          averagePosition: 0,
        },
      },
    });

    const current = createMockAudit({
      health_score: 50,
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        gsc: {
          queries: [],
          pages: [],
          totalClicks: 100,
          totalImpressions: 5000,
          averageCTR: 0.02,
          averagePosition: 10,
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.health_score_delta.percentage_change).toBe(0); // Cannot calculate % from 0
    expect(result.overall_trend).toBe("IMPROVING");
  });

  it("should handle empty keyword arrays", async () => {
    const previous = createMockAudit({
      timestamp: "2025-01-01T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const current = createMockAudit({
      timestamp: "2025-01-08T00:00:00Z",
      data_sources: {
        dataForSEO: {
          rankedKeywords: [],
          competitors: [],
          questions: [],
          relatedKeywords: [],
        },
      },
    });

    const result = await DeltaEngine.computeDelta(previous, current);

    expect(result.keyword_movements.length).toBe(0);
    expect(result.competitor_changes.length).toBe(0);
  });
});
