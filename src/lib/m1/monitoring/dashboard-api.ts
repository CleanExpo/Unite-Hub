/**
 * M1 Dashboard API
 *
 * Provides RESTful API endpoints for real-time monitoring and observability.
 * Integrates metrics, cache statistics, policy decisions, and cost tracking.
 *
 * Phase 9: Production Hardening & Observability Excellence
 */

import { metricsCollector } from "./metrics";
import { costTracker } from "./cost-tracking";
import { alertManager } from "./alerts";
import { agentRunsLogger } from "../logging/agentRuns";
import { cacheEngine } from "../caching/cache-engine";

/**
 * Dashboard metrics response
 */
export interface DashboardMetrics {
  timestamp: number;
  operations: {
    agentRunsTotal: number;
    toolExecutionsTotal: number;
    policyChecksTotal: number;
    cacheHits: number;
    cacheMisses: number;
    cacheEvictions: number;
  };
  performance: {
    avgAgentRunDuration: number;
    avgToolExecutionDuration: number;
    cacheLookupAvg: number;
    cacheHitRate: number;
  };
  errors: {
    toolExecutionErrors: number;
    policyDenials: number;
    errorRate: number;
  };
}

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  timestamp: number;
  local: {
    entries: number;
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
    evictions: number;
  };
  distributed?: {
    connected: boolean;
    uptime?: number;
    usedMemory?: number;
    keyCount?: number;
  };
  combined: {
    totalEntries: number;
    totalSize: number;
    isDistributed: boolean;
  };
}

/**
 * Policy metrics
 */
export interface PolicyMetrics {
  timestamp: number;
  totalChecks: number;
  allowed: number;
  denied: number;
  allowRate: number;
  topDeniedTools: Array<{ tool: string; count: number }>;
  scopeBreakdown: {
    read: number;
    write: number;
    execute: number;
  };
}

/**
 * Cost analysis
 */
export interface CostMetrics {
  timestamp: number;
  totalCost: number;
  breakdown: Record<string, number>;
  estimatedMonthlyCost: number;
  costPerRun: number;
  costTrend: Array<{ period: string; cost: number }>;
}

/**
 * System health status
 */
export interface HealthMetrics {
  timestamp: number;
  status: "healthy" | "degraded" | "critical";
  checks: {
    cacheHealth: { status: string; message: string };
    policyEngine: { status: string; message: string };
    metrics: { status: string; message: string };
    alerts: { status: string; criticalCount: number };
  };
  uptime: number;
  memoryUsage: number;
  activeRuns: number;
}

/**
 * Agent runs summary
 */
export interface AgentRunsSummary {
  timestamp: number;
  total: number;
  completed: number;
  failed: number;
  successRate: number;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  recentRuns: Array<{
    runId: string;
    goal: string;
    status: string;
    duration: number;
    toolCallsExecuted: number;
  }>;
}

/**
 * Dashboard API class for serving metrics and monitoring data
 */
export class DashboardAPI {
  private startTime: number = Date.now();
  private costTrendHistory: Array<{ timestamp: number; cost: number }> = [];
  private lastCostSnapshot: number = 0;

