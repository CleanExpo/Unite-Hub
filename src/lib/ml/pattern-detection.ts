/**
 * ML Pattern Detection Engine
 * Phase 6 Week 2 - K-means clustering for alert pattern detection
 *
 * Detects behavioral patterns in alert data using clustering algorithms
 * and identifies significant pattern changes over time.
 */

export interface AlertDataPoint {
  timestamp: number;
  value: number;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  context?: Record<string, any>;
}

export interface Cluster {
  centroid: number;
  points: AlertDataPoint[];
  radius: number;
  density: number;
  label: string;
}

export interface DetectedPattern {
  id: string;
  name: string;
  clusterIds: string[];
  dataPoints: AlertDataPoint[];
  centroid: number;
  confidence: number; // 0-1
  occurrenceCount: number;
  averageSeverity: string;
  trend: "increasing" | "decreasing" | "stable";
  lastOccurrence: number;
  description: string;
}

export class PatternDetectionEngine {
  private k: number = 5; // Default number of clusters
  private maxIterations: number = 100;
  private tolerance: number = 0.001;

  /**
   * Detect patterns in alert data using K-means clustering
   */
  detectPatterns(
    dataPoints: AlertDataPoint[],
    k?: number
  ): DetectedPattern[] {
    if (dataPoints.length < k || k === undefined) {
      k = Math.min(5, Math.ceil(dataPoints.length / 10));
    }

    // 1. Initialize centroids (random selection from data points)
    let centroids = this.initializeCentroids(dataPoints, k);

    let previousCentroids: number[] = [];
    let iteration = 0;

    // 2. K-means iterations
    while (
      iteration < this.maxIterations &&
      !this.centroidsConverged(centroids, previousCentroids)
    ) {
      previousCentroids = [...centroids];

      // Assign points to nearest centroid
      const clusters = this.assignClusters(dataPoints, centroids);

      // Update centroids
      centroids = clusters.map((cluster) => {
        if (cluster.points.length === 0) {
return cluster.centroid;
}
        const sum = cluster.points.reduce((acc, p) => acc + p.value, 0);
        return sum / cluster.points.length;
      });

      iteration++;
    }

    // 3. Final clustering
    const clusters = this.assignClusters(dataPoints, centroids);

    // 4. Convert clusters to patterns
    const patterns = this.clustersToPatterns(
      clusters,
      dataPoints
    );

    return patterns;
  }

  /**
   * Initialize centroids by randomly selecting data points
   */
  private initializeCentroids(dataPoints: AlertDataPoint[], k: number): number[] {
    const centroids: number[] = [];
    const indices = new Set<number>();

    while (indices.size < k && indices.size < dataPoints.length) {
      const randomIndex = Math.floor(Math.random() * dataPoints.length);
      if (!indices.has(randomIndex)) {
        indices.add(randomIndex);
        centroids.push(dataPoints[randomIndex].value);
      }
    }

    return centroids;
  }

  /**
   * Assign each data point to nearest centroid
   */
  private assignClusters(
    dataPoints: AlertDataPoint[],
    centroids: number[]
  ): Cluster[] {
    const clusters: Cluster[] = centroids.map((centroid) => ({
      centroid,
      points: [],
      radius: 0,
      density: 0,
      label: `Cluster ${centroids.indexOf(centroid)}`,
    }));

    // Assign points to nearest centroid
    for (const point of dataPoints) {
      let nearestCluster = 0;
      let nearestDistance = Math.abs(point.value - centroids[0]);

      for (let i = 1; i < centroids.length; i++) {
        const distance = Math.abs(point.value - centroids[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestCluster = i;
        }
      }

      clusters[nearestCluster].points.push(point);
    }

    // Calculate cluster radius and density
    for (const cluster of clusters) {
      if (cluster.points.length > 0) {
        const distances = cluster.points.map((p) =>
          Math.abs(p.value - cluster.centroid)
        );
        cluster.radius = Math.max(...distances);
        cluster.density = cluster.points.length;
      }
    }

    return clusters;
  }

  /**
   * Check if centroids have converged
   */
  private centroidsConverged(
    centroids: number[],
    previousCentroids: number[]
  ): boolean {
    if (previousCentroids.length === 0) {
return false;
}

    const totalChange = centroids.reduce((sum, centroid, i) => {
      return sum + Math.abs(centroid - (previousCentroids[i] || 0));
    }, 0);

    return totalChange < this.tolerance;
  }

  /**
   * Convert clusters to patterns
   */
  private clustersToPatterns(
    clusters: Cluster[],
    allDataPoints: AlertDataPoint[]
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];

      if (cluster.points.length === 0) {
continue;
}

      // Calculate pattern metrics
      const confidence = Math.min(
        1,
        cluster.points.length / allDataPoints.length
      );
      const severities = cluster.points.map((p) => p.severity);
      const severityCounts: Record<string, number> = {};

      severities.forEach((s) => {
        severityCounts[s] = (severityCounts[s] || 0) + 1;
      });

      const averageSeverity = Object.entries(severityCounts).sort(
        ([, a], [, b]) => b - a
      )[0][0];

      // Detect trend (increasing/decreasing/stable)
      const trend = this.detectTrend(cluster.points);

      // Generate description
      const description = this.generateDescription(
        cluster,
        cluster.points.length,
        allDataPoints.length
      );

      patterns.push({
        id: `pattern_${i}`,
        name: `Pattern ${i + 1}`,
        clusterIds: [i.toString()],
        dataPoints: cluster.points,
        centroid: cluster.centroid,
        confidence,
        occurrenceCount: cluster.points.length,
        averageSeverity,
        trend,
        lastOccurrence: Math.max(...cluster.points.map((p) => p.timestamp)),
        description,
      });
    }

