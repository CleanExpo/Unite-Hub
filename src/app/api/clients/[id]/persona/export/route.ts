import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// POST /api/clients/[id]/persona/export - Export persona as PDF
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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const format = body.format || "pdf";

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
    if (format !== "pdf" && plan === "starter") {
      return NextResponse.json(
        { error: "Export format not available in starter plan" },
        { status: 403 }
      );
    }

    // In production, generate PDF using a library like puppeteer or pdfkit
    // For now, return a mock download URL
    const exportUrl = `https://storage.example.com/exports/persona-${id}.${format}`;

    // Log audit
    await db.auditLogs.create({
      org_id: workspace.org_id,
      action: "persona_exported",
      resource: "persona",
      resource_id: id,
      agent: "user",
      status: "success",
      details: { format, user_id: user.userId },
    });

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
    console.error("Error exporting persona:", error);
    return NextResponse.json(
      { error: "Failed to export persona" },
      { status: 500 }
    );
  }
}