  /**
   * Get overview dashboard metrics
   */
  getMetrics(): DashboardMetrics {
    const metricsData = metricsCollector.exportJSON();
    const cacheStats = cacheEngine.getStats();

    const totalOps = metricsData.counters["agent_runs_total"] || 0;
    const totalToolExecs = metricsData.counters["tool_executions_total"] || 0;
    const totalPolicies = metricsData.counters["policy_checks_total"] || 0;

    const agentRunStats = metricsCollector.getHistogramStats("agent_run_duration_ms");
    const toolExecStats = metricsCollector.getHistogramStats("tool_execution_duration_ms");

    return {
      timestamp: Date.now(),
      operations: {
        agentRunsTotal: totalOps,
        toolExecutionsTotal: totalToolExecs,
        policyChecksTotal: totalPolicies,
        cacheHits: cacheStats.hits,
        cacheMisses: cacheStats.misses,
        cacheEvictions: cacheStats.evictions,
      },
      performance: {
        avgAgentRunDuration: agentRunStats?.avg || 0,
        avgToolExecutionDuration: toolExecStats?.avg || 0,
        cacheLookupAvg: (cacheStats.hits + cacheStats.misses) > 0 ? 1 : 0,
        cacheHitRate: cacheStats.hitRate || 0,
      },
      errors: {
        toolExecutionErrors: metricsData.counters["tool_execution_errors_total"] || 0,
        policyDenials: metricsData.counters["policy_denied_total"] || 0,
        errorRate: totalToolExecs > 0 ?
          (metricsData.counters["tool_execution_errors_total"] || 0) / totalToolExecs : 0,
      },
    };
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics(): CacheMetrics {
    const cacheStats = cacheEngine.getStats();

    return {
      timestamp: Date.now(),
      local: {
        entries: cacheStats.entries,
        size: cacheStats.size,
        hitRate: cacheStats.hitRate,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        evictions: cacheStats.evictions,
      },
      combined: {
        totalEntries: cacheStats.entries,
        totalSize: cacheStats.size,
        isDistributed: false, // Will be true when Redis connected
      },
    };
  }

  /**
   * Get policy enforcement metrics
   */
  getPolicyMetrics(): PolicyMetrics {
    const metricsData = metricsCollector.exportJSON();
    const totalChecks = metricsData.counters["policy_checks_total"] || 0;
    const allowed = metricsData.counters["policy_allowed_total"] || 0;
    const denied = metricsData.counters["policy_denied_total"] || 0;

    return {
      timestamp: Date.now(),
      totalChecks,
      allowed,
      denied,
      allowRate: totalChecks > 0 ? (allowed / totalChecks) * 100 : 0,
      topDeniedTools: this.getTopDeniedTools(metricsData.counters),
      scopeBreakdown: {
        read: metricsData.counters["policy_read_checks"] || 0,
        write: metricsData.counters["policy_write_checks"] || 0,
        execute: metricsData.counters["policy_execute_checks"] || 0,
      },
    };
  }

  /**
   * Get cost metrics
   */
  getCostMetrics(): CostMetrics {
    const totalCost = costTracker.getTotalCost();
    const breakdown = costTracker.getCostBreakdown();

    // Track cost trend
    const now = Date.now();
    if (now - this.lastCostSnapshot > 60000) { // Update every minute
      this.costTrendHistory.push({ timestamp: now, cost: totalCost });
      this.lastCostSnapshot = now;

      // Keep last 60 data points (1 hour)
      if (this.costTrendHistory.length > 60) {
        this.costTrendHistory.shift();
      }
    }

    const metricsData = metricsCollector.exportJSON();
    const totalRuns = metricsData.counters["agent_runs_total"] || 1;
    const costPerRun = totalCost / totalRuns;

    // Estimate monthly cost (assuming similar usage)
    const runtime = (Date.now() - this.startTime) / (1000 * 60 * 60); // hours
    const monthlyProjection = (totalCost / Math.max(runtime, 1)) * (24 * 30);

    return {
      timestamp: Date.now(),
      totalCost,
      breakdown,
      estimatedMonthlyCost: monthlyProjection,
      costPerRun,
      costTrend: this.costTrendHistory.map((entry) => ({
        period: new Date(entry.timestamp).toISOString().split("T")[0],
        cost: entry.cost,
      })),
    };
  }

  /**
   * Get system health status
   */
  getHealthStatus(): HealthMetrics {
    const cacheStats = cacheEngine.getStats();
    const alerts = alertManager.getRecentAlerts(100);
    const metricsData = metricsCollector.exportJSON();

    // Determine overall status
    let status: "healthy" | "degraded" | "critical" = "healthy";
    if (alerts.length > 0) {
      status = alerts.some((a) => a.level === "critical") ? "critical" : "degraded";
    }

    const errorRate = metricsData.counters["tool_execution_errors_total"] || 0;
    if (errorRate > 10) {
      status = "critical";
    } else if (errorRate > 5) {
      status = "degraded";
    }

    const uptime = Date.now() - this.startTime;

    return {
      timestamp: Date.now(),
      status,
      checks: {
        cacheHealth: {
          status: cacheStats.entries > 0 ? "healthy" : "empty",
          message: `${cacheStats.entries} entries, ${cacheStats.hitRate.toFixed(1)}% hit rate`,
        },
        policyEngine: {
          status: "healthy",
          message: `${metricsData.counters["policy_checks_total"] || 0} checks processed`,
        },
        metrics: {
          status: "healthy",
          message: `${Object.keys(metricsData.counters).length} metrics tracked`,
        },
        alerts: {
          status: alerts.length === 0 ? "healthy" : "has-alerts",
          criticalCount: alerts.filter((a) => a.level === "critical").length,
        },
      },
      uptime,
      memoryUsage: cacheStats.size,
      activeRuns: metricsData.counters["agent_runs_total"] || 0,
    };
  }

  /**
   * Get agent runs summary
   */
  getAgentRunsSummary(): AgentRunsSummary {
    const allRuns = agentRunsLogger.getAllRuns();
    const completedRuns = allRuns.filter((r) => r.stopReason === "completed");
    const failedRuns = allRuns.filter((r) => r.stopReason === "error");

    const durations = completedRuns
      .map((r) => r.durationMs || 0)
      .sort((a, b) => a - b);

    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const getPercentile = (percentile: number): number => {
      if (durations.length === 0) {
return 0;
}
      const index = Math.ceil((percentile / 100) * durations.length) - 1;
      return durations[Math.max(0, index)];
    };

    return {
      timestamp: Date.now(),
      total: allRuns.length,
      completed: completedRuns.length,
      failed: failedRuns.length,
      successRate: allRuns.length > 0 ? (completedRuns.length / allRuns.length) * 100 : 0,
      averageDuration: avgDuration,
      medianDuration: getPercentile(50),
      p95Duration: getPercentile(95),
      p99Duration: getPercentile(99),
      recentRuns: allRuns.slice(-10).map((r) => ({
        runId: r.runId,
        goal: r.goal,
        status: r.stopReason,
        duration: r.durationMs || 0,
        toolCallsExecuted: r.toolCallsExecuted,
      })),
    };
  }

  /**
   * Get all dashboard data (complete snapshot)
   */
  getCompleteDashboard() {
    return {
      timestamp: Date.now(),
      overview: this.getMetrics(),
      cache: this.getCacheMetrics(),
      policy: this.getPolicyMetrics(),
      costs: this.getCostMetrics(),
      health: this.getHealthStatus(),
      agentRuns: this.getAgentRunsSummary(),
      alerts: alertManager.getRecentAlerts(20),
    };
  }

  /**
   * Helper: Get top denied tools
   */
  private getTopDeniedTools(counters: Record<string, number>): Array<{ tool: string; count: number }> {
    const toolDenials: Record<string, number> = {};

    for (const [key, value] of Object.entries(counters)) {
      if (key.includes("_denied") && typeof value === "number") {
        const match = key.match(/tool_(\w+)_denied/);
        if (match) {
          toolDenials[match[1]] = value;
        }
      }
    }

    return Object.entries(toolDenials)
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

/**
 * Global dashboard instance
 */
export const dashboardAPI = new DashboardAPI();

/**
 * Export endpoints for HTTP servers
 */
export function createDashboardEndpoints() {
  return {
    "/api/m1/dashboard/metrics": () => dashboardAPI.getMetrics(),
    "/api/m1/dashboard/cache": () => dashboardAPI.getCacheMetrics(),
    "/api/m1/dashboard/policy": () => dashboardAPI.getPolicyMetrics(),
    "/api/m1/dashboard/costs": () => dashboardAPI.getCostMetrics(),
    "/api/m1/dashboard/health": () => dashboardAPI.getHealthStatus(),
    "/api/m1/dashboard/runs": () => dashboardAPI.getAgentRunsSummary(),
    "/api/m1/dashboard": () => dashboardAPI.getCompleteDashboard(),
  };
}
