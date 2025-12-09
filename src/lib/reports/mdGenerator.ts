/**
 * Markdown Report Generator - Phase 7 Week 20
 *
 * Generates clean, readable Markdown reports for GitHub, Notion, or documentation.
 */

import type { AuditResult, DataSources, ActionRecommendation } from "@/types/reports";

export interface MDReportData {
  healthScore: number;
  auditData: AuditResult;
  dataSources: DataSources;
  recommendations: ActionRecommendation[];
}

export class MDGenerator {
  private clientSlug: string;
  private auditId: string;

  constructor(clientSlug: string, auditId: string) {
    this.clientSlug = clientSlug;
    this.auditId = auditId;
  }

  /**
   * Generate complete Markdown report
   */
  generate(data: MDReportData): string {
    const sections: string[] = [];

    // Header
    sections.push(this.generateHeader(data.healthScore));

    // Executive Summary
    sections.push(this.generateExecutiveSummary(data));

    // GSC Performance
    if (data.dataSources.gsc) {
      sections.push(this.generateGSCSection(data.dataSources.gsc));
    }

    // Bing Webmaster
    if (data.dataSources.bing) {
      sections.push(this.generateBingSection(data.dataSources.bing));
    }

    // Brave Search
    if (data.dataSources.brave) {
      sections.push(this.generateBraveSection(data.dataSources.brave));
    }

    // Keyword Rankings
    if (data.dataSources.dataForSEO?.rankedKeywords) {
      sections.push(this.generateKeywordRankings(data.dataSources.dataForSEO.rankedKeywords));
    }

    // Competitor Analysis
    if (data.dataSources.dataForSEO?.competitors) {
      sections.push(this.generateCompetitorAnalysis(data.dataSources.dataForSEO.competitors));
    }

    // GEO Coverage
    if (data.dataSources.geo) {
      sections.push(this.generateGEOCoverage(data.dataSources.geo));
    }

    // Recommendations
    sections.push(this.generateRecommendations(data.recommendations));

    // Footer
    sections.push(this.generateFooter());

    return sections.join("\n\n---\n\n");
  }

