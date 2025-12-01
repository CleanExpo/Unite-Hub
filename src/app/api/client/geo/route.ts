/**
 * POST /api/client/geo
 * Phase 7: GEO Radius Update with Cost Recalculation
 *
 * Updates GEO radius, calculates new cost multiplier, enforces tier limits,
 * triggers GEO recalculation if radius increases.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import GeoTargeting from "@/lib/seo/geoTargeting";

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Parse request body
    const body = await req.json();
    const { clientId, geo_radius } = body;

    // Validate required fields
    if (!clientId || !geo_radius) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, geo_radius" },
        { status: 400 }
      );
    }

    // Validate geo_radius
    const validRadii = [3, 5, 10, 15, 20, 25, 50];
    if (!validRadii.includes(geo_radius)) {
      return NextResponse.json(
        { error: `Invalid geo_radius. Must be one of: ${validRadii.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get current client profile
    const { data: client, error: fetchError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, domain, subscription_tier, geo_radius_km, geo_config")
      .eq("client_id", clientId)
      .single();

    if (fetchError || !client) {
      console.error("[API /client/geo] Client not found:", fetchError);
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Check tier limits for radius
    const tierLimits: Record<string, number[]> = {
      Free: [3, 5],
      Starter: [3, 5, 10],
      Pro: [3, 5, 10, 15, 20],
      Enterprise: [3, 5, 10, 15, 20, 25, 50],
    };

    const allowedRadii = tierLimits[client.subscription_tier] || [3, 5];
    if (!allowedRadii.includes(geo_radius)) {
      return NextResponse.json(
        {
          error: `Radius ${geo_radius} km not allowed for ${client.subscription_tier} tier`,
          allowedRadii,
        },
        { status: 403 }
      );
    }

    // Calculate new cost multiplier
    const newCostMultiplier = GeoTargeting.getCostMultiplier(geo_radius);
    const oldCostMultiplier = GeoTargeting.getCostMultiplier(client.geo_radius_km);

    // Determine if radius increased (requires recalculation)
    const radiusIncreased = geo_radius > client.geo_radius_km;

    // Update client profile
    const { error: updateError } = await supabase
      .from("seo_client_profiles")
      .update({
        geo_radius_km: geo_radius,
        updated_at: new Date().toISOString(),
      })
      .eq("client_id", clientId);

    if (updateError) {
      console.error("[API /client/geo] Update failed:", updateError);
      return NextResponse.json(
        { error: "Failed to update GEO radius" },
        { status: 500 }
      );
    }

    // If radius increased, identify affected suburbs
    let affectedSuburbs: string[] = [];
    if (radiusIncreased && client.geo_config) {
      try {
        const geoConfig =
          typeof client.geo_config === "string"
            ? JSON.parse(client.geo_config)
            : client.geo_config;

        if (geoConfig.primary_address) {
          // Get gap suburbs for expansion
          const gapResult = await GeoTargeting.identifyGapSuburbs(clientId);
          if (gapResult.success && gapResult.gaps) {
            affectedSuburbs = gapResult.gaps
              .slice(0, 10)
              .map((gap) => gap.suburb_name);
          }
        }
      } catch (error) {
        console.error("[API /client/geo] Error identifying suburbs:", error);
      }
    }

    // Log the change
    await supabase.from("client_storage_audit").insert({
      client_id: clientId,
      action: "geo_radius_update",
      metadata: {
        old_radius: client.geo_radius_km,
        new_radius: geo_radius,
        old_multiplier: oldCostMultiplier,
        new_multiplier: newCostMultiplier,
        radius_increased: radiusIncreased,
      },
      timestamp: new Date().toISOString(),
    });

    // Return success response
    return NextResponse.json({
      clientId,
      domain: client.domain,
      geoRadius: geo_radius,
      costMultiplier: newCostMultiplier,
      radiusIncreased,
      affectedSuburbs,
      message: radiusIncreased
        ? "GEO radius increased. Recalculation recommended."
        : "GEO radius updated successfully.",
    });
  } catch (error) {
    console.error("[API /client/geo] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
