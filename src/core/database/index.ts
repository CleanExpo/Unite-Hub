/**
 * Core Database Module
 *
 * Centralized database operations with workspace scoping and connection pooling.
 * Implements ADR-002 (Automatic Workspace Scoping) and ADR-003 (Connection Pooling).
 *
 * @module core/database
 *
 * @example
 * // Create workspace-scoped client
 * import { createWorkspaceScopedClient } from '@/core/database';
 *
 * const db = createWorkspaceScopedClient(supabase, workspaceId);
 *
 * // All operations automatically scoped
 * const { data } = await db.from('contacts').select('*');
 *
 * @example
 * // Use pooled client for high-throughput
 * import { getPooledClient } from '@/core/database';
 *
 * const supabase = getPooledClient();
 *
 * @example
 * // RLS helper checks
 * import { userHasWorkspaceAccess } from '@/core/database';
 *
 * const hasAccess = await userHasWorkspaceAccess(supabase, userId, workspaceId);
 */

// Types
export type {
  WorkspaceScopedTable,
  GlobalTable,
  WorkspaceScopedRecord,
  PoolConfig,
  ScopedQueryBuilder,
  DbErrorCode,
} from './types';

export {
  WORKSPACE_SCOPED_TABLES,
  GLOBAL_TABLES,
  isWorkspaceScopedTable,
  DEFAULT_POOL_CONFIG,
  DB_ERROR_CODES,
} from './types';

// Client
export {
  getPooledClient,
  getAdminClient,
  resetClients,
  createClient,
  createBrowserClient,
} from './client';

// Workspace Scoping
export {
  createWorkspaceScopedClient,
  scopeSelect,
  injectWorkspaceId,
  verifyRecordOwnership,
  batchVerifyOwnership,
  type WorkspaceScopedClient,
} from './workspace-scope';

// RLS Helpers
export {
  userOwnsWorkspace,
  userInOrganization,
  userHasWorkspaceAccess,
  getUserRole,
  userIsStaff,
  userIsFounder,
  canReadWorkspaceRecord,
  canWriteWorkspaceRecord,
  canAccessAdmin,
  batchCheckWorkspaceAccess,
} from './rls-helpers';
