/**
 * Autonomy Propose API - Phase 9 Week 7-8
 *
 * POST /api/autonomy/propose
 * Create a new autonomy proposal for automated execution.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { proposalEngine } from "@/lib/autonomy/proposalEngine";
import { z } from "zod";

const CreateProposalSchema = z.object({
  client_id: z.string().uuid(),
  domain: z.enum(["SEO", "CONTENT", "ADS", "CRO"]),
  change_type: z.string().min(1),
  proposed_diff: z.record(z.any()),
  rationale: z.string().min(1),
  source: z.enum(["MANUAL", "DELTA_REPORT", "STRATEGY_TRIGGER", "SCHEDULED"]).optional(),
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
    const parsed = CreateProposalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { client_id, domain, change_type, proposed_diff, rationale, source } =
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

    // Check user has access to org
    const { data: membership } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", userId)
      .eq("org_id", client.org_id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create proposal
    // Map route fields to interface fields
    const triggerMap: Record<string, string> = {
      MANUAL: "MANUAL_TRIGGER",
      DELTA_REPORT: "DELTA_REPORT",
      STRATEGY_TRIGGER: "STRATEGY_TRIGGER",
      SCHEDULED: "SCHEDULED_TRIGGER",
    };

    const proposal = await proposalEngine.createProposal({
      client_id,
      organization_id: client.org_id,
      domain_scope: domain as any,  // Map domain to domain_scope
      trigger: (triggerMap[source || "MANUAL"] || "MANUAL_TRIGGER") as any,
      change_type,
      title: `${change_type} change for ${domain}`,
      description: rationale,
      proposed_diff,
      created_by: userId,
    });

    return NextResponse.json({
      proposal,
      message: proposal.status === "APPROVED"
        ? "Proposal auto-approved for execution"
        : "Proposal created and pending approval",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Propose error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/autonomy/propose
 * List proposals for a client.
 */
export async function GET(req: NextRequest) {
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

    // Get query params
    const clientId = req.nextUrl.searchParams.get("client_id");
    const status = req.nextUrl.searchParams.get("status");
    const domain = req.nextUrl.searchParams.get("domain");

    if (!clientId) {
      return NextResponse.json(
        { error: "client_id is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Build query
    let query = supabase
      .from("autonomy_proposals")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (domain) {
      query = query.eq("domain", domain);
    }

    const { data: proposals, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      proposals,
      count: proposals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("List proposals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
