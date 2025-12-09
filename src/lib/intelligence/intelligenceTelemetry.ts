/**
 * Intelligence Telemetry
 *
 * Tracks metrics across the intelligence system:
 * - Agent performance (latency, throughput, error rates)
 * - Insight quality (confidence, accuracy)
 * - System utilization
 * - Decision accuracy over time
 */

export interface IntelligenceMetric {
  id: string;
  timestamp: string;
  agent: string;
  metric: string;
  value: number;
  unit?: string;
  meta?: Record<string, any>;
}

// In-memory metrics store (would use time-series database in production)
let metrics: IntelligenceMetric[] = [];

/**
 * Record a metric
 */
export function recordMetric(m: Omit<IntelligenceMetric, 'id' | 'timestamp'>): IntelligenceMetric {
  const record: IntelligenceMetric = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...m,
  };
  metrics.push(record);
  return record;
}

/**
 * Get metrics with filtering
 */
export function getMetrics(opts?: {
  agent?: string;
  metric?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}): IntelligenceMetric[] {
  let res = metrics;

  if (opts?.agent) {
res = res.filter(m => m.agent === opts.agent);
}
  if (opts?.metric) {
res = res.filter(m => m.metric === opts.metric);
}

  if (opts?.since) {
    const sinceTime = opts.since.getTime();
    res = res.filter(m => new Date(m.timestamp).getTime() >= sinceTime);
  }

  if (opts?.until) {
    const untilTime = opts.until.getTime();
    res = res.filter(m => new Date(m.timestamp).getTime() <= untilTime);
  }

  // Sort by recency
  res = res.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return res.slice(0, opts?.limit ?? 100);
}

/**
 * Get average metric value
 */
export function getAverageMetric(agent: string, metric: string, timeWindowMinutes = 60): number | null {
  const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  const values = getMetrics({ agent, metric, since });

  if (values.length === 0) {
return null;
}
  return values.reduce((sum, m) => sum + m.value, 0) / values.length;
}

/**
 * Get metric percentile
 */
export function getMetricPercentile(agent: string, metric: string, percentile: number, timeWindowMinutes = 60): number | null {
  const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  const values = getMetrics({ agent, metric, since }).map(m => m.value).sort((a, b) => a - b);

  if (values.length === 0) {
return null;
}
  const index = Math.ceil((percentile / 100) * values.length) - 1;
  return values[Math.max(0, index)];
}

/**
 * Get metric trends (comparing two time windows)
 */
export function getMetricTrend(agent: string, metric: string, windowSizeMinutes = 60) {
  const now = new Date();
  const recentSince = new Date(now.getTime() - windowSizeMinutes * 60 * 1000);
  const recentUntil = now;
  const historicalSince = new Date(recentSince.getTime() - windowSizeMinutes * 60 * 1000);
  const historicalUntil = recentSince;

  const recent = getMetrics({ agent, metric, since: recentSince, until: recentUntil }).map(m => m.value);
  const historical = getMetrics({ agent, metric, since: historicalSince, until: historicalUntil }).map(m => m.value);

  if (recent.length === 0 || historical.length === 0) {
return null;
}

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const historicalAvg = historical.reduce((a, b) => a + b, 0) / historical.length;

  const percentChange = historicalAvg !== 0 ? ((recentAvg - historicalAvg) / historicalAvg) * 100 : 0;

  return {
    recent: recentAvg,
    historical: historicalAvg,
    percentChange,
    trend: percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable' as const,
  };
}

/**
 * Get agent performance summary
 */
export function getAgentPerformance(agent: string, timeWindowMinutes = 60) {
  return {
    latency: getAverageMetric(agent, 'latency_ms', timeWindowMinutes),
    throughput: getAverageMetric(agent, 'throughput', timeWindowMinutes),
    errorRate: getAverageMetric(agent, 'error_rate', timeWindowMinutes),
    cpuUsage: getAverageMetric(agent, 'cpu_usage', timeWindowMinutes),
    memoryUsage: getAverageMetric(agent, 'memory_usage', timeWindowMinutes),
    latencyTrend: getMetricTrend(agent, 'latency_ms', timeWindowMinutes),
    errorRateTrend: getMetricTrend(agent, 'error_rate', timeWindowMinutes),
  };
}

/**
 * Get system-wide metrics
 */
export function getSystemMetrics(timeWindowMinutes = 60) {
  const agents = Array.from(new Set(metrics.map(m => m.agent)));

  return {
    totalAgents: agents.length,
    agents: agents.map(agent => ({
      agent,
      performance: getAgentPerformance(agent, timeWindowMinutes),
    })),
    avgLatency: getAverageMetric('*', 'latency_ms', timeWindowMinutes),
    totalThroughput: agents.reduce((sum, agent) => sum + (getAverageMetric(agent, 'throughput', timeWindowMinutes) ?? 0), 0),
  };
}

/**
 * Identify performance anomalies
 */
export function identifyAnomalies(agent: string, metric: string, stdDevThreshold = 2, timeWindowMinutes = 60) {
  const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  const values = getMetrics({ agent, metric, since });

  if (values.length < 2) {
return [];
}

  const nums = values.map(m => m.value);
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / nums.length;
  const stdDev = Math.sqrt(variance);

  const anomalies = values.filter(m => {
    const zscore = Math.abs((m.value - mean) / stdDev);
    return zscore > stdDevThreshold;
  });

  return anomalies;
}

/**
 * Get metric statistics
 */
export function getMetricStats() {
  const byAgent = metrics.reduce((acc, m) => {
    if (!acc[m.agent]) {
acc[m.agent] = 0;
}
    acc[m.agent]++;
    return acc;
  }, {} as Record<string, number>);

  const byMetric = metrics.reduce((acc, m) => {
    if (!acc[m.metric]) {
acc[m.metric] = 0;
}
    acc[m.metric]++;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalMetrics: metrics.length,
    uniqueAgents: Object.keys(byAgent).length,
    uniqueMetricTypes: Object.keys(byMetric).length,
    byAgent,
    byMetric,
  };
}

/**
 * Clear old metrics (keep only last N hours)
 */
export function pruneOldMetrics(retentionHours = 24): number {
  const before = metrics.length;
  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
  metrics = metrics.filter(m => new Date(m.timestamp) > cutoff);
  return before - metrics.length;
}

/**
 * Clear all metrics (for testing)
 */
export function clearAllMetrics(): void {
  metrics = [];
}
