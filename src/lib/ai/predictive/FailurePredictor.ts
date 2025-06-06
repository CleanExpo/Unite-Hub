/**
 * FailurePredictor - Predictive failure detection and prevention
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 */

import { EventEmitter } from 'events';
import { SystemMonitor, SystemMetrics } from '../monitoring/SystemMonitor';
import { DiagnosticsEngine } from '../monitoring/DiagnosticsEngine';
import { SystemHealthModel } from './models/SystemHealthModel';
import { createClient } from '../../supabase/server';

export interface FailurePrediction {
  id: string;
  component: string;
  failureType: 'crash' | 'degradation' | 'outage' | 'capacity' | 'security';
  probability: number; // 0-1
  timeToFailure: number; // hours
  confidence: number; // 0-1
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  preventiveActions: PreventiveAction[];
  timestamp: Date;
}

export interface PreventiveAction {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: string;
  automatable: boolean;
  command?: string;
}

export interface PredictionModel {
  train(historicalData: SystemMetrics[]): Promise<void>;
  predict(currentMetrics: SystemMetrics): FailurePrediction[];
  getAccuracy(): number;
}

export class FailurePredictor extends EventEmitter {
  private systemMonitor: SystemMonitor | null = null;
  private diagnosticsEngine: DiagnosticsEngine | null = null;
  private healthModel: SystemHealthModel | null = null;
  private predictions: Map<string, FailurePrediction> = new Map();
  private historicalMetrics: SystemMetrics[] = [];
  private readonly MAX_HISTORY_SIZE = 10000;
  private readonly PREDICTION_INTERVAL = 60000; // 1 minute
  private predictionInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * Initialize the failure predictor
   */
  async initialize(): Promise<void> {
    console.log('🔮 Failure Predictor initializing...');
    
    // Initialize dependencies
    this.systemMonitor = await SystemMonitor.getInstance();
    this.diagnosticsEngine = await (await import('../monitoring/DiagnosticsEngine')).getDiagnosticsEngine();
    this.healthModel = new SystemHealthModel();

    // Load historical data
    await this.loadHistoricalData();

    // Train the model
    await this.trainModels();

    // Start prediction cycle
    this.startPredictionCycle();

    // Subscribe to system metrics
    this.systemMonitor.onMetrics((metrics) => {
      this.updateHistoricalData(metrics);
    });

    console.log('🔮 Failure Predictor initialized');
  }

  /**
   * Load historical metrics data
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      const supabase = await createClient();
      
      // Load last 7 days of metrics
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('ai_system_metrics')
        .select('metric_value, timestamp')
        .eq('component', 'system-monitor')
        .eq('metric_name', 'system-health')
        .gte('timestamp', sevenDaysAgo.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Failed to load historical data:', error);
        return;
      }

      // Convert to SystemMetrics format
      this.historicalMetrics = data.map(record => ({
        ...record.metric_value,
        timestamp: new Date(record.timestamp)
      })) as SystemMetrics[];

    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  }

  /**
   * Train prediction models
   */
  private async trainModels(): Promise<void> {
    if (this.historicalMetrics.length < 100) {
      console.warn('Insufficient historical data for training');
      return;
    }

    await this.healthModel?.train(this.historicalMetrics);
    console.log('✅ Prediction models trained');
  }

  /**
   * Start the prediction cycle
   */
  private startPredictionCycle(): void {
    if (this.predictionInterval) return;

    // Run predictions immediately
    this.runPredictions();

    // Then run periodically
    this.predictionInterval = setInterval(() => {
      this.runPredictions();
    }, this.PREDICTION_INTERVAL);
  }

  /**
   * Run failure predictions
   */
  private async runPredictions(): Promise<void> {
    if (!this.systemMonitor || !this.healthModel) return;

    const currentMetrics = await this.systemMonitor.getCurrentMetrics();
    const predictions = this.predictFailures(currentMetrics);

    // Update stored predictions
    predictions.forEach(prediction => {
      this.predictions.set(prediction.id, prediction);
    });

    // Persist predictions
    await this.persistPredictions(predictions);

    // Emit high-risk predictions
    predictions
      .filter(p => p.probability > 0.7 || p.timeToFailure < 24)
      .forEach(prediction => {
        this.emit('highRiskPrediction', prediction);
      });
  }

