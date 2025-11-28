/**
 * Overload Detection Service
 *
 * Detects potential founder overload/fatigue by analyzing task volume,
 * context switching, and open loops across the system.
 *
 * Part of the Founder Cognitive Twin Engine.
 */

import { supabaseAdmin } from '@/lib/supabase';

// Types
export type OverloadSeverity = 'low' | 'moderate' | 'high' | 'critical';

export interface OverloadIndicator {
  category: string;
  name: string;
  value: number;
  threshold: number;
  severity: OverloadSeverity;
  description: string;
}

export interface OverloadAnalysis {
  overallSeverity: OverloadSeverity;
  overloadScore: number; // 0-100
  indicators: OverloadIndicator[];
  recommendations: string[];
  detectedAt: Date;
}

export interface OverloadConfig {
  founderId: string;
  workspaceId: string;
  lookbackDays?: number;
  thresholds?: Partial<OverloadThresholds>;
}

export interface OverloadThresholds {
  openRisks: number;
  openOpportunities: number;
  pendingFollowups: number;
  activeCampaigns: number;
  unreadEmails: number;
  contextSwitches: number; // different clients/projects touched per day
  openDecisions: number;
}

const DEFAULT_THRESHOLDS: OverloadThresholds = {
  openRisks: 10,
  openOpportunities: 15,
  pendingFollowups: 20,
  activeCampaigns: 5,
  unreadEmails: 50,
  contextSwitches: 8,
  openDecisions: 5,
};

class OverloadDetectionService {
  /**
   * Analyze current overload state
   */
  async analyzeOverload(config: OverloadConfig): Promise<OverloadAnalysis> {
    const {
      founderId,
      workspaceId,
      lookbackDays = 7,
      thresholds = {},
    } = config;

    const effectiveThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    // Gather all indicators
    const indicators: OverloadIndicator[] = [];

    // 1. Open risks
    const riskIndicator = await this.checkOpenRisks(founderId, workspaceId, effectiveThresholds.openRisks);
    indicators.push(riskIndicator);

    // 2. Open opportunities
    const oppIndicator = await this.checkOpenOpportunities(founderId, workspaceId, effectiveThresholds.openOpportunities);
    indicators.push(oppIndicator);

    // 3. Pending follow-ups
    const followupIndicator = await this.checkPendingFollowups(workspaceId, effectiveThresholds.pendingFollowups);
    indicators.push(followupIndicator);

    // 4. Active campaigns
    const campaignIndicator = await this.checkActiveCampaigns(workspaceId, effectiveThresholds.activeCampaigns);
    indicators.push(campaignIndicator);

    // 5. Unread emails (approximate via recent inbound)
    const emailIndicator = await this.checkUnprocessedEmails(workspaceId, effectiveThresholds.unreadEmails, lookbackDate);
    indicators.push(emailIndicator);

    // 6. Context switches
    const contextIndicator = await this.checkContextSwitches(workspaceId, effectiveThresholds.contextSwitches, lookbackDate);
    indicators.push(contextIndicator);

    // 7. Open decisions
    const decisionIndicator = await this.checkOpenDecisions(founderId, workspaceId, effectiveThresholds.openDecisions);
    indicators.push(decisionIndicator);

    // Calculate overall overload score
    const overloadScore = this.calculateOverloadScore(indicators);
    const overallSeverity = this.determineSeverity(overloadScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(indicators, overallSeverity);

    return {
      overallSeverity,
      overloadScore,
      indicators,
      recommendations,
      detectedAt: new Date(),
    };
  }

  /**
   * Check open risks count
   */
  private async checkOpenRisks(
    founderId: string,
    workspaceId: string,
    threshold: number
  ): Promise<OverloadIndicator> {
    const { count } = await supabaseAdmin
      .from('founder_risk_register')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .not('mitigation_status', 'in', '("resolved","accepted")');

    const value = count || 0;
    const severity = this.getSeverityFromRatio(value / threshold);

    return {
      category: 'risk',
      name: 'Open Risks',
      value,
      threshold,
      severity,
      description: `${value} unresolved risks requiring attention`,
    };
  }

  /**
   * Check open opportunities count
   */
  private async checkOpenOpportunities(
    founderId: string,
    workspaceId: string,
    threshold: number
  ): Promise<OverloadIndicator> {
    const { count } = await supabaseAdmin
      .from('founder_opportunity_backlog')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .in('status', ['open', 'evaluating']);

    const value = count || 0;
    const severity = this.getSeverityFromRatio(value / threshold);

    return {
      category: 'opportunity',
      name: 'Open Opportunities',
      value,
      threshold,
      severity,
      description: `${value} opportunities awaiting action`,
    };
  }

  /**
   * Check pending follow-ups
   */
  private async checkPendingFollowups(
    workspaceId: string,
    threshold: number
  ): Promise<OverloadIndicator> {
    // Count contacts with no recent outbound email
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: contacts } = await supabaseAdmin
      .from('contacts')
      .select('id, last_contacted_at')
      .eq('workspace_id', workspaceId)
      .in('status', ['active', 'warm', 'hot']);

    const pendingFollowups = contacts?.filter((c) => {
      if (!c.last_contacted_at) return true;
      return new Date(c.last_contacted_at) < thirtyDaysAgo;
    }).length || 0;

    const severity = this.getSeverityFromRatio(pendingFollowups / threshold);

    return {
      category: 'communication',
      name: 'Pending Follow-ups',
      value: pendingFollowups,
      threshold,
      severity,
      description: `${pendingFollowups} contacts need follow-up`,
    };
  }

