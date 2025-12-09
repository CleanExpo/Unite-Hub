/**
 * Synthex Brand Templates API
 * GET - List templates
 * POST - Create template
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getBrand,
  listTemplates,
  createTemplate,
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
    const templateType = searchParams.get("type");
    const channel = searchParams.get("channel");

    const templates = await listTemplates(brandId, {
      template_type: templateType || undefined,
      channel: channel || undefined,
    });

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("[Brand Templates API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list templates" },
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

    if (!body.name || !body.template_type) {
      return NextResponse.json(
        { error: "name and template_type are required" },
        { status: 400 }
      );
    }

    const template = await createTemplate(brand.tenant_id, brandId, body, user.id);

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("[Brand Templates API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create template" },
      { status: 500 }
    );
  }
}
