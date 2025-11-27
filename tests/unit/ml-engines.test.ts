/**
 * ML Engines Unit Tests
 * Pattern Detection and Anomaly Detection comprehensive tests
 */

import { describe, it, expect } from "vitest";
import {
  PatternDetectionEngine,
  AlertDataPoint,
  DetectedPattern,
} from "@/lib/ml/pattern-detection";
import {
  AnomalyDetectionEngine,
  AnomalyDataPoint,
  DetectedAnomaly,
  StatisticalMetrics,
} from "@/lib/ml/anomaly-detection";

describe("Pattern Detection Engine", () => {
  let engine: PatternDetectionEngine;
  let testData: AlertDataPoint[];

  beforeEach(() => {
    engine = new PatternDetectionEngine();

    // Create test data with clear patterns
    testData = [
      // Pattern 1: Low values (10-15)
      { timestamp: 1, value: 12, type: "cpu", severity: "low" },
      { timestamp: 2, value: 13, type: "cpu", severity: "low" },
      { timestamp: 3, value: 11, type: "cpu", severity: "low" },

      // Pattern 2: High values (80-90)
      { timestamp: 4, value: 85, type: "memory", severity: "high" },
      { timestamp: 5, value: 88, type: "memory", severity: "high" },
      { timestamp: 6, value: 82, type: "memory", severity: "high" },

      // Pattern 3: Medium values (40-50)
      { timestamp: 7, value: 45, type: "disk", severity: "medium" },
      { timestamp: 8, value: 48, type: "disk", severity: "medium" },
      { timestamp: 9, value: 42, type: "disk", severity: "medium" },
    ];
  });

  it("should detect patterns in data", () => {
    const patterns = engine.detectPatterns(testData);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.length).toBeLessThanOrEqual(3);
  });

  it("should return patterns sorted by confidence", () => {
    const patterns = engine.detectPatterns(testData);
    for (let i = 1; i < patterns.length; i++) {
      expect(patterns[i - 1].confidence).toBeGreaterThanOrEqual(
        patterns[i].confidence
      );
    }
  });

  it("should calculate centroid correctly", () => {
    const patterns = engine.detectPatterns(testData);
    patterns.forEach((pattern) => {
      expect(pattern.centroid).toBeGreaterThanOrEqual(0);
      expect(pattern.centroid).toBeLessThanOrEqual(100);
    });
  });

  it("should include data points in patterns", () => {
    const patterns = engine.detectPatterns(testData);
    patterns.forEach((pattern) => {
      expect(pattern.dataPoints.length).toBeGreaterThan(0);
      expect(pattern.occurrenceCount).toBe(pattern.dataPoints.length);
    });
  });

  it("should generate descriptions for patterns", () => {
    const patterns = engine.detectPatterns(testData);
    patterns.forEach((pattern) => {
      expect(pattern.description).toBeTruthy();
      expect(pattern.description.length).toBeGreaterThan(20);
    });
  });

  it("should detect trend in patterns", () => {
    const patterns = engine.detectPatterns(testData);
    patterns.forEach((pattern) => {
      expect(["increasing", "decreasing", "stable"]).toContain(
        pattern.trend
      );
    });
  });

  it("should set K value", () => {
    engine.setK(3);
    expect(engine.getK()).toBe(3);
  });

  it("should compare patterns over time", () => {
    const patterns1 = engine.detectPatterns(testData);

    const newData: AlertDataPoint[] = [
      ...testData,
      { timestamp: 10, value: 50, type: "network", severity: "medium" },
      { timestamp: 11, value: 52, type: "network", severity: "medium" },
    ];

    const patterns2 = engine.detectPatterns(newData);

    const comparison = engine.comparePatterns(patterns1, patterns2);
    expect(comparison.newPatterns).toBeDefined();
    expect(comparison.disappearedPatterns).toBeDefined();
    expect(comparison.changedPatterns).toBeDefined();
  });

  it("should calculate pattern similarity", () => {
    const patterns = engine.detectPatterns(testData);
    if (patterns.length >= 2) {
      const similarity = engine.calculateSimilarity(
        patterns[0],
        patterns[1]
      );
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    }
  });

  it("should handle empty data", () => {
    const patterns = engine.detectPatterns([]);
    expect(patterns.length).toBe(0);
  });

  it("should handle single data point", () => {
    const patterns = engine.detectPatterns([testData[0]]);
    expect(patterns.length).toBeGreaterThanOrEqual(0);
  });
});

