/**
 * Synthex Coach Tips API
 * Phase B42: Guided Playbooks & In-App Coach
 *
 * GET - Get applicable tips for user
 * POST - Record tip impression
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getApplicableTips,
  recordTipImpression,
  CoachTip,
} from '@/lib/synthex/playbookService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const triggerType = searchParams.get('triggerType') as CoachTip['trigger_type'] | undefined;
    const triggerValue = searchParams.get('triggerValue') || undefined;
    const page = searchParams.get('page') || undefined;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const tips = await getApplicableTips(tenantId, user.id, {
      triggerType,
      triggerValue,
      page,
    });

    return NextResponse.json({
      tips,
      count: tips.length,
    });
  } catch (error) {
    console.error('Error in tips GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, tipId, action } = body;

    if (!tenantId || !tipId || !action) {
      return NextResponse.json(
        { error: 'tenantId, tipId, and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['viewed', 'dismissed', 'clicked', 'completed'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    await recordTipImpression(tipId, tenantId, user.id, action);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in tips POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
