/**
 * Report Engine - Phase 7 Week 20
 *
 * Multi-format report generation system for SEO/GEO audits.
 * Generates HTML, CSV, JSON, MD, and PDF reports.
 *
 * Features:
 * - DataForSEO MCP integration for keyword rankings
 * - GSC/Bing/Brave data aggregation
 * - Jina AI image embedding in HTML reports
 * - Tier-based action recommendations
 * - GEO radius coverage analysis
 */

import { ClientDataManager } from "@/lib/clientDataManager";
import { HTMLReportGenerator } from "@/lib/reports/htmlTemplates/htmlGenerator";
import { CSVGenerator } from "@/lib/reports/csvGenerators/csvGenerator";
import { JSONBuilder } from "@/lib/reports/jsonBuilders/jsonBuilder";
import { MDGenerator } from "@/lib/reports/mdGenerator";
import { PDFRenderer } from "@/lib/reports/pdfRenderer";
import type {
  AuditResult,
  ReportGenerationConfig,
  ReportOutput,
  SEOHealthScore,
  GEOCoverageData,
  CompetitorAnalysis,
  KeywordRankings,
  ActionRecommendation
} from "@/types/reports";

export interface ReportEngineConfig {
  clientId: string;
  clientSlug: string;
  auditId: string;
  auditType: "full" | "snapshot" | "onboarding" | "geo";
  formats: Array<"html" | "csv" | "json" | "md" | "pdf">;
  includeImages?: boolean;
  jinaApiKey?: string;
}

export interface DataSources {
  gsc?: {
    queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
    pages: Array<{ page: string; clicks: number; impressions: number }>;
    totalClicks: number;
    totalImpressions: number;
    averageCTR: number;
    averagePosition: number;
  };
  bing?: {
    indexedPages: number;
    crawlErrors: number;
    sitemapStatus: string;
  };
  brave?: {
    rankings: Array<{ keyword: string; position: number; url: string }>;
    visibility: number;
  };
  dataForSEO?: {
    rankedKeywords: Array<{ keyword: string; position: number; search_volume: number; competition: number }>;
    competitors: Array<{ domain: string; keywords_overlap: number; rank_average: number }>;
    questions: Array<{ question: string; search_volume: number }>;
    relatedKeywords: Array<{ keyword: string; search_volume: number }>;
  };
  geo?: {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
    targetSuburbs: string[];
    gapSuburbs: string[];
    coveragePercentage: number;
  };
}

export class ReportEngine {
  private config: ReportEngineConfig;
  private dataSources: DataSources;
  private healthScore: number = 0;

  constructor(config: ReportEngineConfig) {
    this.config = config;
    this.dataSources = {};
  }

  /**
   * Main entry point: Generate all report formats
   */
  async generateReports(auditData: AuditResult, dataSources: DataSources): Promise<ReportOutput> {
    console.log(`[ReportEngine] Generating reports for client ${this.config.clientSlug}`);

    this.dataSources = dataSources;
    this.healthScore = this.calculateHealthScore(auditData, dataSources);

    const outputs: ReportOutput = {
      auditId: this.config.auditId,
      clientId: this.config.clientId,
      timestamp: new Date().toISOString(),
      formats: {},
      healthScore: this.healthScore,
    };

    // Generate each requested format
    for (const format of this.config.formats) {
      try {
        switch (format) {
          case "html":
            outputs.formats.html = await this.generateHTML(auditData);
            break;
          case "csv":
            outputs.formats.csv = await this.generateCSV(auditData);
            break;
          case "json":
            outputs.formats.json = await this.generateJSON(auditData);
            break;
          case "md":
            outputs.formats.md = await this.generateMarkdown(auditData);
            break;
          case "pdf":
            outputs.formats.pdf = await this.generatePDF(auditData);
            break;
        }
      } catch (error) {
        console.error(`[ReportEngine] Error generating ${format}:`, error);
        outputs.formats[format] = { error: error instanceof Error ? error.message : "Unknown error" };
      }
    }

    // Save all reports to Docker volume
    await this.saveReportsToVolume(outputs);

    return outputs;
  }

