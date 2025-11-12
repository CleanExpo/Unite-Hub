import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/clients/[id]/mindmap/export - Export mind map
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const format = body.format || "png"; // png, svg, pdf, json

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // In production, generate export file
    // For now, return a mock download URL
    const exportUrl = `https://storage.example.com/exports/mindmap-${id}.${format}`;

    // Log audit
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (workspace) {
      await db.auditLogs.create({
        org_id: workspace.org_id,
        action: "mindmap_exported",
        resource: "mindmap",
        resource_id: id,
        agent: "user",
        status: "success",
        details: { format },
      });
    }

    return NextResponse.json({
      export_url: exportUrl,
      format,
      expires_at: new Date(Date.now() + 3600000), // 1 hour
    });
  } catch (error) {
    console.error("Error exporting mind map:", error);
    return NextResponse.json(
      { error: "Failed to export mind map" },
      { status: 500 }
    );
  }
}
