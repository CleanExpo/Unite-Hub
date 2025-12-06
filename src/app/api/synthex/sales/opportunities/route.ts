/**
 * GET /api/synthex/sales/opportunities
 * POST /api/synthex/sales/opportunities
 * PATCH /api/synthex/sales/opportunities
 *
 * Manage sales opportunities.
 *
 * GET Query params:
 * - tenantId: string (required)
 * - pipelineId?: string
 * - status?: 'open' | 'won' | 'lost'
 * - ownerId?: string
 * - stage?: string
 *
 * POST Body:
 * {
 *   tenantId: string (required)
 *   pipelineId: string (required)
 *   name: string (required)
 *   stage: string (required)
 *   value?: number
 *   probability?: number
 *   expectedClose?: string (date)
 *   ownerId: string (required)
 *   contactId?: string
 *   companyName?: string
 *   notes?: string
 * }
 *
 * PATCH Body:
 * {
 *   opportunityId: string (required)
 *   updates: {
 *     name?: string
 *     stage?: string
 *     value?: number
 *     probability?: number
 *     expectedClose?: string
 *     ownerId?: string
 *     contactId?: string
 *     companyName?: string
 *     notes?: string
 *     status?: 'open' | 'won' | 'lost'
 *   }
 * }
 *
 * Phase: B26 - Sales CRM Pipeline + Opportunity Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  listOpportunities,
  createOpportunity,
  updateOpportunity,
  OpportunityInput,
  OpportunityStatus,
} from '@/lib/synthex/salesCrmService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const pipelineId = searchParams.get('pipelineId');
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');
    const stage = searchParams.get('stage');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required param: tenantId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await listOpportunities(tenantId, {
      pipeline_id: pipelineId || undefined,
      status: status as OpportunityStatus | undefined,
      owner_user_id: ownerId || undefined,
      stage: stage || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch opportunities' },
        { status: 500 }
      );
    }

    return NextResponse.json({ opportunities: result.data });
  } catch (error) {
    console.error('GET /api/synthex/sales/opportunities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      tenantId,
      pipelineId,
      name,
      stage,
      value,
      probability,
      expectedClose,
      ownerId,
      contactId,
      companyName,
      notes,
    } = body;

    if (!tenantId || !pipelineId || !name || !stage || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, pipelineId, name, stage, ownerId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const input: OpportunityInput = {
      tenant_id: tenantId,
      pipeline_id: pipelineId,
      name,
      stage,
      owner_user_id: ownerId,
      value: value ?? 0,
      probability: probability ?? 0,
      expected_close: expectedClose || undefined,
      contact_id: contactId || undefined,
      company_name: companyName || undefined,
      notes: notes || undefined,
    };

    const result = await createOpportunity(input);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create opportunity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ opportunity: result.data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/synthex/sales/opportunities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { opportunityId, updates } = body;

    if (!opportunityId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: opportunityId, updates' },
        { status: 400 }
      );
    }

    // Validate tenant access through opportunity
    const { data: opportunity } = await supabaseAdmin
      .from('synthex_sales_opportunities')
      .select('tenant_id')
      .eq('id', opportunityId)
      .single();

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', opportunity.tenant_id)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Map frontend keys to database column names
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.probability !== undefined) dbUpdates.probability = updates.probability;
    if (updates.expectedClose !== undefined) dbUpdates.expected_close = updates.expectedClose;
    if (updates.ownerId !== undefined) dbUpdates.owner_user_id = updates.ownerId;
    if (updates.contactId !== undefined) dbUpdates.contact_id = updates.contactId;
    if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const result = await updateOpportunity(opportunityId, dbUpdates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update opportunity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ opportunity: result.data });
  } catch (error) {
    console.error('PATCH /api/synthex/sales/opportunities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
