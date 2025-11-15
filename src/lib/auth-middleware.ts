/**
 * Authentication and Authorization Middleware for API Routes
 *
 * This module provides middleware functions to protect API routes
 * with authentication and role-based permission checks.
 *
 * @module auth-middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hasPermission, Permission, UserRole } from './permissions';

/**
 * User session data including role information
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  orgId: string;
  organizationName: string;
}

/**
 * Get Supabase server client for API routes
 */
function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Extract user session from request
 * Checks Authorization header for Bearer token
 *
 * @param req - Next.js API request
 * @returns User session or null if not authenticated
 */
export async function getUserSession(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseServer();

    // Verify JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Auth error:', error);
      return null;
    }

    // Get user's organization and role
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select(`
        role,
        org_id,
        organization:organizations!inner(
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (orgError || !userOrg) {
      console.error('Organization fetch error:', orgError);
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: userOrg.role as UserRole,
      orgId: userOrg.org_id,
      organizationName: (userOrg.organization as any).name,
    };
  } catch (error) {
    console.error('Session extraction error:', error);
    return null;
  }
}

/**
 * Require authentication for an API route
 * Returns 401 if not authenticated
 *
 * @param req - Next.js API request
 * @returns Authenticated user or throws 401 error response
 *
 * @example
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const user = await requireAuth(req);
 *   // user is guaranteed to be authenticated
 * }
 * ```
 */
export async function requireAuth(
  req: NextRequest
): Promise<AuthenticatedUser> {
  const user = await getUserSession(req);

  if (!user) {
    throw new Response(
      JSON.stringify({ error: 'Unauthorized - Authentication required' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return user;
}

/**
 * Require specific permission for an API route
 * Returns 401 if not authenticated, 403 if unauthorized
 *
 * @param req - Next.js API request
 * @param permission - Required permission
 * @returns Authenticated user with required permission
 *
 * @example
 * ```typescript
 * export async function DELETE(req: NextRequest) {
 *   const user = await requirePermission(req, 'contact:delete');
 *   // user has contact:delete permission
 * }
 * ```
 */
export async function requirePermission(
  req: NextRequest,
  permission: Permission
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  if (!hasPermission(user.role, permission)) {
    throw new Response(
      JSON.stringify({
        error: 'Forbidden - Insufficient permissions',
        required: permission,
        role: user.role
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return user;
}

/**
 * Require one of multiple permissions (OR logic)
 * User needs at least one of the specified permissions
 *
 * @param req - Next.js API request
 * @param permissions - Array of acceptable permissions
 * @returns Authenticated user with at least one required permission
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const user = await requireAnyPermission(req, ['campaign:create', 'campaign:update']);
 *   // user has either create OR update permission
 * }
 * ```
 */
export async function requireAnyPermission(
  req: NextRequest,
  permissions: Permission[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  const hasAny = permissions.some(permission =>
    hasPermission(user.role, permission)
  );

  if (!hasAny) {
    throw new Response(
      JSON.stringify({
        error: 'Forbidden - Insufficient permissions',
        required_any: permissions,
        role: user.role
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return user;
}

/**
 * Require all of multiple permissions (AND logic)
 * User needs all of the specified permissions
 *
 * @param req - Next.js API request
 * @param permissions - Array of required permissions
 * @returns Authenticated user with all required permissions
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const user = await requireAllPermissions(req, ['campaign:create', 'contact:view']);
 *   // user has both permissions
 * }
 * ```
 */
export async function requireAllPermissions(
  req: NextRequest,
  permissions: Permission[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  const hasAll = permissions.every(permission =>
    hasPermission(user.role, permission)
  );

  if (!hasAll) {
    throw new Response(
      JSON.stringify({
        error: 'Forbidden - Insufficient permissions',
        required_all: permissions,
        role: user.role
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return user;
}

/**
 * Require owner role (highest privilege)
 * Returns 403 if user is not an owner
 *
 * @param req - Next.js API request
 * @returns Authenticated owner user
 *
 * @example
 * ```typescript
 * export async function DELETE(req: NextRequest) {
 *   const user = await requireOwner(req);
 *   // user is organization owner
 * }
 * ```
 */
export async function requireOwner(
  req: NextRequest
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  if (user.role !== 'owner') {
    throw new Response(
      JSON.stringify({
        error: 'Forbidden - Owner access required',
        role: user.role
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return user;
}

/**
 * Require admin or owner role
 * Returns 403 if user is not admin or owner
 *
 * @param req - Next.js API request
 * @returns Authenticated admin/owner user
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const user = await requireAdminOrOwner(req);
 *   // user is admin or owner
 * }
 * ```
 */
export async function requireAdminOrOwner(
  req: NextRequest
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);

  if (user.role !== 'owner' && user.role !== 'admin') {
    throw new Response(
      JSON.stringify({
        error: 'Forbidden - Admin or Owner access required',
        role: user.role
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return user;
}

/**
 * Audit log entry for permission checks
 */
export async function logPermissionCheck(
  user: AuthenticatedUser,
  permission: Permission,
  granted: boolean,
  resource?: string,
  resourceId?: string
) {
  try {
    const supabase = getSupabaseServer();

    await supabase.from('audit_logs').insert({
      org_id: user.orgId,
      action: granted ? 'permission_granted' : 'permission_denied',
      resource: resource || 'api_route',
      resource_id: resourceId,
      agent: 'auth_middleware',
      status: granted ? 'success' : 'warning',
      details: {
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        permission,
        granted,
      }
    });
  } catch (error) {
    console.error('Failed to log permission check:', error);
  }
}

/**
 * Middleware wrapper for API routes with permission checking
 * Handles errors and returns proper HTTP responses
 *
 * @param handler - API route handler function
 * @param permission - Required permission (optional)
 * @returns Wrapped handler with authentication/authorization
 *
 * @example
 * ```typescript
 * export const GET = withAuth(async (req, user) => {
 *   // user is authenticated
 *   return NextResponse.json({ data: '...' });
 * });
 *
 * export const DELETE = withAuth(async (req, user) => {
 *   // user has contact:delete permission
 *   return NextResponse.json({ success: true });
 * }, 'contact:delete');
 * ```
 */
export function withAuth(
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<Response>,
  permission?: Permission
) {
  return async (req: NextRequest) => {
    try {
      let user: AuthenticatedUser;

      if (permission) {
        user = await requirePermission(req, permission);
      } else {
        user = await requireAuth(req);
      }

      return await handler(req, user);
    } catch (error) {
      // If error is already a Response, return it
      if (error instanceof Response) {
        return error;
      }

      // Handle unexpected errors
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if request is from same organization
 * Validates that requested resource belongs to user's organization
 *
 * @param user - Authenticated user
 * @param resourceOrgId - Organization ID of the resource
 * @returns true if authorized, throws 403 if not
 */
export function requireSameOrganization(
  user: AuthenticatedUser,
  resourceOrgId: string
): void {
  if (user.orgId !== resourceOrgId) {
    throw new Response(
      JSON.stringify({
        error: 'Forbidden - Resource belongs to different organization'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
