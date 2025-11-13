import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/clients/[id]/campaigns/[cid] - Get specific campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, cid } = await params;

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // In production, fetch campaign from database
    const campaign = {
      id: cid,
      client_id: id,
      name: "Campaign Name",
      platform: "facebook",
      status: "active",
    };

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id]/campaigns/[cid] - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, cid } = await params;
    const body = await request.json();

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // In production, update campaign in database
    const updatedCampaign = {
      id: cid,
      client_id: id,
      ...body,
      updated_at: new Date(),
    };

    // Log audit
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (workspace) {
      await db.auditLogs.create({
        org_id: workspace.org_id,
        action: "campaign_updated",
        resource: "campaign",
        resource_id: cid,
        agent: "user",
        status: "success",
        details: { updated_fields: Object.keys(body) },
      });
    }

    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/campaigns/[cid] - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, cid } = await params;

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // In production, delete campaign from database (soft delete)
    // For now, just log the action

    // Log audit
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (workspace) {
      await db.auditLogs.create({
        org_id: workspace.org_id,
        action: "campaign_deleted",
        resource: "campaign",
        resource_id: cid,
        agent: "user",
        status: "success",
        details: { client_id: id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
