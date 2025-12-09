export interface PermissionCheckContext {
  tenantId: string;
  userId: string;
}

export const permissionService = {
  async getUserPermissions(supabase: any, ctx: PermissionCheckContext): Promise<string[]> {
    const { data, error } = await supabase
      .from('role_assignments')
      .select('roles:role_id ( role_permissions:role_permissions ( permissions:permission_id ( code ) ) )')
      .eq('tenant_id', ctx.tenantId)
      .eq('user_id', ctx.userId);

    if (error) {
      console.error('[permissionService.getUserPermissions] error', error);
      return [];
    }

    const codes = new Set<string>();
    for (const row of data as any[]) {
      const roles = row.roles ? (Array.isArray(row.roles) ? row.roles : [row.roles]) : [];
      for (const role of roles) {
        const rps = role.role_permissions ?? [];
        for (const rp of rps) {
          const perms = rp.permissions ? (Array.isArray(rp.permissions) ? rp.permissions : [rp.permissions]) : [];
          for (const p of perms) {
            if (p.code) codes.add(p.code);
          }
        }
      }
    }

    return Array.from(codes);
  },

  async requirePermission(supabase: any, ctx: PermissionCheckContext, code: string): Promise<boolean> {
    const perms = await this.getUserPermissions(supabase, ctx);
    const allowed = perms.includes(code);
    if (!allowed) {
      console.warn('[permissionService.requirePermission] denied', { userId: ctx.userId, tenantId: ctx.tenantId, code });
    }
    return allowed;
  }
};
