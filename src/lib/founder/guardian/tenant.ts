/**
 * Guardian G30: Tenant Context Helper
 * Centralized tenant resolution for Guardian API routes
 *
 * Phase 1: Returns placeholder tenant ID
 * Future phases will wire to actual auth/session context
 */

export interface GuardianTenantContext {
  tenantId: string;
  userId?: string;
  workspaceId?: string;
}

/**
 * Get tenant context for Guardian operations
 *
 * @returns Tenant context with tenantId
 * @throws Error if tenant cannot be resolved
 *
 * NOTE: Currently returns placeholder. Future phases will integrate with:
 * - NextAuth session
 * - Supabase auth.uid()
 * - Request headers
 * - Workspace context
 */
export async function getGuardianTenantContext(): Promise<GuardianTenantContext> {
  // Phase G30: Placeholder implementation
  // TODO: Wire to actual auth in future phase (G31+)
  const tenantId = 'TODO_GUARDIAN_TENANT';

  return {
    tenantId,
    userId: undefined,
    workspaceId: undefined,
  };
}

/**
 * Validate tenant ID format
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
