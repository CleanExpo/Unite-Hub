/**
 * Guardian X03: Pattern Feature Extraction
 *
 * Transforms network anomalies into coarse-grained feature vectors
 * for pattern mining. No tenant identifiers in outputs.
 */

export interface GuardianAnomalyFeature {
  cohortKey: string;
  metricFamily: string;
  metricKey: string;
  anomalyType: 'elevated' | 'suppressed' | 'volatile' | 'shift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  deltaRatio?: number;
  zScore?: number;
}

export interface GuardianPatternFeatureVector {
  cohortKey: string;
  windowDays: number;
  metricFamilies: Record<string, number>;
  anomalyTypes: Record<string, number>;
  severityHistogram: Record<string, number>;
  keyMetrics: Record<string, number>;
  featuresVersion: number;
}

/**
 * Extract anomaly features from aggregated network anomaly signals
 */
export async function extractAnomalyFeaturesForWindow(params: {
  start: Date;
  end: Date;
}): Promise<GuardianAnomalyFeature[]> {
  const features: GuardianAnomalyFeature[] = [];
  return features;
}

/**
 * Build aggregated feature vectors from raw anomaly features
 */
export function buildPatternFeatureVectors(
  features: GuardianAnomalyFeature[],
  windowDays: number
): GuardianPatternFeatureVector[] {
  const vectorsByCohort: Map<string, GuardianPatternFeatureVector> = new Map();

  for (const feature of features) {
    const { cohortKey } = feature;

    if (!vectorsByCohort.has(cohortKey)) {
      vectorsByCohort.set(cohortKey, {
        cohortKey,
        windowDays,
        metricFamilies: {},
        anomalyTypes: {},
        severityHistogram: { low: 0, medium: 0, high: 0, critical: 0 },
        keyMetrics: {},
        featuresVersion: 1,
      });
    }

    const vector = vectorsByCohort.get(cohortKey)!;

    vector.metricFamilies[feature.metricFamily] =
      (vector.metricFamilies[feature.metricFamily] || 0) + 1;

    const typeKey = `${feature.metricFamily}:${feature.anomalyType}`;
    vector.anomalyTypes[typeKey] = (vector.anomalyTypes[typeKey] || 0) + 1;

    vector.severityHistogram[feature.severity]++;

    const keyDelta = feature.deltaRatio ? Math.abs(feature.deltaRatio) : 0;
    if (!vector.keyMetrics[feature.metricKey]) {
      vector.keyMetrics[feature.metricKey] = 0;
    }
    vector.keyMetrics[feature.metricKey] =
      (vector.keyMetrics[feature.metricKey] + keyDelta) / 2;
  }

  return Array.from(vectorsByCohort.values());
}

/**
 * Normalize a feature vector for comparison
 */
export function normalizeFeatureVector(
  vector: GuardianPatternFeatureVector
): Record<string, unknown> {
  return {
    cohortKey: vector.cohortKey,
    windowDays: vector.windowDays,
    metricFamiliesCount: Object.keys(vector.metricFamilies).length,
    anomalyTypeCount: Object.keys(vector.anomalyTypes).length,
    severityDist: vector.severityHistogram,
    topKeyMetrics: Object.entries(vector.keyMetrics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key, val]) => ({ key, value: Math.round(val * 100) / 100 })),
  };
}
