/**
 * A/B Test Manager
 *
 * Manages A/B test lifecycle: metric tracking, analysis, winner selection
 *
 * @module ab-testing/ABTestManager
 */

import { createApiLogger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { ABTestResult } from '@/lib/models/social-drip-campaign';
import { analyzeABTest, calculateRequiredSampleSize, type VariantMetrics } from './StatisticalAnalysis';

const logger = createApiLogger({ service: 'ABTestManager' });

// ============================================================================
// Types
// ============================================================================

export interface ABTestMetrics {
  campaignId: string;
  variantId: string;
  variantGroup: string;

  // Raw counts
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  totalConverted: number;
  totalUnsubscribed: number;
  totalBounced: number;

  // Calculated rates
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  conversionRate: number;
  engagementScore: number;
}

export interface WinnerSelection {
  campaignId: string;
  winnerId: string;
  winnerName: string;
  winnerMetrics: ABTestMetrics;
  confidenceLevel: number;
  pValue: number;
  testType: string;
  declaredAt: Date;
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Calculate metrics for A/B test variant
 */
export async function calculateVariantMetrics(
  campaignId: string,
  variantGroup: string
): Promise<ABTestMetrics> {
  const supabase = await createClient();

  try {
    // Get events for this variant
    const { data: events, error } = await supabase
      .from('campaign_events')
      .select('event_type')
      .eq('campaign_id', campaignId)
      .eq('variant_group', variantGroup);

    if (error) throw error;

    // Count events by type
    const eventCounts = events.reduce((counts: Record<string, number>, event) => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
      return counts;
    }, {});

    const totalSent = eventCounts['email_sent'] || eventCounts['sms_sent'] || 0;
    const totalDelivered = eventCounts['email_delivered'] || eventCounts['sms_delivered'] || 0;
    const totalOpened = eventCounts['email_opened'] || 0;
    const totalClicked = eventCounts['email_clicked'] || 0;
    const totalReplied = eventCounts['email_replied'] || eventCounts['sms_replied'] || 0;
    const totalBounced = eventCounts['email_bounced'] || 0;
    const totalUnsubscribed = 0; // TODO: Track unsubscribe events

    // Get conversions (from enrollment completed events)
    const totalConverted = eventCounts['enrollment_completed'] || 0;

    // Calculate rates
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    const replyRate = totalDelivered > 0 ? (totalReplied / totalDelivered) * 100 : 0;
    const conversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0;

    // Engagement score (weighted average)
    const engagementScore =
      openRate * 0.2 + clickRate * 0.3 + replyRate * 0.3 + conversionRate * 0.2;

    return {
      campaignId,
      variantId: variantGroup,
      variantGroup,
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalReplied,
      totalConverted,
      totalUnsubscribed,
      totalBounced,
      deliveryRate,
      openRate,
      clickRate,
      replyRate,
      conversionRate,
      engagementScore,
    };
  } catch (error) {
    logger.error('Failed to calculate variant metrics', { error, campaignId, variantGroup });
    throw error;
  }
}

/**
 * Analyze A/B test and determine if winner can be declared
 */
export async function analyzeTest(
  campaignId: string,
  options: {
    winnerMetric?: 'open_rate' | 'click_rate' | 'conversion_rate' | 'engagement_score';
    confidenceLevel?: number;
    minimumSampleSize?: number;
  } = {}
): Promise<{
  canDeclareWinner: boolean;
  analysis: any;
  winner?: WinnerSelection;
}> {
  const supabase = await createClient();

  try {
    // Get campaign A/B test config
    const { data: campaign, error: campaignError } = await supabase
      .from('drip_campaigns')
      .select('ab_test_config, ab_test_winner_id')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    if (!campaign.ab_test_config || !campaign.ab_test_config.enabled) {
      throw new Error('Campaign does not have A/B testing enabled');
    }

    // Check if winner already declared
    if (campaign.ab_test_winner_id) {
      logger.info('Winner already declared', { campaignId, winnerId: campaign.ab_test_winner_id });
      return {
        canDeclareWinner: false,
        analysis: { message: 'Winner already declared' },
      };
    }

    const abTestConfig = campaign.ab_test_config;
    const winnerMetric = options.winnerMetric || abTestConfig.winner_metric || 'conversion_rate';
    const confidenceLevel =
      options.confidenceLevel ?? abTestConfig.confidence_threshold ?? 95;
    const minimumSampleSize =
      options.minimumSampleSize ?? abTestConfig.minimum_sample_size ?? 100;

    // Get metrics for each variant
    const variantMetrics: VariantMetrics[] = [];

    for (const variant of abTestConfig.variants) {
      const metrics = await calculateVariantMetrics(campaignId, variant.id);

      // Map metric to VariantMetrics format
      variantMetrics.push({
        variantId: variant.id,
        variantName: variant.name,
        sampleSize: metrics.totalSent,
        conversions: getConversionsForMetric(metrics, winnerMetric),
        conversionRate: getRateForMetric(metrics, winnerMetric),
      });
    }

    // Analyze
    const analysis = analyzeABTest(variantMetrics, {
      confidenceLevel,
      minimumSampleSize,
    });

    logger.info('A/B test analysis complete', {
      campaignId,
      canDeclareWinner: analysis.testResult.isSignificant,
      recommendedAction: analysis.recommendedAction,
    });

    // Check if we can declare winner
    if (
      analysis.testResult.isSignificant &&
      analysis.testResult.winner &&
      analysis.recommendedAction === 'declare_winner'
    ) {
      const winnerId = analysis.testResult.winner;
      const winnerVariant = abTestConfig.variants.find((v: any) => v.id === winnerId);
      const winnerMetricsData = variantMetrics.find((v) => v.variantId === winnerId);

      if (winnerVariant && winnerMetricsData) {
        const winner: WinnerSelection = {
          campaignId,
          winnerId: winnerVariant.id,
          winnerName: winnerVariant.name,
          winnerMetrics: await calculateVariantMetrics(campaignId, winnerId),
          confidenceLevel: analysis.testResult.confidenceLevel,
          pValue: analysis.testResult.pValue,
          testType: analysis.testResult.testType,
          declaredAt: new Date(),
        };

        return {
          canDeclareWinner: true,
          analysis,
          winner,
        };
      }
    }

    return {
      canDeclareWinner: false,
      analysis,
    };
  } catch (error) {
    logger.error('Failed to analyze A/B test', { error, campaignId });
    throw error;
  }
}

/**
 * Declare A/B test winner
 */
export async function declareWinner(campaignId: string, winnerId: string): Promise<void> {
  const supabase = await createClient();

  try {
    logger.info('Declaring A/B test winner', { campaignId, winnerId });

    // Update campaign with winner
    const { error: updateError } = await supabase
      .from('drip_campaigns')
      .update({
        ab_test_winner_id: winnerId,
        ab_test_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) throw updateError;

    // Update A/B test results table
    const { error: resultsError } = await supabase
      .from('campaign_ab_test_results')
      .update({
        is_winner: true,
        winner_declared_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId)
      .eq('variant_group', winnerId);

    if (resultsError) throw resultsError;

    logger.info('Winner declared successfully', { campaignId, winnerId });
  } catch (error) {
    logger.error('Failed to declare winner', { error, campaignId, winnerId });
    throw error;
  }
}

/**
 * Update A/B test metrics (called periodically)
 */
export async function updateTestMetrics(campaignId: string): Promise<void> {
  const supabase = await createClient();

  try {
    // Get campaign A/B test config
    const { data: campaign, error: campaignError } = await supabase
      .from('drip_campaigns')
      .select('ab_test_config')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    if (!campaign.ab_test_config || !campaign.ab_test_config.enabled) {
      return;
    }

    const abTestConfig = campaign.ab_test_config;

    // Calculate and store metrics for each variant
    for (const variant of abTestConfig.variants) {
      const metrics = await calculateVariantMetrics(campaignId, variant.id);

      // Get or create test result record
      const { data: existing, error: fetchError } = await supabase
        .from('campaign_ab_test_results')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('variant_group', variant.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = not found
        throw fetchError;
      }

      const testResultData = {
        campaign_id: campaignId,
        variant_group: variant.id,
        variant_step_id: variant.step_ids?.[0] || null,
        total_sent: metrics.totalSent,
        total_delivered: metrics.totalDelivered,
        total_opened: metrics.totalOpened,
        total_clicked: metrics.totalClicked,
        total_replied: metrics.totalReplied,
        total_converted: metrics.totalConverted,
        total_unsubscribed: metrics.totalUnsubscribed,
        total_bounced: metrics.totalBounced,
        delivery_rate: metrics.deliveryRate,
        open_rate: metrics.openRate,
        click_rate: metrics.clickRate,
        reply_rate: metrics.replyRate,
        conversion_rate: metrics.conversionRate,
        engagement_score: metrics.engagementScore,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update
        const { error: updateError } = await supabase
          .from('campaign_ab_test_results')
          .update(testResultData)
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('campaign_ab_test_results')
          .insert({
            ...testResultData,
            test_started_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }
    }

    logger.info('A/B test metrics updated', { campaignId });
  } catch (error) {
    logger.error('Failed to update A/B test metrics', { error, campaignId });
    throw error;
  }
}

/**
 * Auto-declare winner if conditions met
 */
export async function autoCheckAndDeclareWinner(campaignId: string): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('drip_campaigns')
      .select('ab_test_config, ab_test_winner_id')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    if (!campaign.ab_test_config || !campaign.ab_test_config.enabled) {
      return false;
    }

    // Check if auto-select is enabled
    if (!campaign.ab_test_config.auto_select_winner) {
      return false;
    }

    // Check if winner already declared
    if (campaign.ab_test_winner_id) {
      return false;
    }

    // Analyze test
    const result = await analyzeTest(campaignId);

    if (result.canDeclareWinner && result.winner) {
      await declareWinner(campaignId, result.winner.winnerId);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Failed to auto-check winner', { error, campaignId });
    return false;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get conversions for specific metric
 */
function getConversionsForMetric(metrics: ABTestMetrics, metricType: string): number {
  switch (metricType) {
    case 'open_rate':
      return metrics.totalOpened;
    case 'click_rate':
      return metrics.totalClicked;
    case 'conversion_rate':
      return metrics.totalConverted;
    case 'engagement_score':
      return Math.round((metrics.engagementScore / 100) * metrics.totalSent);
    default:
      return metrics.totalConverted;
  }
}

/**
 * Get rate for specific metric
 */
function getRateForMetric(metrics: ABTestMetrics, metricType: string): number {
  switch (metricType) {
    case 'open_rate':
      return metrics.openRate / 100;
    case 'click_rate':
      return metrics.clickRate / 100;
    case 'conversion_rate':
      return metrics.conversionRate / 100;
    case 'engagement_score':
      return metrics.engagementScore / 100;
    default:
      return metrics.conversionRate / 100;
  }
}

/**
 * Get all A/B test results for campaign
 */
export async function getTestResults(campaignId: string): Promise<ABTestResult[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('campaign_ab_test_results')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      campaign_id: row.campaign_id,
      variant_group: row.variant_group,
      variant_step_id: row.variant_step_id,
      total_sent: row.total_sent,
      total_delivered: row.total_delivered,
      total_opened: row.total_opened,
      total_clicked: row.total_clicked,
      total_replied: row.total_replied,
      total_converted: row.total_converted,
      total_unsubscribed: row.total_unsubscribed,
      total_bounced: row.total_bounced,
      delivery_rate: row.delivery_rate,
      open_rate: row.open_rate,
      click_rate: row.click_rate,
      reply_rate: row.reply_rate,
      conversion_rate: row.conversion_rate,
      engagement_score: row.engagement_score,
      confidence_level: row.confidence_level || 0,
      p_value: row.p_value || 1,
      is_statistically_significant: row.is_statistically_significant || false,
      is_winner: row.is_winner || false,
      test_started_at: new Date(row.test_started_at),
      test_ended_at: row.test_ended_at ? new Date(row.test_ended_at) : undefined,
      winner_declared_at: row.winner_declared_at ? new Date(row.winner_declared_at) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }));
  } catch (error) {
    logger.error('Failed to get test results', { error, campaignId });
    throw error;
  }
}

export { calculateRequiredSampleSize };