  /**
   * Generate header
   */
  private generateHeader(healthScore: number): string {
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `# SEO/GEO Audit Report

**Client:** ${this.clientSlug}
**Audit ID:** \`${this.auditId}\`
**Generated:** ${date}
**Health Score:** ${healthScore}/100 ${this.getHealthEmoji(healthScore)}`;
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(data: MDReportData): string {
    const gsc = data.dataSources.gsc;
    const dfSEO = data.dataSources.dataForSEO;

    return `## Executive Summary

Your current SEO health score is **${data.healthScore}/100** (${this.getHealthGrade(data.healthScore)}). ${this.getHealthMessage(data.healthScore)}

### Key Metrics

| Metric | Value |
|--------|-------|
| Total Impressions | ${gsc?.totalImpressions.toLocaleString() || "N/A"} |
| Total Clicks | ${gsc?.totalClicks.toLocaleString() || "N/A"} |
| Average CTR | ${gsc?.averageCTR ? (gsc.averageCTR * 100).toFixed(2) + "%" : "N/A"} |
| Average Position | ${gsc?.averagePosition?.toFixed(1) || "N/A"} |
| Ranked Keywords | ${dfSEO?.rankedKeywords.length || 0} |
| Top 10 Rankings | ${dfSEO?.rankedKeywords.filter(k => k.position <= 10).length || 0} |`;
  }

  /**
   * Generate GSC section
   */
  private generateGSCSection(gsc: NonNullable<DataSources['gsc']>): string {
    const topQueries = gsc.queries.slice(0, 10);

    let table = `## Google Search Console Performance

### Top 10 Performing Queries

| # | Query | Clicks | Impressions | CTR | Position |
|---|-------|--------|-------------|-----|----------|
`;

    topQueries.forEach((query, index) => {
      table += `| ${index + 1} | ${query.query} | ${query.clicks} | ${query.impressions.toLocaleString()} | ${(query.ctr * 100).toFixed(2)}% | ${query.position.toFixed(1)} |\n`;
    });

    return table;
  }

  /**
   * Generate Bing section
   */
  private generateBingSection(bing: NonNullable<DataSources['bing']>): string {
    return `## Bing Webmaster Tools

- **Indexed Pages:** ${bing.indexedPages}
- **Crawl Errors:** ${bing.crawlErrors} ${bing.crawlErrors === 0 ? "✅" : "⚠️"}
- **Sitemap Status:** ${bing.sitemapStatus}`;
  }

  /**
   * Generate Brave section
   */
  private generateBraveSection(brave: NonNullable<DataSources['brave']>): string {
    const topRankings = brave.rankings.slice(0, 10);

    let content = `## Brave Search Rankings

**Visibility Score:** ${brave.visibility.toFixed(1)}%

### Top Rankings

| Keyword | Position | URL |
|---------|----------|-----|
`;

    topRankings.forEach(rank => {
      content += `| ${rank.keyword} | ${rank.position} | ${rank.url} |\n`;
    });

    return content;
  }

  /**
   * Generate keyword rankings
   */
  private generateKeywordRankings(keywords: Array<{ keyword: string; position: number; search_volume: number; competition: number }>): string {
    const top3 = keywords.filter(k => k.position <= 3).length;
    const top10 = keywords.filter(k => k.position <= 10).length;
    const top20 = keywords.filter(k => k.position <= 20).length;

    let content = `## Keyword Rankings (DataForSEO)

### Distribution

- **Top 3 Positions:** ${top3} keywords 🥇
- **Top 10 Positions:** ${top10} keywords 🏆
- **Top 20 Positions:** ${top20} keywords 📈

### Top 20 Keywords

| Keyword | Position | Search Volume | Competition |
|---------|----------|---------------|-------------|
`;

    keywords.slice(0, 20).forEach(kw => {
      content += `| ${kw.keyword} | ${kw.position} | ${kw.search_volume.toLocaleString()} | ${(kw.competition * 100).toFixed(0)}% |\n`;
    });

    return content;
  }

  /**
   * Generate competitor analysis
   */
  private generateCompetitorAnalysis(competitors: Array<{ domain: string; keywords_overlap: number; rank_average: number }>): string {
    let content = `## Competitor Analysis

| Rank | Domain | Keyword Overlap | Avg Position | Opportunity Score |
|------|--------|-----------------|--------------|-------------------|
`;

    competitors.slice(0, 3).forEach((comp, index) => {
      const opportunity = 100 - comp.keywords_overlap;
      content += `| ${index + 1} | ${comp.domain} | ${comp.keywords_overlap}% | ${comp.rank_average.toFixed(1)} | ${opportunity.toFixed(1)}% |\n`;
    });

    return content;
  }

  /**
   * Generate GEO coverage
   */
  private generateGEOCoverage(geo: NonNullable<DataSources['geo']>): string {
    let content = `## GEO Radius Coverage

- **Service Radius:** ${geo.radiusKm} km
- **Coverage Percentage:** ${geo.coveragePercentage.toFixed(1)}%
- **Target Suburbs:** ${geo.targetSuburbs.length}
- **Gap Suburbs:** ${geo.gapSuburbs.length}

### Gap Suburbs (Opportunities)

`;

    if (geo.gapSuburbs.length > 0) {
      geo.gapSuburbs.slice(0, 20).forEach(suburb => {
        content += `- ${suburb}\n`;
      });

      if (geo.gapSuburbs.length > 20) {
        content += `\n_... and ${geo.gapSuburbs.length - 20} more suburbs_\n`;
      }
    } else {
      content += "_No gap suburbs identified. Excellent coverage!_\n";
    }

    return content;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(recommendations: ActionRecommendation[]): string {
    let content = `## Action Recommendations

`;

    recommendations.forEach(rec => {
      const priorityEmoji = rec.priority === "high" ? "🔴" : rec.priority === "medium" ? "🟡" : "🟢";

      content += `### ${priorityEmoji} ${rec.title} (${rec.priority.toUpperCase()} PRIORITY)

**Category:** ${rec.category}

${rec.description}

**Recommended Actions:**

`;

      rec.actions.forEach(action => {
        content += `- ${action}\n`;
      });

      content += `\n**Estimated Impact:** ${rec.estimatedImpact}\n\n`;
    });

    return content;
  }

  /**
   * Generate footer
   */
  private generateFooter(): string {
    return `## Report Information

This report was generated by **Unite-Hub SEO Intelligence** platform.

**Data Sources:**
- Google Search Console
- Bing Webmaster Tools
- Brave Search API
- DataForSEO API

For questions or assistance, please contact your SEO account manager.`;
  }

  /**
   * Get health emoji
   */
  private getHealthEmoji(score: number): string {
    if (score >= 80) {
return "🟢";
}
    if (score >= 60) {
return "🟡";
}
    return "🔴";
  }

  /**
   * Get health grade
   */
  private getHealthGrade(score: number): string {
    if (score >= 90) {
return "A";
}
    if (score >= 80) {
return "B";
}
    if (score >= 70) {
return "C";
}
    if (score >= 60) {
return "D";
}
    return "F";
  }

  /**
   * Get health message
   */
  private getHealthMessage(score: number): string {
    if (score >= 80) {
return "Excellent performance! Focus on maintaining and expanding your rankings.";
}
    if (score >= 60) {
return "Good performance with room for improvement.";
}
    if (score >= 40) {
return "Average performance. Several optimization opportunities identified.";
}
    return "Critical issues detected. Immediate action required.";
  }
}

export default MDGenerator;
