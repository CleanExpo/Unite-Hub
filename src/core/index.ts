/**
 * Core Module
 *
 * Foundation layer for Unite-Hub/Synthex providing:
 * - Centralized authentication (ADR-001)
 * - Automatic workspace scoping (ADR-002)
 * - Connection pooling (ADR-003)
 * - Rate limiting
 * - Audit logging
 * - Error handling
 *
 * @module core
 *
 * @example
 * // Full API route with all protections
 * import { withWorkspace, createWorkspaceScopedClient, handleErrors, withRateLimit } from '@/core';
 *
 * export const GET = handleErrors(
 *   withRateLimit('staff',
 *     withWorkspace(async ({ user, workspace, supabase }) => {
 *       const db = createWorkspaceScopedClient(supabase, workspace.workspaceId);
 *       const { data } = await db.from('contacts').select('*');
 *       return NextResponse.json({ data });
 *     })
 *   )
 * );
 */

// Re-export all submodules
export * from './auth';
export * from './database';
export * from './security';
export * from './errors';
