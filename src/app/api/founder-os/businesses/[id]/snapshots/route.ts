import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import { getBusiness } from '@/lib/founderOS/founderBusinessRegistryService';
import {
  getSnapshots,
  generateBusinessSynopsis,
  type SnapshotScope,
  type SnapshotType,
} from '@/lib/founderOS/founderUmbrellaSynopsisService';

/**
 * GET /api/founder-os/businesses/[id]/snapshots
 * List snapshots for a specific business
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    console.log('[founder-os/businesses/[id]/snapshots] GET request for business:', businessId);

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
    const snapshotType = req.nextUrl.searchParams.get('type') as SnapshotType | undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);

    // Get snapshots for this specific business
    const result = await getSnapshots(userId, 'business', snapshotType, limit);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Filter to only snapshots for this business
    const businessSnapshots = (result.data || []).filter((s) => s.scope_id === businessId);

    console.log('[founder-os/businesses/[id]/snapshots] Retrieved', businessSnapshots.length, 'snapshots');

    return NextResponse.json({
      success: true,
      snapshots: businessSnapshots,
    });
  } catch (error) {
    console.error('[founder-os/businesses/[id]/snapshots] GET error:', error);
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
 * POST /api/founder-os/businesses/[id]/snapshots
 * Generate a new AI-powered synopsis/snapshot for a business
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    console.log('[founder-os/businesses/[id]/snapshots] POST request for business:', businessId);

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

    // Generate AI-powered synopsis
    console.log('[founder-os/businesses/[id]/snapshots] Generating AI synopsis for business:', businessId);
    const result = await generateBusinessSynopsis(businessId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('[founder-os/businesses/[id]/snapshots] Synopsis generated successfully');

    return NextResponse.json({
      success: true,
      synopsis: result.data,
    });
  } catch (error) {
    console.error('[founder-os/businesses/[id]/snapshots] POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
