/**
 * Subscriptions API
 * Manages user subscriptions and tier access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, workspaceId);

    const supabase = getSupabaseServer();
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
throw error;
}

    return NextResponse.json({
      success: true,
      subscription: subscription || null
    }, { status: 200 });

  } catch (error: any) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch subscription'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, tier, stripeCustomerId, stripeSubscriptionId } = body;

    if (!workspaceId || !tier) {
      return NextResponse.json({ error: 'workspaceId and tier are required' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, workspaceId);

    const supabase = getSupabaseServer();
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        workspace_id: workspaceId,
        tier,
        status: 'active',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId
      })
      .select()
      .single();

    if (error) {
throw error;
}

    return NextResponse.json({
      success: true,
      subscription
    }, { status: 201 });

  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create subscription'
    }, { status: 500 });
  }
}
