/**
 * Synthex Business Channels API
 *
 * Phase: D40 - Multi-Business Registry + Brand Graph
 *
 * GET - List channels for business
 * POST - Add channel to business
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  listChannels,
  addChannel,
  getBusiness,
  aiSuggestChannels,
  type BRChannelType,
  type BRIndustry,
} from "@/lib/synthex/businessRegistryService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/synthex/businesses/[id]/channels
 * List channels for a business
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id: businessId } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeSuggestions = searchParams.get("includeSuggestions") === "true";

    // Get business to verify it exists and get tenant_id/industry
    const business = await getBusiness(businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const channels = await listChannels(businessId);

    // Include AI suggestions if requested
    if (includeSuggestions) {
      const suggestions = await aiSuggestChannels(
        business.industry as BRIndustry,
        channels
      );
      return NextResponse.json({
        success: true,
        channels,
        suggestions: suggestions.recommended_channels,
      });
    }

    return NextResponse.json({ success: true, channels });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching channels:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/synthex/businesses/[id]/channels
 * Add a channel to a business
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { id: businessId } = await context.params;
    const body = await request.json();

    // Get business to verify it exists and get tenant_id
    const business = await getBusiness(businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!body.channel_type) {
      return NextResponse.json(
        { error: "channel_type is required" },
        { status: 400 }
      );
    }

    const channel = await addChannel(business.tenant_id, businessId, {
      channel_type: body.channel_type as BRChannelType,
      channel_name: body.channel_name,
      channel_handle: body.channel_handle,
      channel_url: body.channel_url,
      is_primary: body.is_primary,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, channel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error adding channel:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
