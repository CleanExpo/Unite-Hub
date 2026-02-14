/**
 * A/B Test API
 *
 * Endpoints for A/B test analysis and winner selection
 *
 * GET /api/campaigns/[campaignId]/ab-test - Get A/B test results
 * POST /api/campaigns/[campaignId]/ab-test/analyze - Analyze test
 * POST /api/campaigns/[campaignId]/ab-test/declare-winner - Declare winner
 * POST /api/campaigns/[campaignId]/ab-test/update-metrics - Update metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/logger';
import {
  getTestResults,
  analyzeTest,
  declareWinner,
  updateTestMetrics,
  calculateRequiredSampleSize,
} from '@/lib/ab-testing';

const logger = createApiLogger({ service: 'ABTestAPI' });

/**
 * Get A/B test results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;

    logger.info('Getting A/B test results', { campaignId });

    const results = await getTestResults(campaignId);

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      results,
    });
  } catch (error) {
    logger.error('Failed to get A/B test results', { error });

    return NextResponse.json(
      {
        error: 'Failed to get A/B test results',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Analyze A/B test or update metrics
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'analyze':
        return await handleAnalyze(campaignId, body);

      case 'declare_winner':
        return await handleDeclareWinner(campaignId, body);

      case 'update_metrics':
        return await handleUpdateMetrics(campaignId);

      case 'calculate_sample_size':
        return await handleCalculateSampleSize(body);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('A/B test action failed', { error });

    return NextResponse.json(
      {
        error: 'A/B test action failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Handle analyze action
 */
async function handleAnalyze(campaignId: string, body: any) {
  const { winner_metric, confidence_level, minimum_sample_size } = body;

  logger.info('Analyzing A/B test', { campaignId });

  const result = await analyzeTest(campaignId, {
    winnerMetric: winner_metric,
    confidenceLevel: confidence_level,
    minimumSampleSize: minimum_sample_size,
  });

  return NextResponse.json({
    success: true,
    campaign_id: campaignId,
    can_declare_winner: result.canDeclareWinner,
    analysis: result.analysis,
    winner: result.winner,
  });
}

/**
 * Handle declare winner action
 */
async function handleDeclareWinner(campaignId: string, body: any) {
  const { winner_id } = body;

  if (!winner_id) {
    return NextResponse.json({ error: 'winner_id is required' }, { status: 400 });
  }

  logger.info('Declaring winner', { campaignId, winnerId: winner_id });

  await declareWinner(campaignId, winner_id);

  return NextResponse.json({
    success: true,
    campaign_id: campaignId,
    winner_id,
    message: 'Winner declared successfully',
  });
}

/**
 * Handle update metrics action
 */
async function handleUpdateMetrics(campaignId: string) {
  logger.info('Updating A/B test metrics', { campaignId });

  await updateTestMetrics(campaignId);

  return NextResponse.json({
    success: true,
    campaign_id: campaignId,
    message: 'Metrics updated successfully',
  });
}

/**
 * Handle calculate sample size action
 */
async function handleCalculateSampleSize(body: any) {
  const { baseline_rate, minimum_detectable_effect, confidence_level, power } = body;

  if (baseline_rate === undefined || minimum_detectable_effect === undefined) {
    return NextResponse.json(
      { error: 'baseline_rate and minimum_detectable_effect are required' },
      { status: 400 }
    );
  }

  const sampleSize = calculateRequiredSampleSize({
    baselineRate: baseline_rate,
    minimumDetectableEffect: minimum_detectable_effect,
    confidenceLevel: confidence_level,
    power,
  });

  return NextResponse.json({
    success: true,
    required_sample_size: sampleSize,
    per_variant: sampleSize,
    total: sampleSize * 2, // Assuming 2 variants
    parameters: {
      baseline_rate,
      minimum_detectable_effect,
      confidence_level: confidence_level || 95,
      power: power || 0.8,
    },
  });
}
