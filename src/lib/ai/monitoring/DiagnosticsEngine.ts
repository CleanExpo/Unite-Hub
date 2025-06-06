/**
 * DiagnosticsEngine - Advanced system diagnostics and analysis
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 */

import { EventEmitter } from 'events';
import { SystemMonitor, SystemMetrics, SystemAlert } from './SystemMonitor';
import { createClient } from '../../supabase/server';

export interface DiagnosticResult {
  id: string;
  category: 'performance' | 'stability' | 'security' | 'capacity';
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  issue: string;
  recommendation: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface HealthScore {
  overall: number; // 0-100
  performance: number;
  stability: number;
  security: number;
  capacity: number;
  timestamp: Date;
}

export class DiagnosticsEngine extends EventEmitter {
  private systemMonitor: SystemMonitor | null = null;
  private diagnosticHistory: DiagnosticResult[] = [];
  private healthScoreHistory: HealthScore[] = [];
  private readonly MAX_HISTORY_SIZE = 500;

  constructor() {
    super();
  }

  /**
   * Initialize the diagnostics engine
   */
  async initialize(): Promise<void> {
    this.systemMonitor = await SystemMonitor.getInstance();
    
    // Subscribe to system metrics for continuous diagnostics
    this.systemMonitor.onMetrics((metrics) => {
      this.runDiagnostics(metrics);
    });

    // Subscribe to alerts for immediate diagnostics
    this.systemMonitor.onAlert((alert) => {
      this.handleAlert(alert);
    });

    console.log('🔍 Diagnostics Engine initialized');
  }

  /**
   * Run comprehensive diagnostics on system metrics
   */
  private async runDiagnostics(metrics: SystemMetrics): Promise<void> {
    const diagnostics: DiagnosticResult[] = [];

    // Performance diagnostics
    diagnostics.push(...this.diagnosePerformance(metrics));
    
    // Stability diagnostics
    diagnostics.push(...this.diagnoseStability(metrics));
    
    // Security diagnostics
    diagnostics.push(...this.diagnoseSecurity(metrics));
    
    // Capacity diagnostics
    diagnostics.push(...this.diagnoseCapacity(metrics));

    // Calculate health score
    const healthScore = this.calculateHealthScore(metrics, diagnostics);
    
    // Store results
    this.storeDiagnostics(diagnostics);
    this.storeHealthScore(healthScore);

    // Persist to database
    await this.persistDiagnostics(diagnostics, healthScore);

    // Emit events
    diagnostics.forEach(diagnostic => {
      if (diagnostic.severity === 'critical' || diagnostic.severity === 'error') {
        this.emit('issue', diagnostic);
      }
    });

    this.emit('healthScore', healthScore);
  }

  /**
   * Diagnose performance issues
   */
  private diagnosePerformance(metrics: SystemMetrics): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    // CPU performance analysis
    if (metrics.cpu.usage > 70) {
      results.push({
        id: `perf-cpu-${Date.now()}`,
        category: 'performance',
        severity: metrics.cpu.usage > 85 ? 'error' : 'warning',
        component: 'CPU',
        issue: `High CPU usage detected: ${metrics.cpu.usage.toFixed(1)}%`,
        recommendation: 'Consider scaling up compute resources or optimizing CPU-intensive processes',
        metadata: { cpuUsage: metrics.cpu.usage },
        timestamp: new Date()
      });
    }

    // Memory performance analysis
    if (metrics.memory.percentage > 75) {
      results.push({
        id: `perf-mem-${Date.now()}`,
        category: 'performance',
        severity: metrics.memory.percentage > 90 ? 'error' : 'warning',
        component: 'Memory',
        issue: `High memory usage: ${metrics.memory.percentage.toFixed(1)}%`,
        recommendation: 'Review memory allocation, check for memory leaks, or increase available RAM',
        metadata: { memoryUsage: metrics.memory.percentage },
        timestamp: new Date()
      });
    }

    // Network performance analysis
    if (metrics.network.latency > 80) {
      results.push({
        id: `perf-net-${Date.now()}`,
        category: 'performance',
        severity: metrics.network.latency > 150 ? 'error' : 'warning',
        component: 'Network',
        issue: `High network latency: ${metrics.network.latency.toFixed(1)}ms`,
        recommendation: 'Check network connectivity, CDN configuration, or consider edge deployment',
        metadata: { latency: metrics.network.latency },
        timestamp: new Date()
      });
    }

    return results;
  }

  /**
   * Diagnose stability issues
   */
  private diagnoseStability(metrics: SystemMetrics): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    // Service health analysis
    Object.entries(metrics.services).forEach(([service, status]) => {
      if (status !== 'healthy') {
        results.push({
          id: `stab-svc-${service}-${Date.now()}`,
          category: 'stability',
          severity: status === 'down' ? 'critical' : 'error',
          component: service,
          issue: `Service ${service} is ${status}`,
          recommendation: `Investigate ${service} logs and restart if necessary`,
          metadata: { service, status },
          timestamp: new Date()
        });
      }
    });

