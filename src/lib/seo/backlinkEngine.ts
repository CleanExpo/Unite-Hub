/**
 * Backlink Engine - Phase 8 Week 22
 *
 * Comprehensive backlink analysis and profile building.
 * Generates backlink scores, identifies toxic links, and tracks trends.
 */

import DataForSEOClient, {
  BacklinkItem,
  ReferringDomain,
  AnchorTextItem,
  BacklinkHistoryItem,
} from "@/server/dataforseoClient";

// =============================================================
// Types
// =============================================================

export interface BacklinkProfile {
  domain: string;
  snapshot_date: string;

  // Core metrics
  total_backlinks: number;
  referring_domains: number;
  referring_ips: number;
  dofollow_ratio: number;

  // Quality metrics
  backlink_score: number; // 0-100
  authority_score: number; // Based on referring domain quality
  toxic_score: number; // 0-100 (higher = more toxic)
  spam_score: number;

  // Top anchors
  top_anchors: AnchorTextItem[];
  anchor_diversity_score: number; // 0-100

  // New/Lost tracking
  new_backlinks_30d: number;
  lost_backlinks_30d: number;
  net_change_30d: number;
  velocity_trend: "GROWING" | "STABLE" | "DECLINING";

  // Top referring domains
  top_referring_domains: ReferringDomain[];

  // History for trend charts
  history_30d: BacklinkHistoryItem[];

  // Breakdown by link type
  dofollow_count: number;
  nofollow_count: number;
  ugc_count: number;
  sponsored_count: number;

  // Breakdown by country (top 5)
  countries: { country: string; count: number }[];
}

export interface BacklinkAnalysisOptions {
  limit?: number;
  includeHistory?: boolean;
  historyDays?: number;
  includeAnchors?: boolean;
  includeToxicAnalysis?: boolean;
}

export interface ToxicBacklinkReport {
  toxic_domains: {
    domain: string;
    spam_score: number;
    backlinks: number;
    reason: string;
  }[];
  total_toxic_backlinks: number;
  toxic_percentage: number;
  recommendation: string;
}

// =============================================================
// Backlink Engine Class
// =============================================================

export class BacklinkEngine {
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
   * Build comprehensive backlink profile for a domain
   */
  async buildProfile(
    domain: string,
    options: BacklinkAnalysisOptions = {}
  ): Promise<BacklinkProfile> {
    const {
      limit = 100,
      includeHistory = true,
      historyDays = 30,
      includeAnchors = true,
    } = options;

    console.log(`[BacklinkEngine] Building profile for ${domain}...`);

    // Fetch data in parallel for efficiency
    const [
      summary,
      backlinks,
      referringDomains,
      anchors,
      history,
    ] = await Promise.all([
      this.client.getBacklinks(domain),
      this.client.getBacklinksForDomain(domain, { limit }),
      this.client.getReferringDomains(domain, { limit: 50 }),
      includeAnchors
        ? this.client.getAnchorTextDistribution(domain, 50)
        : Promise.resolve([]),
      includeHistory
        ? this.getHistory(domain, historyDays)
        : Promise.resolve([]),
    ]);

    // Calculate dofollow ratio
    const dofollowCount = backlinks.filter(
      (b) => b.link_type === "dofollow"
    ).length;
    const nofollowCount = backlinks.filter(
      (b) => b.link_type === "nofollow"
    ).length;
    const totalLinks = backlinks.length || 1;
    const dofollowRatio = (dofollowCount / totalLinks) * 100;

    // Calculate authority score (based on referring domain ranks)
    const authorityScore = this.calculateAuthorityScore(referringDomains);

    // Calculate toxic score
    const toxicScore = this.calculateToxicScore(referringDomains);

    // Calculate spam score (average of referring domains)
    const spamScore = this.calculateSpamScore(referringDomains);

    // Calculate anchor diversity
    const anchorDiversityScore = this.calculateAnchorDiversity(anchors);

    // Calculate velocity trend
    const velocityTrend = this.calculateVelocityTrend(history);

    // Calculate new/lost in last 30 days
    const { newCount, lostCount } = this.calculateNewLost(history);

    // Calculate backlink score (composite)
    const backlinkScore = this.calculateBacklinkScore({
      referringDomains: summary.referringDomains,
      dofollowRatio,
      authorityScore,
      toxicScore,
      anchorDiversityScore,
      velocityTrend,
    });

    // Get country breakdown
    const countries = this.getCountryBreakdown(referringDomains);

    return {
      domain,
      snapshot_date: new Date().toISOString(),

      // Core metrics
      total_backlinks: summary.totalBacklinks,
      referring_domains: summary.referringDomains,
      referring_ips: summary.referringIPs,
      dofollow_ratio: Math.round(dofollowRatio * 10) / 10,

      // Quality metrics
      backlink_score: backlinkScore,
      authority_score: authorityScore,
      toxic_score: toxicScore,
      spam_score: spamScore,

      // Top anchors
      top_anchors: anchors.slice(0, 20),
      anchor_diversity_score: anchorDiversityScore,

      // New/Lost tracking
      new_backlinks_30d: newCount,
      lost_backlinks_30d: lostCount,
      net_change_30d: newCount - lostCount,
      velocity_trend: velocityTrend,

      // Top referring domains
      top_referring_domains: referringDomains.slice(0, 20),

      // History
      history_30d: history,

      // Link type breakdown
      dofollow_count: dofollowCount,
      nofollow_count: nofollowCount,
      ugc_count: 0, // Would need specific API field
      sponsored_count: 0, // Would need specific API field

      // Country breakdown
      countries,
    };
  }

