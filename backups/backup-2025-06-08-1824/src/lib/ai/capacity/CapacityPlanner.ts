import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase/server';

interface SystemMetrics {
  timestamp: Date;
  cpu: { usage: number };
  memory: { usedPercent: number };
  disk: { usedPercent: number };
  network: { bandwidth: number };
  requestRate?: number;
}

interface CapacityMetrics {
  cpu: {
    current: number;
    projected: number;
    threshold: number;
  };
  memory: {
    current: number;
    projected: number;
    threshold: number;
  };
  storage: {
    current: number;
    projected: number;
    threshold: number;
  };
  network: {
    current: number;
    projected: number;
    threshold: number;
  };
  requestRate: {
    current: number;
    projected: number;
    maxCapacity: number;
  };
}

interface ScalingRecommendation {
  resource: string;
  action: 'scale-up' | 'scale-down' | 'scale-out' | 'scale-in';
  magnitude: number;
  urgency: 'immediate' | 'scheduled' | 'monitoring';
  estimatedCost: number;
  estimatedTime: number;
  reason: string;
}

interface CapacityPlan {
  id: string;
  timestamp: Date;
  currentCapacity: CapacityMetrics;
  projectedDemand: CapacityMetrics;
  recommendations: ScalingRecommendation[];
  implementationPlan: {
    immediate: ScalingRecommendation[];
    scheduled: ScalingRecommendation[];
    monitoring: ScalingRecommendation[];
  };
  estimatedTotalCost: number;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigationStrategies: string[];
  };
}

