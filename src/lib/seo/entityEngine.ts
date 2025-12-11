/**
 * Entity Engine - Phase 8 Week 22
 *
 * Extracts and analyzes entities from domain content.
 * Computes topical match scores and entity alignment.
 */

import DataForSEOClient, {
  ContentEntity,
  KeywordWithIntent,
  DomainCategory,
} from "@/server/dataforseoClient";

// =============================================================
// Types
// =============================================================

export interface EntityProfile {
  domain: string;
  snapshot_date: string;

  // Entity analysis
  entities: EntityWithScore[];
  entity_count: number;
  unique_entity_types: string[];

  // Categories
  categories: DomainCategory[];
  primary_category: string;

  // Topical relevance
  topical_match_score: number; // 0-100
  entity_alignment_score: number; // 0-100

  // Keyword intent distribution
  keyword_intents: {
    informational: number;
    navigational: number;
    commercial: number;
    transactional: number;
  };

  // Top performing keywords by intent
  top_informational_keywords: KeywordWithIntent[];
  top_transactional_keywords: KeywordWithIntent[];

  // Entity clusters (grouped by type)
  entity_clusters: EntityCluster[];

  // Sentiment overview
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };

  // SERP features presence
  serp_features: {
    featured_snippets: number;
    knowledge_panels: number;
    total_keywords: number;
  };
}

export interface EntityWithScore extends ContentEntity {
  relevance_score: number;
  topical_fit: "HIGH" | "MEDIUM" | "LOW";
}

export interface EntityCluster {
  entity_type: string;
  entities: string[];
  count: number;
  avg_salience: number;
}

export interface EntityAnalysisOptions {
  urls?: string[];
  keywordLimit?: number;
  analyzeIntent?: boolean;
  extractEntities?: boolean;
}

export interface TopicalGapAnalysis {
  domain: string;
  target_topic: string;
  current_alignment: number;
  gap_entities: string[];
  gap_keywords: string[];
  recommended_content: string[];
  improvement_potential: number;
}

// =============================================================
// Entity Engine Class
// =============================================================

export class EntityEngine {
  private client: DataForSEOClient;

  constructor(login: string, password: string) {
    const DataForSEOImpl: any = DataForSEOClient as any;

    // Support both class-style SDK and function-style test mocks
    try {
      this.client = new DataForSEOImpl(login, password);
    } catch (error) {
      // Fallback: treat mocked client as a factory function that
      // returns an object implementing the expected interface.
      this.client = DataForSEOImpl(login, password);
    }
  }

