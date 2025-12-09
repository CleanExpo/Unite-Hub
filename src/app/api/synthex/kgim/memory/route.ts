/**
 * Synthex KGIM Memory API
 *
 * Phase: D38 - Knowledge Graph + Insight Memory (KGIM)
 *
 * POST - Store memory
 * GET - List memories
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import { storeMemory, listMemories } from "@/lib/synthex/kgimService";

/**
 * POST /api/synthex/kgim/memory
 * Store a new memory
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!body.memory_key || !body.content) {
      return NextResponse.json(
        { error: "memory_key and content are required" },
        { status: 400 }
      );
    }

    const memory = await storeMemory(tenantId, {
      memory_key: body.memory_key,
      memory_type: body.memory_type,
      insight_id: body.insight_id,
      content: body.content,
      summary: body.summary,
      importance: body.importance,
    });

    return NextResponse.json({ success: true, memory });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error storing memory:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/synthex/kgim/memory?tenantId=xxx
 * List memories with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
return rateLimitResult;
}

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const memories = await listMemories(tenantId, {
      memory_type: searchParams.get("type") || undefined,
      min_importance: searchParams.get("minImportance")
        ? parseFloat(searchParams.get("minImportance")!)
        : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    });

    return NextResponse.json({ success: true, memories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching memories:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
