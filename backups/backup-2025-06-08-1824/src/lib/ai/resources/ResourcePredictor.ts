/**
 * ResourcePredictor - AI-driven resource prediction and allocation
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 * Phase 1 Task 9: Predictive Resource Allocation
 */

import { RuntimeService } from '../../services/base/RuntimeService';
import { getSystemMonitor, SystemMetrics } from '../monitoring/SystemMonitor';
import { getEfficiencyAnalyzer } from '../workflow/EfficiencyAnalyzer';

export interface ResourcePrediction {
  id: string;
  resourceType: 'cpu' | 'memory' | 'network' | 'storage' | 'database' | 'cache';
  currentUsage: number;
  predictedUsage: number;
  timeHorizon: number; // minutes into future
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  seasonality: {
    detected: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | null;
    peakTimes: string[];
  };
  recommendations: ResourceRecommendation[];
  timestamp: Date;
}

export interface ResourceRecommendation {
  id: string;
  type: 'scale-up' | 'scale-down' | 'optimize' | 'redistribute' | 'cache' | 'preload';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedImpact: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  costImplication: number; // positive = cost, negative = savings
  timeToImplement: number; // minutes
  expires: Date;
}

export interface ResourceCapacity {
  resourceType: string;
  current: number;
  maximum: number;
  utilization: number;
  healthy: boolean;
  threshold: {
    warning: number;
    critical: number;
  };
}

export class ResourcePredictor extends RuntimeService {
  private static instance: ResourcePredictor | null = null;
  private monitor: Awaited<ReturnType<typeof getSystemMonitor>> | null = null;
  private efficiencyAnalyzer: Awaited<ReturnType<typeof getEfficiencyAnalyzer>> | null = null;
  private predictions: Map<string, ResourcePrediction> = new Map();
  private historicalData: SystemMetrics[] = [];
  private capacityLimits: Map<string, ResourceCapacity> = new Map();
  
