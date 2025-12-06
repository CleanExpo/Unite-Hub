/**
 * Synthex Reviews API
 * GET: List reviews with filters
 * POST: Ingest new reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getReviews,
  ingestReviews,
  type IngestReviewPayload,
  type ReviewFilters,
} from '@/lib/synthex/reputationService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const filters: ReviewFilters = {
      source: searchParams.get('source') as any,
      minRating: searchParams.get('minRating')
        ? Number(searchParams.get('minRating'))
        : undefined,
      maxRating: searchParams.get('maxRating')
        ? Number(searchParams.get('maxRating'))
        : undefined,
      hasResponse: searchParams.get('hasResponse')
        ? searchParams.get('hasResponse') === 'true'
        : undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      limit: searchParams.get('limit')
        ? Number(searchParams.get('limit'))
        : 50,
      offset: searchParams.get('offset')
        ? Number(searchParams.get('offset'))
        : 0,
    };

    const result = await getReviews(tenantId, filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      reviews: result.data,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('[API /synthex/reviews GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviews } = body;

    if (!reviews || !Array.isArray(reviews)) {
      return NextResponse.json(
        { error: 'reviews array is required' },
        { status: 400 }
      );
    }

    // Validate each review payload
    for (const review of reviews) {
      if (!review.tenantId || !review.source || !review.authorName || !review.body) {
        return NextResponse.json(
          {
            error:
              'Each review must have tenantId, source, authorName, and body',
          },
          { status: 400 }
        );
      }

      if (typeof review.rating !== 'number' || review.rating < 0 || review.rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be a number between 0 and 5' },
          { status: 400 }
        );
      }
    }

    const result = await ingestReviews(reviews as IngestReviewPayload[]);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reviews: result.data,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('[API /synthex/reviews POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
