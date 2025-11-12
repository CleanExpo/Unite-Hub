import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/clients/[id]/persona/export - Export persona as PDF
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
    const format = body.format || "pdf";

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
      details: { format },
    });

    return NextResponse.json({
      export_url: exportUrl,
      format,
      expires_at: new Date(Date.now() + 3600000), // 1 hour
    });
  } catch (error) {
    console.error("Error exporting persona:", error);
    return NextResponse.json(
      { error: "Failed to export persona" },
      { status: 500 }
    );
  }
}