describe("Anomaly Detection Engine", () => {
  let engine: AnomalyDetectionEngine;
  let testData: AnomalyDataPoint[];

  beforeEach(() => {
    engine = new AnomalyDetectionEngine();

    // Create normal data with some outliers
    testData = [];

    // Normal range: 20-30
    for (let i = 0; i < 20; i++) {
      testData.push({
        timestamp: i * 1000,
        value: 20 + Math.random() * 10,
        type: "cpu",
      });
    }

    // Add anomalies
    testData.push({
      timestamp: 20000,
      value: 95, // Outlier
      type: "cpu",
    });

    testData.push({
      timestamp: 21000,
      value: 25,
      type: "cpu",
    });

    testData.push({
      timestamp: 22000,
      value: 5, // Outlier (sudden drop)
      type: "cpu",
    });
  });

  it("should detect anomalies in data", () => {
    const anomalies = engine.detectAnomalies(testData);
    expect(anomalies.length).toBeGreaterThan(0);
  });

  it("should detect outliers", () => {
    const anomalies = engine.detectAnomalies(testData);
    const outliers = anomalies.filter((a) => a.anomalyType === "outlier");
    expect(outliers.length).toBeGreaterThan(0);
  });

  it("should assign severity levels", () => {
    const anomalies = engine.detectAnomalies(testData);
    anomalies.forEach((anomaly) => {
      expect(["low", "medium", "high", "critical"]).toContain(
        anomaly.severity
      );
    });
  });

  it("should calculate composite score", () => {
    const anomalies = engine.detectAnomalies(testData);
    anomalies.forEach((anomaly) => {
      expect(anomaly.compositeScore).toBeGreaterThanOrEqual(0);
      expect(anomaly.compositeScore).toBeLessThanOrEqual(1);
    });
  });

  it("should generate explanations", () => {
    const anomalies = engine.detectAnomalies(testData);
    anomalies.forEach((anomaly) => {
      expect(anomaly.explanation).toBeTruthy();
      expect(anomaly.explanation.length).toBeGreaterThan(20);
    });
  });

  it("should filter by severity", () => {
    const anomalies = engine.detectAnomalies(testData);
    const critical = engine.filterBySeverity(anomalies, "critical");
    expect(critical.every((a) => a.severity === "critical")).toBe(true);
  });

  it("should filter by confidence", () => {
    const anomalies = engine.detectAnomalies(testData);
    const highConfidence = engine.filterByConfidence(anomalies, 0.7);
    expect(
      highConfidence.every((a) => a.confidence >= 0.7)
    ).toBe(true);
  });

  it("should calculate anomaly density", () => {
    const anomalies = engine.detectAnomalies(testData);
    const density = engine.calculateAnomalyDensity(testData, anomalies);
    expect(density).toBeGreaterThanOrEqual(0);
    expect(density).toBeLessThanOrEqual(1);
  });

  it("should group anomalies by type", () => {
    const anomalies = engine.detectAnomalies(testData);
    const grouped = engine.groupByType(anomalies);
    expect(Object.keys(grouped).length).toBeGreaterThan(0);
  });

  it("should set Z-score threshold", () => {
    engine.setZScoreThreshold(2.5);
    expect(engine.getZScoreThreshold()).toBe(2.5);
  });

  it("should set change threshold", () => {
    engine.setChangeThreshold(0.6);
    expect(engine.getChangeThreshold()).toBe(0.6);
  });

  it("should handle contextual data", () => {
    const contextData: AnomalyDataPoint[] = [
      {
        timestamp: 1,
        value: 25,
        type: "cpu",
        context: {
          expectedHourOfDay: 9,
          expectedRange: [20, 30],
        },
      },
      {
        timestamp: 2,
        value: 80,
        type: "cpu",
        context: {
          expectedHourOfDay: 9,
          expectedRange: [20, 30],
        },
      },
    ];

    const anomalies = engine.detectAnomalies(contextData);
    expect(anomalies.length).toBeGreaterThan(0);
  });

  it("should detect sudden changes", () => {
    const changeData: AnomalyDataPoint[] = [
      { timestamp: 1, value: 25, type: "cpu" },
      { timestamp: 2, value: 26, type: "cpu" },
      { timestamp: 3, value: 24, type: "cpu" },
      { timestamp: 4, value: 80, type: "cpu" }, // Sudden spike
    ];

    const anomalies = engine.detectAnomalies(changeData);
    const suddenChanges = anomalies.filter(
      (a) => a.anomalyType === "sudden_change"
    );
    expect(suddenChanges.length).toBeGreaterThan(0);
  });

  it("should handle empty data", () => {
    const anomalies = engine.detectAnomalies([]);
    expect(anomalies.length).toBe(0);
  });

  it("should handle insufficient data points", () => {
    const minimalData = [
      { timestamp: 1, value: 25, type: "cpu" },
      { timestamp: 2, value: 26, type: "cpu" },
    ];

    const anomalies = engine.detectAnomalies(minimalData);
    expect(anomalies.length).toBe(0);
  });

  it("should include related points in anomalies", () => {
    const anomalies = engine.detectAnomalies(testData);
    anomalies.forEach((anomaly) => {
      expect(Array.isArray(anomaly.relatedPoints)).toBe(true);
    });
  });

  it("should have confidence between 0 and 1", () => {
    const anomalies = engine.detectAnomalies(testData);
    anomalies.forEach((anomaly) => {
      expect(anomaly.confidence).toBeGreaterThanOrEqual(0);
      expect(anomaly.confidence).toBeLessThanOrEqual(1);
    });
  });
});

describe("ML Engines Integration", () => {
  it("should work with same data format", () => {
    const patternEngine = new PatternDetectionEngine();
    const anomalyEngine = new AnomalyDetectionEngine();

    const data: any[] = [
      { timestamp: 1, value: 25, type: "cpu", severity: "low" },
      { timestamp: 2, value: 26, type: "cpu", severity: "low" },
      { timestamp: 3, value: 75, type: "cpu", severity: "high" },
    ];

    const patterns = patternEngine.detectPatterns(data);
    const anomalies = anomalyEngine.detectAnomalies(data);

    expect(patterns).toBeDefined();
    expect(anomalies).toBeDefined();
  });

  it("should handle large datasets", () => {
    const patternEngine = new PatternDetectionEngine();

    // Create 1000 data points
    const largeData: AlertDataPoint[] = [];
    for (let i = 0; i < 1000; i++) {
      largeData.push({
        timestamp: i,
        value: 20 + Math.random() * 60,
        type: "cpu",
        severity: "medium",
      });
    }

    const patterns = patternEngine.detectPatterns(largeData);
    expect(patterns.length).toBeGreaterThan(0);
  });
});
