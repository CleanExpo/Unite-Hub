/**
 * Synthex Experiments API
 * Phase B41: Experimentation & A/B Testing Engine
 *
 * GET - List experiments for tenant
 * POST - Create new experiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listExperiments,
  createExperiment,
  ExperimentCreateInput,
} from '@/lib/synthex/experimentService';

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
    const status = searchParams.get('status') as
      | 'draft'
      | 'running'
      | 'paused'
      | 'completed'
      | 'cancelled'
      | undefined;
    const objectType = searchParams.get('objectType') as
      | 'subject_line'
      | 'email_body'
      | 'cta'
      | 'content_block'
      | 'send_time'
      | 'landing_page'
      | 'form'
      | undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const experiments = await listExperiments(tenantId, {
      status,
      objectType,
      limit,
      offset,
    });

    return NextResponse.json({
      experiments,
      count: experiments.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in experiments GET:', error);
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

    const body: ExperimentCreateInput = await request.json();

    if (!body.tenant_id || !body.name || !body.object_type || !body.object_ref || !body.primary_metric) {
      return NextResponse.json(
        { error: 'tenant_id, name, object_type, object_ref, and primary_metric are required' },
        { status: 400 }
      );
    }

    // Set created_by to current user
    body.created_by = user.id;

    const experiment = await createExperiment(body);

    return NextResponse.json({ experiment }, { status: 201 });
  } catch (error) {
    console.error('Error in experiments POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