  /**
   * Check active campaigns
   */
  private async checkActiveCampaigns(
    workspaceId: string,
    threshold: number
  ): Promise<OverloadIndicator> {
    const { count } = await supabaseAdmin
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    const value = count || 0;
    const severity = this.getSeverityFromRatio(value / threshold);

    return {
      category: 'marketing',
      name: 'Active Campaigns',
      value,
      threshold,
      severity,
      description: `${value} campaigns running simultaneously`,
    };
  }

  /**
   * Check unprocessed emails
   */
  private async checkUnprocessedEmails(
    workspaceId: string,
    threshold: number,
    sinceDate: Date
  ): Promise<OverloadIndicator> {
    const { count } = await supabaseAdmin
      .from('emails')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('direction', 'inbound')
      .is('extracted_intent', null)
      .gte('created_at', sinceDate.toISOString());

    const value = count || 0;
    const severity = this.getSeverityFromRatio(value / threshold);

    return {
      category: 'email',
      name: 'Unprocessed Emails',
      value,
      threshold,
      severity,
      description: `${value} inbound emails awaiting processing`,
    };
  }

  /**
   * Check context switches (unique clients/pre-clients touched)
   */
  private async checkContextSwitches(
    workspaceId: string,
    threshold: number,
    sinceDate: Date
  ): Promise<OverloadIndicator> {
    // Count unique contacts with email activity
    const { data: emails } = await supabaseAdmin
      .from('emails')
      .select('contact_id')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sinceDate.toISOString())
      .not('contact_id', 'is', null);

    const uniqueContacts = new Set(emails?.map((e) => e.contact_id) || []);
    const value = uniqueContacts.size;
    const daysInPeriod = Math.ceil((Date.now() - sinceDate.getTime()) / (24 * 60 * 60 * 1000));
    const avgPerDay = value / Math.max(1, daysInPeriod);

    const severity = this.getSeverityFromRatio(avgPerDay / threshold);

