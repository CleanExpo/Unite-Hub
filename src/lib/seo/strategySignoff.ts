/**
 * Strategy Signoff Service - Phase 8 Week 24
 *
 * Manages strategy recommendations and human approval workflow.
 */

import { getSupabaseServer } from "@/lib/supabase";

// =============================================================
// Types
// =============================================================

export type SignoffDecision = "APPROVED" | "REJECTED" | "MODIFIED";

export interface StrategyRecommendation {
  recommendation_id: string;
  client_id: string;
  audit_id: string;
  category: "technical" | "content" | "keywords" | "backlinks" | "geo" | "competitors";
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  expected_impact: string;
  effort_level: "LOW" | "MEDIUM" | "HIGH";
  actions: string[];
  metrics_to_track: string[];
  created_at: string;
}

export interface SignoffRecord {
  signoff_id: string;
  client_id: string;
  audit_id: string;
  recommendation_id?: string;
  decision: SignoffDecision;
  notes: string;
  decided_by: string;
  decided_at: string;
  action_json: Record<string, any>;
}

export interface StrategySnapshot {
  client_id: string;
  audit_id: string;
  generated_at: string;
  health_score: number;
  previous_health_score: number;
  overall_trend: "IMPROVING" | "DECLINING" | "STABLE";
  top_wins: string[];
  top_losses: string[];
  recommendations: StrategyRecommendation[];
  signoff_status: "PENDING" | "APPROVED" | "PARTIAL" | "REJECTED";
}

// =============================================================
// Strategy Signoff Service
// =============================================================

export class StrategySignoffService {
  /**
   * Create a strategy snapshot with recommendations
   */
  static async createStrategySnapshot(
    clientId: string,
    auditId: string,
    healthScore: number,
    previousHealthScore: number,
    deltaResult: any
  ): Promise<StrategySnapshot> {
    // Generate recommendations based on audit data
    const recommendations = this.generateRecommendations(
      clientId,
      auditId,
      healthScore,
      deltaResult
    );

    const snapshot: StrategySnapshot = {
      client_id: clientId,
      audit_id: auditId,
      generated_at: new Date().toISOString(),
      health_score: healthScore,
      previous_health_score: previousHealthScore,
      overall_trend: deltaResult?.overall_trend || "STABLE",
      top_wins: deltaResult?.top_wins || [],
      top_losses: deltaResult?.top_losses || [],
      recommendations,
      signoff_status: "PENDING",
    };

    // Store snapshot
    const supabase = await getSupabaseServer();
    await supabase.from("strategy_snapshots").insert({
      client_id: clientId,
      audit_id: auditId,
      snapshot_data: snapshot,
      created_at: snapshot.generated_at,
    });

    return snapshot;
  }

