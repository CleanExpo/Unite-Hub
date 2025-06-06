/**
 * ResourceAllocator - Intelligent resource allocation and scaling
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 */

import { getSystemMonitor, SystemMetrics } from '../monitoring/SystemMonitor';
import { getFailurePredictor } from '../predictive/FailurePredictor';
import { RuntimeService } from '../../services/base/RuntimeService';
import { EventEmitter } from 'events';

export interface ResourceAllocation {
  cpu: {
    cores: number;
    frequency: number; // MHz
    quota: number; // percentage
  };
  memory: {
    allocated: number; // MB
    maxLimit: number; // MB
    swapLimit: number; // MB
  };
  disk: {
    iops: number;
    bandwidth: number; // MB/s
    quota: number; // GB
  };
  network: {
    bandwidth: number; // Mbps
    priority: 'low' | 'normal' | 'high';
  };
}

export interface AllocationRequest {
  id: string;
  service: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  requirements: Partial<ResourceAllocation>;
  flexibility: number; // 0-1, how flexible the requirements are
  duration?: number; // hours, undefined = permanent
}

export interface AllocationResult {
  requestId: string;
  allocated: ResourceAllocation;
  satisfaction: number; // 0-1, how well requirements were met
  timestamp: Date;
  status: 'allocated' | 'partial' | 'failed';
  reason?: string;
}

export class ResourceAllocator extends RuntimeService {
  private static instance: ResourceAllocator | null = null;
  private eventEmitter: EventEmitter;
  private monitor: Awaited<ReturnType<typeof getSystemMonitor>> | null = null;
  private predictor: Awaited<ReturnType<typeof getFailurePredictor>> | null = null;
  private currentAllocations: Map<string, AllocationResult> = new Map();
  private allocationRequests: Map<string, AllocationRequest> = new Map();
  private totalResources: ResourceAllocation;
  private availableResources: ResourceAllocation;
  