  /**
   * Calculate SEO Health Score (0-100)
   *
   * Factors:
   * - GSC Performance (30%): CTR, impressions growth
   * - Keyword Rankings (25%): Top 3/10/20 positions
   * - Bing Indexing (15%): Pages indexed vs expected
   * - GEO Coverage (20%): Suburb coverage percentage
   * - Competitor Gap (10%): Keyword opportunities vs top 3
   */
  private calculateHealthScore(auditData: AuditResult, sources: DataSources): number {
    let score = 0;

    // GSC Performance (30 points)
    if (sources.gsc) {
      const ctrScore = Math.min((sources.gsc.averageCTR / 0.05) * 10, 10); // 5% CTR = 10 pts
      const impressionsScore = Math.min((sources.gsc.totalImpressions / 10000) * 10, 10); // 10k = 10 pts
      const positionScore = Math.max(10 - (sources.gsc.averagePosition / 5), 0); // Position 1 = 10 pts
      score += ctrScore + impressionsScore + positionScore;
    }

    // Keyword Rankings (25 points)
    if (sources.dataForSEO?.rankedKeywords) {
      const top3 = sources.dataForSEO.rankedKeywords.filter(k => k.position <= 3).length;
      const top10 = sources.dataForSEO.rankedKeywords.filter(k => k.position <= 10).length;
      const top20 = sources.dataForSEO.rankedKeywords.filter(k => k.position <= 20).length;

      score += (top3 * 1.5) + (top10 * 0.8) + (top20 * 0.4);
      score = Math.min(score, 25);
    }

    // Bing Indexing (15 points)
    if (sources.bing) {
      const indexScore = Math.min((sources.bing.indexedPages / 100) * 10, 10); // 100 pages = 10 pts
      const errorScore = Math.max(5 - (sources.bing.crawlErrors * 0.5), 0); // 0 errors = 5 pts
      score += indexScore + errorScore;
    }

    // GEO Coverage (20 points)
    if (sources.geo) {
      score += (sources.geo.coveragePercentage / 100) * 20;
    }

    // Competitor Gap (10 points)
    if (sources.dataForSEO?.competitors && sources.dataForSEO.competitors.length > 0) {
      const avgOverlap = sources.dataForSEO.competitors.reduce((sum, c) => sum + c.keywords_overlap, 0) / sources.dataForSEO.competitors.length;
      score += (avgOverlap / 100) * 10; // 100% overlap = 10 pts
    }

    return Math.round(Math.min(score, 100));
  }

  /**
   * Generate HTML report with Jina AI images
   */
  private async generateHTML(auditData: AuditResult): Promise<{ filePath: string; size: number }> {
    console.log("[ReportEngine] Generating HTML report...");

    const htmlGenerator = new HTMLReportGenerator({
      clientSlug: this.config.clientSlug,
      auditId: this.config.auditId,
      jinaApiKey: this.config.jinaApiKey,
      includeImages: this.config.includeImages ?? true,
    });

    const htmlContent = await htmlGenerator.generate({
      healthScore: this.healthScore,
      auditData,
      dataSources: this.dataSources,
      recommendations: this.generateRecommendations(auditData),
    });

    const fileName = `${this.config.clientSlug}-report-${new Date().toISOString().split('T')[0]}.html`;
    const filePath = await ClientDataManager.writeReport({
      clientId: this.config.clientId,
      fileName,
      content: htmlContent,
      format: "html",
    });

    return {
      filePath,
      size: Buffer.byteLength(htmlContent, "utf8"),
    };
  }

