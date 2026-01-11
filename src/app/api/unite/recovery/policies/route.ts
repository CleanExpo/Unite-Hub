/**
 * Recovery Policies API
 * Phase: D75 - Unite Adaptive Recovery Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createRecoveryPolicy,
  listRecoveryPolicies,
  getRecoveryPolicy,
  updateRecoveryPolicy,
  deleteRecoveryPolicy,
} from '@/lib/unite/recoveryEngineService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const action = request.nextUrl.searchParams.get('action') || 'list';

    // Get specific policy
    if (action === 'get') {
      const key = request.nextUrl.searchParams.get('key');
      if (!key) {
        return NextResponse.json({ error: 'key parameter is required' }, { status: 400 });
      }

      const policy = await getRecoveryPolicy(key, tenantId);
      return NextResponse.json({ policy });
    }

    // List policies
    const filters = {
      tenant_id: tenantId,
      enabled:
        request.nextUrl.searchParams.get('enabled') === 'true'
          ? true
          : request.nextUrl.searchParams.get('enabled') === 'false'
            ? false
            : undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const policies = await listRecoveryPolicies(filters);
    return NextResponse.json({ policies });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recovery policies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const body = await request.json();
    const { action, key, rules, enabled } = body;

    // Create policy
    if (action === 'create' || !action) {
      if (!key || !rules) {
        return NextResponse.json({ error: 'key and rules are required' }, { status: 400 });
      }

      const policy = await createRecoveryPolicy(key, rules, tenantId);
      return NextResponse.json({ policy }, { status: 201 });
    }

    // Update policy
    if (action === 'update') {
      if (!key) {
        return NextResponse.json({ error: 'key is required' }, { status: 400 });
      }

      const updates: { rules?: unknown; enabled?: boolean } = {};
      if (rules !== undefined) updates.rules = rules;
      if (enabled !== undefined) updates.enabled = enabled;

      const policy = await updateRecoveryPolicy(key, updates, tenantId);
      return NextResponse.json({ policy });
    }

    // Delete policy
    if (action === 'delete') {
      if (!key) {
        return NextResponse.json({ error: 'key is required' }, { status: 400 });
      }

      const success = await deleteRecoveryPolicy(key, tenantId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage recovery policy' },
      { status: 500 }
    );
  }
}
