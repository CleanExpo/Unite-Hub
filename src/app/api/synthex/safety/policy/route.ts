/**
 * Synthex Safety Policy API
 *
 * GET: Retrieve guardrail policy for a tenant
 * PUT: Update guardrail policy
 *
 * Phase: B28 - AI Compliance, Audit, Guardrails & Safety Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGuardrailPolicy, updateGuardrailPolicy } from '@/lib/synthex/safetyService';

/**
 * GET /api/synthex/safety/policy
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const policy = await getGuardrailPolicy(tenantId);

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('[safety/policy] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/synthex/safety/policy
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, policy } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (!policy) {
      return NextResponse.json({ error: 'policy is required' }, { status: 400 });
    }

    const updatedPolicy = await updateGuardrailPolicy(tenantId, policy);

    return NextResponse.json({ policy: updatedPolicy });
  } catch (error) {
    console.error('[safety/policy] PUT error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
