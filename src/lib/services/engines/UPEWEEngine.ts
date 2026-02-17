// UPEWE - Unified Prediction & Early-Warning Engine (Phase 85)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Forecast {
  window: string;
  probability: number;
  predicted_event: string;
  confidence: number;
  signals: string[];
}

export class UPEWEEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
    );
  }

  async generateForecast(
    tenantId: string,
    window: '5m' | '30m' | '6h' | '24h' | '7d'
  ): Promise<Forecast> {
    // Get cached signals
    const { data: signals } = await this.supabase
      .from('upewe_signal_cache')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('captured_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    const signalSources = signals?.map(s => s.source) || [];
    const avgScore = signals?.reduce((sum, s) => sum + (s.score || 0), 0) / (signals?.length || 1);

    // Analyze patterns
    const prediction = this.analyzePrediction(signals || [], window);

    // Store forecast
    await this.supabase.from('upewe_forecast_events').insert({
      tenant_id: tenantId,
      forecast_window: window,
      predicted_event: prediction.event,
      probability: prediction.probability,
      confidence: prediction.confidence,
      contributing_signals: signalSources
    });

    return {
      window,
      probability: prediction.probability,
      predicted_event: prediction.event,
      confidence: prediction.confidence,
      signals: signalSources
    };
  }

  async cacheSignal(
    tenantId: string,
    source: string,
    signalType: string,
    score: number,
    metadata: Record<string, any>
  ): Promise<void> {
    await this.supabase.from('upewe_signal_cache').insert({
      tenant_id: tenantId,
      source,
      signal_type: signalType,
      score,
      metadata
    });
  }

  private analyzePrediction(signals: any[], window: string): {
    event: string;
    probability: number;
    confidence: number;
  } {
    if (signals.length === 0) {
      return { event: 'stable', probability: 0.1, confidence: 0.5 };
    }

    const avgScore = signals.reduce((sum, s) => sum + (s.score || 50), 0) / signals.length;
    const highRiskCount = signals.filter(s => s.score > 70).length;

    if (highRiskCount > signals.length * 0.5) {
      return {
        event: 'incident_likely',
        probability: 0.7 + (highRiskCount / signals.length) * 0.3,
        confidence: 0.8
      };
    }

    if (avgScore > 60) {
      return {
        event: 'elevated_risk',
        probability: avgScore / 100,
        confidence: 0.7
      };
    }

    return {
      event: 'stable',
      probability: 0.2,
      confidence: 0.9
    };
  }
}

export const upeweEngine = new UPEWEEngine();
