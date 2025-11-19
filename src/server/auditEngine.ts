/**
 * SEO Audit Engine
 * Phase 5: Intelligence Layer
 *
 * Orchestrates comprehensive SEO audits by combining:
 * - Google Search Console Search Analytics
 * - Bing IndexNow status
 * - Brave Search presence
 * - DataForSEO competitive intelligence
 * - On-page technical SEO scoring
 * - Local GEO pack tracking
 * - Social signals analysis
 *
 * Generates actionable insights, scores, and recommendations.
 */

import { DataForSEOClient } from "./dataforseoClient";
import { supabaseAdmin } from "@/lib/supabase";
import type { AuditResult, AuditConfig, AuditTier } from "@/lib/seo/auditTypes";

export class AuditEngine {
  private dataforSEO: DataForSEOClient;

  constructor() {
    this.dataforSEO = new DataForSEOClient(
      process.env.DATAFORSEO_API_LOGIN || "",
      process.env.DATAFORSEO_API_PASSWORD || ""
    );
  }

  /**
   * Run a complete SEO audit based on tier configuration
   */
  async runAudit(config: AuditConfig): Promise<AuditResult> {
    const startTime = Date.now();

    try {
      console.log(`[AuditEngine] Starting ${config.tier} audit for ${config.domain}`);

      // Run audits in parallel based on tier
      const auditPromises = this.getAuditPromisesByTier(config);
      const results = await Promise.allSettled(auditPromises);

      // Extract successful results
      const gscData = this.extractResult(results[0]);
      const bingData = this.extractResult(results[1]);
      const braveData = this.extractResult(results[2]);
      const dataforSEOData = this.extractResult(results[3]);

      // Calculate composite scores
      const healthScore = this.calculateHealthScore({
        gsc: gscData,
        bing: bingData,
        brave: braveData,
        dataforSEO: dataforSEOData,
      });

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        gsc: gscData,
        bing: bingData,
        brave: braveData,
        dataforSEO: dataforSEOData,
        healthScore,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      const auditResult: AuditResult = {
        id: crypto.randomUUID(),
        seoProfileId: config.seoProfileId,
        tier: config.tier,
        timestamp: new Date().toISOString(),
        duration,
        healthScore,
        gsc: gscData || null,
        bing: bingData || null,
        brave: braveData || null,
        dataforSEO: dataforSEOData || null,
        recommendations,
        status: "completed",
      };

      // Save audit to database
      await this.saveAudit(auditResult);

      console.log(`[AuditEngine] Audit completed in ${duration}ms with health score: ${healthScore}`);

      return auditResult;
    } catch (error) {
      console.error("[AuditEngine] Audit failed:", error);

      const failedResult: AuditResult = {
        id: crypto.randomUUID(),
        seoProfileId: config.seoProfileId,
        tier: config.tier,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        healthScore: 0,
        gsc: null,
        bing: null,
        brave: null,
        dataforSEO: null,
        recommendations: [],
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };

      await this.saveAudit(failedResult);

      throw error;
    }
  }

  /**
   * Get audit promises based on tier configuration
   */
  private getAuditPromisesByTier(config: AuditConfig): Promise<any>[] {
    const promises: Promise<any>[] = [];

    switch (config.tier) {
      case "free":
        // Free tier: Basic health snapshot
        promises.push(
          this.auditGSC(config),
          this.auditBing(config),
          Promise.resolve(null), // No Brave for free
          Promise.resolve(null)  // No DataForSEO for free
        );
        break;

      case "starter":
        // Starter tier: Complete SEO + Social
        promises.push(
          this.auditGSC(config),
          this.auditBing(config),
          this.auditBrave(config),
          this.auditDataForSEO(config, ["serp_keywords", "on_page_score"])
        );
        break;

      case "pro":
        // Pro tier: Full DataForSEO + Competitor Tracking
        promises.push(
          this.auditGSC(config),
          this.auditBing(config),
          this.auditBrave(config),
          this.auditDataForSEO(config, [
            "serp_keywords",
            "on_page_score",
            "competitor_analysis",
            "keyword_gap",
            "backlinks"
          ])
        );
        break;

      case "enterprise":
        // Enterprise tier: Full Stack + GEO + Social Signals
        promises.push(
          this.auditGSC(config),
          this.auditBing(config),
          this.auditBrave(config),
          this.auditDataForSEO(config, [
            "serp_keywords",
            "on_page_score",
            "competitor_analysis",
            "keyword_gap",
            "backlinks",
            "local_geo_pack",
            "social_signals"
          ])
        );
        break;
    }

    return promises;
  }

