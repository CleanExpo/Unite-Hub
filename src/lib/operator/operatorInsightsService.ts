/**
 * Operator Insights Service - Phase 10 Week 5-6
 *
 * Aggregates operator performance, detects biases, and generates recommendations
 * for autonomy tuning based on human feedback intelligence.
 */

import { getSupabaseServer } from "@/lib/supabase";

// Types
export interface ReviewerScore {
  id: string;
  operator_id: string;
  organization_id: string;
  accuracy_score: number;
  speed_score: number;
  consistency_score: number;
  impact_score: number;
  reliability_score: number;
  total_reviews: number;
  correct_decisions: number;
  overturned_decisions: number;
  avg_review_time_seconds: number | null;
  weighted_accuracy: number;
  last_review_at: string | null;
}

export interface AccuracyRecord {
  id: string;
  operator_id: string;
  organization_id: string;
  queue_item_id: string | null;
  proposal_id: string | null;
  decision: "APPROVE" | "REJECT" | "DEFER";
  decision_at: string;
  outcome: "CORRECT" | "OVERTURNED" | "PENDING" | "INCONCLUSIVE" | null;
  outcome_at: string | null;
  outcome_reason: string | null;
  review_time_seconds: number | null;
  confidence_level: number | null;
  decay_weight: number;
}

export interface BiasSignal {
  id: string;
  operator_id: string;
  organization_id: string;
  bias_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  evidence: Record<string, unknown>;
  affected_domains: string[];
  sample_decisions: string[];
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
  detected_at: string;
}

export interface FeedbackEvent {
  id: string;
  organization_id: string;
  event_type: string;
  actor_id: string | null;
  target_operator_id: string | null;
  queue_item_id: string | null;
  proposal_id: string | null;
  metadata: Record<string, unknown>;
  score_delta: Record<string, number> | null;
  created_at: string;
}

export interface AutonomyTuningRecommendation {
  id: string;
  organization_id: string;
  domain: string;
  previous_level: string;
  new_level: string;
  reason: string;
  confidence: number;
  status: "RECOMMENDED" | "APPLIED" | "REJECTED";
}

// Constants
const DECAY_FACTOR = 0.95; // 5% decay per day
const BIAS_DETECTION_THRESHOLD = 0.7;
const MIN_REVIEWS_FOR_BIAS = 10;

export class OperatorInsightsService {
  /**
   * Get reviewer scores for an operator
   */
  async getReviewerScores(
    operatorId: string,
    organizationId: string
  ): Promise<ReviewerScore | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("reviewer_scores")
      .select("*")
      .eq("operator_id", operatorId)
      .eq("organization_id", organizationId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
return null;
}
      throw new Error(`Failed to get reviewer scores: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all reviewer scores for an organization
   */
  async getOrganizationScores(organizationId: string): Promise<ReviewerScore[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("reviewer_scores")
      .select("*")
      .eq("organization_id", organizationId)
      .order("reliability_score", { ascending: false });

    if (error) {
      throw new Error(`Failed to get organization scores: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Record a review decision for accuracy tracking
   */
  async recordDecision(
    operatorId: string,
    organizationId: string,
    decision: "APPROVE" | "REJECT" | "DEFER",
    queueItemId?: string,
    proposalId?: string,
    reviewTimeSeconds?: number,
    confidenceLevel?: number
  ): Promise<AccuracyRecord> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("accuracy_history")
      .insert({
        operator_id: operatorId,
        organization_id: organizationId,
        decision,
        queue_item_id: queueItemId,
        proposal_id: proposalId,
        review_time_seconds: reviewTimeSeconds,
        confidence_level: confidenceLevel,
        outcome: "PENDING",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record decision: ${error.message}`);
    }

    // Log feedback event
    await this.logFeedbackEvent(organizationId, "REVIEW_SUBMITTED", operatorId, {
      decision,
      queue_item_id: queueItemId,
      proposal_id: proposalId,
    });

    return data;
  }

  /**
   * Record the outcome of a decision
   */
  async recordOutcome(
    recordId: string,
    outcome: "CORRECT" | "OVERTURNED" | "INCONCLUSIVE",
    reason?: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get the record first
    const { data: record, error: fetchError } = await supabase
      .from("accuracy_history")
      .select("operator_id, organization_id, decision")
      .eq("id", recordId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch record: ${fetchError.message}`);
    }

    // Update the outcome
    const { error: updateError } = await supabase
      .from("accuracy_history")
      .update({
        outcome,
        outcome_at: new Date().toISOString(),
        outcome_reason: reason,
      })
      .eq("id", recordId);

    if (updateError) {
      throw new Error(`Failed to record outcome: ${updateError.message}`);
    }

    // Log event
    await this.logFeedbackEvent(
      record.organization_id,
      outcome === "OVERTURNED" ? "DECISION_OVERTURNED" : "OUTCOME_RECORDED",
      undefined,
      {
        target_operator_id: record.operator_id,
        outcome,
        reason,
      },
      record.operator_id
    );

    // Update reviewer scores
    await this.updateReviewerScores(record.operator_id, record.organization_id);
  }

