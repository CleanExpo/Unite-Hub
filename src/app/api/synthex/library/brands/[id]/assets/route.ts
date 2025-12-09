/**
 * Synthex Brand Assets API
 * GET - List assets
 * POST - Create asset
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getBrand,
  listAssets,
  createAsset,
} from "@/lib/synthex/multiBrandService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: brandId } = await params;
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("type");
    const status = searchParams.get("status");

    const assets = await listAssets(brandId, {
      asset_type: assetType || undefined,
      status: status || undefined,
    });

    return NextResponse.json({
      success: true,
      assets,
    });
  } catch (error) {
    console.error("[Brand Assets API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list assets" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: brandId } = await params;
    const body = await request.json();

    const brand = await getBrand(brandId);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!body.name || !body.asset_type || !body.file_url) {
      return NextResponse.json(
        { error: "name, asset_type, and file_url are required" },
        { status: 400 }
      );
    }

    const asset = await createAsset(brand.tenant_id, brandId, body, user.id);

    return NextResponse.json({
      success: true,
      asset,
    });
  } catch (error) {
    console.error("[Brand Assets API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create asset" },
      { status: 500 }
    );
  }
}