  private readonly PREDICTION_INTERVAL = 120000; // 2 minutes
  private readonly HISTORY_RETENTION = 1000; // Keep 1000 data points
  private predictionInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.initializeCapacityLimits();
  }

  static async getInstance(): Promise<ResourcePredictor> {
    if (!this.instance) {
      this.instance = new ResourcePredictor();
      await this.instance.initialize();
    }
    return this.instance;
  }

  protected async performInitialization(): Promise<void> {
    console.log('🔮 Resource Predictor initializing...');
    this.monitor = await getSystemMonitor();
    this.efficiencyAnalyzer = await getEfficiencyAnalyzer();
    this.startPrediction();
  }

  private initializeCapacityLimits(): void {
    const capacities: ResourceCapacity[] = [
      {
        resourceType: 'cpu',
        current: 0,
        maximum: 100,
        utilization: 0,
        healthy: true,
        threshold: { warning: 70, critical: 90 }
      },
      {
        resourceType: 'memory',
        current: 0,
        maximum: 100,
        utilization: 0,
        healthy: true,
        threshold: { warning: 80, critical: 95 }
      },
      {
        resourceType: 'network',
        current: 0,
        maximum: 1000, // Mbps
        utilization: 0,
        healthy: true,
        threshold: { warning: 70, critical: 85 }
      },
      {
        resourceType: 'storage',
        current: 0,
        maximum: 100,
        utilization: 0,
        healthy: true,
        threshold: { warning: 85, critical: 95 }
      },
      {
        resourceType: 'database',
        current: 0,
        maximum: 1000, // connections
        utilization: 0,
        healthy: true,
        threshold: { warning: 75, critical: 90 }
      },
      {
        resourceType: 'cache',
        current: 0,
        maximum: 100,
        utilization: 0,
        healthy: true,
        threshold: { warning: 80, critical: 90 }
      }
    ];

    capacities.forEach(capacity => {
      this.capacityLimits.set(capacity.resourceType, capacity);
    });
  }

  private startPrediction(): void {
    if (this.predictionInterval) return;

    // Run immediate prediction
    this.performPrediction();

    // Schedule regular predictions
    this.predictionInterval = setInterval(() => {
      this.performPrediction();
    }, this.PREDICTION_INTERVAL);
  }

  private async performPrediction(): Promise<void> {
    if (!this.monitor) return;

    const currentMetrics = await this.monitor.getCurrentMetrics();
    this.historicalData.push(currentMetrics);

    // Keep only recent history
    if (this.historicalData.length > this.HISTORY_RETENTION) {
      this.historicalData = this.historicalData.slice(-this.HISTORY_RETENTION);
    }

    // Generate predictions for each resource type
    const resourceTypes: Array<ResourcePrediction['resourceType']> = [
      'cpu', 'memory', 'network', 'storage', 'database', 'cache'
    ];

    resourceTypes.forEach(resourceType => {
      const prediction = this.generatePrediction(resourceType, currentMetrics);
      this.predictions.set(`${resourceType}_${Date.now()}`, prediction);
    });

    // Clean up old predictions
    this.cleanupOldPredictions();

    console.log(`🔮 Generated ${resourceTypes.length} resource predictions`);
  }

  private generatePrediction(
    resourceType: ResourcePrediction['resourceType'],
    currentMetrics: SystemMetrics
  ): ResourcePrediction {
    const currentUsage = this.getCurrentUsage(resourceType, currentMetrics);
    const historicalUsage = this.getHistoricalUsage(resourceType);
    
    // Apply prediction algorithms
    const linearTrend = this.calculateLinearTrend(historicalUsage);
    const seasonality = this.detectSeasonality(historicalUsage);
    const volatility = this.calculateVolatility(historicalUsage);
    
    // Predict usage 30 minutes ahead
    const timeHorizon = 30;
    const predictedUsage = this.predictFutureUsage(
      currentUsage,
      linearTrend,
      seasonality,
      timeHorizon
    );

    // Calculate confidence based on volatility and data quality
    const confidence = Math.max(0.5, 1 - (volatility / 100));

    const prediction: ResourcePrediction = {
      id: `pred_${resourceType}_${Date.now()}`,
      resourceType,
      currentUsage,
      predictedUsage,
      timeHorizon,
      confidence,
      trend: this.determineTrend(linearTrend),
      seasonality,
      recommendations: this.generateRecommendations(resourceType, currentUsage, predictedUsage),
      timestamp: new Date()
    };

    return prediction;
  }

  private getCurrentUsage(
    resourceType: ResourcePrediction['resourceType'],
    metrics: SystemMetrics
  ): number {
    switch (resourceType) {
      case 'cpu':
        return metrics.cpu.usage;
      case 'memory':
        return metrics.memory.percentage;
      case 'network':
        return metrics.network.latency; // Simplified
      case 'storage':
        return Math.random() * 100; // Simulated
      case 'database':
        return Math.random() * 100; // Simulated
      case 'cache':
        return Math.random() * 100; // Simulated
      default:
        return 0;
    }
  }

  private getHistoricalUsage(resourceType: ResourcePrediction['resourceType']): number[] {
    return this.historicalData.map(metrics => this.getCurrentUsage(resourceType, metrics));
  }

  private calculateLinearTrend(data: number[]): number {
    if (data.length < 2) return 0;

    const n = data.length;
    const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
    const sumY = data.reduce((sum, value) => sum + value, 0);
    const sumXY = data.reduce((sum, value, index) => sum + (index * value), 0);
    const sumX2 = data.reduce((sum, _, index) => sum + (index * index), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private detectSeasonality(data: number[]): ResourcePrediction['seasonality'] {
    if (data.length < 24) {
      return { detected: false, pattern: null, peakTimes: [] };
    }

    // Simplified seasonality detection
    const hourlyAverages = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    data.forEach((value, index) => {
      const hour = index % 24;
      hourlyAverages[hour] += value;
      hourlyCounts[hour]++;
    });

    // Calculate averages
    hourlyAverages.forEach((sum, hour) => {
      hourlyAverages[hour] = hourlyCounts[hour] > 0 ? sum / hourlyCounts[hour] : 0;
    });

    // Find peaks (values above average)
    const overallAverage = hourlyAverages.reduce((sum, val) => sum + val, 0) / 24;
    const peakTimes: string[] = [];

    hourlyAverages.forEach((avg, hour) => {
      if (avg > overallAverage * 1.2) { // 20% above average
        peakTimes.push(`${hour}:00-${hour + 1}:00`);
      }
    });

    return {
      detected: peakTimes.length > 0,
      pattern: 'daily', // Simplified to daily pattern
      peakTimes
    };
  }

  private calculateVolatility(data: number[]): number {
    if (data.length < 2) return 0;

    const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
    const standardDeviation = Math.sqrt(variance);

    return (standardDeviation / mean) * 100; // Coefficient of variation as percentage
  }

  private predictFutureUsage(
    current: number,
    trend: number,
    seasonality: ResourcePrediction['seasonality'],
    timeHorizon: number
  ): number {
    let predicted = current + (trend * timeHorizon);

    // Apply seasonality adjustment
    if (seasonality.detected && seasonality.peakTimes.length > 0) {
      const currentHour = new Date().getHours();
      const futureHour = (currentHour + Math.floor(timeHorizon / 60)) % 24;
      const isPeakTime = seasonality.peakTimes.some(peak => {
        const [start] = peak.split(':');
        return parseInt(start) === futureHour;
      });

      if (isPeakTime) {
        predicted *= 1.3; // 30% increase during peak times
      }
    }

    return Math.max(0, Math.min(100, predicted));
  }

  private determineTrend(slope: number): ResourcePrediction['trend'] {
    if (Math.abs(slope) < 0.1) return 'stable';
    if (slope > 2) return 'volatile';
    if (slope > 0) return 'increasing';
    return 'decreasing';
  }

  private generateRecommendations(
    resourceType: ResourcePrediction['resourceType'],
    current: number,
    predicted: number
  ): ResourceRecommendation[] {
    const recommendations: ResourceRecommendation[] = [];
    const capacity = this.capacityLimits.get(resourceType);

    if (!capacity) return recommendations;

    // Critical threshold breach prediction
    if (predicted > capacity.threshold.critical) {
      recommendations.push({
        id: `rec_${Date.now()}_critical`,
        type: 'scale-up',
        priority: 'critical',
        description: `${resourceType} predicted to exceed critical threshold (${capacity.threshold.critical}%). Immediate scaling required.`,
        estimatedImpact: 90,
        implementationComplexity: 'medium',
        costImplication: 100,
        timeToImplement: 5,
        expires: new Date(Date.now() + 300000) // 5 minutes
      });
    }

    // Warning threshold prediction
    if (predicted > capacity.threshold.warning && predicted <= capacity.threshold.critical) {
      recommendations.push({
        id: `rec_${Date.now()}_warning`,
        type: 'optimize',
        priority: 'high',
        description: `${resourceType} approaching warning threshold. Consider optimization.`,
        estimatedImpact: 60,
        implementationComplexity: 'low',
        costImplication: 20,
        timeToImplement: 10,
        expires: new Date(Date.now() + 900000) // 15 minutes
      });
    }

    // Under-utilization detection
    if (predicted < 30 && current < 30) {
      recommendations.push({
        id: `rec_${Date.now()}_underutil`,
        type: 'scale-down',
        priority: 'medium',
        description: `${resourceType} consistently under-utilized. Consider scaling down to reduce costs.`,
        estimatedImpact: 40,
        implementationComplexity: 'low',
        costImplication: -50, // Cost savings
        timeToImplement: 15,
        expires: new Date(Date.now() + 1800000) // 30 minutes
      });
    }

    // Caching opportunities
    if (resourceType === 'database' && predicted > 70) {
      recommendations.push({
        id: `rec_${Date.now()}_cache`,
        type: 'cache',
        priority: 'medium',
        description: 'High database usage predicted. Implement aggressive caching strategy.',
        estimatedImpact: 50,
        implementationComplexity: 'medium',
        costImplication: 30,
        timeToImplement: 20,
        expires: new Date(Date.now() + 3600000) // 1 hour
      });
    }

    return recommendations;
  }

  private cleanupOldPredictions(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    Array.from(this.predictions.entries()).forEach(([key, prediction]) => {
      if (now - prediction.timestamp.getTime() > maxAge) {
        this.predictions.delete(key);
      }
    });
  }

  async getCurrentPredictions(resourceType?: ResourcePrediction['resourceType']): Promise<ResourcePrediction[]> {
    const predictions = Array.from(this.predictions.values());
    
    if (resourceType) {
      return predictions.filter(p => p.resourceType === resourceType);
    }

    return predictions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getActiveRecommendations(priority?: ResourceRecommendation['priority']): Promise<ResourceRecommendation[]> {
    const allRecommendations: ResourceRecommendation[] = [];
    const now = new Date();

    this.predictions.forEach(prediction => {
      const activeRecs = prediction.recommendations.filter(rec => rec.expires > now);
      allRecommendations.push(...activeRecs);
    });

    if (priority) {
      return allRecommendations.filter(rec => rec.priority === priority);
    }

    return allRecommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async getResourceHealth(): Promise<Record<string, { status: 'healthy' | 'warning' | 'critical'; score: number }>> {
    const health: Record<string, { status: 'healthy' | 'warning' | 'critical'; score: number }> = {};

    this.capacityLimits.forEach((capacity, resourceType) => {
      const recentPredictions = Array.from(this.predictions.values())
        .filter(p => p.resourceType === resourceType)
        .slice(-5); // Last 5 predictions

      if (recentPredictions.length === 0) {
        health[resourceType] = { status: 'healthy', score: 100 };
        return;
      }

      const avgPredicted = recentPredictions.reduce((sum, p) => sum + p.predictedUsage, 0) / recentPredictions.length;
      
      let status: 'healthy' | 'warning' | 'critical';
      if (avgPredicted > capacity.threshold.critical) {
        status = 'critical';
      } else if (avgPredicted > capacity.threshold.warning) {
        status = 'warning';
      } else {
        status = 'healthy';
      }

      const score = Math.max(0, 100 - avgPredicted);
      health[resourceType] = { status, score };
    });

    return health;
  }

  stopPrediction(): void {
    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
      this.predictionInterval = null;
    }
  }

  async shutdown(): Promise<void> {
    this.stopPrediction();
    this.predictions.clear();
    this.historicalData = [];
    this.capacityLimits.clear();
    ResourcePredictor.instance = null;
  }
}

// Export singleton getter
export const getResourcePredictor = () => ResourcePredictor.getInstance();