  private readonly REBALANCE_INTERVAL = 60000; // 1 minute
  private rebalanceInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.eventEmitter = new EventEmitter();
    this.totalResources = this.detectSystemResources();
    this.availableResources = { ...this.totalResources };
  }

  static async getInstance(): Promise<ResourceAllocator> {
    if (!this.instance) {
      this.instance = new ResourceAllocator();
      await this.instance.initialize();
    }
    return this.instance;
  }

  protected async performInitialization(): Promise<void> {
    console.log('🔄 Resource Allocator initializing...');
    this.monitor = await getSystemMonitor();
    this.predictor = await getFailurePredictor();
    this.startRebalancing();
  }

  /**
   * Detect total system resources
   */
  private detectSystemResources(): ResourceAllocation {
    // In a real implementation, would detect actual system resources
    return {
      cpu: {
        cores: 8,
        frequency: 3600,
        quota: 100,
      },
      memory: {
        allocated: 16384, // 16GB
        maxLimit: 16384,
        swapLimit: 8192,
      },
      disk: {
        iops: 10000,
        bandwidth: 500,
        quota: 500, // 500GB
      },
      network: {
        bandwidth: 1000,
        priority: 'normal',
      },
    };
  }

  /**
   * Start resource rebalancing
   */
  private startRebalancing(): void {
    if (this.rebalanceInterval) return;

    this.rebalanceInterval = setInterval(() => {
      this.rebalanceResources();
    }, this.REBALANCE_INTERVAL);
  }

  /**
   * Rebalance resources based on current usage and predictions
   */
  private async rebalanceResources(): Promise<void> {
    if (!this.monitor || !this.predictor) return;

    const metrics = await this.monitor.getCurrentMetrics();
    const predictions = this.predictor.getActivePredictions();

    // Identify underutilized allocations
    const underutilized = this.identifyUnderutilizedAllocations(metrics);
    
    // Identify resource pressure points
    const pressurePoints = this.identifyPressurePoints(metrics, predictions);
    
    // Rebalance if needed
    if (underutilized.length > 0 || pressurePoints.length > 0) {
      this.performRebalancing(underutilized, pressurePoints);
    }
  }

  /**
   * Allocate resources for a request
   */
  async allocateResources(request: AllocationRequest): Promise<AllocationResult> {
    // Store the request
    this.allocationRequests.set(request.id, request);

    // Check if resources are available
    const canAllocate = this.checkResourceAvailability(request.requirements);
    
    if (!canAllocate.possible) {
      // Try to free up resources
      const freed = await this.attemptResourceFreeing(request);
      if (!freed) {
        return {
          requestId: request.id,
          allocated: this.createEmptyAllocation(),
          satisfaction: 0,
          timestamp: new Date(),
          status: 'failed',
          reason: canAllocate.reason,
        };
      }
    }

    // Calculate optimal allocation
    const allocation = this.calculateOptimalAllocation(request);
    
    // Apply allocation
    this.applyAllocation(request.id, allocation);
    
    const result: AllocationResult = {
      requestId: request.id,
      allocated: allocation,
      satisfaction: this.calculateSatisfaction(request.requirements, allocation),
      timestamp: new Date(),
      status: 'allocated',
    };

    this.currentAllocations.set(request.id, result);
    this.eventEmitter.emit('resourceAllocated', result);
    
    console.log(`✅ Allocated resources for ${request.service} (${request.id})`);
    
    return result;
  }

  /**
   * Check resource availability
   */
  private checkResourceAvailability(requirements: Partial<ResourceAllocation>): {
    possible: boolean;
    reason?: string;
  } {
    const available = this.availableResources;
    
    if (requirements.cpu) {
      if (requirements.cpu.cores > available.cpu.cores) {
        return { possible: false, reason: 'Insufficient CPU cores' };
      }
      if (requirements.cpu.quota > available.cpu.quota) {
        return { possible: false, reason: 'Insufficient CPU quota' };
      }
    }

    if (requirements.memory) {
      if (requirements.memory.allocated > available.memory.allocated) {
        return { possible: false, reason: 'Insufficient memory' };
      }
    }

    if (requirements.disk) {
      if (requirements.disk.quota > available.disk.quota) {
        return { possible: false, reason: 'Insufficient disk space' };
      }
    }

    return { possible: true };
  }

  /**
   * Attempt to free resources
   */
  private async attemptResourceFreeing(request: AllocationRequest): Promise<boolean> {
    // Find low-priority allocations that can be reduced
    const candidates = Array.from(this.currentAllocations.entries())
      .filter(([_, allocation]) => {
        const allocRequest = this.allocationRequests.get(allocation.requestId);
        return allocRequest && allocRequest.priority < request.priority;
      })
      .sort((a, b) => {
        const aPriority = this.getPriorityValue(this.allocationRequests.get(a[1].requestId)?.priority || 'low');
        const bPriority = this.getPriorityValue(this.allocationRequests.get(b[1].requestId)?.priority || 'low');
        return aPriority - bPriority;
      });

    // Try to reduce allocations
    for (const [id, _] of candidates) {
      const reduced = this.reduceAllocation(id, 0.2); // Reduce by 20%
      if (reduced) {
        const available = this.checkResourceAvailability(request.requirements);
        if (available.possible) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculate optimal allocation
   */
  private calculateOptimalAllocation(request: AllocationRequest): ResourceAllocation {
    const requirements = request.requirements;
    const available = this.availableResources;
    
    return {
      cpu: {
        cores: Math.min(requirements.cpu?.cores || 1, available.cpu.cores),
        frequency: Math.min(requirements.cpu?.frequency || 2400, available.cpu.frequency),
        quota: Math.min(requirements.cpu?.quota || 25, available.cpu.quota),
      },
      memory: {
        allocated: Math.min(requirements.memory?.allocated || 1024, available.memory.allocated),
        maxLimit: Math.min(requirements.memory?.maxLimit || 2048, available.memory.maxLimit),
        swapLimit: Math.min(requirements.memory?.swapLimit || 512, available.memory.swapLimit),
      },
      disk: {
        iops: Math.min(requirements.disk?.iops || 1000, available.disk.iops),
        bandwidth: Math.min(requirements.disk?.bandwidth || 50, available.disk.bandwidth),
        quota: Math.min(requirements.disk?.quota || 10, available.disk.quota),
      },
      network: {
        bandwidth: Math.min(requirements.network?.bandwidth || 100, available.network.bandwidth),
        priority: requirements.network?.priority || 'normal',
      },
    };
  }

  /**
   * Apply allocation
   */
  private applyAllocation(requestId: string, allocation: ResourceAllocation): void {
    // Update available resources
    this.availableResources.cpu.cores -= allocation.cpu.cores;
    this.availableResources.cpu.quota -= allocation.cpu.quota;
    this.availableResources.memory.allocated -= allocation.memory.allocated;
    this.availableResources.disk.quota -= allocation.disk.quota;
    this.availableResources.network.bandwidth -= allocation.network.bandwidth;
  }

  /**
   * Calculate satisfaction score
   */
  private calculateSatisfaction(
    requirements: Partial<ResourceAllocation>,
    allocated: ResourceAllocation
  ): number {
    let totalScore = 0;
    let components = 0;

    if (requirements.cpu) {
      components++;
      const cpuScore = 
        (allocated.cpu.cores / (requirements.cpu.cores || 1)) * 0.5 +
        (allocated.cpu.quota / (requirements.cpu.quota || 25)) * 0.5;
      totalScore += Math.min(1, cpuScore);
    }

    if (requirements.memory) {
      components++;
      const memScore = allocated.memory.allocated / (requirements.memory.allocated || 1024);
      totalScore += Math.min(1, memScore);
    }

    if (requirements.disk) {
      components++;
      const diskScore = allocated.disk.quota / (requirements.disk.quota || 10);
      totalScore += Math.min(1, diskScore);
    }

    if (requirements.network) {
      components++;
      const netScore = allocated.network.bandwidth / (requirements.network.bandwidth || 100);
      totalScore += Math.min(1, netScore);
    }

    return components > 0 ? totalScore / components : 0;
  }

  /**
   * Identify underutilized allocations
   */
  private identifyUnderutilizedAllocations(metrics: SystemMetrics): string[] {
    const underutilized: string[] = [];
    
    // This is a simplified check - in production would analyze actual usage
    this.currentAllocations.forEach((allocation, id) => {
      const request = this.allocationRequests.get(id);
      if (request && request.flexibility > 0.5) {
        // If flexible and system is under pressure, mark as underutilized
        if (metrics.cpu.usage > 80 || metrics.memory.percentage > 85) {
          underutilized.push(id);
        }
      }
    });

    return underutilized;
  }

  /**
   * Identify resource pressure points
   */
  private identifyPressurePoints(
    metrics: SystemMetrics,
    predictions: ReturnType<typeof getFailurePredictor.prototype.getActivePredictions>
  ): string[] {
    const pressurePoints: string[] = [];

    if (metrics.cpu.usage > 85) pressurePoints.push('cpu');
    if (metrics.memory.percentage > 90) pressurePoints.push('memory');
    if (metrics.disk.percentage > 95) pressurePoints.push('disk');

    // Check predictions
    predictions.forEach(prediction => {
      if (prediction.type === 'cpu' && prediction.timeToFailure < 2) {
        pressurePoints.push('cpu-predicted');
      }
      if (prediction.type === 'memory' && prediction.timeToFailure < 2) {
        pressurePoints.push('memory-predicted');
      }
    });

    return [...new Set(pressurePoints)];
  }

  /**
   * Perform rebalancing
   */
  private performRebalancing(underutilized: string[], pressurePoints: string[]): void {
    console.log(`🔄 Rebalancing resources - ${underutilized.length} underutilized, ${pressurePoints.length} pressure points`);

    // Reduce underutilized allocations
    underutilized.forEach(id => {
      this.reduceAllocation(id, 0.1); // Reduce by 10%
    });

    // If critical pressure, reduce more aggressively
    if (pressurePoints.includes('cpu-predicted') || pressurePoints.includes('memory-predicted')) {
      underutilized.forEach(id => {
        this.reduceAllocation(id, 0.2); // Additional 20% reduction
      });
    }

    this.eventEmitter.emit('rebalancingComplete', {
      underutilized,
      pressurePoints,
      timestamp: new Date(),
    });
  }

  /**
   * Reduce allocation
   */
  private reduceAllocation(id: string, percentage: number): boolean {
    const allocation = this.currentAllocations.get(id);
    const request = this.allocationRequests.get(id);
    
    if (!allocation || !request || request.flexibility < percentage) {
      return false;
    }

    const reduction = {
      cpu: {
        cores: Math.floor(allocation.allocated.cpu.cores * percentage),
        quota: allocation.allocated.cpu.quota * percentage,
      },
      memory: {
        allocated: Math.floor(allocation.allocated.memory.allocated * percentage),
      },
      disk: {
        quota: allocation.allocated.disk.quota * percentage,
      },
      network: {
        bandwidth: allocation.allocated.network.bandwidth * percentage,
      },
    };

    // Apply reduction
    allocation.allocated.cpu.cores -= reduction.cpu.cores;
    allocation.allocated.cpu.quota -= reduction.cpu.quota;
    allocation.allocated.memory.allocated -= reduction.memory.allocated;
    allocation.allocated.disk.quota -= reduction.disk.quota;
    allocation.allocated.network.bandwidth -= reduction.network.bandwidth;

    // Return resources to available pool
    this.availableResources.cpu.cores += reduction.cpu.cores;
    this.availableResources.cpu.quota += reduction.cpu.quota;
    this.availableResources.memory.allocated += reduction.memory.allocated;
    this.availableResources.disk.quota += reduction.disk.quota;
    this.availableResources.network.bandwidth += reduction.network.bandwidth;

    console.log(`📉 Reduced allocation for ${request.service} by ${percentage * 100}%`);
    
    return true;
  }

  /**
   * Get priority value
   */
  private getPriorityValue(priority: AllocationRequest['priority']): number {
    const values = { low: 1, normal: 2, high: 3, critical: 4 };
    return values[priority];
  }

  /**
   * Create empty allocation
   */
  private createEmptyAllocation(): ResourceAllocation {
    return {
      cpu: { cores: 0, frequency: 0, quota: 0 },
      memory: { allocated: 0, maxLimit: 0, swapLimit: 0 },
      disk: { iops: 0, bandwidth: 0, quota: 0 },
      network: { bandwidth: 0, priority: 'low' },
    };
  }

  /**
   * Release resources
   */
  async releaseResources(requestId: string): Promise<void> {
    const allocation = this.currentAllocations.get(requestId);
    if (!allocation) return;

    // Return resources to available pool
    this.availableResources.cpu.cores += allocation.allocated.cpu.cores;
    this.availableResources.cpu.quota += allocation.allocated.cpu.quota;
    this.availableResources.memory.allocated += allocation.allocated.memory.allocated;
    this.availableResources.disk.quota += allocation.allocated.disk.quota;
    this.availableResources.network.bandwidth += allocation.allocated.network.bandwidth;

    // Remove allocation
    this.currentAllocations.delete(requestId);
    this.allocationRequests.delete(requestId);

    console.log(`🔓 Released resources for ${requestId}`);
    this.eventEmitter.emit('resourceReleased', requestId);
  }

  /**
   * Get current allocations
   */
  getCurrentAllocations(): AllocationResult[] {
    return Array.from(this.currentAllocations.values());
  }

  /**
   * Get resource utilization
   */
  getResourceUtilization(): {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  } {
    return {
      cpu: 1 - (this.availableResources.cpu.quota / this.totalResources.cpu.quota),
      memory: 1 - (this.availableResources.memory.allocated / this.totalResources.memory.allocated),
      disk: 1 - (this.availableResources.disk.quota / this.totalResources.disk.quota),
      network: 1 - (this.availableResources.network.bandwidth / this.totalResources.network.bandwidth),
    };
  }

  /**
   * Subscribe to allocation events
   */
  onResourceAllocated(callback: (result: AllocationResult) => void): void {
    this.eventEmitter.on('resourceAllocated', callback);
  }

  /**
   * Subscribe to release events
   */
  onResourceReleased(callback: (requestId: string) => void): void {
    this.eventEmitter.on('resourceReleased', callback);
  }

  /**
   * Subscribe to rebalancing events
   */
  onRebalancingComplete(callback: (info: {
    underutilized: string[];
    pressurePoints: string[];
    timestamp: Date;
  }) => void): void {
    this.eventEmitter.on('rebalancingComplete', callback);
  }

  /**
   * Stop rebalancing
   */
  stopRebalancing(): void {
    if (this.rebalanceInterval) {
      clearInterval(this.rebalanceInterval);
      this.rebalanceInterval = null;
    }
  }

  /**
   * Shutdown the allocator
   */
  async shutdown(): Promise<void> {
    this.stopRebalancing();
    this.eventEmitter.removeAllListeners();
    this.currentAllocations.clear();
    this.allocationRequests.clear();
    ResourceAllocator.instance = null;
  }
}

// Export singleton getter
export const getResourceAllocator = () => ResourceAllocator.getInstance();
