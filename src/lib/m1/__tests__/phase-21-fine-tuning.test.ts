/**
 * M1 Phase 21: Advanced Fine-Tuning & Custom Model Optimization Tests
 *
 * Tests for:
 * - FineTuningManager: Dataset management, job orchestration, evaluation, deployment
 * - ModelOptimizationEngine: Quantization, distillation, pruning, LoRA optimization
 *
 * Version: v1.0.0
 * Phase: 21 - Advanced Fine-Tuning & Custom Model Optimization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FineTuningManager, TrainingExample } from '../agents/fine-tuning-manager';
import { ModelOptimizationEngine } from '../agents/model-optimization-engine';

/**
 * Helper to create training examples
 */
function createExample(id: string, userMsg: string, assistantMsg: string): TrainingExample {
  return {
    id,
    messages: [
      { role: 'user' as const, content: userMsg },
      { role: 'assistant' as const, content: assistantMsg },
    ],
  };
}

/**
 * FineTuningManager Tests
 */
describe('FineTuningManager - Dataset Operations', () => {
  let manager: FineTuningManager;

  beforeEach(() => {
    manager = new FineTuningManager();
  });

  afterEach(() => {
    manager.shutdown();
  });

  it('should create a training dataset', () => {
    const datasetId = manager.createDataset('training-data', 'training', [
      createExample('ex1', 'What is ML?', 'Machine learning is...'),
      createExample('ex2', 'Explain deep learning', 'Deep learning uses...'),
    ]);

    expect(datasetId).toBeDefined();
    expect(datasetId).toMatch(/^dataset_/);
  });

  it('should create validation dataset', () => {
    const datasetId = manager.createDataset('validation-data', 'validation', [
      createExample('ex1', 'What is AI?', 'Artificial intelligence...'),
    ]);

    expect(datasetId).toBeDefined();
    expect(datasetId).toMatch(/^dataset_/);
  });

  it('should retrieve dataset statistics', () => {
    const datasetId = manager.createDataset('stats-test', 'training', [
      createExample('ex1', 'input', 'output'),
      createExample('ex2', 'longer input text', 'longer output text'),
    ]);

    const stats = manager.getDatasetStats(datasetId);
    expect(stats).toBeDefined();
    expect(stats?.exampleCount).toBe(2);
    expect(stats?.totalTokens).toBeGreaterThan(0);
  });

  it('should add examples to dataset', () => {
    const datasetId = manager.createDataset('extendable', 'training', [
      createExample('ex1', 'q1', 'a1'),
    ]);

    const added = manager.addExamples(datasetId, [
      createExample('ex2', 'q2', 'a2'),
    ]);

    expect(added).toBe(true);
    const stats = manager.getDatasetStats(datasetId);
    expect(stats?.exampleCount).toBe(2);
  });

  it('should return false when adding examples to non-existent dataset', () => {
    const result = manager.addExamples('non-existent', [
      createExample('ex1', 'q', 'a'),
    ]);

    expect(result).toBe(false);
  });
});

