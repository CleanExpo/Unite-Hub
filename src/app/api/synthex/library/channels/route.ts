/**
 * Synthex Channel Configs API
 * GET - List channel configurations
 * POST - Create/update channel config
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listChannelConfigs,
  upsertChannelConfig,
  getChannelConstraints,
  Channel,
} from "@/lib/synthex/crossChannelService";

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
    const channel = searchParams.get("channel") as Channel | null;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (channel) {
      const constraints = await getChannelConstraints(tenantId, channel);
      return NextResponse.json({
        success: true,
        channel,
        constraints,
      });
    }

    const configs = await listChannelConfigs(tenantId);

    return NextResponse.json({
      success: true,
      configs,
    });
  } catch (error) {
    console.error("[Channels API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get channels" },
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
    const { tenantId, channel, ...config } = body;

    if (!tenantId || !channel) {
      return NextResponse.json(
        { error: "tenantId and channel are required" },
        { status: 400 }
      );
    }

    const channelConfig = await upsertChannelConfig(tenantId, channel, config);

    return NextResponse.json({
      success: true,
      config: channelConfig,
    });
  } catch (error) {
    console.error("[Channels API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save channel config" },
      { status: 500 }
    );
  }
}
