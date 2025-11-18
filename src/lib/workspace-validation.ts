/**
 * Workspace Validation Utilities
 *
 * Provides secure workspace isolation for all API endpoints.
 * CRITICAL: All database queries MUST be scoped to the user's workspace.
 */

import { NextRequest } from "next/server";
import { getSupabaseServer } from "./supabase";

/**
 * User authentication result with workspace context
 */
export interface AuthenticatedUser {
  userId: string;
  orgId: string;
  workspaceId?: string;
}

/**
 * Validates user authentication and returns user context
 *
 * Supports both:
 * - Implicit OAuth flow (Bearer token in Authorization header)
 * - PKCE flow (session cookies)
 *
 * @param req - Next.js request object
 * @returns User context with userId and orgId
 * @throws Error if authentication fails
 */
export async function validateUserAuth(req: NextRequest): Promise<AuthenticatedUser> {
  // Try to get token from Authorization header (client-side requests with implicit OAuth)
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  let userId: string;

  if (token) {
    // Use browser client with token for implicit OAuth flow
    const { supabaseBrowser } = await import("@/lib/supabase");
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      throw new Error("Unauthorized: Invalid token");
    }

    userId = data.user.id;
  } else {
    // Try server-side cookies (PKCE flow or server-side auth)
    const supabase = await getSupabaseServer();
    const { data, error: authError } = await supabase.auth.getUser();

    if (authError || !data.user) {
      throw new Error("Unauthorized: No valid session");
    }

    userId = data.user.id;
  }

  // Get user's organization (using authenticated user's supabase client)
  // Note: We don't filter by is_active since all org memberships should be accessible
  const supabase = await getSupabaseServer();
  const { data: userOrg, error: orgError } = await supabase
    .from("user_organizations")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle(); // Get first org if multiple exist

  if (orgError) {
    console.error("[workspace-validation] Error fetching user organization:", orgError);
    throw new Error("Forbidden: Error accessing organization");
  }

  if (!userOrg) {
    console.error("[workspace-validation] No organization found for userId:", userId);
    console.error("[workspace-validation] This usually means the user hasn't been properly initialized");
    throw new Error("Forbidden: No organization found for user");
  }

  console.log("[workspace-validation] User authenticated successfully:", {
    userId,
    orgId: userOrg.org_id
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
 * @param workspaceId - Workspace ID to validate
 * @param orgId - User's organization ID
 * @returns True if workspace is valid and accessible
 * @throws Error if workspace validation fails
 */
export async function validateWorkspaceAccess(
  workspaceId: string,
  orgId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("org_id", orgId)
    .maybeSingle(); // ← Changed from .single() to .maybeSingle() for graceful handling

  if (workspaceError) {
    console.error("[workspace-validation] Error validating workspace access:", workspaceError);
    throw new Error("Forbidden: Error accessing workspace");
  }

  if (!workspace) {
    throw new Error("Forbidden: Invalid workspace or access denied");
  }

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
export async function validateUserAndWorkspace(
  req: NextRequest,
  workspaceId: string
): Promise<AuthenticatedUser> {
  const user = await validateUserAuth(req);
  await validateWorkspaceAccess(workspaceId, user.orgId);

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
export async function getWorkspaceIdFromRequest(
  req: NextRequest,
  body?: any
): Promise<string> {
  // Try query parameter first
  const queryWorkspaceId = req.nextUrl.searchParams.get("workspaceId");

  if (queryWorkspaceId) {
    return queryWorkspaceId;
  }

  // Try request body
  if (body?.workspaceId) {
    return body.workspaceId;
  }

  throw new Error("Bad Request: workspaceId is required");
}

/**
 * Error response helpers for consistent error handling
 */
export const WorkspaceErrors = {
  UNAUTHORIZED: {
    error: "Unauthorized",
    message: "Authentication required",
    status: 401,
  },
  FORBIDDEN: {
    error: "Forbidden",
    message: "Access denied to this workspace",
    status: 403,
  },
  BAD_REQUEST: {
    error: "Bad Request",
    message: "workspaceId is required",
    status: 400,
  },
  NOT_FOUND: {
    error: "Not Found",
    message: "Resource not found in this workspace",
    status: 404,
  },
} as const;
