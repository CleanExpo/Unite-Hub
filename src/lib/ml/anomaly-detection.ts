/**
 * Anomaly Detection Engine
 * Phase 6 Week 2 - Statistical and contextual anomaly detection
 *
 * Detects anomalies in alert data using:
 * 1. Statistical methods (Z-score, isolation)
 * 2. Contextual analysis (sudden changes, pattern breaks)
 * 3. Composite scoring for decision confidence
 */

export interface AnomalyDataPoint {
  timestamp: number;
  value: number;
  type: string;
  context?: Record<string, any>;
}

export interface StatisticalMetrics {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
}

export interface DetectedAnomaly {
  id: string;
  timestamp: number;
  value: number;
  type: string;
  statisticalScore: number; // 0-1: Z-score magnitude
  contextualScore: number; // 0-1: Deviation from context
  compositeScore: number; // 0-1: Final anomaly score
  confidence: number; // 0-1: Confidence in detection
  anomalyType:
    | "outlier"
    | "sudden_change"
    | "pattern_break"
    | "contextual"
    | "combined";
  severity: "low" | "medium" | "high" | "critical";
  explanation: string;
  relatedPoints: AnomalyDataPoint[];
}

export class AnomalyDetectionEngine {
  private zScoreThreshold: number = 3.0; // Standard deviation threshold
  private changeThreshold: number = 0.5; // 50% change for sudden_change
  private contextualThreshold: number = 2.0; // Contextual Z-score threshold
  private minDataPoints: number = 5; // Minimum points for stats

