import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import {
  getInsights,
  generateInsight,
  type InsightScope,
  type InsightFilters,
} from '@/lib/founderOS/aiPhillAdvisorService';

/**
 * GET /api/founder-os/ai-phill/insights
 * List AI Phill insights for the authenticated founder
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[founder-os/ai-phill/insights] GET request received');

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

    // Build filters from query parameters
    const filters: InsightFilters = {};

    const category = req.nextUrl.searchParams.get('category');
    if (category) filters.category = category as any;

    const priority = req.nextUrl.searchParams.get('priority');
    if (priority) filters.priority = priority as any;

    const reviewStatus = req.nextUrl.searchParams.get('reviewStatus');
    if (reviewStatus) filters.reviewStatus = reviewStatus as any;

    const businessId = req.nextUrl.searchParams.get('businessId');
    if (businessId) filters.businessId = businessId;

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
    filters.limit = limit;

    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);
    if (offset > 0) filters.offset = offset;

    // Get insights
    const result = await getInsights(userId, filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/ai-phill/insights] Retrieved', result.data?.length || 0, 'insights');

    return NextResponse.json({
      success: true,
      insights: result.data || [],
    });
  } catch (error) {
    console.error('[founder-os/ai-phill/insights] GET error:', error);
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
 * POST /api/founder-os/ai-phill/insights
 * Request a new AI-generated insight
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[founder-os/ai-phill/insights] POST request received');

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
    const { scope, scopeId, topic, signals, journalEntries, customContext } = body;

    // Validate required fields
    if (!scope) {
      return NextResponse.json({ error: 'Missing required field: scope' }, { status: 400 });
    }

    // Build context
    const context = {
      topic,
      signals,
      journal_entries: journalEntries,
      custom_context: customContext,
    };

    // Generate AI insight
    console.log('[founder-os/ai-phill/insights] Generating AI insight for scope:', scope);
    const result = await generateInsight(userId, scope as InsightScope, scopeId || null, context);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/ai-phill/insights] Insight generated:', result.data?.id);

    return NextResponse.json({
      success: true,
      insight: result.data,
    });
  } catch (error) {
    console.error('[founder-os/ai-phill/insights] POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
