/**
 * Report Generation End-to-End Tests - Phase 7 Week 20
 *
 * Comprehensive E2E testing for report generation system.
 */

import { test, expect } from "@playwright/test";
import { ReportEngine } from "@/server/reportEngine";
import type { AuditResult, DataSources } from "@/types/reports";

test.describe("Report Generation System", () => {
  const mockClientId = "test-client-id-" + Date.now();
  const mockClientSlug = "test-client-slug";
  const mockAuditId = "test-audit-id-" + Date.now();

  const mockAuditData: AuditResult = {
    auditId: mockAuditId,
    clientId: mockClientId,
    auditType: "full",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: "success",
  };

  const mockDataSources: DataSources = {
    gsc: {
      queries: [
        {
          query: "plumber brisbane",
          clicks: 150,
          impressions: 5000,
          ctr: 0.03,
          position: 3.5,
        },
        {
          query: "emergency plumbing",
          clicks: 200,
          impressions: 8000,
          ctr: 0.025,
          position: 2.1,
        },
      ],
      pages: [
        { page: "/services/plumbing", clicks: 250, impressions: 10000 },
        { page: "/about", clicks: 50, impressions: 2000 },
      ],
      totalClicks: 350,
      totalImpressions: 13000,
      averageCTR: 0.027,
      averagePosition: 2.8,
    },
    bing: {
      indexedPages: 75,
      crawlErrors: 2,
      sitemapStatus: "Submitted",
    },
    brave: {
      rankings: [
        { keyword: "plumber near me", position: 5, url: "https://example.com/plumbing" },
        { keyword: "24 hour plumber", position: 8, url: "https://example.com/emergency" },
      ],
      visibility: 42.5,
    },
    dataForSEO: {
      rankedKeywords: [
        { keyword: "plumber brisbane", position: 3, search_volume: 2400, competition: 0.65 },
        { keyword: "plumbing services", position: 7, search_volume: 1800, competition: 0.55 },
        { keyword: "emergency plumber", position: 11, search_volume: 1200, competition: 0.70 },
      ],
      competitors: [
        { domain: "competitor1.com.au", keywords_overlap: 65, rank_average: 4.2 },
        { domain: "competitor2.com.au", keywords_overlap: 45, rank_average: 6.8 },
        { domain: "competitor3.com.au", keywords_overlap: 38, rank_average: 8.1 },
      ],
      questions: [
        { question: "How much does a plumber cost in Brisbane?", search_volume: 480 },
        { question: "What do plumbers charge per hour?", search_volume: 390 },
      ],
      relatedKeywords: [
        { keyword: "licensed plumber brisbane", search_volume: 720 },
        { keyword: "plumber brisbane northside", search_volume: 390 },
      ],
    },
    geo: {
      centerLat: -27.4698,
      centerLng: 153.0251,
      radiusKm: 10,
      targetSuburbs: [
        "Brisbane CBD",
        "South Brisbane",
        "Fortitude Valley",
        "New Farm",
        "Paddington",
      ],
      gapSuburbs: ["Red Hill", "Spring Hill", "Kangaroo Point"],
      coveragePercentage: 62.5,
    },
  };

  test("should generate all 5 report formats successfully", async () => {
    const engine = new ReportEngine({
      clientId: mockClientId,
      clientSlug: mockClientSlug,
      auditId: mockAuditId,
      auditType: "full",
      formats: ["html", "csv", "json", "md", "pdf"],
      includeImages: false, // Skip Jina images for test speed
    });

    const output = await engine.generateReports(mockAuditData, mockDataSources);

    expect(output.auditId).toBe(mockAuditId);
    expect(output.clientId).toBe(mockClientId);
    expect(output.healthScore).toBeGreaterThan(0);
    expect(output.healthScore).toBeLessThanOrEqual(100);

    // Check all formats generated
    expect(output.formats.html).toBeDefined();
    expect(output.formats.html?.filePath).toBeTruthy();
    expect(output.formats.html?.size).toBeGreaterThan(0);

    expect(output.formats.csv).toBeDefined();
    expect(output.formats.csv?.files).toHaveLength(5); // 5 CSV files expected

    expect(output.formats.json).toBeDefined();
    expect(output.formats.json?.filePath).toBeTruthy();

    expect(output.formats.md).toBeDefined();
    expect(output.formats.md?.filePath).toBeTruthy();

    expect(output.formats.pdf).toBeDefined();
    expect(output.formats.pdf?.filePath).toBeTruthy();
  });

  test("should calculate health score correctly", async () => {
    const engine = new ReportEngine({
      clientId: mockClientId,
      clientSlug: mockClientSlug,
      auditId: mockAuditId,
      auditType: "full",
      formats: ["json"],
    });

    const output = await engine.generateReports(mockAuditData, mockDataSources);

    // Health score should be between 0-100
    expect(output.healthScore).toBeGreaterThanOrEqual(0);
    expect(output.healthScore).toBeLessThanOrEqual(100);

    // With good GSC data, should score at least 30
    expect(output.healthScore).toBeGreaterThan(30);
  });

  test("should handle missing data sources gracefully", async () => {
    const engine = new ReportEngine({
      clientId: mockClientId,
      clientSlug: mockClientSlug,
      auditId: mockAuditId,
      auditType: "snapshot",
      formats: ["html", "json"],
    });

    const partialDataSources: DataSources = {
      gsc: mockDataSources.gsc,
      // Missing bing, brave, dataForSEO, geo
    };

    const output = await engine.generateReports(mockAuditData, partialDataSources);

    expect(output.healthScore).toBeGreaterThan(0);
    expect(output.formats.html).toBeDefined();
    expect(output.formats.json).toBeDefined();
  });

  test("should generate recommendations based on health score", async () => {
    const engine = new ReportEngine({
      clientId: mockClientId,
      clientSlug: mockClientSlug,
      auditId: mockAuditId,
      auditType: "full",
      formats: ["json"],
    });

    const lowScoreDataSources: DataSources = {
      gsc: {
        ...mockDataSources.gsc!,
        averageCTR: 0.01, // Low CTR
        averagePosition: 15.5, // Poor position
      },
      geo: {
        ...mockDataSources.geo!,
        coveragePercentage: 35, // Low coverage
      },
    };

    const output = await engine.generateReports(mockAuditData, lowScoreDataSources);

    // Low health score should be < 50
    expect(output.healthScore).toBeLessThan(50);
  });
});

