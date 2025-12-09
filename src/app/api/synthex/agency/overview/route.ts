/**
 * Synthex Agency Command Center Overview API
 * Phase B40: Agency Command Center
 *
 * GET - Get agency overview dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAgencyOverview,
  getClientsWithMetrics,
  getAgencyAlerts,
  getAgencyGoals,
} from '@/lib/synthex/agencyCommandService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyTenantId = searchParams.get('agencyTenantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeClients = searchParams.get('includeClients') !== 'false';
    const includeAlerts = searchParams.get('includeAlerts') !== 'false';
    const includeGoals = searchParams.get('includeGoals') !== 'false';

    if (!agencyTenantId) {
      return NextResponse.json(
        { error: 'agencyTenantId is required' },
        { status: 400 }
      );
    }

    // Get main overview metrics
    const overview = await getAgencyOverview(
      agencyTenantId,
      startDate || undefined,
      endDate || undefined
    );

    const response: {
      overview: typeof overview;
      clients?: Awaited<ReturnType<typeof getClientsWithMetrics>>;
      alerts?: Awaited<ReturnType<typeof getAgencyAlerts>>;
      goals?: Awaited<ReturnType<typeof getAgencyGoals>>;
    } = { overview };

    // Optionally include detailed data
    if (includeClients) {
      response.clients = await getClientsWithMetrics(
        agencyTenantId,
        startDate || undefined,
        endDate || undefined
      );
    }

    if (includeAlerts) {
      response.alerts = await getAgencyAlerts(agencyTenantId, {
        unresolvedOnly: true,
        limit: 10,
      });
    }

    if (includeGoals) {
      response.goals = await getAgencyGoals(agencyTenantId, {
        status: 'in_progress',
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in agency/overview GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
