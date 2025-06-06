import { EventEmitter } from 'events';
import { CapacityPlanner } from './CapacityPlanner';

interface ScalingTarget {
  id: string;
  type: 'container' | 'vm' | 'serverless' | 'database';
  resource: string;
  current: {
    instances: number;
    specs: {
      cpu: number;
      memory: number;
      storage?: number;
    };
  };
  target: {
    instances: number;
    specs: {
      cpu: number;
      memory: number;
      storage?: number;
    };
  };
  status: 'pending' | 'scaling' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface ScalingPolicy {
  id: string;
  name: string;
  resource: string;
  triggers: {
    metric: string;
    threshold: number;
    duration: number; // seconds
    action: 'scale-up' | 'scale-down' | 'scale-out' | 'scale-in';
  }[];
  cooldown: number; // seconds
  minInstances: number;
  maxInstances: number;
  stepSize: number;
}

export class ScalingEngine extends EventEmitter {
  private capacityPlanner: CapacityPlanner;
  private activePolicies: Map<string, ScalingPolicy> = new Map();
  private scalingHistory: ScalingTarget[] = [];
  private currentScalingOperations: Map<string, ScalingTarget> = new Map();
  private cooldownTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.capacityPlanner = new CapacityPlanner();
    this.initialize();
  }

  private async initialize() {
    // Listen to capacity planner recommendations
    this.capacityPlanner.on('critical:scaling-needed', async (data) => {
      await this.handleCriticalScaling(data);
    });

    // Load default scaling policies
    await this.loadDefaultPolicies();
  }

  private async loadDefaultPolicies() {
    const defaultPolicies: ScalingPolicy[] = [
      {
        id: 'cpu-autoscale',
        name: 'CPU Auto-scaling',
        resource: 'compute',
        triggers: [
          { metric: 'cpu', threshold: 80, duration: 300, action: 'scale-up' },
          { metric: 'cpu', threshold: 30, duration: 600, action: 'scale-down' }
        ],
        cooldown: 300,
        minInstances: 2,
        maxInstances: 10,
        stepSize: 1
      },
      {
        id: 'memory-autoscale',
        name: 'Memory Auto-scaling',
        resource: 'compute',
        triggers: [
          { metric: 'memory', threshold: 85, duration: 300, action: 'scale-up' },
          { metric: 'memory', threshold: 40, duration: 600, action: 'scale-down' }
        ],
        cooldown: 300,
        minInstances: 2,
        maxInstances: 10,
        stepSize: 1
      },
      {
        id: 'request-autoscale',
        name: 'Request Rate Auto-scaling',
        resource: 'loadbalancer',
        triggers: [
          { metric: 'requestRate', threshold: 8000, duration: 60, action: 'scale-out' },
          { metric: 'requestRate', threshold: 2000, duration: 300, action: 'scale-in' }
        ],
        cooldown: 180,
        minInstances: 2,
        maxInstances: 20,
        stepSize: 2
      }
    ];

    defaultPolicies.forEach(policy => {
      this.activePolicies.set(policy.id, policy);
    });
  }

  async addScalingPolicy(policy: ScalingPolicy): Promise<void> {
    this.activePolicies.set(policy.id, policy);
    this.emit('policy:added', policy);
  }

  async removeScalingPolicy(policyId: string): Promise<void> {
    const policy = this.activePolicies.get(policyId);
    if (policy) {
      this.activePolicies.delete(policyId);
      this.emit('policy:removed', policy);
    }
  }

  private async handleCriticalScaling(data: { actions: Array<{ resource: string; action: string; magnitude: number; reason: string }> }) {
    const { actions } = data;
    
    for (const action of actions) {
      await this.executeScalingAction(action);
    }
  }