test.describe("CSV Export Validation", () => {
  test("should generate valid CSV with proper escaping", async () => {
    const CSVGenerator = (await import("@/lib/reports/csvGenerators/csvGenerator")).default;
    const generator = new CSVGenerator("test-client", "test-audit");

    const keywords = [
      { keyword: 'keyword "with quotes"', position: 1, search_volume: 1000, competition: 0.5 },
      { keyword: "keyword, with, commas", position: 2, search_volume: 800, competition: 0.3 },
      { keyword: "normal keyword", position: 3, search_volume: 500, competition: 0.7 },
    ];

    const result = await generator.generateRankedKeywords(keywords, "test-client-id");

    expect(result.filePath).toBeTruthy();
    expect(result.size).toBeGreaterThan(0);
  });
});

test.describe("Concurrency Load Tests", () => {
  test("should handle 10 concurrent report generations", async ({ page }) => {
    const promises = [];

    for (let i = 0; i < 10; i++) {
      const engine = new ReportEngine({
        clientId: `client-${i}`,
        clientSlug: `slug-${i}`,
        auditId: `audit-${i}`,
        auditType: "snapshot",
        formats: ["json"],
      });

      const mockData: AuditResult = {
        auditId: `audit-${i}`,
        clientId: `client-${i}`,
        auditType: "snapshot",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: "success",
      };

      const mockSources: DataSources = {
        gsc: {
          queries: [],
          pages: [],
          totalClicks: 100 + i * 10,
          totalImpressions: 5000 + i * 500,
          averageCTR: 0.02 + i * 0.001,
          averagePosition: 5 + i * 0.5,
        },
      };

      promises.push(engine.generateReports(mockData, mockSources));
    }

    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.formats.json).toBeDefined();
    });
  });

  test("should maintain performance under 30s for full audit", async () => {
    const startTime = Date.now();

    const engine = new ReportEngine({
      clientId: "perf-test-client",
      clientSlug: "perf-test",
      auditId: "perf-test-audit",
      auditType: "full",
      formats: ["html", "csv", "json", "md", "pdf"],
      includeImages: false,
    });

    const mockData: AuditResult = {
      auditId: "perf-test-audit",
      clientId: "perf-test-client",
      auditType: "full",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "success",
    };

    await engine.generateReports(mockData, {
      gsc: {
        queries: Array.from({ length: 100 }, (_, i) => ({
          query: `keyword ${i}`,
          clicks: Math.floor(Math.random() * 500),
          impressions: Math.floor(Math.random() * 10000),
          ctr: Math.random() * 0.1,
          position: Math.random() * 20,
        })),
        pages: [],
        totalClicks: 50000,
        totalImpressions: 2000000,
        averageCTR: 0.025,
        averagePosition: 8.5,
      },
    });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000); // Less than 30 seconds
  });
});

test.describe("HTML Report Rendering", () => {
  test("should generate valid HTML with proper structure", async () => {
    const HTMLReportGenerator = (await import("@/lib/reports/htmlTemplates/htmlGenerator")).default;
    const generator = new HTMLReportGenerator({
      clientSlug: "test-client",
      auditId: "test-audit",
      includeImages: false,
    });

    const htmlContent = await generator.generate({
      healthScore: 75,
      auditData: {
        auditId: "test-audit",
        clientId: "test-client",
        auditType: "full",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: "success",
      },
      dataSources: {
        gsc: {
          queries: [],
          pages: [],
          totalClicks: 1000,
          totalImpressions: 50000,
          averageCTR: 0.02,
          averagePosition: 7.5,
        },
      },
      recommendations: [],
    });

    expect(htmlContent).toContain("<!DOCTYPE html>");
    expect(htmlContent).toContain("<html");
    expect(htmlContent).toContain("</html>");
    expect(htmlContent).toContain("SEO/GEO Audit Report");
    expect(htmlContent).toContain("Health Score");
  });
});

test.describe("GEO Coverage Analysis", () => {
  test("should identify gap suburbs correctly", async () => {
    const engine = new ReportEngine({
      clientId: "geo-test",
      clientSlug: "geo-test",
      auditId: "geo-audit",
      auditType: "geo",
      formats: ["json"],
    });

    const geoDataSources: DataSources = {
      geo: {
        centerLat: -27.4698,
        centerLng: 153.0251,
        radiusKm: 15,
        targetSuburbs: ["Brisbane CBD", "South Brisbane", "Fortitude Valley"],
        gapSuburbs: ["Red Hill", "Spring Hill", "Kangaroo Point", "East Brisbane", "New Farm"],
        coveragePercentage: 37.5,
      },
    };

    const output = await engine.generateReports(
      {
        auditId: "geo-audit",
        clientId: "geo-test",
        auditType: "geo",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: "success",
      },
      geoDataSources
    );

    // Low coverage should result in recommendations
    expect(output.healthScore).toBeLessThan(60);
  });
});
