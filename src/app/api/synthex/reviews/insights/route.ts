/**
 * Synthex Review Insights API
 * POST: Analyze a review with AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeReviewWithAI } from '@/lib/synthex/reputationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, tenantId } = body;

    if (!reviewId || !tenantId) {
      return NextResponse.json(
        { error: 'reviewId and tenantId are required' },
        { status: 400 }
      );
    }

    const result = await analyzeReviewWithAI(reviewId, tenantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      insight: result.data,
    });
  } catch (error) {
    console.error('[API /synthex/reviews/insights POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
