/**
 * Usage Analytics Service
 *
 * Tracks CLI usage, API calls, and resource consumption:
 * - Command execution metrics
 * - API call volume tracking
 * - Credential operations monitoring
 * - Tenant operations tracking
 * - Error rate analysis
 * - Performance metrics (execution time, latency)
 */

import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';

export interface UsageMetric {
  id?: string;
  timestamp: string;
  workspaceId: string;
  userId?: string;
  metricType: 'command' | 'api_call' | 'credential_op' | 'tenant_op' | 'error';
  metricName: string;
  value: number;
  metadata: Record<string, any>;
}

export interface UsageReport {
  period: { start: string; end: string };
  totalCommands: number;
  totalApiCalls: number;
  totalCredentialOps: number;
  totalTenantOps: number;
  totalErrors: number;
  byCommand: Record<string, number>;
  byService: Record<string, number>;
  byWorkspace: Record<string, number>;
  topErrors: Array<{ error: string; count: number }>;
  performanceMetrics: {
    avgExecutionTime: number;
    p50ExecutionTime: number;
    p95ExecutionTime: number;
    p99ExecutionTime: number;
  };
}

export interface CommandUsageSummary {
  command: string;
  count: number;
  avgExecutionTime: number;
  errorRate: number;
  lastUsed: string;
}

export class UsageAnalyticsService {
  private supabase: any;
  private configManager: ConfigManager;
  private workspaceId: string;

