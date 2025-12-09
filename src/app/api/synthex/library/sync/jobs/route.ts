/**
 * Synthex Sync Jobs API
 * GET - Get job status
 * POST - Create and execute sync job
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createSyncJob,
  getSyncJob,
  executeSyncJob,
} from "@/lib/synthex/crossChannelService";

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

    const job = await getSyncJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("[Sync Jobs API] GET error:", error);
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
    const { tenantId, action, jobId, ...config } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Execute existing job
    if (action === "execute" && jobId) {
      const job = await executeSyncJob(jobId);
      return NextResponse.json({
        success: true,
        job,
      });
    }

    // Create new job
    if (!config.target_channels || config.target_channels.length === 0) {
      return NextResponse.json(
        { error: "target_channels is required" },
        { status: 400 }
      );
    }

    const job = await createSyncJob(tenantId, config, user.id);

    // Optionally execute immediately
    if (body.executeImmediately) {
      const executedJob = await executeSyncJob(job.id);
      return NextResponse.json({
        success: true,
        job: executedJob,
      });
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("[Sync Jobs API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create job" },
      { status: 500 }
    );
  }
}
