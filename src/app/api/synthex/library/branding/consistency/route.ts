/**
 * Synthex Brand Consistency Check API
 * Phase D06: Auto-Branding Engine
 *
 * POST - Check content for brand consistency
 * GET - Get consistency check history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  checkBrandConsistency,
  getConsistencyHistory,
} from '@/lib/synthex/brandingService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const history = await getConsistencyHistory(tenantId, limit);

    return NextResponse.json({
      success: true,
      checks: history,
      count: history.length,
    });
  } catch (error) {
    console.error('[Brand Consistency API] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, content, contentType, contentId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!content || !contentType) {
      return NextResponse.json(
        { error: 'content and contentType are required' },
        { status: 400 }
      );
    }

    const check = await checkBrandConsistency(
      tenantId,
      content,
      contentType,
      contentId
    );

    return NextResponse.json({
      success: true,
      check,
      isConsistent: check.is_consistent,
      score: check.overall_score,
    });
  } catch (error) {
    console.error('[Brand Consistency API] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check consistency' },
      { status: 500 }
    );
  }
}
