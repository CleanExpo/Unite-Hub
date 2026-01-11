import { supabaseAdmin } from '@/lib/supabase/admin';

export type SynthexTenantRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TenantAccessResult {
  tenantId: string;
  role: SynthexTenantRole;
}

export async function getTenantAccess(
  userId: string,
  tenantId: string
): Promise<TenantAccessResult | null> {
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('synthex_tenants')
    .select('id, owner_user_id')
    .eq('id', tenantId)
    .single();

  if (tenantError || !tenant) {
    return null;
  }

  if (tenant.owner_user_id === userId) {
    return { tenantId, role: 'owner' };
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from('synthex_tenant_members')
    .select('role, status')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (memberError || !member) {
    return null;
  }

  if (member.status !== 'active') {
    return null;
  }

  const role = member.role as SynthexTenantRole;
  if (!['admin', 'editor', 'viewer', 'owner'].includes(role)) {
    return null;
  }

  return { tenantId, role };
}

export function hasTenantRole(
  access: TenantAccessResult,
  allowed: ReadonlyArray<SynthexTenantRole>
): boolean {
  return allowed.includes(access.role);
}

