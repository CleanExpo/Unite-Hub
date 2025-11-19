/**
 * Entity Engine Unit Tests - Phase 8 Week 22
 *
 * 15 unit tests for entity analysis functionality.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DataForSEO client
vi.mock("@/server/dataforseoClient", () => ({
  default: vi.fn().mockImplementation(() => ({
    getDomainCategories: vi.fn(),
    getRankedKeywordsWithIntent: vi.fn(),
    getContentEntities: vi.fn(),
  })),
}));

// Import after mocking
import { EntityEngine } from "../seo/entityEngine";

describe("EntityEngine", () => {
  let engine: EntityEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new EntityEngine("test-login", "test-password");
  });

  describe("buildProfile", () => {
    it("should create a basic profile with all required fields", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([
        { category: "Business/Construction", confidence: 0.85 },
        { category: "Home/Improvement", confidence: 0.65 },
      ]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([
        {
          keyword: "plumber brisbane",
          position: 3,
          search_volume: 2400,
          competition: 0.65,
          cpc: 5.5,
          search_intent: "transactional",
          is_featured_snippet: false,
          is_knowledge_panel: false,
          etv: 500,
        },
      ]);
      mockClient.getContentEntities.mockResolvedValue([
        {
          name: "plumber",
          entity_type: "profession",
          sentiment: "neutral",
          sentiment_score: 0,
          salience: 0.8,
          mentions: 5,
        },
      ]);

      const profile = await engine.buildProfile("plumber-brisbane.com.au");

      expect(profile.domain).toBe("plumber-brisbane.com.au");
      expect(profile.primary_category).toBe("Business/Construction");
      expect(profile.topical_match_score).toBeGreaterThanOrEqual(0);
      expect(profile.entity_alignment_score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Intent Distribution", () => {
    it("should calculate correct intent percentages", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([
        { keyword: "how to fix pipe", search_intent: "informational", position: 5 },
        { keyword: "plumber near me", search_intent: "transactional", position: 3 },
        { keyword: "plumber cost", search_intent: "commercial", position: 8 },
        { keyword: "company name", search_intent: "navigational", position: 1 },
        { keyword: "emergency plumber", search_intent: "transactional", position: 4 },
      ]);
      mockClient.getContentEntities.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.keyword_intents.informational).toBe(20); // 1/5
      expect(profile.keyword_intents.transactional).toBe(40); // 2/5
      expect(profile.keyword_intents.commercial).toBe(20); // 1/5
      expect(profile.keyword_intents.navigational).toBe(20); // 1/5
    });

    it("should handle empty keywords", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([]);
      mockClient.getContentEntities.mockResolvedValue([]);

      const profile = await engine.buildProfile("empty.com");

      expect(profile.keyword_intents.informational).toBe(0);
      expect(profile.keyword_intents.transactional).toBe(0);
    });
  });

  describe("Entity Scoring", () => {
    it("should boost entities matching categories", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([
        { category: "Construction/Plumbing", confidence: 0.9 },
      ]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([]);
      mockClient.getContentEntities.mockResolvedValue([
        {
          name: "plumbing",
          entity_type: "service",
          sentiment: "neutral",
          sentiment_score: 0,
          salience: 0.5,
          mentions: 3,
        },
        {
          name: "random word",
          entity_type: "other",
          sentiment: "neutral",
          sentiment_score: 0,
          salience: 0.5,
          mentions: 3,
        },
      ]);

      const profile = await engine.buildProfile("test.com");

      const plumbingEntity = profile.entities.find((e) => e.name === "plumbing");
      const randomEntity = profile.entities.find((e) => e.name === "random word");

      // Plumbing should score higher due to category match
      expect(plumbingEntity!.relevance_score).toBeGreaterThan(
        randomEntity!.relevance_score
      );
    });

    it("should assign correct topical fit levels", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([
        { category: "Technology", confidence: 0.8 },
      ]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([]);
      mockClient.getContentEntities.mockResolvedValue([
        {
          name: "technology",
          entity_type: "topic",
          sentiment: "positive",
          sentiment_score: 0.8,
          salience: 0.9,
          mentions: 10,
        },
        {
          name: "medium term",
          entity_type: "misc",
          sentiment: "neutral",
          sentiment_score: 0,
          salience: 0.4,
          mentions: 3,
        },
        {
          name: "random",
          entity_type: "other",
          sentiment: "negative",
          sentiment_score: -0.5,
          salience: 0.1,
          mentions: 1,
        },
      ]);

      const profile = await engine.buildProfile("tech.com");

      const highFit = profile.entities.find((e) => e.name === "technology");
      const lowFit = profile.entities.find((e) => e.name === "random");

      expect(highFit!.topical_fit).toBe("HIGH");
      expect(lowFit!.topical_fit).toBe("LOW");
    });
  });

  describe("Sentiment Distribution", () => {
    it("should calculate correct sentiment percentages", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([]);
      mockClient.getContentEntities.mockResolvedValue([
        { name: "great", sentiment: "positive", salience: 0.5, mentions: 1 },
        { name: "good", sentiment: "positive", salience: 0.5, mentions: 1 },
        { name: "normal", sentiment: "neutral", salience: 0.5, mentions: 1 },
        { name: "bad", sentiment: "negative", salience: 0.5, mentions: 1 },
      ]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.sentiment_distribution.positive).toBe(50); // 2/4
      expect(profile.sentiment_distribution.neutral).toBe(25); // 1/4
      expect(profile.sentiment_distribution.negative).toBe(25); // 1/4
    });
  });

  describe("Entity Clusters", () => {
    it("should group entities by type", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([]);
      mockClient.getContentEntities.mockResolvedValue([
        { name: "Brisbane", entity_type: "location", sentiment: "neutral", salience: 0.6, mentions: 3 },
        { name: "Sydney", entity_type: "location", sentiment: "neutral", salience: 0.4, mentions: 2 },
        { name: "plumber", entity_type: "profession", sentiment: "neutral", salience: 0.8, mentions: 5 },
        { name: "electrician", entity_type: "profession", sentiment: "neutral", salience: 0.3, mentions: 1 },
      ]);

      const profile = await engine.buildProfile("test.com");

      const locationCluster = profile.entity_clusters.find(
        (c) => c.entity_type === "location"
      );
      const professionCluster = profile.entity_clusters.find(
        (c) => c.entity_type === "profession"
      );

      expect(locationCluster!.count).toBe(2);
      expect(locationCluster!.entities).toContain("Brisbane");
      expect(professionCluster!.count).toBe(2);
    });
  });

  describe("SERP Features", () => {
    it("should count featured snippets and knowledge panels", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([
        { keyword: "kw1", is_featured_snippet: true, is_knowledge_panel: false, position: 1 },
        { keyword: "kw2", is_featured_snippet: false, is_knowledge_panel: true, position: 2 },
        { keyword: "kw3", is_featured_snippet: true, is_knowledge_panel: true, position: 3 },
        { keyword: "kw4", is_featured_snippet: false, is_knowledge_panel: false, position: 5 },
      ]);
      mockClient.getContentEntities.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.serp_features.featured_snippets).toBe(2);
      expect(profile.serp_features.knowledge_panels).toBe(2);
      expect(profile.serp_features.total_keywords).toBe(4);
    });
  });

  describe("Topical Gap Analysis", () => {
    it("should identify missing entities for plumbing topic", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([
        { category: "Home/Services", confidence: 0.7 },
      ]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([
        { keyword: "plumber brisbane", search_intent: "transactional", position: 5 },
      ]);
      mockClient.getContentEntities.mockResolvedValue([
        { name: "plumber", entity_type: "profession", sentiment: "neutral", salience: 0.7, mentions: 4 },
        // Missing: pipes, drainage, water heater, etc.
      ]);

      const analysis = await engine.analyzeTopicalGaps(
        "test.com",
        "plumbing services"
      );

      expect(analysis.target_topic).toBe("plumbing services");
      expect(analysis.gap_entities.length).toBeGreaterThan(0);
      expect(analysis.recommended_content.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty entities gracefully", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([]);
      mockClient.getContentEntities.mockResolvedValue([]);

      const profile = await engine.buildProfile("empty.com");

      expect(profile.entity_count).toBe(0);
      expect(profile.topical_match_score).toBe(50); // Default score
      expect(profile.entity_clusters).toHaveLength(0);
    });

    it("should deduplicate entities by name", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue([]);
      mockClient.getContentEntities.mockResolvedValue([
        { name: "Brisbane", entity_type: "location", sentiment: "neutral", salience: 0.5, mentions: 2 },
        { name: "Brisbane", entity_type: "location", sentiment: "positive", salience: 0.8, mentions: 5 },
        { name: "brisbane", entity_type: "location", sentiment: "neutral", salience: 0.3, mentions: 1 },
      ]);

      const profile = await engine.buildProfile("test.com");

      // Should keep only the one with highest salience
      const brisbaneEntities = profile.entities.filter(
        (e) => e.name.toLowerCase() === "brisbane"
      );
      expect(brisbaneEntities).toHaveLength(1);
      expect(brisbaneEntities[0].salience).toBe(0.8);
    });

    it("should limit top keywords to specified count", async () => {
      const mockClient = (engine as any).client;
      mockClient.getDomainCategories.mockResolvedValue([]);
      mockClient.getRankedKeywordsWithIntent.mockResolvedValue(
        Array(20).fill({
          keyword: "test",
          search_intent: "informational",
          position: 5,
        })
      );
      mockClient.getContentEntities.mockResolvedValue([]);

      const profile = await engine.buildProfile("test.com");

      expect(profile.top_informational_keywords.length).toBeLessThanOrEqual(10);
    });
  });
});
