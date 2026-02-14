/**
 * GET /api/agent/workforce
 * Returns workforce engine status: agents, skills, hooks, memory
 * Rate limited: 20 requests/minute
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import {
  isWorkforceInitialized,
  ensureWorkforceReady,
  hookSystem,
  skillLoader,
  lifecycleManager,
  workforceRegistry,
} from "@/lib/agents/workforce";

export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get auth header
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

    // Get workspace ID
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    const supabase = await getSupabaseServer();
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("org_id")
      .eq("id", workspaceId)
      .maybeSingle();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Verify user is owner
    const { data: userOrg, error: orgError } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", userId)
      .eq("org_id", workspace.org_id)
      .maybeSingle();

    if (orgError || !userOrg || userOrg.role !== "owner") {
      return NextResponse.json(
        { error: "Only workspace owners can view workforce status" },
        { status: 403 }
      );
    }

    // Check if initialized, lazy-init if needed
    const wasInitialized = isWorkforceInitialized();
    let initResult = null;
    try {
      initResult = await ensureWorkforceReady(workspaceId);
    } catch (initError) {
      return NextResponse.json({
        success: true,
        initialized: false,
        error: initError instanceof Error ? initError.message : "Initialization failed",
      });
    }

    // Gather workforce status
    const hooks = hookSystem.listHooks();
    const activeInstances = lifecycleManager.getActiveInstances();
    const countsByState = lifecycleManager.getCountsByState();
    let registryStatus = null;
    try {
      registryStatus = workforceRegistry.getStatus();
    } catch {
      // Registry may not have full status yet
    }

    return NextResponse.json({
      success: true,
      initialized: true,
      wasAlreadyInitialized: wasInitialized,
      engine: {
        protocol: initResult?.protocol
          ? {
              valid: initResult.protocol.valid,
              agentCount: initResult.protocol.agentCount,
              issues: initResult.protocol.issues?.length || 0,
            }
          : null,
        skills: {
          indexed: initResult?.skillsIndexed || skillLoader.skillCount,
        },
        hooks: {
          registered: initResult?.hooksRegistered || hooks.length,
          byPhase: hooks.reduce((acc, h) => {
            acc[h.phase] = (acc[h.phase] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          list: hooks.map((h) => ({
            id: h.id,
            name: h.name,
            phase: h.phase,
            enabled: h.enabled,
            priority: h.priority,
          })),
        },
        agents: {
          spawned: lifecycleManager.instanceCount,
          countsByState,
          list: activeInstances.map((a) => ({
            id: a.card.id,
            name: a.card.name,
            state: a.card.currentState,
            spawnedAt: a.spawnedAt,
            lastHeartbeat: a.lastHeartbeat,
            activeTasks: a.activeTasks.size,
            loadedSkills: a.loadedSkills,
          })),
        },
        registry: registryStatus,
      },
      initializedAt: initResult?.initializedAt,
    });
  } catch (error) {
    console.error("Error in GET /api/agent/workforce:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
