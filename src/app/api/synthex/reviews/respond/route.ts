/**
 * Synthex Review Response API
 * POST: Generate suggested response to a review
 */

import { NextRequest, NextResponse } from 'next/server';
import { suggestReviewResponse, updateReviewResponse } from '@/lib/synthex/reputationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, tenantId, voiceId, action } = body;

    if (!reviewId || !tenantId) {
      return NextResponse.json(
        { error: 'reviewId and tenantId are required' },
        { status: 400 }
      );
    }

    // If action is 'save', update the review with the provided response
    if (action === 'save') {
      const { response, responseAuthor } = body;

      if (!response) {
        return NextResponse.json(
          { error: 'response is required when action is save' },
          { status: 400 }
        );
      }

      const result = await updateReviewResponse(reviewId, response, responseAuthor);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        review: result.data,
      });
    }

    // Default action: generate suggested response
    const result = await suggestReviewResponse(reviewId, tenantId, voiceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      suggestedResponse: result.data,
    });
  } catch (error) {
    console.error('[API /synthex/reviews/respond POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
