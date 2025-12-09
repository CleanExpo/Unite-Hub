/**
 * Experiments API
 * Phase: D69
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listExperiments,
  createExperiment,
  getExperiment,
  updateExperiment,
  deleteExperiment,
  getExperimentSummary,
} from '@/lib/unite/experimentService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id || null;

    // Get summary for specific experiment
    const experimentKey = request.nextUrl.searchParams.get('experiment_key');
    if (experimentKey) {
      const summary = await getExperimentSummary(experimentKey);
      return NextResponse.json(summary);
    }

    // List experiments
    const filters = {
      tenant_id: tenantId || undefined,
      status: request.nextUrl.searchParams.get('status') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const experiments = await listExperiments(filters);
    return NextResponse.json({ experiments });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const action = body.action;

    // Update existing experiment
    if (action === 'update') {
      const { experiment_key, ...updates } = body;
      if (!experiment_key) {
        return NextResponse.json({ error: 'experiment_key required' }, { status: 400 });
      }

      const experiment = await updateExperiment(experiment_key, updates);
      return NextResponse.json({ experiment });
    }

    // Delete experiment
    if (action === 'delete') {
      const { experiment_key } = body;
      if (!experiment_key) {
        return NextResponse.json({ error: 'experiment_key required' }, { status: 400 });
      }

      await deleteExperiment(experiment_key);
      return NextResponse.json({ success: true });
    }

    // Create new experiment
    const experiment = await createExperiment({
      tenant_id: tenantId,
      ...body,
    });

    return NextResponse.json({ experiment }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
