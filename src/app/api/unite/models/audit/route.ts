/**
 * Model Audit API
 * Phase: D76 - Unite Model Governance Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listAudits } from '@/lib/unite/modelGovernanceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const filters = {
      tenant_id: tenantId,
      model_id: request.nextUrl.searchParams.get('model_id') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const audits = await listAudits(filters);
    return NextResponse.json({ audits });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audits' },
      { status: 500 }
    );
  }
}