  /**
   * Generate CSV datasets (6 files)
   */
  private async generateCSV(auditData: AuditResult): Promise<{ files: string[]; totalSize: number }> {
    console.log("[ReportEngine] Generating CSV datasets...");

    const csvGenerator = new CSVGenerator(this.config.clientSlug, this.config.auditId);
    const files: string[] = [];
    let totalSize = 0;

    // 1. Ranked Keywords
    if (this.dataSources.dataForSEO?.rankedKeywords) {
      const { filePath, size } = await csvGenerator.generateRankedKeywords(
        this.dataSources.dataForSEO.rankedKeywords,
        this.config.clientId
      );
      files.push(filePath);
      totalSize += size;
    }

    // 2. Competitor Keywords
    if (this.dataSources.dataForSEO?.competitors) {
      const { filePath, size } = await csvGenerator.generateCompetitorKeywords(
        this.dataSources.dataForSEO.competitors,
        this.config.clientId
      );
      files.push(filePath);
      totalSize += size;
    }

    // 3. Backlinks (placeholder - to be integrated)
    // const { filePath: backlinksPath } = await csvGenerator.generateBacklinks([], this.config.clientId);
    // files.push(backlinksPath);

    // 4. GEO Gap Suburbs
    if (this.dataSources.geo?.gapSuburbs) {
      const { filePath, size } = await csvGenerator.generateGeoGapSuburbs(
        this.dataSources.geo.gapSuburbs,
        this.config.clientId
      );
      files.push(filePath);
      totalSize += size;
    }

    // 5. GSC Queries
    if (this.dataSources.gsc?.queries) {
      const { filePath, size } = await csvGenerator.generateGSCQueries(
        this.dataSources.gsc.queries,
        this.config.clientId
      );
      files.push(filePath);
      totalSize += size;
    }

    // 6. Bing Indexing
    if (this.dataSources.bing) {
      const { filePath, size } = await csvGenerator.generateBingIndexing(
        this.dataSources.bing,
        this.config.clientId
      );
      files.push(filePath);
      totalSize += size;
    }

    return { files, totalSize };
  }

