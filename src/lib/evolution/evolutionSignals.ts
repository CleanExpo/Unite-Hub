/**
 * Evolution Signals
 * Phase 64: Signal sources for system improvement detection
 */

export type SignalSource =
  | 'client_usage_patterns'
  | 'risk_trends'
  | 'creative_inconsistencies'
  | 'brand_mismatches'
  | 'governance_audit_failures'
  | 'performance_slowdowns'
  | 'cost_anomalies'
  | 'token_usage_spikes'
  | 'agent_mission_failures'
  | 'founder_manual_overrides';

export type SignalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface EvolutionSignal {
  id: string;
  source: SignalSource;
  priority: SignalPriority;
  title: string;
  description: string;
  data: Record<string, any>;
  detected_at: string;
  acknowledged: boolean;
  converted_to_sip: boolean;
}

export interface SignalPattern {
  source: SignalSource;
  frequency: number; // occurrences
  trend: 'increasing' | 'stable' | 'decreasing';
  avg_priority_score: number;
}

/**
 * Evolution Signals Engine
 * Collects and analyzes improvement signals
 */
export class EvolutionSignalsEngine {
  private signals: EvolutionSignal[] = [];

  /**
   * Record a new signal
   */
  recordSignal(
    source: SignalSource,
    priority: SignalPriority,
    title: string,
    description: string,
    data: Record<string, any> = {}
  ): EvolutionSignal {
    const signal: EvolutionSignal = {
      id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source,
      priority,
      title,
      description,
      data,
      detected_at: new Date().toISOString(),
      acknowledged: false,
      converted_to_sip: false,
    };

    this.signals.push(signal);
    return signal;
  }

  /**
   * Get all unacknowledged signals
   */
  getUnacknowledgedSignals(): EvolutionSignal[] {
    return this.signals.filter((s) => !s.acknowledged);
  }

  /**
   * Get signals by source
   */
  getSignalsBySource(source: SignalSource): EvolutionSignal[] {
    return this.signals.filter((s) => s.source === source);
  }

  /**
   * Analyze signal patterns
   */
  analyzePatterns(): SignalPattern[] {
    const sources: SignalSource[] = [
      'client_usage_patterns',
      'risk_trends',
      'creative_inconsistencies',
      'brand_mismatches',
      'governance_audit_failures',
      'performance_slowdowns',
      'cost_anomalies',
      'token_usage_spikes',
      'agent_mission_failures',
      'founder_manual_overrides',
    ];

    return sources.map((source) => {
      const sourceSignals = this.getSignalsBySource(source);
      const priorityScore = this.calculatePriorityScore(sourceSignals);

      return {
        source,
        frequency: sourceSignals.length,
        trend: this.calculateTrend(sourceSignals),
        avg_priority_score: priorityScore,
      };
    });
  }

  /**
   * Get high-priority signals for SIP conversion
   */
  getSignalsForSIPConversion(): EvolutionSignal[] {
    return this.signals.filter(
      (s) =>
        !s.converted_to_sip &&
        (s.priority === 'high' || s.priority === 'critical')
    );
  }

  /**
   * Mark signal as converted to SIP
   */
  markConverted(signalId: string): boolean {
    const signal = this.signals.find((s) => s.id === signalId);
    if (signal) {
      signal.converted_to_sip = true;
      signal.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Acknowledge a signal
   */
  acknowledge(signalId: string): boolean {
    const signal = this.signals.find((s) => s.id === signalId);
    if (signal) {
      signal.acknowledged = true;
      return true;
    }
    return false;
  }

  private calculatePriorityScore(signals: EvolutionSignal[]): number {
    if (signals.length === 0) return 0;

    const scores = signals.map((s) => {
      switch (s.priority) {
        case 'critical': return 100;
        case 'high': return 75;
        case 'medium': return 50;
        case 'low': return 25;
      }
    });

    return Math.round(scores.reduce((a, b) => a + b, 0) / signals.length);
  }

  private calculateTrend(signals: EvolutionSignal[]): 'increasing' | 'stable' | 'decreasing' {
    if (signals.length < 3) return 'stable';

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    const recentCount = signals.filter(
      (s) => now - new Date(s.detected_at).getTime() < oneWeek
    ).length;

    const olderCount = signals.filter(
      (s) => {
        const age = now - new Date(s.detected_at).getTime();
        return age >= oneWeek && age < 2 * oneWeek;
      }
    ).length;

    if (recentCount > olderCount * 1.5) return 'increasing';
    if (recentCount < olderCount * 0.5) return 'decreasing';
    return 'stable';
  }
}

export default EvolutionSignalsEngine;
