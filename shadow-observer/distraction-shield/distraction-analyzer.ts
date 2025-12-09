/**
 * Distraction Shield Analyzer
 * Analyzes distraction patterns, recovery times, and mitigation effectiveness
 *
 * Read-only module that queries distraction_events table
 * No data modification, pure analysis
 */

import { createClient } from '@supabase/supabase-js';
import { distractionConfig } from './distraction-config';

export interface DistractionSource {
  name: string;
  count: number;
  avgRecoveryMins: number;
  preventionRate: number;
  severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  totalRecoveryHours: number;
}

export interface DistractionAnalysis {
  totalDistractions: number;
  preventedCount: number;
  preventionRate: number;
  avgRecoveryMins: number;
  totalRecoveryHours: number;
  bySource: Map<string, DistractionSource>;
  topSources: DistractionSource[];
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  riskFlags: string[];
  recommendations: string[];
  timestamp: string;
}

export class DistractionAnalyzer {
  private supabase: any;
  private founderId?: string;

  constructor(founderId?: string) {
    this.founderId = founderId;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /**
   * Analyze all distraction events for a founder
   * Aggregates by source, severity, and recovery time
   */
  async analyzeDistractions(
    tenantId: string,
    days: number = 7
  ): Promise<DistractionAnalysis> {
    try {
      // Query distraction events
      const { data: events, error } = await this.supabase
        .from(distractionConfig.distractionTable)
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', new Date(Date.now() - days * 86400000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch distraction events: ${error.message}`);
      }

      if (!events || events.length === 0) {
        return this.createEmptyAnalysis();
      }

      // Aggregate data
      const bySource = new Map<string, DistractionSource>();
      const severity = { critical: 0, high: 0, medium: 0, low: 0 };
      let totalRecoveryMins = 0;
      let preventedCount = 0;

      for (const event of events) {
        // Track severity
        severity[event.severity as keyof typeof severity]++;

        // Track prevented
        if (event.prevented) preventedCount++;

        // Track recovery time
        if (event.recovery_time_mins) {
          totalRecoveryMins += event.recovery_time_mins;
        }

        // Aggregate by source
        if (!bySource.has(event.source)) {
          bySource.set(event.source, {
            name: event.source,
            count: 0,
            avgRecoveryMins: 0,
            preventionRate: 0,
            severity: { low: 0, medium: 0, high: 0, critical: 0 },
            totalRecoveryHours: 0
          });
        }

        const source = bySource.get(event.source)!;
        source.count++;
        source.severity[event.severity as keyof typeof source.severity]++;

        if (event.recovery_time_mins) {
          source.totalRecoveryHours += event.recovery_time_mins / 60;
        }
      }

      // Calculate derived metrics
      const totalDistractions = events.length;
      const preventionRate = (preventedCount / totalDistractions) * 100;
      const avgRecoveryMins =
        totalDistractions > 0 ? totalRecoveryMins / totalDistractions : 0;
      const totalRecoveryHours = totalRecoveryMins / 60;

      // Finalize source calculations
      for (const source of bySource.values()) {
        source.preventionRate = (
          (source.count > 0
            ? (source.severity.critical +
                source.severity.high +
                source.severity.medium) /
              source.count
            : 0) * 100
        );
        source.avgRecoveryMins =
          source.count > 0 ? source.totalRecoveryHours * 60 / source.count : 0;
      }

      // Get top sources by frequency
      const topSources = Array.from(bySource.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Generate risk flags and recommendations
      const riskFlags = this.generateRiskFlags(
        totalDistractions,
        preventionRate,
        avgRecoveryMins,
        severity,
        topSources
      );

      const recommendations = this.generateRecommendations(
        riskFlags,
        topSources,
        severity
      );

      return {
        totalDistractions,
        preventedCount,
        preventionRate,
        avgRecoveryMins,
        totalRecoveryHours,
        bySource,
        topSources,
        severity,
        riskFlags,
        recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[DistractionAnalyzer] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate risk flags based on analysis
   */
  private generateRiskFlags(
    totalDistractions: number,
    preventionRate: number,
    avgRecoveryMins: number,
    severity: Record<string, number>,
    topSources: DistractionSource[]
  ): string[] {
    const flags: string[] = [];

    // Check distraction volume
    if (totalDistractions > distractionConfig.distractionHighThreshold * 2) {
      flags.push('excessive_distractions');
    }

    // Check prevention rate
    if (preventionRate < distractionConfig.preventionRateTarget) {
      flags.push(
        `low_prevention_rate_${Math.round(preventionRate)}pct_target_${distractionConfig.preventionRateTarget}pct`
      );
    }

    // Check recovery time
    if (
      avgRecoveryMins >
      distractionConfig.recoveryTimeWarning * 2
    ) {
      flags.push(
        `high_recovery_time_${Math.round(avgRecoveryMins)}mins_avg`
      );
    }

    // Check critical severity
    if (severity.critical > 0) {
      flags.push(
        `${severity.critical}_critical_distraction_events_detected`
      );
    }

    // Check top source impact
    if (topSources.length > 0) {
      const topSource = topSources[0];
      if (
        topSource.count >
        totalDistractions * 0.4
      ) {
        flags.push(
          `single_source_dominance_${topSource.name}_${Math.round((topSource.count / totalDistractions) * 100)}pct`
        );
      }
    }

    return flags;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    riskFlags: string[],
    topSources: DistractionSource[],
    severity: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // Recommend blocking top sources
    if (topSources.length > 0) {
      const topSource = topSources[0];
      recommendations.push(
        `Implement blocking for ${topSource.name} during focus blocks (${topSource.count} instances in analysis window)`
      );
    }

    // Recommend recovery time optimization
    if (riskFlags.some(f => f.includes('high_recovery_time'))) {
      recommendations.push(
        'Develop rapid context-switching recovery techniques (breathing, journaling, brief walk)'
      );
    }

    // Recommend critical distraction triage
    if (severity.critical > 0) {
      recommendations.push(
        `Implement escalation protocols for ${severity.critical} critical distraction events to prevent cascade failures`
      );
    }

    // Recommend focus session scheduling
    if (
      riskFlags.some(f => f.includes('excessive_distractions')) ||
      riskFlags.some(f => f.includes('low_prevention_rate'))
    ) {
      recommendations.push(
        'Schedule dedicated focus blocks with zero-distraction policies (Slack/Email off, phone away)'
      );
    }

    // Recommend source-specific strategies
    if (topSources.length > 0) {
      const emailSource = topSources.find(s => s.name === 'email');
      if (emailSource) {
        recommendations.push(
          `Batch email processing 2-3x daily instead of continuous checking (currently ${emailSource.count} instances)`
        );
      }

      const meetingSource = topSources.find(s => s.name === 'meeting');
      if (meetingSource && meetingSource.count > 5) {
        recommendations.push(
          `Consolidate meetings into 2 time blocks per day (currently ${meetingSource.count} distraction instances)`
        );
      }

      const slackSource = topSources.find(s => s.name === 'slack');
      if (slackSource) {
        recommendations.push(
          `Use Slack "Do Not Disturb" during focus sessions (currently ${slackSource.count} instances)`
        );
      }
    }

    return recommendations;
  }

  /**
   * Create empty analysis for no data
   */
  private createEmptyAnalysis(): DistractionAnalysis {
    return {
      totalDistractions: 0,
      preventedCount: 0,
      preventionRate: 0,
      avgRecoveryMins: 0,
      totalRecoveryHours: 0,
      bySource: new Map(),
      topSources: [],
      severity: { critical: 0, high: 0, medium: 0, low: 0 },
      riskFlags: ['insufficient_data'],
      recommendations: [
        'Start tracking distraction events to get insights (use distraction-shield integration)'
      ],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Convenience function to analyze distractions
 */
export async function analyzeDistractions(
  tenantId: string,
  days: number = 7,
  founderId?: string
): Promise<DistractionAnalysis> {
  const analyzer = new DistractionAnalyzer(founderId);
  return analyzer.analyzeDistractions(tenantId, days);
}
