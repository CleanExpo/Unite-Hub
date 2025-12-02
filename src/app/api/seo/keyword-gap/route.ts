/**
 * Keyword Gap Analysis API
 * POST /api/seo/keyword-gap
 */

import { NextRequest, NextResponse } from 'next/server';
import { keywordGapAnalysisService } from '@/lib/seo/keywordGapAnalysisService';
import logger from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

interface KeywordGapRequest {
  clientId: string;
  clientDomain?: string;
  competitors: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Session validation
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as KeywordGapRequest;

    const { clientId, clientDomain = 'example.com', competitors } = body;

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required field: clientId',
        },
        { status: 400 }
      );
    }

    logger.info('[KeywordGap API] Starting analysis', {
      clientId,
      clientDomain,
      competitorCount: competitors.length,
    });

    const result = keywordGapAnalysisService.analyzeGaps(clientDomain, competitors);

    logger.info('[KeywordGap API] Analysis complete', {
      clientId,
      gapCount: result.keyword_gaps.length,
      totalTraffic: result.summary.total_potential_traffic,
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
    logger.error('[KeywordGap API] Error in analysis', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        message: `Error analyzing keywords: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
