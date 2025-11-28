/**
 * Search Suite Alerts API
 *
 * Manage search volatility alerts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { volatilityService, AlertType, AlertSeverity } from '@/lib/searchSuite';

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

    const projectId = req.nextUrl.searchParams.get('projectId');
    const type = req.nextUrl.searchParams.get('type');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    if (type === 'summary') {
      const summary = await volatilityService.getVolatilitySummary(projectId);
      return NextResponse.json({ summary });
    }

    // Get alerts list
    const types = req.nextUrl.searchParams.get('types')?.split(',') as AlertType[] | undefined;
    const severities = req.nextUrl.searchParams.get('severities')?.split(',') as AlertSeverity[] | undefined;
    const acknowledged = req.nextUrl.searchParams.get('acknowledged');
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    const result = await volatilityService.getAlerts(
      projectId,
      {
        types,
        severities,
        acknowledged: acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined,
      },
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[SearchSuite] Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string | undefined;

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
    const { action, projectId, workspaceId, alertId, alertIds, options } = body;

    if (action === 'checkVolatility') {
      if (!projectId || !workspaceId) {
        return NextResponse.json({ error: 'projectId and workspaceId required' }, { status: 400 });
      }

      const result = await volatilityService.checkVolatility(projectId, workspaceId, options);
      return NextResponse.json(result);
    }

    if (action === 'acknowledge') {
      if (!alertId) {
        return NextResponse.json({ error: 'alertId required' }, { status: 400 });
      }

      await volatilityService.acknowledgeAlert(alertId, userId!);
      return NextResponse.json({ success: true });
    }

    if (action === 'bulkAcknowledge') {
      if (!alertIds || !Array.isArray(alertIds)) {
        return NextResponse.json({ error: 'alertIds array required' }, { status: 400 });
      }

      await volatilityService.bulkAcknowledgeAlerts(alertIds, userId!);
      return NextResponse.json({ success: true, acknowledged: alertIds.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[SearchSuite] Error processing alert action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
