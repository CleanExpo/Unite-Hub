/**
 * GET /api/synthex/sales/activities
 * POST /api/synthex/sales/activities
 *
 * Manage sales activities for opportunities.
 *
 * GET Query params:
 * - opportunityId: string (required)
 * - type?: 'call' | 'email' | 'meeting' | 'note' | 'task'
 * - completed?: boolean
 *
 * POST Body:
 * {
 *   opportunityId: string (required)
 *   tenantId: string (required)
 *   type: 'call' | 'email' | 'meeting' | 'note' | 'task' (required)
 *   content: string (required)
 *   nextAction?: string
 *   dueAt?: string (ISO 8601)
 *   completed?: boolean
 * }
 *
 * Phase: B26 - Sales CRM Pipeline + Opportunity Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  listActivities,
  recordActivity,
  ActivityInput,
  ActivityType,
} from '@/lib/synthex/salesCrmService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get('opportunityId');
    const type = searchParams.get('type');
    const completedStr = searchParams.get('completed');

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'Missing required param: opportunityId' },
        { status: 400 }
      );
    }

    // Validate tenant access through opportunity
    const { data: opportunity } = await supabaseAdmin
      .from('synthex_sales_opportunities')
      .select('tenant_id')
      .eq('id', opportunityId)
      .single();

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', opportunity.tenant_id)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await listActivities(opportunityId, {
      type: type as ActivityType | undefined,
      completed: completedStr ? completedStr === 'true' : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    return NextResponse.json({ activities: result.data });
  } catch (error) {
    console.error('GET /api/synthex/sales/activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { opportunityId, tenantId, type, content, nextAction, dueAt, completed } = body;

    if (!opportunityId || !tenantId || !type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: opportunityId, tenantId, type, content' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Validate opportunity exists and belongs to tenant
    const { data: opportunity } = await supabaseAdmin
      .from('synthex_sales_opportunities')
      .select('id, tenant_id')
      .eq('id', opportunityId)
      .eq('tenant_id', tenantId)
      .single();

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found or does not belong to tenant' },
        { status: 404 }
      );
    }

    const input: ActivityInput = {
      opportunity_id: opportunityId,
      tenant_id: tenantId,
      type,
      content,
      next_action: nextAction || undefined,
      due_at: dueAt || undefined,
      completed: completed ?? false,
    };

    const result = await recordActivity(input);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to record activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ activity: result.data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/synthex/sales/activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
