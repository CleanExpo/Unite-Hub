import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  getDomainScores,
  computeDomainScore,
  type CognitiveDomain,
} from '@/lib/founderOS/cognitiveTwinService';

/**
 * GET /api/founder-os/cognitive-twin/scores
 * Get domain health scores for the authenticated founder
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[founder-os/cognitive-twin/scores] GET request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user ID
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Get query parameters
    const domain = req.nextUrl.searchParams.get('domain') as CognitiveDomain | undefined;
    const businessId = req.nextUrl.searchParams.get('businessId') || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);

    // Get domain scores
    const result = await getDomainScores(userId, domain, businessId, limit);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/cognitive-twin/scores] Retrieved', result.data?.length || 0, 'scores');

    return NextResponse.json({
      success: true,
      scores: result.data || [],
    });
  } catch (error) {
    console.error('[founder-os/cognitive-twin/scores] GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/founder-os/cognitive-twin/scores
 * Calculate a new domain health score using AI
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[founder-os/cognitive-twin/scores] POST request received');

    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user ID
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Parse request body
    const body = await req.json();
    const { domain, businessId } = body;

    // Validate required fields
    if (!domain) {
      return NextResponse.json({ error: 'Missing required field: domain' }, { status: 400 });
    }

    // Compute domain score with AI
    console.log('[founder-os/cognitive-twin/scores] Computing domain score for:', domain);
    const result = await computeDomainScore(userId, domain, businessId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/cognitive-twin/scores] Score computed:', result.data?.id);

    return NextResponse.json({
      success: true,
      score: result.data,
    });
  } catch (error) {
    console.error('[founder-os/cognitive-twin/scores] POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