describe('FineTuningManager - Job Management', () => {
  let manager: FineTuningManager;
  let datasetId: string;

  beforeEach(() => {
    manager = new FineTuningManager();
    datasetId = manager.createDataset('training', 'training', [
      createExample('ex1', 'q1', 'a1'),
      createExample('ex2', 'q2', 'a2'),
    ]);
  });

  afterEach(() => {
    manager.shutdown();
  });

  it('should start fine-tuning job', () => {
    const jobId = manager.startFineTuning(
      'test-model',
      'gpt-4o',
      datasetId
    );

    expect(jobId).toBeDefined();
    expect(jobId).toMatch(/^finetune_/);
  });

  it('should start job with custom hyperparameters', () => {
    const jobId = manager.startFineTuning(
      'custom-ft',
      'gpt-4o',
      datasetId,
      undefined,
      {
        learningRate: 0.00005,
        epochs: 5,
        batchSize: 64,
        warmupSteps: 200,
      }
    );

    const job = manager.getJobStatus(jobId);
    expect(job?.hyperparameters.learningRate).toBe(0.00005);
    expect(job?.hyperparameters.epochs).toBe(5);
  });

  it('should retrieve job status', () => {
    const jobId = manager.startFineTuning('status-test', 'gpt-4o', datasetId);
    const job = manager.getJobStatus(jobId);

    expect(job).toBeDefined();
    expect(job?.status).toBe('created');
  });

  it('should update job status', () => {
    const jobId = manager.startFineTuning('update-test', 'gpt-4o', datasetId);

    manager.updateJobStatus(jobId, 'running');
    let job = manager.getJobStatus(jobId);
    expect(job?.status).toBe('running');

    manager.updateJobStatus(jobId, 'succeeded', {
      trainingLoss: 0.15,
    });
    job = manager.getJobStatus(jobId);
    expect(job?.status).toBe('succeeded');
    expect(job?.metrics?.trainingLoss).toBe(0.15);
  });

  it('should get all jobs', () => {
    manager.startFineTuning('job1', 'gpt-4o', datasetId);
    manager.startFineTuning('job2', 'gpt-4o', datasetId);

    const jobs = manager.getAllJobs();
    expect(jobs.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter jobs by status', () => {
    const jobId1 = manager.startFineTuning('filter1', 'gpt-4o', datasetId);
    const jobId2 = manager.startFineTuning('filter2', 'gpt-4o', datasetId);

    manager.updateJobStatus(jobId1, 'running');

    const runningJobs = manager.getAllJobs({ status: 'running' });
    expect(runningJobs.length).toBeGreaterThan(0);
  });

  it('should cancel a job', () => {
    const jobId = manager.startFineTuning('cancel-test', 'gpt-4o', datasetId);

    manager.updateJobStatus(jobId, 'running');
    const cancelled = manager.cancelJob(jobId);

    expect(cancelled).toBe(true);
    const job = manager.getJobStatus(jobId);
    expect(job?.status).toBe('cancelled');
  });

  it('should get training metrics', () => {
    const jobId = manager.startFineTuning('metrics-test', 'gpt-4o', datasetId);
    manager.updateJobStatus(jobId, 'succeeded', {
      trainingLoss: 0.15,
      accuracy: 0.95,
    });

    const metrics = manager.getTrainingMetrics(jobId);
    expect(metrics).toBeDefined();
  });
});

describe('FineTuningManager - Model Evaluation', () => {
  let manager: FineTuningManager;
  let testDatasetId: string;

  beforeEach(() => {
    manager = new FineTuningManager();
    testDatasetId = manager.createDataset('test', 'test', [
      createExample('ex1', 'test1', 'result1'),
      createExample('ex2', 'test2', 'result2'),
    ]);
  });

  afterEach(() => {
    manager.shutdown();
  });

  it('should evaluate a model', () => {
    const evaluationId = manager.evaluateModel('model-1', testDatasetId);

    expect(evaluationId).toBeDefined();
    expect(evaluationId).toMatch(/^eval_/);
  });

  it('should retrieve evaluation results', () => {
    const evaluationId = manager.evaluateModel('model-2', testDatasetId);
    const evaluation = manager.getEvaluationResult(evaluationId);

    expect(evaluation).toBeDefined();
    expect(evaluation?.metrics.accuracy).toBeGreaterThanOrEqual(0.85);
    expect(evaluation?.metrics.accuracy).toBeLessThanOrEqual(1);
  });

  it('should include all evaluation metrics', () => {
    const evaluationId = manager.evaluateModel('model-3', testDatasetId);
    const evaluation = manager.getEvaluationResult(evaluationId);

    expect(evaluation?.metrics.precision).toBeGreaterThan(0);
    expect(evaluation?.metrics.recall).toBeGreaterThan(0);
    expect(evaluation?.metrics.f1Score).toBeGreaterThan(0);
    expect(evaluation?.metrics.perplexity).toBeGreaterThan(0);
    expect(evaluation?.metrics.latency).toBeGreaterThan(0);
    expect(evaluation?.metrics.throughput).toBeGreaterThan(0);
  });
});

describe('FineTuningManager - Model Deployment', () => {
  let manager: FineTuningManager;
  let datasetId: string;
  let jobId: string;

  beforeEach(() => {
    manager = new FineTuningManager();
    datasetId = manager.createDataset('training', 'training', [
      createExample('ex1', 'q', 'a'),
    ]);
    jobId = manager.startFineTuning('deploy-model', 'gpt-4o', datasetId);
    manager.updateJobStatus(jobId, 'succeeded');
  });

  afterEach(() => {
    manager.shutdown();
  });

  it('should deploy a model', () => {
    const modelId = manager.deployModel(jobId, 'deployment-test', 'gpt-4o');

    expect(modelId).toBeDefined();
    expect(modelId).toMatch(/^model_/);
  });

  it('should retrieve deployed model config', () => {
    const modelId = manager.deployModel(jobId, 'retrieve-test', 'gpt-4o');
    const model = manager.getModel(modelId);

    expect(model).toBeDefined();
    expect(model?.name).toBe('retrieve-test');
    expect(model?.baseModel).toBe('gpt-4o');
  });

  it('should archive a model', () => {
    const modelId = manager.deployModel(jobId, 'archive-test', 'gpt-4o');

    const archived = manager.archiveModel(modelId);
    expect(archived).toBe(true);

    const model = manager.getModel(modelId);
    expect(model?.status).toBe('archived');
  });

  it('should list all models', () => {
    const modelId1 = manager.deployModel(jobId, 'model1', 'gpt-4o');

    const jobId2 = manager.startFineTuning('model2', 'claude-sonnet', datasetId);
    manager.updateJobStatus(jobId2, 'succeeded');
    const modelId2 = manager.deployModel(jobId2, 'model2', 'claude-sonnet');

    const models = manager.getAllModels();
    expect(models.length).toBeGreaterThanOrEqual(2);
  });
});

describe('FineTuningManager - Statistics', () => {
  let manager: FineTuningManager;

  beforeEach(() => {
    manager = new FineTuningManager();
  });

  afterEach(() => {
    manager.shutdown();
  });

  it('should provide comprehensive statistics', () => {
    const datasetId = manager.createDataset('training', 'training', [
      createExample('ex1', 'q', 'a'),
    ]);
    const jobId = manager.startFineTuning('stat-model', 'gpt-4o', datasetId);
    manager.updateJobStatus(jobId, 'succeeded');

    const stats = manager.getStatistics();
    expect(stats.totalDatasets).toBeGreaterThan(0);
    expect(stats.totalJobs).toBeGreaterThan(0);
    expect(stats.succeededJobs).toBeGreaterThan(0);
  });

  it('should track fine-tuning costs', () => {
    const datasetId = manager.createDataset('cost-test', 'training', [
      createExample('ex1', 'q', 'a'),
    ]);
    manager.startFineTuning('cost-model', 'gpt-4o', datasetId);

    const stats = manager.getStatistics();
    expect(stats.totalCost).toBeGreaterThanOrEqual(0);
  });

  it('should count production models', () => {
    const datasetId = manager.createDataset('prod-test', 'training', [
      createExample('ex1', 'q', 'a'),
    ]);
    const jobId = manager.startFineTuning('prod-model', 'gpt-4o', datasetId);
    manager.updateJobStatus(jobId, 'succeeded');
    manager.deployModel(jobId, 'prod-deploy', 'gpt-4o');

    const stats = manager.getStatistics();
    expect(stats.productionModels).toBeGreaterThanOrEqual(1);
  });
});

/**
 * ModelOptimizationEngine Tests
 */
describe('ModelOptimizationEngine - Quantization', () => {
  let engine: ModelOptimizationEngine;

  beforeEach(() => {
    engine = new ModelOptimizationEngine();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should quantize model to int8', () => {
    const optId = engine.quantizeModel('gpt-4o', { quantizationType: 'int8' });

    expect(optId).toMatch(/^opt_/);
    const result = engine.getOptimization(optId);
    expect(result?.technique).toBe('quantization');
    expect(result?.metrics.sizeReduction).toBe(75);
  });

  it('should quantize model to int4', () => {
    const optId = engine.quantizeModel('gpt-4o', { quantizationType: 'int4' });

    const result = engine.getOptimization(optId);
    expect(result?.metrics.sizeReduction).toBe(87.5);
  });

  it('should quantize model to fp16', () => {
    const optId = engine.quantizeModel('gpt-4o', { quantizationType: 'fp16' });

    const result = engine.getOptimization(optId);
    expect(result?.metrics.sizeReduction).toBe(50);
  });

  it('should track quantization metrics', () => {
    const optId = engine.quantizeModel('gpt-4o', { quantizationType: 'int8' });

    const result = engine.getOptimization(optId);
    expect(result?.metrics.originalSize).toBe(7000);
    expect(result?.metrics.speedup).toBeGreaterThan(1);
    expect(result?.metrics.accuracyLoss).toBeGreaterThan(0);
    expect(result?.metrics.accuracyLoss).toBeLessThan(0.05);
  });
});

describe('ModelOptimizationEngine - Distillation', () => {
  let engine: ModelOptimizationEngine;

  beforeEach(() => {
    engine = new ModelOptimizationEngine();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should perform knowledge distillation', () => {
    const optId = engine.distillModel('gpt-4o-student', 'gpt-4o', {
      temperatureParameter: 4,
      distillationLoss: 0.7,
      epochs: 10,
    });

    expect(optId).toMatch(/^opt_/);
    const result = engine.getOptimization(optId);
    expect(result?.technique).toBe('knowledge_distillation');
    expect(result?.metrics.sizeReduction).toBe(71);
  });

  it('should achieve significant speedup with distillation', () => {
    const optId = engine.distillModel('gpt-4o-student', 'gpt-4o', {
      temperatureParameter: 4,
      distillationLoss: 0.7,
    });

    const result = engine.getOptimization(optId);
    expect(result?.metrics.speedup).toBe(3.5);
  });

  it('should maintain reasonable accuracy with distillation', () => {
    const optId = engine.distillModel('gpt-4o-student', 'gpt-4o', {
      temperatureParameter: 4,
      distillationLoss: 0.7,
    });

    const result = engine.getOptimization(optId);
    expect(result?.metrics.accuracyLoss).toBeGreaterThan(0.02);
    expect(result?.metrics.accuracyLoss).toBeLessThan(0.08);
  });
});

describe('ModelOptimizationEngine - Pruning', () => {
  let engine: ModelOptimizationEngine;

  beforeEach(() => {
    engine = new ModelOptimizationEngine();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should prune model with specified percentage', () => {
    const optId = engine.pruneModel('gpt-4o', 30);

    expect(optId).toMatch(/^opt_/);
    const result = engine.getOptimization(optId);
    expect(result?.technique).toBe('pruning');
    expect(result?.metrics.sizeReduction).toBe(30);
  });

  it('should enforce pruning percentage bounds', () => {
    const optId = engine.pruneModel('gpt-4o', 95);

    const result = engine.getOptimization(optId);
    expect(result?.metrics.sizeReduction).toBeLessThanOrEqual(90);
  });

  it('should enforce minimum pruning percentage', () => {
    const optId = engine.pruneModel('gpt-4o', 5);

    const result = engine.getOptimization(optId);
    expect(result?.metrics.sizeReduction).toBeGreaterThanOrEqual(10);
  });

  it('should scale accuracy loss with pruning percentage', () => {
    const result10 = engine.getOptimization(engine.pruneModel('gpt-4o', 10));
    const result50 = engine.getOptimization(engine.pruneModel('gpt-4o', 50));

    expect(result50?.metrics.accuracyLoss).toBeGreaterThan(
      result10?.metrics.accuracyLoss || 0
    );
  });
});

describe('ModelOptimizationEngine - Low-Rank Adaptation', () => {
  let engine: ModelOptimizationEngine;

  beforeEach(() => {
    engine = new ModelOptimizationEngine();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should apply LoRA with specified rank size', () => {
    const optId = engine.applyLoRA('gpt-4o', 16);

    expect(optId).toMatch(/^opt_/);
    const result = engine.getOptimization(optId);
    expect(result?.technique).toBe('low_rank_adaptation');
  });

  it('should achieve high size reduction with LoRA', () => {
    const optId = engine.applyLoRA('gpt-4o', 16);

    const result = engine.getOptimization(optId);
    expect(result?.metrics.sizeReduction).toBeGreaterThan(50);
    expect(result?.metrics.sizeReduction).toBeLessThan(100);
  });

  it('should maintain very low accuracy loss with LoRA', () => {
    const optId = engine.applyLoRA('gpt-4o', 16);

    const result = engine.getOptimization(optId);
    expect(result?.metrics.accuracyLoss).toBeLessThan(0.02);
  });

  it('should vary size reduction based on rank size', () => {
    const result16 = engine.getOptimization(engine.applyLoRA('gpt-4o', 16));
    const result256 = engine.getOptimization(engine.applyLoRA('gpt-4o', 256));

    expect(result16?.metrics.sizeReduction).toBeGreaterThan(
      result256?.metrics.sizeReduction || 0
    );
  });
});

describe('ModelOptimizationEngine - Recommendations', () => {
  let engine: ModelOptimizationEngine;

  beforeEach(() => {
    engine = new ModelOptimizationEngine();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should recommend quantization for small size budget', () => {
    const recommendations = engine.getOptimizationRecommendations('gpt-4o', {
      sizeBudget: 2000,
    });

    expect(recommendations).toContain('quantization');
  });

  it('should recommend distillation for aggressive size reduction', () => {
    const recommendations = engine.getOptimizationRecommendations('gpt-4o', {
      sizeBudget: 2000,
    });

    expect(recommendations).toContain('knowledge_distillation');
  });

  it('should recommend LoRA for high accuracy requirement', () => {
    const recommendations = engine.getOptimizationRecommendations('gpt-4o', {
      accuracyThreshold: 0.98,
    });

    expect(recommendations).toContain('low_rank_adaptation');
  });

  it('should provide default recommendations', () => {
    const recommendations = engine.getOptimizationRecommendations('gpt-4o', {});

    expect(recommendations.length).toBeGreaterThan(0);
  });
});

describe('ModelOptimizationEngine - Benchmarking', () => {
  let engine: ModelOptimizationEngine;

  beforeEach(() => {
    engine = new ModelOptimizationEngine();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should benchmark model performance', () => {
    const benchmark = engine.benchmarkModel('gpt-4o', 1000);

    expect(benchmark.modelId).toBe('gpt-4o');
    expect(benchmark.testSize).toBe(1000);
  });

  it('should include latency metrics', () => {
    const benchmark = engine.benchmarkModel('gpt-4o');

    expect(benchmark.metrics.avgLatency).toBeGreaterThan(0);
    expect(benchmark.metrics.p95Latency).toBeGreaterThanOrEqual(
      benchmark.metrics.avgLatency
    );
  });

  it('should include throughput metrics', () => {
    const benchmark = engine.benchmarkModel('gpt-4o');

    expect(benchmark.metrics.throughput).toBeGreaterThan(0);
    expect(benchmark.metrics.accuracy).toBeGreaterThan(0);
    expect(benchmark.metrics.accuracy).toBeLessThanOrEqual(1);
  });

  it('should include memory usage', () => {
    const benchmark = engine.benchmarkModel('gpt-4o');

    expect(benchmark.metrics.memoryUsage).toBeGreaterThan(0);
  });
});

describe('ModelOptimizationEngine - Comparison & History', () => {
  let engine: ModelOptimizationEngine;

  beforeEach(() => {
    engine = new ModelOptimizationEngine();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should compare optimization techniques', () => {
    const opt1 = engine.quantizeModel('gpt-4o', { quantizationType: 'int8' });
    const opt2 = engine.distillModel('gpt-4o-student', 'gpt-4o', {
      temperatureParameter: 4,
      distillationLoss: 0.7,
    });
    const opt3 = engine.pruneModel('gpt-4o', 50);

    const comparison = engine.compareOptimizations([opt1, opt2, opt3]);

    expect(comparison[opt1].technique).toBe('quantization');
    expect(comparison[opt2].technique).toBe('knowledge_distillation');
    expect(comparison[opt3].technique).toBe('pruning');
  });

  it('should track optimization history', () => {
    engine.quantizeModel('gpt-4o', { quantizationType: 'int8' });
    engine.distillModel('gpt-4o-student', 'gpt-4o', {
      temperatureParameter: 4,
      distillationLoss: 0.7,
    });
    engine.pruneModel('gpt-4o', 30);

    const history = engine.getOptimizationHistory('gpt-4o', 10);
    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  it('should calculate cumulative optimization gains', () => {
    const opt1 = engine.quantizeModel('gpt-4o', { quantizationType: 'int8' });
    const opt2 = engine.quantizeModel('gpt-4o-2', { quantizationType: 'int4' });

    const gains = engine.calculateCumulativeGains([opt1, opt2]);

    expect(gains.totalOptimizations).toBe(2);
    expect(gains.techniques).toContain('quantization');
  });

  it('should provide optimization statistics', () => {
    engine.quantizeModel('gpt-4o', { quantizationType: 'int8' });
    engine.distillModel('gpt-4o-student', 'gpt-4o', {
      temperatureParameter: 4,
      distillationLoss: 0.7,
    });

    const stats = engine.getStatistics();

    expect(stats.totalOptimizations).toBeGreaterThan(0);
    expect(stats.completed).toBeGreaterThan(0);
  });
});

/**
 * Integration Tests
 */
describe('Phase 21 - Fine-Tuning & Optimization Integration', () => {
  let ftManager: FineTuningManager;
  let optEngine: ModelOptimizationEngine;

  beforeEach(() => {
    ftManager = new FineTuningManager();
    optEngine = new ModelOptimizationEngine();
  });

  afterEach(() => {
    ftManager.shutdown();
    optEngine.shutdown();
  });

  it('should fine-tune and then optimize model', () => {
    const datasetId = ftManager.createDataset('integration', 'training', [
      createExample('ex1', 'q1', 'a1'),
      createExample('ex2', 'q2', 'a2'),
    ]);

    const jobId = ftManager.startFineTuning('ft-model', 'gpt-4o', datasetId);
    ftManager.updateJobStatus(jobId, 'succeeded');

    const optId = optEngine.quantizeModel('ft-model', {
      quantizationType: 'int8',
    });

    const job = ftManager.getJobStatus(jobId);
    const optimization = optEngine.getOptimization(optId);

    expect(job?.status).toBe('succeeded');
    expect(optimization?.technique).toBe('quantization');
  });

  it('should manage complete model lifecycle', () => {
    const datasetId = ftManager.createDataset('lifecycle', 'training', [
      createExample('ex1', 'q', 'a'),
    ]);

    const jobId = ftManager.startFineTuning('lifecycle-model', 'gpt-4o', datasetId);
    ftManager.updateJobStatus(jobId, 'succeeded');

    const testDatasetId = ftManager.createDataset('test', 'test', [
      createExample('ex2', 'test', 'result'),
    ]);
    const evalId = ftManager.evaluateModel('lifecycle-model', testDatasetId);

    const optId = optEngine.quantizeModel('lifecycle-model', {
      quantizationType: 'int8',
    });

    const modelId = ftManager.deployModel(jobId, 'prod-model', 'gpt-4o');

    expect(ftManager.getJobStatus(jobId)?.status).toBe('succeeded');
    expect(ftManager.getEvaluationResult(evalId)).toBeDefined();
    expect(optEngine.getOptimization(optId)).toBeDefined();
    expect(ftManager.getModel(modelId)).toBeDefined();
  });
});
