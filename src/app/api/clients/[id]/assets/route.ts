import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/clients/[id]/assets - Get all assets for client
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

    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("type");

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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
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
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}
