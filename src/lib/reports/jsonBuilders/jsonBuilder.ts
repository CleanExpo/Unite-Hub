/**
 * JSON Report Builder - Phase 7 Week 20
 *
 * Builds structured JSON reports with complete audit data.
 * Suitable for programmatic access, API integrations, and data analysis.
 */

import type { AuditResult, DataSources, ActionRecommendation } from "@/types/reports";

export interface JSONReportData {
  healthScore: number;
  auditData: AuditResult;
  dataSources: DataSources;
  recommendations: ActionRecommendation[];
  metadata: {
    generatedAt: string;
    auditType: string;
    version: string;
  };
}

export class JSONBuilder {
  private clientSlug: string;
  private auditId: string;

  constructor(clientSlug: string, auditId: string) {
    this.clientSlug = clientSlug;
    this.auditId = auditId;
  }

  /**
   * Build complete JSON report structure
   */
  build(data: JSONReportData): object {
    return {
      report_metadata: {
        client_slug: this.clientSlug,
        audit_id: this.auditId,
        generated_at: data.metadata.generatedAt,
        audit_type: data.metadata.auditType,
        version: data.metadata.version,
        health_score: data.healthScore,
      },

      executive_summary: {
        health_score: data.healthScore,
        health_grade: this.getHealthGrade(data.healthScore),
        key_metrics: this.extractKeyMetrics(data.dataSources),
        top_opportunities: data.recommendations
          .filter(r => r.priority === "high")
          .map(r => ({
            title: r.title,
            category: r.category,
            estimated_impact: r.estimatedImpact,
          })),
      },

      google_search_console: data.dataSources.gsc ? {
        total_clicks: data.dataSources.gsc.totalClicks,
        total_impressions: data.dataSources.gsc.totalImpressions,
        average_ctr: data.dataSources.gsc.averageCTR,
        average_position: data.dataSources.gsc.averagePosition,
        top_queries: data.dataSources.gsc.queries.slice(0, 20).map(q => ({
          query: q.query,
          clicks: q.clicks,
          impressions: q.impressions,
          ctr: q.ctr,
          position: q.position,
        })),
        top_pages: data.dataSources.gsc.pages.slice(0, 20).map(p => ({
          page: p.page,
          clicks: p.clicks,
          impressions: p.impressions,
        })),
      } : null,

      bing_webmaster: data.dataSources.bing ? {
        indexed_pages: data.dataSources.bing.indexedPages,
        crawl_errors: data.dataSources.bing.crawlErrors,
        sitemap_status: data.dataSources.bing.sitemapStatus,
      } : null,

      brave_search: data.dataSources.brave ? {
        visibility_score: data.dataSources.brave.visibility,
        rankings: data.dataSources.brave.rankings.map(r => ({
          keyword: r.keyword,
          position: r.position,
          url: r.url,
        })),
      } : null,

      dataforseo_intelligence: data.dataSources.dataForSEO ? {
        ranked_keywords: {
          total: data.dataSources.dataForSEO.rankedKeywords.length,
          top_3: data.dataSources.dataForSEO.rankedKeywords.filter(k => k.position <= 3).length,
          top_10: data.dataSources.dataForSEO.rankedKeywords.filter(k => k.position <= 10).length,
          top_20: data.dataSources.dataForSEO.rankedKeywords.filter(k => k.position <= 20).length,
          keywords: data.dataSources.dataForSEO.rankedKeywords.map(kw => ({
            keyword: kw.keyword,
            position: kw.position,
            search_volume: kw.search_volume,
            competition: kw.competition,
          })),
        },
        competitors: data.dataSources.dataForSEO.competitors.map(comp => ({
          domain: comp.domain,
          keywords_overlap: comp.keywords_overlap,
          rank_average: comp.rank_average,
          opportunity_score: 100 - comp.keywords_overlap,
        })),
        question_keywords: data.dataSources.dataForSEO.questions.map(q => ({
          question: q.question,
          search_volume: q.search_volume,
        })),
        related_keywords: data.dataSources.dataForSEO.relatedKeywords.map(rk => ({
          keyword: rk.keyword,
          search_volume: rk.search_volume,
        })),
      } : null,

      geo_targeting: data.dataSources.geo ? {
        center_coordinates: {
          latitude: data.dataSources.geo.centerLat,
          longitude: data.dataSources.geo.centerLng,
        },
        radius_km: data.dataSources.geo.radiusKm,
        coverage_percentage: data.dataSources.geo.coveragePercentage,
        target_suburbs: {
          total: data.dataSources.geo.targetSuburbs.length,
          list: data.dataSources.geo.targetSuburbs,
        },
        gap_suburbs: {
          total: data.dataSources.geo.gapSuburbs.length,
          list: data.dataSources.geo.gapSuburbs,
        },
      } : null,

      recommendations: data.recommendations.map(rec => ({
        priority: rec.priority,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        actions: rec.actions,
        estimated_impact: rec.estimatedImpact,
      })),

      audit_details: data.auditData,
    };
  }

  /**
   * Get health grade letter (A-F)
   */
  private getHealthGrade(score: number): string {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  /**
   * Extract key metrics for executive summary
   */
  private extractKeyMetrics(dataSources: DataSources): object {
    return {
      total_impressions: dataSources.gsc?.totalImpressions || 0,
      total_clicks: dataSources.gsc?.totalClicks || 0,
      average_ctr: dataSources.gsc?.averageCTR || 0,
      average_position: dataSources.gsc?.averagePosition || 0,
      indexed_pages_bing: dataSources.bing?.indexedPages || 0,
      ranked_keywords: dataSources.dataForSEO?.rankedKeywords.length || 0,
      competitors_analyzed: dataSources.dataForSEO?.competitors.length || 0,
      geo_coverage_pct: dataSources.geo?.coveragePercentage || 0,
    };
  }
}

export default JSONBuilder;
