/**
 * Synthex Tone Transform API
 * POST - Transform content to match tone profile
 * GET - List transformation history
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  transformContent,
  listTransformations,
  rateTransformation,
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
    const profileId = searchParams.get("profileId");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const transformations = await listTransformations(tenantId, {
      profile_id: profileId || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      transformations,
    });
  } catch (error) {
    console.error("[Tone Transform API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list transformations" },
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
    const { tenantId, profileId, action, ...data } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Rate a transformation
    if (action === "rate") {
      const { transformationId, rating, feedback } = data;
      if (!transformationId || rating === undefined) {
        return NextResponse.json(
          { error: "transformationId and rating are required" },
          { status: 400 }
        );
      }
      await rateTransformation(transformationId, rating, feedback);
      return NextResponse.json({
        success: true,
        message: "Rating saved",
      });
    }

    // Transform content
    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    if (!data.content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const transformation = await transformContent(
      tenantId,
      profileId,
      {
        content: data.content,
        contentType: data.contentType,
        preserveLength: data.preserveLength,
        preserveStructure: data.preserveStructure,
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      transformation,
    });
  } catch (error) {
    console.error("[Tone Transform API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transform content" },
      { status: 500 }
    );
  }
}
