/**
 * Synthex Multi-Brand Profiles API
 * GET - List brands or stats
 * POST - Create brand
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listBrands,
  createBrand,
  getDefaultBrand,
  getBrandStats,
} from "@/lib/synthex/multiBrandService";

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
    const includeStats = searchParams.get("includeStats") === "true";
    const defaultOnly = searchParams.get("default") === "true";

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Get default brand only
    if (defaultOnly) {
      const defaultBrand = await getDefaultBrand(tenantId);
      return NextResponse.json({
        success: true,
        brand: defaultBrand,
      });
    }

    const filters = {
      is_active: searchParams.get("is_active") === "true" ? true : undefined,
      is_default: searchParams.get("is_default") === "true" ? true : undefined,
    };

    const brands = await listBrands(tenantId, filters);

    const response: {
      success: boolean;
      brands: typeof brands;
      stats?: Awaited<ReturnType<typeof getBrandStats>>;
    } = {
      success: true,
      brands,
    };

    if (includeStats) {
      response.stats = await getBrandStats(tenantId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Brands API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list brands" },
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
    const { tenantId, ...brandData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!brandData.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const brand = await createBrand(tenantId, brandData, user.id);

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("[Brands API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create brand" },
      { status: 500 }
    );
  }
}
