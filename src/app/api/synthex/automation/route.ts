/**
 * GET /api/synthex/automation
 * POST /api/synthex/automation
 *
 * List and create automation workflows.
 *
 * GET Query params:
 * - tenantId: string (required)
 * - activeOnly?: boolean
 * - limit?: number
 * - offset?: number
 *
 * POST Body:
 * {
 *   tenantId: string (required)
 *   name: string (required)
 *   description?: string
 *   trigger: { type: string, ... }
 *   actions: [{ type: string, ... }]
 * }
 *
 * Phase: B13 - Automated Lead Nurturing Workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  listWorkflows,
  createWorkflow,
  listRuns,
  WorkflowTrigger,
  WorkflowAction,
} from '@/lib/synthex/automationService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const includeRuns = searchParams.get('includeRuns') === 'true';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required param: tenantId' },
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

    // Get workflows
    const result = await listWorkflows(tenantId, {
      activeOnly,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    if (result.error) throw result.error;

    const response: {
      status: string;
      workflows: typeof result.data;
      runs?: Awaited<ReturnType<typeof listRuns>>['data'];
    } = {
      status: 'ok',
      workflows: result.data || [],
    };

    // Optionally include recent runs
    if (includeRuns) {
      const runsResult = await listRuns(tenantId, { limit: 20 });
      response.runs = runsResult.data || [];
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[automation GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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
    const { tenantId, name, description, trigger, actions } = body;

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, name' },
        { status: 400 }
      );
    }

    if (!trigger || !trigger.type) {
      return NextResponse.json(
        { error: 'Missing required field: trigger with type' },
        { status: 400 }
      );
    }

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: actions (must be non-empty array)' },
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

    // Create workflow
    const result = await createWorkflow(
      tenantId,
      name,
      trigger as WorkflowTrigger,
      actions as WorkflowAction[],
      description
    );

    if (result.error) throw result.error;

    return NextResponse.json({
      status: 'ok',
      workflow: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error('[automation POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
