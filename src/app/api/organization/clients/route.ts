import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/organization/clients - Get all clients for organization
export async function GET(request: NextRequest) {
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
