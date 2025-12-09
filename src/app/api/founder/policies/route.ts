/**
 * /api/founder/policies
 *
 * Policy Engine API (Phase E24)
 * GET: List policies, get single policy, statistics, list triggers
 * POST: Create policy, trigger policy, evaluate policies
 * PATCH: Update policy
 * DELETE: Delete policy
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  createPolicy,
  listPolicies,
  getPolicy,
  updatePolicy,
  deletePolicy,
  triggerPolicy,
  checkPolicyCooldown,
  listPolicyTriggers,
  getPolicyStatistics,
  evaluateAndTriggerPolicies,
  type PolicyStatus,
  type PolicyTriggerType,
  type PolicyActionType,
} from "@/lib/founder/policyEngine";
import { hasPermission } from "@/lib/core/permissionService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");
    const policyId = searchParams.get("policyId");
    const status = searchParams.get("status") as PolicyStatus | null;
    const triggerType = searchParams.get("triggerType") as PolicyTriggerType | null;
    const success = searchParams.get("success");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "get-policy") {
      if (!policyId) {
        return NextResponse.json({ error: "policyId required" }, { status: 400 });
      }
      const policy = await getPolicy(policyId, workspaceId);
      if (!policy) {
        return NextResponse.json({ error: "Policy not found" }, { status: 404 });
      }
      return NextResponse.json({ policy });
    }

    if (action === "statistics") {
      const stats = await getPolicyStatistics(workspaceId);
      return NextResponse.json({ statistics: stats });
    }

    if (action === "triggers") {
      const triggers = await listPolicyTriggers(
        workspaceId,
        policyId || undefined,
        success !== null ? success === "true" : undefined,
        100
      );
      return NextResponse.json({ triggers, total: triggers.length });
    }

    if (action === "check-cooldown") {
      if (!policyId) {
        return NextResponse.json({ error: "policyId required" }, { status: 400 });
      }
      const cooldownOk = await checkPolicyCooldown(policyId);
      return NextResponse.json({ cooldownOk });
    }

    // Default: list policies
    const policies = await listPolicies(
      workspaceId,
      status || undefined,
      triggerType || undefined
    );
    return NextResponse.json({ policies, total: policies.length });
  } catch (error: any) {
    console.error("[API] /founder/policies GET error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, action } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "create-policy") {
      const {
        name,
        description,
        status,
        triggerType,
        triggerConditions,
        actionType,
        actionConfig,
        priority,
        cooldownSeconds,
        metadata,
      } = body;

      if (!name || !triggerType || !actionType) {
        return NextResponse.json(
          { error: "Missing required fields: name, triggerType, actionType" },
          { status: 400 }
        );
      }

      const policyId = await createPolicy({
        tenantId: workspaceId,
        name,
        description,
        status,
        triggerType,
        triggerConditions,
        actionType,
        actionConfig,
        priority,
        cooldownSeconds,
        metadata,
      });

      return NextResponse.json({ success: true, policyId, message: "Policy created" });
    }

    if (action === "trigger-policy") {
      const { policyId, triggeredBy, triggerData } = body;

      if (!policyId) {
        return NextResponse.json({ error: "policyId required" }, { status: 400 });
      }

      const triggerId = await triggerPolicy(
        policyId,
        workspaceId,
        triggeredBy || user.id,
        triggerData
      );

      return NextResponse.json({ success: true, triggerId, message: "Policy triggered" });
    }

    if (action === "evaluate-policies") {
      const { triggerType, triggerData, triggeredBy } = body;

      if (!triggerType) {
        return NextResponse.json({ error: "triggerType required" }, { status: 400 });
      }

      const triggeredPolicyIds = await evaluateAndTriggerPolicies(
        workspaceId,
        triggerType,
        triggerData || {},
        triggeredBy || user.id
      );

      return NextResponse.json({
        success: true,
        triggeredPolicyIds,
        message: `${triggeredPolicyIds.length} policies triggered`,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: create-policy, trigger-policy, evaluate-policies" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /founder/policies POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      workspaceId,
      policyId,
      name,
      description,
      status,
      triggerConditions,
      actionConfig,
      priority,
      cooldownSeconds,
      metadata,
    } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (!policyId) {
      return NextResponse.json({ error: "policyId required" }, { status: 400 });
    }

    await updatePolicy(policyId, workspaceId, {
      name,
      description,
      status,
      triggerConditions,
      actionConfig,
      priority,
      cooldownSeconds,
      metadata,
    });

    return NextResponse.json({ success: true, message: "Policy updated" });
  } catch (error: any) {
    console.error("[API] /founder/policies PATCH error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const policyId = searchParams.get("policyId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (!policyId) {
      return NextResponse.json({ error: "policyId required" }, { status: 400 });
    }

    await deletePolicy(policyId, workspaceId);

    return NextResponse.json({ success: true, message: "Policy deleted" });
  } catch (error: any) {
    console.error("[API] /founder/policies DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