  /**
   * Get backlink history for a domain
   */
  private async getHistory(
    domain: string,
    days: number
  ): Promise<BacklinkHistoryItem[]> {
    const dateTo = new Date().toISOString().split("T")[0];
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    try {
      return await this.client.getBacklinksHistory(domain, dateFrom, dateTo);
    } catch (error) {
      console.error("[BacklinkEngine] History fetch failed:", error);
      return [];
    }
  }

  /**
   * Calculate authority score (0-100)
   */
  private calculateAuthorityScore(domains: ReferringDomain[]): number {
    if (domains.length === 0) {
return 0;
}

    // Average domain rank (higher = better)
    const avgRank =
      domains.reduce((sum, d) => sum + d.rank, 0) / domains.length;

    // Normalize to 0-100 (assuming rank ranges from 0-100)
    const normalizedScore = Math.min(avgRank, 100);

    return Math.round(normalizedScore);
  }

  /**
   * Calculate toxic score (0-100)
   */
  private calculateToxicScore(domains: ReferringDomain[]): number {
    if (domains.length === 0) {
return 0;
}

    // Count toxic domains (spam_score > 50)
    const toxicCount = domains.filter((d) => d.spam_score > 50).length;
    const toxicRatio = (toxicCount / domains.length) * 100;

    return Math.round(toxicRatio);
  }

  /**
   * Calculate average spam score
   */
  private calculateSpamScore(domains: ReferringDomain[]): number {
    if (domains.length === 0) {
return 0;
}

    const avgSpam =
      domains.reduce((sum, d) => sum + d.spam_score, 0) / domains.length;

    return Math.round(avgSpam);
  }

  /**
   * Calculate anchor diversity score (0-100)
   * Higher = more diverse (better)
   */
  private calculateAnchorDiversity(anchors: AnchorTextItem[]): number {
    if (anchors.length === 0) {
return 0;
}

    // Check for over-optimization (single anchor > 50%)
    const totalBacklinks = anchors.reduce((sum, a) => sum + a.backlinks, 0);
    if (totalBacklinks === 0) {
return 50;
}

    const topAnchorRatio =
      (anchors[0]?.backlinks || 0) / totalBacklinks;

    // Penalize if top anchor is too dominant
    if (topAnchorRatio > 0.5) {
return Math.round((1 - topAnchorRatio) * 100);
}
    if (topAnchorRatio > 0.3) {
return Math.round(70 + (0.5 - topAnchorRatio) * 60);
}

    // Good diversity
    return Math.round(Math.min(100, 80 + anchors.length * 0.5));
  }

  /**
   * Calculate velocity trend from history
   */
  private calculateVelocityTrend(
    history: BacklinkHistoryItem[]
  ): "GROWING" | "STABLE" | "DECLINING" {
    if (history.length < 2) {
return "STABLE";
}

    // Compare first week to last week
    const firstWeek = history.slice(0, 7);
    const lastWeek = history.slice(-7);

    const firstAvg =
      firstWeek.reduce((sum, h) => sum + h.backlinks, 0) / firstWeek.length;
    const lastAvg =
      lastWeek.reduce((sum, h) => sum + h.backlinks, 0) / lastWeek.length;

    const changePercent = ((lastAvg - firstAvg) / (firstAvg || 1)) * 100;

    if (changePercent > 5) {
return "GROWING";
}
    if (changePercent < -5) {
return "DECLINING";
}
    return "STABLE";
  }

  /**
   * Calculate new/lost backlinks from history
   */
  private calculateNewLost(
    history: BacklinkHistoryItem[]
  ): { newCount: number; lostCount: number } {
    if (history.length < 2) {
return { newCount: 0, lostCount: 0 };
}

    const first = history[0];
    const last = history[history.length - 1];

    const change = last.backlinks - first.backlinks;

    return {
      newCount: change > 0 ? change : 0,
      lostCount: change < 0 ? Math.abs(change) : 0,
    };
  }

