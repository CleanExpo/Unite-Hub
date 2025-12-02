import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getBalance, canEarnMoreCredits } from '@/lib/loyalty/loyaltyEngine';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/loyalty/credit
 * Get current credit balance for authenticated user
 *
 * Query params:
 *   - workspaceId (required): Workspace ID
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

    // Get workspace ID
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    // Verify workspace access
    const supabase = await getSupabaseAdmin();
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .maybeSingle();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Get balance
    const balance = await getBalance(supabase, workspaceId, userId);

    if (!balance) {
      return NextResponse.json(
        { error: 'Failed to fetch balance' },
        { status: 500 }
      );
    }

    // Check if can earn more
    const canEarnMore = await canEarnMoreCredits(supabase, workspaceId, userId);

    return NextResponse.json({
      balance: balance.balance.toString(),
      lifetimeEarned: balance.lifetimeEarned.toString(),
      lifetimeRedeemed: balance.lifetimeRedeemed.toString(),
      monthlyCap: balance.monthlyCap.toString(),
      monthlyEarned: balance.monthlyEarned.toString(),
      monthlyRemaining: balance.monthlyRemaining.toString(),
      canEarnMore,
    });
  } catch (error) {
    console.error('[/api/loyalty/credit] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
