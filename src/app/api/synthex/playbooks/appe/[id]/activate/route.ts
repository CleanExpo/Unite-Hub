/**
 * Synthex APPE Playbook Activation API
 *
 * Phase: D39 - Auto-Pilot Playbook Engine (APPE v1)
 *
 * POST - Change playbook status (activate/pause/archive)
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  activatePlaybook,
  pausePlaybook,
  archivePlaybook,
  getPlaybook,
} from "@/lib/synthex/playbookEngineService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/synthex/playbooks/appe/[id]/activate
 * Change playbook status
 *
 * Body:
 * - action: "activate" | "pause" | "archive"
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (!action || !["activate", "pause", "archive"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'activate', 'pause', or 'archive'" },
        { status: 400 }
      );
    }

    const existing = await getPlaybook(id);
    if (!existing) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
    }

    let playbook;
    switch (action) {
      case "activate":
        playbook = await activatePlaybook(id);
        break;
      case "pause":
        playbook = await pausePlaybook(id);
        break;
      case "archive":
        playbook = await archivePlaybook(id);
        break;
    }

    return NextResponse.json({
      success: true,
      playbook,
      message: `Playbook ${action}d successfully`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error changing playbook status:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