  /**
   * Build comprehensive entity profile for a domain
   */
  async buildProfile(
    domain: string,
    options: EntityAnalysisOptions = {}
  ): Promise<EntityProfile> {
    const {
      urls = [`https://${domain}`, `https://${domain}/about`, `https://${domain}/services`],
      keywordLimit = 100,
      analyzeIntent = true,
      extractEntities = true,
    } = options;

    console.log(`[EntityEngine] Building profile for ${domain}...`);

    // Fetch data in parallel
    const [categories, keywordsWithIntent, entitiesArrays] = await Promise.all([
      this.client.getDomainCategories(domain),
      analyzeIntent
        ? this.client.getRankedKeywordsWithIntent(domain, keywordLimit)
        : Promise.resolve([]),
      extractEntities
        ? Promise.all(urls.map((url) => this.client.getContentEntities(url)))
        : Promise.resolve([[]]),
    ]);

    // Flatten and deduplicate entities
    const allEntities = this.deduplicateEntities(entitiesArrays.flat());

    // Score entities for relevance
    const scoredEntities = this.scoreEntities(allEntities, categories);

    // Calculate intent distribution
    const intentDistribution = this.calculateIntentDistribution(keywordsWithIntent);

    // Calculate topical match score
    const topicalMatchScore = this.calculateTopicalMatchScore(
      scoredEntities,
      categories
    );

    // Calculate entity alignment score
    const entityAlignmentScore = this.calculateEntityAlignmentScore(
      scoredEntities,
      keywordsWithIntent
    );

    // Build entity clusters
    const entityClusters = this.buildEntityClusters(allEntities);

    // Calculate sentiment distribution
    const sentimentDistribution = this.calculateSentimentDistribution(allEntities);

    // Calculate SERP features
    const serpFeatures = this.calculateSerpFeatures(keywordsWithIntent);

    // Get unique entity types
    const uniqueEntityTypes = [...new Set(allEntities.map((e) => e.entity_type))];

    return {
      domain,
      snapshot_date: new Date().toISOString(),

      // Entities
      entities: scoredEntities.slice(0, 50),
      entity_count: allEntities.length,
      unique_entity_types: uniqueEntityTypes,

      // Categories
      categories,
      primary_category: categories[0]?.category || "Unknown",

      // Scores
      topical_match_score: topicalMatchScore,
      entity_alignment_score: entityAlignmentScore,

      // Intent distribution
      keyword_intents: intentDistribution,

      // Top keywords by intent
      top_informational_keywords: keywordsWithIntent
        .filter((k) => k.search_intent === "informational")
        .slice(0, 10),
      top_transactional_keywords: keywordsWithIntent
        .filter((k) => k.search_intent === "transactional")
        .slice(0, 10),

      // Clusters
      entity_clusters: entityClusters,

      // Sentiment
      sentiment_distribution: sentimentDistribution,

      // SERP features
      serp_features: serpFeatures,
    };
  }

  /**
   * Deduplicate entities by name
   */
  private deduplicateEntities(entities: ContentEntity[]): ContentEntity[] {
    const seen = new Map<string, ContentEntity>();

    for (const entity of entities) {
      const key = entity.name.toLowerCase();
      const existing = seen.get(key);

      if (!existing || entity.salience > existing.salience) {
        seen.set(key, entity);
      }
    }

    return Array.from(seen.values()).sort((a, b) => b.salience - a.salience);
  }

  /**
   * Score entities for relevance
   */
  private scoreEntities(
    entities: ContentEntity[],
    categories: DomainCategory[]
  ): EntityWithScore[] {
    const categoryKeywords = categories.map((c) =>
      c.category.toLowerCase().split(/[\/\s]/)
    ).flat();

    return entities.map((entity) => {
      // Base score from salience
      let relevanceScore = entity.salience * 100;

      // Boost if entity matches category keywords
      const entityWords = entity.name.toLowerCase().split(/\s+/);
      const categoryMatch = entityWords.some((word) =>
        categoryKeywords.some((kw) => kw.includes(word) || word.includes(kw))
      );

      if (categoryMatch) {
        relevanceScore += 20;
      }

      // Boost for positive sentiment
      if (entity.sentiment === "positive") {
        relevanceScore += 10;
      } else if (entity.sentiment === "negative") {
        relevanceScore -= 10;
      }

      // Normalize to 0-100
      relevanceScore = Math.min(100, Math.max(0, relevanceScore));

      // Determine topical fit
      let topicalFit: "HIGH" | "MEDIUM" | "LOW";
      if (relevanceScore >= 70) {
        topicalFit = "HIGH";
      } else if (relevanceScore >= 40) {
        topicalFit = "MEDIUM";
      } else {
        topicalFit = "LOW";
      }

      return {
        ...entity,
        relevance_score: Math.round(relevanceScore),
        topical_fit: topicalFit,
      };
    });
  }

  /**
   * Calculate intent distribution
   */
  private calculateIntentDistribution(
    keywords: KeywordWithIntent[]
  ): EntityProfile["keyword_intents"] {
    if (keywords.length === 0) {
      return {
        informational: 0,
        navigational: 0,
        commercial: 0,
        transactional: 0,
      };
    }

    const counts = {
      informational: 0,
      navigational: 0,
      commercial: 0,
      transactional: 0,
    };

    for (const kw of keywords) {
      counts[kw.search_intent]++;
    }

    const total = keywords.length;

    return {
      informational: Math.round((counts.informational / total) * 100),
      navigational: Math.round((counts.navigational / total) * 100),
      commercial: Math.round((counts.commercial / total) * 100),
      transactional: Math.round((counts.transactional / total) * 100),
    };
  }

