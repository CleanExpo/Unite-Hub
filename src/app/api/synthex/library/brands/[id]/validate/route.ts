/**
 * Synthex Brand Validation API
 * POST - Validate content against brand guidelines
 * GET - List validation history
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getBrand,
  validateContent,
  listValidations,
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
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const validations = await listValidations(brandId, limit);

    return NextResponse.json({
      success: true,
      validations,
    });
  } catch (error) {
    console.error("[Brand Validation API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list validations" },
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
    const { content, contentType, contentId } = body;

    const brand = await getBrand(brandId);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (!content || !contentType) {
      return NextResponse.json(
        { error: "content and contentType are required" },
        { status: 400 }
      );
    }

    const validation = await validateContent(
      brand.tenant_id,
      brandId,
      content,
      contentType,
      contentId,
      user.id
    );

    return NextResponse.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error("[Brand Validation API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to validate content" },
      { status: 500 }
    );
  }
}
