/**
 * SLA Monitoring System
 * Tracks and reports on Service Level Agreement compliance
 */

import { DatadogClient } from './datadog-client';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'SLAMonitor' });

interface SLADefinition {
  id: string;
  name: string;
  metric: string;
  target_percentage: number; // e.g., 99.9 for 99.9%
  window_hours: number; // rolling window in hours
  measurement_type: 'availability' | 'latency_percentile' | 'success_rate';
  threshold?: number; // For latency SLAs (e.g., 500ms)
  percentile?: number; // For latency SLAs (e.g., 95 for p95)
}

interface SLAStatus {
  id: string;
  name: string;
  is_compliant: boolean;
  current_percentage: number;
  target_percentage: number;
  error_budget_remaining: number; // percentage points remaining
  error_budget_used: number; // percentage of budget used
  time_to_exhaustion_hours?: number; // hours until budget exhausted at current rate
  last_updated: string;
}

interface SLAReport {
  period_start: string;
  period_end: string;
  slas: Array<{
    definition: SLADefinition;
    status: SLAStatus;
    violations: number;
    total_measurements: number;
    breach_windows: Array<{
      start: string;
      end: string;
      duration_minutes: number;
      severity: 'minor' | 'major' | 'critical';
    }>;
  }>;
  summary: {
    total_slas: number;
    compliant: number;
    non_compliant: number;
    overall_health: 'healthy' | 'at_risk' | 'breached';
  };
}

export class SLAMonitor {
  private datadogClient: DatadogClient;
  private slaDefinitions: Map<string, SLADefinition> = new Map();

  constructor(datadogClient: DatadogClient) {
    this.datadogClient = datadogClient;
    this.initializeDefaultSLAs();
  }

  /**
   * Define a new SLA
   */
  defineSLA(
    id: string,
    name: string,
    metric: string,
    targetPercentage: number,
    windowHours: number = 720, // 30 days default
    measurementType: 'availability' | 'latency_percentile' | 'success_rate' = 'availability',
    threshold?: number,
    percentile?: number
  ): void {
    const sla: SLADefinition = {
      id,
      name,
      metric,
      target_percentage: targetPercentage,
      window_hours: windowHours,
      measurement_type: measurementType,
      threshold,
      percentile,
    };

    this.slaDefinitions.set(id, sla);

    logger.info('SLA defined', {
      id,
      name,
      target: `${targetPercentage}%`,
      window: `${windowHours}h`,
    });
  }

  /**
   * Check SLA compliance for a specific metric
   */
  async checkSLACompliance(
    slaId: string,
    metricData?: Array<[number, number]>
  ): Promise<SLAStatus | null> {
    const sla = this.slaDefinitions.get(slaId);

    if (!sla) {
      logger.error('SLA not found', { slaId });
      return null;
    }

    try {
      // Get metric data if not provided
      let data = metricData;
      if (!data) {
        const history = await this.datadogClient.getMetricHistory(
          sla.metric,
          sla.window_hours
        );

        if (!history || !history.series || history.series.length === 0) {
          logger.warn('No metric data for SLA', { slaId, metric: sla.metric });
          return null;
        }

        data = history.series[0].points;
      }

      // Calculate compliance based on measurement type
      let currentPercentage: number;

      switch (sla.measurement_type) {
        case 'availability':
          currentPercentage = this.calculateAvailability(data);
          break;
        case 'latency_percentile':
          currentPercentage = this.calculateLatencySLA(
            data,
            sla.threshold || 500,
            sla.percentile || 95
          );
          break;
        case 'success_rate':
          currentPercentage = this.calculateSuccessRate(data);
          break;
        default:
          currentPercentage = 0;
      }

      const isCompliant = currentPercentage >= sla.target_percentage;

      // Calculate error budget
      const errorBudgetTotal = 100 - sla.target_percentage;
      const errorBudgetUsed = 100 - currentPercentage;
      const errorBudgetRemaining = Math.max(0, errorBudgetTotal - errorBudgetUsed);
      const errorBudgetUsedPercent =
        errorBudgetTotal > 0 ? (errorBudgetUsed / errorBudgetTotal) * 100 : 0;

      // Estimate time to exhaustion
      let timeToExhaustion: number | undefined;
      if (errorBudgetRemaining > 0 && data.length > 1) {
        const burnRate = this.calculateBurnRate(data, sla.target_percentage);
        if (burnRate > 0) {
          timeToExhaustion = (errorBudgetRemaining / burnRate) * sla.window_hours;
        }
      }

      const status: SLAStatus = {
        id: sla.id,
        name: sla.name,
        is_compliant: isCompliant,
        current_percentage: currentPercentage,
        target_percentage: sla.target_percentage,
        error_budget_remaining: errorBudgetRemaining,
        error_budget_used: errorBudgetUsedPercent,
        time_to_exhaustion_hours: timeToExhaustion,
        last_updated: new Date().toISOString(),
      };

      logger.debug('SLA compliance checked', {
        slaId,
        compliant: isCompliant,
        current: currentPercentage.toFixed(3),
        target: sla.target_percentage,
      });

      return status;
    } catch (error) {
      logger.error('Failed to check SLA compliance', { slaId, error });
      return null;
    }
  }

