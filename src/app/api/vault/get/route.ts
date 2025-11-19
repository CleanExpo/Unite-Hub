/**
 * GET /api/vault/get
 * Phase 7: Retrieve Decrypted Credentials
 *
 * Returns decrypted credentials (server-side only).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { CredentialVault } from "@/server/credentialVault";

export async function GET(req: NextRequest) {
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const type = searchParams.get("type");

    // Validate required fields
    if (!clientId || !type) {
      return NextResponse.json(
        { error: "Missing required query parameters: clientId, type" },
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

    // List credentials to find the one matching the type
    const listResult = await CredentialVault.list(client.organization_id);

    if (!listResult.success || !listResult.credentials) {
      return NextResponse.json(
        { error: "Failed to retrieve credentials" },
        { status: 500 }
      );
    }

    // Find credential matching the type
    const credential = listResult.credentials.find((cred) => cred.type === type);

    if (!credential) {
      return NextResponse.json(
        { error: `No credential found for type: ${type}` },
        { status: 404 }
      );
    }

    // Retrieve and decrypt the credential
    const result = await CredentialVault.get(
      client.organization_id,
      credential.id
    );

    if (!result.success || !result.credential) {
      return NextResponse.json(
        { error: result.error || "Failed to decrypt credential" },
        { status: 500 }
      );
    }

    // Log the retrieval
    await supabase.from("client_storage_audit").insert({
      client_id: clientId,
      action: "credential_retrieve",
      metadata: {
        credential_id: credential.id,
        type,
        retrieved_by: userId,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      clientId,
      type: result.credential.type,
      label: result.credential.label,
      payload: result.credential.data,
      message: "Credential retrieved successfully",
    });
  } catch (error) {
    console.error("[API /vault/get] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
