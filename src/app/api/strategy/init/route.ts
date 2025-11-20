/**
 * Strategy Init API - Phase 11 Week 1-2
 *
 * Initialize strategy graph and generate proposals from audit signals.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { StrategyPlannerService, AuditSignal, OperatorFeedback } from "@/lib/strategy/strategyPlannerService";

const signalSchema = z.object({
  type: z.enum(["SEO", "GEO", "CONTENT", "TECHNICAL", "BACKLINK", "LOCAL"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  metric: z.string(),
  currentValue: z.number(),
  targetValue: z.number(),
  description: z.string(),
  domain: z.string(),
});

const feedbackSchema = z.object({
  feedbackType: z.enum(["APPROVAL", "REJECTION", "MODIFICATION", "ESCALATION"]),
  context: z.string(),
  suggestedAction: z.string().optional(),
  priority: z.number().optional(),
});

const initRequestSchema = z.object({
  action: z.enum(["generate_proposal", "materialize_proposal", "get_proposals"]),
  organization_id: z.string().uuid().optional(),
  signals: z.array(signalSchema).optional(),
  feedback: z.array(feedbackSchema).optional(),
  proposal_id: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "ACTIVE"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    if (token) {
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

    const body = await req.json();
    const parsed = initRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { action, organization_id, signals, feedback, proposal_id, status } = parsed.data;

    // Get organization from user if not provided
    let orgId = organization_id;
    if (!orgId) {
      const supabase = await getSupabaseServer();
      const { data: userOrg } = await supabase
        .from("user_organizations")
        .select("org_id")
        .eq("user_id", userId)
        .single();

      if (!userOrg) {
        return NextResponse.json({ error: "No organization found" }, { status: 400 });
      }
      orgId = userOrg.org_id;
    }

    const planner = new StrategyPlannerService();

    switch (action) {
      case "generate_proposal": {
        if (!signals || signals.length === 0) {
          return NextResponse.json(
            { error: "Signals required for proposal generation" },
            { status: 400 }
          );
        }

        const proposal = await planner.generateProposalFromSignals(
          orgId,
          signals as AuditSignal[],
          feedback as OperatorFeedback[]
        );

        return NextResponse.json({ success: true, proposal });
      }

      case "materialize_proposal": {
        if (!proposal_id) {
          return NextResponse.json(
            { error: "proposal_id required" },
            { status: 400 }
          );
        }

        const proposals = await planner.getProposals(orgId);
        const proposal = proposals.find((p) => p.id === proposal_id);

        if (!proposal) {
          return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
        }

        const result = await planner.materializeProposal(proposal);

        // Update status to ACTIVE
        await planner.updateProposalStatus(proposal_id, "ACTIVE");

        return NextResponse.json({ success: true, ...result });
      }

      case "get_proposals": {
        const proposals = await planner.getProposals(orgId, status);
        return NextResponse.json({ success: true, proposals });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Strategy init error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    if (token) {
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

    const searchParams = req.nextUrl.searchParams;
    const organizationId = searchParams.get("organization_id");
    const status = searchParams.get("status") as "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | null;

    // Get organization
    let orgId = organizationId;
    if (!orgId) {
      const supabase = await getSupabaseServer();
      const { data: userOrg } = await supabase
        .from("user_organizations")
        .select("org_id")
        .eq("user_id", userId)
        .single();

      if (!userOrg) {
        return NextResponse.json({ error: "No organization found" }, { status: 400 });
      }
      orgId = userOrg.org_id;
    }

    const planner = new StrategyPlannerService();
    const proposals = await planner.getProposals(orgId, status || undefined);

    return NextResponse.json({ success: true, proposals });
  } catch (error) {
    console.error("Strategy init GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}