  /**
   * Detect anomalies in data using statistical and contextual methods
   */
  detectAnomalies(dataPoints: AnomalyDataPoint[]): DetectedAnomaly[] {
    if (dataPoints.length < this.minDataPoints) {
      return [];
    }

    const sorted = this.sortByTimestamp(dataPoints);
    const metrics = this.calculateMetrics(sorted);
    const anomalies: DetectedAnomaly[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const point = sorted[i];
      const previousPoint = i > 0 ? sorted[i - 1] : null;

      // 1. Statistical anomaly detection (Z-score)
      const zScore = this.calculateZScore(point.value, metrics);
      const isStatisticalAnomaly = Math.abs(zScore) > this.zScoreThreshold;

      // 2. Sudden change detection
      const changePercent = previousPoint
        ? Math.abs((point.value - previousPoint.value) / previousPoint.value)
        : 0;
      const isSuddenChange = changePercent > this.changeThreshold;

      // 3. Pattern break detection (deviation from trend)
      const isPatternBreak = this.isPatternBreak(sorted, i, metrics);

      // 4. Contextual anomaly detection
      const contextualScore = this.calculateContextualScore(point, sorted, i);
      const isContextualAnomaly =
        contextualScore > this.contextualThreshold / 3;

      // 5. Composite scoring
      const anomalyScores = {
        statistical: isStatisticalAnomaly ? Math.min(1, Math.abs(zScore) / 5) : 0,
        sudden: isSuddenChange ? Math.min(1, changePercent / 2) : 0,
        pattern: isPatternBreak ? 0.8 : 0,
        contextual: contextualScore / 3,
      };

      const compositeScore =
        (anomalyScores.statistical +
          anomalyScores.sudden +
          anomalyScores.pattern +
          anomalyScores.contextual) /
        4;

      // Only report significant anomalies
      if (compositeScore > 0.3) {
        const anomaly = this.createAnomaly(
          point,
          metrics,
          compositeScore,
          anomalyScores,
          sorted,
          i
        );
        anomalies.push(anomaly);
      }
    }

    return anomalies.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  /**
   * Calculate statistical metrics from data
   */
  private calculateMetrics(dataPoints: AnomalyDataPoint[]): StatisticalMetrics {
    const values = dataPoints.map((p) => p.value).sort((a, b) => a - b);

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    const median =
      values.length % 2 === 0
        ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
        : values[Math.floor(values.length / 2)];

    const q1Values = values.slice(0, Math.floor(values.length / 4));
    const q3Values = values.slice(Math.ceil((values.length * 3) / 4));

    const q1 =
      q1Values.length > 0
        ? q1Values.reduce((a, b) => a + b, 0) / q1Values.length
        : values[0];
    const q3 =
      q3Values.length > 0
        ? q3Values.reduce((a, b) => a + b, 0) / q3Values.length
        : values[values.length - 1];

    const iqr = q3 - q1;

    return {
      mean,
      stdDev,
      min: values[0],
      max: values[values.length - 1],
      median,
      q1,
      q3,
      iqr: Math.max(iqr, 0.1), // Avoid zero IQR
    };
  }

  /**
   * Calculate Z-score for a value
   */
  private calculateZScore(value: number, metrics: StatisticalMetrics): number {
    if (metrics.stdDev === 0) {
return 0;
}
    return (value - metrics.mean) / metrics.stdDev;
  }

  /**
   * Check for pattern break (deviation from trend)
   */
  private isPatternBreak(
    dataPoints: AnomalyDataPoint[],
    currentIndex: number,
    metrics: StatisticalMetrics
  ): boolean {
    if (currentIndex < 3) {
return false;
}

    // Calculate recent trend
    const window = Math.min(5, currentIndex);
    const recentPoints = dataPoints.slice(currentIndex - window, currentIndex);

    const recentAvg =
      recentPoints.reduce((sum, p) => sum + p.value, 0) / recentPoints.length;
    const currentValue = dataPoints[currentIndex].value;

    // If deviation from recent trend > 2 std deviations, it's a pattern break
    const deviation = Math.abs(currentValue - recentAvg);
    return deviation > metrics.stdDev * 2;
  }

  /**
   * Calculate contextual anomaly score based on context
   */
  private calculateContextualScore(
    point: AnomalyDataPoint,
    allPoints: AnomalyDataPoint[],
    currentIndex: number
  ): number {
    if (!point.context) {
return 0;
}

    const context = point.context;
    let contextScore = 0;
    let contextFactors = 0;

    // Time-based context
    if (context.expectedHourOfDay !== undefined) {
      const hour = new Date(point.timestamp).getHours();
      if (hour !== context.expectedHourOfDay) {
        contextScore += 0.5;
      }
      contextFactors++;
    }

    // Day-based context
    if (context.expectedDay !== undefined) {
      const day = new Date(point.timestamp).getDay();
      if (day !== context.expectedDay) {
        contextScore += 0.5;
      }
      contextFactors++;
    }

    // Value context
    if (context.expectedRange) {
      const [min, max] = context.expectedRange;
      if (point.value < min || point.value > max) {
        const deviation = Math.min(
          Math.abs(point.value - min),
          Math.abs(point.value - max)
        );
        contextScore += Math.min(1, deviation / (max - min));
      }
      contextFactors++;
    }

    // Type context
    if (context.allowedTypes && context.allowedTypes.length > 0) {
      if (!context.allowedTypes.includes(point.type)) {
        contextScore += 1;
      }
      contextFactors++;
    }

    return contextFactors > 0 ? contextScore / contextFactors : 0;
  }

  /**
   * Create anomaly object with all details
   */
  private createAnomaly(
    point: AnomalyDataPoint,
    metrics: StatisticalMetrics,
    compositeScore: number,
    anomalyScores: Record<string, number>,
    allPoints: AnomalyDataPoint[],
    currentIndex: number
  ): DetectedAnomaly {
    const zScore = this.calculateZScore(point.value, metrics);

    // Determine anomaly type
    let anomalyType: DetectedAnomaly["anomalyType"] = "combined";
    if (anomalyScores.statistical > anomalyScores.sudden) {
      anomalyType = "outlier";
    } else if (anomalyScores.sudden > anomalyScores.statistical) {
      anomalyType = "sudden_change";
    } else if (anomalyScores.pattern > 0.5) {
      anomalyType = "pattern_break";
    } else if (anomalyScores.contextual > 0.3) {
      anomalyType = "contextual";
    }

    // Determine severity
    const severity: DetectedAnomaly["severity"] =
      compositeScore > 0.8
        ? "critical"
        : compositeScore > 0.6
        ? "high"
        : compositeScore > 0.4
        ? "medium"
        : "low";

    // Find related points (nearby anomalies)
    const window = 3;
    const relatedPoints = allPoints.slice(
      Math.max(0, currentIndex - window),
      Math.min(allPoints.length, currentIndex + window + 1)
    );

    // Generate explanation
    const explanation = this.generateExplanation(
      point,
      anomalyType,
      compositeScore,
      metrics,
      zScore
    );

    return {
      id: `anomaly_${point.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: point.timestamp,
      value: point.value,
      type: point.type,
      statisticalScore: anomalyScores.statistical,
      contextualScore: anomalyScores.contextual,
      compositeScore,
      confidence: Math.min(1, compositeScore * 1.2), // Slightly higher than composite
      anomalyType,
      severity,
      explanation,
      relatedPoints,
    };
  }

  /**
   * Generate human-readable anomaly explanation
   */
  private generateExplanation(
    point: AnomalyDataPoint,
    type: DetectedAnomaly["anomalyType"],
    score: number,
    metrics: StatisticalMetrics,
    zScore: number
  ): string {
    const scorePercent = (score * 100).toFixed(0);

    switch (type) {
      case "outlier":
        return `Statistical outlier detected (Z-score: ${zScore.toFixed(2)}). Value ${point.value} is ${Math.abs(zScore).toFixed(1)} standard deviations from mean (${metrics.mean.toFixed(1)}).`;
      case "sudden_change":
        return `Sudden change detected (${scorePercent}% anomaly confidence). Value spiked or dropped significantly from trend.`;
      case "pattern_break":
        return `Pattern deviation detected (${scorePercent}% confidence). Current behavior breaks established pattern.`;
      case "contextual":
        return `Contextual anomaly detected (${scorePercent}% confidence). Value occurs in unexpected context.`;
      default:
        return `Anomaly detected (${scorePercent}% confidence) combining multiple detection methods.`;
    }
  }

  /**
   * Filter anomalies by severity threshold
   */
  filterBySeverity(
    anomalies: DetectedAnomaly[],
    minSeverity: "low" | "medium" | "high" | "critical"
  ): DetectedAnomaly[] {
    const severityRanking: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };

    const threshold = severityRanking[minSeverity];

    return anomalies.filter((a) => severityRanking[a.severity] >= threshold);
  }

  /**
   * Filter anomalies by confidence threshold
   */
  filterByConfidence(
    anomalies: DetectedAnomaly[],
    minConfidence: number
  ): DetectedAnomaly[] {
    return anomalies.filter((a) => a.confidence >= minConfidence);
  }

  /**
   * Calculate anomaly density in data
   */
  calculateAnomalyDensity(
    dataPoints: AnomalyDataPoint[],
    anomalies: DetectedAnomaly[]
  ): number {
    if (dataPoints.length === 0) {
return 0;
}
    return anomalies.length / dataPoints.length;
  }

  /**
   * Group anomalies by type
   */
  groupByType(anomalies: DetectedAnomaly[]): Record<string, DetectedAnomaly[]> {
    const grouped: Record<string, DetectedAnomaly[]> = {};

    anomalies.forEach((anomaly) => {
      if (!grouped[anomaly.anomalyType]) {
        grouped[anomaly.anomalyType] = [];
      }
      grouped[anomaly.anomalyType].push(anomaly);
    });

    return grouped;
  }

  /**
   * Sort points by timestamp
   */
  private sortByTimestamp(points: AnomalyDataPoint[]): AnomalyDataPoint[] {
    return [...points].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Set Z-score threshold
   */
  setZScoreThreshold(threshold: number): void {
    if (threshold > 0) {
      this.zScoreThreshold = threshold;
    }
  }

  /**
   * Get current Z-score threshold
   */
  getZScoreThreshold(): number {
    return this.zScoreThreshold;
  }

  /**
   * Set change threshold for sudden_change detection
   */
  setChangeThreshold(threshold: number): void {
    if (threshold > 0 && threshold <= 1) {
      this.changeThreshold = threshold;
    }
  }

  /**
   * Get current change threshold
   */
  getChangeThreshold(): number {
    return this.changeThreshold;
  }
}

// Singleton instance
let instance: AnomalyDetectionEngine | null = null;

export function getAnomalyDetectionEngine(): AnomalyDetectionEngine {
  if (!instance) {
    instance = new AnomalyDetectionEngine();
  }
  return instance;
}
