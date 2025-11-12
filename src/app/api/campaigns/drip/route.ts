import { NextRequest, NextResponse } from "next/server";
import {
  createDripCampaign,
  getCampaignWithSteps,
  enrollContactInCampaign,
  processPendingCampaignSteps,
  getCampaignMetrics,
} from "@/lib/services/drip-campaign";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Re-enable authentication once NextAuth is properly configured
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { action, ...data } = await req.json();

    switch (action) {
      case "create": {
        const campaign = await createDripCampaign(data.workspaceId, data);
        return NextResponse.json({ success: true, campaign });
      }

      case "get": {
        const campaign = await getCampaignWithSteps(data.campaignId);
        return NextResponse.json({ success: true, campaign });
      }

      case "list": {
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
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
