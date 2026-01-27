/**
 * ATO Tax Obligations API Route
 *
 * GET /api/integrations/ato/obligations?workspaceId=xxx&abn=xxx
 * Fetch tax obligations from ATO
 *
 * Related to: UNI-180 [ATO] Tax Reporting Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createATOClient } from '@/lib/integrations/ato/ato-client';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace and ABN from query params
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const abn = req.nextUrl.searchParams.get('abn');
    const refresh = req.nextUrl.searchParams.get('refresh') === 'true';

    if (!workspaceId || !abn) {
      return NextResponse.json(
        { error: 'workspaceId and abn required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      );
    }

    // If not forcing refresh, check cache first
    if (!refresh) {
      const { data: cached } = await supabase
        .from('tax_obligations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('abn', abn)
        .order('due_date', { ascending: true });

      // If cached and synced within last hour, return cached
      if (cached && cached.length > 0) {
        const lastSynced = new Date(cached[0].last_synced_at);
        const minutesSinceSync =
          (Date.now() - lastSynced.getTime()) / (1000 * 60);

        if (minutesSinceSync < 60) {
          return NextResponse.json({
            success: true,
            cached: true,
            obligations: cached,
            lastSynced: cached[0].last_synced_at,
          });
        }
      }
    }

    // Initialize ATO client and fetch fresh obligations
    const atoClient = createATOClient();
    await atoClient.initialize(workspaceId);

    const obligations = await atoClient.getTaxObligations(abn);

    return NextResponse.json({
      success: true,
      cached: false,
      obligations,
      lastSynced: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Tax obligations fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tax obligations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
