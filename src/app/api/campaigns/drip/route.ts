import { NextRequest, NextResponse } from "next/server";
import {
  createDripCampaign,
  getCampaignWithSteps,
  enrollContactInCampaign,
  processPendingCampaignSteps,
  getCampaignMetrics,
} from "@/lib/services/drip-campaign";
import { getSupabaseServer } from "@/lib/supabase";
import { db } from "@/lib/db";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { action, ...data } = await req.json();

    // Validate workspaceId if provided in request
    if (data.workspaceId) {
      await validateUserAndWorkspace(req, data.workspaceId);
    }

    switch (action) {
      case "create": {
        if (!data.workspaceId) {
          return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
        }
        const campaign = await createDripCampaign(data.workspaceId, data);
        return NextResponse.json({ success: true, campaign });
      }

      case "get": {
        const campaign = await getCampaignWithSteps(data.campaignId);
        return NextResponse.json({ success: true, campaign });
      }

      case "list": {
        if (!data.workspaceId) {
          return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
        }
        const campaigns = await db.dripCampaigns.listByWorkspace(
          data.workspaceId
        );
        return NextResponse.json({ success: true, campaigns });
      }

      case "add_step": {
        const step = await db.campaignSteps.create(data);
        return NextResponse.json({ success: true, step });
      }

      case "enroll": {
        const enrollment = await enrollContactInCampaign(
          data.campaignId,
          data.contactId
        );
        return NextResponse.json({ success: true, enrollment });
      }

      case "process_pending": {
        const result = await processPendingCampaignSteps();
        return NextResponse.json({ success: true, result });
      }

      case "metrics": {
        const metrics = await getCampaignMetrics(data.campaignId);
        return NextResponse.json({ success: true, metrics });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
