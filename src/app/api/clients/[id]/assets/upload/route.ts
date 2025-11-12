import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/clients/[id]/assets/upload - Upload asset
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

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Get organization to check tier limits
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

    // Check tier limits
    const plan = organization.plan || "starter";
    // In production, you'd check actual asset count here

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const assetType = formData.get("type") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "video/mp4",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Check file size (10MB for starter, unlimited for professional)
    const maxSize = plan === "starter" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
        },
        { status: 400 }
      );
    }

    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll create a mock asset record
    const asset = {
      id: crypto.randomUUID(),
      client_id: id,
      workspace_id: client.workspace_id,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      asset_type: assetType || "other",
      description: description || "",
      url: `https://storage.example.com/${id}/${file.name}`, // Mock URL
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Log audit
    await db.auditLogs.create({
      org_id: workspace.org_id,
      action: "asset_uploaded",
      resource: "asset",
      resource_id: asset.id,
      agent: "user",
      status: "success",
      details: {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("Error uploading asset:", error);
    return NextResponse.json(
      { error: "Failed to upload asset" },
      { status: 500 }
    );
  }
}
