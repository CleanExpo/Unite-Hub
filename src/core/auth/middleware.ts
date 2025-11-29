/**
 * Central Authentication Middleware
 *
 * ADR-001: Centralized Auth Middleware
 * Fixes 174 routes missing authentication
 *
 * This module provides composable middleware for all API routes:
 * - withAuth: Basic authentication check
 * - withRole: Role-based access control
 * - withWorkspace: Workspace scoping (combined with database module)
 *
 * @module core/auth/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AuthContext,
  AuthenticatedHandler,
  UserRole,
  RolePermissions,
  AUTH_ERROR_CODES,
  WorkspaceScopedHandler,
  RequestContext,
} from './types';
import { getValidatedSession, getUserProfile, getUserWorkspace } from './session';
import { hasRole, hasSynthexTier, hasWorkspaceAccess } from './guards';

/**
 * Create standardized error response
 */
function authError(
  code: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

/**
 * Basic authentication middleware
 *
 * Validates session and provides authenticated context to handler.
 * Use this for routes that just need to verify the user is logged in.
 *
 * @example
 * export const GET = withAuth(async ({ user, supabase }) => {
 *   const data = await supabase.from('table').select('*');
 *   return NextResponse.json(data);
 * });
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const sessionResult = await getValidatedSession();

    if (!sessionResult.valid || !sessionResult.user) {
      return authError(
        AUTH_ERROR_CODES.UNAUTHENTICATED,
        'Authentication required',
        401
      );
    }

    const { user, supabase } = sessionResult;

    // Get user profile with role
    const profileResult = await getUserProfile(supabase, user.id);

    const context: AuthContext = {
      user,
      profile: profileResult.profile || {
        id: user.id,
        email: user.email || '',
        role: profileResult.role,
      },
      role: profileResult.role,
      supabase,
    };

    try {
      return await handler(context, request);
    } catch (error) {
      console.error('[Auth Middleware] Handler error:', error);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 }
      );
    }
  };
}

/**
 * Role-based authentication middleware
 *
 * Validates session and checks user has required role.
 *
 * @param allowedRoles - Array of roles that can access this route
 * @param handler - Handler function to execute if authorized
 *
 * @example
 * export const POST = withRole(['FOUNDER', 'ADMIN'], async ({ user, role }) => {
 *   // Only founders and admins can reach this
 *   return NextResponse.json({ success: true });
 * });
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: AuthenticatedHandler
) {
  return withAuth(async (context, request) => {
    if (!hasRole(context.role, allowedRoles)) {
      return authError(
        AUTH_ERROR_CODES.ROLE_DENIED,
        `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        403
      );
    }

    return handler(context, request);
  });
}

/**
 * Permission-based authentication middleware
 *
 * Full permission check including role and optional tier requirements.
 *
 * @param permissions - Permission configuration object
 * @param handler - Handler function to execute if authorized
 *
 * @example
 * import { PERMISSION_PRESETS } from '@/core/auth/guards';
 *
 * export const GET = withPermissions(PERMISSION_PRESETS.SYNTHEX_PROFESSIONAL, async (context) => {
 *   // Only professional+ tier clients can access
 *   return NextResponse.json({ data: 'premium content' });
 * });
 */
export function withPermissions(
  permissions: RolePermissions,
  handler: AuthenticatedHandler
) {
  return withAuth(async (context, request) => {
    // Check role
    if (!hasRole(context.role, permissions.allowedRoles)) {
      return authError(
        AUTH_ERROR_CODES.ROLE_DENIED,
        'Access denied for your role',
        403
      );
    }

    // Check tier if required
    if (permissions.requireTier && permissions.requireTier.length > 0) {
      const hasTier = await hasSynthexTier(
        context.supabase,
        context.user.id,
        permissions.requireTier
      );

      if (!hasTier) {
        return authError(
          AUTH_ERROR_CODES.TIER_REQUIRED,
          `Subscription tier required: ${permissions.requireTier.join(' or ')}`,
          403
        );
      }
    }

    return handler(context, request);
  });
}

/**
 * Workspace-scoped authentication middleware
 *
 * ADR-002: Automatic Workspace Scoping
 * Ensures all data access is scoped to user's workspace.
 *
 * @example
 * export const GET = withWorkspace(async ({ user, workspace, supabase }) => {
 *   // workspace.workspaceId is guaranteed to be valid
 *   const data = await supabase
 *     .from('contacts')
 *     .select('*')
 *     .eq('workspace_id', workspace.workspaceId);
 *   return NextResponse.json(data);
 * });
 */
export function withWorkspace(handler: WorkspaceScopedHandler) {
  return withAuth(async (context, request) => {
    // Get workspace ID from query params or user's default
    const url = new URL(request.url);
    let workspaceId = url.searchParams.get('workspaceId');

    // If not in query, get user's default workspace
    if (!workspaceId) {
      workspaceId = await getUserWorkspace(context.supabase, context.user.id);
    }

    if (!workspaceId) {
      return authError(
        AUTH_ERROR_CODES.WORKSPACE_DENIED,
        'No workspace access. Please contact support.',
        403
      );
    }

    // Verify user has access to this workspace
    const hasAccess = await hasWorkspaceAccess(
      context.supabase,
      context.user.id,
      workspaceId
    );

    if (!hasAccess) {
      return authError(
        AUTH_ERROR_CODES.WORKSPACE_DENIED,
        'Access denied to this workspace',
        403
      );
    }

    const requestContext: RequestContext = {
      ...context,
      workspace: { workspaceId },
      request,
    };

    return handler(requestContext);
  });
}

/**
 * Combined workspace + role middleware
 *
 * Most common pattern for protected API routes.
 *
 * @example
 * export const POST = withWorkspaceAndRole(
 *   ['FOUNDER', 'STAFF'],
 *   async ({ user, workspace, supabase }) => {
 *     // Staff-only, workspace-scoped operation
 *     return NextResponse.json({ success: true });
 *   }
 * );
 */
export function withWorkspaceAndRole(
  allowedRoles: UserRole[],
  handler: WorkspaceScopedHandler
) {
  return withWorkspace(async (context) => {
    if (!hasRole(context.role, allowedRoles)) {
      return authError(
        AUTH_ERROR_CODES.ROLE_DENIED,
        `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        403
      );
    }

    return handler(context);
  });
}

/**
 * Unite-Hub staff middleware (convenience wrapper)
 *
 * For routes that should only be accessible by Unite staff.
 */
export function withUniteHubAccess(handler: WorkspaceScopedHandler) {
  return withWorkspaceAndRole(['FOUNDER', 'STAFF', 'ADMIN'], handler);
}

/**
 * Synthex client middleware (convenience wrapper)
 *
 * For routes accessible by Synthex clients and staff.
 */
export function withSynthexAccess(handler: WorkspaceScopedHandler) {
  return withWorkspaceAndRole(['CLIENT', 'FOUNDER', 'STAFF', 'ADMIN'], handler);
}

/**
 * Extract bearer token from request (for webhook verification)
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
