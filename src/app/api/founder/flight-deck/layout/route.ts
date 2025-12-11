/**
 * Flight Deck Layout API
 * Phase 108: Get and save layout configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getLayout, saveLayout, getDefaultLayout } from '@/lib/founderFlightDeck';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get('tenantId') || undefined;
    const layout = await getLayout(userData.user.id, tenantId);

    return NextResponse.json({
      success: true,
      layout: layout || { layoutConfig: getDefaultLayout(), widgetStates: {} },
    });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { layoutConfig, tenantId } = body;

    if (!layoutConfig) {
      return NextResponse.json({ error: 'layoutConfig required' }, { status: 400 });
    }

    const layout = await saveLayout(userData.user.id, layoutConfig, tenantId);

    if (!layout) {
      return NextResponse.json({ error: 'Failed to save layout' }, { status: 500 });
    }

    return NextResponse.json({ success: true, layout });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
