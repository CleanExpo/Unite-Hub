/**
 * Ads Optimization Service
 *
 * Analyzes ad performance and detects optimization opportunities.
 * Suggestions-only mode by default - no auto-apply without explicit approval.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';
import {
  AdProvider,
  AdCampaign,
  AdPerformanceSnapshot,
  AdOptimizationOpportunity,
  OptimizationType,
  OpportunitySeverity,
  OpportunityStatus,
} from './adsProviderTypes';
import { getAdProviderConfig, adsAutomationConfig } from '../../../config/adsAutomation.config';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AnalyzeOptions {
  lookbackDays?: number;
  comparisonPeriod?: 'previous_period' | 'same_period_last_month' | 'same_period_last_year';
  minDataPoints?: number;
  enabledTypes?: OptimizationType[];
}

export interface OpportunityResult {
  opportunities: AdOptimizationOpportunity[];
  analyzedCampaigns: number;
  errors: Array<{ campaignId: string; error: string }>;
}

export interface ApplyResult {
  success: boolean;
  opportunityId: string;
  appliedAt?: Date;
  error?: string;
}

// Map config thresholds to service-expected format
const configThresholds = adsAutomationConfig.optimizationSettings.thresholds;
const performanceThresholds = {
  minROAS: configThresholds.roasLow,
  minConversionRate: configThresholds.conversionRateLow,
  minCTR: configThresholds.ctrLow,
  maxROAS: configThresholds.roasHigh,
  maxConversionRate: configThresholds.conversionRateHigh,
  maxCTR: configThresholds.ctrHigh,
};

// Default enabled optimization types
const defaultOptimizationTypes: OptimizationType[] = [
  'budget_increase',
  'budget_decrease',
  'underperforming_ad',
  'high_performer_scale',
  'cost_efficiency',
  'conversion_opportunity',
  'trend_alert',
];

class AdsOptimizationService {
  private thresholds = performanceThresholds;

  /**
   * Analyze campaigns and detect optimization opportunities
   */
  async analyzeCampaigns(
    workspaceId: string,
    accountId?: string,
    options: AnalyzeOptions = {}
  ): Promise<OpportunityResult> {
    const {
      lookbackDays = 7,
      comparisonPeriod = 'previous_period',
      minDataPoints = 3,
      enabledTypes = defaultOptimizationTypes,
    } = options;

    const supabase = await getSupabaseServer();
    const opportunities: AdOptimizationOpportunity[] = [];
    const errors: Array<{ campaignId: string; error: string }> = [];

    // Get campaigns to analyze
    let query = supabase
      .from('ad_campaigns')
      .select('*, ad_accounts(*)')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    if (accountId) {
      query = query.eq('ad_account_id', accountId);
    }

    const { data: campaigns, error: campaignsError } = await query;

    if (campaignsError) {
      throw campaignsError;
    }

    // Analyze each campaign
    for (const campaign of campaigns || []) {
      try {
        const campaignOpportunities = await this.analyzeSingleCampaign(
          campaign,
          lookbackDays,
          comparisonPeriod,
          minDataPoints,
          enabledTypes
        );

        // Store opportunities
        for (const opp of campaignOpportunities) {
          const { data: stored, error: storeError } = await supabase
            .from('ad_optimization_opportunities')
            .insert({
              ad_campaign_id: campaign.id,
              workspace_id: workspaceId,
              type: opp.type,
              severity: opp.severity,
              title: opp.title,
              description: opp.description,
              recommendation: opp.recommendation,
              estimated_impact_score: opp.estimatedImpactScore,
              estimated_impact_value: opp.estimatedImpactValue,
              confidence_score: opp.confidenceScore,
              supporting_data: opp.supportingData,
              comparison_period: comparisonPeriod,
              baseline_metrics: opp.baselineMetrics,
              current_metrics: opp.currentMetrics,
              status: 'open',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

          if (!storeError && stored) {
            opportunities.push({
              ...opp,
              id: stored.id,
              adCampaignId: campaign.id,
              workspaceId,
              detectedAt: new Date(),
              status: 'open' as OpportunityStatus,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      } catch (error) {
        errors.push({
          campaignId: campaign.id,
          error: String(error),
        });
      }
    }

    return {
      opportunities,
      analyzedCampaigns: campaigns?.length || 0,
      errors,
    };
  }

  /**
   * Analyze a single campaign for optimization opportunities
   */
  private async analyzeSingleCampaign(
    campaign: AdCampaign & { ad_accounts: { provider: AdProvider } },
    lookbackDays: number,
    comparisonPeriod: string,
    minDataPoints: number,
    enabledTypes: OptimizationType[]
  ): Promise<Partial<AdOptimizationOpportunity>[]> {
    const supabase = await getSupabaseServer();
    const opportunities: Partial<AdOptimizationOpportunity>[] = [];

    // Get current period metrics
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

    const { data: currentMetrics } = await supabase
      .from('ad_performance_snapshots')
      .select('*')
      .eq('ad_campaign_id', campaign.id)
      .gte('snapshot_date', startDate.toISOString())
      .lte('snapshot_date', endDate.toISOString())
      .order('snapshot_date', { ascending: false });

    if (!currentMetrics || currentMetrics.length < minDataPoints) {
      return [];
    }

    // Get comparison period metrics
    const comparisonStart = new Date(startDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    const comparisonEnd = startDate;

    const { data: baselineMetrics } = await supabase
      .from('ad_performance_snapshots')
      .select('*')
      .eq('ad_campaign_id', campaign.id)
      .gte('snapshot_date', comparisonStart.toISOString())
      .lt('snapshot_date', comparisonEnd.toISOString());

    // Calculate aggregates
    const currentAgg = this.aggregateMetrics(currentMetrics);
    const baselineAgg = baselineMetrics ? this.aggregateMetrics(baselineMetrics) : null;

    // Run opportunity detectors
    if (enabledTypes.includes('budget_increase')) {
      const budgetOpp = this.detectBudgetIncreaseOpportunity(campaign, currentAgg, baselineAgg);
      if (budgetOpp) {
opportunities.push(budgetOpp);
}
    }

    if (enabledTypes.includes('budget_decrease')) {
      const budgetOpp = this.detectBudgetDecreaseOpportunity(campaign, currentAgg, baselineAgg);
      if (budgetOpp) {
opportunities.push(budgetOpp);
}
    }

    if (enabledTypes.includes('underperforming_ad')) {
      const underperformOpp = this.detectUnderperformingOpportunity(campaign, currentAgg, baselineAgg);
      if (underperformOpp) {
opportunities.push(underperformOpp);
}
    }

    if (enabledTypes.includes('high_performer_scale')) {
      const scaleOpp = this.detectHighPerformerOpportunity(campaign, currentAgg, baselineAgg);
      if (scaleOpp) {
opportunities.push(scaleOpp);
}
    }

    if (enabledTypes.includes('cost_efficiency')) {
      const costOpp = this.detectCostEfficiencyOpportunity(campaign, currentAgg, baselineAgg);
      if (costOpp) {
opportunities.push(costOpp);
}
    }

    if (enabledTypes.includes('conversion_opportunity')) {
      const convOpp = this.detectConversionOpportunity(campaign, currentAgg, baselineAgg);
      if (convOpp) {
opportunities.push(convOpp);
}
    }

    if (enabledTypes.includes('trend_alert')) {
      const trendOpp = this.detectTrendAlert(campaign, currentMetrics);
      if (trendOpp) {
opportunities.push(trendOpp);
}
    }

    return opportunities;
  }

  /**
   * Get AI-powered recommendations for an opportunity
   */
  async getAIRecommendation(opportunityId: string): Promise<string> {
    const supabase = await getSupabaseServer();

    const { data: opportunity, error } = await supabase
      .from('ad_optimization_opportunities')
      .select('*, ad_campaigns(*)')
      .eq('id', opportunityId)
      .single();

    if (error || !opportunity) {
      throw new Error('Opportunity not found');
    }

    const systemPrompt = `You are an expert digital advertising strategist. Analyze the optimization opportunity and provide actionable recommendations.

Guidelines:
- Be specific with numbers and percentages
- Consider platform-specific best practices
- Account for seasonality and market trends
- Suggest A/B testing approaches where relevant
- Include risk mitigation strategies`;

    const userPrompt = `Analyze this ad optimization opportunity and provide detailed recommendations:

Campaign: ${opportunity.ad_campaigns.name}
Opportunity Type: ${opportunity.type}
Severity: ${opportunity.severity}
Description: ${opportunity.description}

Current Metrics: ${JSON.stringify(opportunity.current_metrics, null, 2)}
Baseline Metrics: ${JSON.stringify(opportunity.baseline_metrics, null, 2)}
Supporting Data: ${JSON.stringify(opportunity.supporting_data, null, 2)}

Provide:
1. Root cause analysis (2-3 sentences)
2. Recommended actions (prioritized list)
3. Expected impact if implemented
4. Risks and mitigation strategies
5. Suggested timeline for implementation`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Update opportunity with AI recommendation
      await supabase
        .from('ad_optimization_opportunities')
        .update({
          recommendation: content.text,
          updated_at: new Date().toISOString(),
        })
        .eq('id', opportunityId);

      return content.text;
    } catch (error) {
      console.error('[AdsOptimization] Error getting AI recommendation:', error);
      throw error;
    }
  }

  /**
   * Review an opportunity (approve, reject, or mark for review)
   */
  async reviewOpportunity(
    opportunityId: string,
    action: 'approve' | 'reject' | 'review',
    userId: string,
    notes?: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const statusMap: Record<string, OpportunityStatus> = {
      approve: 'approved',
      reject: 'rejected',
      review: 'reviewing',
    };

    const { error } = await supabase
      .from('ad_optimization_opportunities')
      .update({
        status: statusMap[action],
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', opportunityId);

    if (error) {
      throw error;
    }
  }

  /**
   * Apply an approved opportunity (manual action required by user)
   */
  async markAsApplied(
    opportunityId: string,
    userId: string,
    notes?: string
  ): Promise<ApplyResult> {
    const supabase = await getSupabaseServer();

    // Verify opportunity is approved
    const { data: opportunity, error: fetchError } = await supabase
      .from('ad_optimization_opportunities')
      .select('status')
      .eq('id', opportunityId)
      .single();

    if (fetchError || !opportunity) {
      return {
        success: false,
        opportunityId,
        error: 'Opportunity not found',
      };
    }

    if (opportunity.status !== 'approved') {
      return {
        success: false,
        opportunityId,
        error: `Cannot apply opportunity with status: ${opportunity.status}`,
      };
    }

    const appliedAt = new Date();

    const { error: updateError } = await supabase
      .from('ad_optimization_opportunities')
      .update({
        status: 'applied',
        applied_at: appliedAt.toISOString(),
        applied_by: userId,
        review_notes: notes ? `${opportunity.status || ''}\nApplied: ${notes}` : undefined,
        updated_at: appliedAt.toISOString(),
      })
      .eq('id', opportunityId);

    if (updateError) {
      return {
        success: false,
        opportunityId,
        error: String(updateError),
      };
    }

    return {
      success: true,
      opportunityId,
      appliedAt,
    };
  }

  /**
   * Get open opportunities for a workspace
   */
  async getOpenOpportunities(
    workspaceId: string,
    filters?: {
      accountId?: string;
      campaignId?: string;
      types?: OptimizationType[];
      severities?: OpportunitySeverity[];
      minImpactScore?: number;
    }
  ): Promise<AdOptimizationOpportunity[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ad_optimization_opportunities')
      .select('*, ad_campaigns(name, ad_accounts(provider, name))')
      .eq('workspace_id', workspaceId)
      .in('status', ['open', 'reviewing'])
      .gt('expires_at', new Date().toISOString())
      .order('severity', { ascending: false })
      .order('estimated_impact_score', { ascending: false });

    if (filters?.campaignId) {
      query = query.eq('ad_campaign_id', filters.campaignId);
    }

    if (filters?.types?.length) {
      query = query.in('type', filters.types);
    }

    if (filters?.severities?.length) {
      query = query.in('severity', filters.severities);
    }

    if (filters?.minImpactScore) {
      query = query.gte('estimated_impact_score', filters.minImpactScore);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map(this.mapOpportunityFromDb);
  }

  /**
   * Get opportunity statistics for dashboard
   */
  async getOpportunityStats(workspaceId: string): Promise<{
    total: number;
    byStatus: Record<OpportunityStatus, number>;
    bySeverity: Record<OpportunitySeverity, number>;
    byType: Record<string, number>;
    totalEstimatedImpact: number;
    appliedThisMonth: number;
  }> {
    const supabase = await getSupabaseServer();

    const { data: opportunities, error } = await supabase
      .from('ad_optimization_opportunities')
      .select('status, severity, type, estimated_impact_value, applied_at')
      .eq('workspace_id', workspaceId);

    if (error) {
      throw error;
    }

    const stats = {
      total: opportunities?.length || 0,
      byStatus: {} as Record<OpportunityStatus, number>,
      bySeverity: {} as Record<OpportunitySeverity, number>,
      byType: {} as Record<string, number>,
      totalEstimatedImpact: 0,
      appliedThisMonth: 0,
    };

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    for (const opp of opportunities || []) {
      // By status
      stats.byStatus[opp.status as OpportunityStatus] =
        (stats.byStatus[opp.status as OpportunityStatus] || 0) + 1;

      // By severity
      stats.bySeverity[opp.severity as OpportunitySeverity] =
        (stats.bySeverity[opp.severity as OpportunitySeverity] || 0) + 1;

      // By type
      stats.byType[opp.type] = (stats.byType[opp.type] || 0) + 1;

      // Total impact
      if (opp.estimated_impact_value) {
        stats.totalEstimatedImpact += opp.estimated_impact_value;
      }

      // Applied this month
      if (opp.applied_at && new Date(opp.applied_at) >= monthStart) {
        stats.appliedThisMonth++;
      }
    }

    return stats;
  }

  // Private helper methods

  private aggregateMetrics(snapshots: AdPerformanceSnapshot[]): {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpc: number;
    cpm: number;
    conversionRate: number;
    roas: number;
  } {
    const totals = snapshots.reduce(
      (acc, s) => ({
        impressions: acc.impressions + s.impressions,
        clicks: acc.clicks + s.clicks,
        cost: acc.cost + s.cost,
        conversions: acc.conversions + s.conversions,
        revenue: acc.revenue + s.revenue,
      }),
      { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0 }
    );

    return {
      ...totals,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.cost / totals.clicks : 0,
      cpm: totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0,
      conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0,
      roas: totals.cost > 0 ? totals.revenue / totals.cost : 0,
    };
  }

  private detectBudgetIncreaseOpportunity(
    campaign: AdCampaign,
    current: ReturnType<typeof this.aggregateMetrics>,
    baseline: ReturnType<typeof this.aggregateMetrics> | null
  ): Partial<AdOptimizationOpportunity> | null {
    // High ROAS and good conversion rate suggests budget increase opportunity
    if (current.roas >= this.thresholds.minROAS * 1.5 && current.conversionRate >= this.thresholds.minConversionRate) {
      const roasImprovement = baseline ? ((current.roas - baseline.roas) / baseline.roas) * 100 : 0;

      return {
        type: 'budget_increase',
        severity: current.roas >= this.thresholds.minROAS * 2 ? 'high' : 'medium',
        title: `High-performing campaign: Consider budget increase`,
        description: `Campaign "${campaign.name}" is achieving ${current.roas.toFixed(2)}x ROAS with ${current.conversionRate.toFixed(1)}% conversion rate. Budget increase could capture additional conversions.`,
        estimatedImpactScore: Math.min(100, Math.round(current.roas * 20)),
        estimatedImpactValue: current.revenue * 0.2, // Estimate 20% revenue increase
        confidenceScore: roasImprovement > 10 ? 0.85 : 0.7,
        supportingData: { roasImprovement },
        baselineMetrics: baseline,
        currentMetrics: current,
      };
    }

    return null;
  }

  private detectBudgetDecreaseOpportunity(
    campaign: AdCampaign,
    current: ReturnType<typeof this.aggregateMetrics>,
    baseline: ReturnType<typeof this.aggregateMetrics> | null
  ): Partial<AdOptimizationOpportunity> | null {
    // Low ROAS suggests budget decrease or reallocation
    if (current.roas < this.thresholds.minROAS * 0.5 && current.cost > 100) {
      return {
        type: 'budget_decrease',
        severity: current.roas < this.thresholds.minROAS * 0.25 ? 'critical' : 'high',
        title: `Underperforming campaign: Consider budget decrease`,
        description: `Campaign "${campaign.name}" has ${current.roas.toFixed(2)}x ROAS, below the ${this.thresholds.minROAS}x target. Consider reducing budget or pausing.`,
        estimatedImpactScore: Math.round((1 - current.roas / this.thresholds.minROAS) * 100),
        estimatedImpactValue: current.cost * 0.3, // Potential savings
        confidenceScore: 0.8,
        baselineMetrics: baseline,
        currentMetrics: current,
      };
    }

    return null;
  }

  private detectUnderperformingOpportunity(
    campaign: AdCampaign,
    current: ReturnType<typeof this.aggregateMetrics>,
    baseline: ReturnType<typeof this.aggregateMetrics> | null
  ): Partial<AdOptimizationOpportunity> | null {
    // CTR significantly below threshold
    if (current.ctr < this.thresholds.minCTR && current.impressions > 1000) {
      return {
        type: 'underperforming_ad',
        severity: current.ctr < this.thresholds.minCTR * 0.5 ? 'high' : 'medium',
        title: `Low CTR: Creative refresh recommended`,
        description: `Campaign "${campaign.name}" has ${current.ctr.toFixed(2)}% CTR (target: ${this.thresholds.minCTR}%). Ad creative may need refresh.`,
        estimatedImpactScore: Math.round((this.thresholds.minCTR - current.ctr) / this.thresholds.minCTR * 100),
        confidenceScore: current.impressions > 10000 ? 0.9 : 0.7,
        baselineMetrics: baseline,
        currentMetrics: current,
      };
    }

    return null;
  }

  private detectHighPerformerOpportunity(
    campaign: AdCampaign,
    current: ReturnType<typeof this.aggregateMetrics>,
    baseline: ReturnType<typeof this.aggregateMetrics> | null
  ): Partial<AdOptimizationOpportunity> | null {
    // High performer with room to scale
    if (
      current.roas >= this.thresholds.minROAS * 2 &&
      current.ctr >= this.thresholds.minCTR * 1.5 &&
      current.conversions >= 10
    ) {
      return {
        type: 'high_performer_scale',
        severity: 'high',
        title: `Top performer: Scale opportunity`,
        description: `Campaign "${campaign.name}" is a top performer with ${current.roas.toFixed(2)}x ROAS and ${current.ctr.toFixed(2)}% CTR. Consider scaling budget or expanding targeting.`,
        estimatedImpactScore: 90,
        estimatedImpactValue: current.revenue * 0.5,
        confidenceScore: 0.85,
        baselineMetrics: baseline,
        currentMetrics: current,
      };
    }

    return null;
  }

  private detectCostEfficiencyOpportunity(
    campaign: AdCampaign,
    current: ReturnType<typeof this.aggregateMetrics>,
    baseline: ReturnType<typeof this.aggregateMetrics> | null
  ): Partial<AdOptimizationOpportunity> | null {
    // High CPC compared to conversion value
    const avgConversionValue = current.conversions > 0 ? current.revenue / current.conversions : 0;

    if (current.cpc > avgConversionValue * 0.3 && current.clicks > 100) {
      return {
        type: 'cost_efficiency',
        severity: current.cpc > avgConversionValue * 0.5 ? 'high' : 'medium',
        title: `High CPC: Bid optimization needed`,
        description: `Campaign "${campaign.name}" has $${current.cpc.toFixed(2)} CPC, which is ${((current.cpc / avgConversionValue) * 100).toFixed(0)}% of avg conversion value. Consider bid strategy adjustment.`,
        estimatedImpactScore: Math.round((current.cpc / avgConversionValue) * 50),
        estimatedImpactValue: current.cost * 0.2,
        confidenceScore: 0.75,
        baselineMetrics: baseline,
        currentMetrics: current,
      };
    }

    return null;
  }

  private detectConversionOpportunity(
    campaign: AdCampaign,
    current: ReturnType<typeof this.aggregateMetrics>,
    baseline: ReturnType<typeof this.aggregateMetrics> | null
  ): Partial<AdOptimizationOpportunity> | null {
    // Good traffic but low conversions
    if (
      current.clicks > 500 &&
      current.ctr >= this.thresholds.minCTR &&
      current.conversionRate < this.thresholds.minConversionRate
    ) {
      return {
        type: 'conversion_opportunity',
        severity: 'medium',
        title: `Conversion rate optimization opportunity`,
        description: `Campaign "${campaign.name}" has good traffic (${current.clicks} clicks, ${current.ctr.toFixed(2)}% CTR) but ${current.conversionRate.toFixed(2)}% conversion rate. Landing page or offer optimization recommended.`,
        estimatedImpactScore: 70,
        estimatedImpactValue: current.clicks * 0.01 * (baseline?.revenue || 50), // Estimate 1% conversion lift
        confidenceScore: 0.7,
        baselineMetrics: baseline,
        currentMetrics: current,
      };
    }

    return null;
  }

  private detectTrendAlert(
    campaign: AdCampaign,
    recentMetrics: AdPerformanceSnapshot[]
  ): Partial<AdOptimizationOpportunity> | null {
    if (recentMetrics.length < 3) {
return null;
}

    // Check for declining trend
    const midpoint = Math.floor(recentMetrics.length / 2);
    const firstHalf = recentMetrics.slice(midpoint);
    const secondHalf = recentMetrics.slice(0, midpoint);

    const firstHalfAvgROAS = this.aggregateMetrics(firstHalf).roas;
    const secondHalfAvgROAS = this.aggregateMetrics(secondHalf).roas;

    const roasChange = ((secondHalfAvgROAS - firstHalfAvgROAS) / firstHalfAvgROAS) * 100;

    if (roasChange < -20) {
      return {
        type: 'trend_alert',
        severity: roasChange < -40 ? 'critical' : 'high',
        title: `Performance decline detected`,
        description: `Campaign "${campaign.name}" ROAS has declined ${Math.abs(roasChange).toFixed(0)}% over the analysis period. Immediate attention recommended.`,
        estimatedImpactScore: Math.min(100, Math.abs(roasChange)),
        confidenceScore: recentMetrics.length >= 7 ? 0.85 : 0.65,
        supportingData: {
          roasChange,
          firstHalfAvgROAS,
          secondHalfAvgROAS,
          dataPoints: recentMetrics.length,
        },
      };
    }

    return null;
  }

  private mapOpportunityFromDb(data: Record<string, unknown>): AdOptimizationOpportunity {
    return {
      id: data.id as string,
      adCampaignId: data.ad_campaign_id as string,
      adSetId: data.ad_set_id as string | undefined,
      workspaceId: data.workspace_id as string,
      detectedAt: new Date(data.detected_at as string),
      type: data.type as OptimizationType,
      severity: data.severity as OpportunitySeverity,
      title: data.title as string,
      description: data.description as string,
      recommendation: data.recommendation as string | undefined,
      estimatedImpactScore: data.estimated_impact_score as number | undefined,
      estimatedImpactValue: data.estimated_impact_value as number | undefined,
      confidenceScore: data.confidence_score as number | undefined,
      supportingData: data.supporting_data as Record<string, unknown> | undefined,
      comparisonPeriod: data.comparison_period as string | undefined,
      baselineMetrics: data.baseline_metrics as Record<string, unknown> | undefined,
      currentMetrics: data.current_metrics as Record<string, unknown> | undefined,
      status: data.status as OpportunityStatus,
      reviewedBy: data.reviewed_by as string | undefined,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at as string) : undefined,
      reviewNotes: data.review_notes as string | undefined,
      appliedAt: data.applied_at ? new Date(data.applied_at as string) : undefined,
      appliedBy: data.applied_by as string | undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at as string) : undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }
}

export const adsOptimizationService = new AdsOptimizationService();
