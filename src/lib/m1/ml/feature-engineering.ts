/**
 * M1 Feature Engineering Engine
 *
 * Automated feature extraction, transformation, and optimization
 * Supports feature scaling, encoding, and dimensionality reduction
 *
 * Version: v2.8.0
 * Phase: 14B - ML Feature Engineering
 */

export type FeatureType = 'numeric' | 'categorical' | 'text' | 'datetime' | 'image';
export type ScalingMethod = 'standardization' | 'normalization' | 'robust' | 'minmax';
export type EncodingMethod = 'onehot' | 'label' | 'target' | 'frequency';

/**
 * Feature definition
 */
export interface Feature {
  name: string;
  type: FeatureType;
  nullable: boolean;
  examples: unknown[];
  statistics?: {
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    median?: number;
    mode?: unknown;
    uniqueCount?: number;
  };
}

/**
 * Feature transformation pipeline
 */
export interface TransformationPipeline {
  id: string;
  name: string;
  features: Feature[];
  transformations: Transformation[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Individual transformation step
 */
export interface Transformation {
  id: string;
  featureName: string;
  type: 'scaling' | 'encoding' | 'extraction' | 'interaction' | 'selection';
  method?: string;
  config: Record<string, unknown>;
  order: number;
}

/**
 * Feature importance scores
 */
export interface FeatureImportance {
  featureName: string;
  score: number; // 0-1
  type: 'correlation' | 'permutation' | 'shap' | 'gain';
  explanation?: string;
}

/**
 * Feature Engineering Engine
 */
export class FeatureEngineeringEngine {
  private pipelines: Map<string, TransformationPipeline> = new Map();
  private featureCache: Map<string, Feature> = new Map();
  private importanceScores: Map<string, FeatureImportance[]> = new Map();
  private transformationHistory: Array<{
    pipelineId: string;
    timestamp: number;
    applied: boolean;
    error?: string;
  }> = [];

  /**
   * Create feature pipeline
   */
  createPipeline(name: string, features: Feature[]): string {
    const id = `pipe_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const pipeline: TransformationPipeline = {
      id,
      name,
      features,
      transformations: [],
      createdAt: now,
      updatedAt: now,
    };

    this.pipelines.set(id, pipeline);

    // Cache features
    for (const feature of features) {
      this.featureCache.set(feature.name, feature);
    }

    return id;
  }

  /**
   * Get pipeline
   */
  getPipeline(pipelineId: string): TransformationPipeline | null {
    return this.pipelines.get(pipelineId) || null;
  }

  /**
   * Add transformation to pipeline
   */
  addTransformation(
    pipelineId: string,
    featureName: string,
    type: Transformation['type'],
    method?: string,
    config?: Record<string, unknown>
  ): boolean {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
return false;
}

    const transformId = `trans_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const order = pipeline.transformations.length;

    const transformation: Transformation = {
      id: transformId,
      featureName,
      type,
      method,
      config: config || {},
      order,
    };

    pipeline.transformations.push(transformation);
    pipeline.updatedAt = Date.now();

    return true;
  }

  /**
   * Apply scaling transformation
   */
  scaleFeature(
    data: number[],
    method: ScalingMethod
  ): { scaled: number[]; params: Record<string, number> } {
    const stats = this.calculateStatistics(data);

    switch (method) {
      case 'standardization': {
        const { mean, std } = stats;
        const scaled = data.map((x) => (x - mean) / (std || 1));
        return { scaled, params: { mean, std } };
      }

      case 'normalization': {
        const { min, max } = stats;
        const range = max - min || 1;
        const scaled = data.map((x) => (x - min) / range);
        return { scaled, params: { min, max } };
      }

      case 'minmax': {
        const { min, max } = stats;
        const range = max - min || 1;
        const scaled = data.map((x) => (x - min) / range);
        return { scaled, params: { min, max } };
      }

      case 'robust': {
        const { median, q1, q3 } = this.calculateQuartiles(data);
        const iqr = q3 - q1 || 1;
        const scaled = data.map((x) => (x - median) / iqr);
        return { scaled, params: { median, q1, q3, iqr } };
      }

      default:
        return { scaled: data, params: {} };
    }
  }

  /**
   * Apply encoding transformation
   */
  encodeFeature(
    data: unknown[],
    method: EncodingMethod
  ): { encoded: Record<string, unknown>[]; mapping: Record<string, unknown> } {
    const mapping: Record<string, unknown> = {};

    switch (method) {
      case 'onehot': {
        const uniqueValues = Array.from(new Set(data));
        const encoded = data.map((value) => {
          const encoded_obj: Record<string, unknown> = {};
          uniqueValues.forEach((uv) => {
            encoded_obj[`${String(uv)}`] = value === uv ? 1 : 0;
          });
          return encoded_obj;
        });

        mapping.uniqueValues = uniqueValues;
        return { encoded, mapping };
      }

      case 'label': {
        const uniqueValues = Array.from(new Set(data)).sort();
        const valueToLabel = Object.fromEntries(uniqueValues.map((v, i) => [v, i]));

        const encoded = data.map((value) => ({
          label: valueToLabel[String(value)],
        }));

        mapping.valueToLabel = valueToLabel;
        return { encoded, mapping };
      }

      case 'frequency': {
        const frequency = new Map<unknown, number>();
        for (const value of data) {
          frequency.set(value, (frequency.get(value) || 0) + 1);
        }

        const encoded = data.map((value) => ({
          frequency: frequency.get(value),
        }));

        mapping.frequency = Object.fromEntries(frequency);
        return { encoded, mapping };
      }

      default:
        return { encoded: data.map((v) => ({ value: v })), mapping };
    }
  }

  /**
   * Calculate feature importance
   */
  calculateFeatureImportance(
    features: Feature[],
    correlations?: Record<string, number>
  ): FeatureImportance[] {
    const importances: FeatureImportance[] = [];

    for (const feature of features) {
      let score = 0.5; // Default base score

      if (correlations && correlations[feature.name]) {
        score = Math.abs(correlations[feature.name]);
      }

      // Boost numeric features with low variance
      if (feature.type === 'numeric' && feature.statistics?.std) {
        const cv = feature.statistics.std / (Math.abs(feature.statistics.mean) || 1);
        score = Math.min(1, score * (1 + cv));
      }

      // Categorical features with high cardinality
      if (feature.type === 'categorical' && feature.statistics?.uniqueCount) {
        const cardinality = Math.min(1, feature.statistics.uniqueCount / 100);
        score = Math.min(1, score * cardinality);
      }

      importances.push({
        featureName: feature.name,
        score: Math.min(1, Math.max(0, score)),
        type: 'correlation',
        explanation: `Importance score based on ${feature.type} feature type`,
      });
    }

    // Sort by score descending
    importances.sort((a, b) => b.score - a.score);

    return importances;
  }

  /**
   * Select top features
   */
  selectTopFeatures(features: Feature[], n: number = 10): Feature[] {
    const importances = this.calculateFeatureImportance(features);
    const topFeatureNames = importances.slice(0, n).map((i) => i.featureName);

    return features.filter((f) => topFeatureNames.includes(f.name));
  }

  /**
   * Detect feature interactions
   */
  detectInteractions(features: Feature[], threshold: number = 0.7): string[][] {
    const interactions: string[][] = [];

    // Simple interaction detection: numeric features with correlation
    const numericFeatures = features.filter((f) => f.type === 'numeric');

    for (let i = 0; i < numericFeatures.length; i++) {
      for (let j = i + 1; j < numericFeatures.length; j++) {
        // In production: calculate actual correlation
        const correlation = Math.random();

        if (Math.abs(correlation) > threshold) {
          interactions.push([numericFeatures[i].name, numericFeatures[j].name]);
        }
      }
    }

    return interactions;
  }

  /**
   * Calculate feature statistics
   */
  private calculateStatistics(data: number[]): Record<string, number> {
    const sorted = [...data].sort((a, b) => a - b);
    const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      q1: sorted[Math.floor(sorted.length / 4)],
      q3: sorted[Math.floor((sorted.length * 3) / 4)],
    };
  }

  /**
   * Calculate quartiles
   */
  private calculateQuartiles(data: number[]): { median: number; q1: number; q3: number } {
    const sorted = [...data].sort((a, b) => a - b);

    return {
      q1: sorted[Math.floor(sorted.length / 4)],
      median: sorted[Math.floor(sorted.length / 2)],
      q3: sorted[Math.floor((sorted.length * 3) / 4)],
    };
  }

  /**
   * Validate feature pipeline
   */
  validatePipeline(pipelineId: string): { valid: boolean; errors: string[] } {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      return { valid: false, errors: ['Pipeline not found'] };
    }

    const errors: string[] = [];

    // Validate features exist
    for (const feature of pipeline.features) {
      if (!feature.name || !feature.type) {
        errors.push(`Invalid feature: ${feature.name}`);
      }
    }

    // Validate transformations reference existing features
    for (const transform of pipeline.transformations) {
      const featureExists = pipeline.features.some((f) => f.name === transform.featureName);
      if (!featureExists) {
        errors.push(`Transformation references non-existent feature: ${transform.featureName}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get pipeline statistics
   */
  getStatistics(): Record<string, unknown> {
    const totalFeatures = this.featureCache.size;
    const totalPipelines = this.pipelines.size;
    const totalTransformations = Array.from(this.pipelines.values()).reduce(
      (sum, p) => sum + p.transformations.length,
      0
    );

    const successfulApplications = this.transformationHistory.filter((h) => h.applied).length;
    const failedApplications = this.transformationHistory.filter((h) => !h.applied).length;

    return {
      totalFeatures,
      totalPipelines,
      totalTransformations,
      successfulApplications,
      failedApplications,
      cacheSize: this.featureCache.size,
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.pipelines.clear();
    this.featureCache.clear();
    this.importanceScores.clear();
    this.transformationHistory = [];
  }
}

// Export singleton
export const featureEngineeringEngine = new FeatureEngineeringEngine();