  /**
   * Predict failures based on current metrics
   */
  private predictFailures(metrics: SystemMetrics): FailurePrediction[] {
    const predictions: FailurePrediction[] = [];

    // CPU failure prediction
    const cpuPrediction = this.predictCPUFailure(metrics);
    if (cpuPrediction) predictions.push(cpuPrediction);

    // Memory failure prediction
    const memoryPrediction = this.predictMemoryFailure(metrics);
    if (memoryPrediction) predictions.push(memoryPrediction);

    // Disk failure prediction
    const diskPrediction = this.predictDiskFailure(metrics);
    if (diskPrediction) predictions.push(diskPrediction);

    // Service failure predictions
    const servicePredictions = this.predictServiceFailures(metrics);
    predictions.push(...servicePredictions);

    // Use ML model for advanced predictions
    if (this.healthModel) {
      const mlPredictions = this.healthModel.predict(metrics);
      predictions.push(...mlPredictions);
    }

    return predictions;
  }

  /**
   * Predict CPU-related failures
   */
  private predictCPUFailure(metrics: SystemMetrics): FailurePrediction | null {
    const recentMetrics = this.historicalMetrics.slice(-60); // Last 5 minutes
    if (recentMetrics.length < 10) return null;

    // Calculate trend
    const cpuUsages = recentMetrics.map(m => m.cpu.usage);
    const trend = this.calculateTrend(cpuUsages);

    // High sustained CPU usage
    const avgCPU = cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length;
    
    if (avgCPU > 85 && trend.slope > 0.5) {
      const timeToFailure = (100 - metrics.cpu.usage) / (trend.slope * 60); // hours

      return {
        id: `cpu-failure-${Date.now()}`,
        component: 'CPU',
        failureType: 'degradation',
        probability: Math.min(0.95, avgCPU / 100 + trend.slope * 0.2),
        timeToFailure: Math.max(0.1, timeToFailure),
        confidence: trend.confidence,
        impactLevel: avgCPU > 95 ? 'critical' : 'high',
        preventiveActions: [
          {
            action: 'Scale up CPU resources',
            priority: 'high',
            estimatedEffort: '5 minutes',
            automatable: true,
            command: 'kubectl scale deployment app --replicas=+2'
          },
          {
            action: 'Identify and optimize CPU-intensive processes',
            priority: 'medium',
            estimatedEffort: '30 minutes',
            automatable: false
          }
        ],
        timestamp: new Date()
      };
    }

    return null;
  }

  /**
   * Predict memory-related failures
   */
  private predictMemoryFailure(metrics: SystemMetrics): FailurePrediction | null {
    const recentMetrics = this.historicalMetrics.slice(-60);
    if (recentMetrics.length < 10) return null;

    const memoryUsages = recentMetrics.map(m => m.memory.percentage);
    const trend = this.calculateTrend(memoryUsages);

    // Memory leak detection
    if (trend.slope > 0.1 && trend.confidence > 0.8) {
      const timeToFailure = (100 - metrics.memory.percentage) / (trend.slope * 60);

      return {
        id: `memory-failure-${Date.now()}`,
        component: 'Memory',
        failureType: 'capacity',
        probability: Math.min(0.9, trend.confidence),
        timeToFailure: Math.max(0.1, timeToFailure),
        confidence: trend.confidence,
        impactLevel: timeToFailure < 6 ? 'critical' : 'high',
        preventiveActions: [
          {
            action: 'Restart memory-intensive services',
            priority: 'high',
            estimatedEffort: '2 minutes',
            automatable: true,
            command: 'systemctl restart app-service'
          },
          {
            action: 'Investigate memory leaks',
            priority: 'high',
            estimatedEffort: '1 hour',
            automatable: false
          },
          {
            action: 'Increase memory allocation',
            priority: 'medium',
            estimatedEffort: '10 minutes',
            automatable: true
          }
        ],
        timestamp: new Date()
      };
    }

    return null;
  }

  /**
   * Predict disk-related failures
   */
  private predictDiskFailure(metrics: SystemMetrics): FailurePrediction | null {
    // Simple disk space prediction
    const diskGrowthRate = this.calculateDiskGrowthRate();
    
    if (diskGrowthRate > 0) {
      const daysUntilFull = (100 - metrics.disk.percentage) / diskGrowthRate;
      const hoursUntilFull = daysUntilFull * 24;

      if (hoursUntilFull < 168) { // Less than 7 days
        return {
          id: `disk-failure-${Date.now()}`,
          component: 'Disk',
          failureType: 'capacity',
          probability: Math.min(0.95, 1 - (hoursUntilFull / 168)),
          timeToFailure: hoursUntilFull,
          confidence: 0.9,
          impactLevel: hoursUntilFull < 24 ? 'critical' : 'high',
          preventiveActions: [
            {
              action: 'Clean up old logs and temporary files',
              priority: 'high',
              estimatedEffort: '15 minutes',
              automatable: true,
              command: 'find /var/log -mtime +7 -delete'
            },
            {
              action: 'Archive old data to cloud storage',
              priority: 'medium',
              estimatedEffort: '1 hour',
              automatable: true
            },
            {
              action: 'Expand disk capacity',
              priority: hoursUntilFull < 48 ? 'high' : 'medium',
              estimatedEffort: '30 minutes',
              automatable: false
            }
          ],
          timestamp: new Date()
        };
      }
    }

    return null;
  }

