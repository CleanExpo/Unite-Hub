/**
 * Synthex APPE Playbooks API
 *
 * Phase: D39 - Auto-Pilot Playbook Engine (APPE v1)
 *
 * POST - Create playbook
 * GET - List playbooks
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createPlaybook,
  listPlaybooks,
  getStats,
  type APPEPlaybookStatus,
  type APPETriggerType,
} from "@/lib/synthex/playbookEngineService";

/**
 * POST /api/synthex/playbooks/appe
 * Create a new APPE playbook
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!body.playbook_key || !body.playbook_name) {
      return NextResponse.json(
        { error: "playbook_key and playbook_name are required" },
        { status: 400 }
      );
    }

    const playbook = await createPlaybook(tenantId, {
      playbook_key: body.playbook_key,
      playbook_name: body.playbook_name,
      playbook_description: body.playbook_description,
      trigger_type: body.trigger_type,
      trigger_config: body.trigger_config,
      schedule_cron: body.schedule_cron,
      schedule_timezone: body.schedule_timezone,
      ai_enabled: body.ai_enabled,
      ai_decision_model: body.ai_decision_model,
      ai_confidence_threshold: body.ai_confidence_threshold,
      tags: body.tags,
      category: body.category,
      priority: body.priority,
    });

    return NextResponse.json({ success: true, playbook });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating APPE playbook:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/synthex/playbooks/appe?tenantId=xxx
 * List APPE playbooks with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Include stats if requested
    if (searchParams.get("includeStats") === "true") {
      const [playbooks, stats] = await Promise.all([
        listPlaybooks(tenantId, {
          status: searchParams.get("status") as APPEPlaybookStatus | undefined,
          trigger_type: searchParams.get("trigger") as APPETriggerType | undefined,
          category: searchParams.get("category") || undefined,
          search: searchParams.get("search") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
        }),
        getStats(tenantId),
      ]);

      return NextResponse.json({ success: true, playbooks, stats });
    }

    const playbooks = await listPlaybooks(tenantId, {
      status: searchParams.get("status") as APPEPlaybookStatus | undefined,
      trigger_type: searchParams.get("trigger") as APPETriggerType | undefined,
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    });

    return NextResponse.json({ success: true, playbooks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching APPE playbooks:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