  constructor() {
    this.configManager = new ConfigManager();

    const config = this.configManager.loadConfig();
    if (!config) {
      throw new Error('Synthex not initialized. Run: synthex init');
    }

    this.workspaceId = config.workspace_id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      throw new Error('Supabase credentials not configured');
    }
  }

  /**
   * Track a usage metric
   */
  async trackMetric(metric: Omit<UsageMetric, 'id' | 'timestamp'>): Promise<void> {
    const { error } = await this.supabase.from('usage_metrics').insert({
      workspace_id: metric.workspaceId,
      user_id: metric.userId || null,
      metric_type: metric.metricType,
      metric_name: metric.metricName,
      value: metric.value,
      metadata: metric.metadata,
    });

    if (error) {
      // Log error but don't throw - analytics should not break CLI operations
      console.error('Failed to track metric:', error.message);
    }
  }

  /**
   * Track command execution
   */
  async trackCommand(
    commandName: string,
    executionTime: number,
    success: boolean,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackMetric({
      workspaceId: this.workspaceId,
      metricType: 'command',
      metricName: commandName,
      value: executionTime,
      metadata: {
        ...metadata,
        success,
        executionTime,
      },
    });
  }

  /**
   * Track API call
   */
  async trackApiCall(
    service: string,
    endpoint: string,
    responseTime: number,
    success: boolean,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackMetric({
      workspaceId: this.workspaceId,
      metricType: 'api_call',
      metricName: `${service}:${endpoint}`,
      value: responseTime,
      metadata: {
        ...metadata,
        service,
        endpoint,
        success,
        responseTime,
      },
    });
  }

  /**
   * Track credential operation
   */
  async trackCredentialOp(
    operation: 'create' | 'renew' | 'revoke' | 'cleanup',
    service: string,
    success: boolean,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackMetric({
      workspaceId: this.workspaceId,
      metricType: 'credential_op',
      metricName: `${operation}:${service}`,
      value: 1,
      metadata: {
        ...metadata,
        operation,
        service,
        success,
      },
    });
  }

  /**
   * Track tenant operation
   */
  async trackTenantOp(
    operation: 'create' | 'update' | 'delete' | 'list',
    tenantId: string | null,
    success: boolean,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackMetric({
      workspaceId: this.workspaceId,
      metricType: 'tenant_op',
      metricName: operation,
      value: 1,
      metadata: {
        ...metadata,
        operation,
        tenantId,
        success,
      },
    });
  }

  /**
   * Track error
   */
  async trackError(
    errorType: string,
    errorMessage: string,
    context: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackMetric({
      workspaceId: this.workspaceId,
      metricType: 'error',
      metricName: errorType,
      value: 1,
      metadata: {
        ...metadata,
        errorMessage,
        context,
      },
    });
  }

  /**
   * Get usage report for a time period
   */
  async getReport(
    workspaceId: string,
    period: { start: Date; end: Date }
  ): Promise<UsageReport> {
    // Fetch all metrics in period
    const { data: metrics } = await this.supabase
      .from('usage_metrics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());

    if (!metrics || metrics.length === 0) {
      return this.emptyReport(period);
    }

    // Aggregate metrics
    const totalCommands = metrics.filter((m: any) => m.metric_type === 'command').length;
    const totalApiCalls = metrics.filter((m: any) => m.metric_type === 'api_call').length;
    const totalCredentialOps = metrics.filter((m: any) => m.metric_type === 'credential_op').length;
    const totalTenantOps = metrics.filter((m: any) => m.metric_type === 'tenant_op').length;
    const totalErrors = metrics.filter((m: any) => m.metric_type === 'error').length;

    // By command
    const byCommand: Record<string, number> = {};
    metrics
      .filter((m: any) => m.metric_type === 'command')
      .forEach((m: any) => {
        byCommand[m.metric_name] = (byCommand[m.metric_name] || 0) + 1;
      });

    // By service
    const byService: Record<string, number> = {};
    metrics
      .filter((m: any) => m.metric_type === 'api_call')
      .forEach((m: any) => {
        const service = m.metadata?.service || 'unknown';
        byService[service] = (byService[service] || 0) + 1;
      });

    // By workspace (for multi-workspace reporting)
    const byWorkspace: Record<string, number> = {};
    byWorkspace[workspaceId] = metrics.length;

    // Top errors
    const errorCounts: Record<string, number> = {};
    metrics
      .filter((m: any) => m.metric_type === 'error')
      .forEach((m: any) => {
        const errorMsg = m.metadata?.errorMessage || m.metric_name;
        errorCounts[errorMsg] = (errorCounts[errorMsg] || 0) + 1;
      });

    const topErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Performance metrics
    const executionTimes = metrics
      .filter((m: any) => m.metric_type === 'command' && m.metadata?.executionTime)
      .map((m: any) => m.metadata.executionTime)
      .sort((a: number, b: number) => a - b);

    const performanceMetrics = this.calculatePerformanceMetrics(executionTimes);

    return {
      period: {
        start: period.start.toISOString(),
        end: period.end.toISOString(),
      },
      totalCommands,
      totalApiCalls,
      totalCredentialOps,
      totalTenantOps,
      totalErrors,
      byCommand,
      byService,
      byWorkspace,
      topErrors,
      performanceMetrics,
    };
  }

  /**
   * Get command usage count for a period
   */
  async getCommandUsage(
    commandName: string,
    period: { start: Date; end: Date }
  ): Promise<number> {
    const { count } = await this.supabase
      .from('usage_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', this.workspaceId)
      .eq('metric_type', 'command')
      .eq('metric_name', commandName)
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());

    return count || 0;
  }

  /**
   * Get top commands by usage
   */
  async getTopCommands(workspaceId: string, limit: number = 10): Promise<CommandUsageSummary[]> {
    const { data: metrics } = await this.supabase
      .from('usage_metrics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('metric_type', 'command')
      .order('created_at', { ascending: false })
      .limit(1000); // Get recent 1000 commands

    if (!metrics || metrics.length === 0) {
      return [];
    }

    // Group by command name
    const commandStats: Record<
      string,
      {
        count: number;
        totalTime: number;
        errors: number;
        lastUsed: string;
      }
    > = {};

    for (const metric of metrics) {
      const cmd = metric.metric_name;
      if (!commandStats[cmd]) {
        commandStats[cmd] = {
          count: 0,
          totalTime: 0,
          errors: 0,
          lastUsed: metric.created_at,
        };
      }

      commandStats[cmd].count++;
      commandStats[cmd].totalTime += metric.metadata?.executionTime || 0;
      if (!metric.metadata?.success) {
        commandStats[cmd].errors++;
      }

      // Update last used
      if (new Date(metric.created_at) > new Date(commandStats[cmd].lastUsed)) {
        commandStats[cmd].lastUsed = metric.created_at;
      }
    }

    // Convert to array and calculate averages
    const summaries: CommandUsageSummary[] = Object.entries(commandStats).map(([command, stats]) => ({
      command,
      count: stats.count,
      avgExecutionTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
      errorRate: stats.count > 0 ? stats.errors / stats.count : 0,
      lastUsed: stats.lastUsed,
    }));

    // Sort by count and limit
    return summaries.sort((a, b) => b.count - a.count).slice(0, limit);
  }

  /**
   * Get error rate for a period
   */
  async getErrorRate(
    workspaceId: string,
    period: { start: Date; end: Date }
  ): Promise<number> {
    const { data: allMetrics } = await this.supabase
      .from('usage_metrics')
      .select('metric_type')
      .eq('workspace_id', workspaceId)
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());

    if (!allMetrics || allMetrics.length === 0) {
      return 0;
    }

    const totalOps = allMetrics.length;
    const totalErrors = allMetrics.filter((m: any) => m.metric_type === 'error').length;

    return totalOps > 0 ? totalErrors / totalOps : 0;
  }

  /**
   * Calculate performance metrics from execution times
   */
  private calculatePerformanceMetrics(times: number[]): {
    avgExecutionTime: number;
    p50ExecutionTime: number;
    p95ExecutionTime: number;
    p99ExecutionTime: number;
  } {
    if (times.length === 0) {
      return {
        avgExecutionTime: 0,
        p50ExecutionTime: 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
      };
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    return {
      avgExecutionTime: Math.round(avg),
      p50ExecutionTime: Math.round(p50),
      p95ExecutionTime: Math.round(p95),
      p99ExecutionTime: Math.round(p99),
    };
  }

  /**
   * Create empty report
   */
  private emptyReport(period: { start: Date; end: Date }): UsageReport {
    return {
      period: {
        start: period.start.toISOString(),
        end: period.end.toISOString(),
      },
      totalCommands: 0,
      totalApiCalls: 0,
      totalCredentialOps: 0,
      totalTenantOps: 0,
      totalErrors: 0,
      byCommand: {},
      byService: {},
      byWorkspace: {},
      topErrors: [],
      performanceMetrics: {
        avgExecutionTime: 0,
        p50ExecutionTime: 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
      },
    };
  }
}
