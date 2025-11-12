import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/clients/[id]/assets - Get all assets for client
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
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("type");

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // In production, fetch from database
    // For now, return mock data
    const assets = [
      // Mock assets would be fetched from database
    ];

    // Filter by type if provided
    const filteredAssets = assetType
      ? assets.filter((a: any) => a.asset_type === assetType)
      : assets;

    return NextResponse.json({
      assets: filteredAssets,
      total: filteredAssets.length,
    });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}
