/**
 * API Handler Wrapper
 *
 * Composable middleware wrapper that combines:
 * - Authentication (via withAuth)
 * - Role-based access control (via withRole)
 * - Workspace isolation (via withWorkspace)
 * - Rate limiting (via withRateLimit)
 * - Error handling (via handleErrors)
 *
 * Usage:
 * ```typescript
 * export const GET = withApiHandler(
 *   async (req, context) => {
 *     const { user, workspace, db } = context;
 *     const data = await db.from('contacts').select('*');
 *     return successResponse(data);
 *   },
 *   {
 *     auth: true,
 *     workspace: true,
 *     rateLimit: 'standard',
 *     roles: ['STAFF', 'ADMIN']
 *   }
 * );
 * ```
 *
 * @module api/_middleware/with-api-handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/core/auth/with-auth';
import { withRole } from '@/core/auth/with-role';
import { withWorkspace } from '@/core/auth/with-workspace';
import { applyRateLimit } from './rate-limit';
import { handleErrors } from '@/core/errors/handle-errors';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RateLimitTier } from '@/core/security/types';

/**
 * User roles for role-based access control
 */
export type UserRole = 'FOUNDER' | 'STAFF' | 'CLIENT' | 'ADMIN';

/**
 * Request context passed to API handlers
 */
export interface RequestContext {
  /** Authenticated user (if auth enabled) */
  user?: User;
  /** User's workspace ID (if workspace enabled) */
  workspaceId?: string;
  /** Workspace-scoped Supabase client (if workspace enabled) */
  db?: SupabaseClient;
  /** Original Next.js request object */
  request: NextRequest;
}

/**
 * API handler function type
 */
export type ApiHandler = (
  request: NextRequest,
  context: RequestContext
) => Promise<NextResponse> | NextResponse;

/**
 * Configuration options for withApiHandler
 */
export interface ApiHandlerConfig {
  /**
   * Require authentication
   * @default false
   */
  auth?: boolean;

  /**
   * Require workspace isolation
   * @default false
   */
  workspace?: boolean;

  /**
   * Rate limit tier to apply
   * @default undefined (no rate limiting)
   */
  rateLimit?: RateLimitTier;

  /**
   * Required user roles (requires auth: true)
   * @default undefined (any authenticated user)
   */
  roles?: UserRole[];
}

/**
 * Composable API handler wrapper
 *
 * Combines authentication, authorization, workspace isolation, rate limiting,
 * and error handling into a single wrapper.
 *
 * @param handler - The API handler function to wrap
 * @param config - Configuration options
 * @returns Wrapped handler with middleware applied
 *
 * @example
 * ```typescript
 * // Public endpoint (no auth)
 * export const GET = withApiHandler(
 *   async (req, context) => {
 *     return successResponse({ message: 'Hello World' });
 *   }
 * );
 *
 * // Authenticated endpoint
 * export const GET = withApiHandler(
 *   async (req, context) => {
 *     const { user } = context;
 *     return successResponse({ userId: user.id });
 *   },
 *   { auth: true }
 * );
 *
 * // Staff-only with workspace isolation
 * export const GET = withApiHandler(
 *   async (req, context) => {
 *     const { db, workspaceId } = context;
 *     const { data } = await db.from('contacts').select('*');
 *     return successResponse(data);
 *   },
 *   {
 *     auth: true,
 *     workspace: true,
 *     roles: ['STAFF', 'ADMIN'],
 *     rateLimit: 'standard'
 *   }
 * );
 * ```
 */
export function withApiHandler(
  handler: ApiHandler,
  config: ApiHandlerConfig = {}
): (request: NextRequest) => Promise<NextResponse> {
  const {
    auth = false,
    workspace = false,
    rateLimit,
    roles,
  } = config;

  // Validate configuration
  if (workspace && !auth) {
    throw new Error('withApiHandler: workspace isolation requires auth: true');
  }

  if (roles && !auth) {
    throw new Error('withApiHandler: role-based access requires auth: true');
  }

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Initialize context
      const context: RequestContext = { request };

      // Apply rate limiting first (before any expensive operations)
      if (rateLimit) {
        const rateLimitResponse = await applyRateLimit(request, rateLimit);

        // If rate limit returns error response, return it immediately
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      // Apply authentication if required
      if (auth) {
        const authResponse = await withAuth(async (req, { user }) => {
          context.user = user;
          return NextResponse.json({ success: true });
        })(request);

        // If auth fails, return error response
        if (authResponse.status === 401) {
          return authResponse;
        }
      }

      // Apply role-based access control if required
      if (roles && context.user) {
        const roleResponse = await withRole(
          async () => NextResponse.json({ success: true }),
          roles
        )(request);

        // If role check fails, return error response
        if (roleResponse.status === 403) {
          return roleResponse;
        }
      }

      // Apply workspace isolation if required
      if (workspace && context.user) {
        const workspaceResponse = await withWorkspace(
          async (req, { workspaceId, db }) => {
            context.workspaceId = workspaceId;
            context.db = db;
            return NextResponse.json({ success: true });
          }
        )(request);

        // If workspace check fails, return error response
        if (workspaceResponse.status === 400 || workspaceResponse.status === 403) {
          return workspaceResponse;
        }
      }

      // Call the actual handler with context
      return await handler(request, context);
    } catch (error) {
      // Handle all errors through centralized error handler
      return handleErrors(error);
    }
  };
}

/**
 * Type guard to check if context has authenticated user
 */
export function isAuthenticated(context: RequestContext): context is RequestContext & { user: User } {
  return context.user !== undefined;
}

/**
 * Type guard to check if context has workspace
 */
export function hasWorkspace(
  context: RequestContext
): context is RequestContext & { workspaceId: string; db: SupabaseClient } {
  return context.workspaceId !== undefined && context.db !== undefined;
}