  /**
   * Get status for all SLAs
   */
  async getSLAStatus(): Promise<SLAStatus[]> {
    const statuses: SLAStatus[] = [];

    for (const [slaId] of this.slaDefinitions) {
      const status = await this.checkSLACompliance(slaId);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  /**
   * Generate SLA report for a period
   */
  async generateSLAReport(periodDays: number = 30): Promise<SLAReport> {
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const slaReports = [];
    let compliant = 0;
    let nonCompliant = 0;

    for (const [slaId, sla] of this.slaDefinitions) {
      const status = await this.checkSLACompliance(slaId);

      if (!status) continue;

      if (status.is_compliant) compliant++;
      else nonCompliant++;

      // Get violation windows
      const history = await this.datadogClient.getMetricHistory(sla.metric, periodDays * 24);
      const breachWindows = history ? this.findBreachWindows(history.series[0]?.points || [], sla) : [];

      slaReports.push({
        definition: sla,
        status,
        violations: breachWindows.length,
        total_measurements: history?.series[0]?.points.length || 0,
        breach_windows: breachWindows,
      });
    }

    const totalSLAs = slaReports.length;
    let overallHealth: 'healthy' | 'at_risk' | 'breached' = 'healthy';

    if (nonCompliant > 0) {
      overallHealth = 'breached';
    } else {
      // Check if any SLAs are at risk (>80% error budget used)
      const atRisk = slaReports.some((r) => r.status.error_budget_used > 80);
      if (atRisk) overallHealth = 'at_risk';
    }

    const report: SLAReport = {
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      slas: slaReports,
      summary: {
        total_slas: totalSLAs,
        compliant,
        non_compliant: nonCompliant,
        overall_health: overallHealth,
      },
    };

    logger.info('SLA report generated', {
      period: `${periodDays} days`,
      compliant,
      nonCompliant,
      health: overallHealth,
    });

    return report;
  }

  /**
   * Get SLA definitions
   */
  getSLADefinitions(): SLADefinition[] {
    return Array.from(this.slaDefinitions.values());
  }

  /**
   * Calculate availability from metric data
   */
  private calculateAvailability(data: Array<[number, number]>): number {
    if (data.length === 0) return 100;

    // Assuming 0 = down, 1+ = up
    const upPoints = data.filter((p) => p[1] > 0).length;
    return (upPoints / data.length) * 100;
  }

  /**
   * Calculate latency SLA (% of requests below threshold)
   */
  private calculateLatencySLA(
    data: Array<[number, number]>,
    threshold: number,
    percentile: number
  ): number {
    if (data.length === 0) return 100;

    // Sort values
    const values = data.map((p) => p[1]).sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * values.length);
    const p95Value = values[index];

    // Return compliance percentage (100% if p95 < threshold, scaled otherwise)
    return p95Value <= threshold ? 100 : Math.max(0, 100 - ((p95Value - threshold) / threshold) * 100);
  }

  /**
   * Calculate success rate from metric data
   */
  private calculateSuccessRate(data: Array<[number, number]>): number {
    if (data.length === 0) return 100;

    // Average of success rate values (assuming metric is already a percentage)
    const sum = data.reduce((acc, p) => acc + p[1], 0);
    return sum / data.length;
  }

  /**
   * Calculate current burn rate (error budget % consumed per hour)
   */
  private calculateBurnRate(data: Array<[number, number]>, target: number): number {
    if (data.length < 2) return 0;

    // Use last 10% of data to calculate recent burn rate
    const recentCount = Math.max(2, Math.floor(data.length * 0.1));
    const recentData = data.slice(-recentCount);

    const recentFailures = recentData.filter((p) => p[1] < target).length;
    const failureRate = recentFailures / recentData.length;

    // Convert to error budget burn rate per hour
    const timeSpanHours = (recentData[recentData.length - 1][0] - recentData[0][0]) / 3600;
    return timeSpanHours > 0 ? (failureRate * 100) / timeSpanHours : 0;
  }

  /**
   * Find breach windows in metric data
   */
  private findBreachWindows(
    data: Array<[number, number]>,
    sla: SLADefinition
  ): Array<{ start: string; end: string; duration_minutes: number; severity: 'minor' | 'major' | 'critical' }> {
    const breaches = [];
    let breachStart: number | null = null;

    for (let i = 0; i < data.length; i++) {
      const [timestamp, value] = data[i];
      const isBreach = value < sla.target_percentage;

      if (isBreach && breachStart === null) {
        breachStart = timestamp;
      } else if (!isBreach && breachStart !== null) {
        const duration = (timestamp - breachStart) / 60; // minutes
        let severity: 'minor' | 'major' | 'critical' = 'minor';

        if (duration > 60) severity = 'critical';
        else if (duration > 15) severity = 'major';

        breaches.push({
          start: new Date(breachStart * 1000).toISOString(),
          end: new Date(timestamp * 1000).toISOString(),
          duration_minutes: Math.round(duration),
          severity,
        });

        breachStart = null;
      }
    }

    return breaches;
  }

  /**
   * Initialize default SLAs
   */
  private initializeDefaultSLAs(): void {
    // Uptime SLA: 99.9% monthly
    this.defineSLA(
      'uptime_monthly',
      'System Uptime (Monthly)',
      'health.overall.status',
      99.9,
      720, // 30 days
      'availability'
    );

    // Health check latency: 95th percentile < 500ms
    this.defineSLA(
      'health_latency_p95',
      'Health Check Latency (P95)',
      'health.check.latency_ms',
      95.0,
      168, // 7 days
      'latency_percentile',
      500,
      95
    );

    // Route success rate: 99.5% daily
    this.defineSLA(
      'route_success_daily',
      'Route Success Rate (Daily)',
      'health.routes.success_rate',
      99.5,
      24,
      'success_rate'
    );

    // Verification success: 99.9% daily
    this.defineSLA(
      'verification_success_daily',
      'Verification Success Rate (Daily)',
      'verification.success_rate',
      99.9,
      24,
      'success_rate'
    );

    logger.info('Default SLAs initialized', { count: this.slaDefinitions.size });
  }
}

export default SLAMonitor;
