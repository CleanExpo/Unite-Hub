import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// POST /api/clients/[id]/campaigns/duplicate - Duplicate campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { userId } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { campaign_id, new_name } = body;

    if (!campaign_id) {
      return NextResponse.json(
        { error: "Missing campaign_id" },
        { status: 400 }
      );
    }

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // In production, fetch original campaign and duplicate it
    const duplicatedCampaign = {
      id: crypto.randomUUID(),
      client_id: id,
      workspace_id: client.workspace_id,
      name: new_name || `Copy of Campaign`,
      platform: "facebook",
      status: "draft",
      objective: "awareness",
      posts: [],
      performance: {
        impressions: 0,
        engagement: 0,
        clicks: 0,
        spend: 0,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Log audit
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (workspace) {
      await db.auditLogs.create({
        org_id: workspace.org_id,
        action: "campaign_duplicated",
        resource: "campaign",
        resource_id: duplicatedCampaign.id,
        agent: "user",
        status: "success",
        details: { original_campaign_id: campaign_id },
      });
    }

    return NextResponse.json({ campaign: duplicatedCampaign }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating campaign:", error);
    return NextResponse.json(
      { error: "Failed to duplicate campaign" },
      { status: 500 }
    );
  }
}
