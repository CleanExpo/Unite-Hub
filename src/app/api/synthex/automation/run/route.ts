/**
 * POST /api/synthex/automation/run
 *
 * Execute a workflow for a specific contact.
 *
 * Body:
 * {
 *   tenantId: string (required)
 *   workflowId: string (required)
 *   contactId: string (required)
 *   context?: object (optional - additional context for actions)
 * }
 *
 * Phase: B13 - Automated Lead Nurturing Workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getWorkflow,
  executeWorkflow,
  Contact,
} from '@/lib/synthex/automationService';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, workflowId, contactId, context } = body;

    if (!tenantId || !workflowId || !contactId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, workflowId, contactId' },
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

    // Get workflow
    const workflowResult = await getWorkflow(workflowId);
    if (workflowResult.error || !workflowResult.data) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const workflow = workflowResult.data;

    // Verify workflow belongs to tenant
    if (workflow.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Workflow does not belong to tenant' },
        { status: 403 }
      );
    }

    // Get contact
    const { data: contactData } = await supabaseAdmin
      .from('synthex_audience_contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (!contactData) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    if (contactData.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Contact does not belong to tenant' },
        { status: 403 }
      );
    }

    const contact: Contact = {
      id: contactData.id,
      email: contactData.email,
      name: contactData.name || undefined,
      tags: contactData.tags || [],
    };

    // Execute workflow
    const result = await executeWorkflow(workflow, contact, context);

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      run: result.data,
    }, { status: 200 });
  } catch (error) {
    console.error('[automation/run POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
