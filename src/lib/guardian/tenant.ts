import { createClient } from '@/lib/supabase/server';

/**
 * Guardian G31: Tenant Context with Auth Enforcement
 * Centralized tenant resolution wired to Supabase authentication
 */

export interface GuardianTenantContext {
  /**
   * The tenant id used for Guardian views.
   *
   * In G31, this is enforced to match the authenticated Supabase user id
   * so that it remains compatible with RLS policies such as:
   *   tenant_id = auth.uid()
   */
  tenantId: string;
  userId?: string;
  workspaceId?: string;
}

/**
 * Phase G31: Guardian tenant resolution with enforcement.
 *
 * - Derives tenantId from Supabase auth user.
 * - Throws an error if no authenticated user is present.
 * - Guardian API routes are responsible for translating this into a 401.
 *
 * @returns Tenant context with authenticated user ID
 * @throws Error with code 'GUARDIAN_TENANT_UNAUTHENTICATED' if no user
 */
export async function getGuardianTenantContext(): Promise<GuardianTenantContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    const err = new Error('GUARDIAN_TENANT_UNAUTHENTICATED');
    err.name = 'GUARDIAN_TENANT_UNAUTHENTICATED';
    throw err;
  }

  return {
    tenantId: data.user.id,
    userId: data.user.id,
    workspaceId: undefined,
  };
}

/**
 * Validate tenant ID format (UUID)
 *
 * @param tenantId - Tenant ID to validate
 * @returns true if valid UUID format
 */
export function isValidTenantId(tenantId: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(tenantId);
}

/**
 * Assert tenant ID is valid
 *
 * @param tenantId - Tenant ID to validate
 * @throws Error if tenant ID is invalid
 */
export function assertValidTenantId(tenantId: string): void {
  if (!isValidTenantId(tenantId)) {
    throw new Error(`Invalid tenant ID format: ${tenantId}`);
  }
}
