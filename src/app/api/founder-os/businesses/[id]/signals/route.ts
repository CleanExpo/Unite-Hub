import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import { getBusiness } from '@/lib/founderOS/founderBusinessRegistryService';
import {
  getSignals,
  recordSignal,
  type SignalFamily,
} from '@/lib/founderOS/founderSignalInferenceService';

/**
 * GET /api/founder-os/businesses/[id]/signals
 * Get recent signals for a business
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    console.log('[founder-os/businesses/[id]/signals] GET request for business:', businessId);

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

    // Verify business ownership
    const businessResult = await getBusiness(businessId);
    if (!businessResult.success) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (businessResult.data?.owner_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const family = req.nextUrl.searchParams.get('family') as SignalFamily | undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100', 10);
    const since = req.nextUrl.searchParams.get('since') || undefined;

    // Get signals
    const result = await getSignals(businessId, family, limit, since);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/businesses/[id]/signals] Retrieved', result.data?.length || 0, 'signals');

    return NextResponse.json({
      success: true,
      signals: result.data || [],
    });
  } catch (error) {
    console.error('[founder-os/businesses/[id]/signals] GET error:', error);
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
 * POST /api/founder-os/businesses/[id]/signals
 * Record a new signal for a business
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    console.log('[founder-os/businesses/[id]/signals] POST request for business:', businessId);

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

    // Verify business ownership
    const businessResult = await getBusiness(businessId);
    if (!businessResult.success) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (businessResult.data?.owner_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { family, key, value, source, payload } = body;

    // Validate required fields
    if (!family || !key || value === undefined || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: family, key, value, source' },
        { status: 400 }
      );
    }

    // Record the signal
    const result = await recordSignal(businessId, family, key, value, source, payload);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log('[founder-os/businesses/[id]/signals] Signal recorded:', result.data?.id);

    return NextResponse.json({
      success: true,
      signal: result.data,
    });
  } catch (error) {
    console.error('[founder-os/businesses/[id]/signals] POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
