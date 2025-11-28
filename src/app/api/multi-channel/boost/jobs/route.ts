import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * Multi-Channel - Boost Jobs (HUMAN_GOVERNED)
 * Manages automated ranking boost jobs that require human approval
 */

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();
    const { searchParams } = req.nextUrl;
    const founder_business_id = searchParams.get("founder_business_id");
    const status = searchParams.get("status");

    if (!founder_business_id) {
      return NextResponse.json(
        { error: "Missing founder_business_id parameter" },
        { status: 400 }
      );
    }

    // Verify user owns this business
    const { data: business, error: businessError } = await supabase
      .from("founder_businesses")
      .select("id")
      .eq("id", founder_business_id)
      .eq("owner_user_id", userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found or access denied" },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from("multi_channel_boost_jobs")
      .select("*")
      .eq("founder_business_id", founder_business_id);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: boostJobs, error: jobsError } = await query.order(
      "created_at",
      { ascending: false }
    );

    if (jobsError) {
      console.error("Boost jobs fetch error:", jobsError);
      return NextResponse.json(
        { error: "Failed to fetch boost jobs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      boost_jobs: boostJobs,
    });
  } catch (error) {
    console.error("Boost jobs fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();
    const body = await req.json();
    const {
      founder_business_id,
      boost_type,
      target_url,
      target_keywords,
      boost_config,
    } = body;

    if (!founder_business_id || !boost_type || !target_url) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: founder_business_id, boost_type, target_url",
        },
        { status: 400 }
      );
    }

    // Verify user owns this business
    const { data: business, error: businessError } = await supabase
      .from("founder_businesses")
      .select("id")
      .eq("id", founder_business_id)
      .eq("owner_user_id", userId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found or access denied" },
        { status: 403 }
      );
    }

    // HUMAN_GOVERNED: Create boost job in pending state
    const { data: boostJob, error: jobError } = await supabase
      .from("multi_channel_boost_jobs")
      .insert({
        founder_business_id,
        boost_type,
        target_url,
        target_keywords: target_keywords || [],
        boost_config: boost_config || {},
        status: "pending_approval",
      })
      .select()
      .single();

    if (jobError) {
      console.error("Boost job creation error:", jobError);
      return NextResponse.json(
        { error: "Failed to create boost job" },
        { status: 500 }
      );
    }

    // Create approval request
    const { data: approval, error: approvalError } = await supabase
      .from("human_governed_approvals")
      .insert({
        founder_business_id,
        approval_type: "boost_job",
        resource_type: "multi_channel_boost_jobs",
        resource_id: boostJob.id,
        proposed_action: {
          action: "execute_boost",
          boost_type,
          target_url,
          target_keywords,
          boost_config,
        },
        ai_rationale: `AI detected opportunity to boost rankings for ${target_url} using ${boost_type} strategy`,
        status: "pending",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (approvalError) {
      console.error("Approval creation error:", approvalError);
      // Rollback boost job
      await supabase
        .from("multi_channel_boost_jobs")
        .delete()
        .eq("id", boostJob.id);
      return NextResponse.json(
        { error: "Failed to create approval request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      boost_job: boostJob,
      approval: approval,
      message:
        "Boost job created and pending approval. It will execute after review.",
      requires_approval: true,
    });
  } catch (error) {
    console.error("Boost job creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();
    const body = await req.json();
    const { boost_job_id, action, rejection_reason } = body;

    if (!boost_job_id || !action) {
      return NextResponse.json(
        { error: "Missing required fields: boost_job_id, action" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Verify user owns this boost job's business
    const { data: boostJob, error: jobError } = await supabase
      .from("multi_channel_boost_jobs")
      .select("founder_business_id, status, founder_businesses!inner(owner_user_id)")
      .eq("id", boost_job_id)
      .single();

    if (
      jobError ||
      !boostJob ||
      (boostJob.founder_businesses as any)?.owner_user_id !== userId
    ) {
      return NextResponse.json(
        { error: "Boost job not found or access denied" },
        { status: 403 }
      );
    }

    if (boostJob.status !== "pending_approval") {
      return NextResponse.json(
        { error: "Boost job is not in pending_approval state" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update boost job status
    const { data: updatedJob, error: updateError } = await supabase
      .from("multi_channel_boost_jobs")
      .update({
        status: newStatus,
        approved_at: action === "approve" ? new Date().toISOString() : null,
        rejected_at: action === "reject" ? new Date().toISOString() : null,
        rejection_reason: rejection_reason || null,
      })
      .eq("id", boost_job_id)
      .select()
      .single();

    if (updateError) {
      console.error("Boost job update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update boost job" },
        { status: 500 }
      );
    }

    // Update related approval
    await supabase
      .from("human_governed_approvals")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejection_reason || null,
      })
      .eq("resource_id", boost_job_id)
      .eq("resource_type", "multi_channel_boost_jobs");

    // TODO: If approved, trigger background job to execute boost

    return NextResponse.json({
      success: true,
      boost_job: updatedJob,
      message: `Boost job ${action}d successfully`,
    });
  } catch (error) {
    console.error("Boost job approval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
