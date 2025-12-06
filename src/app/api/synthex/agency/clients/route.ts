/**
 * Synthex Agency Clients API
 * Phase B32: Agency Multi-Workspace + Brand Switcher
 *
 * GET  - List clients for an agency
 * POST - Link a new tenant to agency as client
 * PATCH - Update client status
 * DELETE - Remove client from agency
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAgencyClients,
  linkTenantToAgencyClient,
  updateClientStatus,
  removeAgencyClient,
  userHasAgencyAccess,
} from '@/lib/synthex/agencyWorkspaceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agencyId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this agency
    const { hasAccess } = await userHasAgencyAccess(user.id, agencyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this agency' },
        { status: 403 }
      );
    }

    const clients = await getAgencyClients(agencyId);

    return NextResponse.json({
      clients,
      count: clients.length,
    });
  } catch (error) {
    console.error('Error in agency/clients GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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

    const body = await request.json();
    const { agency_id, tenant_id, label, domain, notes } = body;

    if (!agency_id || !tenant_id || !label) {
      return NextResponse.json(
        { error: 'agency_id, tenant_id, and label are required' },
        { status: 400 }
      );
    }

    // Verify user has admin access to this agency
    const { hasAccess, role } = await userHasAgencyAccess(user.id, agency_id);
    if (!hasAccess || !['owner', 'admin'].includes(role || '')) {
      return NextResponse.json(
        { error: 'Admin access required to add clients' },
        { status: 403 }
      );
    }

    const client = await linkTenantToAgencyClient(
      agency_id,
      tenant_id,
      label,
      domain,
      notes
    );

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('Error in agency/clients POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { client_id, status } = body;

    if (!client_id || !status) {
      return NextResponse.json(
        { error: 'client_id and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'paused', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const client = await updateClientStatus(client_id, status);

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error in agency/clients PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    await removeAgencyClient(clientId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in agency/clients DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