  /**
   * Audit Google Search Console
   */
  private async auditGSC(config: AuditConfig): Promise<any> {
    try {
      console.log("[AuditEngine] Auditing GSC...");

      // TODO: Implement actual GSC API call
      // For now, return mock data
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        impressions: 12450,
        clicks: 876,
        ctr: 0.0703,
        position: 15.2,
        topQueries: [
          { query: "stainless steel balustrades", impressions: 1200, clicks: 95, position: 8.3 },
          { query: "glass railing systems", impressions: 980, clicks: 72, position: 12.1 },
          { query: "modern balustrade design", impressions: 760, clicks: 58, position: 14.7 },
        ],
      };
    } catch (error) {
      console.error("[AuditEngine] GSC audit failed:", error);
      return null;
    }
  }

  /**
   * Audit Bing IndexNow status
   */
  private async auditBing(config: AuditConfig): Promise<any> {
    try {
      console.log("[AuditEngine] Auditing Bing...");

      // TODO: Implement actual Bing Webmaster Tools API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        indexedPages: 247,
        crawlErrors: 3,
        lastIndexedDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[AuditEngine] Bing audit failed:", error);
      return null;
    }
  }

  /**
   * Audit Brave Search presence
   */
  private async auditBrave(config: AuditConfig): Promise<any> {
    try {
      console.log("[AuditEngine] Auditing Brave...");

      // TODO: Implement actual Brave Creators API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        channelStatus: "active",
        totalContributions: 45.23,
        activeSubscribers: 127,
      };
    } catch (error) {
      console.error("[AuditEngine] Brave audit failed:", error);
      return null;
    }
  }

  /**
   * Audit using DataForSEO
   */
  private async auditDataForSEO(config: AuditConfig, tasks: string[]): Promise<any> {
    try {
      console.log(`[AuditEngine] Auditing DataForSEO (${tasks.length} tasks)...`);

      const results: any = {};

      // Run DataForSEO tasks in parallel
      if (tasks.includes("serp_keywords")) {
        results.serpKeywords = await this.dataforSEO.getSerpKeywords(config.domain, config.keywords || []);
      }

      if (tasks.includes("on_page_score")) {
        results.onPageScore = await this.dataforSEO.getOnPageScore(config.domain);
      }

      if (tasks.includes("competitor_analysis")) {
        results.competitorAnalysis = await this.dataforSEO.getCompetitorAnalysis(
          config.domain,
          config.competitorDomains || []
        );
      }

      if (tasks.includes("keyword_gap")) {
        results.keywordGap = await this.dataforSEO.getKeywordGap(config.domain, config.competitorDomains || []);
      }

      if (tasks.includes("backlinks")) {
        results.backlinks = await this.dataforSEO.getBacklinks(config.domain);
      }

      if (tasks.includes("local_geo_pack")) {
        results.localGeoPack = await this.dataforSEO.getLocalGeoPack(config.domain, config.location || "");
      }

      if (tasks.includes("social_signals")) {
        results.socialSignals = await this.dataforSEO.getSocialSignals(config.domain);
      }

      return results;
    } catch (error) {
      console.error("[AuditEngine] DataForSEO audit failed:", error);
      return null;
    }
  }

  /**
   * Calculate composite health score (0-100)
   */
  private calculateHealthScore(data: any): number {
    let score = 0;
    let weightSum = 0;

    // GSC metrics (40% weight)
    if (data.gsc) {
      const gscScore = this.calculateGSCScore(data.gsc);
      score += gscScore * 0.4;
      weightSum += 0.4;
    }

    // Bing indexing (20% weight)
    if (data.bing) {
      const bingScore = this.calculateBingScore(data.bing);
      score += bingScore * 0.2;
      weightSum += 0.2;
    }

    // DataForSEO technical (30% weight)
    if (data.dataforSEO?.onPageScore) {
      const techScore = data.dataforSEO.onPageScore.score || 0;
      score += techScore * 0.3;
      weightSum += 0.3;
    }

    // Brave presence (10% weight)
    if (data.brave) {
      const braveScore = data.brave.channelStatus === "active" ? 100 : 50;
      score += braveScore * 0.1;
      weightSum += 0.1;
    }

    // Normalize to 0-100
    return weightSum > 0 ? Math.round(score / weightSum) : 0;
  }

  /**
   * Calculate GSC-specific score
   */
  private calculateGSCScore(gsc: any): number {
    let score = 0;

    // CTR score (0-40 points)
    const ctrScore = Math.min((gsc.ctr / 0.05) * 40, 40); // Target: 5% CTR = 40 points
    score += ctrScore;

    // Position score (0-30 points)
    const positionScore = Math.max(30 - gsc.position, 0); // Target: Position 1 = 30 points
    score += positionScore;

    // Clicks score (0-30 points)
    const clicksScore = Math.min((gsc.clicks / 1000) * 30, 30); // Target: 1000 clicks = 30 points
    score += clicksScore;

    return Math.round(score);
  }

  /**
   * Calculate Bing-specific score
   */
  private calculateBingScore(bing: any): number {
    let score = 100;

    // Deduct points for crawl errors
    score -= Math.min(bing.crawlErrors * 10, 50); // Max -50 points

    return Math.max(score, 0);
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = [];

    // GSC-based recommendations
    if (data.gsc) {
      if (data.gsc.ctr < 0.02) {
        recommendations.push("🔴 CRITICAL: CTR is below 2%. Improve meta descriptions and titles.");
      }
      if (data.gsc.position > 20) {
        recommendations.push("🟡 WARNING: Average position is below page 2. Focus on content quality and backlinks.");
      }
      if (data.gsc.clicks < 100) {
        recommendations.push("🔵 INFO: Low click volume. Consider expanding keyword targeting.");
      }
    }

    // Bing-based recommendations
    if (data.bing && data.bing.crawlErrors > 5) {
      recommendations.push(`🔴 CRITICAL: ${data.bing.crawlErrors} Bing crawl errors detected. Fix immediately.`);
    }

    // DataForSEO-based recommendations
    if (data.dataforSEO?.onPageScore) {
      const score = data.dataforSEO.onPageScore.score || 0;
      if (score < 60) {
        recommendations.push("🔴 CRITICAL: On-page SEO score below 60. Review technical issues.");
      }
    }

    // Brave-based recommendations
    if (data.brave && data.brave.channelStatus !== "active") {
      recommendations.push("🟡 WARNING: Brave Creator channel not active. Consider activating for BAT rewards.");
    }

    return recommendations;
  }

  /**
   * Extract result from Promise.allSettled
   */
  private extractResult(result: PromiseSettledResult<any>): any {
    return result.status === "fulfilled" ? result.value : null;
  }

  /**
   * Save audit result to database
   */
  private async saveAudit(audit: AuditResult): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from("seo_audit_snapshots")
        .insert({
          id: audit.id,
          seo_profile_id: audit.seoProfileId,
          tier: audit.tier,
          timestamp: audit.timestamp,
          duration_ms: audit.duration,
          health_score: audit.healthScore,
          gsc_data: audit.gsc,
          bing_data: audit.bing,
          brave_data: audit.brave,
          dataforseo_data: audit.dataforSEO,
          recommendations: audit.recommendations,
          status: audit.status,
          error: audit.error || null,
        });

      if (error) {
        console.error("[AuditEngine] Failed to save audit:", error);
        throw error;
      }

      console.log(`[AuditEngine] Audit ${audit.id} saved successfully`);
    } catch (error) {
      console.error("[AuditEngine] Database error:", error);
      throw error;
    }
  }
}

export default AuditEngine;
