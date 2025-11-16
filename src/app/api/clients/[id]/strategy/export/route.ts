import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// POST /api/clients/[id]/strategy/export - Export strategy document
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
    const format = body.format || "pdf"; // pdf, docx, json

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Get organization to check tier
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const organization = await db.organizations.getById(workspace.org_id);
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check tier limits for export formats
    const plan = organization.plan || "starter";
    if ((format === "docx" || format === "json") && plan === "starter") {
      return NextResponse.json(
        {
          error:
            "DOCX and JSON export formats are only available in Professional plan",
        },
        { status: 403 }
      );
    }

    // In production, generate export file
    // For now, return a mock download URL
    const exportUrl = `https://storage.example.com/exports/strategy-${id}.${format}`;

    // Log audit
    await db.auditLogs.create({
      org_id: workspace.org_id,
      action: "strategy_exported",
      resource: "strategy",
      resource_id: id,
      agent: "user",
      status: "success",
      details: { format },
    });

    return NextResponse.json({
      export_url: exportUrl,
      format,
      expires_at: new Date(Date.now() + 3600000), // 1 hour
    });
  } catch (error) {
    console.error("Error exporting strategy:", error);
    return NextResponse.json(
      { error: "Failed to export strategy" },
      { status: 500 }
    );
  }
}
