import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// POST /api/clients/[id]/mindmap/export - Export mind map
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

    const { id } = await params;
    const body = await request.json();
    const format = body.format || "png"; // png, svg, pdf, json

    // Validate user authentication
    const user = await validateUserAuth(request);

    // Check if client exists and verify workspace access
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
    if (client.workspace_id !== user.orgId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
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
        details: { format, user_id: user.userId },
      });
    }

    return NextResponse.json({
      export_url: exportUrl,
      format,
      expires_at: new Date(Date.now() + 3600000), // 1 hour
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error exporting mind map:", error);
    return NextResponse.json(
      { error: "Failed to export mind map" },
      { status: 500 }
    );
  }
}
