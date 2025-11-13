import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/organization/clients - Get all clients for organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Missing workspace_id parameter" },
        { status: 400 }
      );
    }

    // Get all clients for workspace
    let clients = await db.contacts.listByWorkspace(workspaceId);

    // Filter by status if provided
    if (status) {
      clients = clients.filter((c: any) => c.status === status);
    }

    // Apply pagination
    const total = clients.length;
    const paginatedClients = clients.slice(offset, offset + limit);

    return NextResponse.json({
      clients: paginatedClients,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
