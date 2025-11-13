/**
 * API Route: Get Client Sequences
 * GET /api/clients/[id]/sequences
 *
 * Returns all email sequences for a specific client
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id as Id<"clients">;

    const sequences = await convex.query(api.emailSequences.getSequences, {
      clientId,
    });

    return NextResponse.json({
      sequences,
      total: sequences.length,
    });
  } catch (error) {
    console.error("Error fetching client sequences:", error);
    return NextResponse.json(
      { error: "Failed to fetch sequences" },
      { status: 500 }
    );
  }
}
