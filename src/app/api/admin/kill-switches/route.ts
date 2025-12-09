/**
 * /api/admin/kill-switches
 *
 * Kill-Switch Controls (Phase E18)
 * GET: List kill-switches and get statistics
 * POST: Enable/disable kill-switches or set overrides
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  isKillSwitchEnabled,
  enableKillSwitch,
  disableKillSwitch,
  setKillSwitchOverride,
  listKillSwitches,
  listKillSwitchOverrides,
  getHighRiskKillSwitches,
  getKillSwitchStats,
  type KillSwitchCategory,
} from "@/lib/core/killSwitchService";
import { hasPermission } from "@/lib/core/permissionService";
import { recordAuditEvent, extractRequestMetadata } from "@/lib/core/auditService";

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
    const action = searchParams.get("action"); // 'list', 'check', 'high-risk', 'stats', 'overrides'
    const flagKey = searchParams.get("flagKey");
    const category = searchParams.get("category") as KillSwitchCategory | null;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Check permission (settings.read or owner role)
    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle different actions
    if (action === "check") {
      if (!flagKey) {
        return NextResponse.json(
          { error: "flagKey required for 'check' action" },
          { status: 400 }
        );
      }

      const enabled = await isKillSwitchEnabled(workspaceId, flagKey);
      return NextResponse.json({ flagKey, enabled });
    }

    if (action === "high-risk") {
      const switches = await getHighRiskKillSwitches();
      return NextResponse.json({ switches });
    }

    if (action === "stats") {
      const stats = await getKillSwitchStats(workspaceId);
      return NextResponse.json({ stats });
    }

    if (action === "overrides") {
      const overrides = await listKillSwitchOverrides(workspaceId);
      return NextResponse.json({ overrides });
    }

    // Default: list kill-switches
    const switches = await listKillSwitches(workspaceId, category || undefined);

    return NextResponse.json({
      switches,
      total: switches.length,
    });
  } catch (error: any) {
    console.error("[API] /admin/kill-switches GET error:", error);
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
    const { workspaceId, action, flagKey, enabled, reason, expiresAt } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    if (!flagKey) {
      return NextResponse.json(
        { error: "flagKey required" },
        { status: 400 }
      );
    }

    // Check permission (settings.write or owner role)
    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle enable
    if (action === "enable") {
      await enableKillSwitch(workspaceId, flagKey, reason);

      // Record audit event
      const { ipAddress, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "feature_flag.changed",
        resource: "kill_switch",
        resourceId: flagKey,
        action: `Enabled kill-switch '${flagKey}'`,
        metadata: { enabled: true, reason },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: `Kill-switch '${flagKey}' enabled successfully`,
      });
    }

    // Handle disable (KILL-SWITCH ACTIVATION)
    if (action === "disable") {
      await disableKillSwitch(workspaceId, flagKey, reason);

      // Record audit event
      const { ipAddress, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "feature_flag.changed",
        resource: "kill_switch",
        resourceId: flagKey,
        action: `DISABLED kill-switch '${flagKey}' (KILL-SWITCH ACTIVATED)`,
        metadata: { enabled: false, reason, severity: "high" },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: `Kill-switch '${flagKey}' DISABLED (feature turned off)`,
      });
    }

    // Handle override
    if (action === "override") {
      if (enabled === undefined) {
        return NextResponse.json(
          { error: "enabled (boolean) required for override action" },
          { status: 400 }
        );
      }

      const overrideId = await setKillSwitchOverride({
        tenantId: workspaceId,
        flagKey,
        enabled: enabled as boolean,
        reason,
        createdBy: user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      // Record audit event
      const { ipAddress, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "feature_flag.changed",
        resource: "kill_switch_override",
        resourceId: overrideId,
        action: `Set override for '${flagKey}': ${enabled ? "enabled" : "disabled"}`,
        metadata: { flagKey, enabled, reason, expiresAt },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        overrideId,
        message: "Override set successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'enable', 'disable', or 'override'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /admin/kill-switches POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
