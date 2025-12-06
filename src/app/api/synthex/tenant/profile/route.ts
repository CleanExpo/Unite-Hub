/**
 * Synthex Tenant Profile API
 * GET: Fetch tenant profile
 * POST: Create/update tenant profile
 * Phase B23: Multi-Business Tenant Onboarding & Profiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getTenantProfile,
  upsertTenantProfile,
  type TenantProfileInput,
} from '@/lib/synthex/tenantProfileService';

// =====================================================
// GET /api/synthex/tenant/profile
// Fetch tenant profile by tenant_id
// =====================================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant_id from query params
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch profile
    const result = await getTenantProfile(tenantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API] Error in GET /api/synthex/tenant/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/synthex/tenant/profile
// Create or update tenant profile
// =====================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { tenant_id, ...profileData } = body as { tenant_id: string } & TenantProfileInput;

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!profileData.name || !profileData.industry) {
      return NextResponse.json(
        { error: 'name and industry are required' },
        { status: 400 }
      );
    }

    // Verify user owns this tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    if (tenant.owner_user_id !== user.id) {
      // Check if user is admin/editor member
      const { data: member } = await supabase
        .from('synthex_tenant_members')
        .select('role')
        .eq('tenant_id', tenant_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!member || !['admin', 'editor'].includes(member.role)) {
        return NextResponse.json(
          { error: 'Forbidden: insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Upsert profile
    const result = await upsertTenantProfile(tenant_id, profileData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error('[API] Error in POST /api/synthex/tenant/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