  /**
   * Generate JSON report
   */
  private async generateJSON(auditData: AuditResult): Promise<{ filePath: string; size: number }> {
    console.log("[ReportEngine] Generating JSON report...");

    const jsonBuilder = new JSONBuilder(this.config.clientSlug, this.config.auditId);

    const jsonData = jsonBuilder.build({
      healthScore: this.healthScore,
      auditData,
      dataSources: this.dataSources,
      recommendations: this.generateRecommendations(auditData),
      metadata: {
        generatedAt: new Date().toISOString(),
        auditType: this.config.auditType,
        version: "1.0.0",
      },
    });

    const fileName = `${this.config.clientSlug}-report-${new Date().toISOString().split('T')[0]}.json`;
    const filePath = await ClientDataManager.writeReport({
      clientId: this.config.clientId,
      fileName,
      content: JSON.stringify(jsonData, null, 2),
      format: "json",
    });

    return {
      filePath,
      size: Buffer.byteLength(JSON.stringify(jsonData), "utf8"),
    };
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdown(auditData: AuditResult): Promise<{ filePath: string; size: number }> {
    console.log("[ReportEngine] Generating Markdown report...");

    const mdGenerator = new MDGenerator(this.config.clientSlug, this.config.auditId);

    const mdContent = mdGenerator.generate({
      healthScore: this.healthScore,
      auditData,
      dataSources: this.dataSources,
      recommendations: this.generateRecommendations(auditData),
    });

    const fileName = `${this.config.clientSlug}-report-${new Date().toISOString().split('T')[0]}.md`;
    const filePath = await ClientDataManager.writeReport({
      clientId: this.config.clientId,
      fileName,
      content: mdContent,
      format: "md",
    });

    return {
      filePath,
      size: Buffer.byteLength(mdContent, "utf8"),
    };
  }

  /**
   * Generate PDF report (convert HTML to PDF)
   */
  private async generatePDF(auditData: AuditResult): Promise<{ filePath: string; size: number }> {
    console.log("[ReportEngine] Generating PDF report...");

    // First generate HTML
    const htmlGenerator = new HTMLReportGenerator({
      clientSlug: this.config.clientSlug,
      auditId: this.config.auditId,
      jinaApiKey: this.config.jinaApiKey,
      includeImages: this.config.includeImages ?? true,
    });

    const htmlContent = await htmlGenerator.generate({
      healthScore: this.healthScore,
      auditData,
      dataSources: this.dataSources,
      recommendations: this.generateRecommendations(auditData),
    });

    // Convert to PDF
    const pdfRenderer = new PDFRenderer();
    const pdfBuffer = await pdfRenderer.render(htmlContent, {
      format: "A4",
      landscape: true,
      printBackground: true,
    });

    const fileName = `${this.config.clientSlug}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    const filePath = await ClientDataManager.writeReport({
      clientId: this.config.clientId,
      fileName,
      content: pdfBuffer.toString("base64"),
      format: "pdf",
    });

    return {
      filePath,
      size: pdfBuffer.length,
    };
  }

  /**
   * Generate tier-based action recommendations
   */
  private generateRecommendations(auditData: AuditResult): ActionRecommendation[] {
    const recommendations: ActionRecommendation[] = [];

    // Low health score recommendations
    if (this.healthScore < 50) {
      recommendations.push({
        priority: "high",
        category: "seo",
        title: "Critical SEO Issues Detected",
        description: "Your health score is below 50. Focus on improving keyword rankings and fixing technical issues.",
        actions: [
          "Review and optimize title tags and meta descriptions",
          "Fix crawl errors identified in Bing Webmaster Tools",
          "Improve site speed (target < 3s load time)",
          "Build high-quality backlinks from relevant domains",
        ],
        estimatedImpact: "30-50 point health score increase in 3-6 months",
      });
    }

    // GEO coverage recommendations
    if (this.dataSources.geo && this.dataSources.geo.coveragePercentage < 70) {
      recommendations.push({
        priority: "medium",
        category: "geo",
        title: "Expand GEO Coverage",
        description: `Currently covering ${this.dataSources.geo.coveragePercentage}% of target suburbs. ${this.dataSources.geo.gapSuburbs.length} gap suburbs identified.`,
        actions: [
          "Create location-specific landing pages for gap suburbs",
          "Add suburb names to service area schema markup",
          "Build local citations (Google Business, directories)",
          "Generate suburb-specific content (guides, case studies)",
        ],
        estimatedImpact: "20-30% increase in local search visibility",
      });
    }

    // Competitor gap recommendations
    if (this.dataSources.dataForSEO?.competitors && this.dataSources.dataForSEO.competitors.length > 0) {
      const avgOverlap = this.dataSources.dataForSEO.competitors.reduce((sum, c) => sum + c.keywords_overlap, 0) / this.dataSources.dataForSEO.competitors.length;

      if (avgOverlap < 50) {
        recommendations.push({
          priority: "high",
          category: "keywords",
          title: "Keyword Gap Opportunity",
          description: `Only ${avgOverlap.toFixed(1)}% keyword overlap with top competitors. Significant opportunity to capture competitor traffic.`,
          actions: [
            "Target competitor keywords with low difficulty",
            "Create content around competitor questions",
            "Build topical authority in underserved niches",
            "Optimize for long-tail variations",
          ],
          estimatedImpact: "50-100+ new keyword rankings in 6 months",
        });
      }
    }

    // GSC CTR optimization
    if (this.dataSources.gsc && this.dataSources.gsc.averageCTR < 0.03) {
      recommendations.push({
        priority: "medium",
        category: "ctr",
        title: "Improve Click-Through Rate",
        description: `Average CTR is ${(this.dataSources.gsc.averageCTR * 100).toFixed(2)}%, below industry average (3-5%).`,
        actions: [
          "Write compelling meta descriptions with CTAs",
          "Add schema markup (FAQ, HowTo, Product)",
          "Test different title tag formulas",
          "Use power words and emotional triggers",
        ],
        estimatedImpact: "1-2% CTR increase = 30-50% more traffic",
      });
    }

    return recommendations;
  }

  /**
   * Save all reports to Docker volume
   */
  private async saveReportsToVolume(outputs: ReportOutput): Promise<void> {
    console.log(`[ReportEngine] Saving reports to Docker volume for ${this.config.clientSlug}`);

    // Update audit history with report paths
    const reportPaths = {
      html: outputs.formats.html?.filePath,
      csv: outputs.formats.csv?.files,
      json: outputs.formats.json?.filePath,
      md: outputs.formats.md?.filePath,
      pdf: outputs.formats.pdf?.filePath,
    };

    // Store report metadata in database
    await ClientDataManager.updateAuditHistory(this.config.auditId, {
      report_paths: reportPaths,
      health_score: this.healthScore,
      generated_at: new Date().toISOString(),
    });

    console.log("[ReportEngine] Reports saved successfully");
  }
}

export default ReportEngine;
