/**
 * Billing Sync API
 * Phase: D66
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncFromStripe } from '@/lib/unite/billingService';

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
    const tenantId = orgData?.org_id;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

    const body = await request.json();
    const { provider, external_invoice_id } = body;

    if (!provider || !external_invoice_id) {
      return NextResponse.json(
        { error: 'provider and external_invoice_id required' },
        { status: 400 }
      );
    }

    // Currently only Stripe is implemented
    if (provider === 'stripe') {
      const invoice = await syncFromStripe(tenantId, external_invoice_id);
      return NextResponse.json({ invoice }, { status: 201 });
    }

    return NextResponse.json({ error: 'Provider not supported' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
