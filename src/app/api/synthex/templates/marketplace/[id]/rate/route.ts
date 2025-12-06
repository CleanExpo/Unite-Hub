/**
 * Synthex Template Rating API
 * Phase B34: Template Marketplace
 *
 * GET  - Get ratings for a template
 * POST - Rate a template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  rateTemplate,
  getTemplateRatings,
} from '@/lib/synthex/templateMarketplaceService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const ratings = await getTemplateRatings(id, limit);

    // Calculate average
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    return NextResponse.json({
      ratings,
      count: ratings.length,
      average: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    console.error('Error in templates/marketplace/[id]/rate GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { rating, feedback } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const ratingRecord = await rateTemplate(id, user.id, rating, feedback);

    return NextResponse.json({
      rating: ratingRecord,
      message: 'Rating submitted successfully',
    });
  } catch (error) {
    console.error('Error in templates/marketplace/[id]/rate POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
