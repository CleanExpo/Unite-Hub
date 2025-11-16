import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
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

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
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
        details: { action, client_id: id },
      });
    }

    return NextResponse.json({ mindmap: updatedMindmap });
  } catch (error) {
    console.error("Error updating mind map:", error);
    return NextResponse.json(
      { error: "Failed to update mind map" },
      { status: 500 }
    );
  }
}
