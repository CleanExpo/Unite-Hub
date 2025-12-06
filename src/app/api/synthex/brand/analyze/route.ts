/**
 * Synthex Brand Tone Analysis API
 * Phase B19: Content tone analysis endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeContentTone } from '@/lib/synthex/brandEngineService';

/**
 * POST /api/synthex/brand/analyze
 * Analyze content for tone and brand alignment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, content, contentType, voiceId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { status: 'error', error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { status: 'error', error: 'content is required' },
        { status: 400 }
      );
    }

    if (!contentType) {
      return NextResponse.json(
        { status: 'error', error: 'contentType is required (email, social, ad, landing_page, blog, other)' },
        { status: 400 }
      );
    }

    const result = await analyzeContentTone(tenantId, content, contentType, voiceId);

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      analysis: result.data,
    });
  } catch (error) {
    console.error('[Brand Analyze API] POST error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}
