/**
 * Synthex Creative Brief Detail API
 * Phase D18: Brief Management
 *
 * GET - Get brief details
 * PUT - Update brief
 * DELETE - Delete brief
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as creativeService from "@/lib/synthex/creativeService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ briefId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { briefId } = await params;
    const brief = await creativeService.getBrief(briefId);

    if (!brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, brief });
  } catch (error) {
    console.error("Brief GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ briefId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { briefId } = await params;
    const body = await request.json();

    const brief = await creativeService.updateBrief(briefId, body);

    return NextResponse.json({ success: true, brief });
  } catch (error) {
    console.error("Brief PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ briefId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { briefId } = await params;
    await creativeService.deleteBrief(briefId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Brief DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
