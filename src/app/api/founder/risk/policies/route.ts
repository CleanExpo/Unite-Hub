/**
 * Policies API
 *
 * Phase: D56 - Risk, Compliance & Guardrail Center
 *
 * Routes:
 * - GET /api/founder/risk/policies - List policies
 * - POST /api/founder/risk/policies - Create policy
 *
 * Query Params:
 * - action=get&id=<policy-id> - Get specific policy
 * - action=violations&id=<policy-id> - List violations for policy
 * - action=update&id=<policy-id> - Update policy
 * - action=delete&id=<policy-id> - Delete policy
 * - scope=<scope> - Filter by scope
 * - status=<status> - Filter by status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createPolicy,
  getPolicy,
  listPolicies,
  updatePolicy,
  deletePolicy,
  listViolations,
  CreatePolicyInput,
  PolicyStatus,
} from '@/lib/unite/riskCenterService';

// =============================================================================
// GET - List policies, get policy, get violations
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id || null;

    const action = request.nextUrl.searchParams.get('action');
    const id = request.nextUrl.searchParams.get('id');

    // Get specific policy
    if (action === 'get' && id) {
      const policy = await getPolicy(tenantId, id);
      if (!policy) {
        return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
      }
      return NextResponse.json({ policy });
    }

    // List violations for policy
    if (action === 'violations' && id) {
      const resolved = request.nextUrl.searchParams.get('resolved');
      const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

      const violations = await listViolations(tenantId, {
        policyId: id,
        resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
        limit,
      });

      return NextResponse.json({ violations });
    }

    // List policies
    const scope = request.nextUrl.searchParams.get('scope');
    const status = request.nextUrl.searchParams.get('status') as PolicyStatus | null;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const policies = await listPolicies(tenantId, {
      scope: scope || undefined,
      status: status || undefined,
      limit,
    });

    return NextResponse.json({ policies });
  } catch (error: unknown) {
    console.error('GET /api/founder/risk/policies error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create, update, delete policy
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id || null;

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    // Update policy
    if (action === 'update') {
      const policyId = request.nextUrl.searchParams.get('id') || body.policy_id;
      if (!policyId) {
        return NextResponse.json({ error: 'policy_id is required' }, { status: 400 });
      }

      const updates = {
        name: body.name,
        description: body.description,
        status: body.status,
        rules: body.rules,
        ai_profile: body.ai_profile,
      };

      const policy = await updatePolicy(tenantId, policyId, updates);
      return NextResponse.json({ policy });
    }

    // Delete policy
    if (action === 'delete') {
      const policyId = request.nextUrl.searchParams.get('id') || body.policy_id;
      if (!policyId) {
        return NextResponse.json({ error: 'policy_id is required' }, { status: 400 });
      }

      await deletePolicy(tenantId, policyId);
      return NextResponse.json({ success: true });
    }

    // Create policy
    const input: CreatePolicyInput = {
      slug: body.slug,
      name: body.name,
      description: body.description,
      scope: body.scope,
      rules: body.rules,
    };

    if (!input.slug || !input.name || !input.scope || !input.rules) {
      return NextResponse.json(
        { error: 'slug, name, scope, and rules are required' },
        { status: 400 }
      );
    }

    const policy = await createPolicy(tenantId, input);
    return NextResponse.json({ policy }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/founder/risk/policies error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage policies' },
      { status: 500 }
    );
  }
}
