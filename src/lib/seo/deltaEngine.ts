/**
 * Delta Engine - Phase 8 Week 21
 *
 * Compares two audit JSONs (previous vs latest) and generates structured delta analysis.
 * Detects trends, keyword movements, GEO changes, and competitor shifts.
 *
 * Safety: Read-only operations, no external system modifications.
 */

import type { DataSources } from "@/types/reports";

export interface AuditSnapshot {
  audit_id: string;
  client_id: string;
  timestamp: string;
  health_score: number;
  data_sources: DataSources;
}

export interface MetricDelta {
  metric_name: string;
  previous_value: number;
  current_value: number;
  absolute_change: number;
  percentage_change: number;
  trend: "UP" | "DOWN" | "FLAT";
  significance: "HIGH" | "MEDIUM" | "LOW";
}

export interface KeywordMovement {
  keyword: string;
  previous_position?: number;
  current_position: number;
  position_change: number;
  movement_type: "NEW" | "IMPROVED" | "DECLINED" | "LOST" | "STABLE";
  search_volume?: number;
}

export interface GEOChange {
  change_type: "RADIUS_EXPANDED" | "RADIUS_REDUCED" | "COVERAGE_IMPROVED" | "COVERAGE_DECLINED" | "NEW_GAPS" | "GAPS_CLOSED";
  previous_radius_km?: number;
  current_radius_km: number;
  previous_coverage_pct?: number;
  current_coverage_pct: number;
  new_gap_suburbs: string[];
  closed_gap_suburbs: string[];
}

export interface CompetitorChange {
  competitor_domain: string;
  change_type: "GAINING" | "DECLINING" | "STABLE";
  previous_overlap_pct?: number;
  current_overlap_pct: number;
  previous_rank_avg?: number;
  current_rank_avg: number;
}

export interface DeltaResult {
  comparison_id: string;
  previous_audit_id: string;
  current_audit_id: string;
  time_span_days: number;
  overall_trend: "IMPROVING" | "DECLINING" | "STABLE";
  health_score_delta: MetricDelta;
  metric_deltas: MetricDelta[];
  keyword_movements: KeywordMovement[];
  geo_changes: GEOChange[];
  competitor_changes: CompetitorChange[];
  top_wins: string[];
  top_losses: string[];
  summary: string;
}

export class DeltaEngine {
  /**
   * Compare two audit snapshots and generate delta analysis
   */
  static async computeDelta(
    previousAudit: AuditSnapshot,
    currentAudit: AuditSnapshot
  ): Promise<DeltaResult> {
    const timeSpanDays = this.calculateTimeSpan(previousAudit.timestamp, currentAudit.timestamp);

    // 1. Health Score Delta
    const healthScoreDelta = this.computeMetricDelta(
      "Health Score",
      previousAudit.health_score,
      currentAudit.health_score
    );

    // 2. GSC Metric Deltas
    const metricDeltas: MetricDelta[] = [];

    if (previousAudit.data_sources.gsc && currentAudit.data_sources.gsc) {
      metricDeltas.push(
        this.computeMetricDelta(
          "Total Clicks",
          previousAudit.data_sources.gsc.totalClicks,
          currentAudit.data_sources.gsc.totalClicks
        ),
        this.computeMetricDelta(
          "Total Impressions",
          previousAudit.data_sources.gsc.totalImpressions,
          currentAudit.data_sources.gsc.totalImpressions
        ),
        this.computeMetricDelta(
          "Average CTR",
          previousAudit.data_sources.gsc.averageCTR * 100, // Convert to percentage
          currentAudit.data_sources.gsc.averageCTR * 100
        ),
        this.computeMetricDelta(
          "Average Position",
          previousAudit.data_sources.gsc.averagePosition,
          currentAudit.data_sources.gsc.averagePosition,
          true // Inverse: lower is better
        )
      );
    }

    // 3. Bing Indexing Delta
    if (previousAudit.data_sources.bing && currentAudit.data_sources.bing) {
      metricDeltas.push(
        this.computeMetricDelta(
          "Indexed Pages (Bing)",
          previousAudit.data_sources.bing.indexedPages,
          currentAudit.data_sources.bing.indexedPages
        ),
        this.computeMetricDelta(
          "Crawl Errors (Bing)",
          previousAudit.data_sources.bing.crawlErrors,
          currentAudit.data_sources.bing.crawlErrors,
          true // Inverse: fewer errors is better
        )
      );
    }

    // 4. Keyword Movements
    const keywordMovements = this.computeKeywordMovements(
      previousAudit.data_sources.dataForSEO?.rankedKeywords || [],
      currentAudit.data_sources.dataForSEO?.rankedKeywords || []
    );

    // 5. GEO Changes
    const geoChanges = this.computeGEOChanges(
      previousAudit.data_sources.geo,
      currentAudit.data_sources.geo
    );

    // 6. Competitor Changes
    const competitorChanges = this.computeCompetitorChanges(
      previousAudit.data_sources.dataForSEO?.competitors || [],
      currentAudit.data_sources.dataForSEO?.competitors || []
    );

    // 7. Overall Trend
    const overallTrend = this.determineOverallTrend(healthScoreDelta, metricDeltas);

    // 8. Top Wins and Losses
    const { topWins, topLosses } = this.identifyWinsAndLosses(
      healthScoreDelta,
      metricDeltas,
      keywordMovements,
      geoChanges
    );

    // 9. Summary
    const summary = this.generateSummary(
      overallTrend,
      healthScoreDelta,
      keywordMovements,
      geoChanges,
      topWins,
      topLosses
    );

    return {
      comparison_id: `delta-${currentAudit.audit_id}`,
      previous_audit_id: previousAudit.audit_id,
      current_audit_id: currentAudit.audit_id,
      time_span_days: timeSpanDays,
      overall_trend: overallTrend,
      health_score_delta: healthScoreDelta,
      metric_deltas: metricDeltas,
      keyword_movements: keywordMovements,
      geo_changes: geoChanges,
      competitor_changes: competitorChanges,
      top_wins: topWins,
      top_losses: topLosses,
      summary,
    };
  }

