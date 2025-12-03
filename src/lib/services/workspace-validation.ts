/**
 * Workspace Validation Service Implementation
 *
 * Provides secure workspace isolation for all API endpoints.
 * CRITICAL: All database queries MUST be scoped to the user's workspace.
 *
 * This is the typed implementation of IWorkspaceValidationService
 */

import { NextRequest } from 'next/server';
import type { IWorkspaceValidationService, AuthenticatedUser } from './types';
import { getSupabaseServer } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getSupabaseServerWithAuth } from '@/lib/supabase';

/**
 * Workspace Validation Service
 *
 * Implements IWorkspaceValidationService to enforce contract:
 * - All methods are explicitly defined with matching signatures
 * - All return types match the interface
 * - All error messages are documented
 */
class WorkspaceValidationService implements IWorkspaceValidationService {
  /**
   * Validates user authentication and returns user context
   *
   * CRITICAL FIX: Now uses JWT-authenticated Supabase client to ensure auth.uid()
   * is set correctly for RLS policies. This prevents 403 errors on protected queries.
   *
   * Supports both:
   * - Implicit OAuth flow (Bearer token in Authorization header) - PREFERRED
   * - PKCE flow (session cookies)
   *
   * @param req - Next.js request object
   * @returns User context with userId and orgId
   * @throws Error if authentication fails
   */
  async validateUserAuth(req: NextRequest): Promise<AuthenticatedUser> {
    // Try to get token from Authorization header (client-side requests with implicit OAuth)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    let authenticatedSupabase;

    if (token) {
      // CRITICAL: Use authenticated client with JWT context
      // This ensures auth.uid() is set for RLS policies
      authenticatedSupabase = getSupabaseServerWithAuth(token);

      // Verify token is valid
      const { data, error } = await authenticatedSupabase.auth.getUser();

      if (error || !data.user) {
        console.error('[workspace-validation] Invalid token:', error?.message);
        throw new Error('Unauthorized: Invalid token');
      }

      userId = data.user.id;
      console.log('[workspace-validation] Token auth successful for user:', userId);
    } else {
      // Fallback to server-side cookies (PKCE flow)
      console.log('[workspace-validation] No token, trying cookie-based auth...');
      authenticatedSupabase = await getSupabaseServer();
      const { data, error: authError } = await authenticatedSupabase.auth.getUser();

      if (authError || !data.user) {
        console.error('[workspace-validation] No valid session:', authError?.message);
        throw new Error('Unauthorized: No valid session');
      }

      userId = data.user.id;
      console.log('[workspace-validation] Cookie auth successful for user:', userId);
    }

    // Get user's organization using the AUTHENTICATED client
    // CRITICAL: This client has JWT context, so auth.uid() works in RLS policies
    // RLS Policy: "Users can view their org memberships" USING (user_id = auth.uid())
    const { data: userOrg, error: orgError } = await authenticatedSupabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (orgError) {
      console.error('[workspace-validation] Error fetching user organization:', orgError);
      console.error('[workspace-validation] This may indicate RLS policy issues or missing data');
      throw new Error('Forbidden: Error accessing organization');
    }

    if (!userOrg) {
      console.error('[workspace-validation] No organization found for userId:', userId);
      console.error('[workspace-validation] User may not be properly initialized');
      throw new Error('Forbidden: No organization found for user');
    }

    console.log('[workspace-validation] User authenticated successfully:', {
      userId,
      orgId: userOrg.org_id,
    });

    return {
      userId,
      orgId: userOrg.org_id,
    };
  }

