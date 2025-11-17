import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/clients/[id] - Get client details
export async function GET(
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

    // Get related data
    const emails = await db.emails.getByContact(id);
    const interactions = await db.interactions.getByContact(id);

    return NextResponse.json({
      client: {
        ...client,
        emails,
        interactions,
      },
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
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate user authentication
    const user = await validateUserAuth(request);

    // Check if client exists and verify workspace access
    const existingClient = await db.contacts.getById(id);
    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
    if (existingClient.workspace_id !== user.orgId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Update client
    const { data: client, error } = await db.contacts.update(id, {
      ...body,
      updated_at: new Date(),
    });

    if (error) {
      throw error;
    }

    // Log audit
    await db.auditLogs.create({
      org_id: existingClient.workspace_id,
      action: "client_updated",
      resource: "client",
      resource_id: id,
      agent: "user",
      status: "success",
      details: { updated_fields: Object.keys(body), user_id: user.userId },
    });

    return NextResponse.json({ client });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate user authentication
    const user = await validateUserAuth(request);

    // Check if client exists and verify workspace access
    const existingClient = await db.contacts.getById(id);
    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
    if (existingClient.workspace_id !== user.orgId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Soft delete - update status to inactive
    await db.contacts.update(id, {
      status: "inactive",
      updated_at: new Date(),
    });

    // Log audit
    await db.auditLogs.create({
      org_id: existingClient.workspace_id,
      action: "client_deleted",
      resource: "client",
      resource_id: id,
      agent: "user",
      status: "success",
      details: { client_name: existingClient.name, user_id: user.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
