import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateReferralCode } from '@/lib/loyalty/referralEngine';
import { logReferralEvent } from '@/lib/loyalty/loyaltyArchiveBridge';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/loyalty/referral/create
 * Generate a new referral code for authenticated user
 *
 * Body:
 *   - workspaceId (required): Workspace ID
 *   - campaign (optional): Campaign identifier (default: 'default')
 */
export async function POST(request: NextRequest) {
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

    const { workspaceId, campaign } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing required field: workspaceId' },
        { status: 400 }
      );
    }

    // Get admin client
    const supabase = await getSupabaseAdmin();

    // Generate referral code
    const result = await generateReferralCode(
      supabase,
      workspaceId,
      userId,
      campaign || 'default'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    // Log event to archive
    await logReferralEvent(supabase, {
      eventType: 'code_generated',
      workspaceId,
      referrerId: userId,
      details: {
        code: result.code,
        campaign: campaign || 'default',
      },
    });

    return NextResponse.json({
      success: true,
      code: result.code,
      campaign: campaign || 'default',
      message: `Referral code generated: ${result.code}`,
    });
  } catch (error) {
    console.error('[/api/loyalty/referral/create] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
