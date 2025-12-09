/**
 * Anomaly Detector - Phase 8 Week 23
 *
 * Detects significant changes and anomalies in SEO metrics.
 * Triggers alerts when thresholds are exceeded.
 */

import { getSupabaseServer } from "@/lib/supabase";

// =============================================================
// Types
// =============================================================

export type AnomalyType =
  | "HEALTH_SCORE_DROP"
  | "HEALTH_SCORE_SPIKE"
  | "TRAFFIC_DROP"
  | "TRAFFIC_SPIKE"
  | "BACKLINKS_LOST"
  | "BACKLINKS_SPIKE"
  | "POSITION_DROP"
  | "TOXIC_BACKLINKS"
  | "CRAWL_ERRORS"
  | "INDEX_DROP";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Anomaly {
  anomaly_id: string;
  client_id: string;
  anomaly_type: AnomalyType;
  severity: Severity;
  detected_at: string;
  metric_name: string;
  previous_value: number;
  current_value: number;
  change_percent: number;
  threshold_exceeded: number;
  message: string;
  recommendations: string[];
  acknowledged: boolean;
}

export interface AnomalyThresholds {
  health_score_drop: number; // % drop to trigger
  health_score_spike: number; // % increase to trigger
  traffic_drop: number;
  traffic_spike: number;
  backlinks_lost_percent: number;
  backlinks_spike_percent: number;
  position_drop: number; // absolute position change
  toxic_score_threshold: number;
  crawl_errors_threshold: number;
  index_drop_percent: number;
}

const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  health_score_drop: 15,
  health_score_spike: 25,
  traffic_drop: 30,
  traffic_spike: 50,
  backlinks_lost_percent: 20,
  backlinks_spike_percent: 100,
  position_drop: 5,
  toxic_score_threshold: 30,
  crawl_errors_threshold: 10,
  index_drop_percent: 20,
};

// =============================================================
// Anomaly Detector Class
// =============================================================

export class AnomalyDetector {
  private thresholds: AnomalyThresholds;

