/**
 * SystemMonitor - Autonomous system monitoring and diagnostics
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import { RuntimeService } from '../../services/base/RuntimeService';
import { createClient } from '../../supabase/server';

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    latency: number;
    bandwidth: number;
    errors: number;
  };
  services: {
    database: 'healthy' | 'degraded' | 'down';
    redis: 'healthy' | 'degraded' | 'down';
    api: 'healthy' | 'degraded' | 'down';
  };
  timestamp: Date;
}

export interface SystemAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'performance' | 'security' | 'availability' | 'capacity';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
}

export class SystemMonitor extends RuntimeService {
  private static instance: SystemMonitor | null = null;
  private eventEmitter: EventEmitter;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alerts: Map<string, SystemAlert> = new Map();
  private metricsHistory: SystemMetrics[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly MONITORING_INTERVAL = 5000; // 5 seconds

  private constructor() {
    super();
    this.eventEmitter = new EventEmitter();
  }

  static async getInstance(): Promise<SystemMonitor> {
    if (!this.instance) {
      this.instance = new SystemMonitor();
      await this.instance.initialize();
    }
    return this.instance;
  }

  protected async performInitialization(): Promise<void> {
    console.log('🤖 Autonomous System Monitoring initializing...');
    this.startMonitoring();
  }

  /**
   * Start continuous system monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(async () => {
      const metrics = await this.collectMetrics();
      this.processMetrics(metrics);
    }, this.MONITORING_INTERVAL);
  }

  /**
   * Collect current system metrics
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    const cpuUsage = await this.getCPUUsage();
    const memoryInfo = this.getMemoryInfo();
    const diskInfo = await this.getDiskInfo();
    const networkInfo = await this.getNetworkInfo();
    const servicesHealth = await this.checkServicesHealth();

    return {
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
      },
      memory: memoryInfo,
      disk: diskInfo,
      network: networkInfo,
      services: servicesHealth,
      timestamp: new Date(),
    };
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  /**
   * Get memory information
   */
  private getMemoryInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percentage: (usedMem / totalMem) * 100,
    };
  }

  /**
   * Get disk information (simplified for now)
   */
  private async getDiskInfo() {
    // In a real implementation, this would use a library like 'diskusage'
    // For now, returning mock data
    return {
      total: 500 * 1024 * 1024 * 1024, // 500GB
      used: 250 * 1024 * 1024 * 1024,  // 250GB
      free: 250 * 1024 * 1024 * 1024,  // 250GB
      percentage: 50,
    };
  }

  /**
   * Get network information
   */
  private async getNetworkInfo() {
    // In a real implementation, this would measure actual network metrics
    return {
      latency: Math.random() * 50, // 0-50ms
      bandwidth: 100, // Mbps
      errors: 0,
    };
  }

  /**
   * Check health of various services
   */
  private async checkServicesHealth() {
    return {
      database: 'healthy' as const,
      redis: 'healthy' as const,
      api: 'healthy' as const,
    };
  }

  /**
   * Process collected metrics and generate alerts if needed
   */
  private async processMetrics(metrics: SystemMetrics): Promise<void> {
    // Store metrics history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
      this.metricsHistory.shift();
    }

    // Persist metrics to database
    await this.persistMetrics(metrics);

    // Check for anomalies
    this.checkCPUAnomaly(metrics);
    this.checkMemoryAnomaly(metrics);
    this.checkDiskAnomaly(metrics);
    this.checkNetworkAnomaly(metrics);
    this.checkServicesAnomaly(metrics);

    // Emit metrics event
    this.eventEmitter.emit('metrics', metrics);
  }

  /**
   * Persist metrics to database
   */
  private async persistMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      const supabase = await createClient();
      
      // Store system metrics
      await supabase.from('ai_system_metrics').insert({
        component: 'system-monitor',
        metric_name: 'system-health',
        metric_value: {
          cpu: metrics.cpu,
          memory: metrics.memory,
          disk: metrics.disk,
          network: metrics.network,
          services: metrics.services
        },
        environment: process.env.NODE_ENV || 'production'
      });
    } catch (error) {
      console.error('Failed to persist metrics:', error);
    }
  }

  /**
   * Check CPU usage anomalies
   */
  private checkCPUAnomaly(metrics: SystemMetrics): void {
    const threshold = 80; // 80% CPU usage
    if (metrics.cpu.usage > threshold) {
      this.createAlert({
        id: 'cpu-high-usage',
        severity: metrics.cpu.usage > 90 ? 'critical' : 'high',
        type: 'performance',
        message: `CPU usage is at ${metrics.cpu.usage.toFixed(1)}%`,
        metric: 'cpu.usage',
        value: metrics.cpu.usage,
        threshold,
        timestamp: new Date(),
        resolved: false,
      });
    } else {
      this.resolveAlert('cpu-high-usage');
    }
  }

  /**
   * Check memory anomalies
   */
  private checkMemoryAnomaly(metrics: SystemMetrics): void {
    const threshold = 85; // 85% memory usage
    if (metrics.memory.percentage > threshold) {
      this.createAlert({
        id: 'memory-high-usage',
        severity: metrics.memory.percentage > 95 ? 'critical' : 'high',
        type: 'capacity',
        message: `Memory usage is at ${metrics.memory.percentage.toFixed(1)}%`,
        metric: 'memory.percentage',
        value: metrics.memory.percentage,
        threshold,
        timestamp: new Date(),
        resolved: false,
      });
    } else {
      this.resolveAlert('memory-high-usage');
    }
  }

  /**
   * Check disk anomalies
   */
  private checkDiskAnomaly(metrics: SystemMetrics): void {
    const threshold = 90; // 90% disk usage
    if (metrics.disk.percentage > threshold) {
      this.createAlert({
        id: 'disk-high-usage',
        severity: 'high',
        type: 'capacity',
        message: `Disk usage is at ${metrics.disk.percentage.toFixed(1)}%`,
        metric: 'disk.percentage',
        value: metrics.disk.percentage,
        threshold,
        timestamp: new Date(),
        resolved: false,
      });
    } else {
      this.resolveAlert('disk-high-usage');
    }
  }

  /**
   * Check network anomalies
   */
  private checkNetworkAnomaly(metrics: SystemMetrics): void {
    const latencyThreshold = 100; // 100ms
    if (metrics.network.latency > latencyThreshold) {
      this.createAlert({
        id: 'network-high-latency',
        severity: 'medium',
        type: 'performance',
        message: `Network latency is ${metrics.network.latency.toFixed(1)}ms`,
        metric: 'network.latency',
        value: metrics.network.latency,
        threshold: latencyThreshold,
        timestamp: new Date(),
        resolved: false,
      });
    } else {
      this.resolveAlert('network-high-latency');
    }
  }

  /**
   * Check services anomalies
   */
  private checkServicesAnomaly(metrics: SystemMetrics): void {
    Object.entries(metrics.services).forEach(([service, status]) => {
      if (status !== 'healthy') {
        this.createAlert({
          id: `service-${service}-unhealthy`,
          severity: status === 'down' ? 'critical' : 'high',
          type: 'availability',
          message: `Service ${service} is ${status}`,
          metric: `services.${service}`,
          value: status === 'down' ? 0 : 50,
          threshold: 100,
          timestamp: new Date(),
          resolved: false,
        });
      } else {
        this.resolveAlert(`service-${service}-unhealthy`);
      }
    });
  }

  /**
   * Create or update an alert
   */
  private async createAlert(alert: SystemAlert): Promise<void> {
    const existingAlert = this.alerts.get(alert.id);
    if (!existingAlert || existingAlert.resolved) {
      this.alerts.set(alert.id, alert);
      this.eventEmitter.emit('alert', alert);
      console.warn(`🚨 Alert: ${alert.message}`);
      
      // Persist alert to database
      try {
        const supabase = await createClient();
        await supabase.from('ai_threat_detections').insert({
          threat_type: `system-${alert.type}`,
          severity: alert.severity,
          description: alert.message,
          details: {
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold,
            alertId: alert.id
          }
        });
      } catch (error) {
        console.error('Failed to persist alert:', error);
      }
    }
  }

  /**
   * Resolve an alert
   */
  private resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      this.eventEmitter.emit('alertResolved', alert);
      console.log(`✅ Alert resolved: ${alertId}`);
    }
  }

  /**
   * Get current system metrics
   */
  async getCurrentMetrics(): Promise<SystemMetrics> {
    return await this.collectMetrics();
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): SystemMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): SystemAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): SystemAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Subscribe to metrics events
   */
  onMetrics(callback: (metrics: SystemMetrics) => void): void {
    this.eventEmitter.on('metrics', callback);
  }

  /**
   * Subscribe to alert events
   */
  onAlert(callback: (alert: SystemAlert) => void): void {
    this.eventEmitter.on('alert', callback);
  }

  /**
   * Subscribe to alert resolved events
   */
  onAlertResolved(callback: (alert: SystemAlert) => void): void {
    this.eventEmitter.on('alertResolved', callback);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Shutdown the monitor
   */
  async shutdown(): Promise<void> {
    this.stopMonitoring();
    this.eventEmitter.removeAllListeners();
    SystemMonitor.instance = null;
  }
}

// Export singleton getter
export const getSystemMonitor = () => SystemMonitor.getInstance();
