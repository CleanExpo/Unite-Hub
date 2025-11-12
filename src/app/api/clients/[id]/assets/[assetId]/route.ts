import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT /api/clients/[id]/assets/[assetId] - Update asset metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, assetId } = await params;
    const body = await request.json();

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // In production, update asset in database
    const updatedAsset = {
      id: assetId,
      ...body,
      updated_at: new Date(),
    };

    // Log audit
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (workspace) {
      await db.auditLogs.create({
        org_id: workspace.org_id,
        action: "asset_updated",
        resource: "asset",
        resource_id: assetId,
        agent: "user",
        status: "success",
        details: { updated_fields: Object.keys(body) },
      });
    }

    return NextResponse.json({ asset: updatedAsset });
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/assets/[assetId] - Delete asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, assetId } = await params;

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // In production, delete from cloud storage and database
    // For now, just log the action

    // Log audit
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (workspace) {
      await db.auditLogs.create({
        org_id: workspace.org_id,
        action: "asset_deleted",
        resource: "asset",
        resource_id: assetId,
        agent: "user",
        status: "success",
        details: { client_id: id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}