  /**
   * Calculate topical match score
   */
  private calculateTopicalMatchScore(
    entities: EntityWithScore[],
    categories: DomainCategory[]
  ): number {
    if (entities.length === 0) {
return 50;
}

    // Average relevance score of top entities
    const topEntities = entities.slice(0, 20);
    const avgRelevance =
      topEntities.reduce((sum, e) => sum + e.relevance_score, 0) /
      topEntities.length;

    // Bonus for having strong primary category
    const categoryBonus = categories[0]?.confidence
      ? categories[0].confidence * 10
      : 0;

    // Bonus for entity diversity
    const uniqueTypes = new Set(entities.map((e) => e.entity_type)).size;
    const diversityBonus = Math.min(10, uniqueTypes * 2);

    const score = avgRelevance + categoryBonus + diversityBonus;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Calculate entity alignment score
   */
  private calculateEntityAlignmentScore(
    entities: EntityWithScore[],
    keywords: KeywordWithIntent[]
  ): number {
    if (entities.length === 0 || keywords.length === 0) {
return 50;
}

    // Check how many entities appear in keywords
    const entityNames = new Set(entities.map((e) => e.name.toLowerCase()));
    let matchCount = 0;

    for (const kw of keywords) {
      const kwWords = kw.keyword.toLowerCase().split(/\s+/);
      if (kwWords.some((word) => entityNames.has(word))) {
        matchCount++;
      }
    }

    const matchRatio = matchCount / keywords.length;

    // High alignment if entities appear in many keywords
    let score = matchRatio * 100;

    // Bonus for high-intent keyword matches
    const transactionalMatches = keywords.filter(
      (kw) =>
        kw.search_intent === "transactional" &&
        kw.keyword
          .toLowerCase()
          .split(/\s+/)
          .some((w) => entityNames.has(w))
    ).length;

    score += transactionalMatches * 2;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Build entity clusters by type
   */
  private buildEntityClusters(entities: ContentEntity[]): EntityCluster[] {
    const clusters = new Map<
      string,
      { entities: string[]; saliences: number[] }
    >();

    for (const entity of entities) {
      const type = entity.entity_type;
      if (!clusters.has(type)) {
        clusters.set(type, { entities: [], saliences: [] });
      }
      const cluster = clusters.get(type)!;
      cluster.entities.push(entity.name);
      cluster.saliences.push(entity.salience);
    }

    return Array.from(clusters.entries())
      .map(([type, data]) => ({
        entity_type: type,
        entities: data.entities.slice(0, 10),
        count: data.entities.length,
        avg_salience:
          data.saliences.reduce((a, b) => a + b, 0) / data.saliences.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Calculate sentiment distribution
   */
  private calculateSentimentDistribution(
    entities: ContentEntity[]
  ): EntityProfile["sentiment_distribution"] {
    if (entities.length === 0) {
      return { positive: 0, neutral: 100, negative: 0 };
    }

    const counts = { positive: 0, neutral: 0, negative: 0 };

    for (const entity of entities) {
      counts[entity.sentiment]++;
    }

    const total = entities.length;

    return {
      positive: Math.round((counts.positive / total) * 100),
      neutral: Math.round((counts.neutral / total) * 100),
      negative: Math.round((counts.negative / total) * 100),
    };
  }

  /**
   * Calculate SERP features presence
   */
  private calculateSerpFeatures(
    keywords: KeywordWithIntent[]
  ): EntityProfile["serp_features"] {
    return {
      featured_snippets: keywords.filter((k) => k.is_featured_snippet).length,
      knowledge_panels: keywords.filter((k) => k.is_knowledge_panel).length,
      total_keywords: keywords.length,
    };
  }

  /**
   * Analyze topical gaps
   */
  async analyzeTopicalGaps(
    domain: string,
    targetTopic: string
  ): Promise<TopicalGapAnalysis> {
    // Get current profile
    const profile = await this.buildProfile(domain);

    // Target topic keywords
    const topicKeywords = targetTopic.toLowerCase().split(/\s+/);

    // Check entity alignment with target topic
    const alignedEntities = profile.entities.filter((e) =>
      topicKeywords.some(
        (kw) =>
          e.name.toLowerCase().includes(kw) ||
          kw.includes(e.name.toLowerCase())
      )
    );

    const currentAlignment =
      profile.entities.length > 0
        ? (alignedEntities.length / profile.entities.length) * 100
        : 0;

    // Identify gap entities (expected but missing)
    const expectedEntities = this.getExpectedEntitiesForTopic(targetTopic);
    const existingEntityNames = new Set(
      profile.entities.map((e) => e.name.toLowerCase())
    );
    const gapEntities = expectedEntities.filter(
      (e) => !existingEntityNames.has(e.toLowerCase())
    );

    // Identify gap keywords
    const existingKeywords = new Set(
      [
        ...profile.top_informational_keywords,
        ...profile.top_transactional_keywords,
      ].map((k) => k.keyword.toLowerCase())
    );
    const expectedKeywords = this.getExpectedKeywordsForTopic(targetTopic);
    const gapKeywords = expectedKeywords.filter(
      (k) => !existingKeywords.has(k.toLowerCase())
    );

    // Generate content recommendations
    const recommendedContent = this.generateContentRecommendations(
      gapEntities,
      gapKeywords
    );

    // Calculate improvement potential
    const improvementPotential = Math.min(
      100,
      gapEntities.length * 5 + gapKeywords.length * 3
    );

    return {
      domain,
      target_topic: targetTopic,
      current_alignment: Math.round(currentAlignment),
      gap_entities: gapEntities.slice(0, 10),
      gap_keywords: gapKeywords.slice(0, 10),
      recommended_content: recommendedContent,
      improvement_potential: improvementPotential,
    };
  }

  /**
   * Get expected entities for a topic (simplified)
   */
  private getExpectedEntitiesForTopic(topic: string): string[] {
    // In production, this would use a knowledge base
    // For now, return common related terms
    const topicLower = topic.toLowerCase();

    if (topicLower.includes("plumb")) {
      return [
        "plumber",
        "plumbing",
        "pipes",
        "drainage",
        "water heater",
        "faucet",
        "leak repair",
        "emergency plumbing",
        "licensed plumber",
        "plumbing services",
      ];
    }

    if (topicLower.includes("seo")) {
      return [
        "search engine optimization",
        "keywords",
        "backlinks",
        "SERP",
        "Google",
        "rankings",
        "content optimization",
        "meta tags",
        "site speed",
        "mobile optimization",
      ];
    }

    // Default generic entities
    return [
      "services",
      "solutions",
      "expertise",
      "quality",
      "professional",
      "certified",
      "experienced",
      "reliable",
    ];
  }

  /**
   * Get expected keywords for a topic (simplified)
   */
  private getExpectedKeywordsForTopic(topic: string): string[] {
    const topicLower = topic.toLowerCase();

    if (topicLower.includes("plumb")) {
      return [
        "plumber near me",
        "emergency plumber",
        "24 hour plumber",
        "plumbing services",
        "pipe repair",
        "drain cleaning",
        "water heater installation",
        "toilet repair",
        "faucet installation",
        "plumbing cost",
      ];
    }

    if (topicLower.includes("seo")) {
      return [
        "SEO services",
        "local SEO",
        "SEO agency",
        "keyword research",
        "link building",
        "technical SEO",
        "SEO audit",
        "content strategy",
        "on-page SEO",
        "SEO consultant",
      ];
    }

    return [
      `${topic} services`,
      `${topic} near me`,
      `best ${topic}`,
      `${topic} cost`,
      `${topic} reviews`,
    ];
  }

  /**
   * Generate content recommendations
   */
  private generateContentRecommendations(
    gapEntities: string[],
    gapKeywords: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Entity-based recommendations
    if (gapEntities.length > 0) {
      recommendations.push(
        `Create content covering: ${gapEntities.slice(0, 3).join(", ")}`
      );
    }

    // Keyword-based recommendations
    for (const keyword of gapKeywords.slice(0, 3)) {
      if (keyword.includes("near me") || keyword.includes("local")) {
        recommendations.push(`Add location-specific page targeting "${keyword}"`);
      } else if (keyword.includes("cost") || keyword.includes("price")) {
        recommendations.push(`Create pricing/cost guide for "${keyword}"`);
      } else if (keyword.includes("how to") || keyword.includes("guide")) {
        recommendations.push(`Write educational guide for "${keyword}"`);
      } else {
        recommendations.push(`Create dedicated service page for "${keyword}"`);
      }
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Compare entity profiles between two domains
   */
  async compareProfiles(
    domain1: string,
    domain2: string
  ): Promise<{
    domain1: EntityProfile;
    domain2: EntityProfile;
    comparison: {
      metric: string;
      domain1_value: number;
      domain2_value: number;
      winner: string;
    }[];
    shared_entities: string[];
    unique_to_domain1: string[];
    unique_to_domain2: string[];
  }> {
    const [profile1, profile2] = await Promise.all([
      this.buildProfile(domain1),
      this.buildProfile(domain2),
    ]);

    // Compare metrics
    const comparison = [
      {
        metric: "Topical Match Score",
        domain1_value: profile1.topical_match_score,
        domain2_value: profile2.topical_match_score,
        winner:
          profile1.topical_match_score > profile2.topical_match_score
            ? domain1
            : domain2,
      },
      {
        metric: "Entity Alignment Score",
        domain1_value: profile1.entity_alignment_score,
        domain2_value: profile2.entity_alignment_score,
        winner:
          profile1.entity_alignment_score > profile2.entity_alignment_score
            ? domain1
            : domain2,
      },
      {
        metric: "Entity Count",
        domain1_value: profile1.entity_count,
        domain2_value: profile2.entity_count,
        winner: profile1.entity_count > profile2.entity_count ? domain1 : domain2,
      },
      {
        metric: "Featured Snippets",
        domain1_value: profile1.serp_features.featured_snippets,
        domain2_value: profile2.serp_features.featured_snippets,
        winner:
          profile1.serp_features.featured_snippets >
          profile2.serp_features.featured_snippets
            ? domain1
            : domain2,
      },
      {
        metric: "Transactional Keywords %",
        domain1_value: profile1.keyword_intents.transactional,
        domain2_value: profile2.keyword_intents.transactional,
        winner:
          profile1.keyword_intents.transactional >
          profile2.keyword_intents.transactional
            ? domain1
            : domain2,
      },
    ];

    // Entity comparison
    const entities1 = new Set(profile1.entities.map((e) => e.name.toLowerCase()));
    const entities2 = new Set(profile2.entities.map((e) => e.name.toLowerCase()));

    const shared = [...entities1].filter((e) => entities2.has(e));
    const uniqueTo1 = [...entities1].filter((e) => !entities2.has(e));
    const uniqueTo2 = [...entities2].filter((e) => !entities1.has(e));

    return {
      domain1: profile1,
      domain2: profile2,
      comparison,
      shared_entities: shared.slice(0, 20),
      unique_to_domain1: uniqueTo1.slice(0, 20),
      unique_to_domain2: uniqueTo2.slice(0, 20),
    };
  }
}

export default EntityEngine;
