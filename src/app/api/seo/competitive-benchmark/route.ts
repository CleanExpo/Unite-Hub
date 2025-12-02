/**
 * Competitive Benchmark API
 * POST /api/seo/competitive-benchmark
 */

import { NextRequest, NextResponse } from 'next/server';
import { competitiveBenchmarkService } from '@/lib/seo/competitiveBenchmarkService';
import logger from '@/lib/logger';

interface CompetitiveBenchmarkRequest {
  clientDomain: string;
  competitors: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CompetitiveBenchmarkRequest;

    const { clientDomain, competitors } = body;

    if (!clientDomain) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: clientDomain',
        },
        { status: 400 }
      );
    }

    logger.info('[CompetitiveBenchmark API] Starting analysis', {
      clientDomain,
      competitorCount: competitors.length,
    });

    const result = competitiveBenchmarkService.analyzeBenchmark(clientDomain, competitors);

    logger.info('[CompetitiveBenchmark API] Analysis complete', {
      clientDomain,
      position: result.summary.overall_market_position,
      winLossRatio: result.summary.win_loss_ratio,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('[CompetitiveBenchmark API] Error in analysis', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        message: `Error analyzing benchmark: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