  /**
   * Calculate time span in days between two timestamps
   */
  private static calculateTimeSpan(previousTime: string, currentTime: string): number {
    const prev = new Date(previousTime).getTime();
    const curr = new Date(currentTime).getTime();
    return Math.round((curr - prev) / (1000 * 60 * 60 * 24));
  }

  /**
   * Compute metric delta with trend and significance
   */
  private static computeMetricDelta(
    metricName: string,
    previousValue: number,
    currentValue: number,
    inverse: boolean = false
  ): MetricDelta {
    const absoluteChange = currentValue - previousValue;
    const percentageChange = previousValue > 0 ? (absoluteChange / previousValue) * 100 : 0;

    // Determine trend (inverse logic for "lower is better" metrics like errors, position)
    let trend: "UP" | "DOWN" | "FLAT";
    if (Math.abs(percentageChange) < 2) {
      trend = "FLAT";
    } else if (inverse) {
      trend = absoluteChange < 0 ? "UP" : "DOWN"; // Lower is better
    } else {
      trend = absoluteChange > 0 ? "UP" : "DOWN"; // Higher is better
    }

    // Determine significance
    const absPercentageChange = Math.abs(percentageChange);
    let significance: "HIGH" | "MEDIUM" | "LOW";
    if (absPercentageChange >= 30) {
      significance = "HIGH";
    } else if (absPercentageChange >= 10) {
      significance = "MEDIUM";
    } else {
      significance = "LOW";
    }

    return {
      metric_name: metricName,
      previous_value: previousValue,
      current_value: currentValue,
      absolute_change: absoluteChange,
      percentage_change: percentageChange,
      trend,
      significance,
    };
  }

