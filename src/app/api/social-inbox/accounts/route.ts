/**
 * Social Inbox Accounts API
 *
 * Manage social media account connections.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { socialInboxService } from '@/lib/socialEngagement';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    const { data: accounts, error } = await supabase
      .from('social_accounts')
      .select('id, provider, platform_user_id, platform_username, display_name, profile_image_url, status, follower_count, connected_at, last_sync_at')
      .eq('workspace_id', workspaceId)
      .order('connected_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('[SocialInbox] Error fetching accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { workspaceId, provider, accessToken, refreshToken, accountId, username, displayName, profileImageUrl } = body;

    if (!workspaceId || !provider || !accessToken || !accountId) {
      return NextResponse.json(
        { error: 'workspaceId, provider, accessToken, and accountId are required' },
        { status: 400 }
      );
    }

    const account = await socialInboxService.connectAccount(workspaceId, {
      provider,
      accessToken,
      refreshToken,
      accountId,
      username,
      displayName,
      profileImageUrl,
      userId,
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('[SocialInbox] Error connecting account:', error);
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

    await socialInboxService.disconnectAccount(accountId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SocialInbox] Error disconnecting account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
