/**
 * History Timeline - Phase 8 Week 21
 *
 * Builds per-client timeline view from seo_audit_history table.
 * Enables time-series analysis and trend visualization.
 *
 * Safety: Read-only operations, no external system modifications.
 */

import { getSupabaseServer } from "@/lib/supabase";
import type { DeltaResult } from "./deltaEngine";

export interface TimelineEntry {
  audit_id: string;
  audit_type: "full" | "snapshot" | "onboarding" | "geo";
  timestamp: string;
  health_score: number;
  overall_trend: "IMPROVING" | "DECLINING" | "STABLE" | "INITIAL";
  delta_summary?: {
    metric_changes: number;
    keywords_improved: number;
    keywords_declined: number;
    keywords_new: number;
    keywords_lost: number;
    top_win?: string;
    top_loss?: string;
  };
  previous_audit_id?: string;
}

export interface TimelineView {
  client_id: string;
  client_slug: string;
  entries: TimelineEntry[];
  date_range: {
    start: string;
    end: string;
  };
  summary: {
    total_audits: number;
    avg_health_score: number;
    health_score_trend: "IMPROVING" | "DECLINING" | "STABLE";
    best_health_score: number;
    worst_health_score: number;
    total_keywords_gained: number;
    total_keywords_lost: number;
  };
}

export interface TimelineFilters {
  start_date?: string;
  end_date?: string;
  audit_types?: Array<"full" | "snapshot" | "onboarding" | "geo">;
  limit?: number;
  include_deltas?: boolean;
}

export class HistoryTimeline {
  /**
   * Build timeline view for a client
   */
  static async buildTimeline(
    clientId: string,
    filters: TimelineFilters = {}
  ): Promise<TimelineView> {
    const supabase = await getSupabaseServer();

    // Build query
    let query = supabase
      .from("seo_audit_history")
      .select(`
        audit_id,
        audit_type,
        created_at,
        health_score,
        previous_audit_id,
        delta_summary
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.start_date) {
      query = query.gte("created_at", filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte("created_at", filters.end_date);
    }

    if (filters.audit_types && filters.audit_types.length > 0) {
      query = query.in("audit_type", filters.audit_types);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data: audits, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch audit history: ${error.message}`);
    }

    if (!audits || audits.length === 0) {
      return this.createEmptyTimeline(clientId);
    }

    // Get client slug
    const { data: clientProfile } = await supabase
      .from("seo_client_profiles")
      .select("domain")
      .eq("client_id", clientId)
      .single();

    const clientSlug = clientProfile?.domain?.replace(/\./g, "-") || clientId;

    // Transform to timeline entries
    const entries: TimelineEntry[] = audits.map((audit, index) => {
      const deltaSummary = audit.delta_summary as DeltaSummaryData | null;

      return {
        audit_id: audit.audit_id,
        audit_type: audit.audit_type as TimelineEntry["audit_type"],
        timestamp: audit.created_at,
        health_score: audit.health_score || 0,
        overall_trend: this.determineTrendFromDelta(deltaSummary, index === audits.length - 1),
        delta_summary: deltaSummary ? {
          metric_changes: deltaSummary.metric_deltas?.length || 0,
          keywords_improved: deltaSummary.keywords_improved || 0,
          keywords_declined: deltaSummary.keywords_declined || 0,
          keywords_new: deltaSummary.keywords_new || 0,
          keywords_lost: deltaSummary.keywords_lost || 0,
          top_win: deltaSummary.top_wins?.[0],
          top_loss: deltaSummary.top_losses?.[0],
        } : undefined,
        previous_audit_id: audit.previous_audit_id || undefined,
      };
    });

    // Calculate summary
    const summary = this.calculateSummary(entries);

    // Determine date range
    const dateRange = {
      start: audits[audits.length - 1]?.created_at || new Date().toISOString(),
      end: audits[0]?.created_at || new Date().toISOString(),
    };

