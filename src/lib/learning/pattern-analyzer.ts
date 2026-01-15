/**
 * Pattern Analyzer
 *
 * Detects patterns and anomalies in execution data using statistical analysis.
 * Provides intelligent insights for improving agent performance and system behavior.
 *
 * Features:
 * - Pattern detection (temporal, sequential, correlation)
 * - Anomaly detection (statistical outliers)
 * - Success pattern identification
 * - Failure pattern analysis
 * - Predictive insights
 *
 * Usage:
 *   import { patternAnalyzer } from '@/lib/learning/pattern-analyzer';
 *
 *   // Detect patterns
 *   const patterns = await patternAnalyzer.detectPatterns('workspace-123');
 *
 *   // Get predictions
 *   const prediction = await patternAnalyzer.predictSuccess('email_processing', {
 *     emailLength: 1500,
 *     hasAttachments: true,
 *     timeOfDay: 'morning'
 *   });
 */

import { executionFeedback, type ExecutionRecord, type AgentId, type TaskType } from './execution-feedback';
import { performanceTracker } from './performance-tracker';

export type PatternType =
  | 'temporal' // Time-based patterns
  | 'sequential' // Order-based patterns
  | 'correlation' // Feature correlation patterns
  | 'anomaly' // Unusual behavior
  | 'success_factor' // What leads to success
  | 'failure_cause'; // What leads to failure

export interface Pattern {
  id: string;
  type: PatternType;
  confidence: number; // 0-1
  description: string;
  evidence: any[];
  actionable_insight: string;
  detected_at: number;
}

export interface TemporalPattern extends Pattern {
  type: 'temporal';
  time_window: 'hour' | 'day' | 'week';
  peak_times: string[];
  low_times: string[];
  impact: string;
}

export interface CorrelationPattern extends Pattern {
  type: 'correlation';
  feature_a: string;
  feature_b: string;
  correlation_strength: number;
  relationship: 'positive' | 'negative';
}

export interface AnomalyPattern extends Pattern {
  type: 'anomaly';
  severity: 'low' | 'medium' | 'high';
  anomaly_score: number;
  baseline_value: number;
  observed_value: number;
  deviation: number;
}

export interface SuccessPredict {
  predicted_success_rate: number;
  confidence: number;
  contributing_factors: Array<{ factor: string; weight: number; value: any }>;
  risk_factors: Array<{ factor: string; severity: string }>;
  recommendations: string[];
}

