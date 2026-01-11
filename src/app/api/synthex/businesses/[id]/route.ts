/**
 * Synthex Business by ID API
 *
 * Phase: D40 - Multi-Business Registry + Brand Graph
 *
 * GET - Get business with details
 * PUT - Update business
 * DELETE - Delete business
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  getBusinessWithDetails,
  updateBusiness,
  deleteBusiness,
  setPrimaryBusiness,
  getBusiness,
} from "@/lib/synthex/businessRegistryService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/businesses/[id]
 * Get business with all details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    const result = await getBusinessWithDetails(id);

    if (!result) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      business: result.business,
      channels: result.channels,
      settings: result.settings,
      relationships: result.relationships,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching business:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/synthex/businesses/[id]
 * Update business
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();

    const business = await updateBusiness(id, {
      external_id: body.external_id,
      legal_name: body.legal_name,
      display_name: body.display_name,
      slug: body.slug,
      industry: body.industry,
      business_type: body.business_type,
      region: body.region,
      country_code: body.country_code,
      timezone: body.timezone,
      currency: body.currency,
      website_url: body.website_url,
      primary_email: body.primary_email,
      primary_phone: body.primary_phone,
      status: body.status,
      logo_url: body.logo_url,
      brand_color: body.brand_color,
      tags: body.tags,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, business });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating business:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/synthex/businesses/[id]
 * Delete business
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;

    await deleteBusiness(id);

    return NextResponse.json({ success: true, message: "Business deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting business:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/businesses/[id]
 * Special actions (set-primary, analyze)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (action === "set-primary") {
      const business = await getBusiness(id);
      if (!business) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }

      const updated = await setPrimaryBusiness(business.tenant_id, id);
      return NextResponse.json({
        success: true,
        business: updated,
        message: "Business set as primary",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error processing action:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