    return {
      client_id: clientId,
      client_slug: clientSlug,
      entries,
      date_range: dateRange,
      summary,
    };
  }

  /**
   * Get timeline entry for specific audit
   */
  static async getTimelineEntry(auditId: string): Promise<TimelineEntry | null> {
    const supabase = await getSupabaseServer();

    const { data: audit, error } = await supabase
      .from("seo_audit_history")
      .select(`
        audit_id,
        audit_type,
        created_at,
        health_score,
        previous_audit_id,
        delta_summary
      `)
      .eq("audit_id", auditId)
      .single();

    if (error || !audit) {
      return null;
    }

    const deltaSummary = audit.delta_summary as DeltaSummaryData | null;

    return {
      audit_id: audit.audit_id,
      audit_type: audit.audit_type as TimelineEntry["audit_type"],
      timestamp: audit.created_at,
      health_score: audit.health_score || 0,
      overall_trend: this.determineTrendFromDelta(deltaSummary, !audit.previous_audit_id),
      delta_summary: deltaSummary ? {
        metric_changes: deltaSummary.metric_deltas?.length || 0,
        keywords_improved: deltaSummary.keywords_improved || 0,
        keywords_declined: deltaSummary.keywords_declined || 0,
        keywords_new: deltaSummary.keywords_new || 0,
        keywords_lost: deltaSummary.keywords_lost || 0,
        top_win: deltaSummary.top_wins?.[0],
        top_loss: deltaSummary.top_losses?.[0],
      } : undefined,
      previous_audit_id: audit.previous_audit_id || undefined,
    };
  }

  /**
   * Get health score trend over time
   */
  static async getHealthScoreTrend(
    clientId: string,
    days: number = 90
  ): Promise<Array<{ date: string; score: number }>> {
    const supabase = await getSupabaseServer();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: audits, error } = await supabase
      .from("seo_audit_history")
      .select("created_at, health_score")
      .eq("client_id", clientId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error || !audits) {
      return [];
    }

    return audits.map(audit => ({
      date: audit.created_at,
      score: audit.health_score || 0,
    }));
  }

  /**
   * Compare two specific audits
   */
  static async compareAudits(
    currentAuditId: string,
    previousAuditId: string
  ): Promise<{ current: TimelineEntry; previous: TimelineEntry } | null> {
    const current = await this.getTimelineEntry(currentAuditId);
    const previous = await this.getTimelineEntry(previousAuditId);

    if (!current || !previous) {
      return null;
    }

    return { current, previous };
  }

  /**
   * Determine trend from delta summary
   */
  private static determineTrendFromDelta(
    deltaSummary: DeltaSummaryData | null,
    isFirstAudit: boolean
  ): "IMPROVING" | "DECLINING" | "STABLE" | "INITIAL" {
    if (isFirstAudit || !deltaSummary) {
      return "INITIAL";
    }

    if (deltaSummary.overall_trend) {
      return deltaSummary.overall_trend as "IMPROVING" | "DECLINING" | "STABLE";
    }

    // Fallback: infer from health score delta
    const healthDelta = deltaSummary.health_score_delta;
    if (!healthDelta) return "STABLE";

    if (healthDelta.percentage_change >= 10) return "IMPROVING";
    if (healthDelta.percentage_change <= -10) return "DECLINING";
    return "STABLE";
  }

  /**
   * Calculate summary statistics for timeline
   */
  private static calculateSummary(entries: TimelineEntry[]): TimelineView["summary"] {
    if (entries.length === 0) {
      return {
        total_audits: 0,
        avg_health_score: 0,
        health_score_trend: "STABLE",
        best_health_score: 0,
        worst_health_score: 0,
        total_keywords_gained: 0,
        total_keywords_lost: 0,
      };
    }

    const healthScores = entries.map(e => e.health_score);
    const avgHealthScore = healthScores.reduce((a, b) => a + b, 0) / healthScores.length;
    const bestHealthScore = Math.max(...healthScores);
    const worstHealthScore = Math.min(...healthScores);

    // Calculate overall trend (compare first half to second half)
    let healthScoreTrend: "IMPROVING" | "DECLINING" | "STABLE" = "STABLE";
    if (entries.length >= 2) {
      const midpoint = Math.floor(entries.length / 2);
      const recentAvg = healthScores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
      const olderAvg = healthScores.slice(midpoint).reduce((a, b) => a + b, 0) / (entries.length - midpoint);

      const trendDelta = recentAvg - olderAvg;
      if (trendDelta >= 5) healthScoreTrend = "IMPROVING";
      else if (trendDelta <= -5) healthScoreTrend = "DECLINING";
    }

    // Calculate total keywords gained/lost
    const totalKeywordsGained = entries.reduce((total, entry) => {
      return total + (entry.delta_summary?.keywords_new || 0) + (entry.delta_summary?.keywords_improved || 0);
    }, 0);

    const totalKeywordsLost = entries.reduce((total, entry) => {
      return total + (entry.delta_summary?.keywords_lost || 0) + (entry.delta_summary?.keywords_declined || 0);
    }, 0);

    return {
      total_audits: entries.length,
      avg_health_score: Math.round(avgHealthScore * 10) / 10,
      health_score_trend: healthScoreTrend,
      best_health_score: bestHealthScore,
      worst_health_score: worstHealthScore,
      total_keywords_gained: totalKeywordsGained,
      total_keywords_lost: totalKeywordsLost,
    };
  }

  /**
   * Create empty timeline for clients with no history
   */
  private static createEmptyTimeline(clientId: string): TimelineView {
    return {
      client_id: clientId,
      client_slug: clientId,
      entries: [],
      date_range: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      summary: {
        total_audits: 0,
        avg_health_score: 0,
        health_score_trend: "STABLE",
        best_health_score: 0,
        worst_health_score: 0,
        total_keywords_gained: 0,
        total_keywords_lost: 0,
      },
    };
  }
}

// Internal type for delta summary stored in database
interface DeltaSummaryData {
  overall_trend?: string;
  health_score_delta?: {
    percentage_change: number;
  };
  metric_deltas?: unknown[];
  keywords_improved?: number;
  keywords_declined?: number;
  keywords_new?: number;
  keywords_lost?: number;
  top_wins?: string[];
  top_losses?: string[];
}

export default HistoryTimeline;
