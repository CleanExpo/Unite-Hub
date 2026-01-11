/**
 * Experiment Events API
 * Phase: D62
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackEvent, getExperimentStats } from '@/lib/unite/experimentServiceV2';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const experimentId = request.nextUrl.searchParams.get('experiment_id');
    if (!experimentId) return NextResponse.json({ error: 'experiment_id required' }, { status: 400 });

    const stats = await getExperimentStats(experimentId);
    return NextResponse.json({ stats });
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
    const { experiment_id, variant_id, event_type, value, metadata } = body;

    if (!experiment_id || !variant_id || !event_type) {
      return NextResponse.json({ error: 'experiment_id, variant_id, event_type required' }, { status: 400 });
    }

    const event = await trackEvent(tenantId, experiment_id, variant_id, event_type, value, metadata);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
