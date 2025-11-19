/**
 * POST /api/vault/save
 * Phase 7: Save Encrypted Credentials
 *
 * Saves encrypted credentials using AES-256-GCM into credentialVault.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { CredentialVault, type CredentialType } from "@/server/credentialVault";

const VALID_TYPES: CredentialType[] = [
  "website_login",
  "social_media_api",
  "gsc_oauth",
  "bing_api",
  "brave_api",
  "dataforseo_api",
  "custom",
];

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
    const { clientId, type, payload, label } = body;

    // Validate required fields
    if (!clientId || !type || !payload) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, type, payload" },
        { status: 400 }
      );
    }

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get client profile to get organization_id
    const { data: client, error: fetchError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, organization_id, domain")
      .eq("client_id", clientId)
      .single();

    if (fetchError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!client.organization_id) {
      return NextResponse.json(
        { error: "Client has no associated organization" },
        { status: 400 }
      );
    }

    // Generate label if not provided
    const credentialLabel =
      label || `${type} for ${client.domain} (${new Date().toLocaleDateString()})`;

    // Save credential to vault
    const result = await CredentialVault.set(
      client.organization_id,
      type as CredentialType,
      credentialLabel,
      payload
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to save credential" },
        { status: 500 }
      );
    }

    // Log the save operation
    await supabase.from("client_storage_audit").insert({
      client_id: clientId,
      action: "credential_save",
      metadata: {
        credential_id: result.credentialId,
        type,
        label: credentialLabel,
        saved_by: userId,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      status: "saved",
      credentialId: result.credentialId,
      clientId,
      type,
      label: credentialLabel,
      message: "Credential saved successfully",
    });
  } catch (error) {
    console.error("[API /vault/save] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
