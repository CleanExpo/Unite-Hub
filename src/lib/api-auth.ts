/**
 * Unified API Authentication Middleware
 *
 * This module provides consistent authentication and authorization
 * across all API routes in Unite-Hub.
 *
 * Usage:
 * ```typescript
 * import { requireAuth, requireWorkspace } from '@/lib/api-auth';
 *
 * export async function POST(req: NextRequest) {
 *   const { user, supabase } = await requireAuth(req);
 *   // ... your logic
 * }
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "./supabase";
import type { User } from "@supabase/supabase-js";

export interface AuthContext {
  user: User;
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>;
  orgId: string;
}

export interface WorkspaceContext extends AuthContext {
  workspaceId: string;
}

/**
 * Validates that the user is authenticated.
 * Returns user and supabase client, or throws AuthError.
 */
export async function requireAuth(
  req: NextRequest
): Promise<AuthContext> {
  const supabase = await getSupabaseServer();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[requireAuth] Authentication error:", {
      message: authError.message,
      status: authError.status,
      url: req.url,
    });
    throw new AuthError("Authentication failed", 401, authError.message);
  }

  if (!user) {
    console.error("[requireAuth] No user found:", {
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });
    throw new AuthError("Unauthorized - no user session", 401);
  }

  // Get user's active organization
  const { data: userOrg, error: orgError } = await supabase
    .from("user_organizations")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (orgError || !userOrg) {
    console.error("[requireAuth] No active organization:", {
      userId: user.id,
      error: orgError?.message,
      url: req.url,
    });
    throw new AuthError("No active organization found", 403);
  }

  return {
    user,
    supabase,
    orgId: userOrg.org_id,
  };
}

/**
 * Validates that the user has access to a specific workspace.
 * Extracts workspaceId from request body or query params.
 */
export async function requireWorkspace(
  req: NextRequest,
  workspaceId?: string
): Promise<WorkspaceContext> {
  const authContext = await requireAuth(req);

  // Try to get workspaceId from multiple sources
  let wid = workspaceId;

  if (!wid) {
    // Try from request body
    try {
      const body = await req.json();
      wid = body.workspaceId || body.workspace_id;
    } catch {
      // Not JSON or already consumed
    }
  }

  if (!wid) {
    // Try from query params
    const url = new URL(req.url);
    wid = url.searchParams.get("workspaceId") || url.searchParams.get("workspace_id") || undefined;
  }

  if (!wid) {
    console.error("[requireWorkspace] No workspace ID provided:", {
      url: req.url,
      userId: authContext.user.id,
    });
    throw new AuthError("Workspace ID is required", 400);
  }

  // Validate workspace belongs to user's organization
  const { data: workspace, error: workspaceError } = await authContext.supabase
    .from("workspaces")
    .select("id, org_id, name")
    .eq("id", wid)
    .eq("org_id", authContext.orgId)
    .single();

  if (workspaceError || !workspace) {
    console.error("[requireWorkspace] Workspace access denied:", {
      workspaceId: wid,
      orgId: authContext.orgId,
      userId: authContext.user.id,
      error: workspaceError?.message,
    });
    throw new AuthError("Invalid workspace or access denied", 403);
  }

  return {
    ...authContext,
    workspaceId: workspace.id,
  };
}

/**
 * Custom error class for authentication failures
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public details?: string
  ) {
    super(message);
    this.name = "AuthError";
  }

  toResponse(): NextResponse {
    return NextResponse.json(
      {
        error: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
      { status: this.statusCode }
    );
  }
}

/**
 * Wraps an API route handler with authentication
 */
export function withAuth<T = any>(
  handler: (req: NextRequest, context: AuthContext, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse<T>> => {
    try {
      const authContext = await requireAuth(req);
      return await handler(req, authContext, ...args);
    } catch (error) {
      if (error instanceof AuthError) {
        return error.toResponse() as NextResponse<T>;
      }
      console.error("[withAuth] Unexpected error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ) as NextResponse<T>;
    }
  };
}

/**
 * Wraps an API route handler with workspace authentication
 */
export function withWorkspace<T = any>(
  handler: (req: NextRequest, context: WorkspaceContext, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse<T>> => {
    try {
      const workspaceContext = await requireWorkspace(req);
      return await handler(req, workspaceContext, ...args);
    } catch (error) {
      if (error instanceof AuthError) {
        return error.toResponse() as NextResponse<T>;
      }
      console.error("[withWorkspace] Unexpected error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ) as NextResponse<T>;
    }
  };
}

/**
 * Helper to validate contact belongs to workspace
 */
export async function validateContactAccess(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  contactId: string,
  workspaceId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    console.error("[validateContactAccess] Contact not found or access denied:", {
      contactId,
      workspaceId,
      error: error?.message,
    });
    return false;
  }

  return true;
}

/**
 * Helper to validate campaign belongs to workspace
 */
export async function validateCampaignAccess(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  campaignId: string,
  workspaceId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) {
    console.error("[validateCampaignAccess] Campaign not found or access denied:", {
      campaignId,
      workspaceId,
      error: error?.message,
    });
    return false;
  }

  return true;
}
