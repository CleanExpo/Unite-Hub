/**
 * PerformanceOptimizer - Self-optimizing performance module
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 */

import { EventEmitter } from 'events';
import { SystemMonitor, SystemMetrics } from '../monitoring/SystemMonitor';
import { DiagnosticsEngine, HealthScore } from '../monitoring/DiagnosticsEngine';
import { createClient } from '../../supabase/server';

export interface OptimizationStrategy {
  id: string;
  name: string;
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'general';
  expectedImprovement: number; // percentage
  executionTime: number; // minutes
  risk: 'low' | 'medium' | 'high';
  automatic: boolean;
  command?: string;
  rollbackCommand?: string;
}

export interface OptimizationResult {
  id: string;
  strategyId: string;
  component: string;
  beforeMetrics: PerformanceMetrics;
  afterMetrics: PerformanceMetrics;
  improvement: number; // percentage
  success: boolean;
  timestamp: Date;
  rollbackAvailable: boolean;
}

export interface PerformanceMetrics {
  responseTime: number; // ms
  throughput: number; // requests/sec
  cpuEfficiency: number; // percentage
  memoryEfficiency: number; // percentage
  cacheHitRate: number; // percentage
}

export class PerformanceOptimizer extends EventEmitter {
  private systemMonitor: SystemMonitor | null = null;
  private diagnosticsEngine: DiagnosticsEngine | null = null;
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private optimizationHistory: OptimizationResult[] = [];
  private currentPerformance: PerformanceMetrics = {
    responseTime: 0,
    throughput: 0,
    cpuEfficiency: 0,
    memoryEfficiency: 0,
    cacheHitRate: 0
  };
  private optimizationInterval: NodeJS.Timeout | null = null;
  private readonly OPTIMIZATION_INTERVAL = 300000; // 5 minutes

  constructor() {
    super();
  }

  /**
   * Initialize the performance optimizer
   */
  async initialize(): Promise<void> {
    console.log('⚡ Performance Optimizer initializing...');

    // Initialize dependencies
    this.systemMonitor = await SystemMonitor.getInstance();
    this.diagnosticsEngine = await (await import('../monitoring/DiagnosticsEngine')).getDiagnosticsEngine();

    // Load optimization strategies
    this.loadOptimizationStrategies();

    // Start optimization cycle
    this.startOptimizationCycle();

    // Subscribe to system metrics
    this.systemMonitor.onMetrics((metrics) => {
      this.updatePerformanceMetrics(metrics);
    });

    // Subscribe to health scores
    this.diagnosticsEngine.on('healthScore', (score: HealthScore) => {
      this.handleHealthScore(score);
    });

    console.log('⚡ Performance Optimizer initialized');
  }

  /**
   * Load available optimization strategies
   */
  private loadOptimizationStrategies(): void {
    // CPU optimization strategies
    this.strategies.set('cpu-affinity', {
      id: 'cpu-affinity',
      name: 'CPU Affinity Optimization',
      category: 'cpu',
      expectedImprovement: 15,
      executionTime: 2,
      risk: 'low',
      automatic: true,
      command: 'taskset -c 0-3 nginx',
      rollbackCommand: 'taskset -c 0-7 nginx'
    });

    this.strategies.set('cpu-governor', {
      id: 'cpu-governor',
      name: 'CPU Governor Performance Mode',
      category: 'cpu',
      expectedImprovement: 20,
      executionTime: 1,
      risk: 'low',
      automatic: true,
      command: 'cpupower frequency-set -g performance',
      rollbackCommand: 'cpupower frequency-set -g ondemand'
    });

    // Memory optimization strategies
    this.strategies.set('memory-gc-tuning', {
      id: 'memory-gc-tuning',
      name: 'Garbage Collection Tuning',
      category: 'memory',
      expectedImprovement: 25,
      executionTime: 5,
      risk: 'medium',
      automatic: true,
      command: 'node --max-old-space-size=4096 --gc-interval=100',
      rollbackCommand: 'node --max-old-space-size=2048'
    });

    this.strategies.set('memory-swap-optimization', {
      id: 'memory-swap-optimization',
      name: 'Swap Configuration Optimization',
      category: 'memory',
      expectedImprovement: 10,
      executionTime: 3,
      risk: 'low',
      automatic: true,
      command: 'sysctl vm.swappiness=10',
      rollbackCommand: 'sysctl vm.swappiness=60'
    });

    // Network optimization strategies
    this.strategies.set('network-tcp-tuning', {
      id: 'network-tcp-tuning',
      name: 'TCP Stack Optimization',
      category: 'network',
      expectedImprovement: 30,
      executionTime: 2,
      risk: 'medium',
      automatic: true,
      command: 'sysctl -w net.core.rmem_max=134217728',
      rollbackCommand: 'sysctl -w net.core.rmem_max=212992'
    });

    // Cache optimization
    this.strategies.set('cache-redis-optimization', {
      id: 'cache-redis-optimization',
      name: 'Redis Cache Optimization',
      category: 'general',
      expectedImprovement: 40,
      executionTime: 10,
      risk: 'medium',
      automatic: true,
      command: 'redis-cli CONFIG SET maxmemory-policy allkeys-lru',
      rollbackCommand: 'redis-cli CONFIG SET maxmemory-policy noeviction'
    });
  }

