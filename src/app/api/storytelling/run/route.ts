/**
 * Story Touchpoint Run API
 * Phase 75: Generate touchpoints for clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  generateTouchpointForClient,
  generateFounderTouchpointForClient,
  generateTouchpointsForClients,
  TouchpointTimeframe,
} from '@/lib/storytelling/storyTouchpointEngine';
import {
  runWeeklyTouchpoints,
  runMonthlyTouchpoints,
  run90DayTouchpoints,
  runAllTouchpointsForClient,
  getSoftLaunchClients,
} from '@/lib/storytelling/storyTouchpointScheduler';

export async function POST(req: NextRequest) {
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

    // TODO: Add role check for founder-only access
    // For now, allow any authenticated user

    const body = await req.json();
    const {
      action,
      client_id,
      workspace_id,
      client_name,
      timeframe,
    } = body;

    // Action: generate_single - Generate touchpoint for a single client
    if (action === 'generate_single') {
      if (!client_id || !workspace_id || !client_name || !timeframe) {
        return NextResponse.json(
          { error: 'Missing required fields: client_id, workspace_id, client_name, timeframe' },
          { status: 400 }
        );
      }

      const touchpoint = generateTouchpointForClient({
        workspace_id,
        client_id,
        client_name,
        timeframe: timeframe as TouchpointTimeframe,
      });

      return NextResponse.json({
        success: true,
        touchpoint,
      });
    }

    // Action: generate_founder - Generate founder touchpoint with operational insights
    if (action === 'generate_founder') {
      if (!client_id || !workspace_id || !client_name || !timeframe) {
        return NextResponse.json(
          { error: 'Missing required fields: client_id, workspace_id, client_name, timeframe' },
          { status: 400 }
        );
      }

      const touchpoint = generateFounderTouchpointForClient({
        workspace_id,
        client_id,
        client_name,
        timeframe: timeframe as TouchpointTimeframe,
      });

      return NextResponse.json({
        success: true,
        touchpoint,
      });
    }

    // Action: generate_all_for_client - Generate all timeframes for a single client
    if (action === 'generate_all_for_client') {
      if (!client_id || !workspace_id || !client_name) {
        return NextResponse.json(
          { error: 'Missing required fields: client_id, workspace_id, client_name' },
          { status: 400 }
        );
      }

      const touchpoints = runAllTouchpointsForClient(workspace_id, client_id, client_name);

      return NextResponse.json({
        success: true,
        touchpoints,
      });
    }

    // Action: run_weekly - Run weekly touchpoints for all soft-launch clients
    if (action === 'run_weekly') {
      const clients = getSoftLaunchClients();
      const result = runWeeklyTouchpoints(clients);

      return NextResponse.json({
        success: true,
        result,
      });
    }

    // Action: run_monthly - Run monthly touchpoints for all soft-launch clients
    if (action === 'run_monthly') {
      const clients = getSoftLaunchClients();
      const result = runMonthlyTouchpoints(clients);

      return NextResponse.json({
        success: true,
        result,
      });
    }

    // Action: run_90day - Run 90-day touchpoints for all soft-launch clients
    if (action === 'run_90day') {
      const clients = getSoftLaunchClients();
      const result = run90DayTouchpoints(clients);

      return NextResponse.json({
        success: true,
        result,
      });
    }

    // Action: run_batch - Run touchpoints for specific clients
    if (action === 'run_batch') {
      const { clients: clientList } = body;

      if (!clientList || !Array.isArray(clientList) || !timeframe) {
        return NextResponse.json(
          { error: 'Missing required fields: clients (array), timeframe' },
          { status: 400 }
        );
      }

      const result = generateTouchpointsForClients(
        clientList,
        timeframe as TouchpointTimeframe
      );

      return NextResponse.json({
        success: true,
        result,
      });
    }

    return NextResponse.json(
      {
        error: 'Invalid action',
        valid_actions: [
          'generate_single',
          'generate_founder',
          'generate_all_for_client',
          'run_weekly',
          'run_monthly',
          'run_90day',
          'run_batch',
        ],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Story touchpoint run error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
