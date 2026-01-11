/**
 * Synthex Businesses API
 *
 * Phase: D40 - Multi-Business Registry + Brand Graph
 *
 * POST - Create business
 * GET - List businesses
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  createBusiness,
  listBusinesses,
  getStats,
  type BRBusinessStatus,
  type BRIndustry,
} from "@/lib/synthex/businessRegistryService";

/**
 * POST /api/synthex/businesses
 * Create a new business
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!body.legal_name) {
      return NextResponse.json({ error: "legal_name is required" }, { status: 400 });
    }

    const business = await createBusiness(tenantId, {
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
      is_primary: body.is_primary,
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
    console.error("Error creating business:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/synthex/businesses?tenantId=xxx
 * List businesses with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Include stats if requested
    if (searchParams.get("includeStats") === "true") {
      const [businesses, stats] = await Promise.all([
        listBusinesses(tenantId, {
          status: searchParams.get("status") as BRBusinessStatus | undefined,
          industry: searchParams.get("industry") as BRIndustry | undefined,
          region: searchParams.get("region") || undefined,
          search: searchParams.get("search") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
        }),
        getStats(tenantId),
      ]);

      return NextResponse.json({ success: true, businesses, stats });
    }

    const businesses = await listBusinesses(tenantId, {
      status: searchParams.get("status") as BRBusinessStatus | undefined,
      industry: searchParams.get("industry") as BRIndustry | undefined,
      region: searchParams.get("region") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
    });

    return NextResponse.json({ success: true, businesses });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching businesses:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
