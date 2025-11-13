/**
 * API Route: Sequence Operations
 * GET /api/sequences/[id] - Get sequence details
 * PUT /api/sequences/[id] - Update sequence
 * DELETE /api/sequences/[id] - Delete sequence
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sequenceId = id as Id<"emailSequences">;

    const data = await convex.query(api.emailSequences.getSequenceWithSteps, {
      sequenceId,
    });

    if (!data) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching sequence:", error);
    return NextResponse.json(
      { error: "Failed to fetch sequence" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sequenceId = id as Id<"emailSequences">;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Missing status field" },
        { status: 400 }
      );
    }

    await convex.mutation(api.emailSequences.updateSequenceStatus, {
      sequenceId,
      status,
    });

    return NextResponse.json({
      success: true,
      message: "Sequence updated successfully",
    });
  } catch (error) {
    console.error("Error updating sequence:", error);
    return NextResponse.json(
      { error: "Failed to update sequence" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sequenceId = id as Id<"emailSequences">;

    await convex.mutation(api.emailSequences.deleteSequence, {
      sequenceId,
    });

    return NextResponse.json({
      success: true,
      message: "Sequence deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sequence:", error);
    return NextResponse.json(
      { error: "Failed to delete sequence" },
      { status: 500 }
    );
  }
}
