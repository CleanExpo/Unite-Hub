/**
 * Focus Session Analyzer
 * Analyzes founder focus sessions for depth, adherence, completion, and interruption patterns
 *
 * Read-only module that queries founder_focus_sessions table
 * No data modification, pure analysis
 */

import { createClient } from '@supabase/supabase-js';
import { distractionConfig } from './distraction-config';

export interface FocusCategory {
  name: string;
  count: number;
  avgDepthScore: number;
  completionRate: number;
  avgInterruptions: number;
  totalHours: number;
}

export interface FocusAnalysis {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  avgDepthScore: number;
  avgInterruptionsPerSession: number;
  totalFocusHours: number;
  totalInterruptions: number;
  byCategory: Map<string, FocusCategory>;
  topCategories: FocusCategory[];
  depthTrend: {
    lastWeek: number;
    twoWeeksAgo: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  sessionQuality: {
    deepFocus: number;
    strongFocus: number;
    moderateFocus: number;
    shallowFocus: number;
  };
  riskFlags: string[];
  recommendations: string[];
  timestamp: string;
}

export class FocusAnalyzer {
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
   * Analyze all focus sessions for a founder
   * Aggregates by category, depth, and completion status
   */
  async analyzeFocusSessions(
    tenantId: string,
    days: number = 7
  ): Promise<FocusAnalysis> {
    try {
      // Query focus sessions
      const { data: sessions, error } = await this.supabase
        .from(distractionConfig.focusSessionTable)
        .select('*')
        .eq('tenant_id', tenantId)
        .gte(
          'actual_start',
          new Date(Date.now() - days * 86400000).toISOString()
        )
        .order('actual_start', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch focus sessions: ${error.message}`);
      }

      if (!sessions || sessions.length === 0) {
        return this.createEmptyAnalysis();
      }

      // Aggregate data
      const byCategory = new Map<string, FocusCategory>();
      let completedCount = 0;
      let totalDepthScore = 0;
      let totalInterruptions = 0;
      let totalFocusHours = 0;
      const sessionQualities = {
        deepFocus: 0,
        strongFocus: 0,
        moderateFocus: 0,
        shallowFocus: 0
      };

      for (const session of sessions) {
        // Count completed sessions
        if (session.status === 'completed') completedCount++;

        // Aggregate depth scores
        if (session.depth_score !== null) {
          totalDepthScore += session.depth_score;
          this.categorizeQuality(session.depth_score, sessionQualities);
        }

        // Count interruptions
        if (session.interruptions) {
          totalInterruptions += session.interruptions;
        }

        // Calculate session duration
        if (session.actual_start && session.actual_end) {
          const duration =
            (new Date(session.actual_end).getTime() -
              new Date(session.actual_start).getTime()) /
            (1000 * 60 * 60);
          totalFocusHours += duration;
        }

        // Aggregate by category
        const category = session.category || 'other';
        if (!byCategory.has(category)) {
          byCategory.set(category, {
            name: category,
            count: 0,
            avgDepthScore: 0,
            completionRate: 0,
            avgInterruptions: 0,
            totalHours: 0
          });
        }

        const cat = byCategory.get(category)!;
        cat.count++;
        if (session.depth_score !== null) {
          cat.avgDepthScore += session.depth_score;
        }
        if (session.status === 'completed') cat.completionRate += 1;
        if (session.interruptions) {
          cat.avgInterruptions += session.interruptions;
        }
        if (session.actual_start && session.actual_end) {
          const duration =
            (new Date(session.actual_end).getTime() -
              new Date(session.actual_start).getTime()) /
            (1000 * 60 * 60);
          cat.totalHours += duration;
        }
      }

      const totalSessions = sessions.length;
      const completionRate = (completedCount / totalSessions) * 100;
      const avgDepthScore = totalSessions > 0 ? totalDepthScore / totalSessions : 0;
      const avgInterruptionsPerSession =
        totalSessions > 0 ? totalInterruptions / totalSessions : 0;

      // Finalize category calculations
      for (const cat of byCategory.values()) {
        cat.avgDepthScore = cat.count > 0 ? cat.avgDepthScore / cat.count : 0;
        cat.completionRate = cat.count > 0 ? (cat.completionRate / cat.count) * 100 : 0;
        cat.avgInterruptions =
          cat.count > 0 ? cat.avgInterruptions / cat.count : 0;
      }

      // Get top categories by frequency
      const topCategories = Array.from(byCategory.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate depth trend (last week vs two weeks ago)
      const depthTrend = await this.calculateDepthTrend(tenantId);

      // Generate risk flags and recommendations
      const riskFlags = this.generateRiskFlags(
        totalSessions,
        completionRate,
        avgDepthScore,
        avgInterruptionsPerSession,
        totalFocusHours
      );

      const recommendations = this.generateRecommendations(
        riskFlags,
        avgDepthScore,
        completionRate,
        topCategories
      );

      return {
        totalSessions,
        completedSessions: completedCount,
        completionRate,
        avgDepthScore,
        avgInterruptionsPerSession,
        totalFocusHours,
        totalInterruptions,
        byCategory,
        topCategories,
        depthTrend,
        sessionQuality: sessionQualities,
        riskFlags,
        recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[FocusAnalyzer] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Categorize session quality by depth score
   */
  private categorizeQuality(
    depthScore: number,
    qualities: Record<string, number>
  ): void {
    if (depthScore >= 80) qualities.deepFocus++;
    else if (depthScore >= 60) qualities.strongFocus++;
    else if (depthScore >= 40) qualities.moderateFocus++;
    else qualities.shallowFocus++;
  }

  /**
   * Calculate depth trend by comparing periods
   */
  private async calculateDepthTrend(
    tenantId: string
  ): Promise<FocusAnalysis['depthTrend']> {
    try {
      const now = new Date();
      const lastWeekStart = new Date(now.getTime() - 7 * 86400000);
      const twoWeeksAgoStart = new Date(now.getTime() - 14 * 86400000);
      const twoWeeksAgoEnd = new Date(now.getTime() - 7 * 86400000);

      // Last week
      const { data: lastWeekSessions } = await this.supabase
        .from(distractionConfig.focusSessionTable)
        .select('depth_score')
        .eq('tenant_id', tenantId)
        .gte('actual_start', lastWeekStart.toISOString())
        .lte('actual_start', now.toISOString());

      const lastWeekDepth =
        lastWeekSessions && lastWeekSessions.length > 0
          ? lastWeekSessions.reduce(
              (sum: number, s: any) => sum + (s.depth_score || 0),
              0
            ) / lastWeekSessions.length
          : 0;

      // Two weeks ago
      const { data: twoWeeksAgoSessions } = await this.supabase
        .from(distractionConfig.focusSessionTable)
        .select('depth_score')
        .eq('tenant_id', tenantId)
        .gte('actual_start', twoWeeksAgoStart.toISOString())
        .lte('actual_start', twoWeeksAgoEnd.toISOString());

      const twoWeeksAgoDepth =
        twoWeeksAgoSessions && twoWeeksAgoSessions.length > 0
          ? twoWeeksAgoSessions.reduce(
              (sum: number, s: any) => sum + (s.depth_score || 0),
              0
            ) / twoWeeksAgoSessions.length
          : 0;

      // Determine trend
      const difference = lastWeekDepth - twoWeeksAgoDepth;
      const trend: 'improving' | 'declining' | 'stable' =
        difference > 5 ? 'improving' : difference < -5 ? 'declining' : 'stable';

      return {
        lastWeek: Math.round(lastWeekDepth),
        twoWeeksAgo: Math.round(twoWeeksAgoDepth),
        trend
      };
    } catch (error) {
      console.error('[FocusAnalyzer] Trend calculation failed:', error);
      return { lastWeek: 0, twoWeeksAgo: 0, trend: 'stable' };
    }
  }

  /**
   * Generate risk flags based on focus analysis
   */
  private generateRiskFlags(
    totalSessions: number,
    completionRate: number,
    avgDepthScore: number,
    avgInterruptionsPerSession: number,
    totalFocusHours: number
  ): string[] {
    const flags: string[] = [];

    // Check completion rate
    if (completionRate < 70) {
      flags.push(
        `low_completion_rate_${Math.round(completionRate)}pct_target_70pct`
      );
    }

    // Check depth score
    if (avgDepthScore < 50) {
      flags.push(`shallow_focus_sessions_avg_${Math.round(avgDepthScore)}/100`);
    }

    // Check interruptions
    if (avgInterruptionsPerSession > 3) {
      flags.push(
        `high_interruption_rate_${Math.round(avgInterruptionsPerSession)}_per_session`
      );
    }

    // Check total focus hours
    if (totalFocusHours < distractionConfig.focusDayThreshold * 7) {
      flags.push(
        `insufficient_weekly_focus_${Math.round(totalFocusHours)}hrs_target_${distractionConfig.focusDayThreshold * 7}hrs`
      );
    }

    // Check session frequency
    if (totalSessions < 5) {
      flags.push('insufficient_focus_session_tracking');
    }

    return flags;
  }

  /**
   * Generate recommendations based on focus analysis
   */
  private generateRecommendations(
    riskFlags: string[],
    avgDepthScore: number,
    completionRate: number,
    topCategories: FocusCategory[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommend focus block optimization
    if (
      riskFlags.some(f => f.includes('low_completion_rate')) ||
      riskFlags.some(f => f.includes('shallow_focus'))
    ) {
      recommendations.push(
        'Schedule 2-3 deep work blocks of 90+ minutes with zero interruptions (implement time-block orchestrator)'
      );
    }

    // Recommend interruption reduction
    if (riskFlags.some(f => f.includes('high_interruption_rate'))) {
      recommendations.push(
        'Implement "focus fortress" protocols: phone off, Slack DND, notifications disabled during focus blocks'
      );
    }

    // Recommend session structure
    if (
      riskFlags.some(f => f.includes('insufficient_weekly_focus')) ||
      avgDepthScore < 50
    ) {
      recommendations.push(
        `Restructure weekly calendar: minimum ${distractionConfig.focusDayThreshold} hours daily focus time in 90-min blocks`
      );
    }

    // Recommend category-specific strategy
    if (topCategories.length > 0) {
      const deepWorkCat = topCategories.find(c => c.name === 'deep_work');
      if (deepWorkCat && deepWorkCat.completionRate < 80) {
        recommendations.push(
          `Protect "Deep Work" sessions: ${deepWorkCat.count} sessions tracked, ${Math.round(deepWorkCat.completionRate)}% completion rate`
        );
      }

      const strategicCat = topCategories.find(
        c => c.name === 'strategic_thinking'
      );
      if (strategicCat && strategicCat.avgDepthScore < 70) {
        recommendations.push(
          'Increase context-switching recovery time between strategic thinking sessions (use 15-min transition blocks)'
        );
      }
    }

    // Recommend tracking improvement
    if (riskFlags.some(f => f.includes('insufficient_focus_session_tracking'))) {
      recommendations.push(
        'Start daily focus session logging with depth scoring (use founder_focus_sessions table)'
      );
    }

    // Recommend trend-based action
    if (avgDepthScore > 70 && completionRate > 80) {
      recommendations.push(
        'Maintain current focus discipline - strong adherence detected. Consider scaling deeper work allocation.'
      );
    }

    return recommendations;
  }

  /**
   * Create empty analysis for no data
   */
  private createEmptyAnalysis(): FocusAnalysis {
    return {
      totalSessions: 0,
      completedSessions: 0,
      completionRate: 0,
      avgDepthScore: 0,
      avgInterruptionsPerSession: 0,
      totalFocusHours: 0,
      totalInterruptions: 0,
      byCategory: new Map(),
      topCategories: [],
      depthTrend: { lastWeek: 0, twoWeeksAgo: 0, trend: 'stable' },
      sessionQuality: {
        deepFocus: 0,
        strongFocus: 0,
        moderateFocus: 0,
        shallowFocus: 0
      },
      riskFlags: ['insufficient_data'],
      recommendations: [
        'Start tracking focus sessions to get insights (use founder_focus_sessions table)'
      ],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Convenience function to analyze focus sessions
 */
export async function analyzeFocusSessions(
  tenantId: string,
  days: number = 7,
  founderId?: string
): Promise<FocusAnalysis> {
  const analyzer = new FocusAnalyzer(founderId);
  return analyzer.analyzeFocusSessions(tenantId, days);
}