  /**
   * Compute keyword movements (new, improved, declined, lost)
   */
  private static computeKeywordMovements(
    previousKeywords: Array<{ keyword: string; position: number; search_volume: number }>,
    currentKeywords: Array<{ keyword: string; position: number; search_volume: number }>
  ): KeywordMovement[] {
    const movements: KeywordMovement[] = [];
    const previousMap = new Map(previousKeywords.map(k => [k.keyword, k]));
    const currentMap = new Map(currentKeywords.map(k => [k.keyword, k]));

    // Check current keywords
    for (const current of currentKeywords) {
      const previous = previousMap.get(current.keyword);

      if (!previous) {
        // New keyword
        movements.push({
          keyword: current.keyword,
          current_position: current.position,
          position_change: 0,
          movement_type: "NEW",
          search_volume: current.search_volume,
        });
      } else {
        const positionChange = previous.position - current.position; // Positive = improved

        if (Math.abs(positionChange) <= 1) {
          movements.push({
            keyword: current.keyword,
            previous_position: previous.position,
            current_position: current.position,
            position_change: positionChange,
            movement_type: "STABLE",
            search_volume: current.search_volume,
          });
        } else if (positionChange > 0) {
          movements.push({
            keyword: current.keyword,
            previous_position: previous.position,
            current_position: current.position,
            position_change: positionChange,
            movement_type: "IMPROVED",
            search_volume: current.search_volume,
          });
        } else {
          movements.push({
            keyword: current.keyword,
            previous_position: previous.position,
            current_position: current.position,
            position_change: positionChange,
            movement_type: "DECLINED",
            search_volume: current.search_volume,
          });
        }
      }
    }

    // Check for lost keywords
    for (const previous of previousKeywords) {
      if (!currentMap.has(previous.keyword)) {
        movements.push({
          keyword: previous.keyword,
          previous_position: previous.position,
          current_position: 100, // Out of top 100
          position_change: previous.position - 100,
          movement_type: "LOST",
          search_volume: previous.search_volume,
        });
      }
    }

    // Sort by significance (improved/new first, then by search volume)
    return movements.sort((a, b) => {
      const typeScore = { NEW: 5, IMPROVED: 4, STABLE: 2, DECLINED: 3, LOST: 1 };
      const scoreA = typeScore[a.movement_type] * (a.search_volume || 0);
      const scoreB = typeScore[b.movement_type] * (b.search_volume || 0);
      return scoreB - scoreA;
    });
  }

  /**
   * Compute GEO changes (radius, coverage, gaps)
   */
  private static computeGEOChanges(
    previousGEO?: DataSources['geo'],
    currentGEO?: DataSources['geo']
  ): GEOChange[] {
    const changes: GEOChange[] = [];

    if (!previousGEO || !currentGEO) {
return changes;
}

    // Radius change
    if (previousGEO.radiusKm !== currentGEO.radiusKm) {
      const changeType = currentGEO.radiusKm > previousGEO.radiusKm ? "RADIUS_EXPANDED" : "RADIUS_REDUCED";
      changes.push({
        change_type: changeType,
        previous_radius_km: previousGEO.radiusKm,
        current_radius_km: currentGEO.radiusKm,
        previous_coverage_pct: previousGEO.coveragePercentage,
        current_coverage_pct: currentGEO.coveragePercentage,
        new_gap_suburbs: [],
        closed_gap_suburbs: [],
      });
    }

    // Coverage change
    const coverageDelta = currentGEO.coveragePercentage - previousGEO.coveragePercentage;
    if (Math.abs(coverageDelta) > 5) {
      const changeType = coverageDelta > 0 ? "COVERAGE_IMPROVED" : "COVERAGE_DECLINED";
      changes.push({
        change_type: changeType,
        previous_radius_km: previousGEO.radiusKm,
        current_radius_km: currentGEO.radiusKm,
        previous_coverage_pct: previousGEO.coveragePercentage,
        current_coverage_pct: currentGEO.coveragePercentage,
        new_gap_suburbs: [],
        closed_gap_suburbs: [],
      });
    }

    // Gap suburbs analysis
    const previousGaps = new Set(previousGEO.gapSuburbs);
    const currentGaps = new Set(currentGEO.gapSuburbs);

    const newGaps = currentGEO.gapSuburbs.filter(suburb => !previousGaps.has(suburb));
    const closedGaps = previousGEO.gapSuburbs.filter(suburb => !currentGaps.has(suburb));

    if (newGaps.length > 0) {
      changes.push({
        change_type: "NEW_GAPS",
        current_radius_km: currentGEO.radiusKm,
        previous_coverage_pct: previousGEO.coveragePercentage,
        current_coverage_pct: currentGEO.coveragePercentage,
        new_gap_suburbs: newGaps,
        closed_gap_suburbs: [],
      });
    }

    if (closedGaps.length > 0) {
      changes.push({
        change_type: "GAPS_CLOSED",
        current_radius_km: currentGEO.radiusKm,
        previous_coverage_pct: previousGEO.coveragePercentage,
        current_coverage_pct: currentGEO.coveragePercentage,
        new_gap_suburbs: [],
        closed_gap_suburbs: closedGaps,
      });
    }

    return changes;
  }

