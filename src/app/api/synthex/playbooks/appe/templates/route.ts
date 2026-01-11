/**
 * Synthex APPE Templates API
 *
 * Phase: D39 - Auto-Pilot Playbook Engine (APPE v1)
 *
 * GET - List templates
 * POST - Create playbook from template
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  listTemplates,
  createFromTemplate,
} from "@/lib/synthex/playbookEngineService";

/**
 * GET /api/synthex/playbooks/appe/templates
 * List available templates
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);

    const templates = await listTemplates({
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      is_official: searchParams.get("official") === "true" ? true : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    });

    return NextResponse.json({ success: true, templates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/playbooks/appe/templates
 * Create a playbook from a template
 *
 * Body:
 * - tenantId: tenant ID
 * - templateId: template to use
 * - playbook_name: (optional) custom name
 * - playbook_key: (optional) custom key
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId, templateId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    const playbook = await createFromTemplate(tenantId, templateId, {
      playbook_name: body.playbook_name,
      playbook_key: body.playbook_key,
    });

    return NextResponse.json({
      success: true,
      playbook,
      message: "Playbook created from template",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message.includes("Template not found")) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    console.error("Error creating from template:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
