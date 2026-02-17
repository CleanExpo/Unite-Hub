// GSLPIE - Global SLA, Latency & Performance Intelligence Engine (Phase 92)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class GSLPIEEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
    );
  }

  async captureMetrics(
    region: string,
    latencyMs: number,
    errorRate: number,
    throughput: number,
    source: string
  ): Promise<void> {
    await this.supabase.from('gslpie_region_metrics').insert({
      region,
      latency_ms: latencyMs,
      error_rate: errorRate,
      throughput,
      signal_source: source
    });
  }

  async analysePerformance(region: string, windowMinutes = 60): Promise<{
    avg_latency: number;
    p95_latency: number;
    avg_error_rate: number;
    avg_throughput: number;
    trend: 'improving' | 'stable' | 'degrading';
  }> {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const { data: metrics } = await this.supabase
      .from('gslpie_region_metrics')
      .select('*')
      .eq('region', region)
      .gte('captured_at', cutoff)
      .order('captured_at', { ascending: true });

    if (!metrics || metrics.length === 0) {
      return { avg_latency: 0, p95_latency: 0, avg_error_rate: 0, avg_throughput: 0, trend: 'stable' };
    }

    const latencies = metrics.map(m => m.latency_ms).sort((a, b) => a - b);
    const avg_latency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95_latency = latencies[Math.floor(latencies.length * 0.95)] || avg_latency;
    const avg_error_rate = metrics.reduce((sum, m) => sum + m.error_rate, 0) / metrics.length;
    const avg_throughput = metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length;

    // Determine trend
    const half = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, half);
    const secondHalf = metrics.slice(half);
    const firstAvg = firstHalf.reduce((s, m) => s + m.latency_ms, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((s, m) => s + m.latency_ms, 0) / (secondHalf.length || 1);

    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (secondAvg < firstAvg * 0.9) trend = 'improving';
    else if (secondAvg > firstAvg * 1.1) trend = 'degrading';

    return { avg_latency, p95_latency, avg_error_rate, avg_throughput, trend };
  }

  async forecastSLA(tenantId: string, region: string): Promise<{
    breach_probability: number;
    risk_factors: string[];
  }> {
    const performance = await this.analysePerformance(region, 60);

    const { data: profile } = await this.supabase
      .from('gslpie_sla_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('region', region)
      .single();

    const risk_factors: string[] = [];
    let breach_probability = 0;

    if (profile) {
      if (performance.avg_latency > profile.latency_threshold_ms * 0.8) {
        breach_probability += 0.3;
        risk_factors.push('Latency approaching threshold');
      }
      if (performance.avg_error_rate > profile.max_error_rate * 0.7) {
        breach_probability += 0.3;
        risk_factors.push('Error rate elevated');
      }
      if (performance.trend === 'degrading') {
        breach_probability += 0.2;
        risk_factors.push('Performance degrading');
      }
    }

    return { breach_probability: Math.min(1, breach_probability), risk_factors };
  }

  async routeToOptimalRegion(preferredRegions: string[]): Promise<string> {
    let bestRegion = preferredRegions[0];
    let bestScore = 0;

    for (const region of preferredRegions) {
      const perf = await this.analysePerformance(region, 30);
      const score = (100 - perf.avg_latency / 10) * 0.6 + (1 - perf.avg_error_rate) * 100 * 0.4;
      if (score > bestScore) {
        bestScore = score;
        bestRegion = region;
      }
    }

    return bestRegion;
  }
}

export const gslpieEngine = new GSLPIEEngine();
