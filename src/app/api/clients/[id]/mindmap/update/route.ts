import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// POST /api/clients/[id]/mindmap/update - Update mind map
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

    const { nodes, edges, action } = body;

    // In production, update mind map in database
    // Actions: add_node, remove_node, update_node, add_edge, remove_edge

    const updatedMindmap = {
      id: crypto.randomUUID(),
      client_id: id,
      version: 2,
      nodes: nodes || [],
      edges: edges || [],
      updated_at: new Date(),
    };

    // Log audit
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (workspace) {
      await db.auditLogs.create({
        org_id: workspace.org_id,
        action: "mindmap_updated",
        resource: "mindmap",
        resource_id: updatedMindmap.id,
        agent: "user",
        status: "success",
        details: { action, client_id: id, user_id: user.userId },
      });
    }

    return NextResponse.json({ mindmap: updatedMindmap });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error updating mind map:", error);
    return NextResponse.json(
      { error: "Failed to update mind map" },
      { status: 500 }
    );
  }
}