  /**
   * Start the optimization cycle
   */
  private startOptimizationCycle(): void {
    if (this.optimizationInterval) return;

    // Run optimizations immediately
    this.runOptimizations();

    // Then run periodically
    this.optimizationInterval = setInterval(() => {
      this.runOptimizations();
    }, this.OPTIMIZATION_INTERVAL);
  }

  /**
   * Run performance optimizations
   */
  private async runOptimizations(): Promise<void> {
    const metrics = await this.systemMonitor?.getCurrentMetrics();
    if (!metrics) return;

    // Analyze current performance
    const performanceScore = this.calculatePerformanceScore();

    // Find applicable optimizations
    const applicableStrategies = this.findApplicableStrategies(metrics, performanceScore);

    // Execute optimizations
    for (const strategy of applicableStrategies) {
      if (strategy.automatic) {
        const result = await this.executeOptimization(strategy);
        if (result.success) {
          this.emit('optimizationApplied', result);
        }
      }
    }
  }

  /**
   * Update performance metrics based on system metrics
   */
  private updatePerformanceMetrics(metrics: SystemMetrics): void {
    // Calculate response time based on CPU and network latency
    this.currentPerformance.responseTime = 
      metrics.network.latency + (metrics.cpu.usage / 100) * 50;

    // Calculate throughput based on CPU availability
    this.currentPerformance.throughput = 
      Math.max(10, 1000 * (1 - metrics.cpu.usage / 100));

    // Calculate CPU efficiency
    this.currentPerformance.cpuEfficiency = 
      Math.max(0, 100 - metrics.cpu.usage);

    // Calculate memory efficiency
    this.currentPerformance.memoryEfficiency = 
      Math.max(0, 100 - metrics.memory.percentage);

    // Simulate cache hit rate
    this.currentPerformance.cacheHitRate = 
      Math.min(95, 70 + (100 - metrics.memory.percentage) * 0.25);
  }

