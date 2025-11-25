import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { recordReferralEvent, createAttribution } from '@/lib/loyalty/referralEngine';
import { issueCredits } from '@/lib/loyalty/loyaltyEngine';
import { logReferralEvent, logLoyaltyEvent } from '@/lib/loyalty/loyaltyArchiveBridge';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/loyalty/referral/claim
 * Claim a referral code after signup
 *
 * Body:
 *   - workspaceId (required): Workspace ID
 *   - referralCode (required): The referral code to claim
 *   - referredEmail (optional): Email of referred user
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

    const { workspaceId, referralCode, referredEmail } = await request.json();

    if (!workspaceId || !referralCode) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, referralCode' },
        { status: 400 }
      );
    }

    // Get admin client
    const supabase = await getSupabaseAdmin();

    // Find the referral code
    const { data: codeRecord, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('code', referralCode)
      .maybeSingle();

    if (codeError || !codeRecord) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    if (!codeRecord.is_active) {
      return NextResponse.json(
        { error: 'Referral code is inactive' },
        { status: 400 }
      );
    }

    // Record the event
    const eventResult = await recordReferralEvent(
      supabase,
      workspaceId,
      codeRecord.user_id,
      'code_used',
      userId,
      referredEmail
    );

    if (!eventResult.success) {
      return NextResponse.json(
        { error: 'Failed to record referral event' },
        { status: 500 }
      );
    }

    // Check fraud score - if >= 70, requires founder approval
    const fraudScore = eventResult.fraudScore || 0;

    if (fraudScore >= 70) {
      // Create attribution with pending status
      const attrResult = await createAttribution(
        supabase,
        workspaceId,
        codeRecord.user_id,
        userId,
        codeRecord.id,
        eventResult.eventId
      );

      if (!attrResult.success) {
        return NextResponse.json(
          { error: 'Failed to create attribution' },
          { status: 500 }
        );
      }

      // Log fraud detection
      await logReferralEvent(supabase, {
        eventType: 'fraud_detected',
        workspaceId,
        referrerId: codeRecord.user_id,
        referredUserId: userId,
        fraudScore,
        details: {
          attributionId: attrResult.attributionId,
          signals: eventResult.fraudSignals,
        },
      });

      return NextResponse.json({
        success: true,
        attributionId: attrResult.attributionId,
        status: 'pending_approval',
        fraudScore,
        message: 'Referral claimed but requires founder review due to fraud signals',
      });
    }

    // Create attribution with verified status and issue credits
    const attrResult = await createAttribution(
      supabase,
      workspaceId,
      codeRecord.user_id,
      userId,
      codeRecord.id,
      eventResult.eventId
    );

    if (!attrResult.success) {
      return NextResponse.json(
        { error: 'Failed to create attribution' },
        { status: 500 }
      );
    }

    // Issue credits to referrer
    const referrerCreditsResult = await issueCredits(
      supabase,
      workspaceId,
      codeRecord.user_id,
      100n, // 100 credits for referrer
      'referral_accepted',
      {
        referralCodeId: codeRecord.id,
        referralEventId: eventResult.eventId,
      }
    );

    // Issue credits to referred user
    const referredCreditsResult = await issueCredits(
      supabase,
      workspaceId,
      userId,
      50n, // 50 credits for referred user
      'referral_invite',
      {
        referralCodeId: codeRecord.id,
        referralEventId: eventResult.eventId,
      }
    );

    // Update referral code counts
    await supabase
      .from('referral_codes')
      .update({
        times_used: codeRecord.times_used + 1,
        referrals_accepted: codeRecord.referrals_accepted + 1,
        total_credits_issued: codeRecord.total_credits_issued + 150,
      })
      .eq('id', codeRecord.id);

    // Log to archive
    await logReferralEvent(supabase, {
      eventType: 'code_used',
      workspaceId,
      referrerId: codeRecord.user_id,
      referredUserId: userId,
      details: {
        attributionId: attrResult.attributionId,
        code: referralCode,
      },
    });

    return NextResponse.json({
      success: true,
      attributionId: attrResult.attributionId,
      status: 'credited',
      referrerCredits: 100,
      referredUserCredits: 50,
      message: 'Referral claimed and credits issued',
    });
  } catch (error) {
    console.error('[/api/loyalty/referral/claim] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
