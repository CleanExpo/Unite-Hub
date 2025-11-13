import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/clients/[id]/mindmap - Get mind map for client
export async function GET(
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
    console.error("Error fetching mind map:", error);
    return NextResponse.json(
      { error: "Failed to fetch mind map" },
      { status: 500 }
    );
  }
}
