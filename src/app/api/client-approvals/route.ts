/**
 * Client Approvals API Route
 *
 * Handles client-in-the-loop approval requests with strategy options.
 * Separate from the existing /api/approvals route which handles org-level approvals.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { getApprovalService } from "@/lib/approval/approvalService";
import { StrategyGenerator } from "@/lib/strategy/strategyGenerator";
import type { ApprovalCreateInput } from "@/lib/approval/approvalTypes";

/**
 * GET /api/client-approvals - List client approval requests
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;

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

    const { searchParams } = new URL(req.url);
    const business_id = searchParams.get("business_id");
    const status = searchParams.get("status");
    const source = searchParams.get("source");

    const approvalService = getApprovalService();

    const approvals = await approvalService.list({
      business_id: business_id || undefined,
      status: status as any || undefined,
      source: source || undefined,
    });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error("[API] GET /api/client-approvals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client-approvals - Create a new client approval request
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;

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

    // Validate required fields
    if (!body.business_id || !body.title || !body.description || !body.source) {
      return NextResponse.json(
        { error: "Missing required fields: business_id, title, description, source" },
        { status: 400 }
      );
    }

    // Generate strategy options if context is provided
    let strategy_options = body.strategy_options;
    if (!strategy_options && body.context) {
      strategy_options = StrategyGenerator.generateChoices({
        businessName: body.context.businessName,
        industry: body.context.industry,
        boostBumpEligible: body.context.boostBumpEligible,
        seoFindings: body.context.seoFindings || body.data,
      });
    }

    const approvalService = getApprovalService();

    const input: ApprovalCreateInput = {
      business_id: body.business_id,
      client_id: body.client_id || null,
      created_by: userId,
      title: body.title,
      description: body.description,
      data: body.data || {},
      source: body.source,
      strategy_options,
      preferred_explanation_mode: body.preferred_explanation_mode,
    };

    const approval = await approvalService.create(input);

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/client-approvals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/client-approvals - Update approval status
 */
export async function PATCH(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;

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

    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: "Missing required fields: id, status" },
        { status: 400 }
      );
    }

    const approvalService = getApprovalService();

    const approval = await approvalService.updateStatus(body.id, {
      status: body.status,
      reviewer_notes: body.reviewer_notes,
    });

    return NextResponse.json(approval);
  } catch (error) {
    console.error("[API] PATCH /api/client-approvals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
