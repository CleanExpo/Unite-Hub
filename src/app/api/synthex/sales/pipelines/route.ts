/**
 * GET /api/synthex/sales/pipelines
 * POST /api/synthex/sales/pipelines
 *
 * Manage sales pipelines.
 *
 * GET Query params:
 * - tenantId: string (required)
 *
 * POST Body:
 * {
 *   tenantId: string (required)
 *   name: string (required)
 *   stages: string[] (required)
 *   is_default?: boolean
 * }
 *
 * Phase: B26 - Sales CRM Pipeline + Opportunity Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  listPipelines,
  createPipeline,
  PipelineInput,
} from '@/lib/synthex/salesCrmService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

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

    const result = await listPipelines(tenantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch pipelines' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pipelines: result.data });
  } catch (error) {
    console.error('GET /api/synthex/sales/pipelines error:', error);
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
    const { tenantId, name, stages, is_default } = body;

    if (!tenantId || !name || !stages || !Array.isArray(stages)) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, name, stages (array)' },
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

    const input: PipelineInput = {
      tenant_id: tenantId,
      name,
      stages,
      is_default: is_default ?? false,
    };

    const result = await createPipeline(input);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create pipeline' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pipeline: result.data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/synthex/sales/pipelines error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
