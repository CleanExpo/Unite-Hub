/**
 * Story Touchpoints API
 * Phase 75: Get touchpoints for client and founder dashboards
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  generateWeeklyTouchpointForClient,
  generateMonthlyTouchpointForClient,
  generate90DayTouchpointForClient,
  generateFounderTouchpointForClient,
  getTouchpointFreshness,
  StoryTouchpoint,
  TouchpointTimeframe,
} from '@/lib/storytelling/storyTouchpointEngine';
import { getSoftLaunchClients } from '@/lib/storytelling/storyTouchpointScheduler';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
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
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'client'; // 'client' or 'founder'
    const clientId = searchParams.get('client_id');
    const workspaceId = searchParams.get('workspace_id') || 'ws_demo';
    const timeframe = searchParams.get('timeframe') as TouchpointTimeframe | null;

    // Client view: Get touchpoints for a single client
    if (view === 'client') {
      if (!clientId) {
        return NextResponse.json(
          { error: 'client_id required for client view' },
          { status: 400 }
        );
      }

      // Generate touchpoints on-demand (in production, would fetch from cache/database)
      const clientName = 'Your Business'; // Would come from database

      const touchpoints: StoryTouchpoint[] = [];

      if (!timeframe || timeframe === 'weekly') {
        touchpoints.push(
          generateWeeklyTouchpointForClient(workspaceId, clientId, clientName)
        );
      }

      if (!timeframe || timeframe === 'monthly') {
        touchpoints.push(
          generateMonthlyTouchpointForClient(workspaceId, clientId, clientName)
        );
      }

      if (!timeframe || timeframe === 'ninety_day') {
        touchpoints.push(
          generate90DayTouchpointForClient(workspaceId, clientId, clientName)
        );
      }

      return NextResponse.json({
        success: true,
        touchpoints,
        client_id: clientId,
        workspace_id: workspaceId,
      });
    }

    // Founder view: Get touchpoints for all soft-launch clients
    if (view === 'founder') {
      const clients = getSoftLaunchClients();

      const clientTouchpoints: {
        client_id: string;
        client_name: string;
        weekly: StoryTouchpoint | null;
        monthly: StoryTouchpoint | null;
        ninety_day: StoryTouchpoint | null;
        weekly_status: string;
        monthly_status: string;
        ninety_day_status: string;
        needs_attention: boolean;
      }[] = [];

      for (const client of clients) {
        // Generate touchpoints for each client
        const weekly = generateWeeklyTouchpointForClient(
          client.workspace_id,
          client.client_id,
          client.client_name
        );

        const monthly = generateMonthlyTouchpointForClient(
          client.workspace_id,
          client.client_id,
          client.client_name
        );

        const ninetyDay = generate90DayTouchpointForClient(
          client.workspace_id,
          client.client_id,
          client.client_name
        );

        const weeklyStatus = getTouchpointFreshness(weekly.generated_at, 'weekly');
        const monthlyStatus = getTouchpointFreshness(monthly.generated_at, 'monthly');
        const ninetyDayStatus = getTouchpointFreshness(ninetyDay.generated_at, 'ninety_day');

        const needsAttention =
          weekly.data_status === 'limited' ||
          monthly.data_status === 'limited' ||
          weekly.story_health < 40;

        clientTouchpoints.push({
          client_id: client.client_id,
          client_name: client.client_name,
          weekly,
          monthly,
          ninety_day: ninetyDay,
          weekly_status: weeklyStatus,
          monthly_status: monthlyStatus,
          ninety_day_status: ninetyDayStatus,
          needs_attention: needsAttention,
        });
      }

      // Summary stats
      const totalClients = clientTouchpoints.length;
      const needsAttentionCount = clientTouchpoints.filter(c => c.needs_attention).length;
      const avgHealth = Math.round(
        clientTouchpoints.reduce((sum, c) => sum + c.weekly.story_health, 0) / totalClients
      );

      return NextResponse.json({
        success: true,
        clients: clientTouchpoints,
        summary: {
          total_clients: totalClients,
          needs_attention: needsAttentionCount,
          avg_health: avgHealth,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid view parameter. Use "client" or "founder"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Story touchpoints API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