  /**
   * Validates that a workspace belongs to the user's organization
   *
   * CRITICAL: Always call this before allowing access to workspace data
   *
   * IMPORTANT: This function uses service role to bypass RLS because:
   * 1. We already validated user auth (they're authenticated)
   * 2. We're just checking workspace ownership (org_id match)
   * 3. The workspace query doesn't need user context
   *
   * @param workspaceId - Workspace ID to validate
   * @param orgId - User's organization ID (already validated in validateUserAuth)
   * @returns True if workspace is valid and accessible
   * @throws Error if workspace validation fails
   */
  async validateWorkspaceAccess(workspaceId: string, orgId: string): Promise<boolean> {
    // Use service role for workspace lookup (user already authenticated)
    // This is safe because we're only checking if workspace.org_id == user.orgId
    const supabase = getSupabaseAdmin();

    console.log('[workspace-validation] Validating workspace access:', { workspaceId, orgId });

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, org_id')
      .eq('id', workspaceId)
      .maybeSingle();

    if (workspaceError) {
      console.error('[workspace-validation] Error validating workspace access:', workspaceError);
      throw new Error('Forbidden: Error accessing workspace');
    }

    if (!workspace) {
      console.error('[workspace-validation] Workspace not found:', workspaceId);
      throw new Error('Forbidden: Workspace not found');
    }

    // Verify workspace belongs to user's organization
    if (workspace.org_id !== orgId) {
      console.error('[workspace-validation] Workspace org mismatch:', {
        workspaceOrgId: workspace.org_id,
        userOrgId: orgId,
      });
      throw new Error('Forbidden: Workspace does not belong to your organization');
    }

    console.log('[workspace-validation] Workspace access validated successfully');
    return true;
  }

  /**
   * Validates user authentication and workspace access in one call
   *
   * This is the recommended function for most API endpoints that require
   * workspace-scoped data access.
   *
   * @param req - Next.js request object
   * @param workspaceId - Workspace ID from request (query param or body)
   * @returns User context with validated workspace access
   * @throws Error if authentication or workspace validation fails
   */
  async validateUserAndWorkspace(
    req: NextRequest,
    workspaceId: string
  ): Promise<AuthenticatedUser> {
    const user = await this.validateUserAuth(req);
    await this.validateWorkspaceAccess(workspaceId, user.orgId);

    return {
      ...user,
      workspaceId,
    };
  }

  /**
   * Extracts workspaceId from request (query params or body)
   *
   * @param req - Next.js request object
   * @param body - Optional parsed request body
   * @returns Workspace ID if found
   * @throws Error if workspaceId is missing
   */
  async getWorkspaceIdFromRequest(req: NextRequest, body?: any): Promise<string> {
    // Try query parameter first
    const queryWorkspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (queryWorkspaceId) {
      return queryWorkspaceId;
    }

    // Try request body
    if (body?.workspaceId) {
      return body.workspaceId;
    }

    throw new Error('Bad Request: workspaceId is required');
  }
}

/**
 * Singleton instance of workspace validation service
 * Use this in API routes instead of importing functions
 *
 * Benefits:
 * - Type-safe through IWorkspaceValidationService interface
 * - Testable through dependency injection
 * - Consistent logging and error handling
 *
 * @example
 *   const { user } = await workspaceValidationService.validateUserAuth(req);
 */
export const workspaceValidationService = new WorkspaceValidationService();

/**
 * Legacy function exports for backward compatibility
 * These delegate to the service instance
 *
 * NEW CODE SHOULD USE: workspaceValidationService.methodName()
 * LEGACY CODE CAN STILL USE: validateUserAuth()
 */

export async function validateUserAuth(req: NextRequest): Promise<AuthenticatedUser> {
  return workspaceValidationService.validateUserAuth(req);
}

export async function validateWorkspaceAccess(workspaceId: string, orgId: string): Promise<boolean> {
  return workspaceValidationService.validateWorkspaceAccess(workspaceId, orgId);
}

export async function validateUserAndWorkspace(
  req: NextRequest,
  workspaceId: string
): Promise<AuthenticatedUser> {
  return workspaceValidationService.validateUserAndWorkspace(req, workspaceId);
}

export async function getWorkspaceIdFromRequest(
  req: NextRequest,
  body?: any
): Promise<string> {
  return workspaceValidationService.getWorkspaceIdFromRequest(req, body);
}

/**
 * Error response helpers for consistent error handling
 */
export const WorkspaceErrors = {
  UNAUTHORIZED: {
    error: 'Unauthorized',
    message: 'Authentication required',
    status: 401,
  },
  FORBIDDEN: {
    error: 'Forbidden',
    message: 'Access denied to this workspace',
    status: 403,
  },
  BAD_REQUEST: {
    error: 'Bad Request',
    message: 'workspaceId is required',
    status: 400,
  },
  NOT_FOUND: {
    error: 'Not Found',
    message: 'Resource not found in this workspace',
    status: 404,
  },
} as const;

/**
 * Re-export type for use in other services
 */
export type { AuthenticatedUser } from './types';
