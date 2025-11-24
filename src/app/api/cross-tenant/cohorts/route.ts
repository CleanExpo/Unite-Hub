import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getCohorts, getCohortSummaries, getTenantCohort } from '@/lib/crossTenant/cohorts';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    const cohortId = req.nextUrl.searchParams.get('cohortId');

    if (cohortId) {
      const summaries = await getCohortSummaries(cohortId);
      return NextResponse.json({
        summaries,
        confidence: 0.8,
        uncertaintyNotes: 'Cohort summaries aggregated without revealing individual tenants'
      });
    }

    if (tenantId) {
      const cohort = await getTenantCohort(tenantId);
      return NextResponse.json({
        cohort,
        confidence: 0.85,
        uncertaintyNotes: 'Tenant cohort membership without revealing other members'
      });
    }

    const cohorts = await getCohorts();
    return NextResponse.json({
      cohorts,
      confidence: 0.9,
      uncertaintyNotes: 'Active cohorts with aggregated member counts'
    });
  } catch (error) {
    console.error('Cohorts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
