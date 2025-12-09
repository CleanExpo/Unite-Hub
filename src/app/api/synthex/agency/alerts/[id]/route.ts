/**
 * Synthex Agency Alert Detail API
 * Phase B40: Agency Command Center
 *
 * PATCH - Acknowledge or resolve an alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { acknowledgeAlert, resolveAlert } from '@/lib/synthex/agencyCommandService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: alertId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['acknowledge', 'resolve'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "acknowledge" or "resolve"' },
        { status: 400 }
      );
    }

    let alert;
    if (action === 'acknowledge') {
      alert = await acknowledgeAlert(alertId, user.id);
    } else {
      alert = await resolveAlert(alertId);
    }

    return NextResponse.json({
      alert,
      message: `Alert ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error in agency/alerts/[id] PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
