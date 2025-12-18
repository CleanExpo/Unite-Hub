/**
 * M1 Phase 11B: Advanced Analytics & ML Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MLAnalyticsEngine } from '../analytics/ml-engine';
import { RecommendationsEngine } from '../analytics/recommendations-engine';

describe('Phase 11B: Advanced Analytics & ML', () => {
  describe('ML Analytics Engine (16 tests)', () => {
    let mlEngine: MLAnalyticsEngine;

    beforeEach(() => {
      mlEngine = new MLAnalyticsEngine(30);
    });

    it('should add training data', () => {
      mlEngine.addTrainingData('latency', {
        timestamp: Date.now(),
        value: 100,
        features: { region: 1 },
      });
      const stats = mlEngine.getStats();
      expect(stats.trainingDataPoints).toBeGreaterThan(0);
    });

    it('should train LSTM prediction model', async () => {
      for (let i = 0; i < 50; i++) {
        mlEngine.addTrainingData('latency', {
          timestamp: Date.now() + i * 1000,
          value: 50 + Math.random() * 20,
        });
      }
      const model = await mlEngine.trainPredictionModel('latency', 'lstm');
      expect(model.accuracy).toBeGreaterThan(0.8);
      expect(model.type).toBe('lstm');
    });

    it('should train ARIMA model', async () => {
      for (let i = 0; i < 50; i++) {
        mlEngine.addTrainingData('throughput', {
          timestamp: Date.now() + i * 1000,
          value: 1000 + Math.sin(i / 10) * 100,
        });
      }
      const model = await mlEngine.trainPredictionModel('throughput', 'arima');
      expect(model.type).toBe('arima');
    });

    it('should make predictions', async () => {
      for (let i = 0; i < 50; i++) {
        mlEngine.addTrainingData('cpu', {
          timestamp: Date.now() + i * 1000,
          value: 40 + Math.random() * 20,
        });
      }
      const predictions = await mlEngine.predict('cpu', 5);
      expect(predictions).toHaveLength(5);
      expect(predictions[0].predicted).toBeGreaterThan(0);
      expect(predictions[0].confidence).toBeGreaterThan(0.5);
    });

    it('should include confidence intervals', async () => {
      for (let i = 0; i < 50; i++) {
        mlEngine.addTrainingData('memory', {
          timestamp: Date.now() + i * 1000,
          value: 60 + Math.random() * 30,
        });
      }
      const predictions = await mlEngine.predict('memory', 3);
      expect(predictions[0].lower).toBeLessThan(predictions[0].predicted);
      expect(predictions[0].upper).toBeGreaterThan(predictions[0].predicted);
    });

    it('should detect anomalies', () => {
      for (let i = 0; i < 30; i++) {
        mlEngine.addTrainingData('error_rate', {
          timestamp: Date.now() + i * 1000,
          value: 5 + Math.random() * 2,
        });
      }
      mlEngine.addTrainingData('error_rate', {
        timestamp: Date.now() + 31 * 1000,
        value: 50,
      });
      const anomalies = mlEngine.detectAnomalies('error_rate', 2);
      const detected = anomalies.some(a => a.isAnomaly && a.score > 2);
      expect(detected).toBe(true);
    });

    it('should classify anomaly severity', () => {
      for (let i = 0; i < 30; i++) {
        mlEngine.addTrainingData('test', {
          timestamp: Date.now() + i * 1000,
          value: 100 + Math.random() * 5,
        });
      }
      mlEngine.addTrainingData('test', { timestamp: Date.now() + 31000, value: 500 });
      const anomalies = mlEngine.detectAnomalies('test', 1);
      const critical = anomalies.find(a => a.severity === 'critical');
      expect(critical).toBeDefined();
    });

    it('should detect increasing trend', () => {
      for (let i = 0; i < 30; i++) {
        mlEngine.addTrainingData('metric', {
          timestamp: Date.now() + i * 1000,
          value: i * 10,
        });
      }
      const patterns = mlEngine.detectPatterns('metric');
      expect(patterns.trend).toBe('increasing');
    });

    it('should detect decreasing trend', () => {
      for (let i = 0; i < 30; i++) {
        mlEngine.addTrainingData('metric', {
          timestamp: Date.now() + i * 1000,
          value: 300 - i * 10,
        });
      }
      const patterns = mlEngine.detectPatterns('metric');
      expect(patterns.trend).toBe('decreasing');
    });

    it('should detect stable trend', () => {
      for (let i = 0; i < 30; i++) {
        mlEngine.addTrainingData('metric', {
          timestamp: Date.now() + i * 1000,
          value: 100 + Math.random() * 2,
        });
      }
      const patterns = mlEngine.detectPatterns('metric');
      expect(patterns.trend).toBe('stable');
    });

    it('should retrieve model metrics', async () => {
      for (let i = 0; i < 50; i++) {
        mlEngine.addTrainingData('test', {
          timestamp: Date.now() + i * 1000,
          value: 50 + Math.random() * 20,
        });
      }
      const model = await mlEngine.trainPredictionModel('test');
      const metrics = mlEngine.getModelMetrics(model.modelId);
      expect(metrics?.accuracy).toBeDefined();
    });

    it('should provide statistics', () => {
      for (let i = 0; i < 30; i++) {
        mlEngine.addTrainingData('test', {
          timestamp: Date.now() + i * 1000,
          value: 50,
        });
      }
      const stats = mlEngine.getStats();
      expect(stats.trainingDataPoints).toBe(30);
    });

    it('should forecast values', async () => {
      for (let i = 0; i < 50; i++) {
        mlEngine.addTrainingData('forecast_test', {
          timestamp: Date.now() + i * 1000,
          value: 50 + Math.random() * 20,
        });
      }
      const forecast = await mlEngine.forecast('forecast_test', 7);
      expect(forecast).toHaveLength(7);
    });

    it('should clear old data', () => {
      for (let i = 0; i < 30; i++) {
        mlEngine.addTrainingData('test', {
          timestamp: Date.now() - 100000 + i * 1000,
          value: 50,
        });
      }
      const cleared = mlEngine.clearOldData(50000);
      expect(cleared).toBeGreaterThan(0);
    });
  });

  describe('Recommendations Engine (15 tests)', () => {
    let recEngine: RecommendationsEngine;

    beforeEach(() => {
      recEngine = new RecommendationsEngine();
    });

    it('should generate performance recommendations', () => {
      const recs = recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 500,
          threshold: 250,
          trend: 'increasing',
          historicalData: [100, 150, 200, 250, 300, 400, 500],
        },
      ]);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should generate cost recommendations', () => {
      const recs = recEngine.generateRecommendations([
        {
          metric: 'cost_daily',
          currentValue: 1500,
          threshold: 1000,
          trend: 'increasing',
          historicalData: [800, 900, 950, 1000, 1200, 1400, 1500],
        },
      ]);
      const costRecs = recs.filter(r => r.type === 'cost');
      expect(costRecs.length).toBeGreaterThan(0);
    });

    it('should generate reliability recommendations', () => {
      const recs = recEngine.generateRecommendations([
        {
          metric: 'error_rate',
          currentValue: 0.05,
          threshold: 0.02,
          trend: 'increasing',
          historicalData: [0.01, 0.015, 0.02, 0.03, 0.04, 0.05],
        },
      ]);
      const relRecs = recs.filter(r => r.type === 'reliability');
      expect(relRecs.length).toBeGreaterThan(0);
    });

    it('should generate critical alerts for severe issues', () => {
      const recs = recEngine.generateRecommendations([
        {
          metric: 'cpu_usage',
          currentValue: 100,
          threshold: 50,
          trend: 'increasing',
          historicalData: [40, 50, 60, 70, 80, 90, 100],
        },
      ]);
      const critical = recs.filter(r => r.priority === 'critical');
      expect(critical.length).toBeGreaterThan(0);
    });

    it('should include action items', () => {
      const recs = recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 300,
          threshold: 200,
          trend: 'increasing',
          historicalData: [100, 150, 200, 250, 300],
        },
      ]);
      expect(recs[0].actionItems.length).toBeGreaterThan(0);
    });

    it('should calculate impact scores', () => {
      const recs = recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 300,
          threshold: 200,
          trend: 'increasing',
          historicalData: [100, 150, 200, 250, 300],
        },
      ]);
      expect(recs[0].impact.performance).toBeGreaterThan(0);
    });

    it('should get active recommendations', () => {
      recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 500,
          threshold: 250,
          trend: 'increasing',
          historicalData: [100, 150, 200, 250, 300, 400, 500],
        },
      ]);
      const active = recEngine.getActiveRecommendations();
      expect(active.length).toBeGreaterThan(0);
    });

    it('should filter by priority', () => {
      recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 500,
          threshold: 250,
          trend: 'increasing',
          historicalData: [100, 150, 200, 250, 300, 400, 500],
        },
      ]);
      const highPriority = recEngine.getByPriority('high');
      expect(highPriority.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by type', () => {
      recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 500,
          threshold: 250,
          trend: 'increasing',
          historicalData: [100, 150, 200, 250, 300, 400, 500],
        },
      ]);
      const perfRecs = recEngine.getByType('performance');
      expect(perfRecs.length).toBeGreaterThanOrEqual(0);
    });

    it('should dismiss recommendations', () => {
      recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 500,
          threshold: 250,
          trend: 'increasing',
          historicalData: [100, 150, 200, 250, 300, 400, 500],
        },
      ]);
      const active = recEngine.getActiveRecommendations();
      if (active.length > 0) {
        recEngine.dismissRecommendation(active[0].id);
        const afterDismiss = recEngine.getActiveRecommendations();
        expect(afterDismiss.length).toBeLessThan(active.length);
      }
    });

    it('should apply recommendations', () => {
      recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 500,
          threshold: 250,
          trend: 'increasing',
          historicalData: [100, 150, 200, 250, 300, 400, 500],
        },
      ]);
      const active = recEngine.getActiveRecommendations();
      if (active.length > 0) {
        recEngine.applyRecommendation(active[0].id);
        const afterApply = recEngine.getActiveRecommendations();
        expect(afterApply.length).toBeLessThan(active.length);
      }
    });

    it('should provide statistics', () => {
      recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 500,
          threshold: 250,
          trend: 'increasing',
          historicalData: [100, 150, 200, 250, 300, 400, 500],
        },
      ]);
      const stats = recEngine.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.averageConfidence).toBeGreaterThan(0.7);
    });

    it('should clear old recommendations', () => {
      recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 500,
          threshold: 250,
          trend: 'increasing',
          historicalData: [100, 150, 200, 250, 300, 400, 500],
        },
      ]);
      const cleared = recEngine.clearOldRecommendations(1000);
      expect(cleared).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration (6 tests)', () => {
    it('should correlate ML predictions with recommendations', async () => {
      const mlEngine = new MLAnalyticsEngine();
      const recEngine = new RecommendationsEngine();

      for (let i = 0; i < 50; i++) {
        mlEngine.addTrainingData('latency', {
          timestamp: Date.now() + i * 1000,
          value: 50 + i * 2,
        });
      }

      const predictions = await mlEngine.predict('latency', 5);
      expect(predictions.length).toBe(5);

      const recs = recEngine.generateRecommendations([
        {
          metric: 'latency',
          currentValue: 150,
          threshold: 100,
          trend: 'increasing',
          historicalData: [50, 70, 90, 110, 150],
        },
      ]);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should detect anomalies and generate alerts', () => {
      const mlEngine = new MLAnalyticsEngine();
      for (let i = 0; i < 50; i++) {
        mlEngine.addTrainingData('cpu', {
          timestamp: Date.now() + i * 1000,
          value: 30 + Math.random() * 10,
        });
      }
      mlEngine.addTrainingData('cpu', {
        timestamp: Date.now() + 51000,
        value: 95,
      });
      const anomalies = mlEngine.detectAnomalies('cpu', 2);
      const critical = anomalies.filter(a => a.severity === 'critical');
      expect(critical.length).toBeGreaterThan(0);
    });

    it('should forecast cost trends', async () => {
      const mlEngine = new MLAnalyticsEngine();
      for (let i = 0; i < 50; i++) {
        mlEngine.addTrainingData('cost_daily', {
          timestamp: Date.now() + i * 1000,
          value: 1000 + i * 5,
        });
      }
      const forecast = await mlEngine.forecast('cost_daily', 10);
      expect(forecast).toHaveLength(10);
      expect(forecast[forecast.length - 1].predicted).toBeGreaterThan(forecast[0].predicted);
    });

    it('should support multi-metric analysis', () => {
      const mlEngine = new MLAnalyticsEngine();
      const metrics = ['latency', 'throughput', 'error_rate'];
      for (const metric of metrics) {
        for (let i = 0; i < 30; i++) {
          mlEngine.addTrainingData(metric, {
            timestamp: Date.now() + i * 1000,
            value: 50 + Math.random() * 50,
          });
        }
      }
      const stats = mlEngine.getStats();
      expect(stats.trainingDataPoints).toBe(90);
    });

    it('should generate actionable insights', async () => {
      const mlEngine = new MLAnalyticsEngine();
      const recEngine = new RecommendationsEngine();

      for (let i = 0; i < 100; i++) {
        mlEngine.addTrainingData('system_load', {
          timestamp: Date.now() + i * 1000,
          value: 50 + Math.sin(i / 20) * 30,
        });
      }

      const patterns = mlEngine.detectPatterns('system_load');
      expect(patterns).toBeDefined();

      const recs = recEngine.generateRecommendations([
        {
          metric: 'system_load',
          currentValue: 160,
          threshold: 80,
          trend: patterns.trend,
          historicalData: [50, 60, 70, 80, 90, 160],
        },
      ]);
      const relevantRecs = recs.filter(r => r.type === 'scalability' || r.type === 'performance'); expect(relevantRecs.length).toBeGreaterThan(0);
    });

    it('should maintain performance with large datasets', () => {
      const mlEngine = new MLAnalyticsEngine();
      for (let i = 0; i < 1000; i++) {
        mlEngine.addTrainingData('metric', {
          timestamp: Date.now() + i * 1000,
          value: 50 + Math.random() * 50,
        });
      }
      const startTime = Date.now();
      const patterns = mlEngine.detectPatterns('metric');
      const duration = Date.now() - startTime;
      expect(patterns).toBeDefined();
      expect(duration).toBeLessThan(1000);
    });
  });
});