    return {
      category: 'focus',
      name: 'Context Switches',
      value: Math.round(avgPerDay * 10) / 10,
      threshold,
      severity,
      description: `${avgPerDay.toFixed(1)} unique clients/day requiring attention`,
    };
  }

  /**
   * Check open decisions
   */
  private async checkOpenDecisions(
    founderId: string,
    workspaceId: string,
    threshold: number
  ): Promise<OverloadIndicator> {
    const { count } = await supabaseAdmin
      .from('founder_decision_scenarios')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .in('status', ['draft', 'simulated']);

    const value = count || 0;
    const severity = this.getSeverityFromRatio(value / threshold);

    return {
      category: 'decisions',
      name: 'Open Decisions',
      value,
      threshold,
      severity,
      description: `${value} pending strategic decisions`,
    };
  }

  /**
   * Get severity from ratio
   */
  private getSeverityFromRatio(ratio: number): OverloadSeverity {
    if (ratio >= 2) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1) return 'moderate';
    return 'low';
  }

  /**
   * Calculate overall overload score
   */
  private calculateOverloadScore(indicators: OverloadIndicator[]): number {
    const severityWeights: Record<OverloadSeverity, number> = {
      low: 0,
      moderate: 25,
      high: 50,
      critical: 75,
    };

    const categoryWeights: Record<string, number> = {
      risk: 1.5,
      decisions: 1.3,
      communication: 1.2,
      opportunity: 1.0,
      marketing: 0.8,
      email: 0.8,
      focus: 1.0,
    };

    let totalWeight = 0;
    let weightedScore = 0;

    indicators.forEach((ind) => {
      const weight = categoryWeights[ind.category] || 1.0;
      totalWeight += weight;
      weightedScore += severityWeights[ind.severity] * weight;
    });

    const avgScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    // Scale to 0-100
    return Math.min(100, Math.round(avgScore * 1.33));
  }

  /**
   * Determine overall severity
   */
  private determineSeverity(score: number): OverloadSeverity {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'moderate';
    return 'low';
  }

  /**
   * Generate recommendations based on indicators
   */
  private generateRecommendations(
    indicators: OverloadIndicator[],
    overallSeverity: OverloadSeverity
  ): string[] {
    const recommendations: string[] = [];

    // Critical indicators first
    const criticalIndicators = indicators.filter((i) => i.severity === 'critical');
    criticalIndicators.forEach((ind) => {
      switch (ind.category) {
        case 'risk':
          recommendations.push('URGENT: Review and address critical risks immediately');
          break;
        case 'decisions':
          recommendations.push('URGENT: Too many pending decisions - prioritize and resolve');
          break;
        case 'communication':
          recommendations.push('URGENT: Many follow-ups overdue - schedule batch outreach');
          break;
        case 'email':
          recommendations.push('URGENT: Process backlogged emails to avoid missed opportunities');
          break;
      }
    });

    // High severity recommendations
    const highIndicators = indicators.filter((i) => i.severity === 'high');
    highIndicators.forEach((ind) => {
      switch (ind.category) {
        case 'opportunity':
          recommendations.push('Review and prioritize opportunity backlog - consider deferring low-value items');
          break;
        case 'marketing':
          recommendations.push('Consider consolidating or pausing some campaigns to reduce complexity');
          break;
        case 'focus':
          recommendations.push('High context switching detected - consider time-blocking for focused work');
          break;
      }
    });

    // General recommendations based on severity
    if (overallSeverity === 'critical') {
      recommendations.push('Consider delegating tasks or postponing non-essential activities');
      recommendations.push('Block time for recovery and strategic thinking');
    } else if (overallSeverity === 'high') {
      recommendations.push('Prioritize ruthlessly - focus on highest-impact activities');
    }

    // If low overload, suggest growth activities
    if (overallSeverity === 'low') {
      recommendations.push('Capacity available - consider pursuing new opportunities');
    }

    return recommendations.slice(0, 5); // Max 5 recommendations
  }

  /**
   * Check if founder is likely overloaded
   */
  async isOverloaded(founderId: string, workspaceId: string): Promise<boolean> {
    const analysis = await this.analyzeOverload({ founderId, workspaceId });
    return analysis.overallSeverity === 'high' || analysis.overallSeverity === 'critical';
  }

  /**
   * Get quick overload summary
   */
  async getQuickSummary(founderId: string, workspaceId: string): Promise<{
    overloaded: boolean;
    severity: OverloadSeverity;
    score: number;
    topIssue?: string;
  }> {
    const analysis = await this.analyzeOverload({ founderId, workspaceId });

    const criticalIndicator = analysis.indicators.find((i) => i.severity === 'critical');
    const topIssue = criticalIndicator?.description ||
      analysis.indicators.find((i) => i.severity === 'high')?.description;

    return {
      overloaded: analysis.overallSeverity === 'high' || analysis.overallSeverity === 'critical',
      severity: analysis.overallSeverity,
      score: analysis.overloadScore,
      topIssue,
    };
  }
}

export const overloadDetectionService = new OverloadDetectionService();