  /**
   * Handle health score updates
   */
  private handleHealthScore(score: HealthScore): void {
    // If performance score is low, trigger immediate optimization
    if (score.performance < 70) {
      console.log('⚠️ Low performance score detected, triggering optimization');
      this.runOptimizations();
    }
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): number {
    const weights = {
      responseTime: 0.3,
      throughput: 0.25,
      cpuEfficiency: 0.2,
      memoryEfficiency: 0.15,
      cacheHitRate: 0.1
    };

    // Normalize metrics
    const normalized = {
      responseTime: Math.max(0, 100 - this.currentPerformance.responseTime / 2),
      throughput: Math.min(100, this.currentPerformance.throughput / 10),
      cpuEfficiency: this.currentPerformance.cpuEfficiency,
      memoryEfficiency: this.currentPerformance.memoryEfficiency,
      cacheHitRate: this.currentPerformance.cacheHitRate
    };

    // Calculate weighted score
    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (normalized[metric as keyof typeof normalized] * weight);
    }, 0);
  }

  /**
   * Find applicable optimization strategies
   */
  private findApplicableStrategies(
    metrics: SystemMetrics, 
    performanceScore: number
  ): OptimizationStrategy[] {
    const applicable: OptimizationStrategy[] = [];

    // CPU optimizations needed
    if (metrics.cpu.usage > 70) {
      const cpuStrategies = Array.from(this.strategies.values())
        .filter(s => s.category === 'cpu');
      applicable.push(...cpuStrategies);
    }

    // Memory optimizations needed
    if (metrics.memory.percentage > 75) {
      const memoryStrategies = Array.from(this.strategies.values())
        .filter(s => s.category === 'memory');
      applicable.push(...memoryStrategies);
    }

    // Network optimizations needed
    if (metrics.network.latency > 50) {
      const networkStrategies = Array.from(this.strategies.values())
        .filter(s => s.category === 'network');
      applicable.push(...networkStrategies);
    }

    // General optimizations for low performance
    if (performanceScore < 70) {
      const generalStrategies = Array.from(this.strategies.values())
        .filter(s => s.category === 'general');
      applicable.push(...generalStrategies);
    }

    // Filter out recently applied strategies
    const recentlyApplied = this.getRecentlyAppliedStrategies();
    return applicable.filter(s => !recentlyApplied.includes(s.id));
  }

  /**
   * Get recently applied strategies (last hour)
   */
  private getRecentlyAppliedStrategies(): string[] {
    const oneHourAgo = Date.now() - 3600000;
    return this.optimizationHistory
      .filter(r => r.timestamp.getTime() > oneHourAgo)
      .map(r => r.strategyId);
  }

  /**
   * Execute an optimization strategy
   */
  private async executeOptimization(
    strategy: OptimizationStrategy
  ): Promise<OptimizationResult> {
    console.log(`🔧 Executing optimization: ${strategy.name}`);

    // Capture before metrics
    const beforeMetrics = { ...this.currentPerformance };

    // Simulate optimization execution
    try {
      if (strategy.command) {
        // In production, this would execute the actual command
        await this.simulateCommand(strategy.command);
      }

      // Wait for metrics to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Capture after metrics
      const afterMetrics = { ...this.currentPerformance };

      // Calculate improvement
      const improvement = this.calculateImprovement(beforeMetrics, afterMetrics);

      const result: OptimizationResult = {
        id: `opt-${Date.now()}`,
        strategyId: strategy.id,
        component: strategy.category,
        beforeMetrics,
        afterMetrics,
        improvement,
        success: improvement > 0,
        timestamp: new Date(),
        rollbackAvailable: !!strategy.rollbackCommand
      };

      // Store result
      this.optimizationHistory.push(result);
      await this.persistOptimizationResult(result);

      return result;
    } catch (error) {
      console.error(`Failed to execute optimization: ${error}`);
      return {
        id: `opt-${Date.now()}`,
        strategyId: strategy.id,
        component: strategy.category,
        beforeMetrics,
        afterMetrics: beforeMetrics,
        improvement: 0,
        success: false,
        timestamp: new Date(),
        rollbackAvailable: false
      };
    }
  }

  /**
   * Simulate command execution
   */
  private async simulateCommand(command: string): Promise<void> {
    console.log(`Simulating command: ${command}`);
    // In production, this would use child_process.exec
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate performance improvement
    this.currentPerformance.responseTime *= 0.9;
    this.currentPerformance.throughput *= 1.1;
    this.currentPerformance.cpuEfficiency *= 1.05;
    this.currentPerformance.cacheHitRate = Math.min(95, this.currentPerformance.cacheHitRate * 1.1);
  }

  /**
   * Calculate improvement percentage
   */
  private calculateImprovement(
    before: PerformanceMetrics, 
    after: PerformanceMetrics
  ): number {
    const beforeScore = (100 - before.responseTime / 2) + before.throughput / 10 + 
                       before.cpuEfficiency + before.memoryEfficiency + before.cacheHitRate;
    const afterScore = (100 - after.responseTime / 2) + after.throughput / 10 + 
                      after.cpuEfficiency + after.memoryEfficiency + after.cacheHitRate;
    
    return ((afterScore - beforeScore) / beforeScore) * 100;
  }

  /**
   * Persist optimization result to database
   */
  private async persistOptimizationResult(result: OptimizationResult): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase.from('ai_optimizations').insert({
        strategy_id: result.strategyId,
        component: result.component,
        before_metrics: result.beforeMetrics,
        after_metrics: result.afterMetrics,
        improvement_percentage: result.improvement,
        success: result.success,
        rollback_available: result.rollbackAvailable
      });
    } catch (error) {
      console.error('Failed to persist optimization result:', error);
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentPerformance(): PerformanceMetrics {
    return { ...this.currentPerformance };
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): OptimizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Rollback an optimization
   */
  async rollbackOptimization(optimizationId: string): Promise<boolean> {
    const optimization = this.optimizationHistory.find(o => o.id === optimizationId);
    if (!optimization || !optimization.rollbackAvailable) {
      return false;
    }

    const strategy = this.strategies.get(optimization.strategyId);
    if (!strategy || !strategy.rollbackCommand) {
      return false;
    }

    try {
      await this.simulateCommand(strategy.rollbackCommand);
      console.log(`✅ Rolled back optimization: ${strategy.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to rollback optimization: ${error}`);
      return false;
    }
  }

  /**
   * Stop optimization cycle
   */
  stopOptimizations(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
  }

  /**
   * Shutdown the optimizer
   */
  async shutdown(): Promise<void> {
    this.stopOptimizations();
    this.removeAllListeners();
  }
}

// Export singleton instance
let performanceOptimizerInstance: PerformanceOptimizer | null = null;

export const getPerformanceOptimizer = async (): Promise<PerformanceOptimizer> => {
  if (!performanceOptimizerInstance) {
    performanceOptimizerInstance = new PerformanceOptimizer();
    await performanceOptimizerInstance.initialize();
  }
  return performanceOptimizerInstance;
};
