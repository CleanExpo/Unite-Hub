/**
 * Usage API
 * GET /api/enterprise/billing/usage - Get usage summary
 * POST /api/enterprise/billing/usage - Track usage event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { usageMeteringService, EventCategory } from '@/lib/services/billing';

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

    const summary = await usageMeteringService.getUsageSummary(orgId);

    return NextResponse.json({
      success: true,
      usage: summary,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage' },
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
    const { orgId, eventType, category, quantity, metadata, workspaceId } = body;

    if (!orgId || !eventType || !category) {
      return NextResponse.json(
        { error: 'orgId, eventType, and category required' },
        { status: 400 }
      );
    }

    const event = await usageMeteringService.trackEvent(
      orgId,
      eventType,
      category as EventCategory,
      quantity || 1,
      metadata || {},
      workspaceId,
      user.id
    );

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}
