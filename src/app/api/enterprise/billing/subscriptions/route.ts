/**
 * Subscriptions API
 * GET /api/enterprise/billing/subscriptions - Get org subscription
 * POST /api/enterprise/billing/subscriptions - Create/update subscription
 * DELETE /api/enterprise/billing/subscriptions - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { billingEngine } from '@/lib/services/billing';

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    const { data, error } = await supabaseBrowser.auth.getUser(token);
    if (error || !data.user) {
return null;
}
    return data.user;
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
return null;
}
  return data.user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 });
    }

    const subscription = await billingEngine.getSubscription(orgId);

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orgId, planId, billingCycle, trialDays, action } = body;

    if (!orgId || !planId) {
      return NextResponse.json(
        { error: 'orgId and planId required' },
        { status: 400 }
      );
    }

    let result;

    if (action === 'change') {
      // Change existing plan
      result = await billingEngine.changePlan(orgId, planId, body.immediate !== false);
    } else {
      // Create new subscription
      const subscription = await billingEngine.createSubscription(
        orgId,
        planId,
        billingCycle || 'monthly',
        trialDays || 0
      );
      result = {
        success: true,
        subscription,
        message: 'Subscription created successfully',
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = req.nextUrl.searchParams.get('orgId');
    const immediate = req.nextUrl.searchParams.get('immediate') === 'true';

    if (!orgId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 });
    }

    const result = await billingEngine.cancelSubscription(orgId, immediate);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