class PatternAnalyzerService {
  /**
   * Detect all patterns in execution data
   */
  async detectPatterns(
    workspaceId: string,
    options: {
      minConfidence?: number;
      limit?: number;
      types?: PatternType[];
    } = {}
  ): Promise<Pattern[]> {
    const { minConfidence = 0.6, limit = 20, types } = options;

    const patterns: Pattern[] = [];

    // Get execution history
    const history = await executionFeedback.getExecutionHistory(workspaceId, {
      limit: 500,
    });

    if (history.length < 20) {
      // Need sufficient data
      return [];
    }

    // Detect temporal patterns
    if (!types || types.includes('temporal')) {
      const temporalPatterns = this.detectTemporalPatterns(history);
      patterns.push(...temporalPatterns);
    }

    // Detect correlation patterns
    if (!types || types.includes('correlation')) {
      const correlationPatterns = this.detectCorrelationPatterns(history);
      patterns.push(...correlationPatterns);
    }

    // Detect anomalies
    if (!types || types.includes('anomaly')) {
      const anomalies = this.detectAnomalies(history);
      patterns.push(...anomalies);
    }

    // Detect success factors
    if (!types || types.includes('success_factor')) {
      const successFactors = this.detectSuccessFactors(history);
      patterns.push(...successFactors);
    }

    // Detect failure causes
    if (!types || types.includes('failure_cause')) {
      const failureCauses = this.detectFailureCauses(history);
      patterns.push(...failureCauses);
    }

    // Filter by confidence and limit
    return patterns
      .filter((p) => p.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Detect temporal patterns (time-based)
   */
  private detectTemporalPatterns(history: ExecutionRecord[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];

    // Analyze by hour of day
    const hourlyStats = new Map<number, { success: number; failure: number }>();

    history.forEach((record) => {
      const hour = new Date(record.started_at).getHours();

      if (!hourlyStats.has(hour)) {
        hourlyStats.set(hour, { success: 0, failure: 0 });
      }

      const stats = hourlyStats.get(hour)!;
      if (record.success) {
        stats.success++;
      } else {
        stats.failure++;
      }
    });

    // Find peak and low performance hours
    const hourlySuccessRates = new Map<number, number>();

    hourlyStats.forEach((stats, hour) => {
      const total = stats.success + stats.failure;
      if (total >= 3) {
        // Minimum sample size
        hourlySuccessRates.set(hour, stats.success / total);
      }
    });

    if (hourlySuccessRates.size >= 6) {
      // Need data across multiple hours
      const avgSuccessRate =
        Array.from(hourlySuccessRates.values()).reduce((sum, rate) => sum + rate, 0) /
        hourlySuccessRates.size;

      const peakHours: number[] = [];
      const lowHours: number[] = [];

      hourlySuccessRates.forEach((rate, hour) => {
        if (rate >= avgSuccessRate * 1.2) {
          peakHours.push(hour);
        } else if (rate <= avgSuccessRate * 0.8) {
          lowHours.push(hour);
        }
      });

      if (peakHours.length > 0 || lowHours.length > 0) {
        patterns.push({
          id: `temporal_hourly_${Date.now()}`,
          type: 'temporal',
          confidence: 0.75,
          description: `Performance varies by time of day`,
          evidence: Array.from(hourlySuccessRates.entries()).map(([hour, rate]) => ({
            hour,
            success_rate: rate,
          })),
          actionable_insight: peakHours.length > 0
            ? `Schedule critical operations during peak hours (${peakHours.join(', ')}:00)`
            : `Avoid scheduling during low-performance hours (${lowHours.join(', ')}:00)`,
          detected_at: Date.now(),
          time_window: 'hour',
          peak_times: peakHours.map((h) => `${h}:00`),
          low_times: lowHours.map((h) => `${h}:00`),
          impact: `${Math.round(Math.abs((Math.max(...hourlySuccessRates.values()) - Math.min(...hourlySuccessRates.values())) * 100))}% success rate variation`,
        });
      }
    }

    return patterns;
  }

  /**
   * Detect correlation patterns between features
   */
  private detectCorrelationPatterns(history: ExecutionRecord[]): CorrelationPattern[] {
    const patterns: CorrelationPattern[] = [];

    // Analyze correlation between task description length and duration
    const lengthDurationPairs: Array<{ length: number; duration: number }> = [];

    history.forEach((record) => {
      if (record.duration_ms && record.success) {
        lengthDurationPairs.push({
          length: record.task_description.length,
          duration: record.duration_ms,
        });
      }
    });

    if (lengthDurationPairs.length >= 20) {
      const correlation = this.calculateCorrelation(
        lengthDurationPairs.map((p) => p.length),
        lengthDurationPairs.map((p) => p.duration)
      );

      if (Math.abs(correlation) > 0.5) {
        patterns.push({
          id: `correlation_length_duration_${Date.now()}`,
          type: 'correlation',
          confidence: Math.abs(correlation),
          description: `Task description length ${correlation > 0 ? 'positively' : 'negatively'} correlates with execution time`,
          evidence: lengthDurationPairs.slice(0, 10),
          actionable_insight:
            correlation > 0
              ? `Longer task descriptions tend to take more time. Consider breaking down complex tasks.`
              : `Task complexity appears independent of description length.`,
          detected_at: Date.now(),
          feature_a: 'task_description_length',
          feature_b: 'execution_duration',
          correlation_strength: Math.abs(correlation),
          relationship: correlation > 0 ? 'positive' : 'negative',
        });
      }
    }

    return patterns;
  }

  /**
   * Detect anomalies in execution data
   */
  private detectAnomalies(history: ExecutionRecord[]): AnomalyPattern[] {
    const patterns: AnomalyPattern[] = [];

    // Group by agent + task type
    const groups = new Map<string, ExecutionRecord[]>();

    history.forEach((record) => {
      const key = `${record.agent_id}:${record.task_type}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    });

    // Detect duration anomalies for each group
    groups.forEach((records, key) => {
      if (records.length < 10) return;

      const durations = records
        .filter((r) => r.duration_ms !== null)
        .map((r) => r.duration_ms as number);

      if (durations.length < 10) return;

      const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const variance =
        durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
      const stdDev = Math.sqrt(variance);

      // Find outliers (>3 std dev from mean)
      const outliers = records.filter((r) => {
        if (!r.duration_ms) return false;
        const zScore = Math.abs((r.duration_ms - mean) / stdDev);
        return zScore > 3;
      });

      if (outliers.length > 0) {
        const [agentId, taskType] = key.split(':');
        const worstOutlier = outliers.reduce((max, r) =>
          (r.duration_ms || 0) > (max.duration_ms || 0) ? r : max
        );

        const anomalyScore = Math.abs(((worstOutlier.duration_ms || 0) - mean) / stdDev);

        let severity: 'low' | 'medium' | 'high';
        if (anomalyScore > 5) severity = 'high';
        else if (anomalyScore > 4) severity = 'medium';
        else severity = 'low';

        patterns.push({
          id: `anomaly_duration_${key}_${Date.now()}`,
          type: 'anomaly',
          confidence: Math.min(anomalyScore / 10, 1),
          description: `Unusual execution time detected for ${agentId} ${taskType}`,
          evidence: outliers.map((r) => ({
            id: r.id,
            duration: r.duration_ms,
            description: r.task_description.substring(0, 100),
          })),
          actionable_insight: `Investigate ${outliers.length} execution(s) with unusually ${(worstOutlier.duration_ms || 0) > mean ? 'long' : 'short'} duration`,
          detected_at: Date.now(),
          severity,
          anomaly_score: anomalyScore,
          baseline_value: mean,
          observed_value: worstOutlier.duration_ms || 0,
          deviation: anomalyScore,
        });
      }
    });

    return patterns;
  }

  /**
   * Detect success factors
   */
  private detectSuccessFactors(history: ExecutionRecord[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Analyze what leads to success
    const successfulRecords = history.filter((r) => r.success === true);
    const failedRecords = history.filter((r) => r.success === false);

    if (successfulRecords.length < 10 || failedRecords.length < 5) {
      return [];
    }

    // Check if certain agents have higher success rates
    const agentSuccessRates = new Map<AgentId, { success: number; total: number }>();

    history.forEach((record) => {
      if (!agentSuccessRates.has(record.agent_id)) {
        agentSuccessRates.set(record.agent_id, { success: 0, total: 0 });
      }

      const stats = agentSuccessRates.get(record.agent_id)!;
      stats.total++;
      if (record.success) {
        stats.success++;
      }
    });

    // Find agents with notably high success rates
    const avgSuccessRate =
      history.filter((r) => r.success).length / history.length;

    agentSuccessRates.forEach((stats, agentId) => {
      if (stats.total >= 10) {
        const successRate = stats.success / stats.total;

        if (successRate >= avgSuccessRate * 1.2 && successRate >= 0.9) {
          patterns.push({
            id: `success_factor_agent_${agentId}_${Date.now()}`,
            type: 'success_factor',
            confidence: successRate,
            description: `${agentId} demonstrates high reliability`,
            evidence: [
              {
                agent_id: agentId,
                success_rate: successRate,
                total_executions: stats.total,
              },
            ],
            actionable_insight: `Prefer routing tasks to ${agentId} when possible (${(successRate * 100).toFixed(1)}% success rate)`,
            detected_at: Date.now(),
          });
        }
      }
    });

    return patterns;
  }

  /**
   * Detect failure causes
   */
  private detectFailureCauses(history: ExecutionRecord[]): Pattern[] {
    const patterns: Pattern[] = [];

    const failedRecords = history.filter((r) => r.success === false);

    if (failedRecords.length < 5) {
      return [];
    }

    // Group failures by error type
    const errorGroups = new Map<string, ExecutionRecord[]>();

    failedRecords.forEach((record) => {
      const errorType = record.error_type || 'unknown';

      if (!errorGroups.has(errorType)) {
        errorGroups.set(errorType, []);
      }

      errorGroups.get(errorType)!.push(record);
    });

    // Identify significant failure patterns
    errorGroups.forEach((records, errorType) => {
      if (records.length >= 3) {
        // Minimum threshold
        const failureRate = records.length / history.length;

        patterns.push({
          id: `failure_cause_${errorType}_${Date.now()}`,
          type: 'failure_cause',
          confidence: Math.min(failureRate * 10, 1),
          description: `Recurring ${errorType} errors detected`,
          evidence: records.slice(0, 5).map((r) => ({
            id: r.id,
            agent_id: r.agent_id,
            task_type: r.task_type,
            error_message: r.error_message,
          })),
          actionable_insight: `Address ${errorType} errors affecting ${records.length} executions across ${new Set(records.map((r) => r.agent_id)).size} agent(s)`,
          detected_at: Date.now(),
        });
      }
    });

    return patterns;
  }

  /**
   * Predict success probability for a task
   */
  async predictSuccess(
    taskType: TaskType,
    features: Record<string, any>,
    workspaceId: string
  ): Promise<SuccessPredict> {
    // Get relevant execution history
    const history = await executionFeedback.getExecutionHistory(workspaceId, {
      taskType,
      limit: 200,
    });

    if (history.length < 20) {
      // Insufficient data
      return {
        predicted_success_rate: 0.8, // Default assumption
        confidence: 0.2,
        contributing_factors: [],
        risk_factors: [],
        recommendations: ['Insufficient historical data for accurate prediction'],
      };
    }

    const successRate = history.filter((r) => r.success).length / history.length;

    // Analyze contributing factors
    const contributingFactors: Array<{ factor: string; weight: number; value: any }> = [];
    const riskFactors: Array<{ factor: string; severity: string }> = [];

    // Check task description length
    if (features.taskDescriptionLength) {
      const avgSuccessfulLength =
        history
          .filter((r) => r.success)
          .reduce((sum, r) => sum + r.task_description.length, 0) /
        history.filter((r) => r.success).length;

      const lengthDiff = Math.abs(features.taskDescriptionLength - avgSuccessfulLength);
      const lengthImpact = 1 - Math.min(lengthDiff / avgSuccessfulLength, 0.5);

      contributingFactors.push({
        factor: 'task_description_length',
        weight: 0.2,
        value: features.taskDescriptionLength,
      });

      if (lengthImpact < 0.7) {
        riskFactors.push({
          factor: 'task_description_length',
          severity: 'medium',
        });
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (successRate < 0.8) {
      recommendations.push(`Historical success rate for ${taskType} is ${(successRate * 100).toFixed(1)}%. Consider pre-validation.`);
    }

    if (riskFactors.length > 0) {
      recommendations.push(`Detected ${riskFactors.length} risk factor(s). Review task parameters before execution.`);
    }

    // Calculate final prediction
    let predictedSuccessRate = successRate;

    contributingFactors.forEach((factor) => {
      predictedSuccessRate *= 1 + (factor.weight * (factor.value > 0 ? 0.1 : -0.1));
    });

    riskFactors.forEach(() => {
      predictedSuccessRate *= 0.9; // 10% penalty per risk factor
    });

    predictedSuccessRate = Math.max(0, Math.min(1, predictedSuccessRate));

    return {
      predicted_success_rate: predictedSuccessRate,
      confidence: Math.min(history.length / 100, 0.9),
      contributing_factors: contributingFactors,
      risk_factors: riskFactors,
      recommendations,
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;

    return numerator / denominator;
  }
}

// Singleton instance
export const patternAnalyzer = new PatternAnalyzerService();

// Export types and classes
export { PatternAnalyzerService };
