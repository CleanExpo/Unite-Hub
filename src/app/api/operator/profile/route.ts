/**
 * Operator Profile API - Phase 10 Week 1-2
 *
 * GET /api/operator/profile - Get operator profile
 * POST /api/operator/profile - Create operator profile
 * PATCH /api/operator/profile - Update operator profile
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { operatorRoleService } from "@/lib/operator/operatorRoleService";
import { z } from "zod";

const CreateOperatorSchema = z.object({
  user_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  role: z.enum(["OWNER", "MANAGER", "ANALYST"]),
  allowed_domains: z.array(z.enum(["SEO", "CONTENT", "ADS", "CRO"])).optional(),
});

const UpdateOperatorSchema = z.object({
  operator_id: z.string().uuid(),
  role: z.enum(["OWNER", "MANAGER", "ANALYST"]).optional(),
  allowed_domains: z.array(z.enum(["SEO", "CONTENT", "ADS", "CRO"])).optional(),
  is_active: z.boolean().optional(),
  notify_on_proposal: z.boolean().optional(),
  notify_on_approval_needed: z.boolean().optional(),
  notify_on_execution: z.boolean().optional(),
  notify_on_rollback: z.boolean().optional(),
  notify_email: z.boolean().optional(),
  notify_in_app: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Get query params
    const organizationId = req.nextUrl.searchParams.get("organization_id");
    const listAll = req.nextUrl.searchParams.get("list_all") === "true";

    if (!organizationId) {
      return NextResponse.json(
        { error: "organization_id is required" },
        { status: 400 }
      );
    }

    if (listAll) {
      // Check if user can manage operators
      const canManage = await operatorRoleService.canManageOperators(
        userId,
        organizationId
      );

      if (!canManage.allowed) {
        return NextResponse.json(
          { error: canManage.reason },
          { status: 403 }
        );
      }

      const operators = await operatorRoleService.getOrganizationOperators(
        organizationId
      );

      return NextResponse.json({
        operators,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get own profile
      const operator = await operatorRoleService.getOperator(
        userId,
        organizationId
      );

      if (!operator) {
        return NextResponse.json(
          { error: "Operator profile not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        operator,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Parse request
    const body = await req.json();
    const parsed = CreateOperatorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    // Check if user can manage operators
    const canManage = await operatorRoleService.canManageOperators(
      userId,
      parsed.data.organization_id
    );

    if (!canManage.allowed) {
      return NextResponse.json(
        { error: canManage.reason || "Cannot manage operators" },
        { status: 403 }
      );
    }

    // Create operator
    const operator = await operatorRoleService.createOperator({
      user_id: parsed.data.user_id,
      organization_id: parsed.data.organization_id,
      role: parsed.data.role,
      allowed_domains: parsed.data.allowed_domains,
    });

    return NextResponse.json({
      operator,
      message: "Operator created successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Create operator error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Parse request
    const body = await req.json();
    const parsed = UpdateOperatorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { operator_id, role, ...updates } = parsed.data;

    // If updating role, use updateRole method
    let operator;
    if (role) {
      operator = await operatorRoleService.updateRole(operator_id, role);
    }

    // Apply other updates
    if (Object.keys(updates).length > 0) {
      operator = await operatorRoleService.updateOperator(operator_id, updates);
    }

    return NextResponse.json({
      operator,
      message: "Operator updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Update operator error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
