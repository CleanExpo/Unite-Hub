/**
 * API Route: Generate Email Sequence
 * POST /api/sequences/generate
 *
 * Generates a new email sequence using Claude AI
 */

import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId,
      sequenceType,
      personaId,
      name,
      goal,
      customInstructions,
    } = body;

    // Validate required fields
    if (!clientId || !sequenceType || !name || !goal) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate sequence type
    const validTypes = ["cold_outreach", "lead_nurture", "onboarding", "re_engagement", "custom"];
    if (!validTypes.includes(sequenceType)) {
      return NextResponse.json(
        { error: "Invalid sequence type" },
        { status: 400 }
      );
    }

    // Generate sequence using Convex
    const sequenceId = await convex.mutation(api.emailSequences.generateSequence, {
      clientId: clientId as Id<"clients">,
      sequenceType,
      personaId: personaId as Id<"personas"> | undefined,
      name,
      goal,
      customInstructions,
    });

    return NextResponse.json({
      success: true,
      sequenceId,
      message: "Sequence generated successfully",
    });
  } catch (error) {
    console.error("Error generating sequence:", error);
    return NextResponse.json(
      { error: "Failed to generate sequence" },
      { status: 500 }
    );
  }
}
