import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
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

    // Validate user authentication and workspace access
    const user = await validateUserAndWorkspace(request, workspaceId);

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
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
