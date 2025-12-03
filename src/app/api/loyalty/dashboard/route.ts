import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getBalance, getMonthlyProgress, getCreditHistory } from '@/lib/loyalty/loyaltyEngine';
import { getUserReferralStats } from '@/lib/loyalty/referralEngine';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/loyalty/dashboard
 * Get complete loyalty dashboard summary
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

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    // Get admin client
    const supabase = await getSupabaseAdmin();

    // Fetch all dashboard data in parallel
    const [balance, monthlyProgress, history, referralStats] = await Promise.all([
      getBalance(supabase, workspaceId, userId),
      getMonthlyProgress(supabase, workspaceId, userId),
      getCreditHistory(supabase, workspaceId, userId, 5, 0), // Last 5 transactions
      getUserReferralStats(supabase, workspaceId, userId),
    ]);

    if (!balance) {
      return NextResponse.json(
        { error: 'Failed to fetch balance' },
        { status: 500 }
      );
    }

    // Calculate monthly progress percentage
    const monthlyEarned = BigInt(balance.monthlyEarned);
    const monthlyCap = BigInt(balance.monthlyCap);
    const monthlyProgress_pct = Math.round((Number(monthlyEarned) / Number(monthlyCap)) * 100);

    return NextResponse.json({
      currentBalance: balance.balance.toString(),
      monthlyRemaining: balance.monthlyRemaining.toString(),
      lifetimeEarned: balance.lifetimeEarned.toString(),
      lifetimeRedeemed: balance.lifetimeRedeemed.toString(),
      monthlyProgress: monthlyProgress_pct,
      canEarnMore: balance.canEarnMore,
      recentTransactions: history.map((tx: any) => ({
        type: tx.transaction_type,
        amount: tx.amount.toString(),
        timestamp: tx.created_at,
      })),
      referralStats: {
        totalCodes: referralStats.totalCodeGenerated,
        totalInvitesSent: referralStats.totalInvitesSent,
        totalAccepted: referralStats.totalAccepted,
        creditsEarned: referralStats.totalCreditsEarned.toString(),
      },
    });
  } catch (error) {
    console.error('[/api/loyalty/dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