    // Check for rapid metric fluctuations
    const recentMetrics = this.systemMonitor?.getMetricsHistory().slice(-10) || [];
    if (recentMetrics.length >= 10) {
      const cpuVariance = this.calculateVariance(recentMetrics.map(m => m.cpu.usage));
      if (cpuVariance > 400) { // High variance threshold
        results.push({
          id: `stab-cpu-var-${Date.now()}`,
          category: 'stability',
          severity: 'warning',
          component: 'CPU',
          issue: 'CPU usage is highly unstable',
          recommendation: 'Investigate processes causing CPU spikes',
          metadata: { variance: cpuVariance },
          timestamp: new Date()
        });
      }
    }

    return results;
  }

  /**
   * Diagnose security issues
   */
  private diagnoseSecurity(metrics: SystemMetrics): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    // Check for unusual network activity
    if (metrics.network.errors > 10) {
      results.push({
        id: `sec-net-err-${Date.now()}`,
        category: 'security',
        severity: 'warning',
        component: 'Network',
        issue: `Elevated network errors detected: ${metrics.network.errors}`,
        recommendation: 'Review firewall logs and check for potential security threats',
        metadata: { networkErrors: metrics.network.errors },
        timestamp: new Date()
      });
    }

    return results;
  }

  /**
   * Diagnose capacity issues
   */
  private diagnoseCapacity(metrics: SystemMetrics): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    // Disk capacity analysis
    if (metrics.disk.percentage > 80) {
      results.push({
        id: `cap-disk-${Date.now()}`,
        category: 'capacity',
        severity: metrics.disk.percentage > 90 ? 'critical' : 'warning',
        component: 'Disk',
        issue: `Low disk space: ${metrics.disk.percentage.toFixed(1)}% used`,
        recommendation: 'Clean up unnecessary files or expand storage capacity',
        metadata: { diskUsage: metrics.disk.percentage },
        timestamp: new Date()
      });
    }

    // Memory capacity projection
    const memoryTrend = this.analyzeMemoryTrend();
    if (memoryTrend.projectedFull < 24) { // Hours until full
      results.push({
        id: `cap-mem-trend-${Date.now()}`,
        category: 'capacity',
        severity: memoryTrend.projectedFull < 6 ? 'critical' : 'warning',
        component: 'Memory',
        issue: `Memory projected to be full in ${memoryTrend.projectedFull.toFixed(1)} hours`,
        recommendation: 'Investigate memory growth and plan for scaling',
        metadata: { hoursUntilFull: memoryTrend.projectedFull },
        timestamp: new Date()
      });
    }

    return results;
  }

  /**
   * Handle system alerts
   */
  private async handleAlert(alert: SystemAlert): Promise<void> {
    const diagnostic: DiagnosticResult = {
      id: `alert-${alert.id}-${Date.now()}`,
      category: alert.type === 'performance' ? 'performance' : 
                alert.type === 'security' ? 'security' :
                alert.type === 'availability' ? 'stability' : 'capacity',
      severity: alert.severity === 'critical' ? 'critical' : 
                alert.severity === 'high' ? 'error' : 'warning',
      component: alert.metric.split('.')[0],
      issue: alert.message,
      recommendation: this.generateRecommendation(alert),
      metadata: {
        alertId: alert.id,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold
      },
      timestamp: alert.timestamp
    };

    this.storeDiagnostics([diagnostic]);
    await this.persistDiagnostics([diagnostic]);
    this.emit('issue', diagnostic);
  }

  /**
   * Generate recommendation based on alert
   */
  private generateRecommendation(alert: SystemAlert): string {
    const recommendations: Record<string, string> = {
      'cpu-high-usage': 'Scale compute resources or optimize CPU-intensive operations',
      'memory-high-usage': 'Increase memory allocation or investigate memory leaks',
      'disk-high-usage': 'Clean up disk space or expand storage capacity',
      'network-high-latency': 'Check network configuration and consider CDN optimization'
    };

    return recommendations[alert.id] || 'Investigate the issue and take appropriate action';
  }

  /**
   * Calculate health score
   */
  private calculateHealthScore(metrics: SystemMetrics, diagnostics: DiagnosticResult[]): HealthScore {
    // Base scores
    let performance = 100;
    let stability = 100;
    let security = 100;
    let capacity = 100;

    // Deduct points based on metrics
    performance -= Math.min(50, metrics.cpu.usage > 80 ? (metrics.cpu.usage - 80) * 2 : 0);
    performance -= Math.min(30, metrics.network.latency > 50 ? (metrics.network.latency - 50) * 0.6 : 0);

    stability -= metrics.services.database !== 'healthy' ? 30 : 0;
    stability -= metrics.services.redis !== 'healthy' ? 20 : 0;
    stability -= metrics.services.api !== 'healthy' ? 25 : 0;

    security -= metrics.network.errors > 0 ? Math.min(30, metrics.network.errors * 3) : 0;

    capacity -= Math.min(40, metrics.memory.percentage > 70 ? (metrics.memory.percentage - 70) * 1.3 : 0);
    capacity -= Math.min(40, metrics.disk.percentage > 70 ? (metrics.disk.percentage - 70) * 1.3 : 0);

    // Deduct based on diagnostics
    diagnostics.forEach(diag => {
      const penalty = diag.severity === 'critical' ? 20 : 
                     diag.severity === 'error' ? 10 : 
                     diag.severity === 'warning' ? 5 : 0;

      switch (diag.category) {
        case 'performance': performance -= penalty; break;
        case 'stability': stability -= penalty; break;
        case 'security': security -= penalty; break;
        case 'capacity': capacity -= penalty; break;
      }
    });

    // Ensure scores are within bounds
    performance = Math.max(0, Math.min(100, performance));
    stability = Math.max(0, Math.min(100, stability));
    security = Math.max(0, Math.min(100, security));
    capacity = Math.max(0, Math.min(100, capacity));

    const overall = (performance + stability + security + capacity) / 4;

    return {
      overall,
      performance,
      stability,
      security,
      capacity,
      timestamp: new Date()
    };
  }

  /**
   * Store diagnostics in memory
   */
  private storeDiagnostics(diagnostics: DiagnosticResult[]): void {
    this.diagnosticHistory.push(...diagnostics);
    
    // Maintain history size
    while (this.diagnosticHistory.length > this.MAX_HISTORY_SIZE) {
      this.diagnosticHistory.shift();
    }
  }

  /**
   * Store health score in memory
   */
  private storeHealthScore(score: HealthScore): void {
    this.healthScoreHistory.push(score);
    
    // Maintain history size
    while (this.healthScoreHistory.length > this.MAX_HISTORY_SIZE) {
      this.healthScoreHistory.shift();
    }
  }

  /**
   * Persist diagnostics to database
   */
  private async persistDiagnostics(diagnostics: DiagnosticResult[], healthScore?: HealthScore): Promise<void> {
    try {
      const supabase = await createClient();

      // Store diagnostics as system metrics
      for (const diagnostic of diagnostics) {
        await supabase.from('ai_system_metrics').insert({
          component: 'diagnostics-engine',
          metric_name: `diagnostic-${diagnostic.category}`,
          metric_value: {
            diagnostic: diagnostic,
            severity: diagnostic.severity,
            component: diagnostic.component,
            issue: diagnostic.issue,
            recommendation: diagnostic.recommendation
          }
        });
      }

      // Store health score
      if (healthScore) {
        await supabase.from('ai_system_metrics').insert({
          component: 'diagnostics-engine',
          metric_name: 'health-score',
          metric_value: healthScore
        });
      }
    } catch (error) {
      console.error('Failed to persist diagnostics:', error);
    }
  }

  /**
   * Calculate variance of a numeric array
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Analyze memory trend for capacity planning
   */
  private analyzeMemoryTrend(): { projectedFull: number } {
    const recentMetrics = this.systemMonitor?.getMetricsHistory().slice(-20) || [];
    
    if (recentMetrics.length < 10) {
      return { projectedFull: Infinity };
    }

    // Simple linear regression
    const memoryUsages = recentMetrics.map(m => m.memory.percentage);
    const timePoints = memoryUsages.map((_, i) => i);
    
    const n = memoryUsages.length;
    const sumX = timePoints.reduce((a, b) => a + b, 0);
    const sumY = memoryUsages.reduce((a, b) => a + b, 0);
    const sumXY = timePoints.reduce((sum, x, i) => sum + x * memoryUsages[i], 0);
    const sumX2 = timePoints.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Project when memory will reach 100%
    if (slope <= 0) {
      return { projectedFull: Infinity };
    }

    const currentUsage = memoryUsages[memoryUsages.length - 1];
    const remainingCapacity = 100 - currentUsage;
    const hoursUntilFull = (remainingCapacity / slope) * (5 / 3600); // Convert from 5-second intervals to hours

    return { projectedFull: Math.max(0, hoursUntilFull) };
  }

  /**
   * Get current diagnostics
   */
  getDiagnostics(): DiagnosticResult[] {
    return [...this.diagnosticHistory];
  }

  /**
   * Get current health score
   */
  getCurrentHealthScore(): HealthScore | null {
    return this.healthScoreHistory[this.healthScoreHistory.length - 1] || null;
  }

  /**
   * Get health score history
   */
  getHealthScoreHistory(): HealthScore[] {
    return [...this.healthScoreHistory];
  }

  /**
   * Get diagnostics by severity
   */
  getDiagnosticsBySeverity(severity: DiagnosticResult['severity']): DiagnosticResult[] {
    return this.diagnosticHistory.filter(d => d.severity === severity);
  }

  /**
   * Get diagnostics by category
   */
  getDiagnosticsByCategory(category: DiagnosticResult['category']): DiagnosticResult[] {
    return this.diagnosticHistory.filter(d => d.category === category);
  }
}

// Export singleton instance
let diagnosticsEngineInstance: DiagnosticsEngine | null = null;

export const getDiagnosticsEngine = async (): Promise<DiagnosticsEngine> => {
  if (!diagnosticsEngineInstance) {
    diagnosticsEngineInstance = new DiagnosticsEngine();
    await diagnosticsEngineInstance.initialize();
  }
  return diagnosticsEngineInstance;
};
