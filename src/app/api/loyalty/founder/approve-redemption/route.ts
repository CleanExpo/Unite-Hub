import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { handleRedemptionRequest } from '@/lib/loyalty/rewardCatalog';
import { logLoyaltyEvent } from '@/lib/loyalty/loyaltyArchiveBridge';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/loyalty/founder/approve-redemption
 * Approve or reject a redemption request (founder only)
 *
 * Body:
 *   - workspaceId (required): Workspace ID
 *   - requestId (required): Redemption request ID
 *   - approved (required): Boolean approval decision
 *   - founderNotes (optional): Founder's notes
 *   - transparencyMessage (optional): What user gets vs what was promised
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

    let founderId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      founderId = data.user.id;
    } else {
      const supabase = await import('@/lib/supabase').then((m) => m.getSupabaseServer());
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      founderId = data.user.id;
    }

    const {
      workspaceId,
      requestId,
      approved,
      founderNotes,
      transparencyMessage,
    } = await request.json();

    if (!workspaceId || !requestId || approved === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, requestId, approved' },
        { status: 400 }
      );
    }

    // Verify founder access
    const supabase = await getSupabaseAdmin();
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', founderId)
      .eq(
        'org_id',
        (
          await supabase
            .from('workspaces')
            .select('org_id')
            .eq('id', workspaceId)
            .single()
        ).data?.org_id
      )
      .maybeSingle();

    if (orgError || !userOrg || userOrg.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions to perform this action' },
        { status: 403 }
      );
    }

    // Handle the redemption request
    const result = await handleRedemptionRequest(
      supabase,
      workspaceId,
      requestId,
      approved,
      founderNotes,
      transparencyMessage
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Log the founder action
    await logLoyaltyEvent(supabase, {
      eventType: 'redemption_approved',
      workspaceId,
      userId: founderId,
      details: {
        requestId,
        approved,
        founderNotes,
        action: approved ? 'approved' : 'rejected',
      },
    });

    return NextResponse.json({
      success: true,
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    console.error('[/api/loyalty/founder/approve-redemption] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
