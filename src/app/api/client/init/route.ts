/**
 * POST /api/client/init
 * Phase 7: Client Initialization & Storage Provisioning
 *
 * Creates new client profile, provisions Docker folders (7 types),
 * registers subscription tier, assigns default GEO radius.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import ClientDataManager from "@/server/clientDataManager";
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
    const { domain, business_name, tier, geo_radius, owner_email } = body;

    // Validate required fields
    if (!domain || !business_name || !tier || !geo_radius || !owner_email) {
      return NextResponse.json(
        { error: "Missing required fields: domain, business_name, tier, geo_radius, owner_email" },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers = ["Free", "Starter", "Pro", "Enterprise"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: `Invalid tier. Must be one of: ${validTiers.join(", ")}` },
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

    // Check if client already exists
    const { data: existingClient } = await supabase
      .from("seo_client_profiles")
      .select("client_id")
      .eq("domain", domain)
      .single();

    if (existingClient) {
      return NextResponse.json(
        { error: "Client with this domain already exists" },
        { status: 409 }
      );
    }

    // Create client profile
    const { data: newClient, error: clientError } = await supabase
      .from("seo_client_profiles")
      .insert({
        domain,
        business_name,
        subscription_tier: tier,
        geo_radius_km: geo_radius,
        owner_email,
        created_by: userId,
      })
      .select("client_id, domain, business_name, subscription_tier, geo_radius_km")
      .single();

    if (clientError || !newClient) {
      console.error("[API /client/init] Error creating client:", clientError);
      return NextResponse.json(
        { error: "Failed to create client profile" },
        { status: 500 }
      );
    }

    // Provision Docker storage folders
    const provisionResult = await ClientDataManager.provisionClientStorage(
      newClient.client_id
    );

    if (!provisionResult.success) {
      console.error("[API /client/init] Storage provisioning failed:", provisionResult.error);
      return NextResponse.json(
        { error: "Client created but storage provisioning failed" },
        { status: 500 }
      );
    }

    // Get cost multiplier for this radius
    const costMultiplier = GeoTargeting.getCostMultiplier(geo_radius);

    // Return success response
    return NextResponse.json({
      clientId: newClient.client_id,
      domain: newClient.domain,
      businessName: newClient.business_name,
      tier: newClient.subscription_tier,
      geoRadius: newClient.geo_radius_km,
      costMultiplier,
      folderPaths: provisionResult.structure
        ? Object.values(provisionResult.structure.folders)
        : [],
      message: "Client initialized successfully with Docker storage provisioned",
    });
  } catch (error) {
    console.error("[API /client/init] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
