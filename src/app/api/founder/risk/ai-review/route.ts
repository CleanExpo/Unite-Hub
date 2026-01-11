/**
 * Risk AI Review API
 *
 * Phase: D56 - Risk, Compliance & Guardrail Center
 *
 * Routes:
 * - POST /api/founder/risk/ai-review - AI-assess risk event
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getRiskEvent,
  aiAssessRiskEvent,
} from '@/lib/unite/riskCenterService';

// =============================================================================
// POST - AI assessment
// =============================================================================

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

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const { event_id } = body;

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }

    const event = await getRiskEvent(tenantId, event_id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const assessment = await aiAssessRiskEvent(event);

    return NextResponse.json({ assessment });
  } catch (error: unknown) {
    console.error('POST /api/founder/risk/ai-review error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to assess risk' },
      { status: 500 }
    );
  }
}
