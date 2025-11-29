/**
 * Core Authentication Module
 *
 * Centralized authentication and authorization for Unite-Hub/Synthex.
 * This module implements ADR-001 (Centralized Auth Middleware).
 *
 * @module core/auth
 *
 * @example
 * // In API route
 * import { withAuth, withWorkspace, withRole } from '@/core/auth';
 *
 * // Basic auth
 * export const GET = withAuth(async ({ user, supabase }) => {
 *   return NextResponse.json({ userId: user.id });
 * });
 *
 * // Workspace-scoped
 * export const POST = withWorkspace(async ({ user, workspace, supabase }) => {
 *   const { workspaceId } = workspace;
 *   // All queries automatically scoped
 * });
 *
 * // Role-based
 * export const DELETE = withRole(['FOUNDER', 'ADMIN'], async ({ user }) => {
 *   // Only founders/admins reach here
 * });
 */

// Types
export type {
  UserRole,
  ProjectContext,
  SynthexTier,
  UserProfile,
  WorkspaceContext,
  AuthContext,
  RequestContext,
  AuthenticatedHandler,
  WorkspaceScopedHandler,
  PublicHandler,
  MiddlewareResult,
  RolePermissions,
  AuthErrorCode,
} from './types';

export { AUTH_ERROR_CODES } from './types';

// Session management
export {
  getValidatedSession,
  getUserProfile,
  getUserWorkspace,
  getFullSessionContext,
  type SessionResult,
  type ProfileResult,
  type FullSessionContext,
} from './session';

// Guards
export {
  hasRole,
  hasMinimumRole,
  requireUniteHubAccess,
  requireSynthexAccess,
  requireAdmin,
  requireFounder,
  hasSynthexTier,
  hasWorkspaceAccess,
  validatePermissions,
  PERMISSION_PRESETS,
} from './guards';

// Middleware
export {
  withAuth,
  withRole,
  withPermissions,
  withWorkspace,
  withWorkspaceAndRole,
  withUniteHubAccess,
  withSynthexAccess,
  extractBearerToken,
} from './middleware';
