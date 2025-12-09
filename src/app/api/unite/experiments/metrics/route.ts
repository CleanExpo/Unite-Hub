/**
 * Experiment Metrics API
 * Phase: D69
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  recordExperimentMetric,
  getExperimentMetrics,
} from '@/lib/unite/experimentService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const experimentKey = request.nextUrl.searchParams.get('experiment_key');
    if (!experimentKey) {
      return NextResponse.json({ error: 'experiment_key required' }, { status: 400 });
    }

    const filters = {
      variant_key: request.nextUrl.searchParams.get('variant_key') || undefined,
      metric_key: request.nextUrl.searchParams.get('metric_key') || undefined,
      start_date: request.nextUrl.searchParams.get('start_date') || undefined,
      end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const metrics = await getExperimentMetrics(experimentKey, filters);
    return NextResponse.json({ metrics });
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

    const body = await request.json();
    const { experiment_key, variant_key, metric_key, metric_value, user_count } = body;

    if (!experiment_key || !variant_key || !metric_key || metric_value === undefined) {
      return NextResponse.json(
        { error: 'experiment_key, variant_key, metric_key, and metric_value required' },
        { status: 400 }
      );
    }

    const metric = await recordExperimentMetric(
      experiment_key,
      variant_key,
      metric_key,
      metric_value,
      user_count
    );

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
