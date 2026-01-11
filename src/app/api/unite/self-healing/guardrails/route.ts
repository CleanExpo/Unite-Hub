/**
 * Guardrail Policies API
 * Phase: D68
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listGuardrailPolicies,
  createGuardrailPolicy,
  updateGuardrailPolicy,
  deleteGuardrailPolicy,
  evaluateGuardrails,
} from '@/lib/unite/guardrailService';

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

    const filters = {
      tenant_id: tenantId || undefined,
      boundary: request.nextUrl.searchParams.get('boundary') || undefined,
      rule_type: request.nextUrl.searchParams.get('rule_type') || undefined,
      is_active: request.nextUrl.searchParams.get('is_active') === 'true' ? true : undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const policies = await listGuardrailPolicies(filters);
    return NextResponse.json({ policies });
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

    // Evaluate guardrails
    if (action === 'evaluate') {
      const { boundary, context } = body;
      if (!boundary || !context) {
        return NextResponse.json(
          { error: 'boundary and context required' },
          { status: 400 }
        );
      }

      const result = await evaluateGuardrails(tenantId, boundary, context);
      return NextResponse.json(result);
    }

    // Update existing policy
    if (action === 'update') {
      const { policy_id, ...updates } = body;
      if (!policy_id) {
        return NextResponse.json({ error: 'policy_id required' }, { status: 400 });
      }

      const policy = await updateGuardrailPolicy(policy_id, updates);
      return NextResponse.json({ policy });
    }

    // Delete policy
    if (action === 'delete') {
      const { policy_id } = body;
      if (!policy_id) {
        return NextResponse.json({ error: 'policy_id required' }, { status: 400 });
      }

      await deleteGuardrailPolicy(policy_id);
      return NextResponse.json({ success: true });
    }

    // Create new policy
    const policy = await createGuardrailPolicy({
      tenant_id: tenantId,
      ...body,
    });

    return NextResponse.json({ policy }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
