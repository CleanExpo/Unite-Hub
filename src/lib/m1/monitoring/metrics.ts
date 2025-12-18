/**
 * M1 Metrics Collection
 *
 * Collects and aggregates metrics for M1 agent operations.
 * Supports counters, gauges, and histograms with Prometheus export.
 */

/**
 * Metrics collector for M1 agent operations
 */
export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private gauges: Map<string, number> = new Map();

  /**
   * Increment counter
   */
  incrementCounter(metric: string, value: number = 1): void {
    const current = this.counters.get(metric) || 0;
    this.counters.set(metric, current + value);
  }

  /**
   * Record gauge value
   */
  setGauge(metric: string, value: number): void {
    this.gauges.set(metric, value);
  }

  /**
   * Record histogram value (for durations, response times, etc)
   */
  recordHistogram(metric: string, value: number): void {
    const values = this.histograms.get(metric) || [];
    values.push(value);
    this.histograms.set(metric, values);
  }

  /**
   * Get counter value
   */
  getCounter(metric: string): number {
    return this.counters.get(metric) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(metric: string): number {
    return this.gauges.get(metric) || 0;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(metric: string): {
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.histograms.get(metric);
    if (!values || values.length === 0) {
return null;
}

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;

    return {
      count: sorted.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Export all metrics as JSON
   */
  exportJSON(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, any>;
  } {
    const histogramStats: Record<string, any> = {};
    for (const [key, values] of this.histograms.entries()) {
      const stats = this.getHistogramStats(key);
      if (stats) {
        histogramStats[key] = stats;
      }
    }

    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: histogramStats,
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    let output = "";

    // Counters - don't add _total if already present
    for (const [key, value] of this.counters.entries()) {
      const metricName = key.endsWith("_total") ? key : `${key}_total`;
      output += `m1_${metricName} ${value}\n`;
    }

    // Gauges
    for (const [key, value] of this.gauges.entries()) {
      output += `m1_${key} ${value}\n`;
    }

    // Histogram percentiles
    for (const [key, values] of this.histograms.entries()) {
      const stats = this.getHistogramStats(key);
      if (stats) {
        output += `m1_${key}_count ${stats.count}\n`;
        output += `m1_${key}_sum ${stats.sum}\n`;
        output += `m1_${key}_min ${stats.min}\n`;
        output += `m1_${key}_max ${stats.max}\n`;
        output += `m1_${key}_avg ${stats.avg}\n`;
        output += `m1_${key}_p50 ${stats.p50}\n`;
        output += `m1_${key}_p95 ${stats.p95}\n`;
        output += `m1_${key}_p99 ${stats.p99}\n`;
      }
    }

    return output;
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

/**
 * Global metrics collector instance
 */
export const metricsCollector = new MetricsCollector();

/**
 * Track agent run completion
 */
export function trackAgentRun(
  runId: string,
  durationMs: number,
  stopReason: string,
  toolCallsProposed: number,
  toolCallsExecuted: number
): void {
  metricsCollector.incrementCounter("agent_runs_total");
  metricsCollector.incrementCounter(`agent_runs_${stopReason}`);
  metricsCollector.recordHistogram("agent_run_duration_ms", durationMs);
  metricsCollector.recordHistogram("tool_calls_proposed", toolCallsProposed);
  metricsCollector.recordHistogram("tool_calls_executed", toolCallsExecuted);
}

/**
 * Track tool execution
 */
export function trackToolExecution(
  toolName: string,
  durationMs: number,
  success: boolean,
  scope?: string
): void {
  metricsCollector.incrementCounter("tool_executions_total");
  metricsCollector.incrementCounter(`tool_${toolName}_executions_total`);
  metricsCollector.recordHistogram(`tool_${toolName}_duration_ms`, durationMs);

  if (!success) {
    metricsCollector.incrementCounter("tool_execution_errors_total");
    metricsCollector.incrementCounter(`tool_${toolName}_errors_total`);
  }

  if (scope) {
    metricsCollector.incrementCounter(`tool_${scope}_scope_executions_total`);
  }
}

/**
 * Track policy decision
 */
export function trackPolicyDecision(
  allowed: boolean,
  scope?: string,
  reason?: string
): void {
  metricsCollector.incrementCounter("policy_checks_total");
  metricsCollector.incrementCounter(
    `policy_${allowed ? "allowed" : "denied"}_total`
  );

  if (scope) {
    metricsCollector.incrementCounter(`policy_${scope}_scope_checks_total`);
  }

  if (reason && !allowed) {
    metricsCollector.incrementCounter(`policy_denial_${reason}`);
  }
}

/**
 * Track approval request
 */
export function trackApprovalRequest(scope: string): void {
  metricsCollector.incrementCounter("approval_requests_total");
  metricsCollector.incrementCounter(`approval_${scope}_requests_total`);
}

/**
 * Track approval grant
 */
export function trackApprovalGrant(): void {
  metricsCollector.incrementCounter("approval_grants_total");
}

/**
 * Track approval denial
 */
export function trackApprovalDenial(): void {
  metricsCollector.incrementCounter("approval_denials_total");
}

/**
 * Track Claude API call
 */
export function trackClaudeAPICall(
  inputTokens: number,
  outputTokens: number
): void {
  metricsCollector.incrementCounter("claude_api_calls_total");
  metricsCollector.recordHistogram("claude_input_tokens", inputTokens);
  metricsCollector.recordHistogram("claude_output_tokens", outputTokens);
}

/**
 * Set current active runs gauge
 */
export function setActiveRunsGauge(count: number): void {
  metricsCollector.setGauge("active_runs", count);
}

/**
 * Get all metrics
 */
export function getMetrics(): {
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, any>;
} {
  return metricsCollector.exportJSON();
}

/**
 * Export metrics in Prometheus format
 */
export function exportMetricsPrometheus(): string {
  return metricsCollector.exportPrometheus();
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics(): void {
  metricsCollector.reset();
}
