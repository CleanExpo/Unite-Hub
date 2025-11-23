/**
 * Auth Middleware Utility
 * Phase 16 - Re-enable authentication on all API routes
 *
 * Provides consistent authentication and authorization checks
 * with workspace isolation and admin override support.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseBrowser, getSupabaseServer } from "@/lib/supabase";

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  workspaceId?: string;
  orgId?: string;
  isAdmin?: boolean;
  error?: string;
  status?: number;
}

/**
 * Authenticate a request and extract user/workspace context
 * Supports both Bearer token and cookie-based authentication
 */
export async function authenticateRequest(
  req: NextRequest,
  options?: {
    requireWorkspace?: boolean;
    allowAdmin?: boolean;
  }
): Promise<AuthResult> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    let email: string;
    let isAdmin = false;

    if (token) {
      // Token-based authentication (client-side implicit OAuth)
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return {
          success: false,
          error: "Invalid or expired token",
          status: 401,
        };
      }

      userId = data.user.id;
      email = data.user.email || "";
    } else {
      // Cookie-based authentication (server-side)
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return {
          success: false,
          error: "Unauthorized - No valid session",
          status: 401,
        };
      }

      userId = data.user.id;
      email = data.user.email || "";
    }

    // Check if user is admin (Unite-Group internal)
    const adminEmails = [
      "admin@unite-group.in",
      "contact@unite-group.in",
    ];
    isAdmin = adminEmails.includes(email) || options?.allowAdmin === true;

    // Get workspace from query params or body
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    // Validate workspace if required
    if (options?.requireWorkspace && !workspaceId && !isAdmin) {
      return {
        success: false,
        error: "workspaceId is required",
        status: 400,
      };
    }

    // Verify user has access to workspace (unless admin)
    if (workspaceId && !isAdmin) {
      const supabase = await getSupabaseServer();
      const { data: userOrg, error: orgError } = await supabase
        .from("user_organizations")
        .select("organization_id")
        .eq("user_id", userId)
        .single();

      if (orgError || !userOrg) {
        return {
          success: false,
          error: "User not associated with any organization",
          status: 403,
        };
      }

      // Verify workspace belongs to user's organization
      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .select("org_id")
        .eq("id", workspaceId)
        .single();

      if (wsError || !workspace) {
        return {
          success: false,
          error: "Workspace not found",
          status: 404,
        };
      }

      if (workspace.org_id !== userOrg.organization_id) {
        return {
          success: false,
          error: "Access denied to this workspace",
          status: 403,
        };
      }

      return {
        success: true,
        userId,
        email,
        workspaceId,
        orgId: userOrg.organization_id,
        isAdmin: false,
      };
    }

    // Admin can access all workspaces
    if (isAdmin && workspaceId) {
      const supabase = await getSupabaseServer();
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("org_id")
        .eq("id", workspaceId)
        .single();

      return {
        success: true,
        userId,
        email,
        workspaceId,
        orgId: workspace?.org_id,
        isAdmin: true,
      };
    }

    return {
      success: true,
      userId,
      email,
      isAdmin,
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return {
      success: false,
      error: "Authentication failed",
      status: 500,
    };
  }
}

/**
 * Helper to create error response from AuthResult
 */
export function authErrorResponse(result: AuthResult): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.status || 500 }
  );
}

/**
 * Wrap an API handler with authentication
 */
export function withAuth(
  handler: (
    req: NextRequest,
    auth: AuthResult
  ) => Promise<NextResponse>,
  options?: {
    requireWorkspace?: boolean;
    allowAdmin?: boolean;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const auth = await authenticateRequest(req, options);

    if (!auth.success) {
      return authErrorResponse(auth);
    }

    return handler(req, auth);
  };
}
