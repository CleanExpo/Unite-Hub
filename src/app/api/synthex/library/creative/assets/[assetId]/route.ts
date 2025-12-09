/**
 * Synthex Creative Asset Detail API
 * Phase D18: Asset Management
 *
 * GET - Get asset details with feedback
 * PUT - Update asset
 * DELETE - Delete asset
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as creativeService from "@/lib/synthex/creativeService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId } = await params;
    const { searchParams } = new URL(request.url);
    const includeFeedback = searchParams.get("includeFeedback") === "true";

    const asset = await creativeService.getAsset(assetId);

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    let feedback = null;
    if (includeFeedback) {
      feedback = await creativeService.listFeedback(assetId);
    }

    return NextResponse.json({ success: true, asset, feedback });
  } catch (error) {
    console.error("Asset GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId } = await params;
    const body = await request.json();

    const asset = await creativeService.updateAsset(assetId, body);

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error("Asset PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId } = await params;
    await creativeService.deleteAsset(assetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Asset DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
