import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { visualTransformationService } from "@/lib/visual/visual-transformation-service";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const output = visualTransformationService.exportPipelineOutput();

    return NextResponse.json(output);
  } catch (error: any) {
    console.error("Visual transformation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get transformation data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await request.json();
    const { action, assetId } = body;

    if (action === "generate" && assetId) {
      // Generate a single asset
      const manifest = visualTransformationService.getPlaceholderManifest();
      const asset = manifest.assets.find((a) => a.id === assetId);

      if (!asset) {
        return NextResponse.json(
          { error: "Asset not found" },
          { status: 404 }
        );
      }

      const url = await visualTransformationService.generateVisual(asset);

      return NextResponse.json({
        success: true,
        assetId,
        generatedUrl: url,
      });
    }

    if (action === "generate-all") {
      // Generate all pending assets
      const results = await visualTransformationService.generateAllVisuals();

      return NextResponse.json({
        success: true,
        generated: Object.fromEntries(results),
        count: results.size,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'generate' or 'generate-all'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Visual generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate visual" },
      { status: 500 }
    );
  }
}