export class CapacityPlanner extends EventEmitter {
  private historicalData: Map<string, SystemMetrics[]> = new Map();
  private currentPlan: CapacityPlan | null = null;
  private planningInterval: NodeJS.Timeout | null = null;
  private readonly PLANNING_INTERVAL = 300000; // 5 minutes
  private readonly PROJECTION_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    // Start continuous planning
    await this.startPlanning();
  }

  async startPlanning() {
    // Initial planning
    await this.generateCapacityPlan();

    // Set up continuous planning
    this.planningInterval = setInterval(async () => {
      await this.generateCapacityPlan();
    }, this.PLANNING_INTERVAL);

    this.emit('planning:started');
  }

  async stopPlanning() {
    if (this.planningInterval) {
      clearInterval(this.planningInterval);
      this.planningInterval = null;
    }
    this.emit('planning:stopped');
  }

  private updateHistoricalData(metrics: SystemMetrics) {
    const key = 'system_metrics';
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, []);
    }

    const history = this.historicalData.get(key)!;
    history.push(metrics);

    // Keep only last 7 days of data
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const filtered = history.filter(m => m.timestamp.getTime() > cutoff);
    this.historicalData.set(key, filtered);
  }

  async generateCapacityPlan(): Promise<CapacityPlan> {
    const currentCapacity = await this.getCurrentCapacity();
    const projectedDemand = await this.projectDemand();
    const recommendations = await this.generateRecommendations(currentCapacity, projectedDemand);
    
    const plan: CapacityPlan = {
      id: `cap-${Date.now()}`,
      timestamp: new Date(),
      currentCapacity,
      projectedDemand,
      recommendations,
      implementationPlan: this.categorizeRecommendations(recommendations),
      estimatedTotalCost: this.calculateTotalCost(recommendations),
      riskAssessment: this.assessRisks(currentCapacity, projectedDemand, recommendations)
    };

    this.currentPlan = plan;
    
    // Store plan in database
    await this.storePlan(plan);
    
    // Emit planning event
    this.emit('plan:generated', plan);

    // Check for critical conditions
    this.checkCriticalConditions(plan);

    return plan;
  }

  private async getCurrentCapacity(): Promise<CapacityMetrics> {
    // Simulate getting current metrics - in production this would connect to monitoring
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: { usage: Math.random() * 60 + 20 },
      memory: { usedPercent: Math.random() * 50 + 30 },
      disk: { usedPercent: Math.random() * 40 + 40 },
      network: { bandwidth: Math.random() * 500 + 200 },
      requestRate: Math.random() * 5000 + 1000
    };

    // Update historical data
    this.updateHistoricalData(metrics);
    
    return {
      cpu: {
        current: metrics.cpu.usage,
        projected: metrics.cpu.usage,
        threshold: 80
      },
      memory: {
        current: metrics.memory.usedPercent,
        projected: metrics.memory.usedPercent,
        threshold: 85
      },
      storage: {
        current: metrics.disk.usedPercent,
        projected: metrics.disk.usedPercent,
        threshold: 90
      },
      network: {
        current: metrics.network.bandwidth,
        projected: metrics.network.bandwidth,
        threshold: 1000 // Mbps
      },
      requestRate: {
        current: metrics.requestRate || 0,
        projected: metrics.requestRate || 0,
        maxCapacity: 10000 // requests per second
      }
    };
  }

  private async projectDemand(): Promise<CapacityMetrics> {
    const history = this.historicalData.get('system_metrics') || [];
    
    if (history.length < 100) {
      // Not enough data for accurate projection
      return await this.getCurrentCapacity();
    }

    // Use linear regression for simple projection
    const projections = {
      cpu: this.projectMetric(history, 'cpu'),
      memory: this.projectMetric(history, 'memory'),
      storage: this.projectMetric(history, 'disk'),
      network: this.projectMetric(history, 'network'),
      requestRate: this.projectMetric(history, 'requestRate')
    };

    const current = await this.getCurrentCapacity();

    return {
      cpu: {
        current: current.cpu.current,
        projected: Math.min(100, projections.cpu),
        threshold: current.cpu.threshold
      },
      memory: {
        current: current.memory.current,
        projected: Math.min(100, projections.memory),
        threshold: current.memory.threshold
      },
      storage: {
        current: current.storage.current,
        projected: Math.min(100, projections.storage),
        threshold: current.storage.threshold
      },
      network: {
        current: current.network.current,
        projected: projections.network,
        threshold: current.network.threshold
      },
      requestRate: {
        current: current.requestRate.current,
        projected: projections.requestRate,
        maxCapacity: current.requestRate.maxCapacity
      }
    };
  }

  private projectMetric(history: SystemMetrics[], metricPath: string): number {
    // Simple linear regression
    const values = history.map((h, i) => ({
      x: i,
      y: this.getNestedValue(h, metricPath)
    })).filter(v => v.y !== undefined);

    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = values.reduce((sum, v) => sum + v.x, 0);
    const sumY = values.reduce((sum, v) => sum + v.y, 0);
    const sumXY = values.reduce((sum, v) => sum + v.x * v.y, 0);
    const sumX2 = values.reduce((sum, v) => sum + v.x * v.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Project forward
    const projectionPoint = n + (this.PROJECTION_WINDOW / this.PLANNING_INTERVAL);
    return Math.max(0, slope * projectionPoint + intercept);
  }

  private getNestedValue(obj: SystemMetrics, path: string): number {
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return 0;
      }
    }

    return typeof value === 'number' ? value : 0;
  }

  private async generateRecommendations(
    current: CapacityMetrics,
    projected: CapacityMetrics
  ): Promise<ScalingRecommendation[]> {
    const recommendations: ScalingRecommendation[] = [];

    // CPU recommendations
    if (projected.cpu.projected > projected.cpu.threshold) {
      const magnitude = Math.ceil((projected.cpu.projected - projected.cpu.threshold) / 10);
      recommendations.push({
        resource: 'cpu',
        action: 'scale-up',
        magnitude,
        urgency: projected.cpu.projected > 90 ? 'immediate' : 'scheduled',
        estimatedCost: magnitude * 50, // $50 per vCPU
        estimatedTime: 5, // minutes
        reason: `CPU usage projected to reach ${projected.cpu.projected.toFixed(1)}%`
      });
    }

    // Memory recommendations
    if (projected.memory.projected > projected.memory.threshold) {
      const magnitude = Math.ceil((projected.memory.projected - projected.memory.threshold) / 10);
      recommendations.push({
        resource: 'memory',
        action: 'scale-up',
        magnitude,
        urgency: projected.memory.projected > 95 ? 'immediate' : 'scheduled',
        estimatedCost: magnitude * 30, // $30 per GB
        estimatedTime: 5,
        reason: `Memory usage projected to reach ${projected.memory.projected.toFixed(1)}%`
      });
    }

    // Storage recommendations
    if (projected.storage.projected > projected.storage.threshold) {
      const magnitude = Math.ceil((projected.storage.projected - current.storage.current) * 2);
      recommendations.push({
        resource: 'storage',
        action: 'scale-out',
        magnitude,
        urgency: projected.storage.projected > 95 ? 'immediate' : 'scheduled',
        estimatedCost: magnitude * 10, // $10 per 100GB
        estimatedTime: 15,
        reason: `Storage usage projected to reach ${projected.storage.projected.toFixed(1)}%`
      });
    }

    // Request rate recommendations
    const capacityUtilization = (projected.requestRate.projected / projected.requestRate.maxCapacity) * 100;
    if (capacityUtilization > 80) {
      recommendations.push({
        resource: 'instances',
        action: 'scale-out',
        magnitude: Math.ceil((capacityUtilization - 80) / 20),
        urgency: capacityUtilization > 90 ? 'immediate' : 'scheduled',
        estimatedCost: 200, // $200 per instance
        estimatedTime: 10,
        reason: `Request rate projected to reach ${capacityUtilization.toFixed(1)}% of capacity`
      });
    }

    // Check for scale-down opportunities
    if (current.cpu.current < 30 && projected.cpu.projected < 40) {
      recommendations.push({
        resource: 'cpu',
        action: 'scale-down',
        magnitude: 1,
        urgency: 'monitoring',
        estimatedCost: -50,
        estimatedTime: 5,
        reason: 'CPU underutilized for extended period'
      });
    }

    return recommendations;
  }

  private categorizeRecommendations(recommendations: ScalingRecommendation[]) {
    return {
      immediate: recommendations.filter(r => r.urgency === 'immediate'),
      scheduled: recommendations.filter(r => r.urgency === 'scheduled'),
      monitoring: recommendations.filter(r => r.urgency === 'monitoring')
    };
  }

  private calculateTotalCost(recommendations: ScalingRecommendation[]): number {
    return recommendations.reduce((total, rec) => total + rec.estimatedCost, 0);
  }

  private assessRisks(
    current: CapacityMetrics,
    projected: CapacityMetrics,
    recommendations: ScalingRecommendation[]
  ): CapacityPlan['riskAssessment'] {
    const factors: string[] = [];
    const mitigationStrategies: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check CPU risk
    if (projected.cpu.projected > 90) {
      factors.push('Critical CPU usage projected');
      mitigationStrategies.push('Implement immediate CPU scaling');
      riskLevel = 'high';
    }

    // Check memory risk
    if (projected.memory.projected > 95) {
      factors.push('Critical memory usage projected');
      mitigationStrategies.push('Enable memory swap and scale memory');
      riskLevel = 'high';
    }

    // Check storage risk
    if (projected.storage.projected > 95) {
      factors.push('Critical storage usage projected');
      mitigationStrategies.push('Archive old data and expand storage');
      riskLevel = 'high';
    }

    // Check scaling lag risk
    const immediateActions = recommendations.filter(r => r.urgency === 'immediate');
    if (immediateActions.length > 2) {
      factors.push('Multiple critical scaling needs');
      mitigationStrategies.push('Prioritize scaling actions by impact');
      riskLevel = 'high';
    }

    // Default strategies
    if (mitigationStrategies.length === 0) {
      mitigationStrategies.push('Continue monitoring metrics');
      mitigationStrategies.push('Maintain scaling readiness');
    }

    return {
      level: riskLevel,
      factors,
      mitigationStrategies
    };
  }

  private async storePlan(plan: CapacityPlan) {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('ai_capacity_plans')
        .insert({
          plan_id: plan.id,
          current_capacity: plan.currentCapacity,
          projected_demand: plan.projectedDemand,
          recommendations: plan.recommendations,
          implementation_plan: plan.implementationPlan,
          estimated_cost: plan.estimatedTotalCost,
          risk_assessment: plan.riskAssessment,
          created_at: plan.timestamp
        });

    } catch (error) {
      console.error('Failed to store capacity plan:', error);
    }
  }

  private checkCriticalConditions(plan: CapacityPlan) {
    const immediateActions = plan.implementationPlan.immediate;
    
    if (immediateActions.length > 0) {
      this.emit('critical:scaling-needed', {
        plan,
        actions: immediateActions,
        message: `${immediateActions.length} immediate scaling actions required`
      });
    }

    if (plan.riskAssessment.level === 'high') {
      this.emit('critical:high-risk', {
        plan,
        factors: plan.riskAssessment.factors,
        message: 'High risk capacity situation detected'
      });
    }
  }

  async getCapacityStatus(): Promise<{
    healthy: boolean;
    currentPlan: CapacityPlan | null;
    metrics: CapacityMetrics;
    alerts: string[];
  }> {
    const metrics = await this.getCurrentCapacity();
    const alerts: string[] = [];
    let healthy = true;

    // Check thresholds
    if (metrics.cpu.current > metrics.cpu.threshold) {
      alerts.push(`CPU usage (${metrics.cpu.current.toFixed(1)}%) exceeds threshold`);
      healthy = false;
    }

    if (metrics.memory.current > metrics.memory.threshold) {
      alerts.push(`Memory usage (${metrics.memory.current.toFixed(1)}%) exceeds threshold`);
      healthy = false;
    }

    if (metrics.storage.current > metrics.storage.threshold) {
      alerts.push(`Storage usage (${metrics.storage.current.toFixed(1)}%) exceeds threshold`);
      healthy = false;
    }

    return {
      healthy,
      currentPlan: this.currentPlan,
      metrics,
      alerts
    };
  }

  async implementRecommendation(recommendationId: string): Promise<boolean> {
    if (!this.currentPlan) return false;

    const recommendation = this.currentPlan.recommendations.find(
      r => `${r.resource}-${r.action}` === recommendationId
    );

    if (!recommendation) return false;

    try {
      // Emit implementation event
      this.emit('recommendation:implementing', recommendation);

      // Here you would integrate with your cloud provider's API
      // For now, we'll simulate the implementation
      await this.simulateScalingAction(recommendation);

      this.emit('recommendation:implemented', recommendation);
      return true;
    } catch (error) {
      this.emit('recommendation:failed', { recommendation, error });
      return false;
    }
  }

  private async simulateScalingAction(recommendation: ScalingRecommendation): Promise<void> {
    // Simulate scaling delay
    await new Promise(resolve => setTimeout(resolve, recommendation.estimatedTime * 1000));
    
    // Log the action
    console.log(`Implemented scaling action: ${recommendation.action} ${recommendation.resource} by ${recommendation.magnitude}`);
  }
}