  /**
   * Compute competitor changes
   */
  private static computeCompetitorChanges(
    previousCompetitors: Array<{ domain: string; keywords_overlap: number; rank_average: number }>,
    currentCompetitors: Array<{ domain: string; keywords_overlap: number; rank_average: number }>
  ): CompetitorChange[] {
    const changes: CompetitorChange[] = [];
    const previousMap = new Map(previousCompetitors.map(c => [c.domain, c]));

    for (const current of currentCompetitors) {
      const previous = previousMap.get(current.domain);

      if (previous) {
        const overlapDelta = current.keywords_overlap - previous.keywords_overlap;
        const rankDelta = previous.rank_average - current.rank_average; // Positive = competitor improving

        let changeType: "GAINING" | "DECLINING" | "STABLE";
        if (Math.abs(overlapDelta) < 5 && Math.abs(rankDelta) < 1) {
          changeType = "STABLE";
        } else if (overlapDelta > 5 || rankDelta > 1) {
          changeType = "GAINING";
        } else {
          changeType = "DECLINING";
        }

        changes.push({
          competitor_domain: current.domain,
          change_type: changeType,
          previous_overlap_pct: previous.keywords_overlap,
          current_overlap_pct: current.keywords_overlap,
          previous_rank_avg: previous.rank_average,
          current_rank_avg: current.rank_average,
        });
      }
    }

    return changes.filter(c => c.change_type !== "STABLE");
  }

  /**
   * Determine overall trend based on health score and key metrics
   */
  private static determineOverallTrend(
    healthScoreDelta: MetricDelta,
    metricDeltas: MetricDelta[]
  ): "IMPROVING" | "DECLINING" | "STABLE" {
    // Primary signal: health score
    if (healthScoreDelta.significance === "HIGH") {
      return healthScoreDelta.trend === "UP" ? "IMPROVING" : "DECLINING";
    }

    // Secondary signal: majority of metrics
    const upCount = metricDeltas.filter(m => m.trend === "UP" && m.significance !== "LOW").length;
    const downCount = metricDeltas.filter(m => m.trend === "DOWN" && m.significance !== "LOW").length;

    if (upCount > downCount * 1.5) {
return "IMPROVING";
}
    if (downCount > upCount * 1.5) {
return "DECLINING";
}
    return "STABLE";
  }

  /**
   * Identify top wins and losses
   */
  private static identifyWinsAndLosses(
    healthScoreDelta: MetricDelta,
    metricDeltas: MetricDelta[],
    keywordMovements: KeywordMovement[],
    geoChanges: GEOChange[]
  ): { topWins: string[]; topLosses: string[] } {
    const wins: string[] = [];
    const losses: string[] = [];

    // Health score
    if (healthScoreDelta.trend === "UP" && healthScoreDelta.significance !== "LOW") {
      wins.push(`Health score improved by ${healthScoreDelta.absolute_change.toFixed(1)} points to ${healthScoreDelta.current_value}/100`);
    } else if (healthScoreDelta.trend === "DOWN" && healthScoreDelta.significance !== "LOW") {
      losses.push(`Health score dropped by ${Math.abs(healthScoreDelta.absolute_change).toFixed(1)} points to ${healthScoreDelta.current_value}/100`);
    }

    // Significant metric improvements
    for (const metric of metricDeltas.filter(m => m.trend === "UP" && m.significance === "HIGH")) {
      wins.push(`${metric.metric_name} increased by ${metric.percentage_change.toFixed(1)}%`);
    }

    // Significant metric declines
    for (const metric of metricDeltas.filter(m => m.trend === "DOWN" && m.significance === "HIGH")) {
      losses.push(`${metric.metric_name} decreased by ${Math.abs(metric.percentage_change).toFixed(1)}%`);
    }

    // Keyword wins (improved + new)
    const keywordWins = keywordMovements.filter(k => k.movement_type === "IMPROVED" || k.movement_type === "NEW").slice(0, 3);
    for (const kw of keywordWins) {
      if (kw.movement_type === "NEW") {
        wins.push(`New ranking for "${kw.keyword}" at position ${kw.current_position}`);
      } else {
        wins.push(`"${kw.keyword}" improved by ${kw.position_change} positions to ${kw.current_position}`);
      }
    }

    // Keyword losses
    const keywordLosses = keywordMovements.filter(k => k.movement_type === "LOST" || (k.movement_type === "DECLINED" && Math.abs(k.position_change) > 5)).slice(0, 3);
    for (const kw of keywordLosses) {
      if (kw.movement_type === "LOST") {
        losses.push(`Lost ranking for "${kw.keyword}" (was at position ${kw.previous_position})`);
      } else {
        losses.push(`"${kw.keyword}" dropped by ${Math.abs(kw.position_change)} positions to ${kw.current_position}`);
      }
    }

    // GEO wins
    const geoWins = geoChanges.filter(g => g.change_type === "COVERAGE_IMPROVED" || g.change_type === "GAPS_CLOSED");
    for (const geo of geoWins) {
      if (geo.change_type === "COVERAGE_IMPROVED") {
        wins.push(`GEO coverage improved to ${geo.current_coverage_pct.toFixed(1)}%`);
      } else if (geo.closed_gap_suburbs.length > 0) {
        wins.push(`Closed ${geo.closed_gap_suburbs.length} suburb gaps`);
      }
    }

    // GEO losses
    const geoLosses = geoChanges.filter(g => g.change_type === "COVERAGE_DECLINED" || g.change_type === "NEW_GAPS");
    for (const geo of geoLosses) {
      if (geo.change_type === "COVERAGE_DECLINED") {
        losses.push(`GEO coverage declined to ${geo.current_coverage_pct.toFixed(1)}%`);
      } else if (geo.new_gap_suburbs.length > 0) {
        losses.push(`${geo.new_gap_suburbs.length} new suburb gaps identified`);
      }
    }

    return {
      topWins: wins.slice(0, 5),
      topLosses: losses.slice(0, 5),
    };
  }

