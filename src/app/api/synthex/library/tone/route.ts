/**
 * Synthex Tone Profiles API
 * GET - List profiles or stats
 * POST - Create profile
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listProfiles,
  createProfile,
  createFromPreset,
  getToneStats,
} from "@/lib/synthex/toneService";

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

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const filters = {
      status: searchParams.get("status") || undefined,
      is_default: searchParams.get("is_default") === "true" ? true : undefined,
    };

    const profiles = await listProfiles(tenantId, filters);

    const response: {
      success: boolean;
      profiles: typeof profiles;
      stats?: Awaited<ReturnType<typeof getToneStats>>;
    } = {
      success: true,
      profiles,
    };

    if (includeStats) {
      response.stats = await getToneStats(tenantId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Tone API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list profiles" },
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
    const { tenantId, presetId, ...profileData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Create from preset
    if (presetId) {
      const profile = await createFromPreset(
        tenantId,
        presetId,
        profileData.name || "New Profile",
        user.id
      );
      return NextResponse.json({
        success: true,
        profile,
      });
    }

    // Create from scratch
    if (!profileData.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const profile = await createProfile(tenantId, profileData, user.id);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("[Tone API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create profile" },
      { status: 500 }
    );
  }
}