  async executeScalingAction(action: { resource: string; action: string; magnitude: number; reason: string }): Promise<void> {
    const target: ScalingTarget = {
      id: `scale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.determineTargetType(action.resource),
      resource: action.resource,
      current: await this.getCurrentResourceState(action.resource),
      target: await this.calculateTargetState(action),
      status: 'pending'
    };

    // Check if we're in cooldown
    if (this.isInCooldown(action.resource)) {
      this.emit('scaling:cooldown', {
        resource: action.resource,
        message: 'Scaling action delayed due to cooldown period'
      });
      return;
    }

    // Add to current operations
    this.currentScalingOperations.set(target.id, target);
    
    // Start scaling
    target.status = 'scaling';
    target.startTime = new Date();
    this.emit('scaling:started', target);

    try {
      // Execute the scaling operation
      await this.performScaling(target);
      
      // Mark as completed
      target.status = 'completed';
      target.endTime = new Date();
      
      // Start cooldown
      this.startCooldown(action.resource);
      
      // Add to history
      this.scalingHistory.push(target);
      
      // Remove from current operations
      this.currentScalingOperations.delete(target.id);
      
      this.emit('scaling:completed', target);
    } catch (error) {
      target.status = 'failed';
      target.endTime = new Date();
      target.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.scalingHistory.push(target);
      this.currentScalingOperations.delete(target.id);
      
      this.emit('scaling:failed', target);
    }
  }

  private determineTargetType(resource: string): ScalingTarget['type'] {
    switch (resource) {
      case 'cpu':
      case 'memory':
      case 'instances':
        return 'container';
      case 'database':
        return 'database';
      case 'function':
        return 'serverless';
      default:
        return 'vm';
    }
  }

  private async getCurrentResourceState(_resource: string): Promise<ScalingTarget['current']> {
    // In production, this would query your infrastructure API
    return {
      instances: Math.floor(Math.random() * 5) + 2,
      specs: {
        cpu: 2,
        memory: 4,
        storage: 100
      }
    };
  }

  private async calculateTargetState(action: { resource: string; action: string; magnitude: number; reason: string }): Promise<ScalingTarget['target']> {
    const current = await this.getCurrentResourceState(action.resource);
    
    switch (action.action) {
      case 'scale-up':
        return {
          instances: current.instances,
          specs: {
            cpu: current.specs.cpu + action.magnitude,
            memory: current.specs.memory,
            storage: current.specs.storage
          }
        };
      case 'scale-down':
        return {
          instances: current.instances,
          specs: {
            cpu: Math.max(1, current.specs.cpu - action.magnitude),
            memory: current.specs.memory,
            storage: current.specs.storage
          }
        };
      case 'scale-out':
        return {
          instances: current.instances + action.magnitude,
          specs: current.specs
        };
      case 'scale-in':
        return {
          instances: Math.max(1, current.instances - action.magnitude),
          specs: current.specs
        };
      default:
        return current;
    }
  }

  private isInCooldown(resource: string): boolean {
    return this.cooldownTimers.has(resource);
  }

  private startCooldown(resource: string, duration: number = 300000) {
    // Clear existing cooldown if any
    const existingTimer = this.cooldownTimers.get(resource);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new cooldown
    const timer = setTimeout(() => {
      this.cooldownTimers.delete(resource);
      this.emit('cooldown:ended', { resource });
    }, duration);

    this.cooldownTimers.set(resource, timer);
    this.emit('cooldown:started', { resource, duration });
  }

  private async performScaling(target: ScalingTarget): Promise<void> {
    // Simulate scaling operation
    const duration = Math.random() * 10000 + 5000; // 5-15 seconds
    
    await new Promise(resolve => setTimeout(resolve, duration));

    // In production, this would:
    // 1. Call cloud provider API
    // 2. Update load balancer configuration
    // 3. Wait for health checks
    // 4. Verify scaling completion

    console.log(`Scaled ${target.resource} from`, target.current, 'to', target.target);
  }

  async evaluatePolicies(metrics: { cpu?: { usage: number }; memory?: { usedPercent: number }; requestRate?: number }): Promise<void> {
    for (const [, policy] of this.activePolicies) {
      for (const trigger of policy.triggers) {
        const metricValue = this.getMetricValue(metrics, trigger.metric);
        
        if (this.shouldTriggerScaling(metricValue, trigger)) {
          const action = {
            resource: policy.resource,
            action: trigger.action,
            magnitude: policy.stepSize,
            reason: `${trigger.metric} reached ${metricValue} (threshold: ${trigger.threshold})`
          };

          await this.executeScalingAction(action);
        }
      }
    }
  }

  private getMetricValue(metrics: { cpu?: { usage: number }; memory?: { usedPercent: number }; requestRate?: number }, metricName: string): number {
    // Extract metric value from metrics object
    switch (metricName) {
      case 'cpu':
        return metrics.cpu?.usage || 0;
      case 'memory':
        return metrics.memory?.usedPercent || 0;
      case 'requestRate':
        return metrics.requestRate || 0;
      default:
        return 0;
    }
  }

  private shouldTriggerScaling(
    metricValue: number,
    trigger: ScalingPolicy['triggers'][0]
  ): boolean {
    // In production, you would track metric history
    // and only trigger if threshold exceeded for duration
    switch (trigger.action) {
      case 'scale-up':
      case 'scale-out':
        return metricValue > trigger.threshold;
      case 'scale-down':
      case 'scale-in':
        return metricValue < trigger.threshold;
      default:
        return false;
    }
  }

  async getScalingStatus(): Promise<{
    activeOperations: ScalingTarget[];
    recentHistory: ScalingTarget[];
    policies: ScalingPolicy[];
    cooldowns: string[];
  }> {
    return {
      activeOperations: Array.from(this.currentScalingOperations.values()),
      recentHistory: this.scalingHistory.slice(-10),
      policies: Array.from(this.activePolicies.values()),
      cooldowns: Array.from(this.cooldownTimers.keys())
    };
  }

  async simulateLoad(pattern: 'spike' | 'gradual' | 'wave'): Promise<void> {
    let metrics: { cpu?: { usage: number }; memory?: { usedPercent: number }; requestRate?: number };

    switch (pattern) {
      case 'spike':
        metrics = {
          cpu: { usage: 95 },
          memory: { usedPercent: 88 },
          requestRate: 9500
        };
        break;
      case 'gradual':
        for (let i = 0; i < 10; i++) {
          metrics = {
            cpu: { usage: 30 + i * 5 },
            memory: { usedPercent: 40 + i * 4 },
            requestRate: 2000 + i * 600
          };
          await this.evaluatePolicies(metrics);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        return;
      case 'wave':
        for (let i = 0; i < 20; i++) {
          const wave = Math.sin(i * 0.3) * 0.5 + 0.5;
          metrics = {
            cpu: { usage: 20 + wave * 60 },
            memory: { usedPercent: 30 + wave * 50 },
            requestRate: 1000 + wave * 8000
          };
          await this.evaluatePolicies(metrics);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return;
    }

    if (metrics) {
      await this.evaluatePolicies(metrics);
    }
  }

  destroy() {
    // Clear all cooldown timers
    for (const timer of this.cooldownTimers.values()) {
      clearTimeout(timer);
    }
    this.cooldownTimers.clear();
    
    // Stop capacity planner
    if (this.capacityPlanner) {
      this.capacityPlanner.stopPlanning();
    }
  }
}
