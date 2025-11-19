/**
 * Signature Init API - Phase 9 Week 5-6
 *
 * POST /api/trust/signature/init
 * Initialize a signature request for Trusted Mode approval.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { SignatureService } from "@/lib/trust/signatureProvider";
import { z } from "zod";

const InitSignatureRequestSchema = z.object({
  client_id: z.string().uuid(),
  signer_name: z.string().min(1),
  signer_email: z.string().email(),
  provider: z.enum(["docusign", "hellosign", "manual"]).optional(),
  redirect_url: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate
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

    // Parse and validate request
    const body = await req.json();
    const parsed = InitSignatureRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { client_id, signer_name, signer_email, provider, redirect_url } =
      parsed.data;

    // Get client and verify access
    const supabase = await getSupabaseServer();
    const { data: client, error: clientError } = await supabase
      .from("seo_client_profiles")
      .select("client_id, org_id")
      .eq("client_id", client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check user is org admin
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", userId)
      .eq("org_id", client.org_id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get trusted mode request
    const { data: trustRequest, error: trustError } = await supabase
      .from("trusted_mode_requests")
      .select("id, status")
      .eq("client_id", client_id)
      .single();

    if (trustError || !trustRequest) {
      return NextResponse.json(
        {
          error: "Trusted Mode not initialized",
          message: "Initialize Trusted Mode before requesting signature",
        },
        { status: 400 }
      );
    }

    if (trustRequest.status !== "PENDING_SIGNATURE") {
      return NextResponse.json(
        {
          error: "Invalid status",
          message: `Cannot request signature in status: ${trustRequest.status}`,
        },
        { status: 400 }
      );
    }

    // Create signature request
    const signatureService = new SignatureService();
    const signatureRequest = await signatureService.createSignatureRequest({
      client_id,
      organization_id: client.org_id,
      trust_request_id: trustRequest.id,
      signer_name,
      signer_email,
      provider,
      redirect_url,
      created_by: userId,
    });

    return NextResponse.json({
      signature_request: signatureRequest,
      message: "Signature request sent",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Signature init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
