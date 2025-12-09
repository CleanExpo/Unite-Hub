/**
 * Synthex Brand Guidelines API
 * GET - List guidelines
 * POST - Create guideline
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getBrand,
  listGuidelines,
  createGuideline,
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
    const category = searchParams.get("category");

    const guidelines = await listGuidelines(brandId, category || undefined);

    return NextResponse.json({
      success: true,
      guidelines,
    });
  } catch (error) {
    console.error("[Brand Guidelines API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list guidelines" },
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

    if (!body.title || !body.category) {
      return NextResponse.json(
        { error: "title and category are required" },
        { status: 400 }
      );
    }

    const guideline = await createGuideline(brand.tenant_id, brandId, body, user.id);

    return NextResponse.json({
      success: true,
      guideline,
    });
  } catch (error) {
    console.error("[Brand Guidelines API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create guideline" },
      { status: 500 }
    );
  }
}