  constructor(thresholds?: Partial<AnomalyThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Detect all anomalies for a client
   */
  async detectAnomalies(clientId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Get recent audits for comparison
    const supabase = await getSupabaseServer();
    const { data: audits } = await supabase
      .from("seo_audit_history")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(2);

    if (!audits || audits.length < 2) {
      return anomalies; // Need at least 2 audits for comparison
    }

    const [current, previous] = audits;

    // Health Score Anomalies
    const healthAnomaly = this.checkHealthScore(
      clientId,
      previous.health_score,
      current.health_score
    );
    if (healthAnomaly) {
anomalies.push(healthAnomaly);
}

    // Backlink Anomalies
    if (current.backlink_score !== undefined && previous.backlink_score !== undefined) {
      const backlinkAnomaly = this.checkBacklinks(
        clientId,
        previous.backlink_score,
        current.backlink_score
      );
      if (backlinkAnomaly) {
anomalies.push(backlinkAnomaly);
}
    }

    // Check delta summary for more detailed anomalies
    if (current.delta_summary) {
      const deltaAnomalies = this.checkDeltaSummary(clientId, current.delta_summary);
      anomalies.push(...deltaAnomalies);
    }

    // Store detected anomalies
    for (const anomaly of anomalies) {
      await this.storeAnomaly(anomaly);
    }

    return anomalies;
  }

  /**
   * Check for health score anomalies
   */
  private checkHealthScore(
    clientId: string,
    previous: number,
    current: number
  ): Anomaly | null {
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    // Check for significant drop
    if (changePercent <= -this.thresholds.health_score_drop) {
      const severity = this.getSeverityForDrop(Math.abs(changePercent));
      return {
        anomaly_id: crypto.randomUUID(),
        client_id: clientId,
        anomaly_type: "HEALTH_SCORE_DROP",
        severity,
        detected_at: new Date().toISOString(),
        metric_name: "Health Score",
        previous_value: previous,
        current_value: current,
        change_percent: changePercent,
        threshold_exceeded: this.thresholds.health_score_drop,
        message: `Health score dropped ${Math.abs(changePercent).toFixed(1)}% from ${previous} to ${current}`,
        recommendations: this.getHealthScoreDropRecommendations(changePercent),
        acknowledged: false,
      };
    }

    // Check for significant spike (unusual, investigate)
    if (changePercent >= this.thresholds.health_score_spike) {
      return {
        anomaly_id: crypto.randomUUID(),
        client_id: clientId,
        anomaly_type: "HEALTH_SCORE_SPIKE",
        severity: "LOW",
        detected_at: new Date().toISOString(),
        metric_name: "Health Score",
        previous_value: previous,
        current_value: current,
        change_percent: changePercent,
        threshold_exceeded: this.thresholds.health_score_spike,
        message: `Health score increased ${changePercent.toFixed(1)}% from ${previous} to ${current}`,
        recommendations: [
          "Investigate cause of sudden improvement",
          "Document changes made for future reference",
          "Monitor to ensure improvement is sustained",
        ],
        acknowledged: false,
      };
    }

    return null;
  }

  /**
   * Check for backlink anomalies
   */
  private checkBacklinks(
    clientId: string,
    previous: number,
    current: number
  ): Anomaly | null {
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    // Lost backlinks
    if (changePercent <= -this.thresholds.backlinks_lost_percent) {
      return {
        anomaly_id: crypto.randomUUID(),
        client_id: clientId,
        anomaly_type: "BACKLINKS_LOST",
        severity: this.getSeverityForDrop(Math.abs(changePercent)),
        detected_at: new Date().toISOString(),
        metric_name: "Backlink Score",
        previous_value: previous,
        current_value: current,
        change_percent: changePercent,
        threshold_exceeded: this.thresholds.backlinks_lost_percent,
        message: `Backlink score dropped ${Math.abs(changePercent).toFixed(1)}%`,
        recommendations: [
          "Review lost referring domains",
          "Check if important backlinks were removed",
          "Investigate if site was linked from penalized domains",
          "Consider outreach to recover lost links",
        ],
        acknowledged: false,
      };
    }

    // Sudden spike (could indicate spam attack)
    if (changePercent >= this.thresholds.backlinks_spike_percent) {
      return {
        anomaly_id: crypto.randomUUID(),
        client_id: clientId,
        anomaly_type: "BACKLINKS_SPIKE",
        severity: "HIGH",
        detected_at: new Date().toISOString(),
        metric_name: "Backlink Score",
        previous_value: previous,
        current_value: current,
        change_percent: changePercent,
        threshold_exceeded: this.thresholds.backlinks_spike_percent,
        message: `Backlink score spiked ${changePercent.toFixed(1)}% - investigate immediately`,
        recommendations: [
          "Review new backlinks for spam/toxic sources",
          "Check if competitor is running negative SEO campaign",
          "Prepare disavow file if necessary",
          "Monitor for further unusual activity",
        ],
        acknowledged: false,
      };
    }

    return null;
  }

  /**
   * Check delta summary for additional anomalies
   */
  private checkDeltaSummary(
    clientId: string,
    deltaSummary: Record<string, any>
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Check for significant keyword losses
    if (deltaSummary.keywords_lost > 5) {
      anomalies.push({
        anomaly_id: crypto.randomUUID(),
        client_id: clientId,
        anomaly_type: "POSITION_DROP",
        severity: deltaSummary.keywords_lost > 10 ? "HIGH" : "MEDIUM",
        detected_at: new Date().toISOString(),
        metric_name: "Keywords Lost",
        previous_value: 0,
        current_value: deltaSummary.keywords_lost,
        change_percent: 100,
        threshold_exceeded: 5,
        message: `Lost rankings for ${deltaSummary.keywords_lost} keywords`,
        recommendations: [
          "Review content quality on affected pages",
          "Check for technical SEO issues",
          "Analyze competitor content for those keywords",
          "Consider content refresh or expansion",
        ],
        acknowledged: false,
      });
    }

    return anomalies;
  }

  /**
   * Get severity based on percentage drop
   */
  private getSeverityForDrop(percent: number): Severity {
    if (percent >= 50) {
return "CRITICAL";
}
    if (percent >= 30) {
return "HIGH";
}
    if (percent >= 20) {
return "MEDIUM";
}
    return "LOW";
  }

  /**
   * Get recommendations for health score drop
   */
  private getHealthScoreDropRecommendations(changePercent: number): string[] {
    const recommendations = [
      "Run a full technical SEO audit",
      "Check for recent algorithm updates",
      "Review recent site changes",
    ];

    if (Math.abs(changePercent) >= 30) {
      recommendations.push(
        "Check for manual penalties in Search Console",
        "Review server logs for crawl issues",
        "Consider emergency technical review"
      );
    }

    return recommendations;
  }

  /**
   * Store anomaly in database
   */
  private async storeAnomaly(anomaly: Anomaly): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase.from("seo_anomalies").insert({
      anomaly_id: anomaly.anomaly_id,
      client_id: anomaly.client_id,
      anomaly_type: anomaly.anomaly_type,
      severity: anomaly.severity,
      detected_at: anomaly.detected_at,
      metric_name: anomaly.metric_name,
      previous_value: anomaly.previous_value,
      current_value: anomaly.current_value,
      change_percent: anomaly.change_percent,
      threshold_exceeded: anomaly.threshold_exceeded,
      message: anomaly.message,
      recommendations: anomaly.recommendations,
      acknowledged: false,
    });

    if (error) {
      console.error("[AnomalyDetector] Failed to store anomaly:", error);
    }
  }

  /**
   * Get unacknowledged anomalies for a client
   */
  async getUnacknowledgedAnomalies(clientId: string): Promise<Anomaly[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("seo_anomalies")
      .select("*")
      .eq("client_id", clientId)
      .eq("acknowledged", false)
      .order("detected_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get anomalies: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Acknowledge an anomaly
   */
  async acknowledgeAnomaly(anomalyId: string, userId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from("seo_anomalies")
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("anomaly_id", anomalyId);

    if (error) {
      throw new Error(`Failed to acknowledge anomaly: ${error.message}`);
    }
  }

  /**
   * Get anomaly history for a client
   */
  async getAnomalyHistory(
    clientId: string,
    days: number = 30
  ): Promise<Anomaly[]> {
    const supabase = await getSupabaseServer();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("seo_anomalies")
      .select("*")
      .eq("client_id", clientId)
      .gte("detected_at", startDate.toISOString())
      .order("detected_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get anomaly history: ${error.message}`);
    }

    return data || [];
  }
}

export default AnomalyDetector;
