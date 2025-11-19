/**
 * Backlink Engine Unit Tests - Phase 8 Week 22
 *
 * 25 unit tests for backlink analysis functionality.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DataForSEO client
vi.mock("@/server/dataforseoClient", () => ({
  default: vi.fn().mockImplementation(() => ({
    getBacklinks: vi.fn(),
    getBacklinksForDomain: vi.fn(),
    getReferringDomains: vi.fn(),
    getAnchorTextDistribution: vi.fn(),
    getBacklinksHistory: vi.fn(),
  })),
}));

// Import after mocking
import { BacklinkEngine } from "../seo/backlinkEngine";

describe("BacklinkEngine", () => {
  let engine: BacklinkEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new BacklinkEngine("test-login", "test-password");
  });

  describe("buildProfile", () => {
    it("should create a basic profile with all required fields", async () => {
      // Mock the client methods
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 1000,
        referringDomains: 200,
        referringIPs: 150,
        rank: 50,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([
        {
          source_url: "https://example.com/page",
          source_domain: "example.com",
          target_url: "https://target.com",
          anchor_text: "click here",
          link_type: "dofollow",
          first_seen: "2025-01-01",
          last_seen: "2025-01-20",
          rank: 60,
          page_from_rank: 55,
          domain_from_rank: 65,
          is_new: false,
          is_lost: false,
          is_broken: false,
        },
      ]);
      mockClient.getReferringDomains.mockResolvedValue([
        {
          domain: "example.com",
          rank: 60,
          backlinks: 5,
          first_seen: "2025-01-01",
          lost_date: null,
          dofollow_count: 4,
          nofollow_count: 1,
          redirect_count: 0,
          country: "US",
          spam_score: 10,
          broken_backlinks: 0,
          broken_pages: 0,
          referring_pages: 5,
        },
      ]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([
        {
          anchor: "brand name",
          backlinks: 50,
          referring_domains: 30,
          first_seen: "2025-01-01",
          last_seen: "2025-01-20",
          dofollow: 45,
          nofollow: 5,
        },
      ]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("target.com");

      expect(profile.domain).toBe("target.com");
      expect(profile.total_backlinks).toBe(1000);
      expect(profile.referring_domains).toBe(200);
      expect(profile.backlink_score).toBeGreaterThanOrEqual(0);
      expect(profile.backlink_score).toBeLessThanOrEqual(100);
    });

    it("should calculate correct dofollow ratio", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 100,
        referringDomains: 50,
        referringIPs: 40,
        rank: 50,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([
        { link_type: "dofollow" },
        { link_type: "dofollow" },
        { link_type: "dofollow" },
        { link_type: "nofollow" },
        { link_type: "nofollow" },
      ]);
      mockClient.getReferringDomains.mockResolvedValue([]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.dofollow_ratio).toBe(60); // 3/5 = 60%
      expect(profile.dofollow_count).toBe(3);
      expect(profile.nofollow_count).toBe(2);
    });
  });

  describe("Authority Score Calculation", () => {
    it("should calculate high authority for high-rank domains", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 500,
        referringDomains: 100,
        referringIPs: 80,
        rank: 70,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([
        { domain: "high1.com", rank: 80, spam_score: 5, country: "US", backlinks: 10 },
        { domain: "high2.com", rank: 90, spam_score: 3, country: "US", backlinks: 8 },
        { domain: "high3.com", rank: 85, spam_score: 7, country: "UK", backlinks: 6 },
      ]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.authority_score).toBeGreaterThan(70);
    });

    it("should calculate low authority for low-rank domains", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 100,
        referringDomains: 30,
        referringIPs: 20,
        rank: 20,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([
        { domain: "low1.com", rank: 10, spam_score: 30, country: "US", backlinks: 5 },
        { domain: "low2.com", rank: 15, spam_score: 40, country: "US", backlinks: 3 },
      ]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.authority_score).toBeLessThan(30);
    });
  });

  describe("Toxic Score Calculation", () => {
    it("should detect high toxic score when many spammy domains", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 200,
        referringDomains: 50,
        referringIPs: 40,
        rank: 40,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([
        { domain: "spam1.com", rank: 10, spam_score: 80, country: "CN", backlinks: 20 },
        { domain: "spam2.com", rank: 5, spam_score: 90, country: "RU", backlinks: 15 },
        { domain: "spam3.com", rank: 8, spam_score: 75, country: "IN", backlinks: 10 },
        { domain: "good.com", rank: 60, spam_score: 5, country: "US", backlinks: 5 },
      ]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.toxic_score).toBeGreaterThan(50); // 3/4 toxic = 75%
    });

    it("should detect low toxic score when domains are clean", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 300,
        referringDomains: 80,
        referringIPs: 60,
        rank: 60,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([
        { domain: "clean1.com", rank: 70, spam_score: 5, country: "US", backlinks: 30 },
        { domain: "clean2.com", rank: 65, spam_score: 10, country: "UK", backlinks: 25 },
        { domain: "clean3.com", rank: 75, spam_score: 8, country: "CA", backlinks: 20 },
      ]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.toxic_score).toBe(0); // 0/3 toxic
    });
  });

  describe("Anchor Diversity Score", () => {
    it("should penalize over-optimized anchors", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 100,
        referringDomains: 50,
        referringIPs: 40,
        rank: 50,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([
        { anchor: "money keyword", backlinks: 80, referring_domains: 60 }, // 80% - over-optimized
        { anchor: "brand", backlinks: 10, referring_domains: 8 },
        { anchor: "click here", backlinks: 10, referring_domains: 5 },
      ]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.anchor_diversity_score).toBeLessThan(50); // Penalized for over-optimization
    });

    it("should reward diverse anchor distribution", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 100,
        referringDomains: 50,
        referringIPs: 40,
        rank: 50,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([
        { anchor: "brand name", backlinks: 20, referring_domains: 15 },
        { anchor: "keyword 1", backlinks: 15, referring_domains: 12 },
        { anchor: "keyword 2", backlinks: 15, referring_domains: 10 },
        { anchor: "click here", backlinks: 10, referring_domains: 8 },
        { anchor: "url", backlinks: 10, referring_domains: 7 },
        { anchor: "various", backlinks: 30, referring_domains: 20 },
      ]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.anchor_diversity_score).toBeGreaterThan(60);
    });
  });

  describe("Velocity Trend Detection", () => {
    it("should detect GROWING trend when backlinks increase", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 500,
        referringDomains: 100,
        referringIPs: 80,
        rank: 60,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([
        // Week 1 (older)
        { date: "2025-01-01", backlinks: 400, referring_domains: 80 },
        { date: "2025-01-02", backlinks: 405, referring_domains: 81 },
        { date: "2025-01-03", backlinks: 410, referring_domains: 82 },
        { date: "2025-01-04", backlinks: 415, referring_domains: 83 },
        { date: "2025-01-05", backlinks: 420, referring_domains: 84 },
        { date: "2025-01-06", backlinks: 425, referring_domains: 85 },
        { date: "2025-01-07", backlinks: 430, referring_domains: 86 },
        // Week 4 (newer) - significant growth
        { date: "2025-01-24", backlinks: 480, referring_domains: 95 },
        { date: "2025-01-25", backlinks: 485, referring_domains: 96 },
        { date: "2025-01-26", backlinks: 490, referring_domains: 97 },
        { date: "2025-01-27", backlinks: 495, referring_domains: 98 },
        { date: "2025-01-28", backlinks: 500, referring_domains: 99 },
        { date: "2025-01-29", backlinks: 505, referring_domains: 100 },
        { date: "2025-01-30", backlinks: 510, referring_domains: 101 },
      ]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.velocity_trend).toBe("GROWING");
      expect(profile.new_backlinks_30d).toBeGreaterThan(0);
    });

    it("should detect DECLINING trend when backlinks decrease", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 300,
        referringDomains: 60,
        referringIPs: 50,
        rank: 40,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([
        // Week 1 (older) - higher
        { date: "2025-01-01", backlinks: 400, referring_domains: 80 },
        { date: "2025-01-02", backlinks: 398, referring_domains: 79 },
        { date: "2025-01-03", backlinks: 395, referring_domains: 78 },
        { date: "2025-01-04", backlinks: 392, referring_domains: 77 },
        { date: "2025-01-05", backlinks: 390, referring_domains: 76 },
        { date: "2025-01-06", backlinks: 388, referring_domains: 75 },
        { date: "2025-01-07", backlinks: 385, referring_domains: 74 },
        // Week 4 (newer) - significant decline
        { date: "2025-01-24", backlinks: 320, referring_domains: 64 },
        { date: "2025-01-25", backlinks: 315, referring_domains: 63 },
        { date: "2025-01-26", backlinks: 312, referring_domains: 62 },
        { date: "2025-01-27", backlinks: 308, referring_domains: 61 },
        { date: "2025-01-28", backlinks: 305, referring_domains: 60 },
        { date: "2025-01-29", backlinks: 302, referring_domains: 59 },
        { date: "2025-01-30", backlinks: 300, referring_domains: 58 },
      ]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.velocity_trend).toBe("DECLINING");
      expect(profile.lost_backlinks_30d).toBeGreaterThan(0);
    });

    it("should detect STABLE trend when minimal change", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 400,
        referringDomains: 80,
        referringIPs: 60,
        rank: 50,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([
        { date: "2025-01-01", backlinks: 400, referring_domains: 80 },
        { date: "2025-01-02", backlinks: 401, referring_domains: 80 },
        { date: "2025-01-03", backlinks: 399, referring_domains: 80 },
        { date: "2025-01-04", backlinks: 400, referring_domains: 80 },
        { date: "2025-01-05", backlinks: 402, referring_domains: 80 },
        { date: "2025-01-06", backlinks: 400, referring_domains: 80 },
        { date: "2025-01-07", backlinks: 401, referring_domains: 80 },
        { date: "2025-01-24", backlinks: 402, referring_domains: 80 },
        { date: "2025-01-25", backlinks: 400, referring_domains: 80 },
        { date: "2025-01-26", backlinks: 401, referring_domains: 80 },
        { date: "2025-01-27", backlinks: 399, referring_domains: 80 },
        { date: "2025-01-28", backlinks: 400, referring_domains: 80 },
        { date: "2025-01-29", backlinks: 402, referring_domains: 80 },
        { date: "2025-01-30", backlinks: 401, referring_domains: 80 },
      ]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.velocity_trend).toBe("STABLE");
    });
  });

  describe("Country Breakdown", () => {
    it("should correctly aggregate countries", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 100,
        referringDomains: 50,
        referringIPs: 40,
        rank: 50,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([
        { domain: "us1.com", rank: 50, spam_score: 5, country: "US", backlinks: 10 },
        { domain: "us2.com", rank: 55, spam_score: 8, country: "US", backlinks: 8 },
        { domain: "uk1.com", rank: 60, spam_score: 3, country: "UK", backlinks: 6 },
        { domain: "ca1.com", rank: 45, spam_score: 10, country: "CA", backlinks: 4 },
        { domain: "us3.com", rank: 52, spam_score: 7, country: "US", backlinks: 5 },
      ]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.countries).toHaveLength(3);
      expect(profile.countries[0]).toEqual({ country: "US", count: 3 });
      expect(profile.countries[1]).toEqual({ country: "UK", count: 1 });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty backlinks gracefully", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 0,
        referringDomains: 0,
        referringIPs: 0,
        rank: 0,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("new-domain.com");

      expect(profile.total_backlinks).toBe(0);
      expect(profile.backlink_score).toBeGreaterThanOrEqual(0);
      expect(profile.velocity_trend).toBe("STABLE");
    });

    it("should handle missing history data", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 100,
        referringDomains: 50,
        referringIPs: 40,
        rank: 50,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue([]);
      mockClient.getReferringDomains.mockResolvedValue([]);
      mockClient.getAnchorTextDistribution.mockResolvedValue([]);
      mockClient.getBacklinksHistory.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com", {
        includeHistory: false,
      });

      expect(profile.history_30d).toHaveLength(0);
      expect(profile.velocity_trend).toBe("STABLE");
    });

    it("should cap backlink score at 100", async () => {
      const mockClient = (engine as any).client;
      mockClient.getBacklinks.mockResolvedValue({
        totalBacklinks: 100000,
        referringDomains: 5000,
        referringIPs: 4000,
        rank: 95,
      });
      mockClient.getBacklinksForDomain.mockResolvedValue(
        Array(100).fill({ link_type: "dofollow" })
      );
      mockClient.getReferringDomains.mockResolvedValue(
        Array(50).fill({ domain: "high.com", rank: 90, spam_score: 1, country: "US", backlinks: 100 })
      );
      mockClient.getAnchorTextDistribution.mockResolvedValue(
        Array(50).fill({ anchor: "diverse", backlinks: 20, referring_domains: 15 })
      );
      mockClient.getBacklinksHistory.mockResolvedValue([
        { date: "2025-01-01", backlinks: 90000, referring_domains: 4500 },
        { date: "2025-01-30", backlinks: 100000, referring_domains: 5000 },
      ]);

      const profile = await engine.buildProfile("super-domain.com");

      expect(profile.backlink_score).toBeLessThanOrEqual(100);
    });
  });
});
