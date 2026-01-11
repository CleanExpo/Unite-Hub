/**
 * Synthex Persona Generation API
 * GET - Get generation job status
 * POST - Generate new personas with AI
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generatePersonas,
  getGenerationJob,
  applyGeneratedPersonas,
} from "@/lib/synthex/personaService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    const job = await getGenerationJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("[Persona Generate API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get job" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, action, jobId, ...input } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Apply generated personas from a completed job
    if (action === "apply" && jobId) {
      const personas = await applyGeneratedPersonas(jobId, user.id);
      return NextResponse.json({
        success: true,
        personas,
        message: `Created ${personas.length} persona(s)`,
      });
    }

    // Generate new personas
    const job = await generatePersonas(tenantId, input, user.id);

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("[Persona Generate API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate personas" },
      { status: 500 }
    );
  }
}
