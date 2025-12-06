/**
 * Synthex Social Accounts API
 * Phase B31: Social Media Automation
 *
 * GET  - List connected social accounts
 * POST - Connect a new account (OAuth callback)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAccounts,
  connectAccount,
  disconnectAccount,
  getSocialSummary,
  type SocialProvider,
} from '@/lib/synthex/socialService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const action = searchParams.get('action');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Get summary statistics
    if (action === 'summary') {
      const summary = await getSocialSummary(tenantId);
      return NextResponse.json({ summary });
    }

    // List all connected accounts
    const accounts = await getAccounts(tenantId);

    return NextResponse.json({ accounts, count: accounts.length });
  } catch (error) {
    console.error('Error in social/accounts GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenant_id,
      provider,
      account_id,
      account_name,
      account_handle,
      access_token,
      refresh_token,
      expires_at,
    } = body;

    if (!tenant_id || !provider || !account_id || !access_token) {
      return NextResponse.json(
        { error: 'tenant_id, provider, account_id, and access_token are required' },
        { status: 400 }
      );
    }

    const validProviders = [
      'facebook', 'instagram', 'linkedin', 'twitter', 'youtube',
      'tiktok', 'threads', 'pinterest', 'snapchat', 'reddit'
    ];

    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    const account = await connectAccount(tenant_id, provider as SocialProvider, {
      account_id,
      account_name,
      account_handle,
      access_token,
      refresh_token,
      expires_at,
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error('Error in social/accounts POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const accountId = searchParams.get('accountId');

    if (!tenantId || !accountId) {
      return NextResponse.json(
        { error: 'tenantId and accountId are required' },
        { status: 400 }
      );
    }

    await disconnectAccount(tenantId, accountId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in social/accounts DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