  /**
   * Calculate composite backlink score (0-100)
   */
  private calculateBacklinkScore(metrics: {
    referringDomains: number;
    dofollowRatio: number;
    authorityScore: number;
    toxicScore: number;
    anchorDiversityScore: number;
    velocityTrend: "GROWING" | "STABLE" | "DECLINING";
  }): number {
    let score = 0;

    // Referring domains factor (30%)
    // 0-50 = poor, 50-200 = okay, 200+ = good
    const domainScore = Math.min(100, (metrics.referringDomains / 200) * 100);
    score += domainScore * 0.3;

    // Dofollow ratio factor (15%)
    // 40-80% is ideal
    let dofollowScore = 0;
    if (metrics.dofollowRatio >= 40 && metrics.dofollowRatio <= 80) {
      dofollowScore = 100;
    } else if (metrics.dofollowRatio < 40) {
      dofollowScore = (metrics.dofollowRatio / 40) * 100;
    } else {
      dofollowScore = Math.max(0, 100 - (metrics.dofollowRatio - 80) * 2);
    }
    score += dofollowScore * 0.15;

    // Authority score factor (25%)
    score += metrics.authorityScore * 0.25;

    // Toxic penalty (15%)
    score += (100 - metrics.toxicScore) * 0.15;

    // Anchor diversity factor (10%)
    score += metrics.anchorDiversityScore * 0.1;

    // Velocity bonus/penalty (5%)
    const velocityBonus =
      metrics.velocityTrend === "GROWING"
        ? 5
        : metrics.velocityTrend === "DECLINING"
        ? -5
        : 0;
    score += 50 + velocityBonus; // 50 base, +/- 5
    score = score - 50 + 50 * 0.05; // Normalize to 5%

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Get country breakdown
   */
  private getCountryBreakdown(
    domains: ReferringDomain[]
  ): { country: string; count: number }[] {
    const countryMap = new Map<string, number>();

    for (const domain of domains) {
      if (domain.country) {
        countryMap.set(
          domain.country,
          (countryMap.get(domain.country) || 0) + 1
        );
      }
    }

    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Generate toxic backlink report
   */
  async analyzeToxicBacklinks(domain: string): Promise<ToxicBacklinkReport> {
    const referringDomains = await this.client.getReferringDomains(domain, {
      limit: 200,
    });

    const toxicDomains = referringDomains
      .filter((d) => d.spam_score > 50)
      .map((d) => ({
        domain: d.domain,
        spam_score: d.spam_score,
        backlinks: d.backlinks,
        reason:
          d.spam_score > 80
            ? "Very high spam score"
            : d.spam_score > 60
            ? "High spam score"
            : "Elevated spam score",
      }))
      .sort((a, b) => b.spam_score - a.spam_score);

    const totalBacklinks = referringDomains.reduce(
      (sum, d) => sum + d.backlinks,
      0
    );
    const toxicBacklinks = toxicDomains.reduce(
      (sum, d) => sum + d.backlinks,
      0
    );
    const toxicPercentage =
      totalBacklinks > 0 ? (toxicBacklinks / totalBacklinks) * 100 : 0;

    let recommendation = "";
    if (toxicPercentage > 20) {
      recommendation =
        "URGENT: High toxic backlink percentage. Consider disavowing toxic domains immediately.";
    } else if (toxicPercentage > 10) {
      recommendation =
        "WARNING: Moderate toxic backlinks. Review and consider disavowing worst offenders.";
    } else if (toxicPercentage > 5) {
      recommendation =
        "CAUTION: Some toxic backlinks detected. Monitor and disavow if they grow.";
    } else {
      recommendation =
        "HEALTHY: Low toxic backlink percentage. Continue monitoring quarterly.";
    }

    return {
      toxic_domains: toxicDomains.slice(0, 20),
      total_toxic_backlinks: toxicBacklinks,
      toxic_percentage: Math.round(toxicPercentage * 10) / 10,
      recommendation,
    };
  }

  /**
   * Compare backlink profiles between two domains
   */
  async compareProfiles(
    domain1: string,
    domain2: string
  ): Promise<{
    domain1: BacklinkProfile;
    domain2: BacklinkProfile;
    comparison: {
      metric: string;
      domain1_value: number;
      domain2_value: number;
      winner: string;
    }[];
  }> {
    const [profile1, profile2] = await Promise.all([
      this.buildProfile(domain1),
      this.buildProfile(domain2),
    ]);

    const comparison = [
      {
        metric: "Backlink Score",
        domain1_value: profile1.backlink_score,
        domain2_value: profile2.backlink_score,
        winner:
          profile1.backlink_score > profile2.backlink_score ? domain1 : domain2,
      },
      {
        metric: "Referring Domains",
        domain1_value: profile1.referring_domains,
        domain2_value: profile2.referring_domains,
        winner:
          profile1.referring_domains > profile2.referring_domains
            ? domain1
            : domain2,
      },
      {
        metric: "Authority Score",
        domain1_value: profile1.authority_score,
        domain2_value: profile2.authority_score,
        winner:
          profile1.authority_score > profile2.authority_score ? domain1 : domain2,
      },
      {
        metric: "Toxic Score (lower is better)",
        domain1_value: profile1.toxic_score,
        domain2_value: profile2.toxic_score,
        winner: profile1.toxic_score < profile2.toxic_score ? domain1 : domain2,
      },
      {
        metric: "Anchor Diversity",
        domain1_value: profile1.anchor_diversity_score,
        domain2_value: profile2.anchor_diversity_score,
        winner:
          profile1.anchor_diversity_score > profile2.anchor_diversity_score
            ? domain1
            : domain2,
      },
    ];

    return { domain1: profile1, domain2: profile2, comparison };
  }
}

export default BacklinkEngine;