  /**
   * Generate plain-English summary
   */
  private static generateSummary(
    overallTrend: "IMPROVING" | "DECLINING" | "STABLE",
    healthScoreDelta: MetricDelta,
    keywordMovements: KeywordMovement[],
    geoChanges: GEOChange[],
    topWins: string[],
    topLosses: string[]
  ): string {
    const trendEmoji = { IMPROVING: "📈", DECLINING: "📉", STABLE: "➡️" };
    const emoji = trendEmoji[overallTrend];

    let summary = `${emoji} **${overallTrend}** - `;

    if (overallTrend === "IMPROVING") {
      summary += `Your SEO performance is trending upward. Health score is now ${healthScoreDelta.current_value}/100`;
      if (topWins.length > 0) {
        summary += `. Key wins: ${topWins.slice(0, 2).join(", ")}`;
      }
    } else if (overallTrend === "DECLINING") {
      summary += `Your SEO performance needs attention. Health score dropped to ${healthScoreDelta.current_value}/100`;
      if (topLosses.length > 0) {
        summary += `. Areas of concern: ${topLosses.slice(0, 2).join(", ")}`;
      }
    } else {
      summary += `Your SEO performance is stable at ${healthScoreDelta.current_value}/100`;
    }

    // Add keyword summary
    const newKeywords = keywordMovements.filter(k => k.movement_type === "NEW").length;
    const improvedKeywords = keywordMovements.filter(k => k.movement_type === "IMPROVED").length;
    const lostKeywords = keywordMovements.filter(k => k.movement_type === "LOST").length;

    if (newKeywords > 0 || improvedKeywords > 0 || lostKeywords > 0) {
      summary += `. Keywords: ${newKeywords} new, ${improvedKeywords} improved, ${lostKeywords} lost`;
    }

    // Add GEO summary if significant changes
    const significantGeoChanges = geoChanges.filter(g =>
      g.change_type === "COVERAGE_IMPROVED" ||
      g.change_type === "COVERAGE_DECLINED" ||
      g.new_gap_suburbs.length > 3 ||
      g.closed_gap_suburbs.length > 3
    );

    if (significantGeoChanges.length > 0) {
      const geoChange = significantGeoChanges[0];
      if (geoChange.change_type === "COVERAGE_IMPROVED") {
        summary += `. GEO coverage improved to ${geoChange.current_coverage_pct.toFixed(0)}%`;
      } else if (geoChange.change_type === "COVERAGE_DECLINED") {
        summary += `. GEO coverage needs attention (${geoChange.current_coverage_pct.toFixed(0)}%)`;
      }
    }

    summary += ".";

    return summary;
  }
}

export default DeltaEngine;
