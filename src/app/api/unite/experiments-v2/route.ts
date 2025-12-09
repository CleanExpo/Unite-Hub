/**
 * Experiments V2 API
 * Phase: D62 - Enhanced Experimentation Framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createExperiment,
  listExperiments,
  createVariant,
  listVariants,
  assignSubject,
  getAssignment,
} from '@/lib/unite/experimentServiceV2';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const action = request.nextUrl.searchParams.get('action');
    const experimentId = request.nextUrl.searchParams.get('experiment_id');

    // List variants for an experiment
    if (action === 'list_variants' && experimentId) {
      const variants = await listVariants(experimentId);
      return NextResponse.json({ variants });
    }

    // Get assignment for a subject
    if (action === 'get_assignment' && experimentId) {
      const subjectType = request.nextUrl.searchParams.get('subject_type') || 'user';
      const subjectId = request.nextUrl.searchParams.get('subject_id');
      if (!subjectId) return NextResponse.json({ error: 'subject_id required' }, { status: 400 });

      const assignment = await getAssignment(experimentId, subjectType, subjectId);
      return NextResponse.json({ assignment });
    }

    // List experiments
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const experiments = await listExperiments(tenantId, { status, limit });
    return NextResponse.json({ experiments });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const action = body.action;

    // Create variant
    if (action === 'create_variant') {
      const { experiment_id, ...variantInput } = body;
      if (!experiment_id) return NextResponse.json({ error: 'experiment_id required' }, { status: 400 });

      const variant = await createVariant(experiment_id, variantInput);
      return NextResponse.json({ variant }, { status: 201 });
    }

    // Assign subject to experiment
    if (action === 'assign_subject') {
      const { experiment_id, subject_type, subject_id } = body;
      if (!experiment_id || !subject_type || !subject_id) {
        return NextResponse.json({ error: 'experiment_id, subject_type, subject_id required' }, { status: 400 });
      }

      const assignment = await assignSubject(tenantId, experiment_id, subject_type, subject_id);
      return NextResponse.json({ assignment }, { status: 201 });
    }

    // Create experiment (default)
    const experiment = await createExperiment(tenantId, body);
    return NextResponse.json({ experiment }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
