/**
 * /api/admin/rbac
 *
 * RBAC management (Phase E13)
 * GET: List roles, permissions, assignments
 * POST: Seed default roles or assign role
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  listRoles,
  listPermissions,
  listRoleAssignments,
  seedDefaultRoles,
  assignUserRole,
  getUserPermissionsSummary,
} from "@/lib/core/rbacService";
import { hasPermission } from "@/lib/core/permissionService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action"); // 'roles', 'permissions', 'assignments', 'user-summary'
    const userId = searchParams.get("userId"); // for user-summary action
    const category = searchParams.get("category"); // for permissions filtering

    // Check permission (settings.view or owner role)
    if (workspaceId) {
      const canView = await hasPermission(user.id, workspaceId, "settings", "read");
      if (!canView) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    // Handle different actions
    if (action === "roles") {
      const roles = await listRoles(workspaceId || undefined);
      return NextResponse.json({ roles });
    }

    if (action === "permissions") {
      const permissions = await listPermissions(category || undefined);
      return NextResponse.json({ permissions });
    }

    if (action === "assignments" && workspaceId) {
      const assignments = await listRoleAssignments(workspaceId);
      return NextResponse.json({ assignments });
    }

    if (action === "user-summary" && workspaceId && userId) {
      const summary = await getUserPermissionsSummary(workspaceId, userId);
      return NextResponse.json({ summary });
    }

    // Default: return all
    const roles = await listRoles(workspaceId || undefined);
    const permissions = await listPermissions();
    const assignments = workspaceId
      ? await listRoleAssignments(workspaceId)
      : [];

    return NextResponse.json({
      roles,
      permissions,
      assignments,
      total: {
        roles: roles.length,
        permissions: permissions.length,
        assignments: assignments.length,
      },
    });
  } catch (error: any) {
    console.error("[API] /admin/rbac GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, action, userId, roleKey, expiresAt } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Check permission (settings.write or owner role)
    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle seed action
    if (action === "seed") {
      const success = await seedDefaultRoles(workspaceId, user.id);
      return NextResponse.json({
        success,
        message: success ? "Default roles seeded" : "Failed to seed roles",
      });
    }

    // Handle assign action
    if (action === "assign") {
      if (!userId || !roleKey) {
        return NextResponse.json(
          { error: "userId and roleKey required for assign action" },
          { status: 400 }
        );
      }

      const assignmentId = await assignUserRole(
        workspaceId,
        userId,
        roleKey,
        user.id,
        expiresAt ? new Date(expiresAt) : undefined
      );

      if (!assignmentId) {
        return NextResponse.json(
          { error: "Failed to assign role" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        assignment_id: assignmentId,
        message: `Role ${roleKey} assigned to user ${userId}`,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'seed' or 'assign'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /admin/rbac POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
