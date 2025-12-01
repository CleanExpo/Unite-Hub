/**
 * Ads Accounts API
 *
 * Manage ad platform account connections.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { adsIngestionService } from '@/lib/ads';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    const { data: accounts, error } = await supabase
      .from('ad_accounts')
      .select('id, provider, external_account_id, name, currency, timezone, status, account_type, last_sync_at, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('[Ads] Error fetching accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { workspaceId, provider, accessToken, refreshToken, accountId, developerToken, loginCustomerId } = body;

    if (!workspaceId || !provider || !accessToken || !accountId) {
      return NextResponse.json(
        { error: 'workspaceId, provider, accessToken, and accountId are required' },
        { status: 400 }
      );
    }

    const account = await adsIngestionService.connectAccount(
      workspaceId,
      provider,
      {
        accessToken,
        refreshToken,
      },
      {
        externalAccountId: accountId,
        name: accountId, // Use accountId as name if not provided
      }
    );

    return NextResponse.json({ account });
  } catch (error) {
    console.error('[Ads] Error connecting account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const accountId = req.nextUrl.searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 });
    }

    // Disconnect account by deleting from database
    const supabase = await getSupabaseServer();
    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Ads] Error disconnecting account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