    // Sort patterns by confidence (descending)
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect trend in pattern data
   */
  private detectTrend(
    dataPoints: AlertDataPoint[]
  ): "increasing" | "decreasing" | "stable" {
    if (dataPoints.length < 2) {
return "stable";
}

    // Sort by timestamp
    const sorted = [...dataPoints].sort((a, b) => a.timestamp - b.timestamp);

    // Split into two halves and compare
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const avgFirst = this.calculateAverage(firstHalf);
    const avgSecond = this.calculateAverage(secondHalf);

    const change = (avgSecond - avgFirst) / (avgFirst || 1);

    if (Math.abs(change) < 0.05) {
return "stable";
}
    if (change > 0) {
return "increasing";
}
    return "decreasing";
  }

  /**
   * Calculate average value
   */
  private calculateAverage(points: AlertDataPoint[]): number {
    if (points.length === 0) {
return 0;
}
    const sum = points.reduce((acc, p) => acc + p.value, 0);
    return sum / points.length;
  }

  /**
   * Generate human-readable pattern description
   */
  private generateDescription(
    cluster: Cluster,
    clusterSize: number,
    totalSize: number
  ): string {
    const percentage = ((clusterSize / totalSize) * 100).toFixed(1);
    const severity = this.calculateClusterSeverity(cluster);

    return `Detected alert pattern occurring ${clusterSize} times (${percentage}% of alerts) with average severity level ${severity}.`;
  }

  /**
   * Calculate cluster severity level
   */
  private calculateClusterSeverity(cluster: Cluster): string {
    const severities: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    cluster.points.forEach((p) => {
      severities[p.severity]++;
    });

    const total = cluster.points.length;
    const criticalPercent = severities.critical / total;
    const highPercent = (severities.critical + severities.high) / total;

    if (criticalPercent > 0.3) {
return "critical";
}
    if (highPercent > 0.5) {
return "high";
}
    if (severities.medium > total * 0.5) {
return "medium";
}
    return "low";
  }

  /**
   * Compare patterns over time to detect changes
   */
  comparePatterns(
    previousPatterns: DetectedPattern[],
    currentPatterns: DetectedPattern[]
  ): {
    newPatterns: DetectedPattern[];
    disappearedPatterns: DetectedPattern[];
    changedPatterns: Array<{
      pattern: DetectedPattern;
      previousOccurrences: number;
      currentOccurrences: number;
      change: number;
    }>;
  } {
    const newPatterns: DetectedPattern[] = [];
    const disappearedPatterns: DetectedPattern[] = [];
    const changedPatterns: Array<{
      pattern: DetectedPattern;
      previousOccurrences: number;
      currentOccurrences: number;
      change: number;
    }> = [];

    // Find new and changed patterns
    for (const current of currentPatterns) {
      const previous = previousPatterns.find(
        (p) => this.patternsMatch(p, current)
      );

      if (!previous) {
        newPatterns.push(current);
      } else {
        const occurrenceChange =
          current.occurrenceCount - previous.occurrenceCount;
        if (occurrenceChange !== 0) {
          changedPatterns.push({
            pattern: current,
            previousOccurrences: previous.occurrenceCount,
            currentOccurrences: current.occurrenceCount,
            change: occurrenceChange,
          });
        }
      }
    }

    // Find disappeared patterns
    for (const previous of previousPatterns) {
      if (!currentPatterns.find((p) => this.patternsMatch(p, previous))) {
        disappearedPatterns.push(previous);
      }
    }

    return {
      newPatterns,
      disappearedPatterns,
      changedPatterns: changedPatterns.sort((a, b) => b.change - a.change),
    };
  }

  /**
   * Check if two patterns match (within tolerance)
   */
  private patternsMatch(p1: DetectedPattern, p2: DetectedPattern): boolean {
    const centroidDifference = Math.abs(p1.centroid - p2.centroid);
    const threshold = Math.max(p1.centroid, p2.centroid) * 0.1; // 10% tolerance
    return centroidDifference < threshold;
  }

  /**
   * Calculate pattern similarity score (0-1)
   */
  calculateSimilarity(pattern1: DetectedPattern, pattern2: DetectedPattern): number {
    const centroidDistance = Math.abs(pattern1.centroid - pattern2.centroid);
    const maxCentroid = Math.max(
      Math.abs(pattern1.centroid),
      Math.abs(pattern2.centroid)
    );

    if (maxCentroid === 0) {
return 1;
}

    const centroidSimilarity = 1 - centroidDistance / maxCentroid;
    const confidenceSimilarity =
      1 - Math.abs(pattern1.confidence - pattern2.confidence);
    const severitySimilarity =
      pattern1.averageSeverity === pattern2.averageSeverity ? 1 : 0.5;

    return (centroidSimilarity + confidenceSimilarity + severitySimilarity) / 3;
  }

  /**
   * Set K value for clustering
   */
  setK(k: number): void {
    if (k > 0) {
      this.k = k;
    }
  }

  /**
   * Get current K value
   */
  getK(): number {
    return this.k;
  }
}

// Singleton instance
let instance: PatternDetectionEngine | null = null;

export function getPatternDetectionEngine(): PatternDetectionEngine {
  if (!instance) {
    instance = new PatternDetectionEngine();
  }
  return instance;
}