  /**
   * Get accuracy history for an operator
   */
  async getAccuracyHistory(
    operatorId: string,
    organizationId: string,
    limit: number = 50
  ): Promise<AccuracyRecord[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("accuracy_history")
      .select("*")
      .eq("operator_id", operatorId)
      .eq("organization_id", organizationId)
      .order("decision_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get accuracy history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update reviewer scores with decay-weighted accuracy
   */
  async updateReviewerScores(
    operatorId: string,
    organizationId: string
  ): Promise<ReviewerScore> {
    const supabase = await getSupabaseServer();

    // Get history
    const history = await this.getAccuracyHistory(operatorId, organizationId, 1000);

    if (history.length === 0) {
      // Create default score
      const { data, error } = await supabase
        .from("reviewer_scores")
        .upsert({
          operator_id: operatorId,
          organization_id: organizationId,
          accuracy_score: 50,
          speed_score: 50,
          consistency_score: 50,
          impact_score: 50,
          reliability_score: 50,
          weighted_accuracy: 50,
          total_reviews: 0,
          correct_decisions: 0,
          overturned_decisions: 0,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create default score: ${error.message}`);
      }
      return data;
    }

    // Calculate metrics
    const now = new Date();
    let totalWeight = 0;
    let correctWeight = 0;
    let totalReviews = 0;
    let correctDecisions = 0;
    let overturnedDecisions = 0;
    let totalReviewTime = 0;
    let reviewTimeCount = 0;

    for (const record of history) {
      if (record.outcome && record.outcome !== "PENDING") {
        const daysSince = (now.getTime() - new Date(record.decision_at).getTime()) / (1000 * 60 * 60 * 24);
        const weight = Math.pow(DECAY_FACTOR, daysSince);

        totalWeight += weight;
        totalReviews++;

        if (record.outcome === "CORRECT") {
          correctWeight += weight;
          correctDecisions++;
        } else if (record.outcome === "OVERTURNED") {
          overturnedDecisions++;
        }

        if (record.review_time_seconds) {
          totalReviewTime += record.review_time_seconds;
          reviewTimeCount++;
        }
      }
    }

    // Calculate scores
    const accuracy = totalReviews > 0 ? (correctDecisions / totalReviews) * 100 : 50;
    const weightedAccuracy = totalWeight > 0 ? (correctWeight / totalWeight) * 100 : 50;

    // Speed score (inverse of average time, capped)
    const avgTime = reviewTimeCount > 0 ? totalReviewTime / reviewTimeCount : 300;
    const speedScore = Math.max(0, Math.min(100, 100 - (avgTime - 60) / 5));

    // Consistency score (low variance in decision time)
    const consistencyScore = await this.calculateConsistencyScore(operatorId, organizationId);

    // Impact score (how often their decisions lead to good outcomes)
    const impactScore = correctDecisions > 0 ? Math.min(100, accuracy * 1.1) : 50;

    // Composite reliability
    const reliabilityScore =
      weightedAccuracy * 0.4 +
      speedScore * 0.2 +
      consistencyScore * 0.2 +
      impactScore * 0.2;

    // Update scores
    const { data, error } = await supabase
      .from("reviewer_scores")
      .upsert({
        operator_id: operatorId,
        organization_id: organizationId,
        accuracy_score: accuracy,
        speed_score: speedScore,
        consistency_score: consistencyScore,
        impact_score: impactScore,
        reliability_score: reliabilityScore,
        weighted_accuracy: weightedAccuracy,
        total_reviews: totalReviews,
        correct_decisions: correctDecisions,
        overturned_decisions: overturnedDecisions,
        avg_review_time_seconds: avgTime,
        last_review_at: history[0]?.decision_at,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update scores: ${error.message}`);
    }

    // Log event
    await this.logFeedbackEvent(organizationId, "SCORE_UPDATED", undefined, {
      target_operator_id: operatorId,
      reliability_score: reliabilityScore,
      accuracy_score: accuracy,
    }, operatorId);

    return data;
  }

  /**
   * Calculate consistency score based on decision variance
   */
  private async calculateConsistencyScore(
    operatorId: string,
    organizationId: string
  ): Promise<number> {
    const supabase = await getSupabaseServer();

    // Get recent decisions with similar contexts
    const { data, error } = await supabase
      .from("accuracy_history")
      .select("decision, review_time_seconds")
      .eq("operator_id", operatorId)
      .eq("organization_id", organizationId)
      .not("review_time_seconds", "is", null)
      .order("decision_at", { ascending: false })
      .limit(50);

    if (error || !data || data.length < 5) {
      return 50; // Default
    }

    // Calculate variance in review times
    const times = data.map((d) => d.review_time_seconds!);
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = higher consistency
    // CV (coefficient of variation) of 0.5 = 50 score, lower is better
    const cv = stdDev / mean;
    return Math.max(0, Math.min(100, 100 - cv * 100));
  }

  /**
   * Detect biases in operator review patterns
   */
  async detectBiases(
    operatorId: string,
    organizationId: string
  ): Promise<BiasSignal[]> {
    const supabase = await getSupabaseServer();
    const detectedBiases: BiasSignal[] = [];

    // Get all history
    const history = await this.getAccuracyHistory(operatorId, organizationId, 1000);

    if (history.length < MIN_REVIEWS_FOR_BIAS) {
      return [];
    }

    // Check for approval/rejection bias
    const approvals = history.filter((h) => h.decision === "APPROVE").length;
    const rejections = history.filter((h) => h.decision === "REJECT").length;
    const total = approvals + rejections;

    if (total > 0) {
      const approvalRate = approvals / total;

      if (approvalRate > 0.85) {
        const bias = await this.createBiasSignal(
          operatorId,
          organizationId,
          "APPROVAL_BIAS",
          approvalRate > 0.95 ? "HIGH" : "MEDIUM",
          approvalRate,
          {
            approval_rate: approvalRate,
            total_decisions: total,
            threshold: 0.85,
          }
        );
        detectedBiases.push(bias);
      } else if (approvalRate < 0.15) {
        const bias = await this.createBiasSignal(
          operatorId,
          organizationId,
          "REJECTION_BIAS",
          approvalRate < 0.05 ? "HIGH" : "MEDIUM",
          1 - approvalRate,
          {
            rejection_rate: 1 - approvalRate,
            total_decisions: total,
            threshold: 0.85,
          }
        );
        detectedBiases.push(bias);
      }
    }

    // Check for speed bias (rushing)
    const avgTime = history
      .filter((h) => h.review_time_seconds)
      .reduce((sum, h) => sum + h.review_time_seconds!, 0) /
      history.filter((h) => h.review_time_seconds).length;

    if (avgTime < 30) {
      // Less than 30 seconds average
      const bias = await this.createBiasSignal(
        operatorId,
        organizationId,
        "SPEED_BIAS",
        avgTime < 15 ? "HIGH" : "MEDIUM",
        1 - avgTime / 60,
        {
          avg_review_time: avgTime,
          threshold_seconds: 30,
        }
      );
      detectedBiases.push(bias);
    }

    // Check for inconsistent weighting (high variance in similar decisions)
    const consistencyScore = await this.calculateConsistencyScore(operatorId, organizationId);
    if (consistencyScore < 30) {
      const bias = await this.createBiasSignal(
        operatorId,
        organizationId,
        "INCONSISTENT_WEIGHTING",
        consistencyScore < 15 ? "HIGH" : "MEDIUM",
        (100 - consistencyScore) / 100,
        {
          consistency_score: consistencyScore,
          threshold: 30,
        }
      );
      detectedBiases.push(bias);
    }

    return detectedBiases;
  }

  /**
   * Create a bias signal record
   */
  private async createBiasSignal(
    operatorId: string,
    organizationId: string,
    biasType: string,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    confidence: number,
    evidence: Record<string, unknown>,
    affectedDomains: string[] = [],
    sampleDecisions: string[] = []
  ): Promise<BiasSignal> {
    const supabase = await getSupabaseServer();

    // Check if similar active bias exists
    const { data: existing } = await supabase
      .from("bias_signals")
      .select("id")
      .eq("operator_id", operatorId)
      .eq("organization_id", organizationId)
      .eq("bias_type", biasType)
      .eq("status", "ACTIVE")
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("bias_signals")
        .update({
          severity,
          confidence,
          evidence,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update bias signal: ${error.message}`);
      }
      return data;
    }

    // Create new
    const { data, error } = await supabase
      .from("bias_signals")
      .insert({
        operator_id: operatorId,
        organization_id: organizationId,
        bias_type: biasType,
        severity,
        confidence,
        evidence,
        affected_domains: affectedDomains,
        sample_decisions: sampleDecisions,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create bias signal: ${error.message}`);
    }

    // Log event
    await this.logFeedbackEvent(organizationId, "BIAS_DETECTED", undefined, {
      target_operator_id: operatorId,
      bias_type: biasType,
      severity,
      confidence,
    }, operatorId);

    return data;
  }

  /**
   * Get active biases for an operator
   */
  async getActiveBiases(
    operatorId: string,
    organizationId: string
  ): Promise<BiasSignal[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("bias_signals")
      .select("*")
      .eq("operator_id", operatorId)
      .eq("organization_id", organizationId)
      .eq("status", "ACTIVE")
      .order("severity", { ascending: false });

    if (error) {
      throw new Error(`Failed to get biases: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all biases for an organization
   */
  async getOrganizationBiases(organizationId: string): Promise<BiasSignal[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("bias_signals")
      .select("*")
      .eq("organization_id", organizationId)
      .in("status", ["ACTIVE", "ACKNOWLEDGED"])
      .order("severity", { ascending: false });

    if (error) {
      throw new Error(`Failed to get organization biases: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Acknowledge a bias signal
   */
  async acknowledgeBias(
    biasId: string,
    acknowledgedBy: string
  ): Promise<BiasSignal> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("bias_signals")
      .update({
        status: "ACKNOWLEDGED",
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", biasId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to acknowledge bias: ${error.message}`);
    }

    return data;
  }

  /**
   * Resolve a bias signal
   */
  async resolveBias(
    biasId: string,
    resolution: string
  ): Promise<BiasSignal> {
    const supabase = await getSupabaseServer();

    const { data: bias, error: fetchError } = await supabase
      .from("bias_signals")
      .select("operator_id, organization_id")
      .eq("id", biasId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch bias: ${fetchError.message}`);
    }

    const { data, error } = await supabase
      .from("bias_signals")
      .update({
        status: "RESOLVED",
        resolution,
        updated_at: new Date().toISOString(),
      })
      .eq("id", biasId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve bias: ${error.message}`);
    }

    // Log event
    await this.logFeedbackEvent(bias.organization_id, "BIAS_RESOLVED", undefined, {
      bias_id: biasId,
      resolution,
    }, bias.operator_id);

    return data;
  }

  /**
   * Log a feedback event
   */
  async logFeedbackEvent(
    organizationId: string,
    eventType: string,
    actorId?: string,
    metadata: Record<string, unknown> = {},
    targetOperatorId?: string,
    queueItemId?: string,
    proposalId?: string,
    scoreDelta?: Record<string, number>
  ): Promise<FeedbackEvent> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("feedback_events")
      .insert({
        organization_id: organizationId,
        event_type: eventType,
        actor_id: actorId,
        target_operator_id: targetOperatorId,
        queue_item_id: queueItemId,
        proposal_id: proposalId,
        metadata,
        score_delta: scoreDelta,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log feedback event: ${error.message}`);
    }

    return data;
  }

  /**
   * Get feedback events for an organization
   */
  async getFeedbackEvents(
    organizationId: string,
    limit: number = 100
  ): Promise<FeedbackEvent[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("feedback_events")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get feedback events: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Generate autonomy tuning recommendations based on feedback
   */
  async generateTuningRecommendations(
    organizationId: string
  ): Promise<AutonomyTuningRecommendation[]> {
    const supabase = await getSupabaseServer();
    const recommendations: AutonomyTuningRecommendation[] = [];

    // Get organization scores
    const scores = await this.getOrganizationScores(organizationId);

    // Get organization biases
    const biases = await this.getOrganizationBiases(organizationId);

    // Analyze patterns
    const avgReliability =
      scores.reduce((sum, s) => sum + s.reliability_score, 0) / scores.length || 50;

    // High reliability = recommend increasing autonomy
    if (avgReliability > 80 && scores.length >= 3) {
      const { data, error } = await supabase
        .from("autonomy_tuning")
        .insert({
          organization_id: organizationId,
          domain: "GENERAL",
          previous_level: "SUPERVISED",
          new_level: "TRUSTED",
          reason: `Team reliability score of ${avgReliability.toFixed(1)}% suggests autonomous execution is safe for low-risk tasks.`,
          confidence: Math.min(avgReliability / 100, 0.95),
        })
        .select()
        .single();

      if (!error && data) {
        recommendations.push(data);
      }
    }

    // Critical biases = recommend decreasing autonomy
    const criticalBiases = biases.filter((b) => b.severity === "CRITICAL");
    if (criticalBiases.length > 0) {
      const { data, error } = await supabase
        .from("autonomy_tuning")
        .insert({
          organization_id: organizationId,
          domain: "GENERAL",
          previous_level: "TRUSTED",
          new_level: "SUPERVISED",
          reason: `${criticalBiases.length} critical bias(es) detected. Recommend increased oversight.`,
          confidence: 0.9,
        })
        .select()
        .single();

      if (!error && data) {
        recommendations.push(data);
      }
    }

    // Log event
    if (recommendations.length > 0) {
      await this.logFeedbackEvent(organizationId, "RECOMMENDATION_GENERATED", undefined, {
        count: recommendations.length,
        recommendations: recommendations.map((r) => ({
          domain: r.domain,
          change: `${r.previous_level} → ${r.new_level}`,
        })),
      });
    }

    return recommendations;
  }

  /**
   * Apply a tuning recommendation
   */
  async applyTuningRecommendation(
    recommendationId: string,
    appliedBy: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from("autonomy_tuning")
      .update({
        status: "APPLIED",
        applied_at: new Date().toISOString(),
        applied_by: appliedBy,
      })
      .eq("id", recommendationId);

    if (error) {
      throw new Error(`Failed to apply recommendation: ${error.message}`);
    }
  }

  /**
   * Get pending tuning recommendations
   */
  async getPendingRecommendations(
    organizationId: string
  ): Promise<AutonomyTuningRecommendation[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("autonomy_tuning")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "RECOMMENDED")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }

    return data || [];
  }
}

export default OperatorInsightsService;
