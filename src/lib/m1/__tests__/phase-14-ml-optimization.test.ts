/**
 * M1 Phase 14: Machine Learning Optimization Tests
 *
 * Comprehensive test suite for ML model caching and feature engineering
 *
 * Version: v2.8.0
 * Phase: 14 - Machine Learning Optimization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MLModelCache, MLModel } from '../ml/model-cache';
import { FeatureEngineeringEngine, Feature } from '../ml/feature-engineering';

describe('Phase 14: Machine Learning Optimization', () => {
  let modelCache: MLModelCache;
  let featureEngine: FeatureEngineeringEngine;

  beforeEach(() => {
    modelCache = new MLModelCache('lru', 50 * 1024 * 1024);
    featureEngine = new FeatureEngineeringEngine();
  });

  // ===== ML Model Cache Tests (14A) =====

  describe('ML Model Cache (15 tests)', () => {
    it('should cache ML model', () => {
      const model: MLModel = {
        id: 'model-1',
        name: 'credit-classifier',
        version: '1.0.0',
        type: 'classification',
        framework: 'scikit-learn',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: { accuracy: 0.92, precision: 0.89, recall: 0.88 },
        hyperparameters: { learning_rate: 0.01, max_depth: 5 },
        features: ['age', 'income', 'credit_score'],
        size: 1024000,
        checksum: 'abc123def456',
      };

      const modelData = Buffer.from('mock model data');
      modelCache.cacheModel(model, modelData);

      const cached = modelCache.getModel('model-1', '1.0.0');
      expect(cached).toBeDefined();
      expect(cached?.model.name).toBe('credit-classifier');
    });

    it('should track model hit counts', () => {
      const model: MLModel = {
        id: 'model-2',
        name: 'test-model',
        version: '1.0.0',
        type: 'regression',
        framework: 'tensorflow',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: { rmse: 0.05, mae: 0.03 },
        hyperparameters: {},
        features: ['x', 'y'],
        size: 512000,
        checksum: 'xyz789',
      };

      modelCache.cacheModel(model, Buffer.from('data'));

      modelCache.getModel('model-2', '1.0.0');
      modelCache.getModel('model-2', '1.0.0');
      modelCache.getModel('model-2', '1.0.0');

      const cached = modelCache.getModel('model-2', '1.0.0');
      expect(cached?.hitCount).toBeGreaterThanOrEqual(3);
    });

    it('should support multiple model versions', () => {
      const v1: MLModel = {
        id: 'versioned-model',
        name: 'multi-version',
        version: '1.0.0',
        type: 'classification',
        framework: 'pytorch',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: { accuracy: 0.85 },
        hyperparameters: {},
        features: [],
        size: 1000,
        checksum: 'v1',
      };

      const v2: MLModel = {
        ...v1,
        version: '2.0.0',
        metrics: { accuracy: 0.92 },
        checksum: 'v2',
      };

      modelCache.cacheModel(v1, Buffer.from('v1 data'));
      modelCache.cacheModel(v2, Buffer.from('v2 data'));

      expect(modelCache.getLatestVersion('versioned-model')).toBe('2.0.0');
      expect(modelCache.getModelVersions('versioned-model')).toContain('1.0.0');
      expect(modelCache.getModelVersions('versioned-model')).toContain('2.0.0');
    });

    it('should cache predictions', () => {
      const predictionId = modelCache.cachePrediction(
        'model-1',
        '1.0.0',
        'input_hash_123',
        { prediction: 0.95, class: 'approved' },
        0.95
      );

      expect(predictionId).toBeDefined();

      const cached = modelCache.getPrediction('model-1', 'input_hash_123');
      expect(cached).toBeDefined();
      expect(cached?.output.class).toBe('approved');
    });

    it('should expire cached predictions', (done) => {
      modelCache.cachePrediction(
        'model-1',
        '1.0.0',
        'short_lived_hash',
        { prediction: 0.5 },
        100 // 100ms TTL
      );

      const cached = modelCache.getPrediction('model-1', 'short_lived_hash');
      expect(cached).toBeDefined();

      setTimeout(() => {
        const expired = modelCache.getPrediction('model-1', 'short_lived_hash');
        expect(expired).toBeNull();
        done();
      }, 150);
    });

    it('should invalidate model cache', () => {
      const model: MLModel = {
        id: 'invalidate-test',
        name: 'test',
        version: '1.0.0',
        type: 'classification',
        framework: 'scikit-learn',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: {},
        hyperparameters: {},
        features: [],
        size: 1000,
        checksum: 'check',
      };

      modelCache.cacheModel(model, Buffer.from('data'));
      expect(modelCache.getModel('invalidate-test', '1.0.0')).toBeDefined();

      const invalidated = modelCache.invalidateModel('invalidate-test', '1.0.0');
      expect(invalidated).toBe(1);
      expect(modelCache.getModel('invalidate-test', '1.0.0')).toBeNull();
    });

    it('should implement LRU eviction', () => {
      const smallCache = new MLModelCache('lru', 2000); // 2KB cache

      const model1: MLModel = {
        id: 'model-lru-1',
        name: 'test-1',
        version: '1.0.0',
        type: 'classification',
        framework: 'tf',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: {},
        hyperparameters: {},
        features: [],
        size: 1000,
        checksum: 'c1',
      };

      const model2: MLModel = { ...model1, id: 'model-lru-2', checksum: 'c2' };

      smallCache.cacheModel(model1, Buffer.alloc(1000));
      smallCache.cacheModel(model2, Buffer.alloc(1200)); // Should trigger eviction

      // model1 should be evicted due to LRU
      expect(smallCache.getModel('model-lru-1', '1.0.0')).toBeNull();
    });

    it('should calculate cache statistics', () => {
      const model: MLModel = {
        id: 'stats-model',
        name: 'test',
        version: '1.0.0',
        type: 'regression',
        framework: 'sklearn',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: { rmse: 0.05 },
        hyperparameters: {},
        features: ['feature1'],
        size: 5000,
        checksum: 'stat',
      };

      modelCache.cacheModel(model, Buffer.from('data'));
      modelCache.getModel('stats-model', '1.0.0');
      modelCache.getModel('stats-model', '1.0.0');

      const stats = modelCache.getStatistics();
      expect(stats.cachedModels).toBeGreaterThan(0);
      expect(stats.modelHitRate).toBeGreaterThan(0);
    });

    it('should support model TTL', (done) => {
      const model: MLModel = {
        id: 'ttl-model',
        name: 'temporary',
        version: '1.0.0',
        type: 'classification',
        framework: 'pytorch',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: {},
        hyperparameters: {},
        features: [],
        size: 1000,
        checksum: 'ttl',
      };

      modelCache.cacheModel(model, Buffer.from('data'), 100); // 100ms TTL
      expect(modelCache.getModel('ttl-model', '1.0.0')).toBeDefined();

      setTimeout(() => {
        expect(modelCache.getModel('ttl-model', '1.0.0')).toBeNull();
        done();
      }, 150);
    });

    it('should cleanup expired entries', () => {
      const model: MLModel = {
        id: 'cleanup-model',
        name: 'expired',
        version: '1.0.0',
        type: 'classification',
        framework: 'tf',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: {},
        hyperparameters: {},
        features: [],
        size: 1000,
        checksum: 'exp',
      };

      modelCache.cacheModel(model, Buffer.from('data'), 1); // 1ms TTL

      setTimeout(() => {
        const cleaned = modelCache.cleanupExpiredEntries();
        expect(cleaned).toBeGreaterThan(0);
      }, 100);
    });

    it('should track prediction cache hits', () => {
      modelCache.cachePrediction('model-1', '1.0.0', 'hash1', { result: 1 }, 0.9);
      modelCache.cachePrediction('model-1', '1.0.0', 'hash2', { result: 2 }, 0.8);

      modelCache.getPrediction('model-1', 'hash1');
      modelCache.getPrediction('model-1', 'hash1');

      const stats = modelCache.getStatistics();
      expect(stats.cachedPredictions).toBeGreaterThan(0);
    });
  });

  // ===== Feature Engineering Tests (14B) =====

  describe('Feature Engineering (15 tests)', () => {
    it('should create feature pipeline', () => {
      const features: Feature[] = [
        {
          name: 'age',
          type: 'numeric',
          nullable: false,
          examples: [25, 30, 45],
        },
        {
          name: 'salary',
          type: 'numeric',
          nullable: false,
          examples: [50000, 75000, 100000],
        },
      ];

      const pipelineId = featureEngine.createPipeline('salary-prediction', features);
      expect(pipelineId).toBeDefined();

      const pipeline = featureEngine.getPipeline(pipelineId);
      expect(pipeline?.features.length).toBe(2);
    });

    it('should add transformations to pipeline', () => {
      const features: Feature[] = [
        { name: 'income', type: 'numeric', nullable: false, examples: [30000, 50000] },
      ];

      const pipelineId = featureEngine.createPipeline('transform-test', features);
      const added = featureEngine.addTransformation(
        pipelineId,
        'income',
        'scaling',
        'standardization'
      );

      expect(added).toBe(true);

      const pipeline = featureEngine.getPipeline(pipelineId);
      expect(pipeline?.transformations.length).toBe(1);
    });

    it('should scale numeric features', () => {
      const data = [10, 20, 30, 40, 50];
      const { scaled, params } = featureEngine.scaleFeature(data, 'standardization');

      expect(scaled.length).toBe(5);
      expect(params.mean).toBeDefined();
      expect(params.std).toBeDefined();
    });

    it('should normalize features', () => {
      const data = [0, 25, 50, 75, 100];
      const { scaled, params } = featureEngine.scaleFeature(data, 'normalization');

      expect(scaled[0]).toBe(0);
      expect(scaled[4]).toBe(1);
    });

    it('should apply one-hot encoding', () => {
      const categories = ['red', 'blue', 'green', 'red', 'blue'];
      const { encoded, mapping } = featureEngine.encodeFeature(categories, 'onehot');

      expect(encoded.length).toBe(5);
      expect((mapping.uniqueValues as any[])?.length).toBe(3);
    });

    it('should apply label encoding', () => {
      const categories = ['low', 'medium', 'high', 'medium'];
      const { encoded, mapping } = featureEngine.encodeFeature(categories, 'label');

      expect(encoded.length).toBe(4);
      expect(mapping.valueToLabel).toBeDefined();
    });

    it('should calculate feature importance', () => {
      const features: Feature[] = [
        {
          name: 'feature1',
          type: 'numeric',
          nullable: false,
          examples: [1, 2, 3],
          statistics: { mean: 2, std: 0.8 },
        },
        {
          name: 'feature2',
          type: 'categorical',
          nullable: false,
          examples: ['a', 'b', 'c'],
          statistics: { uniqueCount: 3 },
        },
      ];

      const importances = featureEngine.calculateFeatureImportance(features);
      expect(importances.length).toBe(2);
      expect(importances[0].score).toBeGreaterThanOrEqual(0);
      expect(importances[0].score).toBeLessThanOrEqual(1);
    });

    it('should select top features', () => {
      const features: Feature[] = Array.from({ length: 20 }, (_, i) => ({
        name: `feature_${i}`,
        type: 'numeric',
        nullable: false,
        examples: [1, 2, 3],
      }));

      const topFeatures = featureEngine.selectTopFeatures(features, 5);
      expect(topFeatures.length).toBe(5);
    });

    it('should detect feature interactions', () => {
      const features: Feature[] = [
        { name: 'x1', type: 'numeric', nullable: false, examples: [1, 2, 3] },
        { name: 'x2', type: 'numeric', nullable: false, examples: [2, 4, 6] },
        { name: 'x3', type: 'numeric', nullable: false, examples: [3, 6, 9] },
      ];

      const interactions = featureEngine.detectInteractions(features, 0.9);
      expect(Array.isArray(interactions)).toBe(true);
    });

    it('should validate feature pipeline', () => {
      const features: Feature[] = [
        { name: 'valid_feature', type: 'numeric', nullable: false, examples: [1, 2] },
      ];

      const pipelineId = featureEngine.createPipeline('validation-test', features);
      featureEngine.addTransformation(pipelineId, 'valid_feature', 'scaling');

      const validation = featureEngine.validatePipeline(pipelineId);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should reject invalid pipelines', () => {
      const features: Feature[] = [
        { name: 'feature1', type: 'numeric', nullable: false, examples: [1, 2] },
      ];

      const pipelineId = featureEngine.createPipeline('invalid-test', features);
      featureEngine.addTransformation(pipelineId, 'non_existent_feature', 'scaling');

      const validation = featureEngine.validatePipeline(pipelineId);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should apply robust scaling', () => {
      const data = [1, 2, 3, 4, 5, 100]; // With outlier
      const { scaled, params } = featureEngine.scaleFeature(data, 'robust');

      expect(scaled.length).toBe(6);
      expect(params.median).toBeDefined();
    });

    it('should track feature engineering statistics', () => {
      const features: Feature[] = [
        { name: 'feat1', type: 'numeric', nullable: false, examples: [] },
        { name: 'feat2', type: 'categorical', nullable: false, examples: [] },
      ];

      featureEngine.createPipeline('stats-test', features);
      featureEngine.addTransformation('pipe_123', 'feat1', 'scaling');

      const stats = featureEngine.getStatistics();
      expect(stats.totalFeatures).toBeGreaterThan(0);
      expect(stats.totalPipelines).toBeGreaterThan(0);
    });
  });

  // ===== Integration Tests =====

  describe('ML Optimization Integration (8 tests)', () => {
    it('should coordinate model caching with feature engineering', () => {
      const features: Feature[] = [
        { name: 'input', type: 'numeric', nullable: false, examples: [1, 2, 3] },
      ];

      const pipelineId = featureEngine.createPipeline('integrated', features);

      const model: MLModel = {
        id: 'integrated-model',
        name: 'test',
        version: '1.0.0',
        type: 'regression',
        framework: 'sklearn',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: { rmse: 0.1 },
        hyperparameters: {},
        features: ['input'],
        size: 1000,
        checksum: 'int',
      };

      modelCache.cacheModel(model, Buffer.from('data'));

      expect(featureEngine.getPipeline(pipelineId)).toBeDefined();
      expect(modelCache.getModel('integrated-model', '1.0.0')).toBeDefined();
    });

    it('should optimize feature pipeline for model', () => {
      const features: Feature[] = Array.from({ length: 50 }, (_, i) => ({
        name: `feature_${i}`,
        type: i % 2 === 0 ? 'numeric' : 'categorical',
        nullable: false,
        examples: i % 2 === 0 ? [1, 2, 3] : ['a', 'b'],
      }));

      const pipelineId = featureEngine.createPipeline('optimized', features);
      const selected = featureEngine.selectTopFeatures(features, 10);

      expect(selected.length).toBeLessThanOrEqual(10);
    });

    it('should handle multi-version model inference', () => {
      const model1: MLModel = {
        id: 'multi-model',
        name: 'evolving',
        version: '1.0.0',
        type: 'classification',
        framework: 'tf',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: { accuracy: 0.85 },
        hyperparameters: {},
        features: ['x', 'y'],
        size: 1000,
        checksum: 'm1',
      };

      const model2: MLModel = { ...model1, version: '2.0.0', metrics: { accuracy: 0.92 } };

      modelCache.cacheModel(model1, Buffer.from('v1'));
      modelCache.cacheModel(model2, Buffer.from('v2'));

      // Inference with v2
      const prediction1 = modelCache.cachePrediction(
        'multi-model',
        '2.0.0',
        'input1',
        { confidence: 0.92 }
      );

      expect(modelCache.getPrediction('multi-model', 'input1')).toBeDefined();
    });

    it('should measure model caching effectiveness', () => {
      const model: MLModel = {
        id: 'perf-model',
        name: 'test',
        version: '1.0.0',
        type: 'regression',
        framework: 'sklearn',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: {},
        hyperparameters: {},
        features: [],
        size: 1000,
        checksum: 'perf',
      };

      modelCache.cacheModel(model, Buffer.from('data'));

      // Simulate multiple accesses
      for (let i = 0; i < 10; i++) {
        modelCache.getModel('perf-model', '1.0.0');
      }

      const stats = modelCache.getStatistics();
      expect(stats.modelHitRate).toBeGreaterThan(0);
    });

    it('should apply feature transformations in sequence', () => {
      const features: Feature[] = [
        { name: 'raw_value', type: 'numeric', nullable: false, examples: [1, 2, 3] },
      ];

      const pipelineId = featureEngine.createPipeline('sequence', features);

      // Step 1: Scale
      featureEngine.addTransformation(pipelineId, 'raw_value', 'scaling', 'standardization');

      // Step 2: Extract
      featureEngine.addTransformation(pipelineId, 'raw_value', 'extraction');

      const pipeline = featureEngine.getPipeline(pipelineId);
      expect(pipeline?.transformations.length).toBe(2);
    });

    it('should handle high-dimensional feature space', () => {
      const dimensions = 1000;
      const features: Feature[] = Array.from({ length: dimensions }, (_, i) => ({
        name: `dim_${i}`,
        type: 'numeric',
        nullable: false,
        examples: [Math.random(), Math.random()],
      }));

      const pipelineId = featureEngine.createPipeline('high-dim', features);
      const reduced = featureEngine.selectTopFeatures(features, 50);

      expect(reduced.length).toBeLessThanOrEqual(50);
      expect(reduced.length).toBeGreaterThan(0);
    });

    it('should combine model versioning with feature evolution', () => {
      // V1: 5 features
      const v1Features: Feature[] = Array.from({ length: 5 }, (_, i) => ({
        name: `feat_${i}`,
        type: 'numeric',
        nullable: false,
        examples: [1, 2, 3],
      }));

      const v1PipelineId = featureEngine.createPipeline('evolving-features', v1Features);

      // V2: 8 features (evolved)
      const v2Features: Feature[] = Array.from({ length: 8 }, (_, i) => ({
        name: `feat_${i}`,
        type: 'numeric',
        nullable: false,
        examples: [1, 2, 3],
      }));

      const v2Model: MLModel = {
        id: 'evolved-model',
        name: 'improved',
        version: '2.0.0',
        type: 'classification',
        framework: 'pytorch',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: { accuracy: 0.95 },
        hyperparameters: {},
        features: v2Features.map((f) => f.name),
        size: 2000,
        checksum: 'evolv',
      };

      modelCache.cacheModel(v2Model, Buffer.from('v2-data'));

      expect(v2Model.features.length).toBe(8);
      expect(modelCache.getModel('evolved-model', '2.0.0')).toBeDefined();
    });
  });
});
