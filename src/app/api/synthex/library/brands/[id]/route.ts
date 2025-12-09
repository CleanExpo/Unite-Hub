/**
 * Synthex Brand Profile by ID API
 * GET - Get brand
 * PUT - Update brand
 * DELETE - Delete brand
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getBrand,
  updateBrand,
  deleteBrand,
  setDefaultBrand,
  duplicateBrand,
  getBrandContextForAI,
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeContext = searchParams.get("includeContext") === "true";

    const brand = await getBrand(id);

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const response: {
      success: boolean;
      brand: typeof brand;
      context?: Awaited<ReturnType<typeof getBrandContextForAI>>;
    } = {
      success: true,
      brand,
    };

    if (includeContext) {
      response.context = await getBrandContextForAI(id);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Brands API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get brand" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { id } = await params;
    const body = await request.json();
    const { action, ...updateData } = body;

    const brand = await getBrand(id);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Set as default
    if (action === "set_default") {
      await setDefaultBrand(brand.tenant_id, id);
      const updated = await getBrand(id);
      return NextResponse.json({
        success: true,
        brand: updated,
      });
    }

    // Duplicate brand
    if (action === "duplicate") {
      const newName = updateData.name || `${brand.name} (Copy)`;
      const duplicated = await duplicateBrand(id, newName, user.id);
      return NextResponse.json({
        success: true,
        brand: duplicated,
      });
    }

    const updated = await updateBrand(id, updateData);

    return NextResponse.json({
      success: true,
      brand: updated,
    });
  } catch (error) {
    console.error("[Brands API] PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update brand" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;
    await deleteBrand(id);

    return NextResponse.json({
      success: true,
      deleted: true,
    });
  } catch (error) {
    console.error("[Brands API] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete brand" },
      { status: 500 }
    );
  }
}