  /**
   * Predict service failures
   */
  private predictServiceFailures(metrics: SystemMetrics): FailurePrediction[] {
    const predictions: FailurePrediction[] = [];

    // Check service health patterns
    Object.entries(metrics.services).forEach(([service, status]) => {
      if (status === 'degraded') {
        // Service is already degraded, predict potential outage
        predictions.push({
          id: `service-failure-${service}-${Date.now()}`,
          component: service,
          failureType: 'outage',
          probability: 0.6,
          timeToFailure: 2, // 2 hours
          confidence: 0.7,
          impactLevel: service === 'database' ? 'critical' : 'high',
          preventiveActions: [
            {
              action: `Restart ${service} service`,
              priority: 'high',
              estimatedEffort: '5 minutes',
              automatable: true,
              command: `systemctl restart ${service}`
            },
            {
              action: `Check ${service} logs for errors`,
              priority: 'high',
              estimatedEffort: '20 minutes',
              automatable: false
            }
          ],
          timestamp: new Date()
        });
      }
    });

    return predictions;
  }

  /**
   * Calculate trend from time series data
   */
  private calculateTrend(values: number[]): { slope: number; confidence: number } {
    if (values.length < 2) {
      return { slope: 0, confidence: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = values.reduce((sum, y, i) => {
      const predicted = slope * i + (sumY - slope * sumX) / n;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    return {
      slope,
      confidence: Math.max(0, Math.min(1, rSquared))
    };
  }

  /**
   * Calculate disk growth rate
   */
  private calculateDiskGrowthRate(): number {
    const recentMetrics = this.historicalMetrics.slice(-1440); // Last 24 hours
    if (recentMetrics.length < 100) return 0;

    const diskUsages = recentMetrics.map(m => m.disk.percentage);
    const trend = this.calculateTrend(diskUsages);

    // Convert to daily growth rate
    return trend.slope * 288; // 5-minute intervals to daily
  }

  /**
   * Update historical data
   */
  private updateHistoricalData(metrics: SystemMetrics): void {
    this.historicalMetrics.push(metrics);
    
    // Maintain history size
    while (this.historicalMetrics.length > this.MAX_HISTORY_SIZE) {
      this.historicalMetrics.shift();
    }
  }

  /**
   * Persist predictions to database
   */
  private async persistPredictions(predictions: FailurePrediction[]): Promise<void> {
    try {
      const supabase = await createClient();

      for (const prediction of predictions) {
        await supabase.from('ai_predictions').insert({
          prediction_type: 'failure',
          component: prediction.component,
          prediction: {
            failureType: prediction.failureType,
            probability: prediction.probability,
            timeToFailure: prediction.timeToFailure,
            impactLevel: prediction.impactLevel,
            preventiveActions: prediction.preventiveActions
          },
          confidence: prediction.confidence
        });
      }
    } catch (error) {
      console.error('Failed to persist predictions:', error);
    }
  }

  /**
   * Get current predictions
   */
  getCurrentPredictions(): FailurePrediction[] {
    return Array.from(this.predictions.values())
      .filter(p => {
        // Filter out old predictions
        const age = Date.now() - p.timestamp.getTime();
        return age < 3600000; // 1 hour
      })
      .sort((a, b) => b.probability - a.probability);
  }

  /**
   * Get predictions by component
   */
  getPredictionsByComponent(component: string): FailurePrediction[] {
    return this.getCurrentPredictions()
      .filter(p => p.component === component);
  }

  /**
   * Get high-risk predictions
   */
  getHighRiskPredictions(): FailurePrediction[] {
    return this.getCurrentPredictions()
      .filter(p => p.probability > 0.7 || p.timeToFailure < 24);
  }

  /**
   * Stop prediction cycle
   */
  stopPredictions(): void {
    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
      this.predictionInterval = null;
    }
  }

  /**
   * Shutdown the predictor
   */
  async shutdown(): Promise<void> {
    this.stopPredictions();
    this.removeAllListeners();
  }
}

// Export singleton instance
let failurePredictorInstance: FailurePredictor | null = null;

export const getFailurePredictor = async (): Promise<FailurePredictor> => {
  if (!failurePredictorInstance) {
    failurePredictorInstance = new FailurePredictor();
    await failurePredictorInstance.initialize();
  }
  return failurePredictorInstance;
};
