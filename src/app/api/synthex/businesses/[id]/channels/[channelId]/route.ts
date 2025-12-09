/**
 * Synthex Business Channel by ID API
 *
 * Phase: D40 - Multi-Business Registry + Brand Graph
 *
 * PUT - Update channel
 * DELETE - Remove channel
 */

import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";
import {
  updateChannel,
  removeChannel,
  type BRChannelType,
} from "@/lib/synthex/businessRegistryService";

type RouteContext = {
  params: Promise<{ id: string; channelId: string }>;
};

/**
 * PUT /api/synthex/businesses/[id]/channels/[channelId]
 * Update a channel
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { channelId } = await context.params;
    const body = await request.json();

    const channel = await updateChannel(channelId, {
      channel_type: body.channel_type as BRChannelType | undefined,
      channel_name: body.channel_name,
      channel_handle: body.channel_handle,
      channel_url: body.channel_url,
      is_primary: body.is_primary,
      is_connected: body.is_connected,
      is_verified: body.is_verified,
      follower_count: body.follower_count,
      engagement_rate: body.engagement_rate,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, channel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating channel:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/synthex/businesses/[id]/channels/[channelId]
 * Remove a channel
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) return rateLimitResult;

    await validateUserAuth(request);

    const { channelId } = await context.params;

    await removeChannel(channelId);

    return NextResponse.json({ success: true, message: "Channel removed" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error removing channel:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
