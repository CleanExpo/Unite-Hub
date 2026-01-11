/**
 * Synthex Sync Rules API
 * GET - List sync rules
 * POST - Create sync rule
 * PUT - Update sync rule
 * DELETE - Delete sync rule
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listSyncRules,
  createSyncRule,
  updateSyncRule,
  deleteSyncRule,
} from "@/lib/synthex/crossChannelService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const filters = {
      source_channel: searchParams.get("source_channel") || undefined,
      target_channel: searchParams.get("target_channel") || undefined,
      is_active: searchParams.get("is_active") === "true" ? true : undefined,
    };

    const rules = await listSyncRules(tenantId, filters);

    return NextResponse.json({
      success: true,
      rules,
    });
  } catch (error) {
    console.error("[Sync Rules API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, ...ruleData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!ruleData.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const rule = await createSyncRule(tenantId, ruleData, user.id);

    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error) {
    console.error("[Sync Rules API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create rule" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ruleId, ...updates } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: "ruleId is required" },
        { status: 400 }
      );
    }

    const rule = await updateSyncRule(ruleId, updates);

    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error) {
    console.error("[Sync Rules API] PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get("ruleId");

    if (!ruleId) {
      return NextResponse.json(
        { error: "ruleId is required" },
        { status: 400 }
      );
    }

    await deleteSyncRule(ruleId);

    return NextResponse.json({
      success: true,
      deleted: true,
    });
  } catch (error) {
    console.error("[Sync Rules API] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete rule" },
      { status: 500 }
    );
  }
}
