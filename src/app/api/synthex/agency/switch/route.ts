/**
 * Synthex Agency Switch API
 * Phase B32: Agency Multi-Workspace + Brand Switcher
 *
 * POST - Switch active tenant for current user session
 * GET  - Get current active tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  setActiveTenantForUser,
  getActiveTenantForUser,
  userHasAgencyAccess,
} from '@/lib/synthex/agencyWorkspaceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeTenant = await getActiveTenantForUser(user.id);

    return NextResponse.json({
      active_tenant: activeTenant,
    });
  } catch (error) {
    console.error('Error in agency/switch GET:', error);
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
    const { tenant_id, agency_id } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      );
    }

    // If agency_id provided, verify user has access
    if (agency_id) {
      const { hasAccess } = await userHasAgencyAccess(user.id, agency_id);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to this agency' },
          { status: 403 }
        );
      }
    }

    // TODO: Verify user has access to the tenant_id as well
    // This could check synthex_tenant_profiles or organization memberships

    const activeTenant = await setActiveTenantForUser(user.id, tenant_id, agency_id);

    return NextResponse.json({
      active_tenant: activeTenant,
      message: 'Tenant switched successfully',
    });
  } catch (error) {
    console.error('Error in agency/switch POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
