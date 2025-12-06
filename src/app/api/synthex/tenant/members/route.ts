/**
 * Synthex Tenant Members API
 * GET: List tenant members
 * POST: Invite new member
 * PATCH: Update member role/status
 * DELETE: Remove member
 * Phase B23: Multi-Business Tenant Onboarding & Profiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listTenantMembers,
  inviteTenantMember,
  updateTenantMember,
  removeTenantMember,
  type InviteMemberInput,
} from '@/lib/synthex/tenantProfileService';

// =====================================================
// GET /api/synthex/tenant/members
// List all members for a tenant
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

    // Verify user has access to this tenant
    const { data: tenant } = await supabase
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const isOwner = tenant.owner_user_id === user.id;
    const { data: member } = await supabase
      .from('synthex_tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!isOwner && !member) {
      return NextResponse.json(
        { error: 'Forbidden: not a member of this tenant' },
        { status: 403 }
      );
    }

    // List members
    const result = await listTenantMembers(tenantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: result.data });
  } catch (error) {
    console.error('[API] Error in GET /api/synthex/tenant/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST /api/synthex/tenant/members
// Invite new member to tenant
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
    const { tenant_id, invited_email, role } = body as {
      tenant_id: string;
      invited_email: string;
      role: string;
    };

    if (!tenant_id || !invited_email || !role) {
      return NextResponse.json(
        { error: 'tenant_id, invited_email, and role are required' },
        { status: 400 }
      );
    }

    // Verify user can invite members (owner or admin)
    const { data: tenant } = await supabase
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenant_id)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const isOwner = tenant.owner_user_id === user.id;
    const { data: member } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!isOwner && (!member || member.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: only owners and admins can invite members' },
        { status: 403 }
      );
    }

    // Invite member
    const memberData: InviteMemberInput = {
      invited_email,
      role: role as any,
      invited_by: user.id,
    };

    const result = await inviteTenantMember(tenant_id, memberData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('[API] Error in POST /api/synthex/tenant/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH /api/synthex/tenant/members
// Update member role or status
// =====================================================

export async function PATCH(req: NextRequest) {
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
    const { member_id, tenant_id, role, status } = body as {
      member_id: string;
      tenant_id: string;
      role?: string;
      status?: string;
    };

    if (!member_id || !tenant_id) {
      return NextResponse.json(
        { error: 'member_id and tenant_id are required' },
        { status: 400 }
      );
    }

    if (!role && !status) {
      return NextResponse.json(
        { error: 'role or status must be provided' },
        { status: 400 }
      );
    }

    // Verify user can update members (owner or admin)
    const { data: tenant } = await supabase
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenant_id)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const isOwner = tenant.owner_user_id === user.id;
    const { data: member } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!isOwner && (!member || member.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: only owners and admins can update members' },
        { status: 403 }
      );
    }

    // Update member
    const updates: any = {};
    if (role) updates.role = role;
    if (status) updates.status = status;

    const result = await updateTenantMember(member_id, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API] Error in PATCH /api/synthex/tenant/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/synthex/tenant/members
// Remove member from tenant
// =====================================================

export async function DELETE(req: NextRequest) {
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

    // Get params from URL
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('member_id');
    const tenantId = searchParams.get('tenant_id');

    if (!memberId || !tenantId) {
      return NextResponse.json(
        { error: 'member_id and tenant_id query parameters are required' },
        { status: 400 }
      );
    }

    // Verify user can remove members (owner or admin)
    const { data: tenant } = await supabase
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const isOwner = tenant.owner_user_id === user.id;
    const { data: member } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!isOwner && (!member || member.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: only owners and admins can remove members' },
        { status: 403 }
      );
    }

    // Remove member
    const result = await removeTenantMember(memberId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[API] Error in DELETE /api/synthex/tenant/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