  /**
   * Generate recommendations based on audit data
   */
  private static generateRecommendations(
    clientId: string,
    auditId: string,
    healthScore: number,
    deltaResult: any
  ): StrategyRecommendation[] {
    const recommendations: StrategyRecommendation[] = [];

    // Low health score recommendations
    if (healthScore < 60) {
      recommendations.push({
        recommendation_id: crypto.randomUUID(),
        client_id: clientId,
        audit_id: auditId,
        category: "technical",
        priority: "HIGH",
        title: "Urgent Technical SEO Audit Required",
        description:
          "Health score is below 60, indicating significant technical issues that need immediate attention.",
        expected_impact: "Could improve health score by 15-25 points",
        effort_level: "HIGH",
        actions: [
          "Run comprehensive crawl audit",
          "Fix critical indexing issues",
          "Resolve Core Web Vitals problems",
          "Check robots.txt and sitemap",
        ],
        metrics_to_track: [
          "Health Score",
          "Crawl Errors",
          "Indexed Pages",
          "Core Web Vitals",
        ],
        created_at: new Date().toISOString(),
      });
    }

    // Keyword loss recommendations
    if (deltaResult?.keyword_movements) {
      const lost = deltaResult.keyword_movements.filter(
        (k: any) => k.movement_type === "LOST"
      );
      if (lost.length > 3) {
        recommendations.push({
          recommendation_id: crypto.randomUUID(),
          client_id: clientId,
          audit_id: auditId,
          category: "keywords",
          priority: "HIGH",
          title: "Recover Lost Keyword Rankings",
          description: `Lost rankings for ${lost.length} keywords. Investigate content and technical factors.`,
          expected_impact: "Recover 50-70% of lost traffic",
          effort_level: "MEDIUM",
          actions: [
            "Analyze pages that lost rankings",
            "Check for content freshness issues",
            "Review competitor content for those keywords",
            "Update and expand existing content",
          ],
          metrics_to_track: ["Keyword Positions", "Organic Traffic", "Impressions"],
          created_at: new Date().toISOString(),
        });
      }
    }

    // GEO coverage recommendations
    if (deltaResult?.geo_changes) {
      const gaps = deltaResult.geo_changes.find(
        (g: any) => g.change_type === "NEW_GAPS"
      );
      if (gaps) {
        recommendations.push({
          recommendation_id: crypto.randomUUID(),
          client_id: clientId,
          audit_id: auditId,
          category: "geo",
          priority: "MEDIUM",
          title: "Expand Local SEO Coverage",
          description: "New service area gaps detected. Opportunity to capture local traffic.",
          expected_impact: "Increase local visibility by 20-30%",
          effort_level: "MEDIUM",
          actions: [
            "Create location-specific landing pages",
            "Build local citations",
            "Optimize Google Business Profile for new areas",
            "Target suburb-specific keywords",
          ],
          metrics_to_track: [
            "GEO Coverage %",
            "Local Pack Rankings",
            "GMB Impressions",
          ],
          created_at: new Date().toISOString(),
        });
      }
    }

    // Content recommendations (always included)
    recommendations.push({
      recommendation_id: crypto.randomUUID(),
      client_id: clientId,
      audit_id: auditId,
      category: "content",
      priority: "MEDIUM",
      title: "Content Optimization Opportunities",
      description: "Regular content updates improve rankings and user engagement.",
      expected_impact: "5-10% improvement in organic traffic",
      effort_level: "LOW",
      actions: [
        "Update top-performing pages with fresh content",
        "Add FAQ schema to service pages",
        "Create blog posts for long-tail keywords",
        "Improve internal linking structure",
      ],
      metrics_to_track: [
        "Organic Traffic",
        "Time on Page",
        "Bounce Rate",
        "Featured Snippets",
      ],
      created_at: new Date().toISOString(),
    });

    // Backlink recommendations if declining
    if (deltaResult?.overall_trend === "DECLINING") {
      recommendations.push({
        recommendation_id: crypto.randomUUID(),
        client_id: clientId,
        audit_id: auditId,
        category: "backlinks",
        priority: "MEDIUM",
        title: "Backlink Acquisition Campaign",
        description:
          "Overall trend is declining. Building quality backlinks can reverse this.",
        expected_impact: "Improve authority score by 10-20 points",
        effort_level: "HIGH",
        actions: [
          "Identify link-worthy content opportunities",
          "Reach out to industry publications",
          "Create shareable infographics or studies",
          "Pursue guest posting opportunities",
        ],
        metrics_to_track: [
          "Referring Domains",
          "Domain Authority",
          "Backlink Score",
        ],
        created_at: new Date().toISOString(),
      });
    }

    // Sort by priority
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return recommendations.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  /**
   * Submit signoff decision
   */
  static async submitSignoff(
    clientId: string,
    auditId: string,
    recommendationId: string | null,
    decision: SignoffDecision,
    notes: string,
    userId: string,
    actions?: Record<string, any>
  ): Promise<SignoffRecord> {
    const supabase = await getSupabaseServer();

    const signoff: Omit<SignoffRecord, "signoff_id"> = {
      client_id: clientId,
      audit_id: auditId,
      recommendation_id: recommendationId || undefined,
      decision,
      notes,
      decided_by: userId,
      decided_at: new Date().toISOString(),
      action_json: actions || {},
    };

    const { data, error } = await supabase
      .from("strategy_signoffs")
      .insert(signoff)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit signoff: ${error.message}`);
    }

    return data;
  }

  /**
   * Get signoff history for a client
   */
  static async getSignoffHistory(
    clientId: string,
    limit: number = 20
  ): Promise<SignoffRecord[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("strategy_signoffs")
      .select("*")
      .eq("client_id", clientId)
      .order("decided_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get signoff history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get pending recommendations for a client
   */
  static async getPendingRecommendations(
    clientId: string
  ): Promise<StrategyRecommendation[]> {
    const supabase = await getSupabaseServer();

    // Get latest snapshot
    const { data: snapshot } = await supabase
      .from("strategy_snapshots")
      .select("snapshot_data")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!snapshot) {
return [];
}

    const snapshotData = snapshot.snapshot_data as StrategySnapshot;

    // Get existing signoffs
    const { data: signoffs } = await supabase
      .from("strategy_signoffs")
      .select("recommendation_id")
      .eq("client_id", clientId)
      .eq("audit_id", snapshotData.audit_id);

    const signedOffIds = new Set(
      (signoffs || []).map((s) => s.recommendation_id)
    );

    // Return recommendations without signoffs
    return snapshotData.recommendations.filter(
      (r) => !signedOffIds.has(r.recommendation_id)
    );
  }

  /**
   * Get strategy snapshot for a client
   */
  static async getLatestSnapshot(clientId: string): Promise<StrategySnapshot | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("strategy_snapshots")
      .select("snapshot_data")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
return null;
}

    return data.snapshot_data as StrategySnapshot;
  }
}

export default StrategySignoffService;
