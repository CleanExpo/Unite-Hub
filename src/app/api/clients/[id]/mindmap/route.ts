import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/clients/[id]/mindmap - Get mind map for client
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

    // In production, fetch mind map from database
    // Mind map structure with nodes and relationships
    const mindmap = {
      id: crypto.randomUUID(),
      client_id: id,
      version: 1,
      root_node: {
        id: "root",
        label: client.company || client.name,
        type: "business",
        color: "#4A90E2",
      },
      nodes: [
        {
          id: "products",
          label: "Products/Services",
          type: "category",
          color: "#5AC8FA",
          parent_id: "root",
          children: [],
        },
        {
          id: "audience",
          label: "Target Audience",
          type: "category",
          color: "#4CD964",
          parent_id: "root",
          children: [],
        },
        {
          id: "challenges",
          label: "Challenges",
          type: "category",
          color: "#FFCC00",
          parent_id: "root",
          children: [],
        },
        {
          id: "opportunities",
          label: "Opportunities",
          type: "category",
          color: "#FF9500",
          parent_id: "root",
          children: [],
        },
      ],
      edges: [
        { from: "root", to: "products" },
        { from: "root", to: "audience" },
        { from: "root", to: "challenges" },
        { from: "root", to: "opportunities" },
      ],
      created_at: new Date(),
      updated_at: new Date(),
    };

    return NextResponse.json({ mindmap });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching mind map:", error);
    return NextResponse.json(
      { error: "Failed to fetch mind map" },
      { status: 500 }
    );
  }
}
