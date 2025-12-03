import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { strictRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/loyalty/fraud/alerts
 * Get fraud alerts for a workspace (founder only)
 *
 * Query params:
 *   - workspaceId (required): Workspace ID
 *   - level (optional): 'all' | 'high' | 'critical' (default: 'all')
 *   - limit (optional): Number of alerts (default: 50)
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

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    const level = request.nextUrl.searchParams.get('level') || 'all';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
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
        { error: 'Insufficient permissions to view fraud alerts' },
        { status: 403 }
      );
    }

    // Get fraud alerts from referral events
    let query = supabase
      .from('referral_events')
      .select(
        `
        id,
        referrer_id,
        referred_email,
        fraud_score,
        fraud_signals,
        event_type,
        created_at,
        referral_codes(user_id)
      `
      )
      .eq('workspace_id', workspaceId)
      .gt('fraud_score', 0) // Only fraud alerts
      .order('fraud_score', { ascending: false });

    // Filter by severity level
    if (level === 'high') {
      query = query.gte('fraud_score', 50);
    } else if (level === 'critical') {
      query = query.gte('fraud_score', 80);
    }

    const { data: events, error: eventsError } = await query.limit(limit);

    if (eventsError) {
      console.error('[/api/loyalty/fraud/alerts] Query error:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch fraud alerts' },
        { status: 500 }
      );
    }

    // Get referrer email information
    const referrerIds = [...new Set((events || []).map((e: any) => e.referrer_id))];

    let referrerEmails: Record<string, string> = {};
    if (referrerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email')
        .in('id', referrerIds);

      if (profiles) {
        referrerEmails = Object.fromEntries(profiles.map((p: any) => [p.id, p.email]));
      }
    }

    const alerts = (events || []).map((event: any) => ({
      id: event.id,
      referrerId: event.referrer_id,
      referrerEmail: referrerEmails[event.referrer_id],
      referredEmail: event.referred_email,
      fraudScore: event.fraud_score,
      fraudSignals: event.fraud_signals || {},
      eventType: event.event_type,
      createdAt: event.created_at,
      requiresReview: event.fraud_score >= 70,
    }));

    return NextResponse.json({
      alerts,
      level,
      limit,
      total: alerts.length,
    });
  } catch (error) {
    console.error('[/api/loyalty/fraud/alerts] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
