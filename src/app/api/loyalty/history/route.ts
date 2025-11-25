import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getCreditHistory } from '@/lib/loyalty/loyaltyEngine';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/loyalty/history
 * Get credit transaction history
 *
 * Query params:
 *   - workspaceId (required): Workspace ID
 *   - transactionType (optional): Filter by transaction type
 *   - limit (optional): Number of records (default: 50)
 *   - offset (optional): Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await strictRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get auth header
    const authHeader = request.headers.get('authorization');
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
      const supabase = await import('@/lib/supabase').then((m) => m.getSupabaseServer());
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get parameters
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    const transactionType = request.nextUrl.searchParams.get('transactionType') || undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    // Get admin client and fetch history
    const supabase = await getSupabaseAdmin();
    const history = await getCreditHistory(
      supabase,
      workspaceId,
      userId,
      limit,
      offset,
      transactionType
    );

    return NextResponse.json({
      transactions: history.map((tx: any) => ({
        id: tx.id,
        type: tx.transaction_type,
        amount: tx.amount,
        relatedEntityType: tx.related_entity_type,
        relatedEntityId: tx.related_entity_id,
        details: tx.details,
        createdAt: tx.created_at,
      })),
      limit,
      offset,
    });
  } catch (error) {
    console.error('[/api/loyalty/history] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
